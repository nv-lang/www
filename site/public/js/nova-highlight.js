/**
 * Nova language syntax highlighter.
 * Colors match VS Code "Dark Modern" theme via the Nova tmLanguage scopes.
 * Processes <code class="language-nova"> blocks automatically.
 * No external dependencies.
 */
(function () {
  'use strict';

  // keyword.control.flow.nova  → tok-kw-ctrl  (#c586c0 purple)
  const CTRL_KEYWORDS = new Set([
    'if','else','match','for','while','loop','break','continue','return',
    'throw','spawn','detach','parallel','supervised','blocking','select',
    'in','forbid','realtime','with','interrupt',
    'defer','errdefer','okdefer','requires','ensures','invariant',
  ]);

  // keyword.declaration.nova + storage.modifier.nova  → tok-kw-decl  (#569cd6 blue)
  // Source-of-truth for keywords: compiler-codegen/src/lexer/mod.rs.
  // Removed (retracted/now plain idents): let, readonly, handler.
  const DECL_KEYWORDS = new Set([
    'fn','type','alias','effect','protocol','const',
    'module','import','export','as','use','test','external','lemma',
    'mut','consume','ro','priv','pub','unsafe','is','old',
  ]);

  // support.type.primitive.nova  → tok-type  (#4ec9b0 teal)
  const PRIMITIVES = new Set([
    'int','i8','i16','i32','i64','u8','u16','u32','u64','f32','f64',
    'str','bool','char','byte','any',
  ]);

  // entity.name.type.prelude.nova + constant.language  → tok-type  (#4ec9b0 teal)
  const BUILTINS = new Set([
    'Some','None','Ok','Err','true','false','Self',
    'Option','Result','Error','RuntimeError','Never','Ordering',
    'Less','Equal','Greater','Iter','Range','RangeIter','Channel',
    'CancelToken','Handler','From','Into','TryFrom','TryInto',
    'Hashable','Eq','Ord','StringBuilder','WriteBuffer','ReadBuffer',
    'ReadBufferError',
  ]);

  // ── Tokenizer ────────────────────────────────────────────────────────────

  function tokenize(code) {
    const tokens = [];
    let i = 0;

    while (i < code.length) {

      // Line comment
      if (code[i] === '/' && code[i + 1] === '/') {
        let j = i;
        while (j < code.length && code[j] !== '\n') j++;
        tokens.push({ type: 'comment', text: code.slice(i, j) });
        i = j;
        continue;
      }

      // String literal (with ${...} interpolation markers)
      if (code[i] === '"') {
        let j = i + 1;
        while (j < code.length) {
          if (code[j] === '\\') { j += 2; continue; }
          if (code[j] === '"') { j++; break; }
          j++;
        }
        tokens.push(...tokenizeString(code.slice(i, j)));
        i = j;
        continue;
      }

      // Number (integer or float, optional _ separators)
      if (/\d/.test(code[i])) {
        let j = i;
        while (j < code.length && /[\d._xXa-fA-F]/.test(code[j])) j++;
        tokens.push({ type: 'number', text: code.slice(i, j) });
        i = j;
        continue;
      }

      // Identifier / keyword / builtin / type
      if (/[a-zA-Z_@]/.test(code[i])) {
        let j = i;
        if (code[j] === '@') j++;   // @ prefix for operator methods / self-fields
        while (j < code.length && /\w/.test(code[j])) j++;
        const word = code.slice(i, j);
        let type;
        if (CTRL_KEYWORDS.has(word))        type = 'kw-ctrl';
        else if (DECL_KEYWORDS.has(word))   type = 'kw-decl';
        else if (PRIMITIVES.has(word))      type = 'primitive';
        else if (BUILTINS.has(word))        type = 'builtin';
        else if (/^[A-Z]/.test(word))       type = 'type';
        else                                 type = 'ident';
        tokens.push({ type, text: word });
        i = j;
        continue;
      }

      // Multi-char operators (longest first)
      const ops3 = ['==>'];
      const ops2 = ['->', '=>', '==', '!=', '<=', '>=', '&&', '||', '..'];
      let matched = false;
      for (const op of ops3) {
        if (code.slice(i, i + op.length) === op) {
          tokens.push({ type: 'op', text: op }); i += op.length; matched = true; break;
        }
      }
      if (!matched) {
        for (const op of ops2) {
          if (code.slice(i, i + op.length) === op) {
            tokens.push({ type: 'op', text: op }); i += op.length; matched = true; break;
          }
        }
      }
      if (matched) continue;

      // Single-char punctuation / operator
      if ('[](){},.:;=<>+*/%&|^~!?'.includes(code[i])) {
        tokens.push({ type: 'punct', text: code[i] });
        i++; continue;
      }

      // Whitespace / other
      tokens.push({ type: 'text', text: code[i] });
      i++;
    }

    return tokens;
  }

  // Splits a raw string token on ${...} so inner expressions get
  // normal colouring while string delimiters stay orange.
  function tokenizeString(raw) {
    const result = [];
    let i = 0;
    let chunk = '';

    const flush = () => { if (chunk) { result.push({ type: 'string', text: chunk }); chunk = ''; } };

    while (i < raw.length) {
      if (raw[i] === '$' && raw[i + 1] === '{') {
        chunk += raw[i]; // include the $
        flush();
        let depth = 0, j = i + 1;
        while (j < raw.length) {
          if (raw[j] === '{') depth++;
          else if (raw[j] === '}') { if (--depth === 0) { j++; break; } }
          j++;
        }
        result.push({ type: 'interp', text: raw.slice(i + 1, j) }); // "{...}"
        i = j;
        continue;
      }
      chunk += raw[i]; i++;
    }
    flush();
    return result;
  }

  // ── Effect detection pass ─────────────────────────────────────────────────
  // Marks uppercase `type` tokens as `effect` when they appear in the
  // effect position: fn name(...) EFFECT1 EFFECT2 -> Ret

  function markEffects(tokens) {
    let state = 'normal';
    let depth = 0;

    for (let i = 0; i < tokens.length; i++) {
      const tok = tokens[i];
      if (tok.type === 'text') continue;

      switch (state) {
        case 'normal':
          if (tok.type === 'kw-decl' && tok.text === 'fn') state = 'fn_name';
          break;
        case 'fn_name':
          if (tok.type === 'punct' && tok.text === '(') { state = 'fn_params'; depth = 1; }
          break;
        case 'fn_params':
          if (tok.type === 'punct' && tok.text === '(') depth++;
          else if (tok.type === 'punct' && tok.text === ')') {
            depth--;
            if (depth === 0) state = 'fn_effects';
          }
          break;
        case 'fn_effects':
          if (tok.type === 'op' && tok.text === '->') { state = 'normal'; }
          else if (tok.type === 'punct' && (tok.text === '{' || tok.text === '=')) { state = 'normal'; }
          else if (tok.type === 'kw-ctrl' && (tok.text === 'requires' || tok.text === 'ensures')) { state = 'normal'; }
          else if (tok.type === 'type') { tok.type = 'effect'; }
          break;
      }
    }
  }

  // Marks lowercase identifiers immediately followed by '(' as function names.
  function markFunctions(tokens) {
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].type !== 'ident') continue;
      let j = i + 1;
      while (j < tokens.length && tokens[j].type === 'text') j++;
      if (j < tokens.length && tokens[j].type === 'punct' && tokens[j].text === '(') {
        tokens[i].type = 'fn-name';
      }
    }
  }

  // ── Renderer ─────────────────────────────────────────────────────────────

  const CLASS = {
    'comment':   'tok-comment',
    'string':    'tok-str',
    'interp':    'tok-str',
    'kw-ctrl':   'tok-kw-ctrl',
    'kw-decl':   'tok-kw-decl',
    'primitive': 'tok-type',
    'builtin':   'tok-type',
    'number':    'tok-num',
    'type':      'tok-type',
    'effect':    'tok-type',
    'fn-name':   'tok-fn',
    'ident':     'tok-ident',
    'op':        'tok-op',
    'punct':     null,
    'text':      null,
  };

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function render(tokens) {
    return tokens.map(tok => {
      const cls = CLASS[tok.type];
      const t = esc(tok.text);
      return cls ? `<span class="${cls}">${t}</span>` : t;
    }).join('');
  }

  // ── Public API ────────────────────────────────────────────────────────────

  function highlight(code) {
    const tokens = tokenize(code);
    markEffects(tokens);
    markFunctions(tokens);
    return render(tokens);
  }

  function highlightAll() {
    document.querySelectorAll('code.language-nova').forEach(el => {
      el.innerHTML = highlight(el.textContent);
      if (el.parentElement && el.parentElement.tagName === 'PRE') {
        el.parentElement.classList.add('nova-block');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', highlightAll);
  } else {
    highlightAll();
  }
})();

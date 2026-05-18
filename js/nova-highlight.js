/**
 * Nova language syntax highlighter.
 * Processes <code class="language-nova"> blocks automatically.
 * No external dependencies.
 */
(function () {
  'use strict';

  const KEYWORDS = new Set([
    'fn','let','mut','type','if','else','match','for','while','return',
    'spawn','supervised','parallel','in','requires','ensures','module',
    'import','export','test','contract','alias','protocol','defer',
    'realtime','nogc','as','use','pub','and','or','not','is',
  ]);

  const BUILTINS = new Set([
    'Some','None','Ok','Err','true','false','Self',
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
        const raw = code.slice(i, j);
        // Split on ${...} so we can colour the interpolated parts too
        tokens.push(...tokenizeString(raw));
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

      // Identifier / keyword / builtin / type / effect (determined later)
      if (/[a-zA-Z_@]/.test(code[i])) {
        let j = i;
        // @ prefix for operator methods
        if (code[j] === '@') j++;
        while (j < code.length && /\w/.test(code[j])) j++;
        const word = code.slice(i, j);
        let type;
        if (KEYWORDS.has(word))        type = 'keyword';
        else if (BUILTINS.has(word))   type = 'builtin';
        else if (/^[A-Z]/.test(word))  type = 'type';  // may become 'effect'
        else                            type = 'ident';
        tokens.push({ type, text: word });
        i = j;
        continue;
      }

      // Multi-char operators (order matters — longest first)
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

      // Whitespace / other (newlines, spaces — pass through)
      tokens.push({ type: 'text', text: code[i] });
      i++;
    }

    return tokens;
  }

  // Splits a raw string token on ${...} boundaries so inner expressions get
  // the normal identifier/number colouring while the string delimiters stay red.
  function tokenizeString(raw) {
    // raw starts and ends with "
    const result = [];
    let i = 0;
    let chunk = '';

    const flush = () => { if (chunk) { result.push({ type: 'string', text: chunk }); chunk = ''; } };

    while (i < raw.length) {
      if (raw[i] === '$' && raw[i + 1] === '{') {
        chunk += raw[i]; // include the $
        flush();
        // find matching }
        let depth = 0, j = i + 1;
        while (j < raw.length) {
          if (raw[j] === '{') depth++;
          else if (raw[j] === '}') { if (--depth === 0) { j++; break; } }
          j++;
        }
        const inner = raw.slice(i + 1, j); // "{...}"
        result.push({ type: 'interp', text: inner });
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
  // effect position of a function signature: fn name(...) EFFECT1 EFFECT2 -> Ret

  function markEffects(tokens) {
    // 'normal' → 'fn_name' → 'fn_params' → 'fn_effects' → 'normal'
    let state = 'normal';
    let depth = 0;

    for (let i = 0; i < tokens.length; i++) {
      const tok = tokens[i];
      if (tok.type === 'text') continue; // skip whitespace

      switch (state) {
        case 'normal':
          if (tok.type === 'keyword' && tok.text === 'fn') state = 'fn_name';
          break;
        case 'fn_name':
          if (tok.type === 'punct' && tok.text === '(') { state = 'fn_params'; depth = 1; }
          // Allow 'fn TypeName method(...)' — method receiver
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
          else if (tok.type === 'keyword' && (tok.text === 'requires' || tok.text === 'ensures')) { state = 'normal'; }
          else if (tok.type === 'type') { tok.type = 'effect'; }
          break;
      }
    }
  }

  // Mark lowercase identifiers that are immediately followed (ignoring spaces)
  // by '(' as function names.
  function markFunctions(tokens) {
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].type !== 'ident') continue;
      // find next non-whitespace token
      let j = i + 1;
      while (j < tokens.length && tokens[j].type === 'text') j++;
      if (j < tokens.length && tokens[j].type === 'punct' && tokens[j].text === '(') {
        tokens[i].type = 'fn-name';
      }
    }
  }

  // ── Renderer ─────────────────────────────────────────────────────────────

  const CLASS = {
    'comment':  'tok-comment',
    'string':   'tok-str',
    'interp':   'tok-str',   // interpolation braces stay string-coloured
    'keyword':  'tok-kw',
    'builtin':  'tok-type',
    'number':   'tok-num',
    'type':     'tok-type',
    'effect':   'tok-effect',
    'fn-name':  'tok-fn',
    'ident':    null,
    'op':       'tok-punct',
    'punct':    'tok-punct',
    'text':     null,
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
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', highlightAll);
  } else {
    highlightAll();
  }
})();

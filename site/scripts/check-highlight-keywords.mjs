// Conformance guard for the website syntax highlighter (D278).
//
// `public/js/nova-highlight.js` keeps its own copy of the Nova keyword set. The
// single source of truth is the compiler lexer
// (compiler-codegen/src/lexer/mod.rs, lex_ident_or_keyword) in the `nova` repo;
// the authoritative lists below MIRROR it and are cross-checked there by
// compiler-codegen/tests/syntax_highlight_conformance.rs (which is anchored to the
// live lexer). This script guards the website artifact in its own repo.
//
// Run: `npm run check:highlight` (exits nonzero on drift).

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const HIGHLIGHTER = join(HERE, '..', 'public', 'js', 'nova-highlight.js');

// ── Authoritative sets (mirror of the lexer; see D278) ──────────────────────

// ACTIVE keywords the lexer produces. `true`/`false` are intentionally classified
// as BUILTINS (constants) in the highlighter, so they are checked separately.
const ACTIVE = [
  'module', 'import', 'use', 'export', 'external',
  'fn', 'type', 'effect', 'alias', 'protocol',
  'const', 'mut', 'consume', 'ro', 'priv', 'pub', 'unsafe',
  'if', 'else', 'match', 'for', 'while', 'loop', 'in', 'return', 'break', 'continue',
  'test', 'with', 'throw', 'as', 'is',
  'spawn', 'supervised', 'parallel', 'detach', 'blocking', 'interrupt',
  'forbid', 'realtime', 'defer', 'errdefer', 'okdefer', 'select', 'lemma',
];

// RETIRED (let/readonly/safe) + words that are NOT keywords → must NOT be
// highlighted as keywords.
const PHANTOMS = [
  'let', 'readonly', 'safe',
  'handler', 'and', 'or', 'not', 'race', 'with_timeout', 'cancel_scope', 'region',
];

// Parser-contextual extras the highlighter is allowed to keep (not phantoms).
const CONTEXTUAL_OK = new Set(['requires', 'ensures', 'invariant', 'old']);

// ── Extract the keyword Sets from the highlighter source ────────────────────

const src = readFileSync(HIGHLIGHTER, 'utf8');

function extractSet(name) {
  const m = src.match(new RegExp(`const\\s+${name}\\s*=\\s*new Set\\(\\[([\\s\\S]*?)\\]\\)`));
  if (!m) {
    console.error(`FAIL: could not find ${name} in nova-highlight.js`);
    process.exit(1);
  }
  return new Set([...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]));
}

const ctrl = extractSet('CTRL_KEYWORDS');
const decl = extractSet('DECL_KEYWORDS');
const keywordSet = new Set([...ctrl, ...decl]);

// ── Checks ──────────────────────────────────────────────────────────────────

const errors = [];

for (const w of PHANTOMS) {
  if (keywordSet.has(w)) {
    errors.push(`phantom keyword highlighted: "${w}" (retired or not a keyword)`);
  }
}

for (const kw of ACTIVE) {
  if (!keywordSet.has(kw)) {
    errors.push(`active keyword missing from highlighter: "${kw}"`);
  }
}

// Any highlighted word that is neither active nor an accepted contextual extra is
// an unexpected addition — flag it so the lists stay honest.
for (const w of keywordSet) {
  if (!ACTIVE.includes(w) && !CONTEXTUAL_OK.has(w)) {
    errors.push(`unexpected highlighted keyword: "${w}" (not in ACTIVE / contextual set)`);
  }
}

if (errors.length > 0) {
  console.error('nova-highlight.js keyword conformance FAILED (D278):');
  for (const e of errors) console.error(`  - ${e}`);
  console.error('\nSource of truth: compiler-codegen/src/lexer/mod.rs (lex_ident_or_keyword).');
  process.exit(1);
}

console.log(`nova-highlight.js keyword conformance OK (${keywordSet.size} keywords, D278).`);

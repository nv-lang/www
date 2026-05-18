# nv-lang/www — Site Structure Guide

Static HTML site for nv-lang.org. No build step, no framework — plain HTML files + one CSS file + one JS file.

## File tree

```
www/
├── style.css                          # Single global stylesheet
├── js/
│   └── nova-highlight.js              # Nova syntax highlighter (auto-runs on DOMContentLoaded)
├── index.html                         # Russian homepage (default, /)
├── en/
│   └── index.html                     # English homepage (/en/)
├── ru/
│   ├── index.html                     # Redirect → / (301-style meta refresh)
│   ├── install/index.html             # Russian install page
│   ├── doc/index.html                 # Russian docs
│   ├── spec/index.html                # Russian spec
│   └── blog/
│       ├── index.html                 # Russian blog index
│       └── 2026-05-18-hello-nova.html # Russian blog post
├── install/index.html                 # English install page
├── doc/index.html                     # English docs
├── spec/index.html                    # English spec
└── blog/
    ├── index.html                     # English blog index
    └── 2026-05-18-hello-nova.html     # English blog post
```

## Language structure

| URL | Language | Paired with |
|-----|----------|-------------|
| `/` | Russian (default) | `/en/` |
| `/en/` | English | `/` |
| `/install/` | English | `/ru/install/` |
| `/doc/` | English | `/ru/doc/` |
| `/spec/` | English | `/ru/spec/` |
| `/blog/` | English | `/ru/blog/` |
| `/blog/SLUG.html` | English | `/ru/blog/SLUG.html` |
| `/ru/install/` | Russian | `/install/` |
| `/ru/doc/` | Russian | `/doc/` |
| `/ru/spec/` | Russian | `/spec/` |
| `/ru/blog/` | Russian | `/blog/` |

## CSS paths (relative to the HTML file)

| Location | stylesheet | highlighter script |
|----------|------------|--------------------|
| Root `/` and `/en/` | `style.css` / `../style.css` | `js/nova-highlight.js` / `../js/nova-highlight.js` |
| `/install/`, `/doc/`, `/spec/`, `/blog/` | `../style.css` | `../js/nova-highlight.js` |
| `/ru/install/`, `/ru/doc/`, `/ru/spec/` | `../../style.css` | `../../js/nova-highlight.js` |
| `/ru/blog/` | `../../style.css` | `../../js/nova-highlight.js` |
| `/blog/SLUG.html` | `../style.css` | `../js/nova-highlight.js` |
| `/ru/blog/SLUG.html` | `../../style.css` | `../../js/nova-highlight.js` |

## Common header template

Every page has the same header block. Key fields to update per-page:

```html
<html lang="ru">  <!-- or "en" -->
<title>PAGE TITLE — Nova</title>
<link rel="canonical" href="https://nv-lang.org/CANONICAL-PATH/">
<link rel="stylesheet" href="PATH/style.css">

<header class="site-header">
  <a class="site-logo" href="/">Nova</a>  <!-- logo always → / (RU root) -->
  <nav class="site-nav">
    <!-- EN pages use English labels, RU pages use Russian labels -->
    <!-- Add class="active" to the current page's link -->
    <a href="/">Главная</a>           <!-- RU: Главная | EN: Home -->
    <a href="/install/">Установка</a>  <!-- RU: Установка | EN: Install -->
    <a href="/doc/">Doc</a>
    <a href="/spec/">Spec</a>
    <a href="/blog/">Blog</a>
  </nav>
  <div class="lang-switch">
    <!-- RU always first; active page gets class="active" -->
    <a href="/ru/PAGE/">RU</a>
    <a href="/PAGE/" class="active">EN</a>
    <!-- On Russian pages: -->
    <a href="/ru/PAGE/" class="active">RU</a>
    <a href="/PAGE/">EN</a>
  </div>
</header>
```

## Nova syntax highlighting

Add `class="language-nova"` to any `<code>` inside `<pre>` — the JS highlighter runs automatically:

```html
<pre><code class="language-nova">fn greet(name str) Io -> () {
    println("Hello, ${name}!")
}</code></pre>
```

The highlighter adds `.nova-block` to the parent `<pre>`, which triggers the dark theme (`background: #1f1f1f`).

**Do NOT** manually add `<span class="tok-*">` — use plain text with `class="language-nova"`.

### Token colors (VS Code Dark Modern)

| Class | Color | What |
|-------|-------|------|
| `tok-kw-ctrl` | `#c586c0` purple | `if` `match` `throw` `for` `return` `spawn` |
| `tok-kw-decl` | `#569cd6` blue | `fn` `let` `type` `export` `mut` `import` |
| `tok-type` | `#4ec9b0` teal | PascalCase types, effects, primitives (`u64`, `str`) |
| `tok-fn` | `#dcdcaa` yellow | function names and calls |
| `tok-str` | `#ce9178` orange | string literals |
| `tok-comment` | `#6a9955` green | `// comments` |
| `tok-num` | `#b5cea8` light green | numbers |
| `tok-op` | `#569cd6` blue | `->` `=>` operators |
| `tok-ident` | `#9cdcfe` light blue | variables/identifiers |

## Editing checklist — when adding a new page

1. Create HTML file at the right path
2. Set correct `<html lang="">`, `<title>`, `<link rel="canonical">`, CSS path
3. Copy header/footer from a page at the same depth
4. Set `class="active"` on the right nav link
5. Set correct lang-switch links (RU ↔ EN pair)
6. Add `<script src="PATH/js/nova-highlight.js"></script>` at end of `<body>`
7. Create the paired language version (or update the pair's lang-switch)

## Editing checklist — when adding a blog post

1. Create `/blog/SLUG.html` (English)
2. Create `/ru/blog/SLUG.html` (Russian translation)
3. Add entry to `/blog/index.html` blog list
4. Add entry to `/ru/blog/index.html` blog list
5. Set lang-switch on each post to point to its pair

## Footer

Russian footer uses Russian column titles (Язык, Проект, Контакты).
English footer uses English (Language, Project, Contact).
Footer links are identical in both languages (all absolute paths).

## Important: encoding

**Never use PowerShell `Set-Content` or `Get-Content` without `-Encoding utf8NoBOM`** — it corrupts non-ASCII characters (em-dashes `—`, box-drawing `─`) into `вЂ"` / `в"Ђ`.

Safe pattern: use the `Edit` or `Write` tools directly. If you must use PowerShell for file writes:
```powershell
Set-Content "file.html" $content -Encoding utf8NoBOM
```

## Git

Repository: `https://github.com/nv-lang/www`
Branch: `main`

Stage only specific files — other agents may work in parallel:
```
git add path/to/file.html
git commit -m "..."
git push
```

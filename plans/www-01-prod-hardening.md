// SPDX-License-Identifier: MIT OR Apache-2.0
# Plan www-01: Production hardening сайта nv-lang.org

> **Статус:** ✅ Выполнен (2026-05-21); 🔁 повторный аудит — довод до production-grade (2026-05-22, ред. 2).
> **Создан:** 2026-05-21. **Приоритет:** P1 (блокеры прода) → P2 (SEO/инфра) → P3 (minor).
> **Трудоёмкость:** ~1 dev-day суммарно.
> **Репо:** `d:\Sources\nv-lang\www\`

---

## Редакция 2 — повторный аудит (2026-05-22)

Сквозная перепроверка всех 29 страниц с нуля показала, что отметка
«✅ Выполнен» была преждевременной: 4 фазы выполнены с упрощениями или
с багами. Исправлено в ветке `www-01-hardening-audit`:

**P0 (ломали прод/SEO/соцсети):**
- `og:image` был SVG — соцсети его не рендерят. Создан `og-image.png`
  1200×630 (Ф.3.2 требовала PNG, было упрощено до SVG).
- `hreflang` на главной инвертирован: `hreflang="en"` вёл на RU-страницу `/`.
  Исправлено: `/` = RU, `/en/` = EN (исключение из схемы «без префикса = EN»).
- `index.html` / `en/index.html` не имели `<main id="main-content">` —
  skip-link (Ф.4.1) был мёртвым. Добавлен landmark.
- `sitemap.xml`: 5 фантомных URL `/ru/doc/std/*` (404), пропущены `/en/`
  и оба поста блога. Пересобран.
- 2 остатка mojibake `вЂ“`→`–` (Ф.1.1 чинила только em-dash).
- `install/index.html`: типографские кавычки `”` в HTML-атрибутах секции
  «Next steps» ломали 4 ссылки и стили карточек.
- Заголовки колонок футера: CSS-селектор `.footer-col h4` не совпадал с
  разметкой `.footer-col__title` — рендерились без стилей на всех страницах.

**P1:** twitter-card на `en/` (`summary`→`summary_large_image` + image);
JSON-LD продублирован на EN-главную; убран `hreflang=ru` на 5 EN-страницах
std (RU-переводов нет); favicon/og-image перекрашены в брендовый `#6b3fa0`.

**P2 (не входило в исходный план):** CSP-meta, `theme-color`,
`apple-touch-icon`, `color-scheme`, `@media (prefers-reduced-motion)`,
`noindex` на редирект `/ru/`, удалён UTF-8 BOM из 5 файлов.

**Известные ограничения после ред. 2:** `install.sh` отсутствует в репо —
команда `curl … | sh` на главной даёт 404 (артефакт релиза, вне scope www);
RU-переводы подстраниц `std/*` не созданы.

---

## Цель

Привести сайт к production-grade по критериям:

1. Корректное отображение всех страниц (encoding, CSS).
2. Базовая SEO-инфраструктура (robots, sitemap, favicon, 404).
3. Соответствие стандартам docs.rs / go.dev / typescriptlang.org по meta-тегам.
4. Доступность (a11y) и мелкие улучшения.

---

## Фазы

### Ф.1 — Encoding + CSS критические баги ✅ / ❌

**Ф.1.1 — Кривая кодировка в `install/`, `blog/`, `spec/`**

Проблема: файлы содержат кракозябры — `в"Ђ`, `рџ"–`, `вЂ—` вместо нормальных
Unicode-символов. Происходит из-за двойного encode (UTF-8 bytes читались как
Windows-1252 и снова сохранены в UTF-8).

Затронутые файлы:
- `install/index.html` — строки 11, 118, 138, 140, 149, 193–266, 384–399
- `blog/index.html` — title (`Blog вЂ— Nova`) и тело
- `spec/index.html` — title (`Language Specification вЂ— Nova`) + символы `§`

Исправить:
- `вЂ—` → `—` (em dash)
- `В§` → `§`
- `рџ"–` → убрать или заменить на SVG-иконку
- Пересохранить все три файла в UTF-8 без BOM

**Ф.1.2 — Несуществующие CSS-классы в `install/index.html`**

Проблема: footer использует `.site-footer__cols`, `.site-footer__logo`,
`.site-footer__heading`, `.site-footer__bottom` — ни одного из них нет в
`style.css`. Footer рендерится без стилей.

Исправить: привести footer `install/index.html` к структуре остальных страниц:

```
site-footer__cols     → site-footer__inner
site-footer__logo     → footer-brand
site-footer__heading  → footer-col h4
site-footer__bottom   → footer-bottom
```

---

### Ф.2 — Базовая инфраструктура (нет ни у кого из нас)

**Ф.2.1 — `robots.txt`**

```
User-agent: *
Allow: /
Sitemap: https://nv-lang.org/sitemap.xml
```

**Ф.2.2 — `sitemap.xml`**

Перечислить все публичные страницы:

| URL | changefreq | priority |
|---|---|---|
| `https://nv-lang.org/` | weekly | 1.0 |
| `https://nv-lang.org/install/` | monthly | 0.9 |
| `https://nv-lang.org/doc/` | weekly | 0.9 |
| `https://nv-lang.org/spec/` | monthly | 0.8 |
| `https://nv-lang.org/blog/` | weekly | 0.7 |
| `https://nv-lang.org/doc/channels/` | monthly | 0.7 |
| `https://nv-lang.org/doc/contracts/` | monthly | 0.7 |
| `https://nv-lang.org/doc/nova-cli/` | monthly | 0.7 |
| `https://nv-lang.org/doc/nova-codegen/` | monthly | 0.6 |
| `https://nv-lang.org/doc/std/` | monthly | 0.7 |
| `https://nv-lang.org/doc/std/vec/` | monthly | 0.6 |
| `https://nv-lang.org/doc/std/hashmap/` | monthly | 0.6 |
| `https://nv-lang.org/doc/std/duration/` | monthly | 0.6 |
| `https://nv-lang.org/doc/std/semver/` | monthly | 0.6 |
| `https://nv-lang.org/doc/std/json/` | monthly | 0.6 |
| + зеркало `/ru/` для всех выше | monthly | 0.6 |

**Ф.2.3 — `favicon.svg`**

Сейчас браузер делает 404 на каждой странице. Создать минимальный
`favicon.svg` из логотипа «N» + `<link rel="icon" href="/favicon.svg">` в
`style.css` через JS или добавить в каждый `<head>`.

Способ добавления: один `<link rel="icon">` через общий шаблон (или добавить
в каждый файл вручную — страниц ~28).

**Ф.2.4 — `404.html`**

Минимальная страница с:
- заголовком «Page not found»
- ссылкой на `/` и `/doc/`
- тем же header/footer что везде
- `<meta http-equiv="refresh" content="10;url=/">` как fallback

---

### Ф.3 — SEO и Open Graph

**Ф.3.1 — `hreflang` на всех EN/RU парах**

Каждая EN-страница должна содержать:

```html
<link rel="alternate" hreflang="en" href="https://nv-lang.org/PAGE/">
<link rel="alternate" hreflang="ru" href="https://nv-lang.org/ru/PAGE/">
<link rel="alternate" hreflang="x-default" href="https://nv-lang.org/PAGE/">
```

Каждая RU-страница:

```html
<link rel="alternate" hreflang="en" href="https://nv-lang.org/PAGE/">
<link rel="alternate" hreflang="ru" href="https://nv-lang.org/ru/PAGE/">
<link rel="alternate" hreflang="x-default" href="https://nv-lang.org/PAGE/">
```

Затрагивает ~28 файлов. Приоритет для индексных страниц (`/`, `/doc/`,
`/install/`, `/spec/`, `/blog/`).

**Ф.3.2 — `og:image` на всех страницах**

Создать один `og-image.png` (1200×630) и добавить на все страницы:

```html
<meta property="og:image" content="https://nv-lang.org/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
```

**Ф.3.3 — Twitter Card на все страницы (сейчас только на 3 из 28)**

Добавить на каждую страницу:

```html
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="...">
<meta name="twitter:description" content="...">
<meta name="twitter:image" content="https://nv-lang.org/og-image.png">
```

**Ф.3.4 — JSON-LD на главной**

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Nova",
  "description": "General-purpose systems language with algebraic effects, static contracts, and lightweight M:N runtime.",
  "url": "https://nv-lang.org",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "Linux, macOS",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
  "license": "https://opensource.org/licenses/MIT",
  "codeRepository": "https://github.com/nv-lang/nova",
  "programmingLanguage": "Nova"
}
</script>
```

---

### Ф.4 — Доступность и мелкие улучшения

**Ф.4.1 — `skip-link` (WCAG 2.1)**

В начало `<body>` каждой страницы:

```html
<a href="#main-content" class="skip-link">Skip to main content</a>
```

В `style.css`:

```css
.skip-link {
  position: absolute; top: -40px; left: 0; z-index: 999;
  background: var(--accent); color: #fff;
  padding: 0.5rem 1rem; border-radius: 0 0 4px 0;
  text-decoration: none; font-size: .9rem;
}
.skip-link:focus { top: 0; }
```

**Ф.4.2 — `<main id="main-content">` на всех страницах**

Убедиться что у каждого `<main>` есть `id="main-content"` для skip-link и
семантики.

**Ф.4.3 — `@media print` CSS**

```css
@media print {
  .site-header, .site-footer, .doc-sidebar, .nav-toggle { display: none; }
  .doc-layout { display: block; }
  .doc-content { max-width: 100%; }
  body { background: white; color: black; }
  a { color: black; text-decoration: underline; }
  pre, code { background: #f5f5f5; }
}
```

**Ф.4.4 — Удалить мёртвые CSS-классы**

В `style.css` не используются нигде:
- `.hero`, `.hero__badge`, `.hero__tagline`, `.hero__actions`
  (строки ~348–389)

Проверить `grep -r "hero"` по всем HTML перед удалением.

---

## Что лучше чем у Go / Rust / TypeScript (уже есть)

- **Ноль внешних зависимостей** — никакого Bootstrap, Highlight.js, CDN. Всё своё.
- **Нет render-blocking ресурсов** — у TypeScript docs загружается ~40 JS-файлов.
- **CSS 34 KB** — у docs.rs ~200 KB (с Bootstrap), у typescript ~150 KB.
- **Dark mode без JS** — `prefers-color-scheme` в pure CSS.
- **Inline SVG** — нет лишних HTTP-запросов на иконки.
- **Своя подсветка синтаксиса Nova** — знает `#verify`, `#pure`, effects в сигнатурах.

## Что можно сделать лучше чем у конкурентов

- **Search** — у go.dev и docs.rs есть поиск по API. Для статического сайта
  можно использовать [pagefind](https://pagefind.app) (static index, 0 backend)
  или написать свой минималистичный на основе JSON-индекса. Это единственное
  реально важное, чего нет и чего будет не хватать пользователям.

- **Sidebar «active» highlight при скролле** — автоматически подсвечивать
  текущий раздел в меню при прокрутке (IntersectionObserver, ~30 строк JS).
  У go.dev и docs.rs это есть.

- **«Copy» кнопка на блоках кода** — стандарт де-факто (есть у всех). 10 строк JS.

- **Время чтения / прогресс** — minor, но приятно (Medium-style).

---

## Не делать (сознательные trade-offs)

- **Service Worker / PWA** — нет смысла для docs-сайта без backend. Docs.rs
  его тоже не использует.
- **CSS минификация** — файл 34 KB, выигрыш ~5 KB. Не стоит усложнять pipeline.
- **Bundler / build step** — текущая архитектура «просто HTML» — это
  преимущество, не недостаток. Не вводить без сильной причины.
- **Floating-point rendering** / матформулы — не нужно для языка с контрактами
  на integer arithmetic.

---

## Порядок выполнения

| Приоритет | Фаза | Сложность | Эффект |
|---|---|---|---|
| P0 | Ф.1.1 encoding fix | средняя (ручная правка 3 файлов) | страницы перестанут выглядеть сломанными |
| P0 | Ф.1.2 CSS footer fix | малая | footer install/ заработает |
| P1 | Ф.2.1–2.2 robots + sitemap | малая | Google начнёт индексировать правильно |
| P1 | Ф.2.3 favicon | малая | нет 404 на каждой странице |
| P1 | Ф.2.4 404.html | малая | UX при несуществующем URL |
| P2 | Ф.3.1 hreflang | средняя (~28 файлов) | Google знает EN/RU пары |
| P2 | Ф.3.2–3.3 og:image + twitter | средняя (нужен og-image.png) | красивые превью при шеринге |
| P2 | Ф.3.4 JSON-LD | малая | rich snippets в поиске |
| P3 | Ф.4.1–4.2 skip-link | малая | a11y |
| P3 | Ф.4.3 print CSS | малая | print |
| P3 | Ф.4.4 dead CSS | малая | чистота кода |
| future | sidebar active highlight | малая JS | UX |
| future | copy button на коде | малая JS | UX |
| future | search (pagefind) | большая | discovery |

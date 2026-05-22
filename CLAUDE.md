# nv-lang/www — Astro site guide

Static site for **nv-lang.org**, built with **Astro**. Source lives here;
`astro build` produces `dist/`, which GitHub Actions deploys to GitHub Pages.

> Миграция со старого «голого HTML» на Astro — см. `plans/www-02-astro-migration.md`.

## Команды

```sh
npm install        # один раз — зависимости
npm run dev        # локальный dev-сервер (http://localhost:4321)
npm run build      # сборка в dist/
npm run preview    # просмотр собранного dist/
npm run check      # проверка типов (.astro)
```

Нужен Node 18.20.8+ / 20.3+ / 22+.

## Структура

```
astro.config.mjs     site, build.format 'preserve', интеграции
src/
├── pages/           страницы = маршруты. Путь файла = URL
├── layouts/
│   └── BaseLayout.astro   общий каркас: <html>, <head>, шапка, подвал, скрипт
├── components/
│   ├── Head.astro   все мета-теги <head> (CSP, og/twitter, hreflang, JSON-LD)
│   ├── Header.astro общая шапка (RU/EN, active-подсветка, lang-switch)
│   └── Footer.astro стандартный подвал (RU/EN)
├── partials/        тело каждой страницы — готовый HTML (.html), verbatim
└── styles/global.css  единственный CSS (импортируется в BaseLayout)
public/              отдаётся как есть: favicon, logo, og-image,
                     apple-touch-icon, js/, robots.txt, sitemap.xml, CNAME
dist/                результат сборки (в .gitignore)
```

## Как устроена страница

Каждая страница в `src/pages/` — тонкая обёртка: фронтматтер с мета-данными +
`BaseLayout` + содержимое из партиала через `set:html`:

```astro
---
import BaseLayout from '@layouts/BaseLayout.astro';
import body from '@partials/doc-index.html?raw';
const meta = { title: '…', description: '…', canonical: '…', lang: 'en' as const,
               hreflangRu: '…', hreflangEn: '…', /* og*, twitter*, langRuUrl/En */ };
---
<BaseLayout {...meta} active="doc">
  <Fragment set:html={body} />
</BaseLayout>
```

**Почему партиалы, а не разметка прямо в `.astro`:** контент содержит примеры
кода Nova с `{` `}` и backtick — в шаблоне `.astro` это интерпретировалось бы
как выражения. `?raw`-импорт + `set:html` вставляют HTML дословно.

`BaseLayout` props: `title`, `description?`, `canonical?`, `lang`,
`hreflangRu?`/`hreflangEn?`/`hreflangXDefault?`, `og*`, `twitter*`,
`active?`, `jsonLd?`, `noindex?`, `customFooter?` (install — свой подвал в теле),
`langRuUrl?`/`langEnUrl?` (ссылки переключателя языка).

## URL и языки

`build.format: 'preserve'` сохраняет схему URL точь-в-точь:
`pages/doc/index.astro` → `/doc/`, `pages/blog/x.astro` → `/blog/x.html`.

| URL | Язык | Пара |
|-----|------|------|
| `/` | RU (по умолчанию) | `/en/` |
| `/en/` | EN | `/` |
| `/doc/`, `/install/`, `/spec/`, `/blog/` | EN | `/ru/doc/` … |
| `/ru/doc/` … | RU | `/doc/` … |

Языковая схема непоследовательна (главная RU без префикса, разделы EN без
префикса) — это сохранено намеренно при миграции; унификация — отдельная задача.

## Подсветка синтаксиса Nova

`public/js/nova-highlight.js` подключён в `BaseLayout`, запускается на
`DOMContentLoaded`. Добавь `class="language-nova"` на `<code>` внутри `<pre>`.
Тёмная тема блока (`pre.nova-block`, VS Code Dark Modern) включается скриптом.

## Кодировка

Все файлы — **UTF-8 без BOM**. Никогда не используй PowerShell `Set-Content`/
`Get-Content` без `-Encoding utf8NoBOM` — портит `—`, `§` и т.п. Правь через
редактор или инструменты агента.

## Деплой

`.github/workflows/deploy.yml` — сборка Astro + публикация в GitHub Pages.
До cutover (план www-02, Ф.8) триггер ручной (`workflow_dispatch`).
На cutover: триггер → `push: branches: [main]`, Pages Source → GitHub Actions.

## Git

Репозиторий `https://github.com/nv-lang/www`, ветка `main`.
Стейдж только конкретные файлы — рядом могут работать другие агенты:

```sh
git add path/to/file
git commit -m "…"
git push
```

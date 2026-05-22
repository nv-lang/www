# nv-lang/www — repository guide

Repository for **nv-lang.org** — the Nova programming language website.

```
www/
├── site/             ← сам сайт: Astro-проект (см. ниже)
├── plans/            планы развития (www-01, www-02 …)
├── .github/workflows/  CI — сборка и деплой на GitHub Pages
├── CLAUDE.md  README.md  LICENSE
```

Сайт собирается из `site/` Astro → `site/dist/` → GitHub Pages (через Actions).

> Миграция со старого «голого HTML» на Astro — `plans/www-02-astro-migration.md`.

## Команды

Выполнять **из каталога `site/`**:

```sh
npm install        # один раз — зависимости
npm run dev        # dev-сервер (http://localhost:4321)
npm run build      # сборка в site/dist/ (с prebuild и postbuild — см. ниже)
npm run preview    # просмотр собранного
npm run check      # проверка типов (.astro)
```

Нужен Node 22.12+ (Astro 6; CI собирает на Node 24).

## Структура `site/`

```
site/
├── astro.config.mjs   site, build.format 'preserve', rehype-плагины D-ссылок
├── package.json  tsconfig.json
├── scripts/
│   ├── sync-decisions.mjs   prebuild: тянет D-блоки из репо nova
│   └── check-links.mjs      postbuild: проверка битых ссылок и якорей
├── src/
│   ├── pages/         страницы = маршруты. Путь файла = URL
│   ├── layouts/
│   │   └── BaseLayout.astro   каркас: <html>, <head>, шапка, подвал, скрипты
│   ├── components/
│   │   ├── Head.astro   мета-теги <head> (CSP, og/twitter, hreflang, JSON-LD)
│   │   ├── Header.astro общая шапка (RU/EN, active, lang-switch)
│   │   └── Footer.astro стандартный подвал (RU/EN)
│   ├── content/decisions/   D-блоки спецификации (синхронизируются, в .gitignore)
│   ├── partials/      тело каждой страницы — готовый HTML (.html), verbatim
│   └── styles/global.css   единственный CSS (импортируется в BaseLayout)
├── public/            отдаётся как есть: favicon, logo, og-image,
│                      apple-touch-icon, js/, robots.txt, sitemap.xml, CNAME
└── dist/              результат сборки (в .gitignore)
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
| `/` | EN (по умолчанию) | `/ru/` |
| `/doc/`, `/install/`, `/spec/`, `/blog/` | EN | `/ru/doc/` … |
| `/ru/`, `/ru/doc/` … | RU | `/`, `/doc/` … |
| `/en/` | редирект → `/` | — |

Схема единая: без префикса — EN, префикс `/ru/` — RU. `/en/` оставлен
редиректом ради старых внешних ссылок (раньше там была EN-главная).

## Сборка: prebuild и postbuild

`npm run build` запускает npm-хуки:
- **prebuild** — `scripts/sync-decisions.mjs` тянет `spec/decisions/*.md` из
  репозитория nova в `src/content/decisions/` (D-блоки для `/spec/decisions/`).
  В CI `GITHUB_TOKEN` поднимает лимит GitHub API;
- **postbuild** — `pagefind --site dist` строит индекс поиска, затем
  `scripts/check-links.mjs` проверяет битые внутренние ссылки и якоря.
  Падение любого — валит сборку (красный CI = нет деплоя).

## Поиск

Pagefind: индекс строится в postbuild, страницы `/search/` и `/ru/search/`
с Default UI. Контент для индексации помечен `data-pagefind-body` в
`BaseLayout`; служебные страницы — `data-pagefind-ignore`.

## Клиентские скрипты

Все в `public/js/`, подключены в `BaseLayout` как `is:inline` (vanilla JS,
без фреймворка — принцип «0 JS по умолчанию»):
- `nova-highlight.js` — подсветка кода (`class="language-nova"` на `<code>`);
- `copy-code.js` — кнопка копирования на каждом блоке кода;
- `scroll-spy.js` — подсветка активного раздела в сайдбаре doc-страниц.

## Кодировка

Все файлы — **UTF-8 без BOM**. Никогда не используй PowerShell `Set-Content`/
`Get-Content` без `-Encoding utf8NoBOM` — портит `—`, `§` и т.п.

## Деплой

`.github/workflows/deploy.yml` — сборка Astro (`path: ./site`, Node 24) +
публикация в GitHub Pages. Триггер — `push` в `main` (cutover проведён,
Pages Source = GitHub Actions): каждый push в `main` пересобирает и деплоит сайт.

## Git

Репозиторий `https://github.com/nv-lang/www`, ветка `main`.
Стейдж только конкретные файлы — рядом могут работать другие агенты.

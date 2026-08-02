# p-docs-footer — план 241: подвал контент-страниц (2026-08-02)

Исполнитель: **opencode / big-pickle**. Worktree `www-docs-footer`, ветка
`p-docs-footer` (от `origin/main`). Справочные копии `TASK-241.md` и
`SITE-CONVENTIONS.md` НЕ коммитились.

## Ход исполнения (порядок по плану 241, §1а — спайк → раскатка)

1. **Спайк** (коммит `27c81c7`): инфраструктура + подвал на 3 типах страниц
   (guide `/doc/channels/` en+ru, spec `/spec/syntax/`, рукописная `/` en+ru).
   Полная приёмка п.3 — зелёная (гейты, ссылки 200, даты сверены, en/ru).
2. **Раскатка** (коммит `811897b`): подвал на всех страницах из карты §0.2 —
   `spec/decisions/[topic]`, `spec/decisions/` index, индексы `doc/`, `ru/doc/`,
   `spec/`, `ru/spec/`, `install/` + `ru/install/`, `doc/std/*` (6 en) +
   `ru/doc/std/`; `.github/workflows/deploy.yml` → `fetch-depth: 0`.
   Гейты зелёные.
3. **Пуш** ветки `p-docs-footer` — после финальных гейтов.

## Хеши коммитов

- `27c81c71ae389fb764fc8afdb06d06f771b1248b` — спайк
- `811897bb5b4e8178bfe8dcf5a067ed89d368337e` — раскатка

## Правленные/созданные файлы

- `site/scripts/sync-decisions.mjs` — frontmatter `sourcePath`/`sourceDate` на
  каждой сгенерированной странице; кэш дат `site/src/data/source-dates.json`;
  даты через GraphQL-батч (commit.history(path:) aliases, только с токеном),
  локально без токена — из кэша; нет даты → поле не пишется.
- `site/src/content.config.ts` — схемы коллекций decisions/spec/docs: поля
  `sourcePath`/`sourceDate` (optional).
- `site/src/components/PageMeta.astro` (новый) — подвал контент-страницы:
  Edit/Source/партиал + обратная связь + «Last updated» (en/ru).
- `site/src/data/feedback.ts` (новый) — конфиг-константа канала обратной
  связи (A-R3/221 Ф.4), одна строка = переключение при релизе.
- `site/src/data/sourceMeta.ts` (новый) — `git log -1 --format=%cI -- <партиал>`
  для рукописных страниц (путь от корня клона www, не через import.meta.url).
- `site/src/data/source-dates.json` (новый) — кэш дат коммитов источника.
- `site/src/layouts/BaseLayout.astro` — слот `page-meta` перед общим подвалом.
- `site/src/styles/global.css` — стили `.page-meta`.
- Страницы: `doc/[slug]`, `ru/doc/[slug]`, `spec/[...slug]`,
  `spec/decisions/[topic]`, `spec/decisions/index`, `doc/index`, `ru/doc/index`,
  `spec/index`, `ru/spec/index`, `install`, `ru/install`, `doc/std/*` (index,
  duration, hashmap, json, semver, vec), `ru/doc/std`, `index`, `ru/index`.
- `.github/workflows/deploy.yml` — `fetch-depth: 0` (depth-ловушка, #honest-dates).

## Вердикты гейтов (дословно)

- `npm run check` → `Result (56 files): - 0 errors - 0 warnings - 25 hints`
- `npm run check:highlight` → `nova-highlight.js keyword conformance OK (51 keywords, D278).`
- `npm run build` → astro: `✓ Completed in 14.03s.` / `56 page(s) built in 18.25s` /
  `[build] Complete!`; pagefind `Indexed 53 pages`; postbuild:
  `check-links: OK — 56 страниц, все ссылки и якоря целы`.

## Проверки приёмки (п.3)

- Edit/Source/партиал/feedback-ссылки кликнуты через HTTP на реальных
  страницах: `edit/main/docs/guide/channels.md` 200, `channels.ru.md` 200,
  `blob/main/spec/syntax.md` 200, `blob/main/spec/decisions/01-philosophy.md`
  200, `tree/main/spec/decisions` 200, партиалы www 200,
  `issues/new?title=…` 200.
- Даты сверены: guide `channels.md` GraphQL `2026-08-02T00:04:00Z` →
  «August 2, 2026»; ru-пара — от СВОЕГО файла `channels.ru.md` (та же дата);
  `spec/syntax.md` `2026-08-02T03:23:32Z`; рукописная главная —
  `git log -1` партиала `2026-08-02T04:23:01+03:00` → «August 2, 2026».
- **depth-ловушка подтверждена экспериментом**: `git clone --depth 1` даёт
  ВСЕМ партиалам дату HEAD-коммита (2026-08-02T04:23:26+03:00), а полный клон —
  реальные даты (spec-index.html 2026-06-21, doc-std-vec 2026-05-22).
  `fetch-depth: 0` в deploy.yml это закрывает; финальная сверка дат в CI —
  за интегратором.
- en/ru синхронны (у каждой en-страницы с подвалом есть ru-зеркало с
  ru-текстами подвала; `/spec/` — ru-динамики нет по плану, только index).
- «синк не тянет docs/dev/» — отбор файлов не менялся (`spec/**` +
  DOC_SLUGS). Дискорд не добавлялся.
- Даты сборки как fallback НЕ используются: нет даты ни в ответе GraphQL, ни
  в кэше → поле `sourceDate` не пишется → блок даты не рендерится.

## Найденные попутно устаревания (доложены, не чинились молча)

1. **Футер сайта «Discussions» ведёт в 404.** На `nv-lang/nova`
   `has_discussions=false` (страница `github.com/nv-lang/nova/discussions` —
   404). Ссылка есть в общем `Footer.astro` (en «Discussions»/ru «Обсуждения»)
   и в собственном подвале /install/. Не чинил — вне скоупа 241, решает владелец
   (возможно, это находка уровня «включить Discussions» или поменять ссылку).
2. **Премиса плана 241 о канале обратной связи устарела.** План: «ДО включения
   Issues → Discussions, ПОСЛЕ → Issues». Факт на 2026-08-02: Issues УЖЕ
   включены (`has_issues=true`, `/issues/new` 200), Discussions выключены.
   Поэтому по правилу A-R3 (221 Ф.4) активна ветка Issues — константа
   `FEEDBACK.base` в `site/src/data/feedback.ts` указывает на
   `issues/new?title=<путь страницы>`. Переключение при релизе — однострочное
   (подставить `discussionsBase`, слаг категории лежит в той же константе).

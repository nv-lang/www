# p-www-sync — прогресс

Синхронизация сайта nv-lang с актуальным состоянием языка ДО релиза
(решение владельца 2026-08-02: релиз-страницу/`release-v0-1-page` не трогать).

Ветка `p-www-sync` от `origin/main`, worktree `d:/Sources/nv-lang/www-p-www-sync`.

## 1. Подсветка ключевых слов (D278/D443) — ИСПРАВЛЕНО

Источник истины — лексер `compiler-codegen/src/lexer/mod.rs`
(`lex_ident_or_keyword`), сверено с `editors/vscode/syntaxes/nova.tmLanguage.json`
и спекой (`spec/decisions/02-types.md` D443, `spec/decisions/09-tooling.md` D278).

- `use`: убран из ACTIVE (`site/scripts/check-highlight-keywords.mjs`) и из
  `DECL_KEYWORDS` (`site/public/js/nova-highlight.js`) — D443 (Plan 239,
  2026-08-01) ретрактировал `use` из hard keyword в контекстный (как
  `bench`/`apply`/`measure`/`null`); D278 §3 запрещает подсвечивать
  контекстные слова. Добавлен в PHANTOMS с пояснением.
- `extern`, `ref`, `uninit`: добавлены в ACTIVE + `DECL_KEYWORDS` — реальные
  hard keyword'ы лексера (`KwExtern`/`KwRef`/`KwUninit`), присутствуют в
  tmLanguage.json, но ранее отсутствовали на сайте (дрейф, не связанный с
  D443, найден при полной сверке).
- `value`/`enum`/`bench` в tmLanguage.json (nova repo) — контекстные слова
  (парсер matches `Ident` по тексту, НЕ `Kw*`-токен), корректно НЕ
  добавлены на сайт (ориентир — лексер/спека, не tmLanguage.json дословно).
- `safe` в tmLanguage.json — известный pre-existing фантом (RETIRED-токен,
  диагностика `E_SAFE_RETIRED`, не должен подсвечиваться); сайт уже
  корректен (был и остался в PHANTOMS), в tmLanguage.json НЕ трогаю (не моя
  репа/скоуп).
- `check:highlight` зелёный: 51 keyword, конформанс OK.

## 2. Спек-снапшоты (`site/src/content/decisions/*.md`) — ПРОВЕРЕНО, правок не требуется

`src/content/decisions|spec|docs` — **generated + gitignored**
(`site/scripts/sync-decisions.mjs`, prebuild-хук), тянутся live с
`github.com/nv-lang/nova` (ветка `main`) при каждой сборке. Ручных копий нет.

- Подтверждено: `nova` локальный `main` == `github/main` (`056c7a573`).
- `npm run sync:decisions` — OK, 11 файлов решений + 8 spec-документов +
  6 doc-гайдов, 290 D-блоков.
- Проверено наличие свежих амендментов в засинканном контенте:
  D443 (`02-types.md`), D46 `@not` RETRACTED amend 2026-08-02
  (`03-syntax.md`), D321-AMEND (`08-runtime.md`), D431 (`04-effects.md`),
  D76 (`08-runtime.md`), D442 (`06-concurrency.md`) — все на месте.

## 3. Устаревшие идиомы в примерах кода — ПРОВЕРЕНО, не найдено

Грепнул `site/src` (весь, включая partials/content, без node_modules/dist)
на: `read_to_vec`, `.layer(`, `to_socket_addr` (bind/connect форма),
`int.try_from("`, `${x.to_str()}`. Ноль совпадений везде, кроме двух блог-
постов (`content/blog/{en,ru}/2026-05-18-hello-nova.md`) с `id.to_str()` /
`amount.to_str()` — но это НЕ строковая интерполяция `${...}`, а поле
map-литерала (`{id: id.to_str()}`), валидный и по сей день паттерн (метод
`to_str()` жив, используется в текущих flagship-примерах); датированный
блог-пост исторический, не трогаю. Изменений нет.

## 4. Сборка сайта — ЗЕЛЁНАЯ

Из `site/`:
- `npm install` — OK.
- `npm run build` — OK (58 страниц; первая попытка упала на транзиентном
  `fetch failed` к GitHub API, ретрай прошёл чисто). `postbuild`:
  pagefind (55 страниц/2 языка) + `check-links.mjs` — OK, битых ссылок/
  якорей нет.
- `npm run check` (astro check) — 0 errors, 0 warnings, 16 hints
  (pre-existing Zod-deprecation hints в `content.config.ts`, не связаны с
  правками этой сессии).
- `dist/` в `.gitignore` — не коммичу.

## Изменённые файлы

- `site/scripts/check-highlight-keywords.mjs`
- `site/public/js/nova-highlight.js`

Ветка `main` НЕ трогалась. `release-v0-1-page` НЕ трогалась.

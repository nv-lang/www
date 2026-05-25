// SPDX-License-Identifier: MIT OR Apache-2.0
# Plan www-05: Восстановить nv-lang.ru как зеркало + SEO через ru-RU hreflang

> **Статус:** 📋 proposed 2026-05-24, rev 2 — 2026-05-25 после
> обнаружения что `.ru` сейчас обслуживает README (sync клонирует
> Astro source без build). Scope расширен.
> **Приоритет:** P1 (.ru сейчас не работает как сайт).
> **Трудоёмкость:** ~0.5 dev-day (новый workflow + Pages mode switch
> + README update + smoke test).
> **Репо:** `d:\Sources\nv-lang\www.nv-lang.ru\` (главное);
> опц. `d:\Sources\nv-lang\www\` (документация).
> **Предшественники:** [www-01](www-01-prod-hardening.md) ✅,
> [www-02](www-02-astro-migration.md) ✅ (Astro генерирует
> canonical/hreflang).
> **Источник:** обсуждение mirror vs redirect 2026-05-24; ревизия
> после WebFetch проверки 2026-05-25.

## Реальное состояние (обнаружено 2026-05-25)

Текущий sync workflow клонирует **источник** `nv-lang/www` (Astro в
`site/`) и rsync'ает в корень .ru repo. **Build шага нет.** GitHub
Pages mode на .ru = «Deploy from branch: main /». В корне нет
`index.html`, поэтому Pages обслуживает `README.md` как fallback.

Подтверждено через WebFetch: `nv-lang.ru/` отдаёт README, не сайт.
Это сломанное зеркало с момента www-02 migration (когда Astro source
переехал в `site/` поддиректорию, а старый sync workflow остался
заточенным под структуру pre-migration).

Исходный www-05 (sed-инъекция hreflang в HTML) **невозможен** —
нет HTML для инъекции.

## Решение — Option B: GitHub Actions Pages deploy

Альтернативой A (build внутри текущего sync workflow + commit в main)
выбран **Option B**: переключить .ru на GitHub Pages «Deploy via
GitHub Actions», новый workflow собирает Astro из upstream + делает
post-processing + deploy через Pages API. Main .ru остаётся чистым,
без auto-commit'ов.

Pros B vs A:
- Чистый main (не загрязняется auto-commit'ами каждые 15 мин).
- Стандартный паттерн (как у самого `.org`).
- Сборка и deploy разделены явно.

Cons B:
- Требует **manual switch Pages Source = "GitHub Actions"** в
  Settings .ru repo (один раз).
- В первый раз перед switch'ом workflow будет fail'ить на deploy
  step (Pages API недоступен в branch-mode). Митигация: cron
  выключен до switch'а, только `workflow_dispatch`.

## Целевая архитектура

```
Cron (или manual dispatch)
  │
  ▼
.ru workflow (build + post-process + deploy)
  │
  ├─ Checkout nv-lang/www (source)
  ├─ npm ci в upstream/site/
  ├─ npm run build → upstream/site/dist/
  ├─ Post-process dist/:
  │    ├─ CNAME → "nv-lang.ru" (override)
  │    ├─ Inject ru-RU hreflang в каждую HTML с canonical
  │    └─ Sitemap.xml: nv-lang.org → nv-lang.ru
  ├─ Upload Pages artifact (actions/upload-pages-artifact@v3)
  └─ Deploy to Pages (actions/deploy-pages@v4)
       │
       ▼
       nv-lang.ru обслуживает built HTML с ru-RU hreflang
```

## Целевое состояние HTML

**На .org HTML (build output):**
```html
<link rel="canonical" href="https://nv-lang.org/install/">
<link rel="alternate" hreflang="ru" href="https://nv-lang.org/ru/install/">
<link rel="alternate" hreflang="en" href="https://nv-lang.org/install/">
<link rel="alternate" hreflang="x-default" href="https://nv-lang.org/install/">
```

**После post-process на .ru:**
```html
<link rel="canonical" href="https://nv-lang.org/install/">   <!-- unchanged: consolidate SEO -->
<link rel="alternate" hreflang="ru" href="https://nv-lang.org/ru/install/">
<link rel="alternate" hreflang="en" href="https://nv-lang.org/install/">
<link rel="alternate" hreflang="x-default" href="https://nv-lang.org/install/">
<link rel="alternate" hreflang="ru-RU" href="https://nv-lang.ru/install/">  <!-- NEW: RU-locale SEO -->
```

Один новый тег per page. Canonical → .org (Google понимает .ru как
alias, не дубликат — нет SEO penalty).

## Фазы

### Ф.0 — Audit (GATE, ~0.1 д)

- **Ф.0.1** Подтвердить через WebFetch что nv-lang.ru возвращает
  README/error/прочее (✅ сделано 2026-05-25: README).
- **Ф.0.2** Проверить текущий workflow `.github/workflows/sync-from-www.yml`
  в `www.nv-lang.ru/` (✅ известен: rsync без build).
- **Ф.0.3** Проверить структуру `nv-lang/www` (✅ известен: Astro в
  `site/`, build → `site/dist/`, deploy через Actions).

### Ф.1 — Новый workflow (~0.2 д)

- **Ф.1.1** Полная замена `.github/workflows/sync-from-www.yml`:
  - Триггеры: `workflow_dispatch` (всегда), `schedule: */15 * * * *`
    (опц., **закомментирован до Pages mode switch**).
  - Permissions: `contents: read` (не пишем в main), `pages: write`,
    `id-token: write` (для actions/deploy-pages).
  - Concurrency group `deploy`, `cancel-in-progress: false`.
  - Jobs:
    - `build`: checkout `nv-lang/www` → setup-node@v4 (Node 24,
      cache npm) → `npm ci` в upstream/site/ → `npm run build` →
      post-process в `upstream/site/dist/`:
      - CNAME override на `nv-lang.ru`
      - Inject ru-RU hreflang в каждый HTML с canonical
        (idempotent: skip если уже есть; skip noindex; skip 404.html)
      - sitemap.xml: `sed s|nv-lang.org|nv-lang.ru|g`
      - Upload artifact (actions/upload-pages-artifact@v3, path:
        upstream/site/dist).
    - `deploy`: needs build → deploy-pages@v4.
- **Ф.1.2** Обновить README.md в `www.nv-lang.ru/` — описать новую
  схему (build + deploy, не sync через rsync).
- **Ф.1.3** Можно опц. cleanup'нуть main .ru от accumulated sync
  commits (`git rm` всего, кроме .github/.gitignore/README/LICENSE)
  — отложить до подтверждения работы deploy.

### Ф.2 — Pages mode switch + smoke test (~0.1 д, **manual**)

> Это steps пользователя в GitHub UI, не Claude.

- **Ф.2.1** Settings → Pages → Build and deployment → Source →
  «GitHub Actions».
- **Ф.2.2** Actions → run `Sync from nv-lang/www` через
  `workflow_dispatch`.
- **Ф.2.3** Если success → проверить https://nv-lang.ru/:
  - Главная отдаёт built HTML (не README).
  - `view-source` показывает `hreflang="ru-RU"` указывающий на .ru.
  - Canonical остаётся → .org.
  - `nv-lang.ru/sitemap.xml` содержит .ru URL.
- **Ф.2.4** Если success → enable cron в workflow (separate commit
  или uncomment line).

### Ф.3 — Google Search Console (~0.05 д, manual)

- **Ф.3.1** Добавить `nv-lang.ru` как property (если не добавлено).
  Verify через DNS TXT (CF dashboard).
- **Ф.3.2** Submit sitemap `nv-lang.ru/sitemap.xml`.
- **Ф.3.3** Через 1-2 недели проверить — индексирует ли Google
  .ru-страницы для RU-locale queries.

### Ф.4 — Cleanup старых sync commits в main (опц., ~0.05 д)

После подтверждения что Pages deploy работает:
- Очистить .ru main от accumulated rsync source. Оставить только:
  - `.github/workflows/sync-from-www.yml`
  - `.gitignore`
  - `README.md` (обновлённый)
  - `LICENSE`
- `git rm -r site/ plans/ CLAUDE.md` + commit.
- main становится чистым; вся история до cleanup сохраняется в git.

## Acceptance criteria

- [ ] Новый workflow проходит build + deploy через `workflow_dispatch`.
- [ ] `https://nv-lang.ru/` возвращает built HTML (не README, не 404).
- [ ] На каждой .ru-странице `hreflang="ru-RU"` указывает на .ru/{path}.
- [ ] Canonical остаётся → .org.
- [ ] sitemap.xml на .ru содержит .ru URL.
- [ ] CNAME на .ru = `nv-lang.ru` (override применился).
- [ ] Workflow идемпотентен: повторный run не ломает.
- [ ] Cron включён после успешного manual test.
- [ ] README .ru обновлён под новую схему.
- [ ] Опц.: main .ru очищен от source (Ф.4).

## Non-scope

- **Дифференциация контента .ru от .org** (РФ-специфичный баннер
  про реестр ПО, FASIE-нарратив) — future-план.
- **Geo-routing** (РФ-IP → .ru, остальные → .org) — отдельная
  задача, нужен CDN с geo-логикой.
- **Локализация .ru-only страниц** — отдельный план.
- **Удаление зеркала / переход на редирект** — explicitly отвергнуто
  (fallback при блокировке критичен).

## Открытые вопросы

- **Q1: Free tier Actions** — public-repo unlimited; private-repo
  2000 min/мес. Build ≈ 1-2 мин (с cache); 96 runs/день × 1.5 min
  = 4320 min/мес → **превысит free** если private. **Решение:** .ru
  repo public (зеркало public www), unlimited.
- **Q2: Frequency cron** — 15 мин может быть избыточно. Sync с .org
  в реальности не меняется чаще раза в день. Можно `*/30` или `0 *
  * * *` (hourly). **Решение:** оставить */15 для consistency с
  старым контрактом; снизить если рейт-лимит беспокоит.
- **Q3: Cleanup main (Ф.4)** — делать или нет? **Решение:** делать
  отдельным коммитом после успешного deploy, чтобы main был чистым
  и offered as docs/code source если решим что-то в main класть.

## Связь

- [www-01](www-01-prod-hardening.md) — hreflang base.
- [www-02](www-02-astro-migration.md) — Astro генерирует canonical/hreflang.
- [www-04](www-04-revenue-pages.md) — новые страницы, на которые
  ru-RU hreflang применится автоматически при следующем deploy.
- «Отечественное ПО» / импортозамещение narrative для РФ-аудитории
  (рассматривается во внутренней стратегической документации,
  вне этого репо) — для него .ru SEO-присутствие важно.

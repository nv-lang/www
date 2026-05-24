// SPDX-License-Identifier: MIT OR Apache-2.0
# Plan www-04: Revenue-страницы — /course/, /newsletter/, /support/, /sponsors/

> **Статус:** 📋 proposed 2026-05-24, не начат.
> **Приоритет:** P1 (нужно для CTA пилотной статьи Habr).
> **Трудоёмкость:** ~1 dev-day (4 страницы × EN+RU + Cloudflare Worker + nav).
> **Репо:** `d:\Sources\nv-lang\www\`
> **Предшественники:** [www-01](www-01-prod-hardening.md) ✅, [www-02](www-02-astro-migration.md) ✅, [www-03](www-03-design-polish.md) ✅.
> **Источник:** `nova-private/docs/plans/04-monetization.md` раздел 6.4 (предпродажа курса) + раздел 5 (Boosty/GH Sponsors инфра) + automation/runbooks/publish-article.md (CTA в email-лист).

## Зачем

Пилотная статья Habr ([habr-1.1-pilot-draft-v5.md](https://github.com/nv-lang/nova-private)) и серия публикаций требуют **CTA в email-лист**, не только в репо. Главный KPI revenue-трека из плана монетизации — рост email-листа. Без лендингов CTA некуда вести.

Параллельно — `/support/` (Boosty / GH Sponsors) для бэкеров и `/sponsors/` (после релиза 0.1, заготовка) для корп-партнёров.

## Scope

**Входит:**

- `/course/` + `/ru/course/` — лендинг waitlist курса «AI-инженерия на масштабе»
- `/newsletter/` + `/ru/newsletter/` — подписка на еженедельный newsletter
- `/support/` + `/ru/support/` — GH Sponsors + placeholder для Boosty
- `/sponsors/` + `/ru/sponsors/` — заготовка с note «активируется после релиза 0.1» (не публикуется в навигации до 0.1)
- **Cloudflare Worker** в отдельном репо (или suborg) — proxy для Resend/Sender API, чтобы API-key не светился в публичном JS
- Vanilla JS email-form компонент (один на 3 лендинга)
- Обновление `Header.astro` и `Footer.astro` — линки Course / Newsletter / Support

**Не входит:**

- Сам контент курса / newsletter (это revenue-track в nova-private/automation/, не www).
- Payment processing (это Boosty / GH Sponsors / ЮKassa напрямую, не наша инфра).
- Tier-схема для /sponsors/ (правило монетизации: не делать без 3+ спонсоров).
- A/B тестирование (future).
- Тёплый редизайн существующих лендингов конкурентов (отдельная задача).

## Целевая структура

```
www/site/src/
├── pages/
│   ├── course/index.astro              ← EN лендинг курса
│   ├── newsletter/index.astro          ← EN лендинг newsletter
│   ├── support/index.astro             ← EN страница поддержки
│   ├── sponsors/index.astro            ← EN страница (закрытая, noindex до 0.1)
│   └── ru/
│       ├── course/index.astro          ← RU лендинг
│       ├── newsletter/index.astro
│       ├── support/index.astro
│       └── sponsors/index.astro
├── partials/
│   ├── course-en.html
│   ├── course-ru.html
│   ├── newsletter-en.html
│   ├── newsletter-ru.html
│   ├── support-en.html
│   ├── support-ru.html
│   ├── sponsors-en.html                ← заготовка с note
│   └── sponsors-ru.html
└── components/
    └── EmailForm.astro                 ← переиспользуемая форма (или vanilla JS в partials)

public/js/
└── email-subscribe.js                  ← vanilla JS, fetch к Worker
```

Cloudflare Worker — отдельно от www репо (либо отдельный приватный репо `nv-lang/email-worker`, либо в `nova-private/cloudflare-worker/`). Содержит API-keys в env, реквесты с .org/.ru фильтруются через CORS.

## Фазы

### Ф.0 — Дизайн и контент-наброски (GATE, ~0.25 д)

- **Ф.0.1** Финальные тексты партиалов EN + RU. Контент:
  - **Course:** название, обещание (3-5 пунктов), целевая аудитория (middle/senior devs/teamleads), дата первого потока («Q1 2027» placeholder), цена («20-30k ₽ early-bird»), форма waitlist.
  - **Newsletter:** обещание (еженедельный insight по AI-инженерии), что внутри (3-4 пункта), форма подписки.
  - **Support:** GitHub Sponsors (`github.com/sponsors/unitcraft` если активен; placeholder если нет), «Поддержка через Boosty — в процессе настройки», ссылка на репо.
  - **Sponsors:** «Корпоративное спонсорство Nova откроется после релиза 0.1» + контакт `unitcraft@nv-lang.org` для предварительных обсуждений.
- **Ф.0.2** Скриншоты-mockup'ы (опц.) — для визуальной согласованности с существующим дизайном (`/install/`, `/doc/`).
- **Ф.0.3** Решение по `<title>` и meta-description для каждой страницы (SEO-критично).

### Ф.1 — Cloudflare Worker (email subscription proxy, ~0.25 д)

- **Ф.1.1** Создать репо `nv-lang/email-worker` (или директорию в nova-private). Содержит:
  - `wrangler.toml` — конфиг.
  - `src/index.ts` — Worker handler: принимает POST `/subscribe { email, source }`, валидирует email, форвардит на Resend/Sender API.
  - CORS: разрешает Origin `https://nv-lang.org` и `https://nv-lang.ru` только.
  - Rate limiting (basic): не более 1 запроса/сек с одного IP.
  - Дедупликация: проверка через Resend API «уже подписан?» перед вторым welcome.
- **Ф.1.2** Деплой Worker на CF — endpoint `https://email.nv-lang.org/subscribe` (через CF DNS routing).
- **Ф.1.3** Хранить API-keys в CF Worker env (Resend API key, optional Sender API key).
- **Ф.1.4** Smoke-test через `curl`.

### Ф.2 — Скелет страниц и общая структура (~0.1 д)

- **Ф.2.1** Создать пустые `.astro` файлы по структуре выше + соответствующие пустые партиалы. Каждый `.astro` — тонкая обёртка `BaseLayout` с правильными мета-тегами (canonical, hreflang, og, twitter).
- **Ф.2.2** Проверка: `npm run build` собирается, новые URL появляются в `dist/`, no broken links.

### Ф.3 — Партиалы EN + RU (~0.3 д)

- **Ф.3.1** `course-en.html` — лендинг по контенту Ф.0.1.
- **Ф.3.2** `course-ru.html` — RU-перевод (не машинный — локализация).
- **Ф.3.3** `newsletter-en.html` + `newsletter-ru.html`.
- **Ф.3.4** `support-en.html` + `support-ru.html`.
- **Ф.3.5** `sponsors-en.html` + `sponsors-ru.html` — заготовка с «activates after 0.1» message.

### Ф.4 — Email-форма и интеграция (~0.15 д)

- **Ф.4.1** `public/js/email-subscribe.js` — vanilla JS, ~50 LOC: ловит form submit, POST'ит на Worker, показывает success/error message без перезагрузки страницы.
- **Ф.4.2** HTML-разметка формы в `course-en.html`, `newsletter-en.html`, `support-en.html` (и RU-версиях). Поля: `email` (required) + опц. `source` (hidden, для сегментации).
- **Ф.4.3** CSS — добавить минимальные стили формы в `global.css` (или inline в партиалах).
- **Ф.4.4** Привязать `email-subscribe.js` в `BaseLayout.astro` как `is:inline` (по аналогии с `nova-highlight.js`).

### Ф.5 — Навигация (~0.05 д)

- **Ф.5.1** `Header.astro`: добавить ссылки `Course / Newsletter / Support` после `Blog`. Активный класс по `active`-prop как у текущих.
- **Ф.5.2** `Footer.astro`: добавить колонку «Support Nova» с теми же ссылками + GitHub.
- **Ф.5.3** **НЕ добавлять `/sponsors/` в навигацию** до релиза 0.1 (правило монетизации). Добавляется отдельным PR после релиза.

### Ф.6 — SEO + sitemap + a11y (~0.1 д)

- **Ф.6.1** Обновить `public/sitemap.xml` — добавить новые URL.
- **Ф.6.2** Для `/sponsors/` — `noindex: true` в frontmatter (так как закрытая до 0.1).
- **Ф.6.3** Verify hreflang-пары: каждая EN-страница ссылается на RU, и наоборот.
- **Ф.6.4** Verify `skip-link` работает на новых страницах.
- **Ф.6.5** Verify focus-visible работает на email-форме.

### Ф.7 — Тесты, аудит, деплой (~0.1 д)

- **Ф.7.1** `npm run build` — 0 ошибок.
- **Ф.7.2** Postbuild link-checker — 0 битых внутренних ссылок и якорей.
- **Ф.7.3** `npm run check` — TypeScript clean.
- **Ф.7.4** Smoke-test через `npm run preview`:
  - Открыть `/course/` — форма видна, валидна, mock-submit.
  - Открыть `/ru/course/` — RU-версия.
  - `/newsletter/`, `/support/` — то же.
  - `/sponsors/` доступна по прямой ссылке, но `<meta name="robots" content="noindex">`.
- **Ф.7.5** E2E: реальный submit через форму → Worker → Resend → проверить email пришёл.
- **Ф.7.6** Merge в `main`, CI деплоит.

## Cutover

Стандартный для www репо: merge в `main` → push → GitHub Action собирает Astro → деплоит в Pages → nv-lang.org обновился в течение ~2 мин.

После cutover — sync workflow для .ru синкает страницы автоматически в течение 15 мин.

## Acceptance criteria

- [ ] 4 страницы доступны на `nv-lang.org/course/`, `/newsletter/`, `/support/`, `/sponsors/` (+ RU-аналоги).
- [ ] Email-форма работает end-to-end: submit → Cloudflare Worker → Resend → welcome-email.
- [ ] `/sponsors/` имеет `noindex`, не появляется в sitemap, не в навигации.
- [ ] Header/Footer обновлены, активный класс работает.
- [ ] `npm run build` 0/0/0; link-checker 0 битых.
- [ ] CORS Worker фильтрует — POST с других доменов отклоняется.
- [ ] Rate limiting Worker — не более 1 req/сек с одного IP.
- [ ] Sync на .ru проходит чисто.

## Non-scope

- Контент курса (это `nova-private/automation/`).
- Payment-инфраструктура (это Boosty/ЮKassa напрямую).
- Tier-схема /sponsors/ (правило монетизации).
- A/B тесты (future).
- Дизайнерская полировка лендингов до конкурентного уровня (Stripe Atlas, Maven и т.п.) — это www-06+ задача.

## Открытые вопросы

- **Q1: GitHub Sponsors profile** для `unitcraft` — активен ли уже? Если нет, нужно ли активировать в Ф.0?
- **Q2: Boosty placeholder text** — «настройка в процессе» (нейтрально) vs «откроется через N недель» (даёт expectation)? **Решение:** нейтрально — Boosty будет настроен по плану монетизации, точная дата не критична.
- **Q3: ESP** (email service provider) для Worker — Resend (developer-friendly) или Sender (RU-friendly, лучше для местной аудитории)? **Решение:** Resend в Ф.1, Sender как опция позже если нужны RU-специфичные фичи.
- **Q4: Email отправителя welcome-1** — `noreply@nv-lang.org` или `evgeniy@nv-lang.org` (личный)? Личный даёт engagement, но требует мониторинга. **Решение:** `hello@nv-lang.org` (нейтрально-личный, можно роутить в `unitcraft@nv-lang.org`).
- **Q5: Tracking** — нужна ли минимальная аналитика на лендингах (Plausible, Umami) или достаточно server-side через Worker logs? **Решение:** server-side через Worker logs в Ф.1 — без third-party JS на сайте (правило «0 JS by default» из www-02).

## Риски

| Риск | Митигация |
|---|---|
| Worker API-key утечка | Хранение только в CF env, никогда в репо; периодическая ротация |
| Spam подписки через форму | Honeypot field + rate limiting в Worker + Resend dedup |
| CORS misconfiguration | Тщательный test через `curl` с фейк-Origin в Ф.1.4 |
| Email-провайдер блокирует или дорожает | Worker абстрагирует — смена ESP = смена одной env-var |
| .ru sync не подхватит новые страницы | Sync копирует всё → новые pages автоматически попадают; verify в Ф.7 |
| `/sponsors/` случайно индексируется | `noindex` + не в sitemap + не в навигации = 3 уровня защиты |

## Связь

- [www-01](www-01-prod-hardening.md) — SEO/CSP/a11y база, наследуем.
- [www-02](www-02-astro-migration.md) — Astro инфра.
- [www-03](www-03-design-polish.md) — дизайн polish, applies to new pages.
- [www-05](www-05-ru-mirror-seo.md) — параллельный план: ru-RU hreflang для .ru.
- `nova-private/docs/plans/04-monetization.md` раздел 4 (двухтрековый план), раздел 5 (канал A — физлица + подписки), раздел 6.2 (курс + предпродажа).
- `nova-private/automation/agents/funnel.md` — В-агент управляет содержимым этих страниц после деплоя.
- `nova-private/automation/agents/content.md` — К-агент публикует blog-посты через PR в этот же репо (`site/src/pages/blog/`).
- `nova-private/automation/runbooks/publish-article.md` — workflow публикации, ссылается на nv-lang.org/blog/ как canonical для Habr-репостов.

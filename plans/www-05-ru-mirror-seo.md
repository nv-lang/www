// SPDX-License-Identifier: MIT OR Apache-2.0
# Plan www-05: SEO зеркала nv-lang.ru — ru-RU hreflang

> **Статус:** 📋 proposed 2026-05-24, не начат.
> **Приоритет:** P2 (улучшение, не блокер).
> **Трудоёмкость:** ~0.25 dev-day (правка sync-workflow в .ru repo + verify).
> **Репо:** `d:\Sources\nv-lang\www.nv-lang.ru\` (правка workflow); опц. `d:\Sources\nv-lang\www\` (документация).
> **Предшественники:** [www-01](www-01-prod-hardening.md) ✅ (SEO база), [www-02](www-02-astro-migration.md) ✅ (Astro генерация canonical/hreflang).
> **Источник:** обсуждение mirror vs redirect 2026-05-24.

## Зачем

Текущая sync-стратегия копирует контент с `nv-lang.org` → `nv-lang.ru` через GitHub Action (15-мин cron). Все canonical и hreflang в HTML указывают на `nv-lang.org` (как и должно быть — Astro генерирует с `site: 'https://nv-lang.org'`).

**Последствие:** Google понимает .ru как **дубль .org** и **не индексирует** .ru-страницы — они служат только fallback'ом при блокировке .org. Это плохо для:
- Российской аудитории, которая ищет через Yandex / Google.ru.
- Нарратива «отечественный язык программирования» — РФ-домен должен иметь SEO-присутствие.

**Решение:** добавить `<link rel="alternate" hreflang="ru-RU" href="https://nv-lang.ru/{path}">` на .ru-страницах. Это сигнализирует Google: «для русскоязычных пользователей из РФ — версия на .ru».

**Что НЕ меняется:**
- Canonical остаётся → .org (consolidate SEO, нет duplicate-penalty).
- Все остальные hreflang (`ru`, `en`, `x-default`) → .org (Google понимает RU-локаль есть и на .org/ru/).
- Контент идентичен на обоих доменах (полное зеркало).

**Почему не редирект:**
- Fallback при блокировке .org критичен для РФ-проекта в 2026.
- РФ-аудитория видит локальный URL (.ru) — психологически лучше для импорто-замещения narrative.
- Текущая sync-инфра уже работает.

## Целевое состояние HTML на .ru

**До (текущее):**
```html
<link rel="canonical" href="https://nv-lang.org/install/">
<link rel="alternate" hreflang="ru" href="https://nv-lang.org/ru/install/">
<link rel="alternate" hreflang="en" href="https://nv-lang.org/install/">
<link rel="alternate" hreflang="x-default" href="https://nv-lang.org/install/">
```

**После (добавляется на .ru-pages):**
```html
<link rel="canonical" href="https://nv-lang.org/install/">  <!-- unchanged -->
<link rel="alternate" hreflang="ru" href="https://nv-lang.org/ru/install/">  <!-- unchanged -->
<link rel="alternate" hreflang="en" href="https://nv-lang.org/install/">  <!-- unchanged -->
<link rel="alternate" hreflang="x-default" href="https://nv-lang.org/install/">  <!-- unchanged -->
<link rel="alternate" hreflang="ru-RU" href="https://nv-lang.ru/install/">  <!-- NEW -->
```

Один новый тег, один на каждой странице (28+ pages в HTML).

## Фазы

### Ф.0 — Audit текущего sync (GATE, ~0.05 д)

- **Ф.0.1** Проверить `.github/workflows/sync-from-www.yml` в www.nv-lang.ru — текущее поведение rsync.
- **Ф.0.2** Sample одной HTML-страницы из последнего sync — confirm canonical/hreflang state.
- **Ф.0.3** Решение: где добавлять `ru-RU` hreflang:
  - **Option A:** post-processing в sync workflow (sed-замена).
  - **Option B:** добавить `ru-RU` hreflang в Astro Head.astro как conditional (если `lang === 'ru'`, добавить `ru-RU → nv-lang.ru`).
  - **Решение:** Option A — изменения только в .ru workflow, не трогаем основной сайт. Astro Head.astro знает только про .org, что чисто.

### Ф.1 — Sync workflow modification (~0.1 д)

- **Ф.1.1** В `.github/workflows/sync-from-www.yml` после rsync и перед commit, добавить step «Inject ru-RU hreflang». Псевдо-код:

```yaml
- name: Inject ru-RU hreflang
  run: |
    # Для каждого .html файла:
    # - найти <link rel="alternate" hreflang="x-default" href="https://nv-lang.org/{path}">
    # - после неё вставить <link rel="alternate" hreflang="ru-RU" href="https://nv-lang.ru/{path}">
    # 
    # path извлекается из x-default href (заменой домена)
    
    find . -name '*.html' -not -path './.git/*' -not -path './.github/*' | while read f; do
      # Extract canonical path
      canonical_url=$(grep -oP '<link rel="canonical" href="\K[^"]+' "$f" | head -1)
      [ -z "$canonical_url" ] && continue
      path="${canonical_url#https://nv-lang.org}"
      ru_url="https://nv-lang.ru${path}"
      
      # Skip if ru-RU already there (idempotent)
      grep -q 'hreflang="ru-RU"' "$f" && continue
      
      # Insert after x-default
      sed -i "s|<link rel=\"alternate\" hreflang=\"x-default\"[^>]*>|&<link rel=\"alternate\" hreflang=\"ru-RU\" href=\"${ru_url}\">|" "$f"
    done
```

- **Ф.1.2** Решить edge cases:
  - Страницы без canonical (если есть) — пропускать.
  - Страницы с `noindex` — пропускать (нет смысла в hreflang для noindex).
  - 404.html — пропускать.

### Ф.2 — Smoke test (~0.05 д)

- **Ф.2.1** Триггер `workflow_dispatch` руками.
- **Ф.2.2** Проверить commit в .ru: для одной страницы — `grep hreflang` показывает все 5 тегов (4 старых + `ru-RU` новый).
- **Ф.2.3** Открыть на живом домене `https://nv-lang.ru/` (через несколько минут после deploy) — `view-source` → 5 hreflang.
- **Ф.2.4** Google Search Console: добавить .ru как property (если ещё не добавлено), submit sitemap, проверить через 1-2 недели — индексирует ли Google .ru-страницы для RU-queries.

### Ф.3 — Документация политики mirror (~0.05 д)

- **Ф.3.1** Обновить `www.nv-lang.ru/README.md`:
  - Добавить раздел «SEO policy: .ru как mirror с ru-RU hreflang. Canonical на .org для consolidation, hreflang ru-RU для РФ-locale».
  - Объяснить, что **редактировать ничего вручную не нужно** — workflow всё делает.
- **Ф.3.2** Обновить `nv-lang/www/CLAUDE.md` (опц.) — добавить note про mirror behavior, чтобы будущие изменения hreflang в основном сайте не сломали .ru.

### Ф.4 — Sitemap обновление (опц., ~0.05 д)

Зеркало копирует sitemap.xml с .org URL внутри. Это работает для Google Search Console .org property, но для .ru property — нужен **отдельный sitemap** с .ru URL.

- **Ф.4.1** В sync workflow добавить step «Regenerate sitemap for .ru»:
  ```bash
  # Заменить все вхождения nv-lang.org → nv-lang.ru в sitemap.xml
  sed -i 's|https://nv-lang.org|https://nv-lang.ru|g' sitemap.xml
  ```
- **Ф.4.2** Verify: `view-source:https://nv-lang.ru/sitemap.xml` показывает .ru URL.

> **Note:** Ф.4 — optional. Можно сделать в Ф.1 как часть workflow, либо отдельным заходом если SEO потребует.

## Acceptance criteria

- [ ] На каждой .ru-странице есть `hreflang="ru-RU"` указывающий на саму себя (`.ru/{path}`).
- [ ] Все остальные hreflang остаются как были (на .org).
- [ ] Canonical остаётся на .org.
- [ ] Sitemap.xml на .ru указывает на .ru URL.
- [ ] Workflow идемпотентен: повторный sync не дублирует hreflang.
- [ ] Через 1-2 недели Google Search Console показывает .ru-страницы в индексе для RU-locale queries.

## Cutover

Workflow auto-trigger каждые 15 мин. После merge в `main` .ru repo — следующий sync применит изменения.

## Non-scope

- **Дифференциация контента .ru от .org** (РФ-специфичный баннер про реестр ПО, FASIE-нарратив, etc.) — отдельный future-план, после оформления юр.лица.
- **Geo-routing** (РФ-IP → .ru, остальные → .org) — отдельная задача, нужен CDN с geo-логикой.
- **Локализация .ru-only страниц** (например `/о-проекте/`, `/реестр-по/`) — отдельный план если решим дифференцировать.
- **Удаление зеркала / переход на редирект** — explicitly отвергнуто (fallback при блокировке критичен).

## Открытые вопросы

- **Q1: Идемпотентность sed-замены** — что если Astro в будущем поменяет порядок hreflang-тегов? Sed станет fragile. **Митигация:** регулярное проверять формат HTML после Astro-обновлений; написать тест который sanity-check'ает hreflang count.
- **Q2: Google Search Console** — .ru property требует verification. Кто владеет .ru DNS? Если CF — добавить TXT-запись. **Решение:** добавить как часть Ф.2.4.

## Связь

- [www-01](www-01-prod-hardening.md) — hreflang base.
- [www-02](www-02-astro-migration.md) — Astro генерирует canonical/hreflang.
- [www-04](www-04-revenue-pages.md) — новые страницы, на которые ru-RU hreflang тоже применится автоматически.
- `nova-private/docs/plans/04-monetization.md` раздел 9 — «отечественное ПО» нарратив, для которого .ru SEO важен.

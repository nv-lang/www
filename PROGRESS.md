# p-install — актуализация /install/ (2026-08-02)

Задание: `nova/docs/promts/site-agent.md`, «Первоочередная задача».
Ветка `p-install` от `origin/main`, worktree `d:/Sources/nv-lang/www-install`.

## Сделано
- (а) `git clone --recursive` + строка про `git submodule update --init`
  (libuv = сабмодуль `compiler-codegen/nova_rt/libuv`, подтверждено по
  `.gitmodules`) — en + ru.
- (б) Шаг тестов: `nova test nova_tests` → `nova test spec_tests/conformance`
  с честной пометкой о длительности (десятки минут) и советом проверить
  тулчейн сборкой hello-world — en + ru. Финальную формулировку утверждает
  интегратор на приёмке.
- (в) Релиз-нейтральность: ru-футер «Релизы» (github releases) →
  «Обсуждения»; en-футер «Changelog» (CHANGELOG.md в nova НЕ существует —
  битая ссылка) → «Roadmap» (docs/plans). Остальные партиалы проверены
  грепом (releases/CHANGELOG/download/released) — чисты.
- Находка + фикс страницы: `nova build` вне Nova-workspace падает
  «nova.toml not found» → добавлена пометка «hello.nv создавать в корне
  клона» (en + ru). Сниппеты hello и greet(Io) проверены реальным
  компилятором (nova build + запуск) — печатают ожидаемое.

## В процессе
- (г) Чистый клон с GitHub + `cargo build --release` дословно по шагам
  страницы — фоновая задача в `d:/Sources/install-smoke`.
- `npm run build` / `check` / `check:highlight` — предстоит.

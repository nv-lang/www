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

## (г) Проверка чистым клоном — ВЫПОЛНЕНА, находка A-V7-класса
Чистый клон `git clone --recursive` с GitHub в `d:/Sources/nv-lang/install-smoke`
(вне реп, внутри nv-lang по правилу владельца):
- клон + сабмодуль libuv — OK; `cargo build --release` в `nova-cli` — OK;
- `nova build hello.nv -o hello` в корне клона: libuv собрался сам
  («one-time, ~30 sec»), затем **FATAL: Boehm GC (gc.lib) not found** —
  gc.lib НЕ в гите; vcpkg-манифеста (`compiler-codegen/vcpkg.json`) в репе
  нет, vcpkg у чистого пользователя не установлен и нигде не документирован;
- с `NOVA_GC_LIB_DIR`/`NOVA_GC_INCLUDE_DIR` на vcpkg_installed основной
  репы тот же клон собирает и печатает «Hello, Nova!» — gc.lib =
  ЕДИНСТВЕННЫЙ недостающий кусок.
По заданию НЕ чинил; на страницу добавлена честная пометка в prerequisites
(en+ru): Boehm GC пока не поставляется, без него `nova build` остановится
с платформенными инструкциями.

## Приёмка (все зелёные)
- `npm run build` — OK (55 страниц проиндексировано, check-links чист),
  дважды: после первой и после второй волны правок.
- `npm run check` — 0 errors, 0 warnings, 16 hints (pre-existing Zod).
- `npm run check:highlight` — OK (51 keyword, D278).

## Попутные находки (не чинил — доклад)
- В корне публичной репы nova закоммичены `CHECKPOINT_234.md`,
  `CHECKPOINT_nestmono.md` — выглядит как случайный wip.
- Ссылки «Editor setup» (/install/): VS Code marketplace
  `nv-lang.nova-vscode`, JetBrains `plugins.jetbrains.com/plugin/nova-lang`,
  `github.com/nv-lang/tree-sitter-nova` — существование не проверял
  (check-links внешние не валит?); если расширения не опубликованы —
  кандидат на релиз-нейтральную правку той же категории, решение за
  интегратором.

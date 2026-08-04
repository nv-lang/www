// СГЕНЕРИРОВАНО scripts/sync-decisions.mjs из docs/guide/PUBLISHED.list
// репозитория nova (№307). Руками не править — правь источник в nova.
import type { DocGuide } from './docs';

export const DOC_GUIDES_GENERATED: DocGuide[] = [
  {
    "slug": "authoring-a-module",
    "github": "docs/guide/authoring-a-module.md",
    "title": {
      "en": "How to author a Nova module",
      "ru": "Как создать модуль Nova"
    },
    "description": {
      "en": "How to author a Nova module",
      "ru": "Как создать модуль Nova"
    }
  },
  {
    "slug": "auto-derive-guide",
    "github": "docs/guide/auto-derive-guide.md",
    "title": {
      "en": "Auto-derive Guide (Plan 126, D109 amend + D230)",
      "ru": "Auto-derive Guide (Plan 126, D109 amend + D230)"
    },
    "description": {
      "en": "Nova supports auto-derive for five built-in protocols via an #impl(P) annotation on a user-defined type. An analog of Rust's #[derive(...)] with no separate keyword — the same #impl(P) mechanism…",
      "ru": "Nova поддерживает auto-derive для пяти built-in протоколов через #impl(P) annotation на пользовательском типе. Аналог Rust #[derive(...)] без отдельного keyword'а — переиспользуется единый…"
    }
  },
  {
    "slug": "building-from-source",
    "github": "docs/guide/building-from-source.md",
    "title": {
      "en": "Building from source",
      "ru": "Сборка из исходников"
    },
    "description": {
      "en": "Build the nova CLI, then use it to compile Nova programs:",
      "ru": "Соберите nova CLI, затем используйте его для компиляции Nova-программ:"
    }
  },
  {
    "slug": "channels",
    "github": "docs/guide/channels.md",
    "title": {
      "en": "Channels and `select` in Nova",
      "ru": "Каналы и `select` в Nova"
    },
    "description": {
      "en": "Channel[T] is the primary inter-fiber communication primitive. The model is capability-split (Rust mpsc-style): Channel.new(cap) returns a pair of objects with split capabilities — ChanWriter[T]…",
      "ru": "Channel[T] — основной примитив межфибровой коммуникации. Модель —"
    }
  },
  {
    "slug": "cleanup-cookbook",
    "github": "docs/guide/cleanup-cookbook.md",
    "title": {
      "en": "Cleanup Cookbook — production recipes for `consume X = expr { body }`",
      "ru": "Cleanup Cookbook — production-рецепты для `consume X = expr { body }`"
    },
    "description": {
      "en": "Cleanup Cookbook — production recipes for `consume X = expr { body }`",
      "ru": "Cleanup Cookbook — production-рецепты для `consume X = expr { body }`"
    }
  },
  {
    "slug": "consume-types",
    "github": "docs/guide/consume-types.md",
    "title": {
      "en": "Consume-types in Nova",
      "ru": "Потребляемые типы в Nova"
    },
    "description": {
      "en": "A consume-type is a type whose values represent ownership of a non-shareable resource — file handle, mutex guard, builder buffer, network socket.  Values cannot be copied, aliased, or implicitly…",
      "ru": "Потребляемые типы в Nova"
    }
  },
  {
    "slug": "contracts",
    "github": "docs/guide/contracts.md",
    "title": {
      "en": "Contracts and formal verification in Nova",
      "ru": "Контракты и формальная верификация в Nova"
    },
    "description": {
      "en": "Nova's contract system lets you state what a function requires and",
      "ru": "Система контрактов Nova позволяет описать, что функция требует и"
    }
  },
  {
    "slug": "datetime",
    "github": "docs/guide/datetime.md",
    "title": {
      "en": "Civil (calendar) time in Nova — `std/time/civil`",
      "ru": "Гражданское (календарное) время в Nova — `std/time/civil`"
    },
    "description": {
      "en": "\"2026-07-10 14:30\" is NOT an instant: in Tokyo and New York it arrives at a different time. So Plain → Timestamp only through an explicit zone + a DST resolution policy, and it's fallible…",
      "ru": "«2026-07-10 14:30» — это НЕ момент: в Токио и Нью-Йорке он наступает в разное время. Поэтому Plain → Timestamp только через явную зону + политику разрешения DST, и это fallible (Result). Неявной…"
    }
  },
  {
    "slug": "embed",
    "github": "docs/guide/embed.md",
    "title": {
      "en": "Embedding files and directories into the binary: `embed` / `embed_dir`",
      "ru": "Встраивание файлов и папок в бинарь: `embed` / `embed_dir`"
    },
    "description": {
      "en": "Embedding files and directories into the binary: `embed` / `embed_dir`",
      "ru": "Встраивание файлов и папок в бинарь: `embed` / `embed_dir`"
    }
  },
  {
    "slug": "ffi-cookbook",
    "github": "docs/guide/ffi-cookbook.md",
    "title": {
      "en": "Nova FFI Cookbook",
      "ru": "Nova FFI Cookbook"
    },
    "description": {
      "en": "This cookbook shows how to bind Nova code to third-party C libraries — sqlite3, libpng, libcurl — using the foundational FFI primitives introduced in Plan 115.",
      "ru": "Этот cookbook показывает, как привязать Nova-код к сторонним C-библиотекам — sqlite3, libpng, libcurl — с помощью фундаментальных FFI-примитивов, введённых в Плане 115."
    }
  },
  {
    "slug": "field-cache-optimization",
    "github": "docs/guide/field-cache-optimization.md",
    "title": {
      "en": "Field-cache optimization — user guide",
      "ru": "Оптимизация field-cache — руководство пользователя"
    },
    "description": {
      "en": "Nova compiler automatically caches @field reads and @<puremethod>() calls in method bodies, eliminating redundant self->X pointer dereferences in the generated .c output. Hot-path methods…",
      "ru": "Компилятор Nova автоматически кэширует чтения @field и вызовы @<puremethod>() в телах методов, устраняя избыточные разыменования указателей self->X в генерируемом .c-выводе. Методы на горячем пути…"
    }
  },
  {
    "slug": "field-visibility-guide",
    "github": "docs/guide/field-visibility-guide.md",
    "title": {
      "en": "Field visibility guide (`priv` modifier)",
      "ru": "Гайд по видимости полей (модификатор `priv`)"
    },
    "description": {
      "en": "This guide covers Nova's per-field privacy system — when to use priv, how it composes with other modifiers, tool support, and comparison with mainstream languages.",
      "ru": "Этот гайд описывает систему приватности отдельных полей Nova — когда использовать priv, как он сочетается с другими модификаторами, инструментальную поддержку и сравнение с мейнстримными языками."
    }
  },
  {
    "slug": "io-fs",
    "github": "docs/guide/io-fs.md",
    "title": {
      "en": "I/O, filesystem, and OS in Nova",
      "ru": "I/O, файловая система и ОС в Nova"
    },
    "description": {
      "en": "I/O, filesystem, and OS in Nova",
      "ru": "I/O, файловая система и ОС в Nova"
    }
  },
  {
    "slug": "language-tour",
    "github": "docs/guide/language-tour.md",
    "title": {
      "en": "Nova language tour",
      "ru": "Экскурсия по языку Nova"
    },
    "description": {
      "en": "A working tour of Nova for a reader who has never seen the language — not the full specification. Every example on this page is a real, compiling, running .nv file (nova build + running the…",
      "ru": "Рабочая экскурсия по Nova для читателя, который никогда не видел язык, — не полная спецификация. Каждый пример на этой странице — реальный, компилирующийся и запускаемый .nv-файл (nova build +…"
    }
  },
  {
    "slug": "linux-build",
    "github": "docs/guide/linux-build.md",
    "title": {
      "en": "Building Nova on Linux (native / WSL2)",
      "ru": "Сборка Nova на Linux (native / WSL2)"
    },
    "description": {
      "en": "Last updated 2026-07-21. Verified 2026-07-20 directly on WSL2 Ubuntu 26.04 (kernel 6.6.87.2-microsoft-standard-WSL2), outside Docker. See also",
      "ru": "Обновлено 2026-07-21. Проверено 2026-07-20 непосредственно на WSL2 Ubuntu 26.04 (ядро 6.6.87.2-microsoft-standard-WSL2), вне Docker. См. также [docker/README.md](../../docker/README.md) для более…"
    }
  },
  {
    "slug": "nova-cli",
    "github": "docs/guide/nova-cli.md",
    "title": {
      "en": "Nova CLI",
      "ru": "Nova CLI"
    },
    "description": {
      "en": "Nova CLI",
      "ru": "Nova CLI"
    }
  },
  {
    "slug": "parameters",
    "github": "docs/guide/parameters.md",
    "title": {
      "en": "Function parameters in Nova",
      "ru": "Параметры функций в Nova"
    },
    "description": {
      "en": "Function parameters are read-only by default. Want to mutate — write mut.",
      "ru": "Параметры функций — read-only по умолчанию.  Хочешь менять — пиши mut."
    }
  },
  {
    "slug": "quickstart",
    "github": "docs/guide/quickstart.md",
    "title": {
      "en": "Quickstart",
      "ru": "Быстрый старт"
    },
    "description": {
      "en": "This page gets you from a downloaded zip to a running Nova program in a few minutes, then to a slightly bigger example that shows the two things that make Nova different: effects in function…",
      "ru": "Эта страница доведёт вас от скачанного zip-архива до работающей программы на Nova за несколько минут, а затем до чуть более крупного примера, показывающего две вещи, которые отличают Nova: эффекты…"
    }
  },
  {
    "slug": "running-tests",
    "github": "docs/guide/running-tests.md",
    "title": {
      "en": "Running tests",
      "ru": "Запуск тестов"
    },
    "description": {
      "en": "Build nova CLI, then run the full test suite:",
      "ru": "Соберите nova CLI, затем запустите полный набор тестов:"
    }
  },
  {
    "slug": "runtime-tuning",
    "github": "docs/guide/runtime-tuning.md",
    "title": {
      "en": "Runtime tuning — fiber arena (Plan 149 / D233)",
      "ru": "Настройка рантайма — арена файберов (Plan 149 / D233)"
    },
    "description": {
      "en": "Nova programs run user code on lightweight fibers scheduled over worker threads by Vela (M:N runtime). Each worker owns a fiber arena: a reserved (lazily-committed) virtual region carved into…",
      "ru": "Программы Nova выполняют пользовательский код на лёгких файберах, которые планирует Vela (M:N-рантайм) поверх рабочих потоков. Каждому рабочему потоку принадлежит арена файберов: зарезервированная…"
    }
  },
  {
    "slug": "size-of-align-of",
    "github": "docs/guide/size-of-align-of.md",
    "title": {
      "en": "`size_of[T]()` / `align_of[T]()` — compile-time type layout intrinsics",
      "ru": "`size_of[T]()` / `align_of[T]()` — интринсики раскладки типов на этапе компиляции"
    },
    "description": {
      "en": "Both return int (i64). Evaluation happens at compile time — at runtime it's just a constant.",
      "ru": "Оба возвращают int (i64). Оценка происходит на этапе компиляции — в рантайме это просто константа."
    }
  },
  {
    "slug": "strings",
    "github": "docs/guide/strings.md",
    "title": {
      "en": "Strings in Nova — the lens model",
      "ru": "Строки в Nova — модель линз"
    },
    "description": {
      "en": "Strings in Nova — the lens model",
      "ru": "Строки в Nova — модель линз"
    }
  },
  {
    "slug": "time",
    "github": "docs/guide/time.md",
    "title": {
      "en": "Nova's time system — the `Time` effect, `Duration`/`Timestamp`/`Monotonic`",
      "ru": "Система времени в Nova — `Time`-эффект, `Duration`/`Timestamp`/`Monotonic`"
    },
    "description": {
      "en": "Time is an internal plumbing effect (like TcpNet/AddrNet, std/net/effect.nv): user code does NOT call it directly — it goes through types and free functions instead:",
      "ru": "Time — внутренний плумбинг-эффект (как TcpNet/AddrNet, std/net/effect.nv): пользовательский код НЕ вызывает его напрямую, а ходит через типы и свободные функции:"
    }
  },
  {
    "slug": "tutorial-cleanup",
    "github": "docs/guide/tutorial-cleanup.md",
    "title": {
      "en": "Tutorial — Resource Cleanup with `consume{}` (Plan 110)",
      "ru": "Tutorial — освобождение ресурсов через `consume{}` (Plan 110)"
    },
    "description": {
      "en": "When working with resources (files, database connections, locks), you need to ensure they're always released, even when errors happen. Forgetting to release leads to:",
      "ru": "При работе с ресурсами (файлы, соединения с БД, блокировки) нужно гарантировать, что они всегда освобождаются, даже при ошибках. Забытое освобождение приводит к:"
    }
  },
  {
    "slug": "typed-pointers",
    "github": "docs/guide/typed-pointers.md",
    "title": {
      "en": "Typed pointers (`*T` family) + `unsafe` model",
      "ru": "Типизированные указатели (семейство `*T`) + модель `unsafe`"
    },
    "description": {
      "en": "Production-grade FFI and low-level memory work require typed pointers. Plan 118 introduces the T type family + the unsafe model + Null Pointer Optimization (NPO) for Option[T] zero-cost null-safety.",
      "ru": "Production-grade FFI и низкоуровневая работа с памятью требуют типизированных указателей. План 118 вводит семейство типов T + модель unsafe + Null Pointer Optimization (NPO) для zero-cost…"
    }
  },
  {
    "slug": "value-vs-reference",
    "github": "docs/guide/value-vs-reference.md",
    "title": {
      "en": "Value Types vs Reference Types in Nova",
      "ru": "Типы-значения против ссылочных типов в Nova"
    },
    "description": {
      "en": "Nova uses bracket syntax to encode allocation semantics:",
      "ru": "Nova использует синтаксис скобок для кодирования семантики аллокации:"
    }
  },
  {
    "slug": "vec-lazy",
    "github": "docs/guide/vec-lazy.md",
    "title": {
      "en": "Lazy iterators over `Vec[T]` / `[]T`",
      "ru": "Ленивые итераторы над `Vec[T]` / `[]T`"
    },
    "description": {
      "en": "A lazy iterator processes a vector one element at a time, on demand, with no intermediate allocations. Building a pipeline does no work; only a terminator pulls elements through it, and it pulls…",
      "ru": "Ленивый итератор обрабатывает вектор по одному элементу за раз, по требованию, без промежуточных аллокаций. Построение пайплайна не делает никакой работы; только терминатор протягивает элементы…"
    }
  },
  {
    "slug": "vec-owned",
    "github": "docs/guide/vec-owned.md",
    "title": {
      "en": "Vec[T] — Nova-native growable array",
      "ru": "Vec[T] — нативный динамический массив Nova"
    },
    "description": {
      "en": "Vec[T] is a generic growable array implemented entirely in Nova on top of raw pointer allocation (RawMem.alloc). It is available as std.collections.vecowned.Vec.",
      "ru": "Vec[T] — generic-растущий массив, реализованный целиком на Nova поверх аллокации сырых указателей (RawMem.alloc). Доступен как std.collections.vecowned.Vec."
    }
  },
  {
    "slug": "z3-setup",
    "github": "docs/guide/z3-setup.md",
    "title": {
      "en": "SMT verification and Z3 setup",
      "ru": "SMT-верификация и настройка Z3"
    },
    "description": {
      "en": "Nova includes a static contract verifier (requires/ensures/invariant). By default it uses TrivialBackend (reflexive tautologies, constant folding) — works with no external dependencies. Full…",
      "ru": "Nova включает статический верификатор контрактов (requires/ensures/invariant). По умолчанию используется TrivialBackend (reflexive tautologies, constant folding) — работает без внешних…"
    }
  }
];

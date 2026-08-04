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
      "en": "1. Create a directory; put nova.toml with [package] name at its root.",
      "ru": "sourcerev: 07df7d2c9"
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
      "en": "Nova supports auto-derive for five built-in protocols via an #impl(P)",
      "ru": "sourcerev: 07df7d2c9"
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
      "en": "model is capability-split (Rust mpsc-style): Channel.new(cap)",
      "ru": "слать») и ChanReader[T] («только получать»)."
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
      "en": "// SPDX-License-Identifier: MIT OR Apache-2.0",
      "ru": "sourcerev: 07df7d2c9"
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
      "en": "consume x = Token.new(7)    // ✓ ownership binding",
      "ru": "sourcerev: 21dff1b37"
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
      "ru": "sourcerev: 07df7d2c9"
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
      "en": "Plain (not a point on the axis)      Offset (a point, fixed shift)     Zoned (a point, rule-aware)",
      "ru": "sourcerev: 07df7d2c9"
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
      "en": "ro logo  = embed(\"assets/logo.png\")     // []u8 — the content of ONE file",
      "ru": "sourcerev: 07df7d2c9"
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
      "en": "This cookbook shows how to bind Nova code to third-party C libraries —",
      "ru": "sourcerev: 07df7d2c9"
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
      "en": "// SPDX-License-Identifier: MIT OR Apache-2.0",
      "ru": "sourcerev: 27d5dd055"
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
      "en": "// SPDX-License-Identifier: MIT OR Apache-2.0",
      "ru": "sourcerev: 21dff1b37"
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
      "en": "// byte-first protocols, one shared error, mockable effects",
      "ru": "sourcerev: 07df7d2c9"
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
      "en": "A working tour of Nova for a reader who has never seen the language —",
      "ru": "sourcerev: 21dff1b37"
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
      "en": "Last updated 2026-07-21. Verified 2026-07-20 directly on WSL2 Ubuntu 26.04 (kernel",
      "ru": "sourcerev: 07df7d2c9"
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
      "en": "replaces runtests.ps1 / runtests.sh / regenruntime.ps1",
      "ru": "sourcerev: 07df7d2c9"
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
      "ru": "sourcerev: 21dff1b37"
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
      "en": "This page gets you from a downloaded zip to a running Nova program in a",
      "ru": "sourcerev: 07df7d2c9"
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
      "en": "Nova programs run user code on lightweight fibers scheduled over worker",
      "ru": "sourcerev: 27d5dd055"
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
      "en": "const SIZEINT  = sizeof[int]()    // 8 — bytes in memory",
      "ru": "sourcerev: 27d5dd055"
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
      "en": "(invariant R-UTF8). It is immutable. You don't index or measure str directly —",
      "ru": "sourcerev: 27d5dd055"
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
      "en": "user code does NOT call it directly — it goes through types and free functions instead:",
      "ru": "sourcerev: 07df7d2c9"
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
      "en": "// SPDX-License-Identifier: MIT OR Apache-2.0",
      "ru": "sourcerev: 21dff1b37"
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
      "en": "Production-grade FFI and low-level memory work require typed pointers.",
      "ru": "sourcerev: 07df7d2c9"
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
      "ru": "sourcerev: 07df7d2c9"
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
      "en": "A lazy iterator processes a vector one element at a time, on demand, with no",
      "ru": "sourcerev: 07df7d2c9"
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
      "en": "raw pointer allocation (RawMem.alloc). It is available as",
      "ru": "sourcerev: 21dff1b37"
    }
  }
];

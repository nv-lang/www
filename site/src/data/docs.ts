// Пользовательские гайды Nova (файлы docs/<slug>.md и <slug>.ru.md
// репозитория nova). Генерируемые гайды синхронизируются в коллекцию
// `docs` скриптом scripts/sync-decisions.mjs; страницы —
// src/pages/doc/[slug]/index.astro (EN) и src/pages/ru/doc/[slug]/index.astro
// (RU). Эта таблица — единственный источник навигации сайдбара (DocSidebar)
// и мета-тегов: исходники в nova без frontmatter, а title/description должны
// оставаться SEO-выверенными.
//
// generated: true  — страница генерируется из nova/docs/<slug>.md; slug
//   обязан присутствовать в DOC_SLUGS в sync-decisions.mjs.
// generated: false — страница самописная (партиал + обёртка живут в репо
//   www); в навигации показывается, но [slug]-роут её не строит.
//   Сейчас так только nova-cli — его партиал содержит таблицу Category
//   flags (D304), которой ещё нет в nova-cli.md на origin/main репо nova.
//   Перевести в generated: true и добавить в DOC_SLUGS, когда nova-cli.md
//   догонит контент.
export interface DocGuide {
  slug: string;                         // сегмент URL + базовое имя исходника
  github: string;                       // путь EN-исходника в репозитории nv-lang/nova
  generated: boolean;                   // строится ли из nova (true) или самописная (false)
  title: { en: string; ru: string };
  description: { en: string; ru: string };
}

export const DOC_GUIDES: DocGuide[] = [
  {
    slug: 'channels',
    github: 'docs/channels.md',
    generated: true,
    title: { en: 'Channels and select', ru: 'Каналы и select' },
    description: {
      en: 'Nova channels and select reference: Channel[T], ChanWriter, ChanReader, select arms, timeout, supervised cancel, idioms.',
      ru: 'Каналы и select в Nova: Channel[T], ChanWriter, ChanReader, select arms, timeout, supervised cancel, идиомы.',
    },
  },
  {
    slug: 'contracts',
    github: 'docs/contracts.md',
    generated: true,
    title: { en: 'Contracts and formal verification', ru: 'Контракты и формальная верификация' },
    description: {
      en: 'Nova contract system: requires, ensures, #verify, #pure, #opaque, reveal, calc blocks, loop invariants, lemmas, Z3 backend.',
      ru: 'Система контрактов Nova: requires, ensures, #verify, #pure, #opaque, reveal, calc-блоки, loop invariants, леммы, Z3 backend.',
    },
  },
  {
    slug: 'nova-codegen',
    github: 'docs/nova-codegen.md',
    generated: true,
    title: { en: 'nova-codegen', ru: 'nova-codegen' },
    description: {
      en: 'nova-codegen internal compiler reference: commands, environment variables, Cargo features, library API, architecture, and runtime.',
      ru: 'Справочник nova-codegen: команды, переменные окружения, Cargo features, API библиотеки, архитектура и рантайм.',
    },
  },
  {
    // Самописная (см. комментарий выше): партиал опережает nova-cli.md на D304.
    slug: 'nova-cli',
    github: 'docs/nova-cli.md',
    generated: false,
    title: { en: 'nova CLI', ru: 'nova CLI' },
    description: {
      en: 'Nova CLI reference: nova check, run, build, test, doc, doc-query, doc-mcp, contracts, bench — all subcommands, flags, and environment variables.',
      ru: 'Справочник Nova CLI: nova check, run, build, test, doc, doc-query, doc-mcp, contracts, bench — все субкоманды, флаги и переменные окружения.',
    },
  },
];

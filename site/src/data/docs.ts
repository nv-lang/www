// Пользовательские гайды Nova (файлы docs/<slug>.md и <slug>.ru.md
// репозитория nova). Синхронизируются в коллекцию `docs` скриптом
// scripts/sync-decisions.mjs; страницы — src/pages/doc/[slug]/index.astro
// (EN) и src/pages/ru/doc/[slug]/index.astro (RU). Список slug'ов должен
// совпадать с DOC_SLUGS в sync-decisions.mjs.
//
// Эта таблица — единственный источник навигации сайдбара (DocSidebar) и
// мета-тегов: исходники в nova без frontmatter, а title/description должны
// оставаться SEO-выверенными.
export interface DocGuide {
  slug: string;                         // сегмент URL + базовое имя исходника
  github: string;                       // путь EN-исходника в репозитории nv-lang/nova
  title: { en: string; ru: string };
  description: { en: string; ru: string };
}

export const DOC_GUIDES: DocGuide[] = [
  {
    slug: 'channels',
    github: 'docs/channels.md',
    title: { en: 'Channels and select', ru: 'Каналы и select' },
    description: {
      en: 'Nova channels and select reference: Channel[T], ChanWriter, ChanReader, select arms, timeout, supervised cancel, idioms.',
      ru: 'Каналы и select в Nova: Channel[T], ChanWriter, ChanReader, select arms, timeout, supervised cancel, идиомы.',
    },
  },
  {
    slug: 'contracts',
    github: 'docs/contracts.md',
    title: { en: 'Contracts and formal verification', ru: 'Контракты и формальная верификация' },
    description: {
      en: 'Nova contract system: requires, ensures, #verify, #pure, #opaque, reveal, calc blocks, loop invariants, lemmas, Z3 backend.',
      ru: 'Система контрактов Nova: requires, ensures, #verify, #pure, #opaque, reveal, calc-блоки, loop invariants, леммы, Z3 backend.',
    },
  },
  {
    slug: 'nova-cli',
    github: 'docs/nova-cli.md',
    title: { en: 'nova CLI', ru: 'nova CLI' },
    description: {
      en: 'Nova CLI reference: nova check, run, build, test, doc, doc-query, doc-mcp, contracts, bench — all subcommands, flags, and environment variables.',
      ru: 'Справочник Nova CLI: nova check, run, build, test, doc, doc-query, doc-mcp, contracts, bench — все субкоманды, флаги и переменные окружения.',
    },
  },
];

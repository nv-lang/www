import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Контент спецификации Nova. Markdown синхронизируется из репозитория
// nv-lang/nova скриптом scripts/sync-decisions.mjs (prebuild).
// Файлы без frontmatter — схема не задаётся.

// D-блоки: spec/decisions/*.md
const decisions = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/decisions' }),
  // sourcePath/sourceDate прокидывает sync-decisions.mjs в frontmatter
  // каждой сгенерированной страницы (план 241): путь источника в репе nova
  // и дата последнего коммита источника (для #honest-dates).
  schema: z.object({
    sourcePath: z.string().optional(),
    sourceDate: z.string().optional(),
  }),
});

// Обзорные документы спецификации: spec/*.md и spec/decisions/history/*.md
const spec = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/spec' }),
  schema: z.object({
    sourcePath: z.string().optional(),
    sourceDate: z.string().optional(),
  }),
});

// Блог. Файлы вида `<дата>-<слаг>.<lang>.md`, например
// `2026-06-08-month-with-claude.ru.md`. Язык берётся из имени файла
// (суффикс перед .md) и из поля lang; роуты /blog/ (en) и /ru/blog/ (ru)
// фильтруют коллекцию по языку. Подсветка кода Nova — клиентский
// nova-highlight.js по class="language-nova" (см. astro.config).
const blog = defineCollection({
  // Подпапки по языку: blog/en/<slug>.md, blog/ru/<slug>.md.
  // generateId сохраняет полный путь без расширения (en/slug, ru/slug) —
  // иначе Astro slug-ифицирует id, съедает префикс папки, и ru/en
  // версии одного поста коллизируют в один id (остаётся только одна).
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/blog',
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    // Явный slug для URL (одинаковый у ru/en версий поста). Не полагаемся
    // на id файла: Astro slug-ифицирует его и съедает точку в `.ru`/`.en`.
    slug: z.string(),
    // ISO-дата для сортировки (2026-06-08).
    date: z.string(),
    // Человекочитаемая дата для показа («8 июня 2026» / «June 8, 2026»).
    dateLabel: z.string(),
    lang: z.enum(['ru', 'en']),
    tags: z.array(z.string()).default([]),
    // Краткое описание для списка постов.
    excerpt: z.string(),
    author: z.string().default('Evgeniy Golovin'),
    // Канонический URL. Для en-оригинала — свой URL на nv-lang.org;
    // если пост репостится (dev.to), там указывается этот canonical.
    canonical: z.string().optional(),
    // Для постов-анонсов: ссылка на полный текст (например, на Хабре).
    externalUrl: z.string().optional(),
    externalLabel: z.string().optional(),
  }),
});

// Пользовательские гайды (docs/<slug>.md и <slug>.ru.md репозитория
// nova), синхронизируются scripts/sync-decisions.mjs (prebuild).
// Двуязычные: подпапки en/ и ru/, как у блога — чтобы id не
// коллизились (generateId сохраняет префикс языка). Без frontmatter —
// title/description берутся из src/data/docs.ts.
const docs = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/docs',
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  }),
  schema: z.object({
    sourcePath: z.string().optional(),
    sourceDate: z.string().optional(),
  }),
});

// Документация пакетных реп (план 241 Ф.2b): polaris — свои страницы,
// остальные пакеты — README. Наполняется scripts/sync-packages.mjs.
const packages = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/packages',
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  }),
  schema: z.object({
    sourceRepo: z.string().optional(),
    sourcePath: z.string().optional(),
  }),
});

export const collections = { decisions, spec, blog, docs, packages };

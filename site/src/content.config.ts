import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Контент спецификации Nova. Markdown синхронизируется из репозитория
// nv-lang/nova скриптом scripts/sync-decisions.mjs (prebuild).
// Файлы без frontmatter — схема не задаётся.

// D-блоки: spec/decisions/*.md
const decisions = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/decisions' }),
});

// Обзорные документы спецификации: spec/*.md и spec/decisions/history/*.md
const spec = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/spec' }),
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

export const collections = { decisions, spec, blog };

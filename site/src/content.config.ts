import { defineCollection } from 'astro:content';
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

export const collections = { decisions, spec };

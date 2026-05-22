import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

// Коллекция D-блоков спецификации. Markdown-файлы синхронизируются из
// репозитория nv-lang/nova скриптом scripts/sync-decisions.mjs (prebuild).
// Файлы без frontmatter — схема не задаётся.
const decisions = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/decisions' }),
});

export const collections = { decisions };

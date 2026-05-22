// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// nv-lang.org — конфигурация Astro.
// build.format 'preserve' — точное воспроизведение текущей схемы URL
// (каталоги со слэшем + посты блога с расширением .html). См. план www-02.
export default defineConfig({
  site: 'https://nv-lang.org',
  build: { format: 'preserve' },
  integrations: [react(), mdx(), sitemap()],
});

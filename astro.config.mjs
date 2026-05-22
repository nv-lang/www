// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';

// nv-lang.org — конфигурация Astro.
// build.format 'preserve' — точное воспроизведение текущей схемы URL
// (каталоги со слэшем + посты блога с расширением .html). См. план www-02.
//
// Карта сайта: используется ручной public/sitemap.xml из www-01 (он точнее
// автогенератора — учитывает std-подстраницы без RU-перевода), поэтому
// интеграция @astrojs/sitemap намеренно не подключена.
export default defineConfig({
  site: 'https://nv-lang.org',
  build: { format: 'preserve' },
  integrations: [react(), mdx()],
});

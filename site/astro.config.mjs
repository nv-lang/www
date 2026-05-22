// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';

// rehype-плагин: стабильный короткий якорь #dNN на заголовках D-блоков
// («## D91. ...»). Doc-страницы ссылаются на #d91 — стабильно и кратко.
function rehypeDAnchors() {
  /** @param {any} n @returns {string} */
  const textOf = (n) =>
    n.type === 'text' ? n.value : (n.children || []).map(textOf).join('');
  /** @param {any} n */
  const walk = (n) => {
    if (n.type === 'element' && /^h[2-4]$/.test(n.tagName)) {
      const m = textOf(n).match(/^D(\d+)\b/);
      if (m) n.properties = { ...n.properties, id: 'd' + m[1] };
    }
    (n.children || []).forEach(walk);
  };
  /** @param {any} tree */
  const transform = (tree) => {
    walk(tree);
  };
  return transform;
}

// nv-lang.org — конфигурация Astro.
// build.format 'preserve' — точное воспроизведение схемы URL.
// Карта сайта — ручной public/sitemap.xml (см. план www-02).
export default defineConfig({
  site: 'https://nv-lang.org',
  build: { format: 'preserve' },
  integrations: [react(), mdx()],
  markdown: {
    // Подсветку синтаксиса даёт public/js/nova-highlight.js по
    // class="language-nova"; встроенный Shiki отключён — код рендерится
    // обычным <pre><code class="language-...">.
    syntaxHighlight: false,
    rehypePlugins: [rehypeDAnchors],
  },
});

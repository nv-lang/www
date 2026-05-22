// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import rehypeSlug from 'rehype-slug';
import { readdirSync, readFileSync } from 'node:fs';

// Карта D-номер → slug раздела. Строится из синхронизированных файлов
// spec/decisions/ (prebuild уже отработал к моменту чтения конфига).
/** @returns {Record<string,string>} */
function buildDMap() {
  /** @type {Record<string,string>} */
  const map = {};
  const dir = new URL('./src/content/decisions/', import.meta.url);
  try {
    for (const fn of readdirSync(dir)) {
      if (!fn.endsWith('.md')) continue;
      const slug = fn.slice(3, -3); // 06-concurrency.md -> concurrency
      const text = readFileSync(new URL(fn, dir), 'utf8');
      for (const m of text.matchAll(/^##[ \t]+D(\d+)\./gm)) map[m[1]] = slug;
    }
  } catch (e) {
    console.warn('buildDMap:', e instanceof Error ? e.message : e);
  }
  return map;
}
const D_MAP = buildDMap();

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
  return (tree) => {
    walk(tree);
  };
}

// rehype-плагин: любое упоминание DNN в тексте decision-страниц делает
// ссылкой на конкретный D-блок. Не трогает код (<pre>/<code>), уже
// существующие ссылки (<a>) и заголовки. Нотация кэша I1/D1/LL не
// затрагивается (lookbehind на «/» и буквы).
function rehypeDLinks() {
  const RE = /(?<![/\w])D(\d+)\b/g;
  /** @param {any} node @param {boolean} skip */
  const walk = (node, skip) => {
    const kids = node.children;
    if (!kids) return;
    const here =
      skip ||
      (node.type === 'element' && /^(a|code|pre|h[1-6])$/.test(node.tagName));
    /** @type {any[]} */
    const out = [];
    for (const child of kids) {
      if (!here && child.type === 'text' && RE.test(child.value)) {
        RE.lastIndex = 0;
        let last = 0;
        /** @type {any[]} */
        const parts = [];
        let m;
        while ((m = RE.exec(child.value)) !== null) {
          const slug = D_MAP[m[1]];
          if (!slug) continue;
          if (m.index > last)
            parts.push({ type: 'text', value: child.value.slice(last, m.index) });
          parts.push({
            type: 'element',
            tagName: 'a',
            properties: { href: `/spec/decisions/${slug}/#d${m[1]}` },
            children: [{ type: 'text', value: 'D' + m[1] }],
          });
          last = m.index + m[0].length;
        }
        if (parts.length === 0) {
          out.push(child);
        } else {
          if (last < child.value.length)
            parts.push({ type: 'text', value: child.value.slice(last) });
          out.push(...parts);
        }
      } else {
        walk(child, here);
        out.push(child);
      }
    }
    node.children = out;
  };
  /** @param {any} tree */
  return (tree) => {
    walk(tree, false);
  };
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
    // rehypeDAnchors — стабильные #dNN; rehypeSlug — github-слаги на
    // прочих заголовках (для якорных ссылок в spec-документах);
    // rehypeDLinks — авто-ссылки на упоминания DNN.
    rehypePlugins: [rehypeDAnchors, rehypeSlug, rehypeDLinks],
  },
});

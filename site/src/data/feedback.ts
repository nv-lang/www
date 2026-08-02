// Канал обратной связи контент-страниц (A-R3, план 221 Ф.4; план 241 §1.2).
// Правило: ДО включения Issues (т.е. до релиза) — GitHub Discussions,
// ПОСЛЕ — переключить на Issues. Переключение при релизе — здесь,
// одной строкой: заменить base.
//
// Факт на 2026-08-02 (сверено с api.github.com/repos/nv-lang/nova):
// has_discussions=false (страница /discussions отдаёт 404), has_issues=true
// (страница /issues — 200) — поэтому по правилу A-R3 активна ветка Issues.
// Дискуссии включены НЕ были, хотя футер сайта ссылается на
// /discussions — отдельная находка (мёртвая ссылка), доложена в PROGRESS.md.
export const FEEDBACK = {
  // Активный канал обратной связи. Одна константа — переключение при релизе.
  base: 'https://github.com/nv-lang/nova/issues/new',
  // Резерв под ветку A-R3 «до включения Issues»: если владелец включит
  // Discussions и решит вести обратную связь туда — подставить сюда.
  discussionsBase: 'https://github.com/nv-lang/nova/discussions/new',
  // Слаг категории Discussions: у /discussions/new обязателен параметр
  // ?category=<slug>&title=… — слагается автоматически (см. feedbackUrl).
  category: 'general',
};

// Публичный origin сайта — для заголовка/тела обратной связи.
export const SITE_ORIGIN = 'https://nv-lang.org';

// Ссылка обратной связи: заголовок = домен + путь страницы (читабельно в
// списке задач), тело — предзаполнено полным URL.
export function feedbackUrl(pagePath: string): string {
  const q = new URLSearchParams();
  if (FEEDBACK.base.endsWith('/discussions/new'))
    q.set('category', FEEDBACK.category);
  q.set('title', `nv-lang.org${pagePath}`);
  q.set('body', `Page: ${SITE_ORIGIN}${pagePath}\n\n`);
  return `${FEEDBACK.base}?${q.toString()}`;
}

// Scroll-spy: подсветка активного раздела в сайдбаре doc-страниц.
// Активной становится ссылка последнего заголовка, прошедшего верх
// вьюпорта. Без сайдбара или без якорных ссылок — тихо ничего не делает.
(() => {
  'use strict';
  const sidebar = document.querySelector('.doc-sidebar');
  if (!sidebar) return;

  const map = [];
  for (const a of sidebar.querySelectorAll('a[href^="#"]')) {
    const href = a.getAttribute('href');
    if (!href || href === '#') continue;
    let id;
    try {
      id = decodeURIComponent(href.slice(1));
    } catch {
      id = href.slice(1);
    }
    const el = document.getElementById(id);
    if (el) map.push({ a, el });
  }
  if (!map.length) return;
  map.sort(
    (x, y) =>
      x.el.getBoundingClientRect().top - y.el.getBoundingClientRect().top,
  );

  let current = null;
  const update = () => {
    let active = map[0].a;
    for (const { a, el } of map) {
      if (el.getBoundingClientRect().top <= 100) active = a;
      else break;
    }
    if (active !== current) {
      if (current) current.classList.remove('active');
      active.classList.add('active');
      current = active;
    }
  };

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      update();
      ticking = false;
    });
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll, { passive: true });
  update();
})();

// Copy-кнопка на блоках кода. Оборачивает каждый <pre> с <code> в
// .code-block и добавляет иконку-кнопку копирования. Блоки install-
// страницы (.copy-block) пропускаются — у них своя кнопка.
(() => {
  'use strict';
  const ICON_COPY =
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" ' +
    'stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
    'stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/>' +
    '<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
  const ICON_DONE =
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" ' +
    'stroke="currentColor" stroke-width="2.5" stroke-linecap="round" ' +
    'stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';

  for (const pre of document.querySelectorAll('pre')) {
    const code = pre.querySelector('code');
    if (!code) continue; // только блоки кода, не plain <pre>
    if (pre.closest('.copy-block')) continue; // install — своя кнопка
    if (pre.parentElement.classList.contains('code-block')) continue;

    const wrap = document.createElement('div');
    wrap.className = 'code-block';
    pre.parentNode.insertBefore(wrap, pre);
    wrap.appendChild(pre);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'code-copy-btn';
    btn.setAttribute('aria-label', 'Copy code to clipboard');
    btn.innerHTML = ICON_COPY;
    let busy = false;
    btn.addEventListener('click', async () => {
      if (busy) return;
      try {
        await navigator.clipboard.writeText(code.innerText);
      } catch {
        return; // буфер обмена недоступен — без ложного «скопировано»
      }
      busy = true;
      btn.innerHTML = ICON_DONE;
      btn.classList.add('copied');
      setTimeout(() => {
        btn.innerHTML = ICON_COPY;
        btn.classList.remove('copied');
        busy = false;
      }, 1800);
    });
    wrap.appendChild(btn);
  }
})();

import assert from 'node:assert/strict';
import test from 'node:test';
import { feedbackUrl } from '../src/data/feedback.ts';

const privateReport = 'https://github.com/nv-lang/nova/security/advisories/new';

for (const [lang, path, warning] of [
  ['en', '/spec/syntax/', `Security issue? Don't post it here, use the private report: ${privateReport}`],
  ['ru', '/ru/spec/syntax/', `Уязвимость? Не пишите здесь, откройте приватный отчёт: ${privateReport}`],
  ['en', '/doc/', `Security issue? Don't post it here, use the private report: ${privateReport}`],
  ['ru', '/ru/doc/', `Уязвимость? Не пишите здесь, откройте приватный отчёт: ${privateReport}`],
]) {
  test(`${lang} ${path}: private-report warning precedes page URL`, () => {
    const url = new URL(feedbackUrl(path, lang));
    assert.equal(`${url.origin}${url.pathname}`, 'https://github.com/nv-lang/nova/issues/new');
    assert.equal(url.searchParams.get('title'), `nv-lang.org${path}`);
    assert.equal(url.searchParams.get('body'), `${warning}\nPage: https://nv-lang.org${path}\n\n`);
    assert.equal(url.searchParams.get('body').split('\n')[0], warning);
    assert.ok(!url.searchParams.get('body').includes(lang === 'en' ? 'Уязвимость?' : 'Security issue?'));
  });
}

/*
 * email-subscribe.js — vanilla JS form handler for /course/, /newsletter/, /support/.
 *
 * Forms are picked up by class `.email-form`. They post to the Cloudflare
 * Worker proxy at https://email.nv-lang.org/subscribe — the Worker holds the
 * Resend API key and applies rate limiting & dedup.
 *
 * Form contract (HTML):
 *   <form class="email-form"
 *         data-source="course-en | newsletter-ru | ..."
 *         data-success-message="..."
 *         data-error-message="...">
 *     <input type="email" name="email" required>
 *     <input type="text" name="hp" tabindex="-1" autocomplete="off" style="display:none;">  (optional honeypot)
 *     <button type="submit">Subscribe</button>
 *     <div class="email-form__status" aria-live="polite"></div>
 *   </form>
 *
 * Behaviour:
 *   - On submit: disable button, show "Submitting…".
 *   - On 2xx: show success message, clear input, keep form disabled for 30s.
 *   - On 4xx/5xx: show error message, re-enable button.
 *   - Honeypot field (if present and filled) → silently pretend success, no POST.
 */

(function () {
  'use strict';

  var ENDPOINT = 'https://email.nv-lang.org/subscribe';

  function attachForm(form) {
    if (form.dataset.attached === '1') return;
    form.dataset.attached = '1';

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var statusEl = form.querySelector('.email-form__status');
      var submitBtn = form.querySelector('button[type=submit]');
      var emailInput = form.querySelector('input[type=email]');
      var honeypot = form.querySelector('input[name=hp]');

      var successMsg = form.dataset.successMessage || 'Subscribed. Check your inbox.';
      var errorMsg = form.dataset.errorMessage || 'Something went wrong. Please try again.';
      var source = form.dataset.source || 'unknown';

      if (!emailInput || !emailInput.value) return;
      if (statusEl) statusEl.textContent = '';

      // Silent-drop spam: honeypot filled → pretend success, don't POST.
      if (honeypot && honeypot.value) {
        if (statusEl) {
          statusEl.textContent = successMsg;
          statusEl.className = 'email-form__status email-form__status--success';
        }
        emailInput.value = '';
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.dataset.originalLabel = submitBtn.textContent;
        submitBtn.textContent = '…';
      }

      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput.value, source: source })
      })
        .then(function (res) {
          if (res.ok) return res.json().catch(function () { return {}; });
          throw new Error('HTTP ' + res.status);
        })
        .then(function () {
          if (statusEl) {
            statusEl.textContent = successMsg;
            statusEl.className = 'email-form__status email-form__status--success';
          }
          emailInput.value = '';
          // Keep button disabled for 30s to discourage rapid resubmits.
          setTimeout(function () {
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.textContent = submitBtn.dataset.originalLabel || 'Subscribe';
            }
          }, 30000);
        })
        .catch(function () {
          if (statusEl) {
            statusEl.textContent = errorMsg;
            statusEl.className = 'email-form__status email-form__status--error';
          }
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = submitBtn.dataset.originalLabel || 'Subscribe';
          }
        });
    });
  }

  function init() {
    var forms = document.querySelectorAll('form.email-form');
    for (var i = 0; i < forms.length; i++) attachForm(forms[i]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

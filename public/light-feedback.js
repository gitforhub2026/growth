(() => {
  const form = document.querySelector('#light-feedback-form');
  const status = document.querySelector('#light-feedback-status');
  if (!form || !status) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = form.querySelector('.light-feedback-submit');
    const data = new FormData(form);
    const payload = {
      name: String(data.get('name') || '').trim(),
      contact: String(data.get('contact') || '').trim(),
      message: String(data.get('message') || '').trim(),
      website: String(data.get('website') || '').trim(),
      source: 'light-house',
    };

    if (payload.message.length < 2) {
      status.textContent = '請留下一點想告訴我們的內容。';
      status.className = 'light-feedback-status is-error';
      return;
    }

    button.disabled = true;
    button.textContent = '送出中…';
    status.textContent = '';
    status.className = 'light-feedback-status';

    try {
      const response = await fetch('/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.message || '送出失敗');
      form.reset();
      status.textContent = result.message || '謝謝你的建議，我們收到了。';
      status.className = 'light-feedback-status is-success';
    } catch (error) {
      status.textContent = error?.message || '暫時無法送出，請稍後再試。';
      status.className = 'light-feedback-status is-error';
    } finally {
      button.disabled = false;
      button.textContent = '送出建議';
    }
  });
})();

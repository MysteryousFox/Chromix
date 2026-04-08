(function () {
  function _d(s) { return atob(s); }
  var _e = _d('aHR0cHM6Ly9oeXlteGZlemZlY3V4cWxweGFtYS5zdXBhYmFzZS5jbw==');
  var _k = _d('ZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SnBjM01pT2lKemRYQmhZbUZ6WlNJc0luSmxaaUk2SW1oNWVXMTRabVY2Wm1WamRYaHhiSEI0WVcxaElpd2ljbTlzWlNJNkltRnViMjRpTENKcFlYUWlPakUzTnpVek1URXlPRGtzSW1WNGNDSTZNakE1TURnNE56STRPWDAuUHhmZzg2clNTV3dSUDhJb05ScXZ0aHhBVjktM2M5cEl4ZGhCcEFkZl9xSQ==');

  var selectedTopic = '';
  var openBtn  = document.getElementById('feedbackOpenBtn');
  var step1    = document.getElementById('fbStep1');
  var step2    = document.getElementById('fbStep2');
  var topicLbl = document.getElementById('selectedTopicLabel');
  var textarea = document.getElementById('fbTextarea');
  var sendBtn  = document.getElementById('sendBtn');
  var backBtn  = document.getElementById('backBtn');

  function showStep(n) {
    openBtn.style.display = n === 0 ? 'block' : 'none';
    step1.style.display   = n === 1 ? 'flex'  : 'none';
    step2.style.display   = n === 2 ? 'flex'  : 'none';
  }

  openBtn.addEventListener('click', function () { showStep(1); });

  document.querySelectorAll('.topic-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.topic-btn').forEach(function (b) { b.classList.remove('selected'); });
      btn.classList.add('selected');
      selectedTopic = btn.dataset.topic;
      topicLbl.textContent = 'Тема: ' + selectedTopic;
      textarea.value = '';
      showStep(2);
    });
  });

  backBtn.addEventListener('click', function () {
    selectedTopic = '';
    showStep(1);
  });

  sendBtn.addEventListener('click', function () {
    if (!selectedTopic) return;
    sendBtn.disabled    = true;
    sendBtn.textContent = '...';
    fetch(_e + '/rest/v1/feedback', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'apikey':        _k,
        'Authorization': 'Bearer ' + _k,
        'Prefer':        'return=minimal'
      },
      body: JSON.stringify({ topic: selectedTopic, message: textarea.value.trim() })
    })
    .then(function (r) {
      if (r.ok) { showToast('Фидбек отправлен ✓'); reset(); }
      else return r.text().then(function (t) { throw new Error(t); });
    })
    .catch(function (err) {
      console.error(err);
      showToast('Ошибка отправки');
      sendBtn.disabled    = false;
      sendBtn.textContent = '→ Отправить';
    });
  });

  function reset() {
    sendBtn.disabled    = false;
    sendBtn.textContent = '→ Отправить';
    textarea.value      = '';
    selectedTopic       = '';
    document.querySelectorAll('.topic-btn').forEach(function (b) { b.classList.remove('selected'); });
    showStep(0);
  }

  showStep(0);
})();
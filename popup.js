(function () {
  'use strict';

  const SECTIONS = [
    {
      startKey: 'sessionStart',
      resetKey: 'sessionReset',
      noEl: 'session-no',
      infoEl: 'session-info',
      countdownEl: 'session-countdown',
      countdownLabelEl: 'session-countdown-label',
      startEl: 'session-start',
      resetEl: 'session-reset',
      formatDate: false // short time only
    },
    {
      startKey: 'allModelsStart',
      resetKey: 'allModelsReset',
      noEl: 'allmodels-no',
      infoEl: 'allmodels-info',
      countdownEl: 'allmodels-countdown',
      countdownLabelEl: 'allmodels-countdown-label',
      startEl: 'allmodels-start',
      resetEl: 'allmodels-reset',
      formatDate: true // include date since it's 7 days out
    }
  ];

  function formatTime(timestamp) {
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  function formatDateTime(timestamp) {
    const d = new Date(timestamp);
    const date = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    return date + ' ' + time;
  }

  function formatCountdown(ms, includeDays) {
    if (ms <= 0) return includeDays ? '0d 00:00:00' : '00:00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const d = Math.floor(totalSeconds / 86400);
    const h = Math.floor((totalSeconds % 86400) / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const hms = [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
    return includeDays ? d + 'd ' + hms : hms;
  }

  function update() {
    const allKeys = SECTIONS.flatMap(s => [s.startKey, s.resetKey]);

    chrome.storage.local.get(allKeys, (data) => {
      for (const sec of SECTIONS) {
        const noEl = document.getElementById(sec.noEl);
        const infoEl = document.getElementById(sec.infoEl);
        const countdownEl = document.getElementById(sec.countdownEl);
        const countdownLabelEl = document.getElementById(sec.countdownLabelEl);
        const startEl = document.getElementById(sec.startEl);
        const resetEl = document.getElementById(sec.resetEl);

        const startVal = data[sec.startKey];
        const resetVal = data[sec.resetKey];

        if (!startVal || !resetVal) {
          noEl.style.display = 'block';
          infoEl.style.display = 'none';
          continue;
        }

        noEl.style.display = 'none';
        infoEl.style.display = 'block';

        const fmt = sec.formatDate ? formatDateTime : formatTime;
        startEl.textContent = fmt(startVal);
        resetEl.textContent = fmt(resetVal);

        const remaining = resetVal - Date.now();

        if (remaining <= 0) {
          countdownEl.textContent = 'READY';
          countdownEl.classList.add('ready');
          countdownLabelEl.textContent = 'limit has reset';
        } else {
          countdownEl.textContent = formatCountdown(remaining, sec.formatDate);
          countdownEl.classList.remove('ready');
          countdownLabelEl.textContent = 'until reset';
        }
      }
    });
  }

  update();
  setInterval(update, 1000);
})();

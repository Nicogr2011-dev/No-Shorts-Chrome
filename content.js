// No Shorts. No Excuses. — content.js

(function () {
  let isEnabled = true;
  let overlay = null;
  let checkInterval = null;

  // Load state from storage
  chrome.storage.sync.get(['enabled'], (result) => {
    isEnabled = result.enabled !== false;
    init();
  });

  chrome.storage.onChanged.addListener((changes) => {
    if (changes.enabled !== undefined) {
      isEnabled = changes.enabled.newValue;
      if (!isEnabled) {
        removeOverlay();
      } else {
        checkURL();
      }
    }
  });

  function isShorts() {
    return location.pathname.startsWith('/shorts');
  }

  function createOverlay() {
    if (overlay) return;

    overlay = document.createElement('div');
    overlay.id = '__no-shorts-overlay__';
    overlay.innerHTML = `
      <div class="ns-container">
        <div class="ns-glitch-wrapper">
          <div class="ns-icon">⛔</div>
        </div>
        <div class="ns-eyebrow">ACCESO DENEGADO</div>
        <h1 class="ns-title">
          <span class="ns-title-line">No te</span>
          <span class="ns-title-line accent">permites</span>
          <span class="ns-title-line">ver esto.</span>
        </h1>
        <p class="ns-sub">Los Shorts son una trampa. Tú mismo lo dijiste.<br>Cierra esto y haz algo que importe.</p>
        <div class="ns-actions">
          <button class="ns-btn-back" id="ns-back">← Volver a YouTube</button>
          <button class="ns-btn-disable" id="ns-disable">Desactivar bloqueo</button>
        </div>
        <div class="ns-counter-wrap">
          <span class="ns-counter-label">shorts bloqueados hoy</span>
          <span class="ns-counter" id="ns-count">0</span>
        </div>
      </div>
      <div class="ns-scanlines"></div>
      <div class="ns-noise"></div>
    `;

    document.documentElement.appendChild(overlay);
    document.body && (document.body.style.overflow = 'hidden');

    // Increment counter
    chrome.storage.sync.get(['blockedToday', 'lastDate'], (res) => {
      const today = new Date().toDateString();
      let count = (res.lastDate === today) ? (res.blockedToday || 0) + 1 : 1;
      chrome.storage.sync.set({ blockedToday: count, lastDate: today });
      const el = document.getElementById('ns-count');
      if (el) {
        el.textContent = count;
        animateCounter(el, count);
      }
    });

    document.getElementById('ns-back').addEventListener('click', () => {
      window.location.href = 'https://www.youtube.com';
    });

    document.getElementById('ns-disable').addEventListener('click', () => {
      chrome.storage.sync.set({ enabled: false });
      removeOverlay();
    });
  }

  function animateCounter(el, target) {
    let start = 0;
    const duration = 600;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      el.textContent = Math.floor(progress * target);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target;
    };
    requestAnimationFrame(step);
  }

  function removeOverlay() {
    if (overlay) {
      overlay.classList.add('ns-exit');
      setTimeout(() => {
        overlay && overlay.remove();
        overlay = null;
        document.body && (document.body.style.overflow = '');
      }, 400);
    }
  }

  function checkURL() {
    if (isEnabled && isShorts()) {
      createOverlay();
    } else {
      removeOverlay();
    }
  }

  function init() {
    checkURL();

    // Watch for SPA navigation
    let lastPath = location.pathname;
    checkInterval = setInterval(() => {
      if (location.pathname !== lastPath) {
        lastPath = location.pathname;
        checkURL();
      }
    }, 300);

    // Also intercept pushState / replaceState
    const origPush = history.pushState.bind(history);
    const origReplace = history.replaceState.bind(history);

    history.pushState = function (...args) {
      origPush(...args);
      setTimeout(checkURL, 50);
    };

    history.replaceState = function (...args) {
      origReplace(...args);
      setTimeout(checkURL, 50);
    };

    window.addEventListener('popstate', () => setTimeout(checkURL, 50));
  }
})();

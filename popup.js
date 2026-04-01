// popup.js

const toggle = document.getElementById('toggle');
const statusText = document.getElementById('status-text');
const countToday = document.getElementById('count-today');
const countTotal = document.getElementById('count-total');

chrome.storage.sync.get(['enabled', 'blockedToday', 'blockedTotal', 'lastDate'], (res) => {
  const today = new Date().toDateString();
  const isEnabled = res.enabled !== false;
  const todayCount = res.lastDate === today ? (res.blockedToday || 0) : 0;
  const totalCount = res.blockedTotal || 0;

  toggle.checked = isEnabled;
  updateStatus(isEnabled);
  animateNum(countToday, todayCount);
  animateNum(countTotal, totalCount);
});

toggle.addEventListener('change', () => {
  const enabled = toggle.checked;
  chrome.storage.sync.set({ enabled });
  updateStatus(enabled);
});

function updateStatus(enabled) {
  if (enabled) {
    statusText.textContent = '⛔ ACTIVO — shorts bloqueados';
    statusText.className = 'status-text on';
  } else {
    statusText.textContent = '○ desactivado';
    statusText.className = 'status-text off';
  }
}

function animateNum(el, target) {
  if (target === 0) { el.textContent = '0'; return; }
  let start = 0;
  const duration = 500;
  const startTime = performance.now();
  const step = (now) => {
    const progress = Math.min((now - startTime) / duration, 1);
    el.textContent = Math.floor(progress * target);
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target;
  };
  requestAnimationFrame(step);
}

// Track total blocked across all time
chrome.storage.onChanged.addListener((changes) => {
  if (changes.blockedToday) {
    chrome.storage.sync.get(['blockedTotal'], (res) => {
      const newTotal = (res.blockedTotal || 0) + 1;
      chrome.storage.sync.set({ blockedTotal: newTotal });
      countTotal.textContent = newTotal;
    });
  }
});

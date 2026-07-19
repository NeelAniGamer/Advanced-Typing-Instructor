// UI Controller
// TOAST SYSTEM
let _toastBox = null;
function showToast(message, type = 'info', ms = 2800) {
  if (!_toastBox) {
    _toastBox = document.getElementById('toast-container');
    if (!_toastBox) { _toastBox = document.createElement('div'); _toastBox.id = 'toast-container'; document.body.appendChild(_toastBox); }
  }
  const ICON  = { success: '✅', error: '❌', info: '💡', warning: '⚠️' };
  const LABEL = { success: 'Success', error: 'Error', info: 'Notice', warning: 'Warning' };
  const n = document.createElement('div');
  n.className = `toast-notif toast-${type}`;
  n.innerHTML = `<span class="toast-notif-icon">${ICON[type]||'💡'}</span>
    <div class="toast-notif-body">
      <div class="toast-notif-title">${LABEL[type]||'Notice'}</div>
      <div class="toast-notif-msg">${message}</div>
    </div>
    <div class="toast-notif-progress" style="animation-duration:${ms}ms"></div>`;
  n.addEventListener('click', () => _dismissToast(n));
  _toastBox.appendChild(n);
  setTimeout(() => _dismissToast(n), ms);
}
function _dismissToast(n) {
  if (n.classList.contains('removing')) return;
  n.classList.add('removing');
  setTimeout(() => n.remove(), 300);
}

// Expose to window
window.showToast = showToast;

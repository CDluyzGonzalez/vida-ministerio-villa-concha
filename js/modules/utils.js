// ============================================================
// VIDA Y MINISTERIO — VILLA CONCHA
// js/modules/utils.js
// Funciones de utilidad, formateo y almacenamiento
// ============================================================

// Normalizar nombres para comparaciones sin tildes ni caracteres especiales
function normName(s) {
  return (s || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[´'`.]/g, '')
    .replace(/\s+/g, ' ');
}

// Almacenamiento local compatible con navegadores y PWA
async function appStorageGet(key) {
  try {
    if (window.storage && typeof window.storage.get === 'function') {
      const result = await window.storage.get(key, true);
      if (result) return result;
    }
  } catch (_) {}

  try {
    if (window.localStorage) {
      const value = window.localStorage.getItem(key);
      return value === null ? null : { value };
    }
  } catch (_) {}

  return null;
}

async function appStorageSet(key, value) {
  try {
    if (window.storage && typeof window.storage.set === 'function') {
      await window.storage.set(key, value, true);
      return true;
    }
  } catch (_) {}

  try {
    if (window.localStorage) {
      window.localStorage.setItem(key, value);
      return true;
    }
  } catch (_) {}

  return false;
}

// Mostrar notificación flotante (Toast)
function showToast(message, type = 'info', duration = 3000) {
  let container = document.getElementById('wm-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'wm-toast-container';
    container.className = 'wm-toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `wm-toast wm-toast-${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Escapar texto para inserción HTML segura
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

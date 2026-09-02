// ============================================================
// VIDA Y MINISTERIO — VILLA CONCHA
// js/modules/admin.js
// Gestión de Administrador con Estilos Originales y PIN SHA-256
// ============================================================

const DEFAULT_PIN_HASH = '79404babda0441a8756da8dc02bae87094fd393739678ccd7f36f90127f651b8';

// Calcular hash SHA-256 en el navegador
async function sha256(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Abrir modal para autenticación de Administrador
function openAdminPinModal() {
  const existing = document.getElementById('wm-admin-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'wm-admin-modal';
  modal.className = 'overlay';
  modal.innerHTML = `
    <div class="modal" style="max-width: 380px;">
      <div class="modal-head">
        <h3>🔐 Modo Administrador</h3>
        <p>Ingresa el PIN para activar la edición</p>
      </div>
      <div class="modal-list" style="padding: 20px 18px;">
        <p style="margin: 0 0 12px; font-size: 13px; color: var(--muted); line-height: 1.4;">
          Ingresa el PIN de 4 a 6 dígitos para editar programas, asignar publicadores y ver el Dashboard.
        </p>
        <div class="field">
          <input
            type="password"
            id="admin-pin-input"
            class="search-input"
            placeholder="••••"
            maxlength="8"
            autofocus
            style="text-align: center; font-size: 22px; letter-spacing: 6px; width: 100%; box-sizing: border-box;"
          />
        </div>
        <div id="admin-pin-error" style="color: var(--terra-warn); font-size: 12px; font-weight: 600; margin-top: 8px; display: none;"></div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-ghost btn-sm" onclick="closeAdminPinModal()">Cancelar</button>
        <button class="btn btn-primary btn-sm" id="btn-submit-pin" onclick="submitAdminPin()">Ingresar</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const input = document.getElementById('admin-pin-input');
  if (input) {
    input.focus();
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submitAdminPin();
    });
  }
}

function closeAdminPinModal() {
  const modal = document.getElementById('wm-admin-modal');
  if (modal) modal.remove();
}

async function submitAdminPin() {
  const input = document.getElementById('admin-pin-input');
  const errorDiv = document.getElementById('admin-pin-error');
  if (!input) return;

  const pin = input.value.trim();
  if (!pin) {
    if (errorDiv) {
      errorDiv.textContent = 'Por favor ingresa el PIN';
      errorDiv.style.display = 'block';
    }
    return;
  }

  const hash = await sha256(pin);
  const isValid = await apiVerifyPin(hash);

  if (isValid) {
    isAdmin = true;
    writeToken = hash;
    closeAdminPinModal();
    showToast('Modo Administrador activado', 'success');
    render();
  } else {
    if (errorDiv) {
      errorDiv.textContent = 'PIN incorrecto. Intenta de nuevo.';
      errorDiv.style.display = 'block';
    }
    input.value = '';
    input.focus();
  }
}

function logoutAdmin() {
  isAdmin = false;
  writeToken = null;
  showToast('Has salido del modo administrador', 'info');
  if (currentTab === 'dashboard') {
    currentTab = 'programa';
  }
  render();
}

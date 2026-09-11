// ============================================================
// VIDA Y MINISTERIO — VILLA CONCHA
// js/modules/admin.js
// Gestión de Administrador con Estilos Originales y PIN SHA-256
// ============================================================

const DEFAULT_PIN_HASH = '79404babda0441a8756da8dc02bae87094fd393739678ccd7f36f90127f651b8';

// Función de hash SHA-256 en puro JavaScript (compatible con contextos no-HTTPS / IP local en móviles)
function sha256JsFallback(ascii) {
  const ch = (x, y, z) => (x & y) ^ (~x & z);
  const maj = (x, y, z) => (x & y) ^ (x & z) ^ (y & z);
  const rotr = (n, x) => (x >>> n) | (x << (32 - n));
  const sigma0 = x => rotr(2, x) ^ rotr(13, x) ^ rotr(22, x);
  const sigma1 = x => rotr(6, x) ^ rotr(11, x) ^ rotr(25, x);
  const gamma0 = x => rotr(7, x) ^ rotr(18, x) ^ (x >>> 3);
  const gamma1 = x => rotr(17, x) ^ rotr(19, x) ^ (x >>> 10);

  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  let H = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];

  const utf8 = unescape(encodeURIComponent(ascii));
  const bytes = [];
  for (let i = 0; i < utf8.length; i++) bytes.push(utf8.charCodeAt(i));

  const bitLen = bytes.length * 8;
  bytes.push(0x80);
  while ((bytes.length + 8) % 64 !== 0) bytes.push(0);

  for (let i = 0; i < 4; i++) bytes.push(0);
  bytes.push((bitLen >>> 24) & 0xff);
  bytes.push((bitLen >>> 16) & 0xff);
  bytes.push((bitLen >>> 8) & 0xff);
  bytes.push(bitLen & 0xff);

  const words = [];
  for (let i = 0; i < bytes.length; i += 4) {
    words.push((bytes[i] << 24) | (bytes[i + 1] << 16) | (bytes[i + 2] << 8) | bytes[i + 3]);
  }

  for (let chunk = 0; chunk < words.length; chunk += 16) {
    const W = new Array(64);
    for (let t = 0; t < 16; t++) W[t] = words[chunk + t];
    for (let t = 16; t < 64; t++) {
      W[t] = (gamma1(W[t - 2]) + W[t - 7] + gamma0(W[t - 15]) + W[t - 16]) | 0;
    }

    let [a, b, c, d, e, f, g, h] = H;

    for (let t = 0; t < 64; t++) {
      const T1 = (h + sigma1(e) + ch(e, f, g) + K[t] + W[t]) | 0;
      const T2 = (sigma0(a) + maj(a, b, c)) | 0;
      h = g;
      g = f;
      f = e;
      e = (d + T1) | 0;
      d = c;
      c = b;
      b = a;
      a = (T1 + T2) | 0;
    }

    H[0] = (H[0] + a) | 0;
    H[1] = (H[1] + b) | 0;
    H[2] = (H[2] + c) | 0;
    H[3] = (H[3] + d) | 0;
    H[4] = (H[4] + e) | 0;
    H[5] = (H[5] + f) | 0;
    H[6] = (H[6] + g) | 0;
    H[7] = (H[7] + h) | 0;
  }

  return H.map(x => (x >>> 0).toString(16).padStart(8, '0')).join('');
}

// Calcular hash SHA-256 en el navegador con soporte seguro y fallback
async function sha256(text) {
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle && typeof window.crypto.subtle.digest === 'function') {
      const encoder = new TextEncoder();
      const data = encoder.encode(text);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (_) {}

  // Fallback para HTTP / dispositivos sin Web Crypto API
  return sha256JsFallback(text);
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
  const btn = document.getElementById('btn-submit-pin');
  if (!input) return;

  const pin = input.value.trim();
  if (!pin) {
    if (errorDiv) {
      errorDiv.textContent = 'Por favor ingresa el PIN';
      errorDiv.style.display = 'block';
    }
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Verificando…';
  }
  if (errorDiv) errorDiv.style.display = 'none';

  try {
    const hash = await sha256(pin);
    const isValid = await apiVerifyPin(hash, pin);

    if (isValid) {
      isAdmin = true;
      writeToken = hash || pin;
      try {
        localStorage.setItem('wm_admin_token', writeToken);
        sessionStorage.setItem('wm_admin_token', writeToken);
      } catch (_) {}
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
  } catch (err) {
    console.error('Error al verificar PIN:', err);
    if (errorDiv) {
      errorDiv.textContent = 'Error al verificar. Intenta de nuevo.';
      errorDiv.style.display = 'block';
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Ingresar';
    }
  }
}

function logoutAdmin() {
  isAdmin = false;
  writeToken = null;
  try {
    localStorage.removeItem('wm_admin_token');
    sessionStorage.removeItem('wm_admin_token');
  } catch (_) {}
  showToast('Has salido del modo administrador', 'info');
  if (currentTab === 'dashboard') {
    currentTab = 'programa';
  }
  render();
}

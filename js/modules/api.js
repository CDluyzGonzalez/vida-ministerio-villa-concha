// ============================================================
// VIDA Y MINISTERIO — VILLA CONCHA
// js/modules/api.js
// Cliente HTTP para Google Cloud REST API y Sincronización Local
// ============================================================

const API_BASE_URL = ''; // En Cloud Run y Express se usa ruta relativa '/api'

let isApiOnline = false;

// Estado de conexión en la UI
function setApiStatus(connected, message) {
  isApiOnline = !!connected;
  const badge = document.getElementById('sheets-status');
  if (!badge) return;

  badge.className = 'sheets-status ' + (connected ? 'connected' : 'offline');
  badge.textContent = connected
    ? '☁ Google Cloud Firestore Conectado'
    : message || '☁ Modo Local / Sin Conexión';
}

// 1. Cargar Publicadores
async function apiLoadPersonas() {
  try {
    const res = await fetch('/api/personas');
    if (res.ok) {
      const data = await res.json();
      if (data.ok && Array.isArray(data.personas)) {
        setApiStatus(true);
        return data.personas;
      }
    }
  } catch (error) {
    console.warn('API /api/personas no disponible, usando caché local:', error.message);
  }

  // Fallback a almacenamiento local o datos por defecto
  setApiStatus(false);
  const stored = await appStorageGet('wm-people');
  if (stored?.value) {
    try {
      return JSON.parse(stored.value);
    } catch (_) {}
  }
  return typeof DEFAULT_PEOPLE !== 'undefined' ? JSON.parse(JSON.stringify(DEFAULT_PEOPLE)) : [];
}

// 2. Cargar Programa de un Bimestre
async function apiLoadPrograma(bimestreId) {
  try {
    const res = await fetch(`/api/programa/${encodeURIComponent(bimestreId)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.ok && data.programa) {
        setApiStatus(true);
        return data.programa;
      }
    }
  } catch (error) {
    console.warn(`API /api/programa/${bimestreId} no disponible, usando caché local:`, error.message);
  }

  // Fallback a almacenamiento local o datos por defecto
  setApiStatus(false);
  const stored = await appStorageGet(`wm-program-${bimestreId}`);
  if (stored?.value) {
    try {
      return JSON.parse(stored.value);
    } catch (_) {}
  }
  
  if (typeof DEFAULT_PROGRAM !== 'undefined') {
    const found = DEFAULT_PROGRAM.find(p => p.id === bimestreId || p.bimestre.toLowerCase().includes(bimestreId.toLowerCase()));
    if (found) return JSON.parse(JSON.stringify(found));
  }
  return null;
}

// 2b. Cargar Lista de Bimestres Disponibles (desde Firestore)
async function apiLoadBimestres() {
  const defaults = ['Marzo - Abril', 'Mayo - Junio', 'Julio - Agosto', 'Septiembre - Octubre'];
  try {
    const res = await fetch('/api/bimestres');
    if (res.ok) {
      const data = await res.json();
      if (data.ok && Array.isArray(data.bimestres) && data.bimestres.length > 0) {
        const nombres = data.bimestres.map(b => b.nombre || b.id);
        // Fusionar con defaults para no perder ninguno
        const all = [...new Set([...defaults, ...nombres])];
        return all;
      }
    }
  } catch (error) {
    console.warn('No se pudo cargar lista de bimestres:', error.message);
  }
  return defaults;
}


// 3. Guardar Programa
async function apiSavePrograma(bimestreId, programData, token) {
  try {
    // Guardar siempre en almacenamiento local para respuesta instantánea
    await appStorageSet(`wm-program-${bimestreId}`, JSON.stringify(programData));

    const res = await fetch(`/api/programa/${encodeURIComponent(bimestreId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bimestre: programData.bimestre,
        weeks: programData.weeks,
        token: token
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.ok) {
        setApiStatus(true);
        return true;
      }
    }
  } catch (error) {
    console.warn('No se pudo sincronizar programa con la nube:', error.message);
    setApiStatus(false, '☁ Guardado solo en local');
  }
  return true;
}

// 4. Guardar Publicador
async function apiSavePersona(personaData, token) {
  try {
    const res = await fetch('/api/personas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ persona: personaData, token })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.ok) return data.persona;
    }
  } catch (error) {
    console.warn('No se pudo guardar publicador en la nube:', error.message);
  }
  return personaData;
}

// 5. Verificar PIN de Administrador
async function apiVerifyPin(pinHash) {
  try {
    const res = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pinHash })
    });

    if (res.ok) {
      const data = await res.json();
      return data.authorized;
    }
  } catch (_) {}

  // Fallback local: comparar hash con DEFAULT_PIN_HASH
  return pinHash.toLowerCase() === DEFAULT_PIN_HASH.toLowerCase();
}

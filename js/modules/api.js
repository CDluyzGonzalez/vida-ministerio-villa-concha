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
      if (data.ok && Array.isArray(data.personas) && data.personas.length > 0) {
        setApiStatus(true);
        await appStorageSet('wm-people', JSON.stringify(data.personas));
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
      const parsed = JSON.parse(stored.value);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
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
      if (data.ok && data.programa && Array.isArray(data.programa.weeks) && data.programa.weeks.length > 0) {
        setApiStatus(true);
        await appStorageSet(`wm-program-${bimestreId}`, JSON.stringify(data.programa));
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
      const parsed = JSON.parse(stored.value);
      if (parsed && Array.isArray(parsed.weeks) && parsed.weeks.length > 0) return parsed;
    } catch (_) {}
  }
  
  if (typeof DEFAULT_PROGRAM !== 'undefined' && Array.isArray(DEFAULT_PROGRAM)) {
    const found = DEFAULT_PROGRAM.find(p => p.id === bimestreId || (p.bimestre && p.bimestre.toLowerCase().includes(bimestreId.toLowerCase())));
    if (found) return JSON.parse(JSON.stringify(found));

    // Generar copia limpia usando el primer bimestre de plantilla
    const template = DEFAULT_PROGRAM[0];
    if (template) {
      const clean = JSON.parse(JSON.stringify(template));
      clean.id = sanitizeBimestreId(bimestreId);
      clean.bimestre = bimestreId;
      clean.weeks = (clean.weeks || []).map((w, idx) => {
        const nw = JSON.parse(JSON.stringify(w));
        nw.id = `${clean.id}__${idx}`;
        nw.items = (nw.items || []).map(it => {
          const ni = JSON.parse(JSON.stringify(it));
          if (ni.hasOwnProperty('name')) ni.name = '';
          if (ni.hasOwnProperty('conductor')) ni.conductor = '';
          if (ni.hasOwnProperty('lector')) ni.lector = '';
          if (Array.isArray(ni.subs)) {
            ni.subs = ni.subs.map(s => ({ ...s, name: '' }));
          }
          return ni;
        });
        return nw;
      });
      return clean;
    }
  }
  return null;
}

// 2b. Cargar Lista de Bimestres Disponibles (desde Firestore)
async function apiLoadBimestres() {
  const defaults = [
    'Enero - Febrero',
    'Marzo - Abril',
    'Mayo - Junio',
    'Julio - Agosto',
    'Septiembre - Octubre',
    'Noviembre - Diciembre'
  ];
  try {
    const res = await fetch('/api/bimestres');
    if (res.ok) {
      const data = await res.json();
      if (data.ok && Array.isArray(data.bimestres) && data.bimestres.length > 0) {
        const nombres = data.bimestres.map(b => b.nombre || b.id);
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

    const data = await res.json().catch(() => ({}));
    if (res.ok && data.ok) {
      setApiStatus(true);
      return true;
    } else {
      console.warn('Respuesta no exitosa al guardar programa:', res.status, data);
      showToast('⚠️ No se pudo guardar en la nube: ' + (data?.error || `HTTP ${res.status}`), 'warning');
      setApiStatus(false, '☁ Error al guardar');
      return false;
    }
  } catch (error) {
    console.warn('No se pudo sincronizar programa con la nube:', error.message);
    showToast('⚠️ Error de conexión al guardar programa', 'warning');
    setApiStatus(false, '☁ Sin conexión');
    return false;
  }
}

// 4. Guardar Publicador Individual
async function apiSavePersona(personaData, token) {
  try {
    const res = await fetch('/api/personas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ persona: personaData, token })
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok && data.ok) {
      setApiStatus(true);
      return data.persona;
    } else {
      console.warn('Error al guardar publicador:', res.status, data);
      showToast('⚠️ Error al guardar en la nube: ' + (data?.error || `HTTP ${res.status}`), 'warning');
      return null;
    }
  } catch (error) {
    console.warn('No se pudo guardar publicador en la nube:', error.message);
    showToast('⚠️ Error de conexión al guardar publicador', 'warning');
    return null;
  }
}

// 4b. Eliminar Publicador Individual
async function apiDeletePersona(personId, token) {
  try {
    const res = await fetch(`/api/personas/${encodeURIComponent(personId)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': token || ''
      },
      body: JSON.stringify({ token })
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok && data.ok) {
      setApiStatus(true);
      return true;
    } else {
      console.warn('Error al eliminar publicador:', res.status, data);
      showToast('⚠️ Error al eliminar en la nube: ' + (data?.error || `HTTP ${res.status}`), 'warning');
      return false;
    }
  } catch (error) {
    console.warn(`No se pudo eliminar publicador ${personId} en la nube:`, error.message);
    showToast('⚠️ Error de conexión al eliminar publicador', 'warning');
    return false;
  }
}

// 4c. Sincronizar Lote Completo de Publicadores
async function apiSyncAllPersonas(personas, token) {
  try {
    const res = await fetch('/api/personas/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ personas, token })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.ok) {
        setApiStatus(true);
        return true;
      }
    }
  } catch (error) {
    console.warn('No se pudo sincronizar lote de publicadores:', error.message);
  }
  return false;
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

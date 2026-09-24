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
// REGLA: El servidor SIEMPRE gana. No usar caché viejo ni datos por defecto.
async function apiLoadPrograma(bimestreId) {
  try {
    const res = await fetch(`/api/programa/${encodeURIComponent(bimestreId)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.ok && data.programa && Array.isArray(data.programa.weeks) && data.programa.weeks.length > 0) {
        setApiStatus(true);
        // Limpiar caché viejo para que nunca se use una versión desactualizada
        try { localStorage.removeItem(`wm-program-${bimestreId}`); } catch(_) {}
        return data.programa;
      }
    }
  } catch (error) {
    console.warn(`API /api/programa/${bimestreId} no disponible:`, error.message);
  }

  // Sin conexión — NO mostrar datos viejos, avisar al usuario
  setApiStatus(false);
  showToast('⚠️ Sin conexión al servidor. Recargue cuando tenga internet.', 'warning', 6000);
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


// 3. Guardar Programa (solo en la nube, sin caché local)
async function apiSavePrograma(bimestreId, programData, token) {
  try {
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

// 3b. Importar Programa Oficial desde Guía de Actividades (JW CDN)
async function apiImportMwb(year, issueMonth, token) {
  try {
    const res = await fetch('/api/programa/import-mwb', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year, issueMonth, token })
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok && data.ok) {
      setApiStatus(true);
      return data.programa;
    } else {
      showToast('⚠️ ' + (data?.error || `Error al importar (HTTP ${res.status})`), 'warning');
      return null;
    }
  } catch (error) {
    console.error('Error de red al importar programa oficial:', error);
    showToast('⚠️ Error de conexión al importar programa', 'warning');
    return null;
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
async function apiVerifyPin(pinHash, plainPin = '') {
  try {
    const res = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pinHash, pin: plainPin })
    });

    if (res.ok) {
      const data = await res.json();
      return !!data.authorized;
    }
  } catch (_) {}

  // Fallback local: comparar hash con DEFAULT_PIN_HASH
  return !!(pinHash && pinHash.toLowerCase() === DEFAULT_PIN_HASH.toLowerCase());
}

// 6. Cargar Salidas al Servicio de un Mes
async function apiLoadSalidas(mesId) {
  try {
    const res = await fetch(`/api/salidas/${encodeURIComponent(mesId)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.ok && data.salidas) {
        setApiStatus(true);
        await appStorageSet(`wm-salidas-${mesId}`, JSON.stringify(data.salidas));
        return data.salidas;
      }
    }
  } catch (error) {
    console.warn(`API /api/salidas/${mesId} no disponible, usando caché local:`, error.message);
  }

  // Fallback a almacenamiento local o plantilla básica
  setApiStatus(false);
  const stored = await appStorageGet(`wm-salidas-${mesId}`);
  if (stored?.value) {
    try {
      const parsed = JSON.parse(stored.value);
      if (parsed) return parsed;
    } catch (_) {}
  }

  return null;
}

// 7. Guardar Salidas al Servicio de un Mes
async function apiSaveSalidas(mesId, salidasData, token) {
  // 1. Guardar de inmediato en almacenamiento local (optimista)
  try {
    await appStorageSet(`wm-salidas-${mesId}`, JSON.stringify(salidasData));
  } catch (storageError) {
    console.warn('Error al guardar salidas localmente:', storageError);
  }

  // 2. Persistir en la nube vía REST API (Firestore)
  try {
    const res = await fetch(`/api/salidas/${encodeURIComponent(mesId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ salidas: salidasData, token })
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok && data.ok) {
      setApiStatus(true);
      showToast('☁ Salidas al servicio guardadas en la nube', 'success');
      return true;
    } else {
      console.warn('Error al guardar salidas en la nube:', res.status, data);
      showToast('⚠️ Guardado localmente (sin conexión nube)', 'warning');
      return false;
    }
  } catch (error) {
    console.warn(`No se pudo guardar salidas/${mesId} en la nube:`, error.message);
    showToast('⚠️ Guardado localmente (sin conexión)', 'warning');
    return false;
  }
}

// 8. Cargar Catálogo de Lugares Frecuentes
async function apiLoadLugares() {
  try {
    const res = await fetch('/api/lugares-salidas');
    if (res.ok) {
      const data = await res.json();
      if (data.ok && Array.isArray(data.lugares)) {
        await appStorageSet('wm-lugares-salidas', JSON.stringify(data.lugares));
        return data.lugares;
      }
    }
  } catch (error) {
    console.warn('API /api/lugares-salidas no disponible, usando caché:', error.message);
  }

  const stored = await appStorageGet('wm-lugares-salidas');
  if (stored?.value) {
    try {
      const parsed = JSON.parse(stored.value);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (_) {}
  }

  return [
    { id: 'lug_1', nombre: 'Mileydis Rodriguez (San Francisco) Calle 1F # 16-68' },
    { id: 'lug_2', nombre: 'Familia Quiñonez (San Carlos) Calle 1D 16-39' },
    { id: 'lug_3', nombre: 'Familia Prada (San Carlos) Carrera 17A # 1N-54' },
    { id: 'lug_4', nombre: 'Predicación por carta / llamadas telefónicas' },
    { id: 'lug_5', nombre: 'Vereda Limonal Casa los Pinos' },
    { id: 'lug_6', nombre: 'Patricia Avila (San Francisco) Carrera 18 # 1E-16' },
    { id: 'lug_7', nombre: 'Familia Prieto (San Francisco) Cll. 1E # 15-23' },
    { id: 'lug_8', nombre: 'Salón del Reino (Punto de salida)' }
  ];
}

// 9. Guardar Catálogo de Lugares Frecuentes
async function apiSaveLugares(lugares, token) {
  try {
    await appStorageSet('wm-lugares-salidas', JSON.stringify(lugares));
  } catch (err) {
    console.warn('Error al guardar lugares localmente:', err);
  }

  try {
    const res = await fetch('/api/lugares-salidas', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lugares, token })
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.ok) {
      showToast('☁ Lugares guardados en la nube', 'success');
      return true;
    }
  } catch (error) {
    console.warn('No se pudo guardar lugares en la nube:', error.message);
  }
  return false;
}

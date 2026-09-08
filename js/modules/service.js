// ============================================================
// VIDA Y MINISTERIO — VILLA CONCHA
// js/modules/service.js
// Módulo de Salidas al Servicio (Predicación Mensual)
// Soporte para PC/Móvil, Salida Especial de Lunes, Flujo de 2 Meses y Edición
// ============================================================

// Estado del módulo de servicio
let CURRENT_SALIDAS = null;
let SERVICE_SELECTED_MONTH_KEY = null; // 'YYYY-MM'
let isServiceLoading = false;
let LUGARES_SALIDAS = [];

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

let SERVICE_PREP_MONTH_KEY = (function() {
  try {
    const saved = localStorage.getItem('wm-service-prep-month-key');
    if (saved && /^\d{4}-\d{2}$/.test(saved)) return saved;
  } catch (_) {}
  return getNextMonthKey();
})();

// Obtener clave del mes actual del calendario (ej: '2026-09')
function getCurrentMonthKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

// Obtener clave del mes siguiente del calendario (ej: '2026-10')
function getNextMonthKey() {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const y = next.getFullYear();
  const m = String(next.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

// Obtener nombre formateado del mes (ej: 'Septiembre 2026')
function getMonthLabelFromKey(key) {
  if (!key) return '';
  const [yStr, mStr] = key.split('-');
  const idx = parseInt(mStr, 10) - 1;
  const name = (idx >= 0 && idx < 12) ? MONTH_NAMES[idx] : key;
  return `${name} ${yStr}`;
}

// Calcular sábados y domingos de un mes y año con el calendario real
function calculateCalendarDaysForMonth(year, monthNum) {
  const mIndex = monthNum - 1;
  const mesNombre = (mIndex >= 0 && mIndex < 12) ? MONTH_NAMES[mIndex] : 'Mes';
  const totalDays = new Date(year, monthNum, 0).getDate();
  const sabados = [];
  const domingos = [];
  const sabNotas = ['PREDICACION POR CARTA', 'PREDICACION PUBLICA', 'TABLANCA', 'PREDICACION PUBLICA', 'PREDICACION POR CARTA'];
  let sabCount = 0;
  let domCount = 0;

  for (let d = 1; d <= totalDays; d++) {
    const dt = new Date(year, mIndex, d);
    const dow = dt.getDay(); // 0 = Domingo, 6 = Sábado
    if (dow === 6) {
      sabCount++;
      sabados.push({
        dayNum: d,
        fecha: `${d} de ${mesNombre}`,
        nota: sabNotas[(sabCount - 1) % sabNotas.length]
      });
    } else if (dow === 0) {
      domCount++;
      domingos.push({
        dayNum: d,
        fecha: `${d} de ${mesNombre}`,
        isGeneral: domCount === 3
      });
    }
  }

  return { sabados, domingos, mesNombre, totalDays };
}

// Detectar si un mes tiene fechas no calculadas/dummy (ej: "Sábado 1", "Domingo 1")
function hasDummyDates(salidas) {
  if (!salidas) return false;
  const dummyRegex = /^(sábado|sabado|domingo)\s+\d+$/i;
  const sabDummy = Array.isArray(salidas.sabados) && salidas.sabados.some(s => dummyRegex.test((s?.fecha || '').trim()));
  const domDummy = Array.isArray(salidas.domingos) && salidas.domingos.some(d => dummyRegex.test((d?.fecha || '').trim()));
  return sabDummy || domDummy;
}

// Obtener lista normalizada de puntos de salida de un sábado
function getSabadoPuntos(item) {
  if (!item) return [];
  if (Array.isArray(item.puntos) && item.puntos.length > 0) {
    return item.puntos;
  }
  return [
    {
      id: item.id || `p_${Date.now()}`,
      hora: item.hora || '8:30 a.m.',
      lugar: item.lugar || '',
      nota: item.nota || 'PREDICACION PUBLICA',
      capitan: item.capitan || ''
    }
  ];
}

// Ajustar automáticamente las fechas de sábados y domingos al calendario real
function adjustSalidasDatesToCalendar(salidas, monthKey) {
  if (!salidas) return salidas;
  const key = monthKey || salidas.id || SERVICE_SELECTED_MONTH_KEY || getCurrentMonthKey();
  const [yStr, mStr] = key.split('-');
  const year = parseInt(yStr, 10);
  const monthNum = parseInt(mStr, 10);
  if (isNaN(year) || isNaN(monthNum)) return salidas;

  const cal = calculateCalendarDaysForMonth(year, monthNum);
  salidas.id = key;
  salidas.mes = cal.mesNombre;
  salidas.anio = year;
  salidas.titulo = `HORARIOS DE PREDICACIÓN ${cal.mesNombre.toUpperCase()} ${year}`;

  // Ajustar Sábados
  if (!Array.isArray(salidas.sabados)) salidas.sabados = [];
  const newSabados = [];
  cal.sabados.forEach((cSab, i) => {
    const existing = salidas.sabados[i] || {};
    if (Array.isArray(existing.puntos) && existing.puntos.length > 0) {
      newSabados.push({
        id: existing.id || `sab_${i + 1}_${cSab.dayNum}`,
        fecha: cSab.fecha,
        puntos: existing.puntos
      });
    } else {
      newSabados.push({
        id: existing.id || `sab_${i + 1}_${cSab.dayNum}`,
        fecha: cSab.fecha, // ej: "3 de Octubre"
        hora: existing.hora || '8:30 a.m.',
        lugar: existing.lugar || '',
        nota: existing.nota || cSab.nota,
        capitan: existing.capitan || ''
      });
    }
  });
  salidas.sabados = newSabados;

  // Ajustar Domingos
  if (!Array.isArray(salidas.domingos)) salidas.domingos = [];
  const newDomingos = [];
  cal.domingos.forEach((cDom, i) => {
    const existing = salidas.domingos[i] || {};
    const tipo = existing.tipo || (cDom.isGeneral ? 'general' : 'grupos');
    if (tipo === 'general') {
      newDomingos.push({
        id: existing.id || `dom_${i + 1}_${cDom.dayNum}`,
        fecha: cDom.fecha, // ej: "4 de Octubre"
        tipo: 'general',
        hora: existing.hora || '9:00 a.m.',
        lugar: existing.lugar || '',
        capitan: existing.capitan || ''
      });
    } else {
      newDomingos.push({
        id: existing.id || `dom_${i + 1}_${cDom.dayNum}`,
        fecha: cDom.fecha, // ej: "4 de Octubre"
        tipo: 'grupos',
        hora: existing.hora || '9:00 a.m.',
        salidas: Array.isArray(existing.salidas) && existing.salidas.length > 0 ? existing.salidas : [
          { grupo: 'Grupos 1, 2, 3, 4, 10', lugar: '', capitan: '' },
          { grupo: 'Grupos 5, 6, 7, 8, 9', lugar: '', capitan: '' }
        ]
      });
    }
  });
  salidas.domingos = newDomingos;

  return salidas;
}

// Ordenar salidas entre semana por día y hora (Martes -> Miércoles -> Jueves -> Viernes)
function sortEntreSemanaEntries(entries) {
  if (!Array.isArray(entries)) return [];

  const dayOrder = {
    'lunes': 1,
    'martes': 2,
    'miercoles': 3,
    'miércoles': 3,
    'jueves': 4,
    'viernes': 5,
    'sabado': 6,
    'sábado': 6,
    'domingo': 7
  };

  return [...entries].sort((a, b) => {
    const diaA = (a.dia || '').toLowerCase();
    const diaB = (b.dia || '').toLowerCase();

    let orderA = 99;
    let orderB = 99;

    for (const [day, val] of Object.entries(dayOrder)) {
      if (diaA.includes(day)) { orderA = val; break; }
    }
    for (const [day, val] of Object.entries(dayOrder)) {
      if (diaB.includes(day)) { orderB = val; break; }
    }

    if (orderA !== orderB) return orderA - orderB;

    // Si es el mismo día, ordenar por turno/hora (Mañana antes de Tarde)
    const isTardeA = diaA.includes('tarde') || (a.hora || '').toLowerCase().includes('p.m.') || (a.hora || '').toLowerCase().includes('pm');
    const isTardeB = diaB.includes('tarde') || (b.hora || '').toLowerCase().includes('p.m.') || (b.hora || '').toLowerCase().includes('pm');

    if (isTardeA !== isTardeB) {
      return isTardeA ? 1 : -1;
    }

    return (a.hora || '').localeCompare(b.hora || '');
  });
}

// Cargar datos de salidas y catálogo de lugares
async function loadSalidasData(monthKey) {
  const targetKey = monthKey || SERVICE_SELECTED_MONTH_KEY || getCurrentMonthKey();
  SERVICE_SELECTED_MONTH_KEY = targetKey;
  isServiceLoading = true;
  render();

  try {
    const [data, lugares] = await Promise.all([
      apiLoadSalidas(targetKey),
      (typeof apiLoadLugares === 'function' ? apiLoadLugares() : Promise.resolve([]))
    ]);

    if (Array.isArray(lugares)) {
      LUGARES_SALIDAS = lugares;
    }

    if (data) {
      if (Array.isArray(data.entre_semana)) {
        data.entre_semana.forEach((item, i) => {
          if (!item.id) item.id = `es_${i}_${Date.now()}`;
        });
        data.entre_semana = sortEntreSemanaEntries(data.entre_semana);
      }

      // Si tiene fechas dummy (ej: "Sábado 1", "Domingo 1"), auto-ajustar al calendario
      if (hasDummyDates(data) || (!data.sabados?.length && targetKey !== '2026-09')) {
        adjustSalidasDatesToCalendar(data, targetKey);
        apiSaveSalidas(targetKey, data, writeToken).catch(() => {});
      }

      CURRENT_SALIDAS = data;
    } else {
      // Si no existe ninguna salida para este mes, generar plantilla limpia ajustada al calendario real
      const freshData = adjustSalidasDatesToCalendar({
        id: targetKey,
        entre_semana: [
          { id: 'es_mar', dia: 'Martes', hora: '8:45 a.m.', lugar: '', capitan: '' },
          { id: 'es_mie', dia: 'Miércoles', hora: '8:45 a.m.', lugar: '', capitan: '' },
          { id: 'es_jue_am', dia: 'Jueves (Mañana)', hora: '8:45 a.m.', lugar: '', capitan: '' },
          { id: 'es_jue_pm', dia: 'Jueves (Tarde)', hora: '6:00 p.m.', lugar: 'Predicación por carta / llamadas', nota: 'ZOOM', capitan: '' },
          { id: 'es_vie_am', dia: 'Viernes (Mañana)', hora: '8:45 a.m.', lugar: '', capitan: '' },
          { id: 'es_vie_pm', dia: 'Viernes (Tarde)', hora: '6:00 p.m.', lugar: '', capitan: '' }
        ],
        lunes_especial: { activo: false, fecha: '', hora: '8:45 a.m.', lugar: '', capitan: '', destino: '' }
      }, targetKey);

      CURRENT_SALIDAS = freshData;
      apiSaveSalidas(targetKey, freshData, writeToken).catch(() => {});
    }
  } catch (err) {
    console.warn('Error al cargar salidas o lugares:', err);
  } finally {
    isServiceLoading = false;
    render();
  }
}

// Cambiar mes en modo admin ('current' | 'prep')
function switchServiceAdminMonth(mode) {
  const targetKey = (mode === 'prep') ? (SERVICE_PREP_MONTH_KEY || getNextMonthKey()) : getCurrentMonthKey();
  if (targetKey !== SERVICE_SELECTED_MONTH_KEY) {
    loadSalidasData(targetKey);
  }
}

// Seleccionar mes en preparación (01..12)
function onSelectServicePrepMonth(monthStr) {
  const curPrep = SERVICE_PREP_MONTH_KEY || getNextMonthKey();
  const [yStr] = curPrep.split('-');
  const newKey = `${yStr}-${monthStr}`;
  SERVICE_PREP_MONTH_KEY = newKey;
  try { localStorage.setItem('wm-service-prep-month-key', newKey); } catch (_) {}
  loadSalidasData(newKey);
}

// Seleccionar año en preparación (ej: 2026)
function onSelectServicePrepYear(yearStr) {
  const curPrep = SERVICE_PREP_MONTH_KEY || getNextMonthKey();
  const [, mStr] = curPrep.split('-');
  const newKey = `${yearStr}-${mStr}`;
  SERVICE_PREP_MONTH_KEY = newKey;
  try { localStorage.setItem('wm-service-prep-month-key', newKey); } catch (_) {}
  loadSalidasData(newKey);
}

// Ajustar manualmente sábados y domingos del mes actual según el calendario
async function ajustarFechasCalendarioActual() {
  if (!CURRENT_SALIDAS) return;
  const key = SERVICE_SELECTED_MONTH_KEY || getCurrentMonthKey();
  const label = getMonthLabelFromKey(key);

  if (!confirm(`¿Ajustar automáticamente las fechas de sábados y domingos según el calendario de ${label}?\n\n(Se conservarán los lugares y capitanes ya asignados)`)) {
    return;
  }

  adjustSalidasDatesToCalendar(CURRENT_SALIDAS, key);
  render();
  showToast(`✓ Fechas de sábados y domingos ajustadas a ${label}`, 'success');
  await apiSaveSalidas(key, CURRENT_SALIDAS, writeToken);
}

// ============================================================
// RENDER PRINCIPAL DE LA PESTAÑA SALIDAS AL SERVICIO
// ============================================================

function renderServiceTab() {
  const curKey = getCurrentMonthKey();
  const prepKey = SERVICE_PREP_MONTH_KEY || getNextMonthKey();

  // Si es modo lector, siempre forzar mes vigente
  if (!isAdmin && SERVICE_SELECTED_MONTH_KEY !== curKey) {
    SERVICE_SELECTED_MONTH_KEY = curKey;
  } else if (!SERVICE_SELECTED_MONTH_KEY) {
    SERVICE_SELECTED_MONTH_KEY = curKey;
  }

  const isCurrentMonth = SERVICE_SELECTED_MONTH_KEY === curKey;
  const salidas = CURRENT_SALIDAS;

  if (isServiceLoading || !salidas) {
    return `
      <section class="section-pad">
        <div class="service-schedule-wrap">
          <div class="service-loading-box">
            <div class="spinner"></div>
            <p>Cargando horarios de predicación...</p>
          </div>
        </div>
      </section>
    `;
  }

  const lunes = salidas.lunes_especial || { activo: false };
  // Ordenar cronológicamente entre semana por día y hora (in-place para sincronizar índices e IDs)
  if (Array.isArray(salidas.entre_semana)) {
    salidas.entre_semana.forEach((item, i) => {
      if (!item.id) item.id = `es_${i}_${Date.now()}`;
    });
    salidas.entre_semana = sortEntreSemanaEntries(salidas.entre_semana);
  }
  const entreSemana = salidas.entre_semana || [];
  const sabados = salidas.sabados || [];
  const domingos = salidas.domingos || [];

  return `
    <section class="section-pad">
      <div class="service-schedule-wrap">

        <!-- Barra Superior: Título, Estado y Selector de Meses (Admin) -->
        <div class="service-header-bar">
          <div>
            <div class="service-title-row">
              <h2>${escapeHtml(salidas.titulo || `HORARIOS DE PREDICACIÓN ${getMonthLabelFromKey(SERVICE_SELECTED_MONTH_KEY).toUpperCase()}`)}</h2>
              ${isCurrentMonth ? `
                <span class="service-badge service-badge-live">Mes Vigente</span>
              ` : `
                <span class="service-badge service-badge-draft">En Preparación (Borrador)</span>
              `}
            </div>
            <p class="service-subtitle">
              Congregación Villa Concha · Transición automática el 1 de cada mes a las 00:00
            </p>
          </div>

          <!-- Controles y Descarga SOLO para Modo Admin -->
          ${isAdmin ? `
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <button
                class="btn btn-ghost btn-sm"
                onclick="exportSalidasPdf()"
                title="Descargar programación de salidas en PDF (Hoja Carta)"
                style="font-weight: 600; display: inline-flex; align-items: center; gap: 4px; background: #ffffff; border: 1.5px solid var(--line); box-shadow: 0 1px 3px rgba(0,0,0,0.05);"
              >
                ⬇ Descargar PDF
              </button>

              <button
                class="btn btn-sm"
                style="background: #ffffff; color: var(--teal-deep); border: 1.5px solid var(--line); font-weight: 700; box-shadow: 0 1px 3px rgba(0,0,0,0.05);"
                onclick="openManageLugaresModal()"
                title="Administrar lugares frecuentes de salida (agregar, editar, eliminar)"
              >
                📍 Administrar Lugares
              </button>

              <div class="service-month-switcher">
                <button
                  class="service-switcher-btn ${isCurrentMonth ? 'active' : ''}"
                  onclick="switchServiceAdminMonth('current')"
                  title="Ver mes vigente"
                >
                  ${escapeHtml(getMonthLabelFromKey(curKey))} (Vigente)
                </button>
                <button
                  class="service-switcher-btn ${!isCurrentMonth ? 'active' : ''}"
                  onclick="switchServiceAdminMonth('prep')"
                  title="Ver mes en preparación"
                >
                  ${escapeHtml(getMonthLabelFromKey(prepKey))} (En preparación ✎)
                </button>
              </div>

              <!-- Selector de todos los meses y años + Ajuste automático de calendario -->
              <div class="service-prep-control-box">
                <span class="service-prep-label">Elegir Mes / Año:</span>
                <select
                  id="service-prep-month-select"
                  class="service-prep-select"
                  onchange="onSelectServicePrepMonth(this.value)"
                  title="Seleccionar mes en preparación"
                >
                  ${MONTH_NAMES.map((name, idx) => {
                    const mVal = String(idx + 1).padStart(2, '0');
                    const isSel = mVal === prepKey.split('-')[1];
                    return `<option value="${mVal}" ${isSel ? 'selected' : ''}>${name}</option>`;
                  }).join('')}
                </select>

                <select
                  id="service-prep-year-select"
                  class="service-prep-select"
                  onchange="onSelectServicePrepYear(this.value)"
                  title="Seleccionar año en preparación"
                >
                  ${[2025, 2026, 2027, 2028, 2029, 2030].map(yr => {
                    const isSel = String(yr) === prepKey.split('-')[0];
                    return `<option value="${yr}" ${isSel ? 'selected' : ''}>${yr}</option>`;
                  }).join('')}
                </select>

                <button
                  class="btn btn-sm"
                  onclick="ajustarFechasCalendarioActual()"
                  title="Ajustar automáticamente sábados y domingos de este mes según el calendario"
                  style="background: #ffffff; color: var(--teal-deep); border: 1.5px solid var(--line); font-weight: 700; padding: 4px 10px; font-size: 11.5px; white-space: nowrap;"
                >
                  🗓️ Ajustar Fechas al Calendario
                </button>
              </div>
            </div>
          ` : ''}
        </div>

        <!-- ========================================================
             1. SALIDA ESPECIAL DE LUNES (OPCIONAL)
             ======================================================== -->
        ${lunes && lunes.activo ? `
          <div class="service-card service-lunes-card">
            <div class="service-lunes-head">
              <div class="service-card-title">
                <span class="service-icon">⭐</span>
                <h3>Salida Especial de Lunes</h3>
              </div>
              ${isAdmin ? `
                <div style="display: flex; gap: 8px;">
                  <button class="btn btn-sm btn-ghost" onclick="openEditLunesModal()" title="Editar salida especial">
                    ✏️ Editar
                  </button>
                  <button class="btn btn-sm btn-danger" onclick="eliminarLunesEspecial()" title="Quitar salida especial de este mes">
                    ✕ Quitar Lunes
                  </button>
                </div>
              ` : ''}
            </div>

            <!-- Vista Tabla PC -->
            <div class="service-desktop-table-wrap">
              <table class="service-table">
                <thead>
                  <tr class="service-lunes-thead">
                    <th style="width: 200px;">FECHA EXACTA</th>
                    <th style="width: 110px;">HORA</th>
                    <th>LUGAR DE ENCUENTRO</th>
                    <th style="width: 220px;">QUIÉN SACA EL GRUPO (CAPITÁN)</th>
                    <th>A DÓNDE VAN (TERRITORIO)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <div class="service-date-cell">
                        <span>📅</span>
                        <strong>${escapeHtml(lunes.fecha || 'Lunes')}</strong>
                      </div>
                    </td>
                    <td class="service-time-cell">${escapeHtml(lunes.hora || '8:45 a.m.')}</td>
                    <td>
                      <div class="service-place-cell">
                        <span class="service-pin">📍</span>
                        <span>${escapeHtml(lunes.lugar || 'Salón del Reino')}</span>
                      </div>
                    </td>
                    <td>
                      <div class="service-captain-cell">
                        <span class="service-avatar">👤</span>
                        <strong class="service-captain-name">${escapeHtml(lunes.capitan || 'Hermano Asignado')}</strong>
                        ${isAdmin ? `
                          <button class="service-edit-cap-btn" onclick="openAssignCaptainModal('lunes', 0, 0)" title="Asignar Capitán">✎</button>
                        ` : ''}
                      </div>
                    </td>
                    <td>
                      <span class="service-territorio-tag">
                        ${escapeHtml(lunes.destino || 'Territorio por asignar')}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Vista Tarjeta Móvil -->
            <div class="service-mobile-cards">
              <div class="service-m-card">
                <div class="service-m-head">
                  <span class="service-date-cell">
                    <span>📅</span>
                    <strong>${escapeHtml(lunes.fecha || 'Lunes')}</strong>
                  </span>
                  <span class="service-time-cell">${escapeHtml(lunes.hora || '8:45 a.m.')}</span>
                </div>
                <div class="service-place-cell" style="margin: 6px 0;">
                  <span class="service-pin">📍</span>
                  <span>${escapeHtml(lunes.lugar || 'Salón del Reino')}</span>
                </div>
                <div class="service-territorio-box">
                  🎯 Destino: <strong>${escapeHtml(lunes.destino || 'Territorio asignado')}</strong>
                </div>
                <div class="service-m-captain-row">
                  <span style="color: var(--muted); font-size: 11px;">Saca el grupo:</span>
                  <div class="service-captain-cell">
                    <span class="service-avatar">👤</span>
                    <strong class="service-captain-name">${escapeHtml(lunes.capitan || 'Hermano Asignado')}</strong>
                    ${isAdmin ? `
                      <button class="service-edit-cap-btn" onclick="openAssignCaptainModal('lunes', 0, 0)">✎</button>
                    ` : ''}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ` : (isAdmin ? `
          <!-- Banner en Admin cuando no hay lunes configurado -->
          <div class="service-add-lunes-banner">
            <p>ℹ️ No hay <strong>Salida Especial de Lunes</strong> programada para este mes.</p>
            <button class="btn btn-sm btn-primary" onclick="openAddLunesModal()">
              + Agregar Salida Especial de Lunes
            </button>
          </div>
        ` : '')}

        <!-- ========================================================
             2. SALIDAS REGULARES ENTRE SEMANA (Martes a Viernes)
             ======================================================== -->
        <div class="service-card">
          <div class="service-card-head">
            <div class="service-card-title">
              <span class="service-icon">🗓️</span>
              <h3>Salidas Regulares Entre Semana</h3>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
              <span class="service-head-note">Martes a Viernes (Mañana / Tarde)</span>
              ${isAdmin ? `
                <button class="service-add-btn-featured" onclick="openAddEntreSemanaModal()" title="Agregar salida en la mañana o en la tarde">
                  <span style="font-size: 14px; font-weight: bold;">+</span> Agregar Salida
                </button>
              ` : ''}
            </div>
          </div>

          <!-- Tabla Desktop -->
          <div class="service-desktop-table-wrap">
            <table class="service-table">
              <thead>
                <tr>
                  <th style="width: 160px;">DÍA / TURNO</th>
                  <th style="width: 110px;">HORA</th>
                  <th>LUGAR DE SALIDA</th>
                  <th style="width: 220px;">CAPITÁN</th>
                  ${isAdmin ? `<th style="width: 90px; text-align: center;">ACCIÓN</th>` : ''}
                </tr>
              </thead>
              <tbody>
                ${entreSemana.map((item, idx) => `
                  <tr>
                    <td><strong>${escapeHtml(item.dia)}</strong></td>
                    <td class="service-time-cell">${escapeHtml(item.hora)}</td>
                    <td>
                      <div class="service-place-cell">
                        <span class="service-pin">📍</span>
                        <div>
                          ${item.nota ? `<span class="service-tag service-tag-${item.nota.toLowerCase()}">${escapeHtml(item.nota)}</span> ` : ''}
                          <span>${escapeHtml(item.lugar)}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div class="service-captain-cell">
                        <span class="service-avatar">👤</span>
                        <strong class="service-captain-name">${escapeHtml(item.capitan || 'Por asignar')}</strong>
                        ${isAdmin ? `
                          <button class="service-edit-cap-btn" onclick="openAssignCaptainModal('entre_semana', '${item.id || idx}', 0)" title="Asignar Capitán">✎</button>
                        ` : ''}
                      </div>
                    </td>
                    ${isAdmin ? `
                      <td style="text-align: center; white-space: nowrap;">
                        <button class="service-action-btn" onclick="openEditRegularModal('entre_semana', '${item.id || idx}')" title="Editar lugar y hora">✏️</button>
                        <button class="service-action-btn" style="color: #b91c1c;" onclick="eliminarSalidaEntreSemana('${item.id || idx}')" title="Eliminar este horario">🗑️</button>
                      </td>
                    ` : ''}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Tarjetas Móvil -->
          <div class="service-mobile-cards">
            ${entreSemana.map((item, idx) => `
              <div class="service-m-card">
                <div class="service-m-head">
                  <strong>${escapeHtml(item.dia)}</strong>
                  <span class="service-time-cell">${escapeHtml(item.hora)}</span>
                </div>
                <div class="service-place-cell" style="margin: 6px 0;">
                  <span class="service-pin">📍</span>
                  <div>
                    ${item.nota ? `<span class="service-tag service-tag-${item.nota.toLowerCase()}">${escapeHtml(item.nota)}</span> ` : ''}
                    <span>${escapeHtml(item.lugar)}</span>
                  </div>
                </div>
                <div class="service-m-captain-row">
                  <span style="color: var(--muted); font-size: 11px;">Capitán:</span>
                  <div class="service-captain-cell">
                    <span class="service-avatar">👤</span>
                    <strong class="service-captain-name">${escapeHtml(item.capitan || 'Por asignar')}</strong>
                    ${isAdmin ? `
                      <button class="service-edit-cap-btn" onclick="openAssignCaptainModal('entre_semana', '${item.id || idx}', 0)">✎</button>
                      <button class="service-action-btn" onclick="openEditRegularModal('entre_semana', '${item.id || idx}')">✏️</button>
                      <button class="service-action-btn" style="color: #b91c1c;" onclick="eliminarSalidaEntreSemana('${item.id || idx}')">🗑️</button>
                    ` : ''}
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- ========================================================
             3. SÁBADOS (Organizado por Fechas)
             ======================================================== -->
        <div class="service-card">
          <div class="service-card-head">
            <div class="service-card-title">
              <span class="service-icon">🗓️</span>
              <h3>Sábados</h3>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
              <span class="service-head-note">Organizado por Fechas</span>
              ${isAdmin ? `
                <button class="service-add-btn-featured" onclick="openAddSabadoModal()" title="Agregar un nuevo sábado de predicación">
                  <span style="font-size: 14px; font-weight: bold;">+</span> Agregar Sábado
                </button>
              ` : ''}
            </div>
          </div>

          <!-- Tabla Desktop -->
          <div class="service-desktop-table-wrap">
            <table class="service-table">
              <thead>
                <tr>
                  <th style="width: 170px;">FECHA</th>
                  <th style="width: 110px;">HORA</th>
                  <th>LUGAR & TIPO DE SALIDA</th>
                  <th style="width: 220px;">CAPITÁN</th>
                  ${isAdmin ? `<th style="width: 90px; text-align: center;">ACCIÓN</th>` : ''}
                </tr>
              </thead>
              <tbody>
                ${sabados.map((item, idx) => {
                  const puntos = getSabadoPuntos(item);
                  return puntos.map((p, pIdx) => `
                    <tr class="${pIdx === puntos.length - 1 ? 'service-row-group-end' : ''}">
                      ${pIdx === 0 ? `
                        <td rowspan="${puntos.length}" class="service-domingo-fecha-cell">
                          <div class="service-date-cell">
                            <span>📅</span>
                            <strong>${escapeHtml(item.fecha)}</strong>
                          </div>
                          ${isAdmin ? `
                            <div style="margin-top: 6px; padding-left: 4px;">
                              <button class="service-add-subsalida-btn" onclick="openAddPuntoSabadoModal(${idx})" title="Agregar otro punto de salida a este sábado (ej. Carritos, Territorio Especial)">
                                <span style="font-weight:bold; font-size:12px;">+</span> Punto
                              </button>
                            </div>
                          ` : ''}
                        </td>
                      ` : ''}
                      <td class="service-time-cell">${escapeHtml(p.hora)}</td>
                      <td>
                        <div class="service-place-cell">
                          <span class="service-pin">📍</span>
                          <div>
                            <div style="font-weight: 500;">${escapeHtml(p.lugar || 'Por asignar')}</div>
                            ${p.nota ? `
                              <span class="service-badge-tag">${escapeHtml(p.nota)}</span>
                            ` : ''}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div class="service-captain-cell">
                          <span class="service-avatar">👤</span>
                          <strong class="service-captain-name">${escapeHtml(p.capitan || 'Por asignar')}</strong>
                          ${isAdmin ? `
                            <button class="service-edit-cap-btn" onclick="openAssignCaptainModal('sabados', '${item.id || idx}', ${pIdx})" title="Asignar Capitán">✎</button>
                          ` : ''}
                        </div>
                      </td>
                      ${isAdmin ? `
                        <td style="text-align: center; white-space: nowrap;">
                          <button class="service-action-btn" onclick="openEditPuntoSabadoModal(${idx}, ${pIdx})" title="Editar hora, lugar o tipo de este punto">✏️</button>
                          <button class="service-action-btn service-delete-btn" onclick="eliminarPuntoSabado(${idx}, ${pIdx})" title="Eliminar este punto de salida">🗑️</button>
                        </td>
                      ` : ''}
                    </tr>
                  `).join('');
                }).join('')}
              </tbody>
            </table>
          </div>

          <!-- Tarjetas Móvil -->
          <div class="service-mobile-cards">
            ${sabados.map((item, idx) => {
              const puntos = getSabadoPuntos(item);
              return `
                <div class="service-m-card">
                  <div class="service-m-head">
                    <span class="service-date-cell">
                      <span>📅</span>
                      <strong>${escapeHtml(item.fecha)}</strong>
                    </span>
                    ${puntos.length > 1 ? `<span class="service-head-note" style="color:#0f766e; font-weight:700;">${puntos.length} Salidas</span>` : ''}
                  </div>
                  
                  ${puntos.map((p, pIdx) => `
                    <div class="service-m-subgroup-box" style="margin-top: ${pIdx === 0 ? '6px' : '10px'};">
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                        <span class="service-time-cell" style="font-weight: 700; color: #0f766e;">⏰ ${escapeHtml(p.hora)}</span>
                        ${p.nota ? `<span class="service-badge-tag">${escapeHtml(p.nota)}</span>` : ''}
                      </div>
                      <div class="service-place-cell" style="margin: 6px 0;">
                        <span class="service-pin">📍</span>
                        <div style="font-weight: 500;">${escapeHtml(p.lugar || 'Por asignar')}</div>
                      </div>
                      <div class="service-m-captain-row">
                        <span style="color: var(--muted); font-size: 11px;">Capitán:</span>
                        <div class="service-captain-cell">
                          <span class="service-avatar">👤</span>
                          <strong class="service-captain-name">${escapeHtml(p.capitan || 'Por asignar')}</strong>
                          ${isAdmin ? `
                            <button class="service-edit-cap-btn" onclick="openAssignCaptainModal('sabados', '${item.id || idx}', ${pIdx})">✎</button>
                            <button class="service-action-btn" onclick="openEditPuntoSabadoModal(${idx}, ${pIdx})">✏️</button>
                            <button class="service-action-btn service-delete-btn" onclick="eliminarPuntoSabado(${idx}, ${pIdx})" title="Eliminar punto de salida">🗑️</button>
                          ` : ''}
                        </div>
                      </div>
                    </div>
                  `).join('')}

                  ${isAdmin ? `
                    <button class="service-add-subsalida-btn-m" onclick="openAddPuntoSabadoModal(${idx})" title="Agregar otro punto de salida a este sábado">
                      <span style="font-weight:bold; font-size:14px;">+</span> Agregar Punto de Salida
                    </button>
                  ` : ''}
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- ========================================================
             4. DOMINGOS (Salidas por Grupos, Generales y Asambleas)
             ======================================================== -->
        <div class="service-card">
          <div class="service-card-head">
            <div class="service-card-title">
              <span class="service-icon">🗓️</span>
              <h3>Domingos (Salidas por Grupos)</h3>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
              <span class="service-head-note">Hora estándar: 9:00 a.m.</span>
              ${isAdmin ? `
                <button class="service-add-btn-featured" onclick="openAddDomingoModal()" title="Agregar un nuevo domingo de predicación">
                  <span style="font-size: 14px; font-weight: bold;">+</span> Agregar Domingo
                </button>
              ` : ''}
            </div>
          </div>

          <!-- Tabla Desktop -->
          <div class="service-desktop-table-wrap">
            <table class="service-table">
              <thead>
                <tr>
                  <th style="width: 170px;">FECHA</th>
                  <th style="width: 190px;">DIVISIÓN / GRUPO</th>
                  <th>LUGAR DE SALIDA</th>
                  <th style="width: 220px;">CAPITÁN</th>
                  ${isAdmin ? `<th style="width: 90px; text-align: center;">ACCIÓN</th>` : ''}
                </tr>
              </thead>
              <tbody>
                ${domingos.map((dom, dIdx) => {
                  if (dom.tipo === 'asamblea') {
                    return `
                      <tr class="service-row-group-end" style="background: #fff8f8;">
                        <td class="service-domingo-fecha-cell">
                          <div class="service-date-cell">
                            <span>📅</span>
                            <strong>${escapeHtml(dom.fecha)}</strong>
                          </div>
                          <div class="service-time-sub">${escapeHtml(dom.hora || '9:00 a.m.')}</div>
                        </td>
                        <td colspan="3" style="padding: 12px 16px;">
                          <span style="display: inline-flex; align-items: center; gap: 6px; font-weight: 700; color: #b91c1c; background: #fee2e2; border: 1px solid #fecaca; padding: 4px 12px; border-radius: 8px; font-size: 12px;">
                            ⛔ Sin salida de predicación (Asamblea de Circuito / Regional)
                          </span>
                        </td>
                        ${isAdmin ? `
                          <td style="text-align: center; white-space: nowrap;">
                            <button class="service-action-btn" onclick="openEditDomingoModal(${dIdx}, -1)" title="Editar estado">✏️</button>
                            <button class="service-action-btn service-delete-btn" onclick="eliminarDomingoCompleto(${dIdx})" title="Eliminar domingo">🗑️</button>
                          </td>
                        ` : ''}
                      </tr>
                    `;
                  }

                  const isGrupos = dom.tipo === 'grupos' && Array.isArray(dom.salidas);
                  if (isGrupos) {
                    return dom.salidas.map((sal, sIdx) => `
                      <tr class="${sIdx === dom.salidas.length - 1 ? 'service-row-group-end' : ''}">
                        ${sIdx === 0 ? `
                          <td rowspan="${dom.salidas.length}" class="service-domingo-fecha-cell">
                            <div class="service-date-cell">
                              <span>📅</span>
                              <strong>${escapeHtml(dom.fecha)}</strong>
                            </div>
                            <div class="service-time-sub">${escapeHtml(dom.hora || '9:00 a.m.')}</div>
                            ${isAdmin ? `
                              <div style="margin-top: 6px; padding-left: 4px;">
                                <button class="service-add-subsalida-btn" onclick="openAddSubSalidaModal(${dIdx})" title="Agregar salida o grupo especial a este domingo (ej. Visita a grupo)">
                                  <span style="font-weight:bold; font-size:12px;">+</span> Grupo
                                </button>
                              </div>
                            ` : ''}
                          </td>
                        ` : ''}
                        <td class="service-group-name-cell">
                          <span class="service-group-pill">${escapeHtml(sal.grupo)}</span>
                        </td>
                        <td>
                          <div class="service-place-cell">
                            <span class="service-pin">📍</span>
                            <span>${escapeHtml(sal.lugar || 'Por asignar')}</span>
                          </div>
                        </td>
                        <td>
                          <div class="service-captain-cell">
                            <span class="service-avatar">👤</span>
                            <strong class="service-captain-name">${escapeHtml(sal.capitan || 'Por asignar')}</strong>
                            ${isAdmin ? `
                              <button class="service-edit-cap-btn" onclick="openAssignCaptainModal('domingos', ${dIdx}, ${sIdx})" title="Asignar Capitán">✎</button>
                            ` : ''}
                          </div>
                        </td>
                        ${isAdmin ? `
                          <td style="text-align: center; white-space: nowrap;">
                            <button class="service-action-btn" onclick="openEditDomingoModal(${dIdx}, ${sIdx})" title="Editar lugar o división">✏️</button>
                            <button class="service-action-btn service-delete-btn" onclick="eliminarSubSalidaDomingo(${dIdx}, ${sIdx})" title="Eliminar esta división o domingo">🗑️</button>
                          </td>
                        ` : ''}
                      </tr>
                    `).join('');
                  } else {
                    // Salida General ("Toda la Congregación")
                    return `
                      <tr class="service-row-group-end">
                        <td class="service-domingo-fecha-cell">
                          <div class="service-date-cell">
                            <span>📅</span>
                            <strong>${escapeHtml(dom.fecha)}</strong>
                          </div>
                          <div class="service-time-sub">${escapeHtml(dom.hora || '9:00 a.m.')}</div>
                        </td>
                        <td>
                          <span class="service-general-badge">TODA LA CONGREGACIÓN</span>
                        </td>
                        <td>
                          <div class="service-place-cell">
                            <span class="service-pin">📍</span>
                            <span>${escapeHtml(dom.lugar || 'Por asignar')}</span>
                          </div>
                        </td>
                        <td>
                          <div class="service-captain-cell">
                            <span class="service-avatar">👤</span>
                            <strong class="service-captain-name">${escapeHtml(dom.capitan || 'Por asignar')}</strong>
                            ${isAdmin ? `
                              <button class="service-edit-cap-btn" onclick="openAssignCaptainModal('domingos', ${dIdx}, 0)" title="Asignar Capitán">✎</button>
                            ` : ''}
                          </div>
                        </td>
                        ${isAdmin ? `
                          <td style="text-align: center; white-space: nowrap;">
                            <button class="service-action-btn" onclick="openEditDomingoModal(${dIdx}, -1)" title="Editar lugar u hora">✏️</button>
                            <button class="service-action-btn service-delete-btn" onclick="eliminarDomingoCompleto(${dIdx})" title="Eliminar este domingo (ej. por Asamblea)">🗑️</button>
                          </td>
                        ` : ''}
                      </tr>
                    `;
                  }
                }).join('')}
              </tbody>
            </table>
          </div>

          <!-- Tarjetas Móvil -->
          <div class="service-mobile-cards">
            ${domingos.map((dom, dIdx) => {
              const isGrupos = dom.tipo === 'grupos' && Array.isArray(dom.salidas);
              return `
                <div class="service-m-card">
                  <div class="service-m-head">
                    <span class="service-date-cell">
                      <span>📅</span>
                      <strong>${escapeHtml(dom.fecha)}</strong>
                    </span>
                    <span class="service-time-cell">${escapeHtml(dom.hora || '9:00 a.m.')}</span>
                  </div>

                  ${dom.tipo === 'asamblea' ? `
                    <div class="service-m-subgroup-box" style="background: #fff1f2; border-color: #fecdd3;">
                      <span style="color: #9f1239; font-weight: 700; font-size: 12px; display: block; margin-bottom: 6px;">
                        ⛔ Sin salida (Asamblea de Circuito / Regional)
                      </span>
                      ${isAdmin ? `
                        <div style="display: flex; gap: 8px; justify-content: flex-end;">
                          <button class="service-action-btn" onclick="openEditDomingoModal(${dIdx}, -1)">✏️</button>
                          <button class="service-action-btn service-delete-btn" onclick="eliminarDomingoCompleto(${dIdx})">🗑️</button>
                        </div>
                      ` : ''}
                    </div>
                  ` : isGrupos ? `
                    ${dom.salidas.map((sal, sIdx) => `
                      <div class="service-m-subgroup-box">
                        <div class="service-group-pill" style="margin-bottom: 4px;">${escapeHtml(sal.grupo)}</div>
                        <div class="service-place-cell" style="margin-bottom: 6px;">
                          <span class="service-pin">📍</span>
                          <span>${escapeHtml(sal.lugar || 'Por asignar')}</span>
                        </div>
                        <div class="service-m-captain-row">
                          <span style="color: var(--muted); font-size: 11px;">Capitán:</span>
                          <div class="service-captain-cell">
                            <span class="service-avatar">👤</span>
                            <strong class="service-captain-name">${escapeHtml(sal.capitan || 'Por asignar')}</strong>
                            ${isAdmin ? `
                              <button class="service-edit-cap-btn" onclick="openAssignCaptainModal('domingos', ${dIdx}, ${sIdx})">✎</button>
                              <button class="service-action-btn" onclick="openEditDomingoModal(${dIdx}, ${sIdx})">✏️</button>
                              <button class="service-action-btn service-delete-btn" onclick="eliminarSubSalidaDomingo(${dIdx}, ${sIdx})" title="Eliminar división">🗑️</button>
                            ` : ''}
                          </div>
                        </div>
                      </div>
                    `).join('')}
                    ${isAdmin ? `
                      <button class="service-add-subsalida-btn-m" onclick="openAddSubSalidaModal(${dIdx})" title="Agregar salida o grupo especial a este domingo">
                        <span style="font-weight:bold; font-size:14px;">+</span> Agregar Grupo / Salida Especial
                      </button>
                    ` : ''}
                  ` : `
                    <div class="service-m-subgroup-box">
                      <span class="service-general-badge" style="margin-bottom: 4px;">TODA LA CONGREGACIÓN</span>
                      <div class="service-place-cell" style="margin-bottom: 6px;">
                        <span class="service-pin">📍</span>
                        <span>${escapeHtml(dom.lugar || 'Por asignar')}</span>
                      </div>
                      <div class="service-m-captain-row">
                        <span style="color: var(--muted); font-size: 11px;">Capitán:</span>
                        <div class="service-captain-cell">
                          <span class="service-avatar">👤</span>
                          <strong class="service-captain-name">${escapeHtml(dom.capitan || 'Por asignar')}</strong>
                          ${isAdmin ? `
                            <button class="service-edit-cap-btn" onclick="openAssignCaptainModal('domingos', ${dIdx}, 0)">✎</button>
                            <button class="service-action-btn" onclick="openEditDomingoModal(${dIdx}, -1)">✏️</button>
                            <button class="service-action-btn service-delete-btn" onclick="eliminarDomingoCompleto(${dIdx})" title="Eliminar domingo">🗑️</button>
                          ` : ''}
                        </div>
                      </div>
                    </div>
                  `}
                </div>
              `;
            }).join('')}
          </div>
        </div>

      </div>
    </section>
  `;
}

// ============================================================
// MODAL: ASIGNAR CAPITÁN (FILTRADO ESTRICTO POR CASILLA 'capitan')
// ============================================================

let assigningTarget = null; // { section, index, subIndex }

function openAssignCaptainModal(section, index, subIndex) {
  assigningTarget = { section, index, subIndex };

  const existing = document.getElementById('wm-captain-modal');
  if (existing) existing.remove();

  // Filtrar ÚNICAMENTE publicadores con el privilegio 'capitan'
  const captainsList = getEligiblePeople(PEOPLE || [], 'capitan');

  const modal = document.createElement('div');
  modal.id = 'wm-captain-modal';
  modal.className = 'overlay';
  modal.innerHTML = `
    <div class="modal" style="max-width: 480px;">
      <div class="modal-head" style="background: #7a1d2e; color: #fff; border-bottom: none;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h3 style="color: #fff; margin: 0; font-size: 16px;">Asignar Capitán</h3>
            <p style="color: #f8c9d2; margin: 2px 0 0; font-size: 12px;">Salidas al Servicio</p>
          </div>
          <button onclick="closeAssignCaptainModal()" style="background: transparent; border: none; color: #fff; font-size: 20px; cursor: pointer;">✕</button>
        </div>
      </div>

      <div class="modal-form-body">
        <div style="background: #fff8e6; border: 1px solid #f2dfa9; border-radius: 8px; padding: 10px 12px; margin-bottom: 12px; font-size: 12px; color: #7a5c10;">
          ℹ️ <strong>Filtro Automático:</strong> Solo se listan los publicadores que tienen la casilla <strong>"Capitán (Salidas al servicio)"</strong> marcada en su ficha.
        </div>

        <input
          type="text"
          id="captain-filter-input"
          class="search-input"
          style="width: 100%; box-sizing: border-box; margin-bottom: 12px;"
          placeholder="Buscar hermano capitán..."
          oninput="filterCaptainsInModal(this.value)"
        />

        <div id="captain-candidates-list" style="max-height: 260px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px;">
          ${renderCaptainsCandidateRows(captainsList)}
        </div>
      </div>

      <div class="modal-actions" style="justify-content: space-between;">
        <button class="btn btn-sm btn-ghost" onclick="assignCaptainDirectly('')">
          Sin Capitán (Limpiar)
        </button>
        <button class="btn btn-sm btn-ghost" onclick="closeAssignCaptainModal()">
          Cancelar
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

function renderCaptainsCandidateRows(captainsList) {
  if (!captainsList || captainsList.length === 0) {
    return `
      <div style="padding: 18px; text-align: center; color: var(--muted); font-size: 13px;">
        No hay publicadores con la casilla "Capitán" marcada.<br>
        <span style="font-size: 11px;">Ve a la pestaña <strong>Publicadores</strong> y marca el privilegio a los hermanos designados.</span>
      </div>
    `;
  }

  return captainsList.map(p => `
    <div
      class="captain-candidate-item"
      onclick="assignCaptainDirectly('${escapeHtml(p.nombre).replace(/'/g, "\\'")}')"
    >
      <div>
        <div style="font-weight: 600; font-size: 13px; color: var(--ink); display: flex; align-items: center; gap: 6px;">
          <span>👤</span> ${escapeHtml(p.nombre)}
        </div>
        <div style="font-size: 11px; color: var(--muted); margin-left: 22px;">
          ${p.genero === 'M' ? 'Hermano' : 'Hermana'} ${p.nota ? `· ${escapeHtml(p.nota)}` : ''}
        </div>
      </div>
      <span style="color: var(--teal-deep); font-weight: 600; font-size: 12px;">✓ Seleccionar</span>
    </div>
  `).join('');
}

function filterCaptainsInModal(query) {
  const container = document.getElementById('captain-candidates-list');
  if (!container) return;

  const q = normName(query);
  const allCaptains = getEligiblePeople(PEOPLE || [], 'capitan');
  const filtered = allCaptains.filter(p => normName(p.nombre).includes(q));

  container.innerHTML = renderCaptainsCandidateRows(filtered);
}

function closeAssignCaptainModal() {
  const modal = document.getElementById('wm-captain-modal');
  if (modal) modal.remove();
  assigningTarget = null;
}

async function assignCaptainDirectly(captainName) {
  if (!assigningTarget || !CURRENT_SALIDAS) return;

  const { section, index, subIndex } = assigningTarget;

  if (section === 'lunes') {
    if (!CURRENT_SALIDAS.lunes_especial) CURRENT_SALIDAS.lunes_especial = {};
    CURRENT_SALIDAS.lunes_especial.capitan = captainName;
  } else if (section === 'entre_semana' && CURRENT_SALIDAS.entre_semana) {
    const target = CURRENT_SALIDAS.entre_semana.find(x => x && (x.id === index || x === CURRENT_SALIDAS.entre_semana[index]));
    if (target) target.capitan = captainName;
  } else if (section === 'sabados' && CURRENT_SALIDAS.sabados) {
    let target = CURRENT_SALIDAS.sabados.find(x => x && (x.id === index || x === CURRENT_SALIDAS.sabados[index]));
    if (!target) {
      const n = typeof index === 'number' ? index : parseInt(index, 10);
      if (!isNaN(n)) target = CURRENT_SALIDAS.sabados[n];
    }
    if (target) {
      if (Array.isArray(target.puntos) && target.puntos[subIndex]) {
        target.puntos[subIndex].capitan = captainName;
      } else {
        target.capitan = captainName;
      }
    }
  } else if (section === 'domingos' && CURRENT_SALIDAS.domingos?.[index]) {
    const dom = CURRENT_SALIDAS.domingos[index];
    if (dom.tipo === 'grupos' && Array.isArray(dom.salidas) && dom.salidas[subIndex]) {
      dom.salidas[subIndex].capitan = captainName;
    } else {
      dom.capitan = captainName;
    }
  }

  closeAssignCaptainModal();
  render();

  // Guardar en Firestore y almacenamiento local
  await apiSaveSalidas(SERVICE_SELECTED_MONTH_KEY, CURRENT_SALIDAS, writeToken);
}

// ============================================================
// MODALES DE EDICIÓN: LUNES, REGULARES Y DOMINGOS
// ============================================================

// A. Salida Especial de Lunes
function openAddLunesModal() {
  openEditLunesModal(true);
}

function openEditLunesModal(isNew = false) {
  const existing = document.getElementById('wm-lunes-modal');
  if (existing) existing.remove();

  const defLunes = CURRENT_SALIDAS?.lunes_especial || {
    activo: true,
    fecha: 'Lunes 14 de Septiembre',
    hora: '8:45 a.m.',
    lugar: 'Salón del Reino (Punto de salida)',
    capitan: '',
    destino: 'Territorio asignado'
  };

  const captains = getEligiblePeople(PEOPLE || [], 'capitan');

  const modal = document.createElement('div');
  modal.id = 'wm-lunes-modal';
  modal.className = 'overlay';
  modal.innerHTML = `
    <div class="modal" style="max-width: 500px;">
      <div class="modal-head" style="background: #92400e; color: #fff; border-bottom: none;">
        <h3 style="color: #fff; margin: 0;">${isNew ? '⭐ Agregar Salida Especial de Lunes' : '⭐ Editar Salida Especial de Lunes'}</h3>
        <p style="color: #fde68a; margin: 2px 0 0; font-size: 12px;">Programación para este mes</p>
      </div>

      <div class="modal-form-body">
        <div class="field">
          <label>📅 Fecha Exacta (Día y Mes)</label>
          <input type="text" id="lunes-modal-fecha" class="search-input" style="width: 100%; box-sizing: border-box;" value="${escapeHtml(defLunes.fecha || '')}" placeholder="Ej: Lunes 14 de Septiembre" />
        </div>

        <div style="display: flex; gap: 12px;">
          <div class="field" style="flex: 1;">
            <label>⏰ Hora de Salida</label>
            <input type="text" id="lunes-modal-hora" class="search-input" style="width: 100%; box-sizing: border-box;" value="${escapeHtml(defLunes.hora || '8:45 a.m.')}" />
          </div>
          <div class="field" style="flex: 2;">
            <label>👤 Quién saca el grupo (Capitán)</label>
            <select id="lunes-modal-capitan" class="search-input" style="width: 100%; box-sizing: border-box;">
              <option value="">-- Seleccionar Capitán --</option>
              ${captains.map(c => `
                <option value="${escapeHtml(c.nombre)}" ${c.nombre === defLunes.capitan ? 'selected' : ''}>
                  ${escapeHtml(c.nombre)}
                </option>
              `).join('')}
            </select>
          </div>
        </div>

        <div class="field">
          <label>📍 Lugar de Salida / Punto de Encuentro</label>
          <input type="text" id="lunes-modal-lugar" class="search-input" style="width: 100%; box-sizing: border-box;" list="wm-lugares-datalist" value="${escapeHtml(defLunes.lugar || '')}" placeholder="Selecciona o escribe un lugar..." />
          <datalist id="wm-lugares-datalist">
            ${(LUGARES_SALIDAS || []).map(l => `<option value="${escapeHtml(l.nombre)}"></option>`).join('')}
          </datalist>
        </div>

        <div class="field">
          <label>🎯 A dónde van (Territorio / Destino)</label>
          <input type="text" id="lunes-modal-destino" class="search-input" style="width: 100%; box-sizing: border-box;" value="${escapeHtml(defLunes.destino || '')}" placeholder="Ej: Territorio Vereda Limonal (Sector Alto)" />
        </div>
      </div>

      <div class="modal-actions">
        <button class="btn btn-sm btn-ghost" onclick="closeEditLunesModal()">Cancelar</button>
        <button class="btn btn-sm btn-primary" onclick="saveEditLunesModal()">Guardar Salida</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

function closeEditLunesModal() {
  const modal = document.getElementById('wm-lunes-modal');
  if (modal) modal.remove();
}

async function saveEditLunesModal() {
  if (!CURRENT_SALIDAS) return;

  const fecha = document.getElementById('lunes-modal-fecha')?.value.trim() || '';
  const hora = document.getElementById('lunes-modal-hora')?.value.trim() || '8:45 a.m.';
  const lugar = document.getElementById('lunes-modal-lugar')?.value.trim() || '';
  const capitan = document.getElementById('lunes-modal-capitan')?.value.trim() || '';
  const destino = document.getElementById('lunes-modal-destino')?.value.trim() || '';

  // Auto-registrar lugar en catálogo si es nuevo
  if (lugar) autoRegistrarLugar(lugar);

  CURRENT_SALIDAS.lunes_especial = {
    activo: true,
    fecha,
    hora,
    lugar,
    capitan,
    destino
  };

  closeEditLunesModal();
  render();

  await apiSaveSalidas(SERVICE_SELECTED_MONTH_KEY, CURRENT_SALIDAS, writeToken);
}

async function eliminarLunesEspecial() {
  if (!confirm('¿Deseas quitar la Salida Especial de Lunes para este mes? Los publicadores no la verán.')) return;

  if (CURRENT_SALIDAS?.lunes_especial) {
    CURRENT_SALIDAS.lunes_especial.activo = false;
  }

  render();
  await apiSaveSalidas(SERVICE_SELECTED_MONTH_KEY, CURRENT_SALIDAS, writeToken);
}

// Helper para obtener un elemento regular por ID o índice
function getRegularItem(section, targetIdOrIndex) {
  if (!CURRENT_SALIDAS || !CURRENT_SALIDAS[section]) return null;
  const list = CURRENT_SALIDAS[section];
  if (!Array.isArray(list)) return null;

  // 1. Buscar por ID único
  const byId = list.find(x => x && x.id === targetIdOrIndex);
  if (byId) return byId;

  // 2. Si no se encuentra por ID, buscar por índice numérico
  const idx = typeof targetIdOrIndex === 'number' ? targetIdOrIndex : parseInt(targetIdOrIndex, 10);
  if (!isNaN(idx) && list[idx]) return list[idx];

  return null;
}

// B. Edición de Lugar / Hora de Salidas Regulares (Entre semana o Sábados)
function openEditRegularModal(section, targetIdOrIndex) {
  const existing = document.getElementById('wm-regular-edit-modal');
  if (existing) existing.remove();

  const item = getRegularItem(section, targetIdOrIndex);
  if (!item) return;

  const safeId = item.id || targetIdOrIndex;

  const modal = document.createElement('div');
  modal.id = 'wm-regular-edit-modal';
  modal.className = 'overlay';
  modal.innerHTML = `
    <div class="modal" style="max-width: 460px;">
      <div class="modal-head" style="background: #7a1d2e; color: #fff;">
        <h3 style="color: #fff; margin: 0;">Editar Salida</h3>
        <p style="color: #f8c9d2; margin: 2px 0 0; font-size: 12px;">${escapeHtml(item.dia || item.fecha || '')}</p>
      </div>

      <div class="modal-form-body">
        ${section === 'entre_semana' ? `
          <div class="field">
            <label>🗓️ Día / Turno (ej: Martes (Mañana), Miércoles (Tarde))</label>
            <input type="text" id="reg-edit-dia" class="search-input" style="width: 100%; box-sizing: border-box;" value="${escapeHtml(item.dia || '')}" />
          </div>
        ` : ''}

        <div class="field">
          <label>⏰ Hora de Salida</label>
          <input type="text" id="reg-edit-hora" class="search-input" style="width: 100%; box-sizing: border-box;" value="${escapeHtml(item.hora || '')}" />
        </div>

        <div class="field">
          <label>📍 Lugar de Salida / Dirección</label>
          <input type="text" id="reg-edit-lugar" class="search-input" style="width: 100%; box-sizing: border-box;" list="wm-lugares-reg-datalist" value="${escapeHtml(item.lugar || '')}" placeholder="Selecciona o escribe un lugar..." />
          <datalist id="wm-lugares-reg-datalist">
            ${(LUGARES_SALIDAS || []).map(l => `<option value="${escapeHtml(l.nombre)}"></option>`).join('')}
          </datalist>
        </div>

        ${section === 'sabados' ? `
          <div class="field">
            <label>📅 Fecha del Sábado (ej: 3 de Octubre)</label>
            <input type="text" id="reg-edit-fecha" class="search-input" style="width: 100%; box-sizing: border-box;" value="${escapeHtml(item.fecha || '')}" />
          </div>
          <div class="field">
            <label>🏷️ Tipo de Salida (ej: PREDICACIÓN PÚBLICA, CARTA, TABLANCA)</label>
            <input type="text" id="reg-edit-nota" class="search-input" style="width: 100%; box-sizing: border-box;" value="${escapeHtml(item.nota || '')}" />
          </div>
        ` : ''}
      </div>

      <div class="modal-actions">
        <button class="btn btn-sm btn-ghost" onclick="closeEditRegularModal()">Cancelar</button>
        <button class="btn btn-sm btn-primary" onclick="saveEditRegularModal('${section}', '${safeId}')">Guardar Cambios</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

function closeEditRegularModal() {
  const modal = document.getElementById('wm-regular-edit-modal');
  if (modal) modal.remove();
}

async function saveEditRegularModal(section, targetIdOrIndex) {
  const item = getRegularItem(section, targetIdOrIndex);
  if (!item) return;

  const diaInput = document.getElementById('reg-edit-dia');
  const fechaInput = document.getElementById('reg-edit-fecha');
  const hora = document.getElementById('reg-edit-hora')?.value.trim() || item.hora;
  const lugar = document.getElementById('reg-edit-lugar')?.value.trim() || item.lugar;
  const notaInput = document.getElementById('reg-edit-nota');

  if (diaInput && diaInput.value.trim()) item.dia = diaInput.value.trim();
  if (fechaInput && fechaInput.value.trim()) item.fecha = fechaInput.value.trim();
  item.hora = hora;
  item.lugar = lugar;
  if (notaInput) item.nota = notaInput.value.trim();

  // Si es entre semana, asegurar reordenamiento cronológico
  if (section === 'entre_semana' && Array.isArray(CURRENT_SALIDAS.entre_semana)) {
    CURRENT_SALIDAS.entre_semana = sortEntreSemanaEntries(CURRENT_SALIDAS.entre_semana);
  }

  // Auto-registrar lugar en catálogo si es nuevo
  if (lugar) autoRegistrarLugar(lugar);

  closeEditRegularModal();
  render();

  await apiSaveSalidas(SERVICE_SELECTED_MONTH_KEY, CURRENT_SALIDAS, writeToken);
}

// B2. Modal para Agregar Nueva Salida Entre Semana (Mañana o Tarde)
function openAddEntreSemanaModal() {
  const existing = document.getElementById('wm-add-es-modal');
  if (existing) existing.remove();

  const captains = getEligiblePeople(PEOPLE || [], 'capitan');

  const modal = document.createElement('div');
  modal.id = 'wm-add-es-modal';
  modal.className = 'overlay';
  modal.innerHTML = `
    <div class="modal" style="max-width: 480px;">
      <div class="modal-head" style="background: #7a1d2e; color: #fff;">
        <h3 style="color: #fff; margin: 0;">+ Agregar Salida Entre Semana</h3>
        <p style="color: #f8c9d2; margin: 2px 0 0; font-size: 12px;">Mañana o Tarde (Martes a Viernes)</p>
      </div>

      <div class="modal-form-body">
        <div style="display: flex; gap: 12px;">
          <div class="field" style="flex: 1;">
            <label>🗓️ Día de la Semana</label>
            <select id="add-es-dia" class="search-input" style="width: 100%; box-sizing: border-box;">
              <option value="Martes">Martes</option>
              <option value="Miércoles">Miércoles</option>
              <option value="Jueves">Jueves</option>
              <option value="Viernes">Viernes</option>
            </select>
          </div>
          <div class="field" style="flex: 1;">
            <label>☀️ / 🌙 Turno</label>
            <select id="add-es-turno" class="search-input" style="width: 100%; box-sizing: border-box;" onchange="onTurnoChange(this.value)">
              <option value="Mañana">Mañana (AM)</option>
              <option value="Tarde">Tarde (PM)</option>
            </select>
          </div>
        </div>

        <div class="field">
          <label>⏰ Hora de Salida</label>
          <input type="text" id="add-es-hora" class="search-input" style="width: 100%; box-sizing: border-box;" value="8:45 a.m." />
        </div>

        <div class="field">
          <label>📍 Lugar de Salida / Dirección</label>
          <input type="text" id="add-es-lugar" class="search-input" style="width: 100%; box-sizing: border-box;" list="wm-lugares-add-datalist" placeholder="Selecciona o escribe un lugar..." />
          <datalist id="wm-lugares-add-datalist">
            ${(LUGARES_SALIDAS || []).map(l => `<option value="${escapeHtml(l.nombre)}"></option>`).join('')}
          </datalist>
        </div>

        <div class="field">
          <label>👤 Capitán Asignado</label>
          <select id="add-es-capitan" class="search-input" style="width: 100%; box-sizing: border-box;">
            <option value="">-- Asignar después --</option>
            ${captains.map(c => `
              <option value="${escapeHtml(c.nombre)}">${escapeHtml(c.nombre)}</option>
            `).join('')}
          </select>
        </div>
      </div>

      <div class="modal-actions">
        <button class="btn btn-sm btn-ghost" onclick="closeAddEntreSemanaModal()">Cancelar</button>
        <button class="btn btn-sm btn-primary" onclick="saveNewEntreSemanaModal()">Agregar Salida</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

function onTurnoChange(val) {
  const horaInput = document.getElementById('add-es-hora');
  if (!horaInput) return;
  if (val === 'Tarde') {
    horaInput.value = '6:00 p.m.';
  } else {
    horaInput.value = '8:45 a.m.';
  }
}

function closeAddEntreSemanaModal() {
  const modal = document.getElementById('wm-add-es-modal');
  if (modal) modal.remove();
}

async function saveNewEntreSemanaModal() {
  if (!CURRENT_SALIDAS) return;
  if (!Array.isArray(CURRENT_SALIDAS.entre_semana)) CURRENT_SALIDAS.entre_semana = [];

  const dia = document.getElementById('add-es-dia')?.value || 'Martes';
  const turno = document.getElementById('add-es-turno')?.value || 'Mañana';
  const hora = document.getElementById('add-es-hora')?.value.trim() || '8:45 a.m.';
  const lugar = document.getElementById('add-es-lugar')?.value.trim() || 'Punto por asignar';
  const nota = document.getElementById('add-es-nota')?.value.trim() || '';
  const capitan = document.getElementById('add-es-capitan')?.value.trim() || '';

  const diaEtiqueta = `${dia} (${turno})`;

  if (lugar && lugar !== 'Punto por asignar') autoRegistrarLugar(lugar);

  CURRENT_SALIDAS.entre_semana.push({
    id: `es_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    dia: diaEtiqueta,
    hora,
    lugar,
    nota,
    capitan
  });

  CURRENT_SALIDAS.entre_semana = sortEntreSemanaEntries(CURRENT_SALIDAS.entre_semana);

  closeAddEntreSemanaModal();
  render();

  await apiSaveSalidas(SERVICE_SELECTED_MONTH_KEY, CURRENT_SALIDAS, writeToken);
}

async function eliminarSalidaEntreSemana(targetIdOrIndex) {
  if (!CURRENT_SALIDAS || !Array.isArray(CURRENT_SALIDAS.entre_semana)) return;

  let idx = CURRENT_SALIDAS.entre_semana.findIndex(x => x && x.id === targetIdOrIndex);
  if (idx < 0) {
    const numIdx = typeof targetIdOrIndex === 'number' ? targetIdOrIndex : parseInt(targetIdOrIndex, 10);
    if (!isNaN(numIdx)) idx = numIdx;
  }

  const item = CURRENT_SALIDAS.entre_semana[idx];
  if (!item) return;

  if (!confirm(`¿Eliminar la salida de ${item.dia} (${item.hora})?`)) return;

  CURRENT_SALIDAS.entre_semana.splice(idx, 1);
  render();

  await apiSaveSalidas(SERVICE_SELECTED_MONTH_KEY, CURRENT_SALIDAS, writeToken);
}

// C. Edición de Domingos (Grupos, General o Asamblea)
function onDomingoTipoChange(tipo) {
  const normalFields = document.getElementById('dom-edit-normal-fields');
  const grupoWrap = document.getElementById('dom-edit-grupo-wrap');
  const asambleaBanner = document.getElementById('dom-edit-asamblea-banner');

  if (tipo === 'asamblea') {
    if (normalFields) normalFields.style.display = 'none';
    if (asambleaBanner) asambleaBanner.style.display = 'block';
  } else {
    if (normalFields) normalFields.style.display = 'block';
    if (asambleaBanner) asambleaBanner.style.display = 'none';
    if (grupoWrap) grupoWrap.style.display = (tipo === 'grupos') ? 'block' : 'none';
  }
}

function openEditDomingoModal(domIndex, salIndex) {
  const existing = document.getElementById('wm-dom-edit-modal');
  if (existing) existing.remove();

  const dom = CURRENT_SALIDAS?.domingos?.[domIndex];
  if (!dom) return;

  const isGrupo = salIndex >= 0 && dom.salidas?.[salIndex];
  const target = isGrupo ? dom.salidas[salIndex] : dom;

  const modal = document.createElement('div');
  modal.id = 'wm-dom-edit-modal';
  modal.className = 'overlay';
  modal.innerHTML = `
    <div class="modal" style="max-width: 480px;">
      <div class="modal-head" style="background: #7a1d2e; color: #fff;">
        <h3 style="color: #fff; margin: 0;">Editar Salida de Domingo</h3>
        <p style="color: #f8c9d2; margin: 2px 0 0; font-size: 12px;">
          ${escapeHtml(dom.fecha)} ${isGrupo ? `· ${escapeHtml(target.grupo)}` : ''}
        </p>
      </div>

      <div class="modal-form-body">
        <div class="field">
          <label>🏛️ / 👥 Modalidad del Domingo</label>
          <select id="dom-edit-tipo" class="search-input" style="width: 100%; box-sizing: border-box;" onchange="onDomingoTipoChange(this.value)">
            <option value="grupos" ${dom.tipo === 'grupos' ? 'selected' : ''}>👥 Salida por Grupos (Divisiones)</option>
            <option value="general" ${dom.tipo === 'general' ? 'selected' : ''}>🏛️ Toda la Congregación (Salida General)</option>
            <option value="asamblea" ${dom.tipo === 'asamblea' ? 'selected' : ''}>⛔ Sin Salida (Asamblea de Circuito / Regional)</option>
          </select>
        </div>

        <div class="field">
          <label>📅 Fecha del Domingo (ej: 4 de Octubre)</label>
          <input type="text" id="dom-edit-fecha" class="search-input" style="width: 100%; box-sizing: border-box;" value="${escapeHtml(dom.fecha || '')}" />
        </div>

        <div id="dom-edit-normal-fields" style="${dom.tipo === 'asamblea' ? 'display: none;' : ''}">
          <div class="field" style="margin-bottom: 12px;">
            <label>⏰ Hora</label>
            <input type="text" id="dom-edit-hora" class="search-input" style="width: 100%; box-sizing: border-box;" value="${escapeHtml(dom.hora || '9:00 a.m.')}" />
          </div>

          <div class="field" id="dom-edit-grupo-wrap" style="${dom.tipo === 'grupos' ? '' : 'display: none;'} margin-bottom: 12px;">
            <label>👥 Nombre de la División / Grupo</label>
            <input type="text" id="dom-edit-grupo" class="search-input" style="width: 100%; box-sizing: border-box;" value="${escapeHtml(target.grupo || 'Grupos 1, 2, 3, 4, 10')}" />
          </div>

          <div class="field">
            <label>📍 Lugar de Salida / Dirección</label>
            <input type="text" id="dom-edit-lugar" class="search-input" style="width: 100%; box-sizing: border-box;" list="wm-lugares-dom-datalist" value="${escapeHtml(target.lugar || dom.lugar || '')}" placeholder="Selecciona o escribe un lugar..." />
            <datalist id="wm-lugares-dom-datalist">
              ${(LUGARES_SALIDAS || []).map(l => `<option value="${escapeHtml(l.nombre)}"></option>`).join('')}
            </datalist>
          </div>
        </div>

        <div id="dom-edit-asamblea-banner" style="${dom.tipo === 'asamblea' ? '' : 'display: none;'} background: #fee2e2; border: 1px solid #fca5a5; border-radius: 8px; padding: 12px; color: #991b1b; font-size: 12px;">
          ℹ️ <strong>Asamblea de Circuito o Regional:</strong> Al guardar, este domingo se registrará como <em>"Sin salida de predicación"</em>.
        </div>
      </div>

      <div class="modal-actions" style="flex-wrap: wrap;">
        ${dom.tipo === 'grupos' ? `
          <button type="button" class="btn btn-sm" style="margin-right: auto; background: #f0fdfa; color: #0f766e; border: 1px solid #5eead4; font-weight: 600;" onclick="closeEditDomingoModal(); openAddSubSalidaModal(${domIndex});" title="Agregar otra división o salida para visita de grupo">
            + Agregar División / Grupo
          </button>
        ` : ''}
        <button class="btn btn-sm btn-ghost" onclick="closeEditDomingoModal()">Cancelar</button>
        <button class="btn btn-sm btn-primary" onclick="saveEditDomingoModal(${domIndex}, ${salIndex})">Guardar Cambios</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

function closeEditDomingoModal() {
  const modal = document.getElementById('wm-dom-edit-modal');
  if (modal) modal.remove();
}

async function saveEditDomingoModal(domIndex, salIndex) {
  const dom = CURRENT_SALIDAS?.domingos?.[domIndex];
  if (!dom) return;

  const tipo = document.getElementById('dom-edit-tipo')?.value || dom.tipo || 'grupos';
  const fechaInput = document.getElementById('dom-edit-fecha');
  const horaInput = document.getElementById('dom-edit-hora');
  const lugarInput = document.getElementById('dom-edit-lugar');
  const grupoInput = document.getElementById('dom-edit-grupo');

  if (fechaInput && fechaInput.value.trim()) dom.fecha = fechaInput.value.trim();
  const hora = horaInput?.value.trim() || dom.hora || '9:00 a.m.';
  const lugar = lugarInput?.value.trim() || '';
  const grupo = grupoInput?.value.trim() || '';

  dom.hora = hora;

  if (tipo === 'asamblea') {
    dom.tipo = 'asamblea';
    delete dom.salidas;
    dom.lugar = 'Asamblea de Circuito / Regional';
    dom.capitan = '';
  } else if (tipo === 'general') {
    dom.tipo = 'general';
    dom.lugar = lugar;
    if (!dom.capitan && salIndex >= 0 && dom.salidas?.[salIndex]?.capitan) {
      dom.capitan = dom.salidas[salIndex].capitan;
    }
    // 3FN: Eliminar arreglo de salidas para que no existan divisiones huérfanas
    delete dom.salidas;
  } else {
    // tipo === 'grupos'
    dom.tipo = 'grupos';
    if (!Array.isArray(dom.salidas) || dom.salidas.length === 0) {
      dom.salidas = [
        { id: `sal_${Date.now()}_1`, grupo: grupo || 'Grupos 1, 2, 3, 4, 10', lugar: lugar || '', capitan: dom.capitan || '' },
        { id: `sal_${Date.now()}_2`, grupo: 'Grupos 5, 6, 7, 8, 9', lugar: '', capitan: '' }
      ];
    } else {
      const sIdx = salIndex >= 0 ? salIndex : 0;
      if (dom.salidas[sIdx]) {
        dom.salidas[sIdx].lugar = lugar;
        if (grupo) dom.salidas[sIdx].grupo = grupo;
      }
    }
    delete dom.lugar;
    delete dom.capitan;
  }

  if (lugar && lugar !== 'Asamblea de Circuito / Regional') autoRegistrarLugar(lugar);

  closeEditDomingoModal();
  render();

  await apiSaveSalidas(SERVICE_SELECTED_MONTH_KEY, CURRENT_SALIDAS, writeToken);
}

// Eliminar una división específica de domingo o el domingo completo
async function eliminarSubSalidaDomingo(domIndex, salIndex) {
  const dom = CURRENT_SALIDAS?.domingos?.[domIndex];
  if (!dom) return;

  if (dom.tipo === 'grupos' && Array.isArray(dom.salidas)) {
    const sal = dom.salidas[salIndex];
    const grupoNombre = sal?.grupo || 'esta división';

    if (dom.salidas.length > 1) {
      if (!confirm(`¿Deseas eliminar la división "${grupoNombre}" para el domingo ${dom.fecha}?`)) return;
      dom.salidas.splice(salIndex, 1);
      // Si solo queda 1 salida, consultar si desea unificar a Toda la Congregación
      if (dom.salidas.length === 1 && confirm(`Ahora solo queda una división en este domingo. ¿Deseas convertirlo a "Toda la Congregación"?`)) {
        dom.tipo = 'general';
        dom.lugar = dom.salidas[0].lugar;
        dom.capitan = dom.salidas[0].capitan;
        delete dom.salidas;
      }
    } else {
      if (!confirm(`¿Eliminar la salida completa de este domingo ${dom.fecha} (ej. por Asamblea)?`)) return;
      CURRENT_SALIDAS.domingos.splice(domIndex, 1);
    }
  } else {
    if (!confirm(`¿Eliminar la salida de este domingo ${dom.fecha} (ej. por Asamblea)?`)) return;
    CURRENT_SALIDAS.domingos.splice(domIndex, 1);
  }

  render();
  await apiSaveSalidas(SERVICE_SELECTED_MONTH_KEY, CURRENT_SALIDAS, writeToken);
}

// Eliminar un domingo completo
async function eliminarDomingoCompleto(domIndex) {
  const dom = CURRENT_SALIDAS?.domingos?.[domIndex];
  if (!dom) return;

  if (!confirm(`¿Deseas eliminar la programación completa del domingo ${dom.fecha} (ej. por Asamblea)?`)) return;
  CURRENT_SALIDAS.domingos.splice(domIndex, 1);

  render();
  await apiSaveSalidas(SERVICE_SELECTED_MONTH_KEY, CURRENT_SALIDAS, writeToken);
}

// ============================================================
// ASISTENTE Y MODAL PARA AGREGAR 3ERA SALIDA (VISITA A GRUPO)
// ============================================================

function excludeGroupFromDivisionText(text, groupNum) {
  if (!text) return text;
  const numStr = String(groupNum);
  const matches = text.match(/\b([1-9]|10)\b/g);
  if (!matches || !matches.includes(numStr)) return text;

  const remaining = matches.filter(n => n !== numStr);
  if (remaining.length === 0) return 'Sin grupos';
  if (remaining.length === 1) return `Grupo ${remaining[0]}`;
  return `Grupos ${remaining.join(', ')}`;
}

function openAddSubSalidaModal(domIndex) {
  const existing = document.getElementById('wm-add-subsalida-modal');
  if (existing) existing.remove();

  const dom = CURRENT_SALIDAS?.domingos?.[domIndex];
  if (!dom) return;

  const captains = getEligiblePeople(PEOPLE || [], 'capitan');
  const monthLabel = getMonthLabelFromKey(SERVICE_SELECTED_MONTH_KEY);

  const modal = document.createElement('div');
  modal.id = 'wm-add-subsalida-modal';
  modal.className = 'overlay';
  modal.innerHTML = `
    <div class="modal" style="max-width: 500px;">
      <div class="modal-head" style="background: #0f766e; color: #fff;">
        <h3 style="color: #fff; margin: 0;">+ Agregar Salida / Visita a Grupo</h3>
        <p style="color: #ccfbf1; margin: 2px 0 0; font-size: 12px;">
          📅 ${escapeHtml(dom.fecha)} · ${escapeHtml(monthLabel)}
        </p>
      </div>

      <div class="modal-form-body">
        <div class="field">
          <label>🎯 Tipo de Asignación</label>
          <select id="subdom-mode" class="search-input" style="width: 100%; box-sizing: border-box;" onchange="onSubdomModeChange(this.value)">
            <option value="visita" selected>🌟 Visita Especial a un Grupo (ej: Grupo 6)</option>
            <option value="personalizado">✍️ Nombre / División Personalizada</option>
          </select>
        </div>

        <!-- Bloque Visita a Grupo -->
        <div id="subdom-visita-box" style="display: flex; flex-direction: column; gap: 10px; background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px; padding: 12px;">
          <div class="field">
            <label style="color: #0f766e; font-weight: 700;">👥 Selecciona el Grupo a Visitar:</label>
            <select id="subdom-group-select" class="search-input" style="width: 100%; box-sizing: border-box; font-weight: 600;" onchange="onSubdomGroupSelectChange(this.value)">
              ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => `
                <option value="${n}" ${n === 6 ? 'selected' : ''}>Grupo ${n}</option>
              `).join('')}
            </select>
          </div>

          <label style="display: flex; align-items: flex-start; gap: 8px; font-size: 12px; color: #115e59; cursor: pointer; line-height: 1.4;">
            <input type="checkbox" id="subdom-auto-adjust" checked style="margin-top: 2px;" />
            <span>
              <strong>Ajustar automáticamente la división hermana:</strong><br/>
              Excluir este grupo de la división que lo contenía para evitar repeticiones (ej: cambiar <em>"Grupos 5, 6, 7, 8, 9"</em> a <em>"Grupos 5, 7, 8, 9"</em>).
            </span>
          </label>
        </div>

        <div class="field">
          <label>🏷️ Nombre de la Nueva Salida / División</label>
          <input type="text" id="subdom-group-name" class="search-input" style="width: 100%; box-sizing: border-box; font-weight: 600;" value="Grupo 6" />
        </div>

        <div class="field">
          <label>📍 Lugar de Salida / Dirección</label>
          <input type="text" id="subdom-lugar" class="search-input" style="width: 100%; box-sizing: border-box;" list="wm-lugares-subdom-datalist" placeholder="Selecciona o escribe el lugar..." />
          <datalist id="wm-lugares-subdom-datalist">
            ${(LUGARES_SALIDAS || []).map(l => `<option value="${escapeHtml(l.nombre)}"></option>`).join('')}
          </datalist>
        </div>

        <div class="field">
          <label>👤 Capitán Asignado</label>
          <select id="subdom-capitan" class="search-input" style="width: 100%; box-sizing: border-box;">
            <option value="">-- Por asignar después --</option>
            ${captains.map(c => `<option value="${escapeHtml(c.nombre)}">${escapeHtml(c.nombre)}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="modal-actions">
        <button class="btn btn-sm btn-ghost" onclick="closeAddSubSalidaModal()">Cancelar</button>
        <button class="btn btn-sm btn-primary" onclick="saveAddSubSalidaModal(${domIndex})">+ Agregar Salida</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

function onSubdomModeChange(mode) {
  const visitaBox = document.getElementById('subdom-visita-box');
  const nameInput = document.getElementById('subdom-group-name');
  const groupSelect = document.getElementById('subdom-group-select');

  if (mode === 'visita') {
    if (visitaBox) visitaBox.style.display = 'flex';
    if (nameInput && groupSelect) nameInput.value = `Grupo ${groupSelect.value}`;
  } else {
    if (visitaBox) visitaBox.style.display = 'none';
    if (nameInput) {
      nameInput.value = '';
      nameInput.placeholder = 'Ej: Grupo 6 o División Especial...';
    }
  }
}

function onSubdomGroupSelectChange(groupNum) {
  const nameInput = document.getElementById('subdom-group-name');
  if (nameInput) nameInput.value = `Grupo ${groupNum}`;
}

function closeAddSubSalidaModal() {
  const modal = document.getElementById('wm-add-subsalida-modal');
  if (modal) modal.remove();
}

async function saveAddSubSalidaModal(domIndex) {
  const dom = CURRENT_SALIDAS?.domingos?.[domIndex];
  if (!dom) return;

  const mode = document.getElementById('subdom-mode')?.value || 'visita';
  const groupNum = document.getElementById('subdom-group-select')?.value || '6';
  const customName = document.getElementById('subdom-group-name')?.value.trim();
  const autoAdjust = document.getElementById('subdom-auto-adjust')?.checked;
  const lugar = document.getElementById('subdom-lugar')?.value.trim() || '';
  const capitan = document.getElementById('subdom-capitan')?.value.trim() || '';

  const finalGroupName = customName || (mode === 'visita' ? `Grupo ${groupNum}` : 'Nuevo Grupo');

  // Asegurar que el domingo esté en modo grupos
  dom.tipo = 'grupos';
  if (!Array.isArray(dom.salidas)) {
    dom.salidas = [
      { id: `sal_${Date.now()}_1`, grupo: 'Grupos 1, 2, 3, 4, 10', lugar: dom.lugar || '', capitan: dom.capitan || '' },
      { id: `sal_${Date.now()}_2`, grupo: 'Grupos 5, 6, 7, 8, 9', lugar: '', capitan: '' }
    ];
    delete dom.lugar;
    delete dom.capitan;
  }

  // Si se marcó auto-ajustar en modo visita, excluir el número de grupo de las otras divisiones
  if (mode === 'visita' && autoAdjust) {
    dom.salidas.forEach(sal => {
      sal.grupo = excludeGroupFromDivisionText(sal.grupo, groupNum);
    });
  }

  // Agregar la nueva salida
  dom.salidas.push({
    id: `sal_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    grupo: finalGroupName,
    lugar,
    capitan
  });

  if (lugar) autoRegistrarLugar(lugar);

  closeAddSubSalidaModal();
  render();
  showToast(`✓ Salida para ${finalGroupName} agregada a ${dom.fecha}`, 'success');
  await apiSaveSalidas(SERVICE_SELECTED_MONTH_KEY, CURRENT_SALIDAS, writeToken);
}

// ============================================================
// MODAL Y MANEJO DE PUNTOS DE SALIDA DE SÁBADO (MÚLTIPLES SALIDAS)
// ============================================================

function openAddPuntoSabadoModal(sabIndex) {
  const existing = document.getElementById('wm-add-puntosab-modal');
  if (existing) existing.remove();

  const sab = CURRENT_SALIDAS?.sabados?.[sabIndex];
  if (!sab) return;

  const captains = getEligiblePeople(PEOPLE || [], 'capitan');
  const monthLabel = getMonthLabelFromKey(SERVICE_SELECTED_MONTH_KEY);

  const modal = document.createElement('div');
  modal.id = 'wm-add-puntosab-modal';
  modal.className = 'overlay';
  modal.innerHTML = `
    <div class="modal" style="max-width: 480px;">
      <div class="modal-head" style="background: #1e293b; color: #fff;">
        <h3 style="color: #fff; margin: 0;">+ Agregar Punto de Salida</h3>
        <p style="color: #cbd5e1; margin: 2px 0 0; font-size: 12px;">
          📅 ${escapeHtml(sab.fecha)} · ${escapeHtml(monthLabel)}
        </p>
      </div>

      <div class="modal-form-body">
        <div style="display: flex; gap: 12px;">
          <div class="field" style="flex: 1;">
            <label>⏰ Hora</label>
            <input type="text" id="add-puntosab-hora" class="search-input" style="width: 100%; box-sizing: border-box;" value="8:30 a.m." />
          </div>
          <div class="field" style="flex: 1.5;">
            <label>🏷️ Tipo de Salida</label>
            <input type="text" id="add-puntosab-nota" class="search-input" style="width: 100%; box-sizing: border-box;" value="PREDICACION PUBLICA" placeholder="Ej: CARRITOS, RURAL, TABLANCA..." />
          </div>
        </div>

        <div class="field">
          <label>📍 Lugar de Salida / Dirección</label>
          <input type="text" id="add-puntosab-lugar" class="search-input" style="width: 100%; box-sizing: border-box;" list="wm-lugares-puntosab-datalist" placeholder="Selecciona o escribe el lugar..." />
          <datalist id="wm-lugares-puntosab-datalist">
            ${(LUGARES_SALIDAS || []).map(l => `<option value="${escapeHtml(l.nombre)}"></option>`).join('')}
          </datalist>
        </div>

        <div class="field">
          <label>👤 Capitán Asignado</label>
          <select id="add-puntosab-capitan" class="search-input" style="width: 100%; box-sizing: border-box;">
            <option value="">-- Por asignar después --</option>
            ${captains.map(c => `<option value="${escapeHtml(c.nombre)}">${escapeHtml(c.nombre)}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="modal-actions">
        <button class="btn btn-sm btn-ghost" onclick="closeAddPuntoSabadoModal()">Cancelar</button>
        <button class="btn btn-sm btn-primary" onclick="saveAddPuntoSabadoModal(${sabIndex})">+ Agregar Punto</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

function closeAddPuntoSabadoModal() {
  const modal = document.getElementById('wm-add-puntosab-modal');
  if (modal) modal.remove();
}

async function saveAddPuntoSabadoModal(sabIndex) {
  const sab = CURRENT_SALIDAS?.sabados?.[sabIndex];
  if (!sab) return;

  const hora = document.getElementById('add-puntosab-hora')?.value.trim() || '8:30 a.m.';
  const nota = document.getElementById('add-puntosab-nota')?.value.trim() || 'PREDICACION PUBLICA';
  const lugar = document.getElementById('add-puntosab-lugar')?.value.trim() || '';
  const capitan = document.getElementById('add-puntosab-capitan')?.value.trim() || '';

  if (!Array.isArray(sab.puntos) || sab.puntos.length === 0) {
    sab.puntos = [
      {
        id: `p_${Date.now()}_1`,
        hora: sab.hora || '8:30 a.m.',
        lugar: sab.lugar || '',
        nota: sab.nota || 'PREDICACION PUBLICA',
        capitan: sab.capitan || ''
      },
      {
        id: `p_${Date.now()}_2`,
        hora,
        lugar,
        nota,
        capitan
      }
    ];
    delete sab.hora;
    delete sab.lugar;
    delete sab.nota;
    delete sab.capitan;
  } else {
    sab.puntos.push({
      id: `p_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      hora,
      lugar,
      nota,
      capitan
    });
  }

  if (lugar) autoRegistrarLugar(lugar);

  closeAddPuntoSabadoModal();
  render();
  showToast(`✓ Punto de salida agregado al sábado ${sab.fecha}`, 'success');
  await apiSaveSalidas(SERVICE_SELECTED_MONTH_KEY, CURRENT_SALIDAS, writeToken);
}

// Modal para editar un punto específico de sábado
function openEditPuntoSabadoModal(sabIndex, pIndex) {
  const existing = document.getElementById('wm-edit-puntosab-modal');
  if (existing) existing.remove();

  const sab = CURRENT_SALIDAS?.sabados?.[sabIndex];
  if (!sab) return;

  const puntos = getSabadoPuntos(sab);
  const p = puntos[pIndex] || {};
  const monthLabel = getMonthLabelFromKey(SERVICE_SELECTED_MONTH_KEY);

  const modal = document.createElement('div');
  modal.id = 'wm-edit-puntosab-modal';
  modal.className = 'overlay';
  modal.innerHTML = `
    <div class="modal" style="max-width: 480px;">
      <div class="modal-head" style="background: #1e293b; color: #fff;">
        <h3 style="color: #fff; margin: 0;">✏️ Editar Salida de Sábado</h3>
        <p style="color: #cbd5e1; margin: 2px 0 0; font-size: 12px;">
          📅 ${escapeHtml(sab.fecha)} · ${escapeHtml(monthLabel)}
        </p>
      </div>

      <div class="modal-form-body">
        <div class="field">
          <label>📅 Fecha del Sábado (ej: 12 de Septiembre)</label>
          <input type="text" id="edit-puntosab-fecha" class="search-input" style="width: 100%; box-sizing: border-box;" value="${escapeHtml(sab.fecha || '')}" />
        </div>

        <div style="display: flex; gap: 12px;">
          <div class="field" style="flex: 1;">
            <label>⏰ Hora</label>
            <input type="text" id="edit-puntosab-hora" class="search-input" style="width: 100%; box-sizing: border-box;" value="${escapeHtml(p.hora || '8:30 a.m.')}" />
          </div>
          <div class="field" style="flex: 1.5;">
            <label>🏷️ Tipo de Salida</label>
            <input type="text" id="edit-puntosab-nota" class="search-input" style="width: 100%; box-sizing: border-box;" value="${escapeHtml(p.nota || '')}" placeholder="Ej: PREDICACION PUBLICA, CARRITOS..." />
          </div>
        </div>

        <div class="field">
          <label>📍 Lugar de Salida / Dirección</label>
          <input type="text" id="edit-puntosab-lugar" class="search-input" style="width: 100%; box-sizing: border-box;" list="wm-lugares-editpuntosab-datalist" value="${escapeHtml(p.lugar || '')}" placeholder="Selecciona o escribe el lugar..." />
          <datalist id="wm-lugares-editpuntosab-datalist">
            ${(LUGARES_SALIDAS || []).map(l => `<option value="${escapeHtml(l.nombre)}"></option>`).join('')}
          </datalist>
        </div>
      </div>

      <div class="modal-actions">
        <button class="btn btn-sm btn-ghost" onclick="closeEditPuntoSabadoModal()">Cancelar</button>
        <button class="btn btn-sm btn-primary" onclick="saveEditPuntoSabadoModal(${sabIndex}, ${pIndex})">Guardar Cambios</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

function closeEditPuntoSabadoModal() {
  const modal = document.getElementById('wm-edit-puntosab-modal');
  if (modal) modal.remove();
}

async function saveEditPuntoSabadoModal(sabIndex, pIndex) {
  const sab = CURRENT_SALIDAS?.sabados?.[sabIndex];
  if (!sab) return;

  const fechaInput = document.getElementById('edit-puntosab-fecha')?.value.trim();
  const hora = document.getElementById('edit-puntosab-hora')?.value.trim() || '8:30 a.m.';
  const nota = document.getElementById('edit-puntosab-nota')?.value.trim() || '';
  const lugar = document.getElementById('edit-puntosab-lugar')?.value.trim() || '';

  if (fechaInput) sab.fecha = fechaInput;

  if (Array.isArray(sab.puntos) && sab.puntos[pIndex]) {
    sab.puntos[pIndex].hora = hora;
    sab.puntos[pIndex].nota = nota;
    sab.puntos[pIndex].lugar = lugar;
  } else {
    sab.hora = hora;
    sab.nota = nota;
    sab.lugar = lugar;
  }

  if (lugar) autoRegistrarLugar(lugar);

  closeEditPuntoSabadoModal();
  render();
  showToast(`✓ Salida del sábado ${sab.fecha} actualizada`, 'success');
  await apiSaveSalidas(SERVICE_SELECTED_MONTH_KEY, CURRENT_SALIDAS, writeToken);
}

// Eliminar un punto específico de sábado
async function eliminarPuntoSabado(sabIndex, pIndex) {
  const sab = CURRENT_SALIDAS?.sabados?.[sabIndex];
  if (!sab) return;

  const puntos = getSabadoPuntos(sab);
  if (puntos.length > 1) {
    const p = puntos[pIndex];
    if (!confirm(`¿Deseas eliminar este punto de salida (${p.lugar || p.nota || 'Punto'}) del sábado ${sab.fecha}?`)) return;

    if (Array.isArray(sab.puntos)) {
      sab.puntos.splice(pIndex, 1);
      if (sab.puntos.length === 1) {
        sab.hora = sab.puntos[0].hora;
        sab.lugar = sab.puntos[0].lugar;
        sab.nota = sab.puntos[0].nota;
        sab.capitan = sab.puntos[0].capitan;
        delete sab.puntos;
      }
    }
  } else {
    if (!confirm(`¿Deseas eliminar la programación completa del sábado ${sab.fecha} (ej. por Asamblea)?`)) return;
    CURRENT_SALIDAS.sabados.splice(sabIndex, 1);
  }

  render();
  await apiSaveSalidas(SERVICE_SELECTED_MONTH_KEY, CURRENT_SALIDAS, writeToken);
}

// Eliminar un sábado
async function eliminarSalidaSabado(targetIdOrIndex) {
  if (!CURRENT_SALIDAS || !Array.isArray(CURRENT_SALIDAS.sabados)) return;

  let idx = CURRENT_SALIDAS.sabados.findIndex(x => x && (x.id === targetIdOrIndex));
  if (idx < 0) {
    const numIdx = typeof targetIdOrIndex === 'number' ? targetIdOrIndex : parseInt(targetIdOrIndex, 10);
    if (!isNaN(numIdx)) idx = numIdx;
  }

  const item = CURRENT_SALIDAS.sabados[idx];
  if (!item) return;

  if (!confirm(`¿Deseas eliminar la salida del sábado ${item.fecha} (ej. por Asamblea)?`)) return;

  CURRENT_SALIDAS.sabados.splice(idx, 1);
  render();
  await apiSaveSalidas(SERVICE_SELECTED_MONTH_KEY, CURRENT_SALIDAS, writeToken);
}

// Modal para Agregar un nuevo Sábado
function openAddSabadoModal() {
  const existing = document.getElementById('wm-add-sab-modal');
  if (existing) existing.remove();

  const captains = getEligiblePeople(PEOPLE || [], 'capitan');
  const monthLabel = getMonthLabelFromKey(SERVICE_SELECTED_MONTH_KEY);

  const modal = document.createElement('div');
  modal.id = 'wm-add-sab-modal';
  modal.className = 'overlay';
  modal.innerHTML = `
    <div class="modal" style="max-width: 480px;">
      <div class="modal-head" style="background: #7a1d2e; color: #fff;">
        <h3 style="color: #fff; margin: 0;">+ Agregar Sábado de Predicación</h3>
        <p style="color: #f8c9d2; margin: 2px 0 0; font-size: 12px;">${escapeHtml(monthLabel)}</p>
      </div>

      <div class="modal-form-body">
        <div class="field">
          <label>📅 Fecha Exacta (ej: 7 de Noviembre)</label>
          <input type="text" id="add-sab-fecha" class="search-input" style="width: 100%; box-sizing: border-box;" placeholder="Ej: 7 de Noviembre" />
        </div>

        <div style="display: flex; gap: 12px;">
          <div class="field" style="flex: 1;">
            <label>⏰ Hora</label>
            <input type="text" id="add-sab-hora" class="search-input" style="width: 100%; box-sizing: border-box;" value="8:30 a.m." />
          </div>
          <div class="field" style="flex: 1.5;">
            <label>🏷️ Tipo de Salida</label>
            <input type="text" id="add-sab-nota" class="search-input" style="width: 100%; box-sizing: border-box;" value="PREDICACION PUBLICA" />
          </div>
        </div>

        <div class="field">
          <label>📍 Lugar de Salida / Dirección</label>
          <input type="text" id="add-sab-lugar" class="search-input" style="width: 100%; box-sizing: border-box;" list="wm-lugares-add-sab-datalist" placeholder="Selecciona o escribe un lugar..." />
          <datalist id="wm-lugares-add-sab-datalist">
            ${(LUGARES_SALIDAS || []).map(l => `<option value="${escapeHtml(l.nombre)}"></option>`).join('')}
          </datalist>
        </div>

        <div class="field">
          <label>👤 Capitán Asignado</label>
          <select id="add-sab-capitan" class="search-input" style="width: 100%; box-sizing: border-box;">
            <option value="">-- Por asignar --</option>
            ${captains.map(c => `<option value="${escapeHtml(c.nombre)}">${escapeHtml(c.nombre)}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="modal-actions">
        <button class="btn btn-sm btn-ghost" onclick="closeAddSabadoModal()">Cancelar</button>
        <button class="btn btn-sm btn-primary" onclick="saveAddSabadoModal()">Agregar Sábado</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

function closeAddSabadoModal() {
  const modal = document.getElementById('wm-add-sab-modal');
  if (modal) modal.remove();
}

async function saveAddSabadoModal() {
  if (!CURRENT_SALIDAS) return;
  if (!Array.isArray(CURRENT_SALIDAS.sabados)) CURRENT_SALIDAS.sabados = [];

  const fecha = document.getElementById('add-sab-fecha')?.value.trim();
  if (!fecha) {
    alert('Por favor indica la fecha del sábado (ej: 7 de Noviembre).');
    return;
  }
  const hora = document.getElementById('add-sab-hora')?.value.trim() || '8:30 a.m.';
  const nota = document.getElementById('add-sab-nota')?.value.trim() || 'PREDICACION PUBLICA';
  const lugar = document.getElementById('add-sab-lugar')?.value.trim() || '';
  const capitan = document.getElementById('add-sab-capitan')?.value.trim() || '';

  if (lugar) autoRegistrarLugar(lugar);

  CURRENT_SALIDAS.sabados.push({
    id: `sab_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    fecha,
    hora,
    lugar,
    nota,
    capitan
  });

  closeAddSabadoModal();
  render();
  await apiSaveSalidas(SERVICE_SELECTED_MONTH_KEY, CURRENT_SALIDAS, writeToken);
}

// Modal para Agregar un nuevo Domingo
function openAddDomingoModal() {
  const existing = document.getElementById('wm-add-dom-modal');
  if (existing) existing.remove();

  const captains = getEligiblePeople(PEOPLE || [], 'capitan');
  const monthLabel = getMonthLabelFromKey(SERVICE_SELECTED_MONTH_KEY);

  const modal = document.createElement('div');
  modal.id = 'wm-add-dom-modal';
  modal.className = 'overlay';
  modal.innerHTML = `
    <div class="modal" style="max-width: 480px;">
      <div class="modal-head" style="background: #7a1d2e; color: #fff;">
        <h3 style="color: #fff; margin: 0;">+ Agregar Domingo de Predicación</h3>
        <p style="color: #f8c9d2; margin: 2px 0 0; font-size: 12px;">${escapeHtml(monthLabel)}</p>
      </div>

      <div class="modal-form-body">
        <div class="field">
          <label>📅 Fecha Exacta (ej: 8 de Noviembre)</label>
          <input type="text" id="add-dom-fecha" class="search-input" style="width: 100%; box-sizing: border-box;" placeholder="Ej: 8 de Noviembre" />
        </div>

        <div style="display: flex; gap: 12px;">
          <div class="field" style="flex: 1;">
            <label>⏰ Hora</label>
            <input type="text" id="add-dom-hora" class="search-input" style="width: 100%; box-sizing: border-box;" value="9:00 a.m." />
          </div>
          <div class="field" style="flex: 1.5;">
            <label>🏛️ / 👥 Modalidad</label>
            <select id="add-dom-tipo" class="search-input" style="width: 100%; box-sizing: border-box;">
              <option value="grupos">👥 Salida por Grupos (2 divisiones)</option>
              <option value="general">🏛️ Toda la Congregación</option>
              <option value="asamblea">⛔ Sin salida (Asamblea)</option>
            </select>
          </div>
        </div>

        <div class="field">
          <label>📍 Lugar de Salida / Dirección (Opcional)</label>
          <input type="text" id="add-dom-lugar" class="search-input" style="width: 100%; box-sizing: border-box;" list="wm-lugares-add-dom-datalist" placeholder="Selecciona o escribe un lugar..." />
          <datalist id="wm-lugares-add-dom-datalist">
            ${(LUGARES_SALIDAS || []).map(l => `<option value="${escapeHtml(l.nombre)}"></option>`).join('')}
          </datalist>
        </div>
      </div>

      <div class="modal-actions">
        <button class="btn btn-sm btn-ghost" onclick="closeAddDomingoModal()">Cancelar</button>
        <button class="btn btn-sm btn-primary" onclick="saveAddDomingoModal()">Agregar Domingo</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

function closeAddDomingoModal() {
  const modal = document.getElementById('wm-add-dom-modal');
  if (modal) modal.remove();
}

async function saveAddDomingoModal() {
  if (!CURRENT_SALIDAS) return;
  if (!Array.isArray(CURRENT_SALIDAS.domingos)) CURRENT_SALIDAS.domingos = [];

  const fecha = document.getElementById('add-dom-fecha')?.value.trim();
  if (!fecha) {
    alert('Por favor indica la fecha del domingo (ej: 8 de Noviembre).');
    return;
  }
  const hora = document.getElementById('add-dom-hora')?.value.trim() || '9:00 a.m.';
  const tipo = document.getElementById('add-dom-tipo')?.value || 'grupos';
  const lugar = document.getElementById('add-dom-lugar')?.value.trim() || '';

  if (lugar) autoRegistrarLugar(lugar);

  const newDom = {
    id: `dom_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    fecha,
    hora,
    tipo
  };

  if (tipo === 'asamblea') {
    newDom.lugar = 'Asamblea de Circuito / Regional';
    newDom.capitan = '';
  } else if (tipo === 'general') {
    newDom.lugar = lugar;
    newDom.capitan = '';
  } else {
    newDom.salidas = [
      { id: `sal_${Date.now()}_1`, grupo: 'Grupos 1, 2, 3, 4, 10', lugar: lugar || '', capitan: '' },
      { id: `sal_${Date.now()}_2`, grupo: 'Grupos 5, 6, 7, 8, 9', lugar: '', capitan: '' }
    ];
  }

  CURRENT_SALIDAS.domingos.push(newDom);

  closeAddDomingoModal();
  render();
  await apiSaveSalidas(SERVICE_SELECTED_MONTH_KEY, CURRENT_SALIDAS, writeToken);
}

// ============================================================
// MODAL: ADMINISTRAR LUGARES FRECUENTES DE SALIDA (PUNTOS 1 Y 2)
// ============================================================

function openManageLugaresModal() {
  const existing = document.getElementById('wm-manage-lugares-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'wm-manage-lugares-modal';
  modal.className = 'overlay';
  modal.innerHTML = `
    <div class="modal" style="max-width: 580px;">
      <div class="modal-head" style="background: var(--teal-deep); color: #fff; border-bottom: none;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h3 style="color: #fff; margin: 0; font-size: 16px;">📍 Lugares Frecuentes de Salida</h3>
            <p style="color: #c9e2dd; margin: 2px 0 0; font-size: 12px;">Catálogo reutilizable para asignar salidas rápidamente</p>
          </div>
          <button onclick="closeManageLugaresModal()" style="background: transparent; border: none; color: #fff; font-size: 20px; cursor: pointer;">✕</button>
        </div>
      </div>

      <div class="modal-form-body">
        <!-- Formulario para agregar un nuevo lugar -->
        <div style="background: var(--paper-2); border: 1px solid var(--line); border-radius: 10px; padding: 12px; margin-bottom: 16px;">
          <label style="font-size: 12px; font-weight: 700; color: var(--ink); display: block; margin-bottom: 6px;">
            + Agregar Nuevo Lugar al Catálogo:
          </label>
          <div style="display: flex; gap: 8px;">
            <input
              type="text"
              id="new-lugar-input"
              class="search-input"
              style="flex: 1; font-size: 13px;"
              placeholder="Ej: Familia Gómez (San Pedro) Calle 4 # 12-30"
              onkeydown="if(event.key==='Enter'){ event.preventDefault(); addNewLugar(); }"
            />
            <button class="btn btn-sm btn-primary" onclick="addNewLugar()">
              Agregar
            </button>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 12px; font-weight: 700; color: var(--muted); text-transform: uppercase;">
            Lugares Guardados (${LUGARES_SALIDAS.length})
          </span>
          <span style="font-size: 11px; color: var(--muted);">Haz clic en ✏️ para editar o 🗑️ para eliminar</span>
        </div>

        <div id="lugares-list-container" style="display: flex; flex-direction: column; gap: 6px;">
          ${renderLugaresListRows()}
        </div>
      </div>

      <div class="modal-actions">
        <button class="btn btn-sm btn-ghost" onclick="closeManageLugaresModal()">
          Cerrar
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

function renderLugaresListRows() {
  if (!LUGARES_SALIDAS || LUGARES_SALIDAS.length === 0) {
    return `<p style="text-align: center; color: var(--muted); font-size: 13px; padding: 20px;">No hay lugares registrados.</p>`;
  }

  return LUGARES_SALIDAS.map((lug, idx) => `
    <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; background: var(--paper); border: 1px solid var(--line); border-radius: 8px; padding: 8px 12px;">
      <div style="display: flex; align-items: flex-start; gap: 8px; flex: 1;">
        <span style="color: #d9383a; font-size: 15px; margin-top: 1px;">📍</span>
        <span id="lugar-name-${idx}" style="font-size: 13px; color: var(--ink); line-height: 1.4;">${escapeHtml(lug.nombre)}</span>
      </div>
      <div style="display: flex; gap: 4px;">
        <button class="service-action-btn" onclick="editLugarPrompt(${idx})" title="Editar lugar">✏️</button>
        <button class="service-action-btn" style="color: #b91c1c;" onclick="deleteLugar(${idx})" title="Eliminar lugar">🗑️</button>
      </div>
    </div>
  `).join('');
}

function closeManageLugaresModal() {
  const modal = document.getElementById('wm-manage-lugares-modal');
  if (modal) modal.remove();
}

async function addNewLugar() {
  const input = document.getElementById('new-lugar-input');
  const nombre = input?.value.trim();
  if (!nombre) return;

  const exists = LUGARES_SALIDAS.some(l => l.nombre.toLowerCase() === nombre.toLowerCase());
  if (exists) {
    alert('Este lugar ya existe en el catálogo.');
    return;
  }

  LUGARES_SALIDAS.push({
    id: `lug_${Date.now()}`,
    nombre
  });

  input.value = '';
  refreshLugaresUI();
  await apiSaveLugares(LUGARES_SALIDAS, writeToken);
}

async function editLugarPrompt(index) {
  const item = LUGARES_SALIDAS[index];
  if (!item) return;

  const nuevoNombre = prompt('Editar nombre o dirección del lugar:', item.nombre);
  if (nuevoNombre === null) return;
  const trimmed = nuevoNombre.trim();
  if (!trimmed || trimmed === item.nombre) return;

  item.nombre = trimmed;
  refreshLugaresUI();
  await apiSaveLugares(LUGARES_SALIDAS, writeToken);
}

async function deleteLugar(index) {
  const item = LUGARES_SALIDAS[index];
  if (!item) return;

  if (!confirm(`¿Eliminar "${item.nombre}" del catálogo de lugares frecuentes?`)) return;

  LUGARES_SALIDAS.splice(index, 1);
  refreshLugaresUI();
  await apiSaveLugares(LUGARES_SALIDAS, writeToken);
}

function refreshLugaresUI() {
  const container = document.getElementById('lugares-list-container');
  if (container) {
    container.innerHTML = renderLugaresListRows();
  }
}

// Auto-registrar un lugar en el catálogo si el admin escribe uno nuevo al crear/editar salidas
function autoRegistrarLugar(nombreLugar) {
  if (!nombreLugar) return;
  const clean = nombreLugar.trim();
  if (!clean || clean.length < 4) return;

  if (!Array.isArray(LUGARES_SALIDAS)) LUGARES_SALIDAS = [];

  const exists = LUGARES_SALIDAS.some(l => l.nombre.toLowerCase() === clean.toLowerCase());
  if (!exists) {
    LUGARES_SALIDAS.push({
      id: `lug_${Date.now()}`,
      nombre: clean
    });
    // Guardar asíncronamente en backend
    apiSaveLugares(LUGARES_SALIDAS, writeToken);
  }
}

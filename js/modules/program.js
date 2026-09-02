// ============================================================
// VIDA Y MINISTERIO — VILLA CONCHA
// js/modules/program.js
// Renderizado del Programa Semanal, Renumeración Dinámica y Edición Completa
// ============================================================

const BIMESTRE_MONTH_LABELS = {
  1: 'Enero - Febrero',
  3: 'Marzo - Abril',
  5: 'Mayo - Junio',
  7: 'Julio - Agosto',
  9: 'Septiembre - Octubre',
  11: 'Noviembre - Diciembre'
};

// Obtener bimestres visibles para el publicador según la regla exacta de calendario
function computeViewerBimestres(date) {
  const d = date || new Date();
  const m = d.getMonth() + 1;
  const day = d.getDate();

  const isFirstMonthOfBimestre = (m % 2 === 1);
  const isSecondMonthOfBimestre = (m % 2 === 0);

  const currentPairStart = isFirstMonthOfBimestre ? m : m - 1;
  const currentBimestre = BIMESTRE_MONTH_LABELS[currentPairStart];

  const nextPairStart = currentPairStart === 11 ? 1 : currentPairStart + 2;
  const nextBimestre = BIMESTRE_MONTH_LABELS[nextPairStart];

  const prevPairStart = currentPairStart === 1 ? 11 : currentPairStart - 2;
  const prevBimestre = BIMESTRE_MONTH_LABELS[prevPairStart];

  const result = [];

  if (isFirstMonthOfBimestre && day <= 7) {
    result.push(prevBimestre);
  }

  result.push(currentBimestre);

  if (isSecondMonthOfBimestre) {
    result.push(nextBimestre);
  }

  return Array.from(new Set(result.filter(Boolean)));
}

// Renumeración correlativa dinámica continua (1, 2, 3, 4, 5, 6, 7, 8, 9, 10...)
function recomputeWeekItemNumbers(w) {
  if (!w || !Array.isArray(w.items)) return;

  let currentNum = 1;

  w.items.forEach(it => {
    // Si es canción (intermedia o de inicio/fin), no lleva número
    if (isPureSongLine(it) || /canc[ií]ó[nn]/i.test(it.label || '')) {
      delete it.num;
      return;
    }

    // Si es introducción o conclusión, no lleva número
    if (/palabras de (introducci[oó]n|conclusi[oó]n)/i.test(it.label || '')) {
      delete it.num;
      return;
    }

    // Asignaciones de Tesoros, Maestros y NVC llevan numeración secuencial
    if (['TESOROS', 'MAESTROS', 'NVC'].includes(it.section) || it.hasOwnProperty('conductor')) {
      it.num = currentNum++;
    }
  });
}

// Alternar apertura/cierre de una semana en el acordeón
function toggleWeek(weekId) {
  if (openWeeks.has(weekId)) {
    openWeeks.delete(weekId);
  } else {
    openWeeks.add(weekId);
  }
  render();
}

// Renderizado principal de la pestaña Programa
function renderProgramTab() {
  // 1. Vista de Solo Lectura (Público / No Administrador)
  if (!isAdmin) {
    const viewerLabels = computeViewerBimestres();

    return `
      <div class="section-pad">
        <div class="view-only-note">
          👁️ Estás viendo el programa en modo solo lectura. Desde el primer día de cada mes se muestran el bimestre vigente y el siguiente.
        </div>

        ${viewerLabels.map(label => {
          const bim = (PROGRAM?.bimestre === label) ? PROGRAM : (typeof DEFAULT_PROGRAM !== 'undefined' ? DEFAULT_PROGRAM.find(b => b.bimestre === label) : null);
          if (!bim || !Array.isArray(bim.weeks) || bim.weeks.length === 0) return '';

          return `
            <div class="viewer-bimester-title">
              ${escapeHtml(bim.bimestre)}
            </div>
            <div class="weeks-container">
              ${bim.weeks.map((week, idx) => renderWeekCard(bim, week, idx)).join('')}
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // Vista de Administrador (Con herramientas de edición)
  if (!PROGRAM || !Array.isArray(PROGRAM.weeks)) {
    return '<div class="section-pad"><div class="loading">Cargando datos del programa…</div></div>';
  }

  // Usar la lista dinámica de Firestore + asegurar que el bimestre actual esté incluido
  const allBimestres = [...new Set([...BIMESTRES_LIST, PROGRAM.bimestre].filter(Boolean))];

  return `
    <div class="section-pad">
      <!-- Selector de Bimestres -->
      <div class="program-toolbar">
        <div class="pill-row" style="margin: 0;">
          ${allBimestres.map(b => `
            <button
              class="pill ${PROGRAM.bimestre === b ? 'active' : ''}"
              onclick="switchBimestre('${b}')"
            >
              ${escapeHtml(b)}
            </button>
          `).join('')}
        </div>

        <div class="actions" style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
          <button class="btn btn-ghost btn-sm" onclick="exportProgramPdf()">⬇ Descargar PDF</button>
          <button class="btn btn-ghost btn-sm" style="color: var(--terra-warn); border-color: rgba(181,80,46,0.35);" onclick="clearBimestreAssignmentsPrompt()" title="Vaciar las asignaciones de hermanos en este bimestre para volver a programar">🗑 Limpiar asignaciones</button>
        </div>
      </div>

      <!-- Semanas del Bimestre Seleccionado -->
      <div class="weeks-container">
        ${PROGRAM.weeks.map((week, idx) => renderWeekCard(PROGRAM, week, idx)).join('')}
      </div>
    </div>
  `;
}

// Vaciar todas las asignaciones de hermanos en el bimestre activo
async function clearBimestreAssignmentsPrompt() {
  if (!PROGRAM || !Array.isArray(PROGRAM.weeks)) return;
  const bimName = PROGRAM.bimestre || currentBimestre;

  const confirmed = confirm(
    `¿Estás seguro de vaciar TODAS las asignaciones de hermanos en "${bimName}"?\n\n` +
    `• Las semanas, temas y partes del programa se mantendrán intactos.\n` +
    `• Los nombres de los publicadores asignados quedarán en blanco para volver a programar desde cero.`
  );

  if (!confirmed) return;

  PROGRAM.weeks.forEach(w => {
    (w.items || []).forEach(it => {
      if (it.hasOwnProperty('name')) it.name = '';
      if (it.hasOwnProperty('conductor')) it.conductor = '';
      if (it.hasOwnProperty('lector')) it.lector = '';
      if (Array.isArray(it.subs)) {
        it.subs.forEach(s => { s.name = ''; });
      }
    });
  });

  await apiSavePrograma(bimName, PROGRAM, writeToken);
  showToast(`Asignaciones de "${bimName}" vaciadas correctamente`, 'success');
  render();
}

// Renderizado de tarjeta de una semana
function renderWeekCard(bim, w, weekIndex) {
  const isOpen = pdfExportMode || openWeeks.has(w.id);

  // Asegurar renumeración correlativa antes de pintar
  recomputeWeekItemNumbers(w);

  let itemsHtml = '';
  if (isOpen) {
    let lastSection = null;
    let maestrosRendered = false;
    let nvcRendered = false;

    (w.items || []).forEach((it, idx) => {
      const sec = ['TESOROS', 'MAESTROS', 'NVC'].includes(it.section) ? it.section : null;

      // Botón de agregar Seamos Mejores Maestros
      if (maestrosRendered && sec !== 'MAESTROS' && isAdmin && !pdfExportMode) {
        itemsHtml += `
          <div style="padding: 8px 0 12px; margin-top: 2px;">
            <button type="button" class="btn btn-ghost btn-sm" style="width: 100%; border: 1.5px dashed var(--line);" onclick="openAddMaestrosAssignmentModal('${w.id}')">
              + Agregar asignación de Seamos Mejores Maestros
            </button>
          </div>
        `;
        maestrosRendered = false;
      }

      // Botón de agregar Nuestra Vida Cristiana
      if (nvcRendered && sec !== 'NVC' && isAdmin && !pdfExportMode) {
        itemsHtml += `
          <div style="padding: 8px 0 12px; margin-top: 2px;">
            <button type="button" class="btn btn-ghost btn-sm" style="width: 100%; border: 1.5px dashed var(--line);" onclick="openAddNvcAssignmentModal('${w.id}')">
              + Agregar asignación de Nuestra Vida Cristiana
            </button>
          </div>
        `;
        nvcRendered = false;
      }

      // Encabezado de sección
      if (sec && sec !== lastSection) {
        itemsHtml += `<span class="section-label ${sec}">${sectionLabelHtml(sec)}</span>`;
        lastSection = sec;
      } else if (!sec) {
        lastSection = null;
      }

      if (sec === 'MAESTROS') maestrosRendered = true;
      if (sec === 'NVC') nvcRendered = true;

      itemsHtml += renderItemRow(bim, w, it, idx);
    });

    if (maestrosRendered && isAdmin && !pdfExportMode) {
      itemsHtml += `
        <div style="padding: 8px 0 12px; margin-top: 2px;">
          <button type="button" class="btn btn-ghost btn-sm" style="width: 100%; border: 1.5px dashed var(--line);" onclick="openAddMaestrosAssignmentModal('${w.id}')">
            + Agregar asignación de Seamos Mejores Maestros
          </button>
        </div>
      `;
    }

    if (nvcRendered && isAdmin && !pdfExportMode) {
      itemsHtml += `
        <div style="padding: 8px 0 12px; margin-top: 2px;">
          <button type="button" class="btn btn-ghost btn-sm" style="width: 100%; border: 1.5px dashed var(--line);" onclick="openAddNvcAssignmentModal('${w.id}')">
            + Agregar asignación de Nuestra Vida Cristiana
          </button>
        </div>
      `;
    }
  }

  return `
    <div class="week-card ${isOpen ? 'open' : ''}" id="week-${w.id}">
      <div class="week-head" onclick="toggleWeek('${w.id}')">
        <div class="wk-titles">
          <div class="wk-titles-row" style="display:flex; align-items:center; gap:8px;">
            <p class="wk-semana">${escapeHtml(w.semana.toLowerCase())}</p>
            ${isAdmin && !pdfExportMode ? `
              <button class="edit-pencil" title="Editar fechas de la semana" onclick="event.stopPropagation(); editWeekHeaderPrompt('${w.id}', 'semana')">✎</button>
            ` : ''}
          </div>
          <div class="wk-lectura-row" style="display:flex; align-items:center; gap:8px;">
            <p class="wk-lectura">${escapeHtml(w.lectura_semanal || '')}</p>
            ${isAdmin && !pdfExportMode ? `
              <button class="edit-pencil" title="Editar lectura semanal" onclick="event.stopPropagation(); editWeekHeaderPrompt('${w.id}', 'lectura')">✎</button>
            ` : ''}
          </div>
        </div>

        <svg class="chevron" viewBox="0 0 24 24" fill="none">
          <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>

      <div class="week-body" style="${isOpen ? 'display:block; padding-top:14px;' : 'display:none;'}">
        ${itemsHtml}
      </div>
    </div>
  `;
}

// Iconos y etiquetas de sección
function sectionLabelHtml(sec) {
  if (sec === 'TESOROS') {
    return `<span class="section-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M6 3h12l4 6-10 12L2 9z"/><path d="M11 3 8 9l4 12 4-12-3-6"/><path d="M2 9h20"/></svg></span><span>Tesoros de la Biblia</span>`;
  }
  if (sec === 'MAESTROS') {
    return `<span class="section-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"/><path d="M12 6C9 6 7 8 7 10c0 2 2 2 5 0"/><path d="M12 11c-3 0-5 2-5 4 0 2 2 2 5 0"/><path d="M12 8c3 0 5 2 5 4 0 2-2 2-5 0"/><path d="M12 13c3 0 5 2 5 4 0 2-2 2-5 0"/></svg></span><span>Seamos mejores maestros</span>`;
  }
  if (sec === 'NVC') {
    return `<span class="section-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M15.8 8.4c.8-1.7 2.2-2.4 3.5-1.8 1.2.5 1.6 1.7 1.1 2.8-.3.8-.9 1.3-1.7 1.5"/><path d="M6.8 16.8h8.1a4.2 4.2 0 1 0-1.8-8 5.2 5.2 0 0 0-8.9 2.7 3.9 3.9 0 0 0 2.6 5.3Z"/><path d="M9 17v3M14 17v3"/><circle cx="19.1" cy="9.6" r=".55" fill="currentColor" stroke="none"/></svg></span><span>Nuestra vida cristiana</span>`;
  }
  return '';
}

function songIconSvg() {
  return `<span class="song-icon" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 17V5l11-2v12"/><path d="M9 5l11-2"/><circle cx="6" cy="17" r="3"/><circle cx="17" cy="15" r="3"/></svg></span>`;
}

// Formatear texto de la parte asegurando numeración limpia tipo "X. Título", "• Palabras...", etc.
function formatDisplayLabel(item) {
  let label = String(item?.label || '').trim();

  // Introducción o conclusión con viñeta
  if (/palabras de (introducci[oó]n|conclusi[oó]n)/i.test(label)) {
    label = label.replace(/^[•·▪◦\-\s]+/, '').trim();
    return '• ' + label;
  }

  // Canciones
  if (/^canc[ií]ó[nn]/i.test(label) || /canc[ií]ó[nn].*y\s*oraci[oó]n/i.test(label)) {
    return label.replace(/^[•·▪◦\-\s]+/, '').trim();
  }

  // Partes numeradas
  if (item.num && !isPureSongLine(item)) {
    const cleanText = label.replace(/^#?\d+[\.\-\s]*/, '').trim();
    return `${item.num}. ${cleanText}`;
  }

  return label;
}

// Detectar canción independiente sin asignación
function isPureSongLine(it) {
  if (!it) return false;
  const label = String(it.label || '').trim().replace(/^[•·▪◦\-\s]+/, '').trim();
  const looksLikeStandaloneSong = /^canc[ií]ó[nn]\s*(?:n[º°.]?\s*)?\d+$/i.test(label) || /^\d+$/.test(label);
  if (looksLikeStandaloneSong) {
    const hasAssignment = !!String(it.name || '').trim() || !!String(it.conductor || '').trim() || !!String(it.lector || '').trim() || (Array.isArray(it.subs) && it.subs.some(s => String(s?.name || '').trim()));
    return !hasAssignment;
  }
  return it.section === 'MID' && !/oraci[oó]n/i.test(label) && !String(it.name || '').trim() && !Array.isArray(it.subs);
}

function getSongDisplayLabel(it) {
  const label = String(it?.label || '').trim().replace(/^[•·▪◦\-\s🎵🎶]+/, '').trim();
  const match = label.match(/canc[ií]ó[nn]\s*(?:n[º°.]?\s*)?(\d+)/i);
  if (match) return 'Canción ' + match[1];
  const onlyNumber = label.match(/^\d+$/);
  if (onlyNumber) return 'Canción ' + onlyNumber[0];
  return label || 'Canción';
}

// Renderizado de cada fila de asignación
function renderItemRow(bim, w, it, idx) {
  const displayLabel = formatDisplayLabel(it);
  const isFixedIntroConcl = /palabras de (introducci[oó]n|conclusi[oó]n)/i.test(it.label || '');

  // 1. Canción independiente
  if (isPureSongLine(it)) {
    const songLabel = getSongDisplayLabel(it);
    return `
      <div class="item-row">
        <div class="item-label song-label" style="display:flex; align-items:center; gap:8px;">
          <span style="display:inline-flex; align-items:center; gap:8px;">
            ${songIconSvg()}
            <span style="font-weight:600; color:#363535; white-space:nowrap;">${escapeHtml(songLabel)}</span>
          </span>
          ${isAdmin && !pdfExportMode ? `
            <button class="edit-pencil" title="Editar cántico" onclick="editSongPrompt('${w.id}', ${idx}, '${escapeHtml(songLabel)}')">✎</button>
          ` : ''}
        </div>
      </div>
    `;
  }

  // 2. Estudio bíblico de la congregación (Conductor + Lector)
  if (it.hasOwnProperty('conductor')) {
    const conductorName = it.conductor || '';
    const lectorName = it.lector || '';

    return `
      <div>
        <div class="item-row">
          <div class="item-label label-with-pencil">
            <span>${escapeHtml(displayLabel)}</span>
            ${isAdmin && !pdfExportMode ? `
              <button class="edit-pencil" onclick="editItemPrompt('${w.id}', ${idx})" title="Editar texto">✎</button>
              <button class="edit-pencil" style="color:#b42318;" onclick="deleteAssignmentItem('${w.id}', ${idx})" title="Eliminar asignación">×</button>
            ` : ''}
          </div>
          ${isAdmin && !pdfExportMode ? `
            <button type="button" class="assign-btn ${conductorName ? '' : 'empty'}" onclick="openAssignModal('estudio_conductor', '${escapeHtml(conductorName)}', (name) => applyAssignmentSlot('${w.id}', ${idx}, 'conductor', name))">
              ${conductorName ? escapeHtml(conductorName) : 'Sin asignar'}
            </button>
          ` : `
            <span class="assign-static ${conductorName ? '' : 'public-empty'}">${conductorName ? escapeHtml(conductorName) : ''}</span>
          `}
        </div>

        <div class="item-row">
          <div class="item-label">
            <span>${escapeHtml(displayLabel)} <span class="role-tag">— Lector</span></span>
          </div>
          ${isAdmin && !pdfExportMode ? `
            <button type="button" class="assign-btn ${lectorName ? '' : 'empty'}" onclick="openAssignModal('estudio_lector', '${escapeHtml(lectorName)}', (name) => applyAssignmentSlot('${w.id}', ${idx}, 'lector', name))">
              ${lectorName ? escapeHtml(lectorName) : 'Sin asignar'}
            </button>
          ` : `
            <span class="assign-static ${lectorName ? '' : 'public-empty'}">${lectorName ? escapeHtml(lectorName) : ''}</span>
          `}
        </div>
      </div>
    `;
  }

  // 3. Seamos Mejores Maestros con Dos Personas (Nombre + Ayudante)
  if (Array.isArray(it.subs)) {
    const nombre = it.subs.find(s => normName(s?.role) === 'nombre')?.name || it.subs[0]?.name || '';
    const ayudante = it.subs.find(s => normName(s?.role) === 'ayudante')?.name || it.subs[1]?.name || '';
    const reqPriv = computeCat(it);

    return `
      <div class="item-row maestros-pair-row">
        <div class="item-label label-with-pencil" style="min-width:0;">
          <span>${escapeHtml(displayLabel)}</span>
          ${isAdmin && !pdfExportMode ? `
            <button class="edit-pencil" onclick="editItemPrompt('${w.id}', ${idx})" title="Editar texto">✎</button>
            <button class="edit-pencil" title="Editar tipo de asignación (Solo Nombre / Nombre + Ayudante)" onclick="openEditMaestrosStructureModal('${w.id}', ${idx})">⚙</button>
            <button class="edit-pencil" style="color:#b42318;" onclick="deleteAssignmentItem('${w.id}', ${idx})" title="Eliminar asignación">×</button>
          ` : ''}
        </div>

        <div class="maestros-slots-wrap">
          <div class="maestros-person-column">
            <span class="maestros-slot-title">Nombre</span>
            ${isAdmin && !pdfExportMode ? `
              <button type="button" class="assign-btn ${nombre ? '' : 'empty'}" onclick="openAssignModal('${reqPriv}', '${escapeHtml(nombre)}', (name) => applyAssignmentSlot('${w.id}', ${idx}, 'sub0', name))">
                ${nombre ? escapeHtml(nombre) : 'Sin asignar'}
              </button>
            ` : `
              <span class="assign-static ${nombre ? '' : 'public-empty'}">${nombre ? escapeHtml(nombre) : 'Por asignar'}</span>
            `}
          </div>

          <div class="maestros-person-column">
            <span class="maestros-slot-title">Ayudante</span>
            ${isAdmin && !pdfExportMode ? `
              <button type="button" class="assign-btn ${ayudante ? '' : 'empty'}" onclick="openAssignModal('${reqPriv}', '${escapeHtml(ayudante)}', (name) => applyAssignmentSlot('${w.id}', ${idx}, 'sub1', name))">
                ${ayudante ? escapeHtml(ayudante) : 'Sin asignar'}
              </button>
            ` : `
              <span class="assign-static ${ayudante ? '' : 'public-empty'}">${ayudante ? escapeHtml(ayudante) : 'Por asignar'}</span>
            `}
          </div>
        </div>
      </div>
    `;
  }

  // 4. Asignación individual (Seamos Mejores Maestros Individual, NVC, Tesoros, Oraciones, etc.)
  const reqCat = computeCat(it);
  const currentName = it.name || '';
  const isSongWithPrayer = /canc[ií]ó[nn].*y\s*oraci[oó]n/i.test(it.label || '');

  return `
    <div class="item-row">
      <div class="item-label label-with-pencil">
        <span style="display:inline-flex; align-items:center; gap:8px;">
          ${isSongWithPrayer ? songIconSvg() : ''}
          <span style="${isSongWithPrayer ? 'color:#363535 !important; font-weight:600 !important;' : ''}">
            ${escapeHtml(displayLabel)}
          </span>
        </span>
        ${isAdmin && !pdfExportMode ? `
          ${!isFixedIntroConcl ? `<button class="edit-pencil" onclick="editItemPrompt('${w.id}', ${idx})" title="Editar texto">✎</button>` : ''}
          ${it.section === 'MAESTROS' ? `
            <button class="edit-pencil" title="Editar tipo de asignación (Solo Nombre / Nombre + Ayudante)" onclick="openEditMaestrosStructureModal('${w.id}', ${idx})">⚙</button>
            <button class="edit-pencil" style="color:#b42318;" onclick="deleteAssignmentItem('${w.id}', ${idx})" title="Eliminar asignación">×</button>
          ` : ''}
          ${it.section === 'NVC' && !isFixedIntroConcl ? `
            <button class="edit-pencil" title="Cambiar quién puede dar esta parte" onclick="openChangeNvcCategoryModal('${w.id}', ${idx})">⚙</button>
            <button class="edit-pencil" style="color:#b42318;" onclick="deleteAssignmentItem('${w.id}', ${idx})" title="Eliminar asignación">×</button>
          ` : ''}
          ${it.section === 'TESOROS' ? `
            <button class="edit-pencil" style="color:#b42318;" onclick="deleteAssignmentItem('${w.id}', ${idx})" title="Eliminar asignación">×</button>
          ` : ''}
        ` : ''}
      </div>

      ${isAdmin && !pdfExportMode ? `
        <button type="button" class="assign-btn ${currentName ? '' : 'empty'}" onclick="openAssignModal('${reqCat}', '${escapeHtml(currentName)}', (name) => applyAssignmentSlot('${w.id}', ${idx}, 'name', name))">
          ${currentName ? escapeHtml(currentName) : 'Sin asignar'}
        </button>
      ` : `
        <span class="assign-static ${currentName ? '' : 'public-empty'}">${currentName ? escapeHtml(currentName) : ''}</span>
      `}
    </div>
  `;
}

// Modal de Asignación con Detección en Tiempo Real de Conflictos
function openAssignModal(cat, currentName, onPick) {
  const options = getEligiblePeople(PEOPLE || [], cat);

  const existing = document.getElementById('wm-assign-modal');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'wm-assign-modal';
  overlay.className = 'overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-head">
        <h3>Elegir publicador</h3>
        <p>${escapeHtml(CAT_LABELS[cat] || 'Asignación')} · ${options.length} elegible${options.length === 1 ? '' : 's'}</p>
      </div>
      <div class="modal-search">
        <input type="text" id="assign-search-input" class="search-input" placeholder="Buscar nombre…" oninput="filterAssignModalList(this.value)" />
      </div>
      <div class="modal-list" id="assign-modal-list">
        ${options.length === 0 ? '<div class="empty-note">No hay publicadores elegibles para esta asignación.</div>' : ''}
        ${options.map(p => {
          return `
            <div class="modal-opt ${p.nombre === currentName ? 'selected' : ''}" data-name="${escapeHtml(p.nombre)}" onclick="selectAssignee('${escapeHtml(p.nombre)}')">
              <span><strong style="color:#363535;">${escapeHtml(p.nombre)}</strong></span>
              <span class="stat">${p.genero === 'F' ? 'Hna' : 'Hno'}</span>
            </div>
          `;
        }).join('')}
      </div>
      <div class="modal-foot">
        <button class="btn btn-ghost btn-sm" onclick="selectAssignee('')">Quitar asignación</button>
        <button class="btn btn-ghost btn-sm" onclick="closeAssignModal()">Cerrar</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  window.__assignModalOnPick = onPick;

  const input = document.getElementById('assign-search-input');
  if (input) input.focus();
}

function selectAssignee(name) {
  if (typeof window.__assignModalOnPick === 'function') {
    window.__assignModalOnPick(name);
  }
  closeAssignModal();
}

function closeAssignModal() {
  const modal = document.getElementById('wm-assign-modal');
  if (modal) modal.remove();
}

function filterAssignModalList(query) {
  const q = normName(query);
  const rows = document.querySelectorAll('#assign-modal-list .modal-opt');
  rows.forEach(r => {
    const name = normName(r.getAttribute('data-name') || '');
    r.style.display = name.includes(q) ? 'flex' : 'none';
  });
}

// Aplicar asignación por slot
async function applyAssignmentSlot(weekId, itemIdx, slot, newName) {
  const week = (PROGRAM?.weeks || []).find(w => w.id === weekId);
  if (!week || !week.items || !week.items[itemIdx]) return;

  const item = week.items[itemIdx];
  const value = String(newName || '').trim();

  if (slot === 'name') {
    item.name = value;

    // Regla de Presidencia: Quien da Palabras de introducción da también Palabras de conclusión
    const isIntro = /palabras de introducci[oó]n/i.test(item.label || '');
    const isConcl = /palabras de conclusi[oó]n/i.test(item.label || '');

    if (isIntro || isConcl) {
      week.items.forEach(otherItem => {
        if (isIntro && /palabras de conclusi[oó]n/i.test(otherItem.label || '')) {
          otherItem.name = value;
        } else if (isConcl && /palabras de introducci[oó]n/i.test(otherItem.label || '')) {
          otherItem.name = value;
        }
      });
    }
  }
  else if (slot === 'conductor') item.conductor = value;
  else if (slot === 'lector') item.lector = value;
  else if (slot === 'sub0') {
    if (!Array.isArray(item.subs)) item.subs = [{ role: 'Nombre', name: '' }, { role: 'Ayudante', name: '' }];
    item.subs[0].name = value;
  } else if (slot === 'sub1') {
    if (!Array.isArray(item.subs)) item.subs = [{ role: 'Nombre', name: '' }, { role: 'Ayudante', name: '' }];
    item.subs[1].name = value;
  }

  await apiSavePrograma(PROGRAM.bimestre, PROGRAM, writeToken);
  showToast(value ? `Asignado a ${value}` : 'Asignación quitada', 'success');
  render();
}

// Editar encabezado de semana (Semana o Lectura)
function editWeekHeaderPrompt(weekId, field) {
  const week = (PROGRAM?.weeks || []).find(w => w.id === weekId);
  if (!week) return;

  if (field === 'semana') {
    const next = prompt('Editar fechas de la semana:\n(Ej: Semana 2-8 De Marzo 2026)', week.semana || '');
    if (next && next.trim() && next.trim() !== week.semana) {
      week.semana = next.trim();
      apiSavePrograma(PROGRAM.bimestre, PROGRAM, writeToken);
      render();
    }
  } else if (field === 'lectura') {
    const next = prompt('Editar lectura semanal de la Biblia:\n(Ej: Lectura semanal de la Biblia ISAÍAS 41, 42)', week.lectura_semanal || '');
    if (next && next.trim() && next.trim() !== week.lectura_semanal) {
      week.lectura_semanal = next.trim();
      apiSavePrograma(PROGRAM.bimestre, PROGRAM, writeToken);
      render();
    }
  }
}

// ============================================================
// MODAL: EDITAR TIPO DE ASIGNACIÓN (SEAMOS MEJORES MAESTROS)
// ============================================================
function openEditMaestrosStructureModal(weekId, itemIdx) {
  const week = (PROGRAM?.weeks || []).find(w => w.id === weekId);
  if (!week || !week.items?.[itemIdx]) return;
  const item = week.items[itemIdx];
  const isPair = Array.isArray(item.subs);

  const existing = document.getElementById('wm-maestros-type-modal');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'wm-maestros-type-modal';
  overlay.className = 'overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-head">
        <h3>Editar tipo de asignación</h3>
        <p>${escapeHtml(item.label || '')}</p>
      </div>
      <div class="field" style="margin-top: 12px;">
        <label style="font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #64748b;">PERSONAS QUE NECESITA</label>
        <select class="search-input" id="edit-maestros-structure-select" style="margin-top: 6px;">
          <option value="single" ${!isPair ? 'selected' : ''}>Solo Nombre</option>
          <option value="pair" ${isPair ? 'selected' : ''}>Nombre + Ayudante</option>
        </select>
      </div>
      <div class="modal-foot" style="margin-top: 20px;">
        <button class="btn btn-ghost btn-sm" onclick="document.getElementById('wm-maestros-type-modal').remove()">Cancelar</button>
        <button class="btn btn-primary btn-sm" id="btn-save-maestros-type">Guardar</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelector('#btn-save-maestros-type').addEventListener('click', async () => {
    const val = overlay.querySelector('#edit-maestros-structure-select').value;
    if (val === 'pair') {
      const oldSubs = Array.isArray(item.subs) ? item.subs : [];
      const nombre = oldSubs.find(s => normName(s.role) === 'nombre')?.name || item.name || '';
      const ayudante = oldSubs.find(s => normName(s.role) === 'ayudante')?.name || '';
      delete item.name;
      item.subs = [
        { role: 'Nombre', name: nombre },
        { role: 'Ayudante', name: ayudante }
      ];
    } else {
      const oldSubs = Array.isArray(item.subs) ? item.subs : [];
      const nombre = oldSubs.find(s => normName(s.role) === 'nombre')?.name || item.name || '';
      delete item.subs;
      item.name = nombre;
    }

    recomputeWeekItemNumbers(week);
    await apiSavePrograma(PROGRAM.bimestre, PROGRAM, writeToken);
    overlay.remove();
    showToast('Tipo de asignación actualizado', 'success');
    render();
  });
}

// ============================================================
// MODAL: AGREGAR ASIGNACIÓN DE SEAMOS MEJORES MAESTROS
// ============================================================
function openAddMaestrosAssignmentModal(weekId) {
  const week = (PROGRAM?.weeks || []).find(w => w.id === weekId);
  if (!week) return;

  const existing = document.getElementById('wm-add-maestros-modal');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'wm-add-maestros-modal';
  overlay.className = 'overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-head">
        <h3>Agregar asignación</h3>
        <p>Seamos Mejores Maestros · ${escapeHtml(week.semana || '')}</p>
      </div>
      <div class="field" style="margin-top: 12px;">
        <label style="font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #64748b;">PERSONAS QUE NECESITA</label>
        <select class="search-input" id="add-maestros-type-select" style="margin-top: 6px;">
          <option value="pair">Nombre + Ayudante</option>
          <option value="single">Solo Nombre</option>
        </select>
      </div>
      <div class="field" style="margin-top: 14px;">
        <label style="font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #64748b;">TEXTO DE LA ASIGNACIÓN</label>
        <input class="search-input" id="add-maestros-label-input" placeholder="Ej: Empiece conversaciones (3 mins.) (lmd lección 4 punto 3.)" style="margin-top: 6px;" />
      </div>
      <div class="modal-foot" style="margin-top: 20px;">
        <button class="btn btn-ghost btn-sm" onclick="document.getElementById('wm-add-maestros-modal').remove()">Cancelar</button>
        <button class="btn btn-primary btn-sm" id="btn-save-add-maestros">Agregar</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const input = overlay.querySelector('#add-maestros-label-input');
  input.focus();

  overlay.querySelector('#btn-save-add-maestros').addEventListener('click', async () => {
    const label = input.value.trim();
    if (!label) {
      input.focus();
      return;
    }

    const type = overlay.querySelector('#add-maestros-type-select').value;
    const newItem = {
      section: 'MAESTROS',
      label
    };

    if (type === 'pair') {
      newItem.subs = [
        { role: 'Nombre', name: '' },
        { role: 'Ayudante', name: '' }
      ];
    } else {
      newItem.name = '';
    }

    let insertIdx = (week.items || []).findLastIndex(it => it.section === 'MAESTROS');
    if (insertIdx === -1) insertIdx = (week.items || []).length;
    else insertIdx += 1;

    week.items.splice(insertIdx, 0, newItem);
    recomputeWeekItemNumbers(week);
    await apiSavePrograma(PROGRAM.bimestre, PROGRAM, writeToken);
    overlay.remove();
    showToast('Asignación agregada a Seamos Mejores Maestros', 'success');
    render();
  });
}

// ============================================================
// MODAL: AGREGAR ASIGNACIÓN DE NUESTRA VIDA CRISTIANA
// ============================================================
function openAddNvcAssignmentModal(weekId) {
  const week = (PROGRAM?.weeks || []).find(w => w.id === weekId);
  if (!week) return;

  const existing = document.getElementById('wm-add-nvc-modal');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'wm-add-nvc-modal';
  overlay.className = 'overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-head">
        <h3>Agregar asignación</h3>
        <p>Nuestra Vida Cristiana · ${escapeHtml(week.semana || '')}</p>
      </div>
      <div class="field" style="margin-top: 12px;">
        <label style="font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #64748b;">TIPO DE ASIGNACIÓN</label>
        <select class="search-input" id="new-nvc-type-select" style="margin-top: 6px;">
          <option value="single">Asignación individual (un discurso, una parte)</option>
          <option value="estudio">Estudio bíblico de la congregación (Conductor + Lector)</option>
        </select>
      </div>
      <div class="field" style="margin-top: 14px;">
        <label style="font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #64748b;">TEXTO DE LA ASIGNACIÓN</label>
        <input class="search-input" id="new-nvc-label-input" placeholder="Ej.: Discurso del circuito (30 mins.)" style="margin-top: 6px;" />
      </div>
      <div class="field" id="new-nvc-restrict-wrap" style="margin-top: 14px;">
        <label style="font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #64748b;">¿QUIÉN PUEDE DAR ESTA PARTE?</label>
        <select class="search-input" id="new-nvc-restrict-select" style="margin-top: 6px;">
          <option value="no">Igual que las demás partes de Nuestra Vida Cristiana</option>
          <option value="si">Restringido — solo quienes dan Introducción/Conclusión</option>
        </select>
      </div>
      <div class="modal-foot" style="margin-top: 20px;">
        <button class="btn btn-ghost btn-sm" onclick="document.getElementById('wm-add-nvc-modal').remove()">Cancelar</button>
        <button class="btn btn-primary btn-sm" id="btn-save-add-nvc">Agregar</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const typeSelect = overlay.querySelector('#new-nvc-type-select');
  const labelInput = overlay.querySelector('#new-nvc-label-input');
  const restrictWrap = overlay.querySelector('#new-nvc-restrict-wrap');

  typeSelect.addEventListener('change', () => {
    const isEstudio = typeSelect.value === 'estudio';
    restrictWrap.style.display = isEstudio ? 'none' : 'block';
    if (isEstudio && !labelInput.value.trim()) {
      labelInput.value = 'Estudio bíblico de la congregación (30 mins.)';
    }
  });

  labelInput.focus();

  overlay.querySelector('#btn-save-add-nvc').addEventListener('click', async () => {
    const label = labelInput.value.trim();
    if (!label) {
      labelInput.focus();
      return;
    }

    const isEstudio = typeSelect.value === 'estudio';
    let newItem;
    if (isEstudio) {
      newItem = {
        section: 'NVC',
        label,
        conductor: '',
        lector: ''
      };
    } else {
      const isRestricted = overlay.querySelector('#new-nvc-restrict-select').value === 'si';
      newItem = {
        section: 'NVC',
        label,
        name: ''
      };
      if (isRestricted) newItem.forceCat = 'intro_conclusion';
    }

    let insertIdx = (week.items || []).findIndex(it => it.section === 'CONCLUSION' || it.label?.includes('conclusión') || it.section === 'CLOSE');
    if (insertIdx === -1) insertIdx = (week.items || []).length;

    week.items.splice(insertIdx, 0, newItem);
    recomputeWeekItemNumbers(week);
    await apiSavePrograma(PROGRAM.bimestre, PROGRAM, writeToken);
    overlay.remove();
    showToast('Asignación agregada a Nuestra Vida Cristiana', 'success');
    render();
  });
}

// ============================================================
// MODAL: CAMBIAR QUIÉN PUEDE DAR ESTA PARTE (NVC)
// ============================================================
function openChangeNvcCategoryModal(weekId, itemIdx) {
  const week = (PROGRAM?.weeks || []).find(w => w.id === weekId);
  if (!week || !week.items?.[itemIdx]) return;
  const item = week.items[itemIdx];
  const isRestricted = item.forceCat === 'intro_conclusion';

  const existing = document.getElementById('wm-change-nvc-modal');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'wm-change-nvc-modal';
  overlay.className = 'overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-head">
        <h3>¿Quién puede dar esta parte?</h3>
        <p>${escapeHtml(item.label || '')}</p>
      </div>
      <div class="field" style="margin-top: 14px;">
        <select class="search-input" id="edit-nvc-restrict-select">
          <option value="no" ${!isRestricted ? 'selected' : ''}>Igual que las demás partes de Nuestra Vida Cristiana</option>
          <option value="si" ${isRestricted ? 'selected' : ''}>Restringido — solo quienes dan Introducción/Conclusión</option>
        </select>
      </div>
      <div class="modal-foot" style="margin-top: 20px;">
        <button class="btn btn-ghost btn-sm" onclick="document.getElementById('wm-change-nvc-modal').remove()">Cancelar</button>
        <button class="btn btn-primary btn-sm" id="btn-save-change-nvc">Guardar</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelector('#btn-save-change-nvc').addEventListener('click', async () => {
    const isRestr = overlay.querySelector('#edit-nvc-restrict-select').value === 'si';
    if (isRestr) item.forceCat = 'intro_conclusion';
    else delete item.forceCat;

    await apiSavePrograma(PROGRAM.bimestre, PROGRAM, writeToken);
    overlay.remove();
    showToast('Restricción actualizada', 'success');
    render();
  });
}

// ============================================================
// MODAL: AGREGAR NUEVO BIMESTRE (+ Agregar bimestre)
// ============================================================
function openAddBimestreModal() {
  const bimOptions = [
    'Marzo - Abril',
    'Mayo - Junio',
    'Julio - Agosto',
    'Septiembre - Octubre',
    'Noviembre - Diciembre',
    'Enero - Febrero'
  ];

  const existing = document.getElementById('wm-add-bim-modal');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'wm-add-bim-modal';
  overlay.className = 'overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-head">
        <h3>Agregar bimestre</h3>
        <p>Se copiará la estructura del bimestre elegido con asignaciones vacías para completarlo desde la app.</p>
      </div>
      <div class="field" style="margin-top: 12px;">
        <label style="font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #64748b;">NOMBRE DEL NUEVO BIMESTRE</label>
        <input class="search-input" id="new-bim-name-input" placeholder="Ej: Noviembre - Diciembre" style="margin-top: 6px;" />
      </div>
      <div class="field" style="margin-top: 14px;">
        <label style="font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #64748b;">USAR COMO PLANTILLA</label>
        <select class="search-input" id="new-bim-template-select" style="margin-top: 6px;">
          ${bimOptions.map(b => `<option value="${escapeHtml(b)}">${escapeHtml(b)}</option>`).join('')}
        </select>
      </div>
      <div class="modal-foot" style="margin-top: 20px;">
        <button class="btn btn-ghost btn-sm" onclick="document.getElementById('wm-add-bim-modal').remove()">Cancelar</button>
        <button class="btn btn-primary btn-sm" id="btn-save-add-bim">Crear bimestre</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const nameInput = overlay.querySelector('#new-bim-name-input');
  nameInput.focus();

  overlay.querySelector('#btn-save-add-bim').addEventListener('click', async () => {
    const name = nameInput.value.trim();
    if (!name) {
      nameInput.focus();
      return;
    }

    const templateName = overlay.querySelector('#new-bim-template-select').value;
    let template = PROGRAM;
    if (typeof DEFAULT_PROGRAM !== 'undefined') {
      const found = DEFAULT_PROGRAM.find(b => b.bimestre === templateName);
      if (found) template = found;
    }

    const newBim = JSON.parse(JSON.stringify(template || { weeks: [] }));
    newBim.bimestre = name;

    newBim.weeks = (newBim.weeks || []).map((w, wi) => {
      const nw = JSON.parse(JSON.stringify(w));
      nw.id = `${name}__${wi}`;
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

    PROGRAM = newBim;
    currentBimestre = name;
    openWeeks.clear();

    // Agregar a la lista local de bimestres para que aparezca en el selector
    if (!BIMESTRES_LIST.includes(name)) {
      BIMESTRES_LIST = [...BIMESTRES_LIST, name];
    }

    await apiSavePrograma(name, newBim, writeToken);
    overlay.remove();
    showToast(`Bimestre "${name}" creado exitosamente`, 'success');
    render();
  });
}

function editItemPrompt(weekId, itemIdx) {
  const week = (PROGRAM?.weeks || []).find(w => w.id === weekId);
  if (!week || !week.items?.[itemIdx]) return;
  const current = week.items[itemIdx].label || '';
  const next = prompt('Editar texto de la parte:', current);
  if (next && next.trim() && next.trim() !== current) {
    week.items[itemIdx].label = next.trim();
    recomputeWeekItemNumbers(week);
    apiSavePrograma(PROGRAM.bimestre, PROGRAM, writeToken);
    render();
  }
}

function editSongPrompt(weekId, itemIdx, currentLabel) {
  const week = (PROGRAM?.weeks || []).find(w => w.id === weekId);
  if (!week || !week.items?.[itemIdx]) return;
  const next = prompt('Editar número de cántico o texto:', currentLabel);
  if (next && next.trim()) {
    week.items[itemIdx].label = '• ' + next.trim();
    apiSavePrograma(PROGRAM.bimestre, PROGRAM, writeToken);
    render();
  }
}

function deleteAssignmentItem(weekId, itemIdx) {
  const week = (PROGRAM?.weeks || []).find(w => w.id === weekId);
  if (!week || !week.items?.[itemIdx]) return;
  if (confirm(`¿Eliminar esta asignación?\n\n"${week.items[itemIdx].label}"`)) {
    week.items.splice(itemIdx, 1);
    recomputeWeekItemNumbers(week);
    apiSavePrograma(PROGRAM.bimestre, PROGRAM, writeToken);
    showToast('Asignación eliminada', 'info');
    render();
  }
}

async function switchBimestre(bimestreName) {
  currentBimestre = bimestreName;
  showToast(`Cargando ${bimestreName}...`, 'info', 1000);
  let prog = await apiLoadPrograma(bimestreName);
  if (!prog) {
    // Si no existía todavía, generar estructura limpia basada en plantilla
    const template = (PROGRAM && Array.isArray(PROGRAM.weeks) && PROGRAM.weeks.length > 0) ? PROGRAM : (typeof DEFAULT_PROGRAM !== 'undefined' ? DEFAULT_PROGRAM[0] : { weeks: [] });
    const clean = JSON.parse(JSON.stringify(template || { weeks: [] }));
    clean.id = sanitizeBimestreId(bimestreName);
    clean.bimestre = bimestreName;
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
    prog = clean;
    await apiSavePrograma(bimestreName, prog, writeToken);
  }

  PROGRAM = prog;
  openWeeks.clear();
  render();
}

function expandAllWeeks() {
  (PROGRAM?.weeks || []).forEach(w => openWeeks.add(w.id));
  render();
}

function collapseAllWeeks() {
  openWeeks.clear();
  render();
}

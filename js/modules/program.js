// ============================================================
// VIDA Y MINISTERIO — VILLA CONCHA
// js/modules/program.js
// Renderizado del Programa Semanal, Numeración y Bimestres Dinámicos
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
  const m = d.getMonth() + 1; // 1 a 12
  const day = d.getDate();

  const isFirstMonthOfBimestre = (m % 2 === 1); // Ene (1), Mar (3), May (5), Jul (7), Sep (9), Nov (11)
  const isSecondMonthOfBimestre = (m % 2 === 0); // Feb (2), Abr (4), Jun (6), Ago (8), Oct (10), Dic (12)

  const currentPairStart = isFirstMonthOfBimestre ? m : m - 1;
  const currentBimestre = BIMESTRE_MONTH_LABELS[currentPairStart];

  const nextPairStart = currentPairStart === 11 ? 1 : currentPairStart + 2;
  const nextBimestre = BIMESTRE_MONTH_LABELS[nextPairStart];

  const prevPairStart = currentPairStart === 1 ? 11 : currentPairStart - 2;
  const prevBimestre = BIMESTRE_MONTH_LABELS[prevPairStart];

  const result = [];

  // 1. Durante los primeros 7 días del primer mes (ej: 1 al 7 de Septiembre, 1 al 7 de Noviembre):
  // Mantiene visible la semana de transición del bimestre anterior hasta que finalice el domingo.
  if (isFirstMonthOfBimestre && day <= 7) {
    result.push(prevBimestre);
  }

  // 2. Bimestre vigente (ej: Septiembre - Octubre)
  result.push(currentBimestre);

  // 3. A partir del primer día del segundo mes del bimestre (ej: 1 de Octubre, 1 de Diciembre, 1 de Febrero...):
  // Se presenta el bimestre siguiente (ej: Noviembre - Diciembre, Enero - Febrero, etc.)
  if (isSecondMonthOfBimestre) {
    result.push(nextBimestre);
  }

  return Array.from(new Set(result.filter(Boolean)));
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
  const allBimestres = [
    'Marzo - Abril',
    'Mayo - Junio',
    'Julio - Agosto',
    'Septiembre - Octubre'
  ];

  // 1. Vista de Solo Lectura (Público / No Administrador)
  if (!isAdmin) {
    const viewerLabels = computeViewerBimestres();

    return `
      <div class="section-pad">
        <div class="view-only-note">
          👁️ Estás viendo el programa en modo solo lectura. Desde el primer día de cada mes se muestran el bimestre vigente y el siguiente.
        </div>

        ${viewerLabels.map(label => {
          // Buscar el programa cargado para este bimestre
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

  // 2. Vista de Administrador (Con herramientas de edición)
  if (!PROGRAM || !Array.isArray(PROGRAM.weeks)) {
    return '<div class="section-pad"><div class="loading">Cargando datos del programa…</div></div>';
  }

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

        <div class="actions">
          <button class="btn btn-ghost btn-sm" onclick="exportProgramPdf()">⬇ Descargar PDF</button>
          <button class="btn btn-ghost btn-sm" onclick="openAddBimestreModal()">+ Agregar bimestre</button>
        </div>
      </div>

      <!-- Semanas del Bimestre Seleccionado -->
      <div class="weeks-container">
        ${PROGRAM.weeks.map((week, idx) => renderWeekCard(PROGRAM, week, idx)).join('')}
      </div>
    </div>
  `;
}

// Renderizado de tarjeta de una semana
function renderWeekCard(bim, w, weekIndex) {
  const isOpen = pdfExportMode || openWeeks.has(w.id);

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
          <div class="wk-titles-row">
            <p class="wk-semana">${escapeHtml(w.semana.toLowerCase())}</p>
          </div>
          <div class="wk-lectura-row">
            <p class="wk-lectura">${escapeHtml(w.lectura_semanal || '')}</p>
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

// Formatear texto de la parte asegurando numeración limpia tipo "1. Título", "• Palabras...", etc.
function formatDisplayLabel(item) {
  let label = String(item?.label || '').trim();

  // Si es introducción o conclusión, asegurar que lleve la viñeta "• "
  if (/palabras de (introducci[oó]n|conclusi[oó]n)/i.test(label)) {
    label = label.replace(/^[•·▪◦\-\s]+/, '').trim();
    return '• ' + label;
  }

  // Si es una canción
  if (/^canc[ií]ó[nn]/i.test(label) || /canc[ií]ó[nn].*y\s*oraci[oó]n/i.test(label)) {
    return label.replace(/^[•·▪◦\-\s]+/, '').trim();
  }

  // Si tiene número de parte asignado, formatear como "X. Texto"
  if (item.num && !isPureSongLine(item)) {
    // Remover numeración previa en el texto (ej: "1. ", "1 ", "#1 ")
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

  // 1. Canción independiente (sin asignación de persona)
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
              <button class="edit-pencil" onclick="editItemPrompt('${w.id}', ${idx})">✎</button>
              <button class="edit-pencil" style="color:#b42318;" onclick="deleteAssignmentItem('${w.id}', ${idx})" title="Eliminar parte">×</button>
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

  // 3. Seamos Mejores Maestros con Dos Personas (Nombre + Ayudante en 3 columnas)
  if (Array.isArray(it.subs)) {
    const nombre = it.subs.find(s => normName(s?.role) === 'nombre')?.name || it.subs[0]?.name || '';
    const ayudante = it.subs.find(s => normName(s?.role) === 'ayudante')?.name || it.subs[1]?.name || '';
    const reqPriv = computeCat(it);

    return `
      <div class="item-row maestros-pair-row" style="display:grid; grid-template-columns:minmax(300px,1fr) minmax(145px,190px) minmax(145px,190px); gap:14px; align-items:end;">
        <div class="item-label label-with-pencil" style="min-width:0;">
          <span>${escapeHtml(displayLabel)}</span>
          ${isAdmin && !pdfExportMode ? `
            <button class="edit-pencil" onclick="editItemPrompt('${w.id}', ${idx})">✎</button>
            <button class="edit-pencil" style="color:#b42318;" onclick="deleteAssignmentItem('${w.id}', ${idx})" title="Eliminar parte">×</button>
          ` : ''}
        </div>

        <div class="maestros-person-column" style="display:flex; flex-direction:column; gap:4px; min-width:0;">
          <span style="font-size:12px; font-weight:700; color:#363535;">Nombre</span>
          ${isAdmin && !pdfExportMode ? `
            <button type="button" class="assign-btn ${nombre ? '' : 'empty'}" onclick="openAssignModal('${reqPriv}', '${escapeHtml(nombre)}', (name) => applyAssignmentSlot('${w.id}', ${idx}, 'sub0', name))">
              ${nombre ? escapeHtml(nombre) : 'Sin asignar'}
            </button>
          ` : `
            <span class="assign-static ${nombre ? '' : 'public-empty'}">${nombre ? escapeHtml(nombre) : ''}</span>
          `}
        </div>

        <div class="maestros-person-column" style="display:flex; flex-direction:column; gap:4px; min-width:0;">
          <span style="font-size:12px; font-weight:700; color:#363535;">Ayudante</span>
          ${isAdmin && !pdfExportMode ? `
            <button type="button" class="assign-btn ${ayudante ? '' : 'empty'}" onclick="openAssignModal('libre', '${escapeHtml(ayudante)}', (name) => applyAssignmentSlot('${w.id}', ${idx}, 'sub1', name))">
              ${ayudante ? escapeHtml(ayudante) : 'Sin asignar'}
            </button>
          ` : `
            <span class="assign-static ${ayudante ? '' : 'public-empty'}">${ayudante ? escapeHtml(ayudante) : ''}</span>
          `}
        </div>
      </div>
    `;
  }

  // 4. Asignación individual estándar (Oraciones, Palabras de conclusión, Tesoros, etc.)
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
        ${isAdmin && !pdfExportMode && reqCat !== 'intro_conclusion' ? `
          <button class="edit-pencil" onclick="editItemPrompt('${w.id}', ${idx})">✎</button>
          ${it.section === 'NVC' ? `
            <button class="edit-pencil" title="Cambiar restricción" onclick="changeNvcCategoryModal('${w.id}', ${idx})">⚙</button>
            <button class="edit-pencil" style="color:#b42318;" onclick="deleteAssignmentItem('${w.id}', ${idx})" title="Eliminar parte">×</button>
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

  if (slot === 'name') item.name = value;
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

// Modales para agregar asignaciones dinámicas
function openAddMaestrosAssignmentModal(weekId) {
  const week = (PROGRAM?.weeks || []).find(w => w.id === weekId);
  if (!week) return;

  const text = prompt('Texto de la nueva asignación de Seamos Mejores Maestros:\n(Ej: Empiece conversaciones (3 mins.) (lmd lección 4 punto 3.))');
  if (!text || !text.trim()) return;

  const withAyudante = confirm('¿Esta parte requiere Ayudante? (Aceptar = Sí, Cancelar = Individual/Discurso)');

  // Calcular número correlativo para la nueva parte
  const currentNums = (week.items || []).filter(it => it.num && Number.isFinite(Number(it.num))).map(it => Number(it.num));
  const nextNum = currentNums.length ? Math.max(...currentNums) + 1 : 4;

  const newItem = {
    section: 'MAESTROS',
    num: nextNum,
    label: text.trim()
  };

  if (withAyudante) {
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
  apiSavePrograma(PROGRAM.bimestre, PROGRAM, writeToken);
  showToast('Asignación agregada a Seamos Mejores Maestros', 'success');
  render();
}

function openAddNvcAssignmentModal(weekId) {
  const week = (PROGRAM?.weeks || []).find(w => w.id === weekId);
  if (!week) return;

  const isEstudio = confirm('¿Deseas agregar el Estudio Bíblico de la congregación (Conductor + Lector)?\n(Aceptar = Estudio Bíblico, Cancelar = Asignación individual)');

  const currentNums = (week.items || []).filter(it => it.num && Number.isFinite(Number(it.num))).map(it => Number(it.num));
  const nextNum = currentNums.length ? Math.max(...currentNums) + 1 : 8;

  let newItem;
  if (isEstudio) {
    newItem = {
      section: 'NVC',
      num: nextNum,
      label: 'Estudio bíblico de la congregación (30 mins.)',
      conductor: '',
      lector: ''
    };
  } else {
    const text = prompt('Texto de la asignación de Nuestra Vida Cristiana:');
    if (!text || !text.trim()) return;
    newItem = {
      section: 'NVC',
      num: nextNum,
      label: text.trim(),
      name: ''
    };
  }

  let insertIdx = (week.items || []).findIndex(it => it.section === 'CONCLUSION' || it.label?.includes('conclusión') || it.section === 'CLOSE');
  if (insertIdx === -1) insertIdx = (week.items || []).length;

  week.items.splice(insertIdx, 0, newItem);
  apiSavePrograma(PROGRAM.bimestre, PROGRAM, writeToken);
  showToast('Asignación agregada a Nuestra Vida Cristiana', 'success');
  render();
}

function editItemPrompt(weekId, itemIdx) {
  const week = (PROGRAM?.weeks || []).find(w => w.id === weekId);
  if (!week || !week.items?.[itemIdx]) return;
  const current = week.items[itemIdx].label || '';
  const next = prompt('Editar texto de la parte:', current);
  if (next && next.trim() && next.trim() !== current) {
    week.items[itemIdx].label = next.trim();
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
  if (confirm(`¿Eliminar esta parte?\n"${week.items[itemIdx].label}"`)) {
    week.items.splice(itemIdx, 1);
    apiSavePrograma(PROGRAM.bimestre, PROGRAM, writeToken);
    showToast('Parte eliminada', 'info');
    render();
  }
}

function changeNvcCategoryModal(weekId, itemIdx) {
  const week = (PROGRAM?.weeks || []).find(w => w.id === weekId);
  if (!week || !week.items?.[itemIdx]) return;
  const item = week.items[itemIdx];
  const isRestricted = item.forceCat === 'intro_conclusion';
  const choice = confirm(`¿Quién puede dar esta parte?\n\nActualmente: ${isRestricted ? 'Restringido (solo quienes dan Intro/Conclusión)' : 'Normal (cualquier publicador de NVC)'}\n\n¿Deseas cambiar su categoría?`);
  if (choice) {
    if (isRestricted) delete item.forceCat;
    else item.forceCat = 'intro_conclusion';
    apiSavePrograma(PROGRAM.bimestre, PROGRAM, writeToken);
    showToast('Categoría actualizada', 'success');
    render();
  }
}

async function switchBimestre(bimestreName) {
  currentBimestre = bimestreName;
  const prog = await apiLoadPrograma(bimestreName);
  if (prog) {
    PROGRAM = prog;
    openWeeks.clear();
    render();
  } else {
    showToast(`No hay datos disponibles para ${bimestreName}`, 'warning');
  }
}

function expandAllWeeks() {
  (PROGRAM?.weeks || []).forEach(w => openWeeks.add(w.id));
  render();
}

function collapseAllWeeks() {
  openWeeks.clear();
  render();
}

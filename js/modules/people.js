// ============================================================
// VIDA Y MINISTERIO — VILLA CONCHA
// js/modules/people.js
// Gestión de Publicadores con Estilos Originales y 10 Privilegios
// ============================================================

let selectedPrivilegeFilter = 'todos';

// Renderizado principal de la pestaña Publicadores
function renderPeopleTab() {
  const list = PEOPLE || [];
  const search = normName(peopleSearch);

  const filtered = list.filter(p => {
    // Filtro por texto
    if (search) {
      const matchName = normName(p.nombre).includes(search);
      const matchNota = normName(p.nota || '').includes(search);
      if (!matchName && !matchNota) return false;
    }

    // Filtro por privilegio
    if (selectedPrivilegeFilter !== 'todos') {
      return hasPrivilege(p, selectedPrivilegeFilter);
    }

    return true;
  });

  return `
    <div class="section-pad">
      <!-- Barra de Búsqueda y Filtros -->
      <div class="search-row">
        <input
          type="text"
          id="people-search-input"
          class="search-input"
          placeholder="🔍 Buscar publicador..."
          value="${escapeHtml(peopleSearch)}"
          oninput="handlePeopleSearch(this.value)"
        />
        <select class="search-input" style="flex: 0 0 220px;" onchange="handlePrivilegeFilter(this.value)">
          <option value="todos" ${selectedPrivilegeFilter === 'todos' ? 'selected' : ''}>Todos los privilegios</option>
          ${PRIVILEGES_CATALOG.map(cat => `
            <option value="${cat.id}" ${selectedPrivilegeFilter === cat.id ? 'selected' : ''}>
              ${escapeHtml(cat.label)}
            </option>
          `).join('')}
        </select>
        ${isAdmin ? `
          <button class="btn btn-primary" onclick="openPersonModal(null)">
            + Nuevo
          </button>
        ` : ''}
      </div>

      <div class="hint">
        Mostrando <strong>${filtered.length}</strong> de ${list.length} publicadores.
      </div>

      <!-- Tarjetas de Publicadores -->
      <div class="people-list">
        ${filtered.length === 0
          ? '<div class="empty-note">No se encontraron publicadores con ese criterio.</div>'
          : filtered.map(p => renderPersonCard(p)).join('')
        }
      </div>
    </div>
  `;
}

// Renderizado de tarjeta individual de publicador
function renderPersonCard(person) {
  const privs = PRIVILEGES_CATALOG.filter(c => hasPrivilege(person, c.id));

  return `
    <div class="person-card" onclick="openPersonModal('${person.id}')">
      <div class="person-top">
        <div class="person-name">
          ${escapeHtml(person.nombre)}
          <span style="font-size: 11.5px; font-weight: normal; color: var(--muted); margin-left: 6px;">
            ${person.genero === 'F' ? '(Hna)' : '(Hno)'}
          </span>
        </div>
        ${isAdmin ? '<button class="edit-pencil" title="Editar publicador">✏️</button>' : ''}
      </div>

      ${person.nota ? `<div style="font-size: 12.5px; color: var(--gold-deep); margin-top: 4px;">📝 ${escapeHtml(person.nota)}</div>` : ''}

      <div class="badge-row">
        ${privs.length === 0
          ? '<span class="badge off">Sin privilegios</span>'
          : privs.map(pr => `
              <span class="badge on">${escapeHtml(pr.label)}</span>
            `).join('')
        }
      </div>
    </div>
  `;
}

function handlePeopleSearch(val) {
  peopleSearch = val;
  const container = document.querySelector('.people-list');
  const hint = document.querySelector('.hint');
  if (container && hint) {
    const list = PEOPLE || [];
    const search = normName(peopleSearch);
    const filtered = list.filter(p => {
      if (search && !normName(p.nombre).includes(search) && !normName(p.nota || '').includes(search)) return false;
      if (selectedPrivilegeFilter !== 'todos' && !hasPrivilege(p, selectedPrivilegeFilter)) return false;
      return true;
    });
    hint.innerHTML = `Mostrando <strong>${filtered.length}</strong> de ${list.length} publicadores.`;
    container.innerHTML = filtered.length === 0
      ? '<div class="empty-note">No se encontraron publicadores con ese criterio.</div>'
      : filtered.map(p => renderPersonCard(p)).join('');
  }
}

function handlePrivilegeFilter(val) {
  selectedPrivilegeFilter = val;
  render();
}

// Modal de Creación / Edición de Publicador
function openPersonModal(personId) {
  const existing = document.getElementById('wm-person-modal');
  if (existing) existing.remove();

  const isNew = !personId;
  const person = isNew
    ? { id: `p_${Date.now()}`, nombre: '', genero: 'M', estado: 'activo', nota: '', privilegios: ['maestros'] }
    : (PEOPLE || []).find(p => String(p.id) === String(personId));

  if (!person) return;

  const modal = document.createElement('div');
  modal.id = 'wm-person-modal';
  modal.className = 'overlay';
  modal.innerHTML = `
    <div class="modal" style="max-width: 600px; max-height: 85vh;">
      <div class="modal-head">
        <h3>${isNew ? '👤 Nuevo Publicador' : '👤 Ficha de Publicador'}</h3>
        <p>${escapeHtml(person.nombre || 'Nuevo registro')}</p>
      </div>
      <div class="modal-list" style="padding: 16px 18px;">
        <div class="field" style="margin-bottom: 12px;">
          <label>Nombre Completo</label>
          <input type="text" id="person-name-input" class="search-input" style="width: 100%; box-sizing: border-box;" value="${escapeHtml(person.nombre)}" ${isAdmin ? '' : 'readonly'} />
        </div>

        <div style="display: flex; gap: 12px; margin-bottom: 12px;">
          <div class="field" style="flex: 1;">
            <label>Género</label>
            <select id="person-gender-select" class="search-input" style="width: 100%; box-sizing: border-box;" ${isAdmin ? '' : 'disabled'}>
              <option value="M" ${person.genero === 'M' ? 'selected' : ''}>Hermano (M)</option>
              <option value="F" ${person.genero === 'F' ? 'selected' : ''}>Hermana (F)</option>
            </select>
          </div>
          <div class="field" style="flex: 2;">
            <label>Notas / Observaciones</label>
            <input type="text" id="person-note-input" class="search-input" style="width: 100%; box-sizing: border-box;" placeholder="Ej: No asignar primer domingo..." value="${escapeHtml(person.nota || '')}" ${isAdmin ? '' : 'readonly'} />
          </div>
        </div>

        <hr style="margin: 16px 0; border: none; border-top: 1px dashed var(--line);" />

        <div class="field" style="margin-bottom: 8px;">
          <label>🎯 Privilegios y Tareas Asignables</label>
        </div>
        <p style="font-size: 12px; color: var(--muted); margin: 0 0 12px;">
          Marca las casillas correspondientes a las partes que este publicador está aprobado para realizar:
        </p>

        <!-- Cuadrícula de los 10 Checkboxes Separados -->
        <div class="privileges-checkbox-grid">
          ${PRIVILEGES_CATALOG.map(cat => {
            const checked = hasPrivilege(person, cat.id);
            return `
              <label class="privilege-checkbox-item ${checked ? 'checked' : ''}">
                <input
                  type="checkbox"
                  class="priv-cb"
                  data-priv-id="${cat.id}"
                  ${checked ? 'checked' : ''}
                  ${isAdmin ? '' : 'disabled'}
                  onchange="this.closest('.privilege-checkbox-item').classList.toggle('checked', this.checked)"
                />
                <span style="font-size: 13px;">${escapeHtml(cat.label)}</span>
              </label>
            `;
          }).join('')}
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-ghost btn-sm" onclick="closePersonModal()">Cerrar</button>
        ${isAdmin ? `
          ${!isNew ? `<button class="btn btn-sm" style="background:var(--terra-warn);color:#fff;margin-right:auto;" onclick="deletePersonFromModal('${person.id}')">🗑 Eliminar</button>` : ''}
          <button class="btn btn-primary btn-sm" onclick="savePersonFromModal('${person.id}', ${isNew})">
            Guardar Cambios
          </button>
        ` : ''}
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

function closePersonModal() {
  const modal = document.getElementById('wm-person-modal');
  if (modal) modal.remove();
}

async function savePersonFromModal(personId, isNew) {
  const nameInput = document.getElementById('person-name-input');
  const genderSelect = document.getElementById('person-gender-select');
  const noteInput = document.getElementById('person-note-input');
  if (!nameInput || !nameInput.value.trim()) {
    showToast('El nombre no puede estar vacío', 'warning');
    return;
  }

  const selectedPrivs = [];
  document.querySelectorAll('#wm-person-modal .priv-cb:checked').forEach(cb => {
    const privId = cb.getAttribute('data-priv-id');
    if (privId) selectedPrivs.push(privId);
  });

  const personaData = {
    id: personId,
    nombre: nameInput.value.trim(),
    genero: genderSelect ? genderSelect.value : 'M',
    nota: noteInput ? noteInput.value.trim() : '',
    estado: 'activo',
    privilegios: selectedPrivs,
    actualizado_en: new Date().toISOString()
  };

  // Actualizar en el array local
  if (isNew) {
    if (!PEOPLE) PEOPLE = [];
    PEOPLE.push(personaData);
  } else {
    const idx = (PEOPLE || []).findIndex(p => String(p.id) === String(personId));
    if (idx >= 0) {
      PEOPLE[idx] = { ...PEOPLE[idx], ...personaData };
    }
  }

  // Guardar en almacenamiento local y sincronizar con la API y Firestore
  await appStorageSet('wm-people', JSON.stringify(PEOPLE));
  await apiSavePersona(personaData, writeToken);
  apiSyncAllPersonas(PEOPLE, writeToken);

  closePersonModal();
  showToast('Publicador guardado exitosamente', 'success');
  render();
}

async function deletePersonFromModal(personId) {
  const person = (PEOPLE || []).find(p => String(p.id) === String(personId));
  if (!person) return;

  const confirmed = confirm(
    `¿Estás seguro de eliminar a "${person.nombre}"?\n\n` +
    `Esta acción no se puede deshacer. El publicador será removido de la lista.`
  );
  if (!confirmed) return;

  PEOPLE = (PEOPLE || []).filter(p => String(p.id) !== String(personId));

  await appStorageSet('wm-people', JSON.stringify(PEOPLE));

  // Eliminar en backend individual y sincronizar lote con Firestore
  await apiDeletePersona(personId, writeToken);
  apiSyncAllPersonas(PEOPLE, writeToken);

  closePersonModal();
  showToast(`"${person.nombre}" eliminado correctamente`, 'success');
  render();
}

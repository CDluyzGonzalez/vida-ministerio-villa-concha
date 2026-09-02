// ============================================================
// VIDA Y MINISTERIO — VILLA CONCHA
// js/modules/dashboard.js
// Dashboard Admin: Centro de Alertas, Conflictos y Auditoría ($0 Costo)
// ============================================================

// Escanear el programa actual para generar auditoría completa
function auditCurrentProgram(programData, peopleList) {
  const result = {
    sameWeekConflicts: [], // 🔴 Doble asignación misma semana
    consecutiveWeeks: [],  // 🟡 Asignaciones en semanas consecutivas
    unassignedPeople: [],  // 🔵 Hermanos sin asignación en el bimestre
    stats: {
      totalParts: 0,
      assignedParts: 0,
      unassignedParts: 0,
      uniquePeopleUsed: 0,
      totalEligiblePeople: (peopleList || []).length
    }
  };

  if (!programData || !Array.isArray(programData.weeks)) return result;

  const weeks = programData.weeks;
  const personWeeklyUsage = new Map(); // personaNorm -> Set de indices de semanas
  const personTotalCount = new Map();  // personaNorm -> conteo total
  const usedPeopleNorms = new Set();

  weeks.forEach((week, weekIndex) => {
    const weekAssignees = []; // [{ name, partLabel, section }]

    (week.items || []).forEach(item => {
      result.stats.totalParts++;

      // Asignación principal
      if (item.name && item.name.trim()) {
        result.stats.assignedParts++;
        const norm = normName(item.name);
        usedPeopleNorms.add(norm);
        weekAssignees.push({ name: item.name.trim(), norm, part: item.label || 'Parte', section: item.section });
        personTotalCount.set(norm, (personTotalCount.get(norm) || 0) + 1);

        if (!personWeeklyUsage.has(norm)) personWeeklyUsage.set(norm, new Set());
        personWeeklyUsage.get(norm).add(weekIndex);
      } else if (!item.subs || item.subs.length === 0) {
        result.stats.unassignedParts++;
      }

      // Sub-asignaciones (ej. demostraciones de maestros)
      if (Array.isArray(item.subs)) {
        item.subs.forEach(sub => {
          if (sub.name && sub.name.trim()) {
            const norm = normName(sub.name);
            usedPeopleNorms.add(norm);
            weekAssignees.push({ name: sub.name.trim(), norm, part: `${item.label || 'Maestros'} (${sub.role || 'Ayudante'})`, section: item.section });
            personTotalCount.set(norm, (personTotalCount.get(norm) || 0) + 1);

            if (!personWeeklyUsage.has(norm)) personWeeklyUsage.set(norm, new Set());
            personWeeklyUsage.get(norm).add(weekIndex);
          }
        });
      }
    });

    // 1. Detección de Conflictos de Misma Semana (🔴 Crítico)
    const countsInWeek = {};
    weekAssignees.forEach(a => {
      if (!countsInWeek[a.norm]) countsInWeek[a.norm] = [];
      countsInWeek[a.norm].push(a);
    });

    Object.keys(countsInWeek).forEach(normKey => {
      const entries = countsInWeek[normKey];
      if (entries.length > 1) {
        result.sameWeekConflicts.push({
          semana: week.semana || `Semana #${weekIndex + 1}`,
          nombre: entries[0].name,
          partes: entries.map(e => e.part)
        });
      }
    });
  });

  result.stats.uniquePeopleUsed = usedPeopleNorms.size;

  // 2. Detección de Semanas Consecutivas (🟡 Advertencia)
  personWeeklyUsage.forEach((weekIndicesSet, norm) => {
    const sortedWeeks = Array.from(weekIndicesSet).sort((a, b) => a - b);
    const consecutiveStreaks = [];
    let currentStreak = [sortedWeeks[0]];

    for (let i = 1; i < sortedWeeks.length; i++) {
      if (sortedWeeks[i] === sortedWeeks[i - 1] + 1) {
        currentStreak.push(sortedWeeks[i]);
      } else {
        if (currentStreak.length >= 2) consecutiveStreaks.push([...currentStreak]);
        currentStreak = [sortedWeeks[i]];
      }
    }
    if (currentStreak.length >= 2) consecutiveStreaks.push([...currentStreak]);

    if (consecutiveStreaks.length > 0) {
      // Encontrar nombre original
      const matchedPerson = (peopleList || []).find(p => normName(p.nombre) === norm);
      const name = matchedPerson ? matchedPerson.nombre : norm;

      consecutiveStreaks.forEach(streak => {
        const weekNames = streak.map(idx => weeks[idx]?.semana || `Semana ${idx + 1}`);
        result.consecutiveWeeks.push({
          nombre: name,
          count: streak.length,
          semanas: weekNames
        });
      });
    }
  });

  // 3. Hermanos sin Asignaciones en el Bimestre (🔵 Equidad)
  (peopleList || []).forEach(p => {
    const norm = normName(p.nombre);
    if (!usedPeopleNorms.has(norm) && p.estado !== 'inactivo') {
      result.unassignedPeople.push(p);
    }
  });

  return result;
}

// Renderizado del Dashboard Admin
function renderDashboard() {
  const audit = auditCurrentProgram(PROGRAM, PEOPLE);
  const percentUsed = audit.stats.totalEligiblePeople > 0
    ? Math.round((audit.stats.uniquePeopleUsed / audit.stats.totalEligiblePeople) * 100)
    : 0;

  return `
    <div class="dashboard-container">
      <div class="dashboard-header">
        <h2 class="dashboard-title">📊 Dashboard de Auditoría y Control</h2>
        <p class="dashboard-subtitle">Bimestre activo: <strong>${PROGRAM?.bimestre || currentBimestre || 'Actual'}</strong></p>
      </div>

      <!-- Tarjetas de Estadísticas -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value" style="color: var(--primary, #3b82f6);">${audit.stats.assignedParts} / ${audit.stats.totalParts}</div>
          <div class="stat-label">Partes Asignadas</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color: var(--success, #10b981);">${audit.stats.uniquePeopleUsed}</div>
          <div class="stat-label">Publicadores con Asignación (${percentUsed}%)</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color: ${audit.sameWeekConflicts.length > 0 ? 'var(--danger, #ef4444)' : 'var(--text-secondary, #6b7280)'};">
            ${audit.sameWeekConflicts.length}
          </div>
          <div class="stat-label">Conflictos Misma Semana</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color: var(--warning, #f59e0b);">${audit.consecutiveWeeks.length}</div>
          <div class="stat-label">Semanas Consecutivas</div>
        </div>
      </div>

      <!-- Centro de Alertas -->
      <div class="alerts-section">
        <h3 class="section-title">🚨 Centro de Alertas</h3>

        <!-- 🔴 Conflictos Críticos -->
        <div class="alert-box alert-critical">
          <div class="alert-box-header">
            <h4>🔴 Conflictos de Misma Semana (${audit.sameWeekConflicts.length})</h4>
          </div>
          <div class="alert-box-body">
            ${audit.sameWeekConflicts.length === 0
              ? '<p class="text-muted">✅ ¡Excelente! Ningún publicador está duplicado en la misma semana.</p>'
              : `<ul class="alert-list">
                  ${audit.sameWeekConflicts.map(c => `
                    <li>
                      <strong>${escapeHtml(c.nombre)}</strong> tiene <strong>${c.partes.length} partes</strong> en <em>${escapeHtml(c.semana)}</em>:
                      <br><small style="color: var(--text-secondary, #666);">${c.partes.map(p => escapeHtml(p)).join(' • ')}</small>
                    </li>
                  `).join('')}
                </ul>`
            }
          </div>
        </div>

        <!-- 🟡 Semanas Consecutivas -->
        <div class="alert-box alert-warning">
          <div class="alert-box-header">
            <h4>🟡 Sobrecarga: Asignaciones Consecutivas (${audit.consecutiveWeeks.length})</h4>
          </div>
          <div class="alert-box-body">
            ${audit.consecutiveWeeks.length === 0
              ? '<p class="text-muted">✅ Ningún publicador tiene más de una semana consecutiva asignada.</p>'
              : `<ul class="alert-list">
                  ${audit.consecutiveWeeks.map(c => `
                    <li>
                      <strong>${escapeHtml(c.nombre)}</strong> asignado en <strong>${c.count} semanas consecutivas</strong>:
                      <br><small style="color: var(--text-secondary, #666);">${c.semanas.map(s => escapeHtml(s)).join(' → ')}</small>
                    </li>
                  `).join('')}
                </ul>`
            }
          </div>
        </div>

        <!-- 🔵 Hermanos sin Asignaciones -->
        <div class="alert-box alert-info">
          <div class="alert-box-header">
            <h4>🔵 Publicadores Elegibles sin Asignación en este Bimestre (${audit.unassignedPeople.length})</h4>
          </div>
          <div class="alert-box-body">
            ${audit.unassignedPeople.length === 0
              ? '<p class="text-muted">🎉 ¡Todos los publicadores elegibles tienen al menos una asignación!</p>'
              : `<div class="unassigned-pills">
                  ${audit.unassignedPeople.map(p => `
                    <span class="unassigned-pill" onclick="openPersonModal('${p.id}')">
                      ${escapeHtml(p.nombre)}
                    </span>
                  `).join('')}
                </div>`
            }
          </div>
        </div>
      </div>
    </div>
  `;
}

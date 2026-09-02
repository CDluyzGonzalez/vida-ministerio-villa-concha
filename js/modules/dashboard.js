// ============================================================
// VIDA Y MINISTERIO — VILLA CONCHA
// js/modules/dashboard.js
// Dashboard Admin: Centro de Alertas, Conflictos y Auditoría ($0 Costo)
// ============================================================

// Escanear el programa actual para generar auditoría completa
function auditCurrentProgram(programData, peopleList) {
  const result = {
    sameWeekConflicts: [], // 🔴 Doble asignación misma semana (excluyendo Intro + Conclusión del mismo hermano)
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
    const weekAssignees = []; // [{ name, norm, part, section }]

    (week.items || []).forEach(item => {
      // Asignación principal
      if (item.name && item.name.trim()) {
        result.stats.totalParts++;
        result.stats.assignedParts++;
        const norm = normName(item.name);
        usedPeopleNorms.add(norm);
        weekAssignees.push({ name: item.name.trim(), norm, part: item.label || 'Parte', section: item.section });
        personTotalCount.set(norm, (personTotalCount.get(norm) || 0) + 1);

        if (!personWeeklyUsage.has(norm)) personWeeklyUsage.set(norm, new Set());
        personWeeklyUsage.get(norm).add(weekIndex);
      } else if (item.hasOwnProperty('conductor')) {
        // Conductor y Lector de Estudio Bíblico
        result.stats.totalParts += 2;
        if (item.conductor && item.conductor.trim()) {
          result.stats.assignedParts++;
          const norm = normName(item.conductor);
          usedPeopleNorms.add(norm);
          weekAssignees.push({ name: item.conductor.trim(), norm, part: 'Estudio Bíblico (Conductor)', section: 'NVC' });
          if (!personWeeklyUsage.has(norm)) personWeeklyUsage.set(norm, new Set());
          personWeeklyUsage.get(norm).add(weekIndex);
        } else {
          result.stats.unassignedParts++;
        }

        if (item.lector && item.lector.trim()) {
          result.stats.assignedParts++;
          const norm = normName(item.lector);
          usedPeopleNorms.add(norm);
          weekAssignees.push({ name: item.lector.trim(), norm, part: 'Estudio Bíblico (Lector)', section: 'NVC' });
          if (!personWeeklyUsage.has(norm)) personWeeklyUsage.set(norm, new Set());
          personWeeklyUsage.get(norm).add(weekIndex);
        } else {
          result.stats.unassignedParts++;
        }
      } else if (!isPureSongLine(item) && (!item.subs || item.subs.length === 0)) {
        result.stats.totalParts++;
        result.stats.unassignedParts++;
      }

      // Sub-asignaciones (ej. demostraciones de maestros)
      if (Array.isArray(item.subs)) {
        result.stats.totalParts += item.subs.length;
        item.subs.forEach(sub => {
          if (sub.name && sub.name.trim()) {
            result.stats.assignedParts++;
            const norm = normName(sub.name);
            usedPeopleNorms.add(norm);
            weekAssignees.push({ name: sub.name.trim(), norm, part: `${item.label || 'Maestros'} (${sub.role || 'Ayudante'})`, section: item.section });
            personTotalCount.set(norm, (personTotalCount.get(norm) || 0) + 1);

            if (!personWeeklyUsage.has(norm)) personWeeklyUsage.set(norm, new Set());
            personWeeklyUsage.get(norm).add(weekIndex);
          } else {
            result.stats.unassignedParts++;
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
        // Excepción válida: Introducción y Conclusión por el mismo hermano es el papel normal de Presidencia
        const partsNormalized = entries.map(e => normName(e.part || ''));
        const hasIntro = partsNormalized.some(p => p.includes('introduccion'));
        const hasConcl = partsNormalized.some(p => p.includes('conclusion'));
        const isIntroConclPair = (entries.length === 2 && hasIntro && hasConcl);

        if (!isIntroConclPair) {
          result.sameWeekConflicts.push({
            semana: week.semana || `Semana #${weekIndex + 1}`,
            nombre: entries[0].name,
            partes: entries.map(e => e.part)
          });
        }
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
      const personObj = (peopleList || []).find(p => normName(p.nombre) === norm);
      const name = personObj ? personObj.nombre : norm;

      consecutiveStreaks.forEach(streak => {
        const weekNames = streak.map(idx => weeks[idx]?.semana || `Semana #${idx + 1}`);
        result.consecutiveWeeks.push({
          nombre: name,
          consecutiveCount: streak.length,
          semanas: weekNames
        });
      });
    }
  });

  // 3. Hermanos sin Asignación en el Bimestre (🔵 Equidad)
  (peopleList || []).forEach(person => {
    const norm = normName(person.nombre);
    if (!usedPeopleNorms.has(norm)) {
      result.unassignedPeople.push({
        id: person.id,
        nombre: person.nombre,
        genero: person.genero || 'M',
        disponibilidad: person.disponibilidad?.[programData.bimestre] || 'Disponible',
        privilegios: person.privilegios || []
      });
    }
  });

  return result;
}

// Renderizado del Dashboard de Administración
function renderDashboardTab() {
  if (!PROGRAM || !Array.isArray(PROGRAM.weeks)) {
    return '<div class="section-pad"><div class="loading">Cargando auditoría...</div></div>';
  }

  const audit = auditCurrentProgram(PROGRAM, PEOPLE);

  return `
    <div class="section-pad">
      <div class="dashboard-head">
        <h2 style="font-size:22px; font-weight:700; color:#1e293b; margin:0 0 4px 0;">Auditoría del Programa</h2>
        <p style="color:#64748b; font-size:14px; margin:0 0 20px 0;">
          Bimestre activo: <strong>${escapeHtml(PROGRAM.bimestre || currentBimestre)}</strong> · Análisis en tiempo real de equidad y sobrecarga.
        </p>
      </div>

      <!-- Resumen Estadístico -->
      <div class="dash-metrics-grid">
        <div class="dash-metric-card">
          <span class="dash-metric-val">${audit.stats.assignedParts} / ${audit.stats.totalParts}</span>
          <span class="dash-metric-label">Partes Asignadas</span>
        </div>
        <div class="dash-metric-card">
          <span class="dash-metric-val">${audit.stats.uniquePeopleUsed} / ${audit.stats.totalEligiblePeople}</span>
          <span class="dash-metric-label">Publicadores Utilizados</span>
        </div>
        <div class="dash-metric-card ${audit.sameWeekConflicts.length > 0 ? 'metric-warn' : ''}">
          <span class="dash-metric-val">${audit.sameWeekConflicts.length}</span>
          <span class="dash-metric-label">Conflictos Misma Semana</span>
        </div>
        <div class="dash-metric-card">
          <span class="dash-metric-val">${audit.unassignedPeople.length}</span>
          <span class="dash-metric-label">Sin Asignación</span>
        </div>
      </div>

      <!-- Centro de Alertas -->
      <div class="dash-alerts-section" style="margin-top:24px;">
        <!-- 🔴 Conflictos Misma Semana -->
        <div class="dash-alert-box alert-danger">
          <div class="dash-alert-header">
            <h3>🔴 Conflictos de Misma Semana (${audit.sameWeekConflicts.length})</h3>
          </div>
          ${audit.sameWeekConflicts.length === 0 ? `
            <p class="dash-empty-msg">✅ No hay hermanos con partes duplicadas en una misma semana.</p>
          ` : `
            <ul class="dash-alert-list">
              ${audit.sameWeekConflicts.map(c => `
                <li>
                  <strong>${escapeHtml(c.nombre)}</strong> tiene ${c.partes.length} partes en <em>${escapeHtml(c.semana)}</em>:
                  <div class="dash-parts-sub">${c.partes.map(p => `<span>• ${escapeHtml(p)}</span>`).join(' ')}</div>
                </li>
              `).join('')}
            </ul>
          `}
        </div>

        <!-- 🟡 Semanas Consecutivas -->
        <div class="dash-alert-box alert-warning" style="margin-top:16px;">
          <div class="dash-alert-header">
            <h3>🟡 Asignaciones en Semanas Consecutivas (${audit.consecutiveWeeks.length})</h3>
          </div>
          ${audit.consecutiveWeeks.length === 0 ? `
            <p class="dash-empty-msg">✅ Asignaciones bien distribuidas a lo largo del bimestre.</p>
          ` : `
            <ul class="dash-alert-list">
              ${audit.consecutiveWeeks.map(c => `
                <li>
                  <strong>${escapeHtml(c.nombre)}</strong> asignado en <strong>${c.consecutiveCount} semanas seguidas</strong>:
                  <div class="dash-parts-sub">${c.semanas.map(s => `<span>${escapeHtml(s)}</span>`).join(' ➔ ')}</div>
                </li>
              `).join('')}
            </ul>
          `}
        </div>

        <!-- 🔵 Publicadores Sin Asignación -->
        <div class="dash-alert-box alert-info" style="margin-top:16px;">
          <div class="dash-alert-header">
            <h3>🔵 Publicadores Sin Asignación en el Bimestre (${audit.unassignedPeople.length})</h3>
          </div>
          ${audit.unassignedPeople.length === 0 ? `
            <p class="dash-empty-msg">Todos los publicadores elegibles tienen al menos una parte en el bimestre.</p>
          ` : `
            <div class="dash-chips-grid">
              ${audit.unassignedPeople.map(p => `
                <div class="dash-chip">
                  <span>${escapeHtml(p.nombre)}</span>
                  <small style="color:#64748b;">${p.disponibilidad}</small>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      </div>
    </div>
  `;
}

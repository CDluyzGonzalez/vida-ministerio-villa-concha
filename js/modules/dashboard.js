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
  const personWeeklyParts = new Map(); // personaNorm -> Map(weekIndex -> [partName])
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

        if (!personWeeklyParts.has(norm)) personWeeklyParts.set(norm, new Map());
        if (!personWeeklyParts.get(norm).has(weekIndex)) personWeeklyParts.get(norm).set(weekIndex, []);
        personWeeklyParts.get(norm).get(weekIndex).push(item.label || 'Parte');
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
          if (!personWeeklyParts.has(norm)) personWeeklyParts.set(norm, new Map());
          if (!personWeeklyParts.get(norm).has(weekIndex)) personWeeklyParts.get(norm).set(weekIndex, []);
          personWeeklyParts.get(norm).get(weekIndex).push('Estudio Bíblico (Conductor)');
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
          if (!personWeeklyParts.has(norm)) personWeeklyParts.set(norm, new Map());
          if (!personWeeklyParts.get(norm).has(weekIndex)) personWeeklyParts.get(norm).set(weekIndex, []);
          personWeeklyParts.get(norm).get(weekIndex).push('Estudio Bíblico (Lector)');
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
            if (!personWeeklyParts.has(norm)) personWeeklyParts.set(norm, new Map());
            if (!personWeeklyParts.get(norm).has(weekIndex)) personWeeklyParts.get(norm).set(weekIndex, []);
            personWeeklyParts.get(norm).get(weekIndex).push(`${item.label || 'Maestros'} (${sub.role || 'Ayudante'})`);
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
        // Regla de Presidencia: Palabras de Introducción y Palabras de Conclusión son la misma función
        const hasIntro = entries.some(e => normName(e.part || '').includes('introduccion'));
        const hasConcl = entries.some(e => normName(e.part || '').includes('conclusion'));

        let distinctAssignments = [];
        if (hasIntro && hasConcl) {
          // Fusionar introducción y conclusión en una sola asignación de Presidencia
          distinctAssignments.push('Presidencia (Introducción y Conclusión)');
          entries.forEach(e => {
            const pNorm = normName(e.part || '');
            if (!pNorm.includes('introduccion') && !pNorm.includes('conclusion')) {
              distinctAssignments.push(e.part);
            }
          });
        } else {
          distinctAssignments = entries.map(e => e.part);
        }

        // Solo hay conflicto real si tiene más de una función distinta en la semana
        if (distinctAssignments.length > 1) {
          result.sameWeekConflicts.push({
            semana: week.semana || `Semana #${weekIndex + 1}`,
            nombre: entries[0].name,
            partes: distinctAssignments
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
        const partsPerWeek = streak.map(idx => {
          const partsMap = personWeeklyParts.get(norm);
          const rawParts = partsMap?.get(idx) || ['(sin detalle)'];
          const hasIntro = rawParts.some(p => normName(p).includes('introduccion'));
          const hasConcl = rawParts.some(p => normName(p).includes('conclusion'));
          if (hasIntro && hasConcl) {
            const others = rawParts.filter(p => !normName(p).includes('introduccion') && !normName(p).includes('conclusion'));
            return ['Presidencia', ...others];
          }
          return rawParts;
        });
        result.consecutiveWeeks.push({
          nombre: name,
          consecutiveCount: streak.length,
          semanas: weekNames,
          partesPorSemana: partsPerWeek
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
                  <div class="dash-parts-sub" style="flex-direction:column; gap:4px;">
                    ${c.semanas.map((s, i) => {
                      const parts = (c.partesPorSemana && c.partesPorSemana[i]) ? c.partesPorSemana[i] : [];
                      const partsText = parts.map(p => escapeHtml(p)).join(', ');
                      return `<span>${i > 0 ? '➔ ' : ''}${escapeHtml(s)} <em style="color:var(--gold-deep);">(${partsText})</em></span>`;
                    }).join('')}
                  </div>
                </li>
              `).join('')}
            </ul>
          `}
        </div>

        <!-- 🔵 Publicadores Sin Asignación (actual + anterior) -->
        <div id="dash-unassigned-section" class="dash-alert-box alert-info" style="margin-top:16px;">
          <div class="dash-alert-header">
            <h3>🔵 Publicadores Sin Asignación</h3>
          </div>
          <p class="dash-empty-msg">⏳ Verificando bimestre actual y anterior...</p>
        </div>
      </div>
    </div>
  `;
}

// Obtener nombre del bimestre anterior
function getPreviousBimestre(currentName) {
  const idx = BIMESTRES_LIST.indexOf(currentName);
  if (idx <= 0) return null; // Enero-Febrero no tiene anterior
  return BIMESTRES_LIST[idx - 1];
}

// Extraer los nombres usados de un programa
function extractUsedNorms(programData) {
  const used = new Set();
  if (!programData || !Array.isArray(programData.weeks)) return used;

  programData.weeks.forEach(week => {
    (week.items || []).forEach(item => {
      if (item.name && item.name.trim()) used.add(normName(item.name));
      if (item.conductor && item.conductor.trim()) used.add(normName(item.conductor));
      if (item.lector && item.lector.trim()) used.add(normName(item.lector));
      if (Array.isArray(item.subs)) {
        item.subs.forEach(sub => {
          if (sub.name && sub.name.trim()) used.add(normName(sub.name));
        });
      }
    });
  });
  return used;
}

// Cargar bimestre anterior y actualizar sección de no-asignados
async function loadUnassignedWithPrevBimestre() {
  const container = document.getElementById('dash-unassigned-section');
  if (!container) return;

  const bimestreActual = PROGRAM?.bimestre || currentBimestre;
  const bimestreAnterior = getPreviousBimestre(bimestreActual);

  // Nombres usados en el bimestre actual
  const usedCurrent = extractUsedNorms(PROGRAM);

  // Nombres usados en el bimestre anterior
  let usedPrev = new Set();
  let prevLoaded = false;

  if (bimestreAnterior) {
    try {
      const prevProg = await apiLoadPrograma(bimestreAnterior);
      if (prevProg && Array.isArray(prevProg.weeks) && prevProg.weeks.length > 0) {
        usedPrev = extractUsedNorms(prevProg);
        prevLoaded = true;
      }
    } catch (e) {
      console.warn('No se pudo cargar bimestre anterior:', e.message);
    }
  }

  // Publicadores sin asignación en NINGUNO de los dos bimestres
  const unassigned = (PEOPLE || []).filter(person => {
    const norm = normName(person.nombre);
    return !usedCurrent.has(norm) && !usedPrev.has(norm);
  });

  // Subtítulo descriptivo
  const subtitle = bimestreAnterior && prevLoaded
    ? `Sin asignación en <strong>${escapeHtml(bimestreAnterior)}</strong> ni en <strong>${escapeHtml(bimestreActual)}</strong>`
    : `Sin asignación en <strong>${escapeHtml(bimestreActual)}</strong>`;

  // Actualizar métricas
  const metricCard = document.querySelector('.dash-metric-card:nth-child(4) .dash-metric-val');
  if (metricCard) metricCard.textContent = unassigned.length;

  container.innerHTML = `
    <div class="dash-alert-header">
      <h3>🔵 Publicadores Sin Asignación (${unassigned.length})</h3>
    </div>
    <p style="font-size:12.5px; color:#64748b; margin:4px 16px 8px;">${subtitle}</p>
    ${unassigned.length === 0 ? `
      <p class="dash-empty-msg">✅ Todos los publicadores tienen al menos una parte en los últimos 2 bimestres.</p>
    ` : `
      <div class="dash-chips-grid">
        ${unassigned.map(p => `
          <div class="dash-chip">
            <span>${escapeHtml(p.nombre)}</span>
            <small style="color:#64748b;">${p.genero === 'F' ? 'Hna' : 'Hno'}</small>
          </div>
        `).join('')}
      </div>
    `}
  `;
}

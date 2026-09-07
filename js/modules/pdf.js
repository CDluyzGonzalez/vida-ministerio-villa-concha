// ============================================================
// VIDA Y MINISTERIO — VILLA CONCHA
// js/modules/pdf.js
// Generación y Exportación de Documento PDF (jsPDF + html2canvas)
// ============================================================

let pdfExportMode = false;

async function exportProgramPdf() {
  const jsPdfLib = window.jspdf?.jsPDF || window.jsPDF;
  const html2canvasLib = window.html2canvas;

  if (!jsPdfLib || !html2canvasLib) {
    showToast('Librerías de PDF no disponibles. Abre la app con conexión.', 'error');
    return;
  }

  const bim = PROGRAM;
  if (!bim || !Array.isArray(bim.weeks) || bim.weeks.length === 0) {
    showToast('No hay semanas disponibles para exportar en este bimestre', 'warning');
    return;
  }

  showToast('Generando documento PDF...', 'info', 3000);
  pdfExportMode = true;

  try {
    const doc = new jsPdfLib({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pageW = 210;
    const pageH = 297;
    const margin = 8;
    const contentW = pageW - margin * 2;
    const contentH = pageH - margin * 2;
    let firstPage = true;

    for (let i = 0; i < (bim.weeks || []).length; i++) {
      const week = bim.weeks[i];
      const node = document.createElement('div');
      node.className = 'pdf-week-capture';
      node.style.position = 'fixed';
      node.style.left = '-100000px';
      node.style.top = '0';
      node.style.zIndex = '-1';
      node.style.width = '820px';
      node.style.background = '#faf6ee';
      node.style.padding = '18px 0 24px';

      // Encabezado
      const header = document.createElement('div');
      header.style.fontFamily = "'Fraunces', serif";
      header.style.color = '#123338';
      header.style.margin = '0 0 12px';
      header.style.padding = '0 18px 10px';
      header.style.borderBottom = '2px solid #123338';
      header.innerHTML = `
        <div style="font-size:22px;font-weight:700;">Vida y Ministerio — Villa Concha</div>
        <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:#7c7263;margin-top:3px;">
          ${escapeHtml(bim.bimestre || currentBimestre)} · Programa completo
        </div>
      `;
      node.appendChild(header);

      // Tarjeta de semana
      const cardContainer = document.createElement('div');
      cardContainer.innerHTML = renderWeekCard(bim, week, i);
      const card = cardContainer.firstElementChild;
      if (card) {
        card.classList.add('open');
        card.style.margin = '0 18px';
        card.style.boxShadow = 'none';
        card.style.border = '1px solid #ddd';
        node.appendChild(card);
      }

      document.body.appendChild(node);

      try {
        if (document.fonts?.ready) {
          await document.fonts.ready;
        }

        const canvas = await html2canvasLib(node, {
          backgroundColor: '#faf6ee',
          scale: 1.5,
          useCORS: true,
          logging: false,
          imageTimeout: 15000,
          removeContainer: true
        });

        const pagePxH = Math.max(1, Math.floor((canvas.width * contentH) / contentW));
        let offsetPx = 0;

        while (offsetPx < canvas.height) {
          if (!firstPage) {
            doc.addPage();
          }
          firstPage = false;

          const sliceH = Math.min(pagePxH, canvas.height - offsetPx);
          const slice = document.createElement('canvas');
          slice.width = canvas.width;
          slice.height = sliceH;

          const ctx = slice.getContext('2d');
          ctx.fillStyle = '#faf6ee';
          ctx.fillRect(0, 0, slice.width, slice.height);
          ctx.drawImage(canvas, 0, offsetPx, canvas.width, sliceH, 0, 0, slice.width, slice.height);

          const sliceHmm = (slice.height * contentW) / slice.width;
          doc.addImage(slice.toDataURL('image/jpeg', 0.94), 'JPEG', margin, margin, contentW, sliceHmm, undefined, 'FAST');

          offsetPx += sliceH;
        }
      } finally {
        node.remove();
      }
    }

    const safeName = String(bim.bimestre || 'Villa_Concha').replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ -]/g, '').trim().replace(/\s+/g, '_');
    doc.save(`Vida_y_Ministerio_${safeName}.pdf`);
    showToast('PDF descargado exitosamente', 'success');
  } catch (error) {
    console.error('Error generando PDF:', error);
    showToast(`Error al generar PDF: ${error.message || error}`, 'error');
  } finally {
    pdfExportMode = false;
    render();
  }
}

// ============================================================
// EXPORTAR SALIDAS AL SERVICIO EN PDF (FORMATO HOJA CARTA - 1 PÁGINA)
// ============================================================
async function exportSalidasPdf() {
  const jsPdfLib = window.jspdf?.jsPDF || window.jsPDF;
  const html2canvasLib = window.html2canvas;

  if (!jsPdfLib || !html2canvasLib) {
    showToast('Librerías de PDF no disponibles. Abre la app con conexión.', 'error');
    return;
  }

  const salidas = typeof CURRENT_SALIDAS !== 'undefined' ? CURRENT_SALIDAS : null;
  if (!salidas) {
    showToast('No hay datos de horarios de predicación para exportar.', 'warning');
    return;
  }

  showToast('Generando PDF de salidas (Hoja Carta)...', 'info', 2500);

  const mesKey = (typeof SERVICE_SELECTED_MONTH_KEY !== 'undefined' && SERVICE_SELECTED_MONTH_KEY) 
    || (typeof getCurrentMonthKey === 'function' ? getCurrentMonthKey() : '2026-09');
  const monthLabel = typeof getMonthLabelFromKey === 'function' ? getMonthLabelFromKey(mesKey) : mesKey;

  const lunes = salidas.lunes_especial || { activo: false };
  const entreSemana = typeof sortEntreSemanaEntries === 'function' 
    ? sortEntreSemanaEntries(salidas.entre_semana || []) 
    : (salidas.entre_semana || []);
  const sabados = salidas.sabados || [];
  const domingos = salidas.domingos || [];

  // Crear nodo de captura invisible pero con renderizado exacto a escala hoja carta
  const node = document.createElement('div');
  node.className = 'pdf-salidas-capture';
  node.style.position = 'fixed';
  node.style.left = '-100000px';
  node.style.top = '0';
  node.style.zIndex = '-1';
  node.style.width = '820px';
  node.style.minHeight = '1030px';
  node.style.background = '#ffffff';
  node.style.padding = '20px 26px';
  node.style.boxSizing = 'border-box';
  node.style.fontFamily = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  node.style.color = '#1e293b';
  node.style.display = 'flex';
  node.style.flexDirection = 'column';
  node.style.justifyContent = 'space-between';

  node.innerHTML = `
    <div style="flex: 1; display: flex; flex-direction: column; gap: 12px;">
      <!-- Encabezado Principal -->
      <div style="text-align: center; margin-bottom: 4px; border-bottom: 2.5px solid #7a1d2e; padding-bottom: 8px;">
        <div style="font-size: 13px; font-weight: 700; color: #7a1d2e; letter-spacing: 1.5px; text-transform: uppercase;">
          CONGREGACIÓN VILLA CONCHA
        </div>
        <div style="font-size: 21px; font-weight: 800; color: #0f172a; margin: 3px 0; font-family: 'Fraunces', Georgia, serif;">
          ${escapeHtml(salidas.titulo || `HORARIOS DE PREDICACIÓN ${monthLabel.toUpperCase()}`)}
        </div>
        <div style="font-size: 11.5px; font-weight: 600; color: #64748b;">
          📅 ${escapeHtml(monthLabel)} · Salidas al Servicio del Mes
        </div>
      </div>

      <!-- 1. Salida Especial de Lunes (si está activa) -->
      ${lunes && lunes.activo ? `
        <div style="border: 1.5px solid #d97706; border-radius: 6px; overflow: hidden;">
          <div style="background: #92400e; color: #ffffff; padding: 5px 10px; font-size: 11px; font-weight: 700; display: flex; justify-content: space-between; align-items: center;">
            <span>⭐ SALIDA ESPECIAL DE LUNES</span>
            <span>📅 ${escapeHtml(lunes.fecha || 'Lunes')}</span>
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 10.5px; background: #fffbeb;">
            <tbody>
              <tr>
                <td style="padding: 6px 10px; width: 110px; border-right: 1px solid #fde68a;">
                  <strong>⏰ Hora:</strong> ${escapeHtml(lunes.hora || '8:45 a.m.')}
                </td>
                <td style="padding: 6px 10px; border-right: 1px solid #fde68a;">
                  <span style="color: #e11d48;">📍</span> <strong>Lugar:</strong> ${escapeHtml(lunes.lugar || 'Salón del Reino')}
                </td>
                <td style="padding: 6px 10px; width: 180px; border-right: 1px solid #fde68a;">
                  <span style="color: #0284c7;">👤</span> <strong>Capitán:</strong> ${escapeHtml(lunes.capitan || 'Por asignar')}
                </td>
                <td style="padding: 6px 10px; width: 180px;">
                  <strong>🎯 Destino:</strong> ${escapeHtml(lunes.destino || 'Territorio asignado')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ` : ''}

      <!-- 2. Salidas Regulares Entre Semana (Martes a Viernes) -->
      <div style="border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden;">
        <div style="background: #7a1d2e; color: #ffffff; padding: 6px 10px; font-size: 11.5px; font-weight: 700; display: flex; justify-content: space-between;">
          <span>🗓️ SALIDAS REGULARES ENTRE SEMANA</span>
          <span style="font-weight: 500; opacity: 0.9;">Martes a Viernes (Mañana / Tarde)</span>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
          <thead>
            <tr style="background: #f1f5f9; border-bottom: 1.5px solid #cbd5e1; text-align: left;">
              <th style="padding: 6px 10px; width: 140px; color: #334155;">DÍA / TURNO</th>
              <th style="padding: 6px 8px; width: 85px; color: #334155;">HORA</th>
              <th style="padding: 6px 10px; color: #334155;">LUGAR DE SALIDA</th>
              <th style="padding: 6px 10px; width: 190px; color: #334155;">CAPITÁN</th>
            </tr>
          </thead>
          <tbody>
            ${entreSemana.map((item, idx) => `
              <tr style="border-bottom: 1px solid #e2e8f0; background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                <td style="padding: 5.5px 10px; font-weight: 700; color: #0f172a;">${escapeHtml(item.dia)}</td>
                <td style="padding: 5.5px 8px; color: #475569; font-weight: 600;">${escapeHtml(item.hora)}</td>
                <td style="padding: 5.5px 10px; color: #1e293b;">
                  <span style="color: #e11d48;">📍</span> ${escapeHtml(item.lugar)}
                  ${item.nota ? `<span style="display: inline-block; background: #e2e8f0; color: #334155; padding: 1px 5px; border-radius: 4px; font-size: 9px; font-weight: 700; margin-left: 6px;">${escapeHtml(item.nota)}</span>` : ''}
                </td>
                <td style="padding: 5.5px 10px; font-weight: 600; color: #0f172a;">
                  <span style="color: #0284c7;">👤</span> ${escapeHtml(item.capitan || 'Por asignar')}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- 3. Sábados (con ícono 🗓️ de calendario) -->
      <div style="border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden;">
        <div style="background: #1e293b; color: #ffffff; padding: 6px 10px; font-size: 11.5px; font-weight: 700; display: flex; justify-content: space-between;">
          <span>🗓️ SÁBADOS</span>
          <span style="font-weight: 500; opacity: 0.9;">Organizado por Fechas</span>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
          <thead>
            <tr style="background: #f1f5f9; border-bottom: 1.5px solid #cbd5e1; text-align: left;">
              <th style="padding: 6px 10px; width: 140px; color: #334155;">FECHA</th>
              <th style="padding: 6px 8px; width: 85px; color: #334155;">HORA</th>
              <th style="padding: 6px 10px; color: #334155;">LUGAR & TIPO DE SALIDA</th>
              <th style="padding: 6px 10px; width: 190px; color: #334155;">CAPITÁN</th>
            </tr>
          </thead>
          <tbody>
            ${sabados.map((item, idx) => `
              <tr style="border-bottom: 1px solid #e2e8f0; background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                <td style="padding: 5.5px 10px; font-weight: 700; color: #0f172a;">
                  <span>📅</span> ${escapeHtml(item.fecha)}
                </td>
                <td style="padding: 5.5px 8px; color: #475569; font-weight: 600;">${escapeHtml(item.hora)}</td>
                <td style="padding: 5.5px 10px; color: #1e293b;">
                  <span style="color: #e11d48;">📍</span> ${escapeHtml(item.lugar)}
                  ${item.nota ? `<span style="display: inline-block; background: #e0f2fe; color: #0369a1; padding: 1px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; margin-left: 6px;">${escapeHtml(item.nota)}</span>` : ''}
                </td>
                <td style="padding: 5.5px 10px; font-weight: 600; color: #0f172a;">
                  <span style="color: #0284c7;">👤</span> ${escapeHtml(item.capitan || 'Por asignar')}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- 4. Domingos (Salidas por Grupos - Con ícono 🗓️ de calendario, sin rowspan y con amplio espacio) -->
      <div style="border: 1.5px solid #0f766e; border-radius: 7px; overflow: hidden;">
        <div style="background: #0f766e; color: #ffffff; padding: 6px 12px; font-size: 11.5px; font-weight: 700; display: flex; justify-content: space-between; align-items: center;">
          <span>🗓️ DOMINGOS</span>
          <span style="font-weight: 500; font-size: 11px; opacity: 0.95;">Salidas por Grupos</span>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
          <thead>
            <tr style="background: #f8fafc; border-bottom: 1.5px solid #cbd5e1; text-align: left;">
              <th style="padding: 6px 12px; width: 175px; color: #334155;">DIVISIÓN / GRUPOS</th>
              <th style="padding: 6px 12px; color: #334155;">LUGAR DE SALIDA</th>
              <th style="padding: 6px 12px; width: 200px; color: #334155;">CAPITÁN</th>
            </tr>
          </thead>
          <tbody>
            ${domingos.map((dom, dIdx) => {
              const isGrupos = dom.tipo === 'grupos' && Array.isArray(dom.salidas) && dom.salidas.length > 0;
              return `
                <!-- Barra destacada para cada Domingo (Fecha y Hora 100% visibles) -->
                <tr style="background: #f0fdfa; border-top: ${dIdx > 0 ? '2px solid #0f766e' : 'none'}; border-bottom: 1px solid #ccfbf1;">
                  <td colspan="3" style="padding: 7px 12px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <span style="font-weight: 800; font-size: 12px; color: #000000; display: inline-flex; align-items: center; gap: 6px;">
                        <span>📅</span> ${escapeHtml(dom.fecha)}
                      </span>
                      <span style="font-size: 11px; font-weight: 700; color: #0f766e; background: #ffffff; border: 1px solid #5eead4; padding: 2px 10px; border-radius: 6px;">
                        ⏰ ${escapeHtml(dom.hora || '9:00 a.m.')}
                      </span>
                    </div>
                  </td>
                </tr>

                ${dom.tipo === 'asamblea' ? `
                  <tr style="border-bottom: 1px solid #e2e8f0; background: #fff1f2;">
                    <td colspan="3" style="padding: 7px 12px; font-weight: 700; color: #be123c; text-align: center;">
                      ⛔ Sin salida de predicación — Asamblea de Circuito / Regional
                    </td>
                  </tr>
                ` : isGrupos ? dom.salidas.map((sal, sIdx) => `
                  <tr style="border-bottom: 1px solid #e2e8f0; background: ${sIdx % 2 === 0 ? '#ffffff' : '#fcfcfd'};">
                    <td style="padding: 6.5px 12px; font-weight: 700; color: #000000;">
                      ${escapeHtml(sal.grupo)}
                    </td>
                    <td style="padding: 6.5px 12px; color: #1e293b;">
                      <span style="color: #e11d48;">📍</span> ${escapeHtml(sal.lugar || 'Por asignar')}
                    </td>
                    <td style="padding: 6.5px 12px; font-weight: 600; color: #0f172a;">
                      <span style="color: #0284c7;">👤</span> ${escapeHtml(sal.capitan || 'Por asignar')}
                    </td>
                  </tr>
                `).join('') : `
                  <tr style="border-bottom: 1px solid #e2e8f0; background: #ffffff;">
                    <td style="padding: 6.5px 12px; font-weight: 700;">
                      <span style="display: inline-block; background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 700;">
                        Toda la Congregación
                      </span>
                    </td>
                    <td style="padding: 6.5px 12px; color: #1e293b;">
                      <span style="color: #e11d48;">📍</span> ${escapeHtml(dom.lugar || 'Por asignar')}
                    </td>
                    <td style="padding: 6.5px 12px; font-weight: 600; color: #0f172a;">
                      <span style="color: #0284c7;">👤</span> ${escapeHtml(dom.capitan || 'Por asignar')}
                    </td>
                  </tr>
                `}
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Pie de Página (empujado hacia el fondo para aprovechar toda la hoja carta) -->
    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #cbd5e1; padding-top: 6px; margin-top: 12px; font-size: 9.5px; color: #64748b;">
      <span>Vida y Ministerio · Congregación Villa Concha</span>
      <span>Documento oficial de salidas al servicio</span>
    </div>
  `;

  document.body.appendChild(node);

  try {
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }

    const canvas = await html2canvasLib(node, {
      backgroundColor: '#ffffff',
      scale: 2, // Calidad nítida para impresión
      useCORS: true,
      logging: false,
      imageTimeout: 15000,
      removeContainer: true
    });

    const doc = new jsPdfLib({
      orientation: 'p',
      unit: 'mm',
      format: 'letter', // 215.9 mm × 279.4 mm (Hoja Carta)
      compress: true
    });

    const pageW = 215.9;
    const pageH = 279.4;
    const margin = 8;
    const maxW = pageW - margin * 2; // 199.9 mm
    const maxH = pageH - margin * 2; // 263.4 mm

    const imgW = maxW;
    let imgH = (canvas.height * imgW) / canvas.width;

    let finalW = imgW;
    let finalH = imgH;

    // Ajuste matemático: si la altura calculada supera la página carta, escalar para que encaje al 100% en 1 sola hoja
    if (imgH > maxH) {
      const ratio = maxH / imgH;
      finalW = imgW * ratio;
      finalH = maxH;
    }

    const offsetX = margin + (maxW - finalW) / 2;
    const offsetY = margin + (maxH - finalH) / 2;

    doc.addImage(canvas.toDataURL('image/jpeg', 0.96), 'JPEG', offsetX, offsetY, finalW, finalH, undefined, 'FAST');

    const safeName = String(monthLabel || 'Salidas').replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ -]/g, '').trim().replace(/\s+/g, '_');
    doc.save(`Salidas_al_Servicio_${safeName}.pdf`);
    showToast('PDF de salidas descargado exitosamente (Hoja Carta)', 'success');
  } catch (error) {
    console.error('Error generando PDF de salidas:', error);
    showToast(`Error al generar PDF: ${error.message || error}`, 'error');
  } finally {
    node.remove();
  }
}

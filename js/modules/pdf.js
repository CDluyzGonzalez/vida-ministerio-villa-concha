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

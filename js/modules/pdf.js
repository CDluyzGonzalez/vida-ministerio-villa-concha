// ============================================================
// VIDA Y MINISTERIO — VILLA CONCHA
// js/modules/pdf.js
// Generación y Exportación de Documento PDF (jsPDF + html2canvas)
// ============================================================

let pdfExportMode = false;

async function exportProgramPdf() {
  if (!window.jspdf || !window.html2canvas) {
    showToast('Librerías de PDF no disponibles en el navegador', 'error');
    return;
  }

  showToast('Preparando documento PDF...', 'info', 2000);
  pdfExportMode = true;
  render();

  try {
    // Buscar el contenedor de semanas
    const element = document.querySelector('.weeks-container') || document.querySelector('.section-pad');
    if (!element) throw new Error('No se encontró el contenido del programa');

    // Esperar renderizado del DOM
    await new Promise(resolve => setTimeout(resolve, 300));

    const canvas = await window.html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#faf6ee'
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
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

    const pagePxH = Math.max(1, Math.floor((canvas.width * contentH) / contentW));
    let offsetPx = 0;
    let firstPage = true;

    while (offsetPx < canvas.height) {
      if (!firstPage) {
        pdf.addPage();
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
      pdf.addImage(slice.toDataURL('image/jpeg', 0.95), 'JPEG', margin, margin, contentW, sliceHmm, undefined, 'FAST');

      offsetPx += sliceH;
    }

    const safeBimName = String(PROGRAM?.bimestre || 'Villa_Concha').replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ -]/g, '').trim().replace(/\s+/g, '_');
    pdf.save(`Vida_y_Ministerio_${safeBimName}.pdf`);
    showToast('PDF descargado exitosamente', 'success');
  } catch (error) {
    console.error('Error generando PDF:', error);
    showToast('Hubo un problema al generar el PDF', 'error');
  } finally {
    pdfExportMode = false;
    render();
  }
}

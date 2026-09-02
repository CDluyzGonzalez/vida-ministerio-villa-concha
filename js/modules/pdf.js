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
    const element = document.querySelector('.weeks-accordion');
    if (!element) throw new Error('No se encontró el contenido del programa');

    // Esperar renderizado del DOM
    await new Promise(resolve => setTimeout(resolve, 300));

    const canvas = await window.html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const filename = `Programa_Vida_y_Ministerio_${(PROGRAM?.bimestre || 'Villa_Concha').replace(/\s+/g, '_')}.pdf`;
    pdf.save(filename);
    showToast('PDF descargado exitosamente', 'success');
  } catch (error) {
    console.error('Error generando PDF:', error);
    showToast('Hubo un problema al generar el PDF', 'error');
  } finally {
    pdfExportMode = false;
    render();
  }
}

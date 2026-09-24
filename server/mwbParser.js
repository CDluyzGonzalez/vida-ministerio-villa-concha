// ============================================================
// VIDA Y MINISTERIO — VILLA CONCHA
// server/mwbParser.js
// Extractor y Parser oficial de la Guía de Actividades (MWB / EPUB de JW CDN)
// ============================================================

import AdmZip from 'adm-zip';
import * as cheerio from 'cheerio';

const BIMESTRES_INFO = {
  '01': { name: 'Enero - Febrero', cleanId: 'enero-febrero' },
  '03': { name: 'Marzo - Abril', cleanId: 'marzo-abril' },
  '05': { name: 'Mayo - Junio', cleanId: 'mayo-junio' },
  '07': { name: 'Julio - Agosto', cleanId: 'julio-agosto' },
  '09': { name: 'Septiembre - Octubre', cleanId: 'septiembre-octubre' },
  '11': { name: 'Noviembre - Diciembre', cleanId: 'noviembre-diciembre' }
};

/**
 * Descarga y analiza la publicación oficial MWB en EPUB para un bimestre específico
 * @param {number|string} year - Ej: 2026
 * @param {string} issueMonth - '01', '03', '05', '07', '09', '11'
 * @returns {Promise<Object>} Estructura del programa compatible con Villa Concha
 */
export async function fetchAndParseMwbBimestre(year, issueMonth) {
  const y = String(year).trim();
  const m = String(issueMonth).padStart(2, '0');
  const info = BIMESTRES_INFO[m];

  if (!info) {
    throw new Error(`Mes de publicación no válido: "${issueMonth}". Use 01, 03, 05, 07, 09 o 11.`);
  }

  const issueCode = `${y}${m}`;
  const cdnApiUrl = `https://b.jw-cdn.org/apis/pub-media/GETPUBMEDIALINKS?output=json&pub=mwb&issue=${issueCode}&langwritten=S`;

  console.log(`[mwbParser] Consultando CDN de JW para issue: ${issueCode}...`);
  const cdnRes = await fetch(cdnApiUrl);
  if (!cdnRes.ok) {
    throw new Error(`Error al consultar CDN de JW (${cdnRes.status} ${cdnRes.statusText})`);
  }

  const cdnData = await cdnRes.json();
  const epubList = cdnData?.files?.S?.EPUB;
  if (!Array.isArray(epubList) || epubList.length === 0 || !epubList[0]?.file?.url) {
    throw new Error(`La Guía de Actividades oficial para ${info.name} ${y} aún no está disponible para descarga.`);
  }

  const epubUrl = epubList[0].file.url;
  console.log(`[mwbParser] Descargando archivo EPUB desde: ${epubUrl}`);

  const epubRes = await fetch(epubUrl);
  if (!epubRes.ok) {
    throw new Error(`Error al descargar el archivo EPUB (${epubRes.status} ${epubRes.statusText})`);
  }

  const buffer = Buffer.from(await epubRes.arrayBuffer());
  const zip = new AdmZip(buffer);

  // Filtrar archivos de las semanas que contengan el contenido de la reunión (TESOROS DE LA BIBLIA)
  const weekEntries = zip.getEntries()
    .filter(e => /OEBPS\/.*\.xhtml$/i.test(e.entryName) && !e.entryName.includes('-extracted') && !e.entryName.includes('cover') && !e.entryName.includes('toc'))
    .filter(e => {
      const txt = zip.readAsText(e);
      return /TESOROS DE LA BIBLIA/i.test(txt);
    })
    .sort((a, b) => a.entryName.localeCompare(b.entryName));

  if (weekEntries.length === 0) {
    throw new Error('No se encontraron capítulos de semanas en el archivo de la publicación.');
  }

  console.log(`[mwbParser] ${weekEntries.length} semanas encontradas en el archivo.`);

  const weeks = [];

  weekEntries.forEach((entry, weekIdx) => {
    const html = zip.readAsText(entry);
    const parsedWeek = parseMwbWeekHtml(html, weekIdx, y, info.cleanId);
    weeks.push(parsedWeek);
  });

  return {
    id: info.cleanId,
    bimestre: info.name,
    weeks
  };
}

/**
 * Parsea el HTML de un archivo de semana de la Guía de Actividades
 */
function parseMwbWeekHtml(html, weekIndex, year, cleanId) {
  const $ = cheerio.load(html);

  // 1. Rango de fecha y lectura bíblica
  const rawH1 = ($('header h1').text() || $('h1').first().text()).replace(/\u00a0/g, ' ').trim();
  const rawH2 = ($('header h2').text() || $('h2').first().text()).replace(/\u00a0/g, ' ').trim();

  // Normalizar título: "Semana 2-8 De Noviembre 2026"
  const semanaTitle = rawH1
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/\s+/g, ' ')
    .trim();

  let semana;
  if (weekIndex === 0) {
    semana = /\b\d{4}\b/.test(semanaTitle) ? `Semana ${semanaTitle}` : `Semana ${semanaTitle} ${year}`;
  } else {
    semana = `Semana ${semanaTitle}`;
  }
  const lectura_semanal = `Lectura semanal de la Biblia ${rawH2.toUpperCase()}`;

  // 2. Extraer números de canción del texto
  const bodyText = $('body').text().replace(/\u00a0/g, ' ');
  const songMatches = [...bodyText.matchAll(/Canción\s+(\d+)/gi)].map(m => m[1]);
  const firstSong = songMatches[0] || '1';
  const midSong = songMatches[1] || '2';
  const lastSong = songMatches[songMatches.length - 1] || '3';

  const items = [];

  // Apertura
  items.push({
    section: 'OPEN',
    label: `Canción ${firstSong} y oración`,
    name: ''
  });

  items.push({
    section: 'INTRO',
    label: 'Palabras de introducción (1 min.)',
    name: ''
  });

  // 3. Secciones principales
  let currentSection = 'TESOROS';
  let itemCounter = 1;

  $('body').find('h2, h3').each((_, el) => {
    const text = $(el).text().trim();

    if (/TESOROS DE LA BIBLIA/i.test(text)) {
      currentSection = 'TESOROS';
      return;
    }
    if (/SEAMOS MEJORES MAESTROS/i.test(text)) {
      currentSection = 'MAESTROS';
      return;
    }
    if (/NUESTRA VIDA CRISTIANA/i.test(text)) {
      currentSection = 'NVC';
      // Canción intermedia
      items.push({
        section: 'NVC',
        label: `Canción ${midSong}`
      });
      return;
    }
    if (/Palabras de conclusión/i.test(text) || /Canción\s+\d+\s+y\s+oración/i.test(text)) {
      return;
    }

    // Puntos numerados (ej: "1. Título")
    const matchPoint = text.match(/^(\d+)\.\s+(.+)$/);
    if (matchPoint) {
      const pTitle = matchPoint[2].trim();

      // Extraer minutos y detalles del elemento inmediatamente posterior (div o p)
      const nextSibling = $(el).next();
      const nextText = nextSibling.text().trim();
      const minMatch = nextText.match(/\((\d+)\s*mins?\.\)/i);
      const minutes = minMatch ? minMatch[0] : '';

      let fullLabel = `${pTitle} ${minutes}`.trim();

      if (currentSection === 'TESOROS') {
        if (/lectura de la biblia/i.test(pTitle)) {
          // Extraer todo el detalle después de los minutos (ej: Jer 50:24-40 (th lección 11).)
          const afterMins = nextText.replace(/\(\d+\s*mins?\.\)/i, '').trim();
          fullLabel = `Lectura de la Biblia ${minutes} ${afterMins}`.trim();
        }
        items.push({
          section: 'TESOROS',
          num: itemCounter++,
          label: fullLabel,
          name: ''
        });
      } else if (currentSection === 'MAESTROS') {
        const isDiscurso = /discurso/i.test(pTitle);
        // Extraer lección si existe (lmd lección X punto Y)
        const lmdMatch = nextText.match(/\(lmd\s+lecci[oó]n\s+[^)]+\)/i) || nextText.match(/\(th\s+lecci[oó]n\s+[^)]+\)/i);
        const lmdInfo = lmdMatch ? ` ${lmdMatch[0]}` : '';
        fullLabel = `${pTitle} ${minutes}${lmdInfo}`.trim();

        if (isDiscurso) {
          items.push({
            section: 'MAESTROS',
            num: itemCounter++,
            label: fullLabel,
            name: ''
          });
        } else {
          items.push({
            section: 'MAESTROS',
            num: itemCounter++,
            label: fullLabel,
            subs: [
              { name: '', role: 'Nombre' },
              { name: '', role: 'Ayudante' }
            ]
          });
        }
      } else if (currentSection === 'NVC') {
        if (/estudio b[ií]blico de la congregaci[oó]n/i.test(pTitle)) {
          items.push({
            section: 'NVC',
            num: itemCounter++,
            label: `Estudio bíblico de la congregación ${minutes || '(30 mins.)'}`.trim(),
            conductor: '',
            lector: ''
          });
        } else {
          items.push({
            section: 'NVC',
            num: itemCounter++,
            label: fullLabel,
            name: ''
          });
        }
      }
    }
  });

  // Conclusión y Cierre
  items.push({
    section: 'CONCLUSION',
    label: 'Palabras de conclusión (3 min.)',
    name: ''
  });

  items.push({
    section: 'CLOSE',
    label: `Canción ${lastSong} y oración`,
    name: ''
  });

  return {
    id: `${cleanId}__${weekIndex}`,
    semana,
    lectura_semanal,
    items
  };
}

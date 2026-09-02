// ============================================================
// VIDA Y MINISTERIO — VILLA CONCHA
// scripts/migrate_firestore.js
// Script de Migración y Normalización a Modelo Híbrido Firestore
// ============================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../server/firestore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Helper para normalizar nombres
function normName(s) {
  return (s || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[´'`.]/g, '')
    .replace(/\s+/g, ' ');
}

// Cargar y evaluar archivos de datos JS
function loadJsData(filePath) {
  try {
    const fullPath = path.join(rootDir, filePath);
    if (!fs.existsSync(fullPath)) return null;
    let content = fs.readFileSync(fullPath, 'utf8');
    // Eliminar 'const VARIABLE = ' o 'let VARIABLE = ' para extraer JSON
    content = content.replace(/^[\s\S]*?=\s*({|\[)/, '$1').replace(/;\s*$/, '');
    return JSON.parse(content);
  } catch (error) {
    console.warn(`No se pudo cargar ${filePath}:`, error.message);
    return null;
  }
}

async function migrate() {
  console.log('🚀 Iniciando migración y normalización hacia Firestore...');

  const rawPeople = loadJsData('js/data/people.js') || [];
  const rawVarones = loadJsData('js/data/varones.js') || [];
  const rawMarzoAbril = loadJsData('js/data/marzo-abril.js');
  const rawMayoJunio = loadJsData('js/data/mayo-junio.js');
  const rawJulioAgosto = loadJsData('js/data/julio-agosto.js');
  const rawSeptOct = loadJsData('js/data/septiembre-octubre.js');

  // Mapa de varones para enriquecer privilegios de lectura
  const varonesMap = new Map();
  rawVarones.forEach(v => {
    varonesMap.set(normName(v.nombre), v);
  });

  // 1. Normalizar Personas y Privilegios
  const normalizedPeople = rawPeople.map((p, index) => {
    const norm = normName(p.nombre);
    const varonInfo = varonesMap.get(norm);
    const privilegios = [];

    // Separación explícita: Seamos Mejores Maestros
    if (p.elig_maestros_lectura) {
      privilegios.push('maestros');
    }

    // Separación explícita: Lectura de la Biblia (de varones o de maestros)
    if (varonInfo?.lectura_biblia || (varonInfo && p.elig_maestros_lectura)) {
      privilegios.push('lectura_biblia');
    }

    // Privilegio exclusivo: ¿Qué diría?
    // Inicialmente habilitado para publicadores con privilegio de maestros
    if (p.elig_maestros_lectura && varonInfo) {
      privilegios.push('que_diria');
    }

    if (p.elig_perlas || varonInfo?.perlas) privilegios.push('perlas');
    if (p.elig_parte1 || varonInfo?.tesoros) privilegios.push('tesoros_p1');
    if (p.elig_nvc || varonInfo?.oradores) privilegios.push('nvc');
    if (p.elig_estudio_biblico || varonInfo?.dirigir_estudio) privilegios.push('estudio_conductor');
    if (varonInfo?.lector_atalaya_libro) privilegios.push('estudio_lector');
    if (p.elig_intro_conclusion) privilegios.push('intro_conclusion');
    if (p.elig_oraciones || varonInfo?.orar_publico) privilegios.push('oraciones');

    return {
      id: p.id || `p_${index + 1}`,
      nombre: p.nombre.trim(),
      nota: p.nota || '',
      genero: varonInfo ? 'M' : 'F',
      estado: 'activo',
      privilegios: Array.from(new Set(privilegios)),
      disponibilidad: p.disponibilidad || {},
      actualizado_en: new Date().toISOString()
    };
  });

  console.log(`✅ Procesados ${normalizedPeople.length} publicadores con privilegios normalizados.`);

  // 2. Programas Bimestrales Normalizados
  const bimestresData = [
    { id: '2026-marzo-abril', nombre: 'Marzo - Abril', anio: 2026, orden: 2, data: rawMarzoAbril },
    { id: '2026-mayo-junio', nombre: 'Mayo - Junio', anio: 2026, orden: 3, data: rawMayoJunio },
    { id: '2026-julio-agosto', nombre: 'Julio - Agosto', anio: 2026, orden: 4, data: rawJulioAgosto },
    { id: '2026-septiembre-octubre', nombre: 'Septiembre - Octubre', anio: 2026, orden: 5, data: rawSeptOct }
  ];

  // 3. Guardar en Firestore si está conectado o generar archivo local
  const backupExport = {
    migrated_at: new Date().toISOString(),
    personas: normalizedPeople,
    programas: bimestresData.map(b => ({
      id: b.id,
      bimestre: b.nombre,
      anio: b.anio,
      orden: b.orden,
      weeks: b.data?.weeks || []
    }))
  };

  const exportPath = path.join(rootDir, 'database', 'migrated_seed_data.json');
  fs.mkdirSync(path.join(rootDir, 'database'), { recursive: true });
  fs.writeFileSync(exportPath, JSON.stringify(backupExport, null, 2), 'utf8');
  console.log(`📁 Copia de respaldo normalizada guardada en: ${exportPath}`);

  if (db) {
    console.log('☁ Subiendo a Google Cloud Firestore...');
    const batch = db.batch();

    // Guardar personas
    for (const persona of normalizedPeople) {
      const ref = db.collection('personas').doc(persona.id);
      batch.set(ref, persona, { merge: true });
    }

    // Guardar programas
    for (const b of backupExport.programas) {
      const ref = db.collection('programas').doc(b.id);
      batch.set(ref, b, { merge: true });
    }

    await batch.commit();
    console.log('🎉 Migración completada exitosamente en Firestore.');
  } else {
    console.log('ℹ️ Firestore no está conectado en este entorno local. Los datos normalizados quedaron listos en database/migrated_seed_data.json.');
  }
}

migrate().catch(console.error);

// ============================================================
// VIDA Y MINISTERIO — VILLA CONCHA
// server/server.js
// Servidor Express Backend y API REST Resiliente con Firestore y Fallback
// ============================================================

import express from 'express';
import cors from 'cors';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { db, isConnected, localData } from './firestore.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const app = express();
const PORT = process.env.PORT || 8080;
const ADMIN_PIN_HASH = process.env.ADMIN_PIN_HASH || '79404babda0441a8756da8dc02bae87094fd393739678ccd7f36f90127f651b8';

// Middlewares
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Servir frontend estático (PWA) sin caché
app.use(express.static(rootDir, {
  maxAge: 0,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));

// ============================================================
// HELPER: Normalizar ID de Bimestre
// ============================================================
function sanitizeBimestreId(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Generador de plantilla limpia para bimestres sin datos previos
function generateEmptyBimestre(name) {
  const template = localData?.programas?.[0] || {
    bimestre: name,
    weeks: []
  };

  const clean = JSON.parse(JSON.stringify(template));
  clean.id = sanitizeBimestreId(name);
  clean.bimestre = name;

  clean.weeks = (clean.weeks || []).map((w, idx) => {
    const nw = JSON.parse(JSON.stringify(w));
    nw.id = `${sanitizeBimestreId(name)}__${idx}`;
    nw.items = (nw.items || []).map(it => {
      const ni = JSON.parse(JSON.stringify(it));
      if (ni.hasOwnProperty('name')) ni.name = '';
      if (ni.hasOwnProperty('conductor')) ni.conductor = '';
      if (ni.hasOwnProperty('lector')) ni.lector = '';
      if (Array.isArray(ni.subs)) {
        ni.subs = ni.subs.map(s => ({ ...s, name: '' }));
      }
      return ni;
    });
    return nw;
  });

  return clean;
}

// ============================================================
// ENDPOINTS DE SALUD Y DIAGNÓSTICO
// ============================================================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    firestore: isConnected ? 'connected' : 'local_storage_mode',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Verificar PIN de administrador
app.post('/api/auth/verify', (req, res) => {
  const { pinHash, pin } = req.body || {};
  let valid = false;

  if (pin) {
    const hashFromPin = crypto.createHash('sha256').update(String(pin).trim()).digest('hex');
    if (hashFromPin.toLowerCase() === ADMIN_PIN_HASH.toLowerCase()) {
      valid = true;
    }
  }

  if (!valid && pinHash) {
    if (String(pinHash).trim().toLowerCase() === ADMIN_PIN_HASH.toLowerCase()) {
      valid = true;
    }
  }

  res.json({ authorized: valid, token: valid ? ADMIN_PIN_HASH : null });
});

// ============================================================
// ENDPOINTS: BIMESTRES Y PROGRAMA
// ============================================================

// Obtener lista de bimestres disponibles
app.get('/api/bimestres', async (req, res) => {
  const standardList = [
    { id: '2026-enero-febrero', nombre: 'Enero - Febrero', anio: 2026, orden: 1 },
    { id: '2026-marzo-abril', nombre: 'Marzo - Abril', anio: 2026, orden: 2 },
    { id: '2026-mayo-junio', nombre: 'Mayo - Junio', anio: 2026, orden: 3 },
    { id: '2026-julio-agosto', nombre: 'Julio - Agosto', anio: 2026, orden: 4 },
    { id: '2026-septiembre-octubre', nombre: 'Septiembre - Octubre', anio: 2026, orden: 5 },
    { id: '2026-noviembre-diciembre', nombre: 'Noviembre - Diciembre', anio: 2026, orden: 6 }
  ];

  try {
    if (db) {
      try {
        const snapshot = await db.collection('programas').get();
        if (!snapshot.empty) {
          const cloudBims = snapshot.docs.map(doc => {
            const d = doc.data();
            return {
              id: doc.id,
              nombre: d.bimestre || doc.id,
              anio: d.anio || 2026,
              orden: d.orden || 1
            };
          });

          // Combinar con la lista estándar
          const existingNames = new Set(cloudBims.map(b => b.nombre));
          standardList.forEach(sb => {
            if (!existingNames.has(sb.nombre)) cloudBims.push(sb);
          });

          return res.json({ ok: true, bimestres: cloudBims });
        }
      } catch (firestoreError) {
        console.warn('Firestore bimestres query error:', firestoreError.message);
      }
    }

    // Fallback con datos locales
    return res.json({ ok: true, bimestres: standardList });
  } catch (error) {
    console.error('Error general al obtener bimestres:', error);
    res.json({ ok: true, bimestres: standardList });
  }
});

// Obtener el programa de un bimestre
app.get('/api/programa/:bimestreId', async (req, res) => {
  const { bimestreId } = req.params;
  const cleanId = sanitizeBimestreId(bimestreId);

  try {
    if (db) {
      try {
        // 1. Buscar por ID directo
        let doc = await db.collection('programas').doc(cleanId).get();
        if (doc.exists) {
          return res.json({ ok: true, programa: { id: doc.id, ...doc.data() } });
        }

        // 2. Buscar por ID con prefijo 2026-
        doc = await db.collection('programas').doc(`2026-${cleanId}`).get();
        if (doc.exists) {
          return res.json({ ok: true, programa: { id: doc.id, ...doc.data() } });
        }

        // 3. Buscar por campo 'bimestre'
        const snap = await db.collection('programas').where('bimestre', '==', bimestreId).limit(1).get();
        if (!snap.empty) {
          const found = snap.docs[0];
          return res.json({ ok: true, programa: { id: found.id, ...found.data() } });
        }
      } catch (firestoreError) {
        console.warn(`Firestore programa query error (${bimestreId}):`, firestoreError.message);
      }
    }

    // Buscar en localData
    const localProg = localData?.programas?.find(p => p.id === cleanId || p.id === `2026-${cleanId}` || p.bimestre.toLowerCase().includes(bimestreId.toLowerCase()));
    if (localProg) {
      return res.json({ ok: true, programa: localProg });
    }

    // Si el bimestre es nuevo (ej. Noviembre - Diciembre o Enero - Febrero), generar plantilla limpia
    const generated = generateEmptyBimestre(bimestreId);
    return res.json({ ok: true, programa: generated });
  } catch (error) {
    console.error(`Error al obtener programa ${bimestreId}:`, error);
    const fallback = generateEmptyBimestre(bimestreId);
    res.json({ ok: true, programa: fallback });
  }
});

// Guardar/Actualizar programa completo de un bimestre
app.put('/api/programa/:bimestreId', async (req, res) => {
  const { bimestreId } = req.params;
  const { weeks, bimestre, token } = req.body;
  const cleanId = sanitizeBimestreId(bimestre || bimestreId);

  if (token && String(token).trim().toLowerCase() !== ADMIN_PIN_HASH.trim().toLowerCase()) {
    return res.status(401).json({ ok: false, error: 'Token no autorizado' });
  }

  try {
    const dataToSave = {
      id: cleanId,
      bimestre: bimestre || bimestreId,
      weeks: weeks || [],
      actualizado_en: new Date().toISOString()
    };

    if (db) {
      try {
        const docRef = db.collection('programas').doc(cleanId);
        await docRef.set(dataToSave);
        // También guardar con prefijo 2026- para compatibilidad total
        const docRef2026 = db.collection('programas').doc(`2026-${cleanId}`);
        await docRef2026.set(dataToSave);
      } catch (firestoreError) {
        console.warn('Firestore write warning:', firestoreError.message);
        return res.status(500).json({ ok: false, error: 'Error en base de datos: ' + firestoreError.message });
      }
    }

    // Actualizar copia local en memoria
    if (!localData.programas) localData.programas = [];
    const idx = localData.programas.findIndex(p => p.id === cleanId || p.id === `2026-${cleanId}` || p.bimestre === dataToSave.bimestre);
    if (idx >= 0) {
      localData.programas[idx] = { ...localData.programas[idx], ...dataToSave };
    } else {
      localData.programas.push(dataToSave);
    }

    res.json({ ok: true, message: 'Programa guardado correctamente', programa: dataToSave });
  } catch (error) {
    console.error(`Error al guardar programa ${bimestreId}:`, error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ============================================================
// ENDPOINTS: PUBLICADORES (PERSONAS)
// ============================================================

// Obtener todos los publicadores
app.get('/api/personas', async (req, res) => {
  try {
    if (db) {
      try {
        const snapshot = await db.collection('personas').get();
        if (!snapshot.empty) {
          const personas = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '', 'es'));
          return res.json({ ok: true, personas });
        }
      } catch (firestoreError) {
        console.warn('Firestore personas query error:', firestoreError.message);
      }
    }

    // Fallback a localData
    if (localData?.personas?.length > 0) {
      return res.json({ ok: true, personas: localData.personas });
    }

    return res.json({ ok: true, personas: [] });
  } catch (error) {
    console.error('Error al obtener personas:', error);
    res.json({ ok: true, personas: localData?.personas || [] });
  }
});

// Guardar o actualizar publicador individual
app.post('/api/personas', async (req, res) => {
  const { persona, token } = req.body || {};

  if (token && String(token).trim().toLowerCase() !== ADMIN_PIN_HASH.trim().toLowerCase()) {
    return res.status(401).json({ ok: false, error: 'Token no autorizado' });
  }

  if (!persona || !persona.id || !persona.nombre) {
    return res.status(400).json({ ok: false, error: 'Datos de persona incompletos' });
  }

  try {
    const personaClean = {
      id: String(persona.id),
      nombre: String(persona.nombre).trim(),
      genero: persona.genero || 'M',
      nota: persona.nota || '',
      estado: persona.estado || 'activo',
      privilegios: Array.isArray(persona.privilegios) ? persona.privilegios : [],
      actualizado_en: new Date().toISOString()
    };

    if (db) {
      try {
        const docRef = db.collection('personas').doc(String(personaClean.id));
        await docRef.set(personaClean); // Sin merge para reemplazar exactamente los privilegios
      } catch (firestoreError) {
        console.warn('Firestore single persona write error:', firestoreError.message);
        return res.status(500).json({ ok: false, error: 'Error en base de datos: ' + firestoreError.message });
      }
    }

    if (!localData.personas) localData.personas = [];
    const idx = localData.personas.findIndex(p => String(p.id) === String(personaClean.id));
    if (idx >= 0) {
      localData.personas[idx] = personaClean;
    } else {
      localData.personas.push(personaClean);
    }

    res.json({ ok: true, persona: personaClean, message: 'Publicador guardado correctamente' });
  } catch (error) {
    console.error('Error al guardar persona:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Eliminar publicador individual
app.delete('/api/personas/:id', async (req, res) => {
  const { id } = req.params;
  const token = req.headers['x-admin-token'] || req.query.token || req.body?.token;

  if (token && String(token).trim().toLowerCase() !== ADMIN_PIN_HASH.trim().toLowerCase()) {
    return res.status(401).json({ ok: false, error: 'Token no autorizado' });
  }

  try {
    if (db) {
      try {
        await db.collection('personas').doc(String(id)).delete();
      } catch (firestoreError) {
        console.warn(`Firestore delete persona error for ${id}:`, firestoreError.message);
        return res.status(500).json({ ok: false, error: 'Error en base de datos: ' + firestoreError.message });
      }
    }

    if (Array.isArray(localData.personas)) {
      localData.personas = localData.personas.filter(p => String(p.id) !== String(id));
    }

    res.json({ ok: true, id, message: 'Publicador eliminado correctamente' });
  } catch (error) {
    console.error(`Error al eliminar persona ${id}:`, error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Guardar o actualizar lote completo de publicadores
app.post('/api/personas/batch', async (req, res) => {
  const { personas, token } = req.body || {};

  if (token && String(token).trim().toLowerCase() !== ADMIN_PIN_HASH.trim().toLowerCase()) {
    return res.status(401).json({ ok: false, error: 'Token no autorizado' });
  }

  if (!Array.isArray(personas)) {
    return res.status(400).json({ ok: false, error: 'Formato inválido' });
  }

  try {
    if (db) {
      try {
        const batch = db.batch();
        const sentIds = new Set(personas.map(p => String(p.id)));

        // Upsert todas las personas enviadas
        personas.forEach(p => {
          const docRef = db.collection('personas').doc(String(p.id));
          batch.set(docRef, p);
        });

        // Eliminar personas que ya no están en la lista
        try {
          const snapshot = await db.collection('personas').get();
          snapshot.docs.forEach(doc => {
            if (!sentIds.has(String(doc.id))) {
              batch.delete(doc.ref);
            }
          });
        } catch (readErr) {
          console.warn('No se pudo leer personas para cleanup:', readErr.message);
        }

        await batch.commit();
      } catch (firestoreError) {
        console.warn('Firestore personas batch write error:', firestoreError.message);
      }
    }

    localData.personas = personas;
    res.json({ ok: true, count: personas.length, message: 'Publicadores sincronizados' });
  } catch (error) {
    console.error('Error al guardar personas:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ============================================================
// ENDPOINTS DE SALIDAS AL SERVICIO (PREDICACIÓN)
// ============================================================

// Obtener salidas al servicio de un mes específico (ej: '2026-09')
app.get('/api/salidas/:mesId', async (req, res) => {
  const { mesId } = req.params;
  const cleanId = String(mesId || '').trim();

  if (!cleanId) {
    return res.status(400).json({ ok: false, error: 'mesId es requerido' });
  }

  try {
    // 1. Si Firestore está conectado, buscar en la colección 'salidas'
    if (db) {
      try {
        const docRef = db.collection('salidas').doc(cleanId);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
          return res.json({ ok: true, source: 'firestore', salidas: docSnap.data() });
        }
      } catch (firestoreError) {
        console.warn(`Error al consultar Firestore salidas/${cleanId}:`, firestoreError.message);
      }
    }

    // 2. Si no existe en Firestore o no está conectado, buscar en localData
    if (!localData.salidas) localData.salidas = {};
    if (localData.salidas[cleanId]) {
      return res.json({ ok: true, source: 'local', salidas: localData.salidas[cleanId] });
    }

    // 3. Fallback: Si es el mes semilla de Septiembre 2026 y no existe, retornar plantilla base
    const defaultData = getDefaultSalidasForMonth(cleanId);
    return res.json({ ok: true, source: 'seed_template', salidas: defaultData });
  } catch (error) {
    console.error(`Error al procesar GET /api/salidas/${cleanId}:`, error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Guardar o actualizar salidas al servicio de un mes (requiere PIN de admin)
app.put('/api/salidas/:mesId', async (req, res) => {
  const { mesId } = req.params;
  const { salidas, token } = req.body || {};
  const cleanId = String(mesId || '').trim();

  if (token && String(token).trim().toLowerCase() !== ADMIN_PIN_HASH.trim().toLowerCase()) {
    return res.status(401).json({ ok: false, error: 'Token no autorizado' });
  }

  if (!cleanId || !salidas || typeof salidas !== 'object') {
    return res.status(400).json({ ok: false, error: 'Datos inválidos' });
  }

  try {
    salidas.id = cleanId;
    salidas.actualizado_en = new Date().toISOString();

    if (db) {
      try {
        const docRef = db.collection('salidas').doc(cleanId);
        await docRef.set(salidas, { merge: true });
      } catch (firestoreError) {
        console.warn(`Error al escribir salidas/${cleanId} en Firestore:`, firestoreError.message);
      }
    }

    if (!localData.salidas) localData.salidas = {};
    localData.salidas[cleanId] = salidas;

    res.json({ ok: true, mesId: cleanId, message: 'Salidas al servicio guardadas correctamente' });
  } catch (error) {
    console.error(`Error al guardar salidas/${cleanId}:`, error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ============================================================
// CATÁLOGO DE LUGARES DE SALIDA FRECUENTES
// ============================================================

const DEFAULT_LUGARES = [
  { id: 'lug_1', nombre: 'Mileydis Rodriguez (San Francisco) Calle 1F # 16-68' },
  { id: 'lug_2', nombre: 'Familia Quiñonez (San Carlos) Calle 1D 16-39' },
  { id: 'lug_3', nombre: 'Familia Prada (San Carlos) Carrera 17A # 1N-54' },
  { id: 'lug_4', nombre: 'Predicación por carta / llamadas telefónicas' },
  { id: 'lug_5', nombre: 'Vereda Limonal Casa los Pinos' },
  { id: 'lug_6', nombre: 'Patricia Avila (San Francisco) Carrera 18 # 1E-16' },
  { id: 'lug_7', nombre: 'Familia Prieto (San Francisco) Cll. 1E # 15-23' },
  { id: 'lug_8', nombre: 'Salón del Reino (Punto de salida)' }
];

// Obtener lista de lugares frecuentes
app.get('/api/lugares-salidas', async (req, res) => {
  try {
    if (db) {
      try {
        const docRef = db.collection('configuracion').doc('lugares_salidas');
        const snap = await docRef.get();
        if (snap.exists && Array.isArray(snap.data()?.lugares)) {
          return res.json({ ok: true, source: 'firestore', lugares: snap.data().lugares });
        }
      } catch (fErr) {
        console.warn('Error al leer lugares de Firestore:', fErr.message);
      }
    }

    if (Array.isArray(localData.lugares_salidas)) {
      return res.json({ ok: true, source: 'local', lugares: localData.lugares_salidas });
    }

    res.json({ ok: true, source: 'default', lugares: DEFAULT_LUGARES });
  } catch (error) {
    console.error('Error al obtener lugares:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Guardar lista completa de lugares frecuentes
app.put('/api/lugares-salidas', async (req, res) => {
  const { lugares, token } = req.body || {};

  if (token && String(token).trim().toLowerCase() !== ADMIN_PIN_HASH.trim().toLowerCase()) {
    return res.status(401).json({ ok: false, error: 'Token no autorizado' });
  }

  if (!Array.isArray(lugares)) {
    return res.status(400).json({ ok: false, error: 'Formato de lugares inválido' });
  }

  try {
    if (db) {
      try {
        const docRef = db.collection('configuracion').doc('lugares_salidas');
        await docRef.set({ lugares, actualizado_en: new Date().toISOString() }, { merge: true });
      } catch (fErr) {
        console.warn('Error al guardar lugares en Firestore:', fErr.message);
      }
    }

    localData.lugares_salidas = lugares;
    res.json({ ok: true, count: lugares.length, message: 'Lugares guardados correctamente' });
  } catch (error) {
    console.error('Error al guardar lugares:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Helper para generar estructura por defecto si no existe
function getDefaultSalidasForMonth(mesId) {
  const [yearStr, monthStr] = (mesId || '2026-09').split('-');
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const mIndex = parseInt(monthStr, 10) - 1;
  const mesNombre = (mIndex >= 0 && mIndex < 12) ? monthNames[mIndex] : 'Mes';
  const anio = parseInt(yearStr, 10) || 2026;

  // Si es Septiembre 2026, proveer los datos reales iniciales
  if (mesId === '2026-09') {
    return {
      id: '2026-09',
      mes: 'Septiembre',
      anio: 2026,
      titulo: 'HORARIOS DE PREDICACIÓN SEPTIEMBRE 2026',
      lunes_especial: {
        activo: false,
        fecha: 'Lunes 14 de Septiembre',
        hora: '8:45 a.m.',
        lugar: 'Salón del Reino (Punto de salida)',
        capitan: '',
        destino: 'Territorio Vereda Limonal (Sector Alto)'
      },
      entre_semana: [
        { id: 'es_mar', dia: 'Martes', hora: '8:45 a.m.', lugar: 'Mileydis Rodriguez (San Francisco) Calle 1F # 16-68', capitan: 'Eduardo Parra' },
        { id: 'es_mie', dia: 'Miércoles', hora: '8:45 a.m.', lugar: 'Familia Quiñonez (San Carlos) Calle 1D 16-39', capitan: 'Sergio Rojas' },
        { id: 'es_jue_am', dia: 'Jueves (Mañana)', hora: '8:45 a.m.', lugar: 'Familia Prada (San Carlos) Carrera 17A # 1N-54', capitan: 'Anderson Gómez' },
        { id: 'es_jue_pm', dia: 'Jueves (Tarde)', hora: '6:00 p.m.', lugar: 'Predicación por carta / llamadas telefónicas', nota: 'ZOOM', capitan: 'Eduardo Parra' },
        { id: 'es_vie_am', dia: 'Viernes (Mañana)', hora: '8:45 a.m.', lugar: 'Vereda Limonal Casa los Pinos', capitan: 'Wilmer Reyes' },
        { id: 'es_vie_pm', dia: 'Viernes (Tarde)', hora: '6:00 p.m.', lugar: 'Patricia Avila (San Francisco) Carrera 18 # 1E-16', capitan: 'Eliu Rodriguez' }
      ],
      sabados: [
        { id: 'sab_1', fecha: '5 de Septiembre', hora: '8:30 a.m.', lugar: 'Familia Prieto (San Francisco) Cll. 1E # 15-23', nota: 'PREDICACION POR CARTA', capitan: 'Johan Duarte' },
        { id: 'sab_2', fecha: '12 de Septiembre', hora: '8:30 a.m.', lugar: 'Familia Prieto (San Francisco) Cll. 1E # 15-23', nota: 'PREDICACION PUBLICA', capitan: 'Edgar Sandoval' },
        { id: 'sab_3', fecha: '19 de Septiembre', hora: '8:30 a.m.', lugar: 'Familia Prieto (San Francisco) Cll. 1E # 15-23', nota: 'TABLANCA', capitan: 'Eliu Rodriguez' },
        { id: 'sab_4', fecha: '26 de Septiembre', hora: '8:30 a.m.', lugar: 'Familia Prieto (San Francisco) Cll. 1E # 15-23', nota: 'PREDICACION PUBLICA', capitan: 'Johan Duarte' }
      ],
      domingos: [
        {
          id: 'dom_1',
          fecha: '6 de Septiembre',
          tipo: 'grupos',
          hora: '9:00 a.m.',
          salidas: [
            { grupo: 'Grupos 1, 2, 3, 4, 10', lugar: 'Familia Prada (San Carlos) Carrera 17A # 1N-54', capitan: 'Eduardo Parra' },
            { grupo: 'Grupos 5, 6, 7, 8, 9', lugar: 'Mileydis Rodriguez (San Francisco) Calle 1F # 16-68', capitan: 'Sergio Rojas' }
          ]
        },
        {
          id: 'dom_2',
          fecha: '13 de Septiembre',
          tipo: 'grupos',
          hora: '9:00 a.m.',
          salidas: [
            { grupo: 'Grupos 1, 2, 3, 4, 10', lugar: 'Familia Prada (San Carlos) Carrera 17A # 1N-54', capitan: 'Sergio Cespedes' },
            { grupo: 'Grupos 5, 6, 7, 8, 9', lugar: 'Mileydis Rodriguez (San Francisco) Calle 1F # 16-68', capitan: 'Nicolas Medina' }
          ]
        },
        {
          id: 'dom_3',
          fecha: '20 de Septiembre',
          tipo: 'general',
          hora: '9:00 a.m.',
          lugar: 'Familia Prada (San Carlos) Carrera 17A # 1N-54',
          capitan: 'Eliu Rodriguez'
        },
        {
          id: 'dom_4',
          fecha: '27 de Septiembre',
          tipo: 'grupos',
          hora: '9:00 a.m.',
          salidas: [
            { grupo: 'Grupos 1, 2, 3, 4, 10', lugar: 'Familia Prada (San Carlos) Carrera 17A # 1N-54', capitan: 'Anderson Gomez' },
            { grupo: 'Grupos 5, 6, 7, 8, 9', lugar: 'Mileydis Rodriguez (San Francisco) Calle 1F # 16-68', capitan: "Carlos D'Luyz" }
          ]
        }
      ]
    };
  }

  // Plantilla limpia para otros meses calculada con el calendario real
  const mNum = parseInt(monthStr, 10) || 1;
  const totalDays = new Date(anio, mNum, 0).getDate();
  const sabados = [];
  const domingos = [];
  const sabNotas = ['PREDICACION POR CARTA', 'PREDICACION PUBLICA', 'TABLANCA', 'PREDICACION PUBLICA', 'PREDICACION POR CARTA'];
  let sabCount = 0;
  let domCount = 0;

  for (let d = 1; d <= totalDays; d++) {
    const dt = new Date(anio, mIndex, d);
    const dow = dt.getDay(); // 0 = Domingo, 6 = Sábado
    if (dow === 6) {
      sabCount++;
      sabados.push({
        id: `sab_${sabCount}_${d}`,
        fecha: `${d} de ${mesNombre}`,
        hora: '8:30 a.m.',
        lugar: '',
        nota: sabNotas[(sabCount - 1) % sabNotas.length],
        capitan: ''
      });
    } else if (dow === 0) {
      domCount++;
      const isGeneral = domCount === 3;
      if (isGeneral) {
        domingos.push({
          id: `dom_${domCount}_${d}`,
          fecha: `${d} de ${mesNombre}`,
          tipo: 'general',
          hora: '9:00 a.m.',
          lugar: '',
          capitan: ''
        });
      } else {
        domingos.push({
          id: `dom_${domCount}_${d}`,
          fecha: `${d} de ${mesNombre}`,
          tipo: 'grupos',
          hora: '9:00 a.m.',
          salidas: [
            { grupo: 'Grupos 1, 2, 3, 4, 10', lugar: '', capitan: '' },
            { grupo: 'Grupos 5, 6, 7, 8, 9', lugar: '', capitan: '' }
          ]
        });
      }
    }
  }

  return {
    id: mesId,
    mes: mesNombre,
    anio: anio,
    titulo: `HORARIOS DE PREDICACIÓN ${mesNombre.toUpperCase()} ${anio}`,
    lunes_especial: {
      activo: false,
      fecha: '',
      hora: '8:45 a.m.',
      lugar: '',
      capitan: '',
      destino: ''
    },
    entre_semana: [
      { id: 'es_mar', dia: 'Martes', hora: '8:45 a.m.', lugar: '', capitan: '' },
      { id: 'es_mie', dia: 'Miércoles', hora: '8:45 a.m.', lugar: '', capitan: '' },
      { id: 'es_jue_am', dia: 'Jueves (Mañana)', hora: '8:45 a.m.', lugar: '', capitan: '' },
      { id: 'es_jue_pm', dia: 'Jueves (Tarde)', hora: '6:00 p.m.', lugar: 'Predicación por carta / llamadas', nota: 'ZOOM', capitan: '' },
      { id: 'es_vie_am', dia: 'Viernes (Mañana)', hora: '8:45 a.m.', lugar: '', capitan: '' },
      { id: 'es_vie_pm', dia: 'Viernes (Tarde)', hora: '6:00 p.m.', lugar: '', capitan: '' }
    ],
    sabados,
    domingos
  };
}

// ============================================================
// FALLBACK SPA
// ============================================================
app.get('*', (req, res) => {
  res.sendFile(path.join(rootDir, 'index.html'));
});

// Iniciar Servidor
app.listen(PORT, () => {
  console.log(`\n============================================================`);
  console.log(`🚀 Vida y Ministerio — Villa Concha (Servidor Activo)`);
  console.log(`📡 Puerto: ${PORT} | Modo: ${process.env.NODE_ENV || 'development'}`);
  console.log(`☁ Firestore: ${isConnected ? 'Conectado (Google Cloud)' : 'Modo Local'}`);
  console.log(`============================================================\n`);
});

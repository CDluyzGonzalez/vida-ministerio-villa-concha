// ============================================================
// VIDA Y MINISTERIO — VILLA CONCHA
// server/server.js
// Servidor Express Backend y API REST con Google Cloud Firestore
// ============================================================

import express from 'express';
import cors from 'cors';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
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

// Servir frontend estático (PWA) sin caché durante desarrollo
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
  const { pinHash } = req.body || {};
  const isValid = pinHash && pinHash.toLowerCase() === ADMIN_PIN_HASH.toLowerCase();
  res.json({ authorized: isValid });
});

// ============================================================
// ENDPOINTS: BIMESTRES Y PROGRAMA
// ============================================================

// Obtener lista de bimestres disponibles
app.get('/api/bimestres', async (req, res) => {
  try {
    if (db) {
      const snapshot = await db.collection('programas').get();
      if (!snapshot.empty) {
        const bimestres = snapshot.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            nombre: d.bimestre || doc.id,
            anio: d.anio || 2026,
            orden: d.orden || 1
          };
        });
        return res.json({ ok: true, bimestres });
      }
    }
    
    // Si hay programas en localData
    if (localData?.programas?.length > 0) {
      const bimestres = localData.programas.map(p => ({
        id: p.id,
        nombre: p.bimestre,
        anio: p.anio,
        orden: p.orden
      }));
      return res.json({ ok: true, bimestres });
    }

    // Fallback estándar
    return res.json({
      ok: true,
      bimestres: [
        { id: '2026-marzo-abril', nombre: 'Marzo - Abril', anio: 2026, orden: 2 },
        { id: '2026-mayo-junio', nombre: 'Mayo - Junio', anio: 2026, orden: 3 },
        { id: '2026-julio-agosto', nombre: 'Julio - Agosto', anio: 2026, orden: 4 },
        { id: '2026-septiembre-octubre', nombre: 'Septiembre - Octubre', anio: 2026, orden: 5 }
      ]
    });
  } catch (error) {
    console.error('Error al obtener bimestres:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Obtener el programa de un bimestre
app.get('/api/programa/:bimestreId', async (req, res) => {
  const { bimestreId } = req.params;
  const cleanId = sanitizeBimestreId(bimestreId);

  try {
    if (db) {
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
    }

    // Buscar en localData
    const localProg = localData?.programas?.find(p => p.id === cleanId || p.id === `2026-${cleanId}` || p.bimestre.toLowerCase().includes(bimestreId.toLowerCase()));
    if (localProg) {
      return res.json({ ok: true, programa: localProg });
    }

    return res.status(404).json({ ok: false, message: 'Programa no encontrado' });
  } catch (error) {
    console.error(`Error al obtener programa ${bimestreId}:`, error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Guardar/Actualizar programa completo de un bimestre
app.put('/api/programa/:bimestreId', async (req, res) => {
  const { bimestreId } = req.params;
  const { weeks, bimestre, token } = req.body;
  const cleanId = sanitizeBimestreId(bimestre || bimestreId);

  if (token && token !== ADMIN_PIN_HASH) {
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
      const docRef = db.collection('programas').doc(cleanId);
      await docRef.set(dataToSave, { merge: true });
    }

    // Actualizar copia local
    if (localData?.programas) {
      const idx = localData.programas.findIndex(p => p.id === cleanId || p.bimestre === dataToSave.bimestre);
      if (idx >= 0) {
        localData.programas[idx] = { ...localData.programas[idx], ...dataToSave };
      } else {
        localData.programas.push(dataToSave);
      }
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
      const snapshot = await db.collection('personas').get();
      if (!snapshot.empty) {
        const personas = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '', 'es'));
        return res.json({ ok: true, personas });
      }
    }

    // Fallback a localData
    if (localData?.personas?.length > 0) {
      return res.json({ ok: true, personas: localData.personas });
    }

    return res.json({ ok: true, personas: [] });
  } catch (error) {
    console.error('Error al obtener personas:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Guardar o actualizar lote completo de publicadores
app.post('/api/personas/batch', async (req, res) => {
  const { personas, token } = req.body;

  if (token && token !== ADMIN_PIN_HASH) {
    return res.status(401).json({ ok: false, error: 'Token no autorizado' });
  }

  if (!Array.isArray(personas)) {
    return res.status(400).json({ ok: false, error: 'Formato inválido' });
  }

  try {
    if (db) {
      const batch = db.batch();
      personas.forEach(p => {
        const docRef = db.collection('personas').doc(p.id);
        batch.set(docRef, p, { merge: true });
      });
      await batch.commit();
    }

    localData.personas = personas;
    res.json({ ok: true, count: personas.length, message: 'Publicadores guardados' });
  } catch (error) {
    console.error('Error al guardar personas:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

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

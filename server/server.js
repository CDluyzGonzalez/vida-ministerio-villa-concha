// ============================================================
// VIDA Y MINISTERIO — VILLA CONCHA
// server/server.js
// Servidor Backend Express & API REST para Google Cloud Run
// ============================================================

import express from 'express';
import cors from 'cors';
import compression from 'compression';
import path from 'path';
import fs from 'fs';
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

// Guardar cambios en archivo local si db no está disponible
function saveLocalBackup() {
  try {
    const seedPath = path.join(rootDir, 'database', 'migrated_seed_data.json');
    fs.writeFileSync(seedPath, JSON.stringify(localData, null, 2), 'utf8');
  } catch (e) {
    console.error('Error guardando respaldo local:', e);
  }
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

// ============================================================
// ENDPOINTS: BIMESTRES Y PROGRAMA
// ============================================================

// Obtener lista de bimestres disponibles
app.get('/api/bimestres', async (req, res) => {
  try {
    if (db) {
      const snapshot = await db.collection('bimestres').orderBy('orden', 'asc').get();
      if (!snapshot.empty) {
        const bimestres = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
  try {
    if (db) {
      const docRef = db.collection('programas').doc(bimestreId);
      const doc = await docRef.get();
      if (doc.exists) {
        return res.json({ ok: true, programa: { id: doc.id, ...doc.data() } });
      }
    }

    // Buscar en localData
    const localProg = localData?.programas?.find(p => p.id === bimestreId || p.bimestre.toLowerCase().includes(bimestreId.toLowerCase()));
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

  if (token && token !== ADMIN_PIN_HASH) {
    return res.status(401).json({ ok: false, error: 'Token no autorizado' });
  }

  try {
    const dataToSave = {
      id: bimestreId,
      bimestre: bimestre || bimestreId,
      weeks: weeks || [],
      actualizado_en: new Date().toISOString()
    };

    if (db) {
      const docRef = db.collection('programas').doc(bimestreId);
      await docRef.set(dataToSave, { merge: true });
    } else {
      // Guardar en localData
      const idx = localData.programas.findIndex(p => p.id === bimestreId);
      if (idx >= 0) {
        localData.programas[idx] = { ...localData.programas[idx], ...dataToSave };
      } else {
        localData.programas.push(dataToSave);
      }
      saveLocalBackup();
    }

    return res.json({ ok: true, message: 'Programa guardado exitosamente' });
  } catch (error) {
    console.error(`Error al guardar programa ${bimestreId}:`, error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ============================================================
// ENDPOINTS: PUBLICADORES / PERSONAS
// ============================================================

// Obtener todos los publicadores con sus privilegios normalizados
app.get('/api/personas', async (req, res) => {
  try {
    if (db) {
      const snapshot = await db.collection('personas').orderBy('nombre', 'asc').get();
      if (!snapshot.empty) {
        const personas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return res.json({ ok: true, personas });
      }
    }

    if (localData?.personas?.length > 0) {
      return res.json({ ok: true, personas: localData.personas });
    }

    return res.status(404).json({ ok: false, message: 'No hay publicadores registrados' });
  } catch (error) {
    console.error('Error al obtener personas:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Crear o actualizar un publicador
app.post('/api/personas', async (req, res) => {
  const { persona, token } = req.body;

  if (token && token !== ADMIN_PIN_HASH) {
    return res.status(401).json({ ok: false, error: 'No autorizado' });
  }

  if (!persona || !persona.nombre) {
    return res.status(400).json({ ok: false, error: 'Datos de publicador incompletos' });
  }

  try {
    const personaId = persona.id || `p_${Date.now()}`;
    const personaData = {
      ...persona,
      id: personaId,
      actualizado_en: new Date().toISOString()
    };

    if (db) {
      await db.collection('personas').doc(personaId).set(personaData, { merge: true });
    } else {
      const idx = localData.personas.findIndex(p => p.id === personaId);
      if (idx >= 0) {
        localData.personas[idx] = { ...localData.personas[idx], ...personaData };
      } else {
        localData.personas.push(personaData);
      }
      saveLocalBackup();
    }

    return res.json({ ok: true, persona: personaData });
  } catch (error) {
    console.error('Error al guardar persona:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ============================================================
// ENDPOINT: AUTENTICACIÓN ADMIN
// ============================================================

app.post('/api/auth/verify', (req, res) => {
  const { pinHash } = req.body;
  if (pinHash && pinHash.toLowerCase() === ADMIN_PIN_HASH.toLowerCase()) {
    return res.json({ ok: true, authorized: true, token: ADMIN_PIN_HASH });
  }
  return res.status(401).json({ ok: false, authorized: false, error: 'PIN incorrecto' });
});

// Redireccionar cualquier otra ruta al index.html de la PWA
app.get('*', (req, res) => {
  res.sendFile(path.join(rootDir, 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor Vida y Ministerio ejecutándose en http://localhost:${PORT}`);
});

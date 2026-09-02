// ============================================================
// VIDA Y MINISTERIO — VILLA CONCHA
// server/firestore.js
// Capa de Conexión y Acceso a Datos con Google Cloud Firestore
// ============================================================

import { Firestore } from '@google-cloud/firestore';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

let db = null;
let isConnected = false;

// Cargar datos locales de respaldo normalizados
let localData = { personas: [], programas: [] };
try {
  const seedPath = path.join(rootDir, 'database', 'migrated_seed_data.json');
  if (fs.existsSync(seedPath)) {
    localData = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
  }
} catch (e) {
  console.warn('No se pudo cargar seed local:', e.message);
}

// Detectar ID de proyecto en Cloud Shell, Cloud Run o entorno local
const resolvedProjectId = process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || process.env.DEVSHELL_PROJECT_ID || (process.env.NODE_ENV === 'production' ? 'vida-y-ministerio-507400' : null);

// Intentar inicializar Firestore
if (resolvedProjectId || process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.NODE_ENV === 'production') {
  try {
    const options = {};
    if (resolvedProjectId) options.projectId = resolvedProjectId;
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) options.keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    db = new Firestore(options);
    isConnected = true;
    console.log(`✅ Google Cloud Firestore configurado (Proyecto: ${resolvedProjectId || 'Default GCP'}).`);
  } catch (error) {
    console.warn('⚠️ Firestore no disponible localmente. Modo local activado:', error.message);
    db = null;
    isConnected = false;
  }
} else {
  console.log('ℹ️ Modo Local: Usando almacén JSON normalizado 3FN (database/migrated_seed_data.json).');
  db = null;
  isConnected = false;
}

export { db, isConnected, localData };

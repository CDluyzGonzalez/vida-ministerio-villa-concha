// ============================================================
// VIDA Y MINISTERIO — VILLA CONCHA
// js/modules/privileges.js
// Catálogo de Privilegios, Reglas de Asignación y Detección Automática
// ============================================================

// Catálogo de los 10 privilegios exclusivos de Vida y Ministerio
const PRIVILEGES_CATALOG = [
  { id: 'lectura_biblia', label: 'Lectura de la Biblia (4 mins.)', section: 'TESOROS' },
  { id: 'que_diria', label: '¿Qué diría?', section: 'MAESTROS' },
  { id: 'maestros', label: 'Seamos Mejores Maestros', section: 'MAESTROS' },
  { id: 'perlas', label: 'Busquemos perlas escondidas', section: 'TESOROS' },
  { id: 'tesoros_p1', label: 'Asignación #1 (Tesoros)', section: 'TESOROS' },
  { id: 'nvc', label: 'Nuestra Vida Cristiana', section: 'NVC' },
  { id: 'estudio_conductor', label: 'Estudio bíblico (Conductor)', section: 'NVC' },
  { id: 'estudio_lector', label: 'Estudio bíblico (Lector)', section: 'NVC' },
  { id: 'intro_conclusion', label: 'Palabras de introducción / conclusión', section: 'INTRO/CLOSE' },
  { id: 'oraciones', label: 'Oraciones', section: 'OPEN/CLOSE' }
];

const CAT_LABELS = {
  lectura_biblia: 'Lectura de la Biblia (4 mins.)',
  que_diria: '¿Qué diría?',
  maestros: 'Seamos Mejores Maestros',
  perlas: 'Busquemos perlas escondidas',
  tesoros_p1: 'Asignación #1 (Tesoros de la Biblia)',
  nvc: 'Nuestra Vida Cristiana',
  estudio_conductor: 'Estudio bíblico (Conductor)',
  estudio_lector: 'Estudio bíblico (Lector)',
  intro_conclusion: 'Palabras de introducción / conclusión',
  oraciones: 'Oraciones (apertura y cierre)',
  libre: 'Sin restricción'
};

// Detectar si una asignación es de tipo "¿Qué diría?"
function isQueDiriaAssignment(label) {
  if (!label) return false;
  const normalized = normName(label);
  return normalized.includes('que diria') || normalized.includes('que dirias');
}

// Determinar el privilegio requerido para una parte del programa
function computeCat(it) {
  if (it.forceCat) return it.forceCat;

  const section = (it.section || '').toUpperCase();
  const label = it.label || '';
  const num = it.num;

  // Apertura y Cierre
  if (section === 'OPEN' || section === 'CLOSE') {
    return 'oraciones';
  }

  // Introducción y Conclusión
  if (section === 'INTRO') {
    return 'intro_conclusion';
  }

  // Tesoros de la Biblia
  if (section === 'TESOROS') {
    if (num === 1) return 'tesoros_p1';
    if (num === 2) return 'perlas';
    if (num === 3) return 'lectura_biblia'; // Lectura separada
    return 'tesoros_p1';
  }

  // Seamos Mejores Maestros
  if (section === 'MAESTROS') {
    // Detección automática de "¿Qué diría?"
    if (isQueDiriaAssignment(label)) {
      return 'que_diria';
    }
    return 'maestros';
  }

  // Nuestra Vida Cristiana
  if (section === 'NVC' || section === 'VIDA') {
    const norm = normName(label);
    if (norm.includes('estudio biblico de la congregacion') || norm.includes('estudio biblico')) {
      return 'estudio_conductor';
    }
    return 'nvc';
  }

  return 'libre';
}

// Verificar si un publicador tiene un privilegio
function hasPrivilege(person, privilegeId) {
  if (!person) return false;

  // Si tiene el array de privilegios normalizado (3FN / Firestore)
  if (Array.isArray(person.privilegios)) {
    return person.privilegios.includes(privilegeId);
  }

  // Compatibilidad con esquema antiguo boolean flags
  if (privilegeId === 'lectura_biblia') {
    return !!(person.elig_lectura_biblia || person.elig_maestros_lectura || person.lectura_biblia);
  }
  if (privilegeId === 'que_diria') {
    return !!(person.elig_que_diria || person.elig_maestros_lectura);
  }
  if (privilegeId === 'maestros') {
    return !!(person.elig_maestros || person.elig_maestros_lectura);
  }
  if (privilegeId === 'perlas') return !!person.elig_perlas;
  if (privilegeId === 'tesoros_p1') return !!person.elig_parte1;
  if (privilegeId === 'nvc') return !!person.elig_nvc;
  if (privilegeId === 'estudio_conductor') return !!person.elig_estudio_biblico;
  if (privilegeId === 'estudio_lector') return !!person.elig_lector_estudio;
  if (privilegeId === 'intro_conclusion') return !!person.elig_intro_conclusion;
  if (privilegeId === 'oraciones') return !!person.elig_oraciones;

  return true;
}

// Filtrar publicadores elegibles para una categoría
function getEligiblePeople(peopleList, requiredCat) {
  if (!Array.isArray(peopleList)) return [];
  if (requiredCat === 'libre') return peopleList;

  return peopleList.filter(p => hasPrivilege(p, requiredCat));
}

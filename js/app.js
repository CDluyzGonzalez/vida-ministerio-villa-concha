// ============================================================
// VIDA Y MINISTERIO — VILLA CONCHA
// js/app.js
// Punto de Entrada, Estado Global y Router de Pestañas
// ============================================================

// Estado Global
let PROGRAM = null;
let PEOPLE = null;
let BIMESTRES_LIST = [
  'Enero - Febrero',
  'Marzo - Abril',
  'Mayo - Junio',
  'Julio - Agosto',
  'Septiembre - Octubre',
  'Noviembre - Diciembre'
];
let currentTab = 'programa'; // 'programa' | 'publicadores' | 'dashboard'
let currentBimestre = 'Septiembre - Octubre';
let openWeeks = new Set();
let peopleSearch = '';
let isAdmin = false;
let writeToken = null;

// ============================================================
// RENDERIZADOR PRINCIPAL DE LA APLICACIÓN
// ============================================================

function render() {
  const root = document.getElementById('root');
  if (!root) return;

  // Si no es admin, forzar pestaña programa
  if (!isAdmin && currentTab !== 'programa') {
    currentTab = 'programa';
  }

  root.innerHTML = `
    <!-- Header Principal -->
    <header class="app-header">
      <div class="brand" style="display: flex; align-items: baseline; gap: 10px; margin-bottom: 14px;">
        <h1>Vida y Ministerio</h1>
        <span class="sub">Villa Concha</span>

        <span class="install-app-slot">
          ${!isAppStandalone() ? `
            <button class="install-app-btn" onclick="triggerInstallPrompt()" title="Instalar vida y ministerio">
              📲 Instalar App
            </button>
          ` : ''}
        </span>

        <span class="admin-toggle" style="margin-left: auto;">
          ${isAdmin ? `
            <button class="admin-btn admin-on" onclick="logoutAdmin()" title="Modo Administrador Activo (Clic para salir)">
              🔓 Admin
            </button>
          ` : `
            <button class="admin-btn" onclick="openAdminPinModal()" title="Ingresar PIN para editar">
              🔒 Admin
            </button>
          `}
        </span>
      </div>

      <!-- Pestañas de Navegación: Publicadores y Dashboard SOLO visibles en Modo Admin -->
      <div class="tabbar">
        <button
          class="${currentTab === 'programa' ? 'active' : ''}"
          onclick="switchTab('programa')"
        >
          Programa
        </button>

        ${isAdmin ? `
          <button
            class="${currentTab === 'publicadores' ? 'active' : ''}"
            onclick="switchTab('publicadores')"
          >
            Publicadores
          </button>

          <button
            class="${currentTab === 'dashboard' ? 'active' : ''}"
            onclick="switchTab('dashboard')"
          >
            Dashboard
          </button>
        ` : ''}
      </div>
    </header>

    <!-- Contenido Principal -->
    <main>
      ${currentTab === 'programa' ? renderProgramTab() : ''}
      ${currentTab === 'publicadores' ? renderPeopleTab() : ''}
      ${currentTab === 'dashboard' ? renderDashboardTab() : ''}
    </main>
  `;

  // Si estamos en dashboard, cargar la sección de no-asignados (necesita async para bimestre anterior)
  if (currentTab === 'dashboard' && typeof loadUnassignedWithPrevBimestre === 'function') {
    loadUnassignedWithPrevBimestre();
  }
}

// Cambiar de pestaña
function switchTab(tabName) {
  if (tabName !== 'programa' && !isAdmin) {
    openAdminPinModal();
    return;
  }
  currentTab = tabName;
  render();
}

// ============================================================
// ARRANQUE / BOOTSTRAP DE LA APLICACIÓN
// ============================================================

async function boot() {
  // 0. Restaurar sesión Admin previa si existe token guardado
  try {
    const savedToken = sessionStorage.getItem('wm_admin_token') || localStorage.getItem('wm_admin_token');
    if (savedToken) {
      const isValid = await apiVerifyPin(savedToken);
      if (isValid) {
        isAdmin = true;
        writeToken = savedToken;
      } else {
        localStorage.removeItem('wm_admin_token');
        sessionStorage.removeItem('wm_admin_token');
      }
    }
  } catch (_) {}

  render();

  try {
    // 1. Cargar Lista de Bimestres desde Firestore
    BIMESTRES_LIST = await apiLoadBimestres();

    // 2. Cargar Publicadores
    PEOPLE = await apiLoadPersonas();

    // 3. Cargar Programa del Bimestre Inicial (el más reciente)
    const prog = await apiLoadPrograma(currentBimestre);
    if (prog) {
      PROGRAM = prog;
    } else if (typeof DEFAULT_PROGRAM !== 'undefined' && Array.isArray(DEFAULT_PROGRAM)) {
      PROGRAM = DEFAULT_PROGRAM[0];
    }

    // Abrir la primera semana por defecto
    if (PROGRAM?.weeks?.[0]?.id) {
      openWeeks.add(PROGRAM.weeks[0].id);
    }
  } catch (error) {
    console.warn('Error durante el arranque:', error);
  }

  render();
}

// Iniciar al cargar el DOM
document.addEventListener('DOMContentLoaded', boot);

// ============================================================
// SISTEMA DE INSTALLACIÓN DE APP PWA
// ============================================================

// Capturar el evento de instalación de PWA en el navegador
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  // guardar el evento en una variable global para usarlo con el botón de instalación
  window.wmDeferredInstallPrompt = e;
  console.log("Instalacion Preparada");
});

function isAppStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

async function triggerInstallPrompt() {
  const promptEvent = window.wmDeferredInstallPrompt;

  if (promptEvent) {
    promptEvent.prompt();

    // Esperar a que el usuario elija una opción
    const choiceResult = await promptEvent.userChoice;
    if (choiceResult.outcome === 'accepted') {
      console.log('El usuario acepto la instalación');
    } else {
      console.log('El usuario rechaza la instalación');
    }

    //El evento ya no se puede usar de nuevo, así que lo eliminamos
    window.wmDeferredInstallPrompt = null;
  } else {
    // Mensaje de respaldo solo si es sistema Ios que no soporta la API
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS) {
      alert('Para instalar la aplicación en tu iPhone o iPad:\n\n1. Asegúrate de estar usando el navegador Safari.\n2. Toca el botón "Compartir" (el cuadrado con la flecha hacia arriba).\n3. Busca y selecciona la opción "Agregar al inicio".');
    } else {
      alert('Para instalar la aplicación:\n\n1. Asegúrate de estar usando el navegador Chrome o Firefox.\n2. Haz clic en el botón "Instalar App".');
    }
  }
}
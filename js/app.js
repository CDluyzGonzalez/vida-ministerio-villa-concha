// ============================================================
// VIDA Y MINISTERIO — VILLA CONCHA
// js/app.js
// Punto de Entrada, Estado Global y Router de Pestañas
// ============================================================

// Estado Global
let PROGRAM = null;
let PEOPLE = null;
let currentTab = 'programa'; // 'programa' | 'publicadores' | 'dashboard'
let currentBimestre = 'Marzo - Abril';
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

        <span class="install-app-slot"></span>

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
  render();

  try {
    // 1. Cargar Publicadores
    PEOPLE = await apiLoadPersonas();

    // 2. Cargar Programa del Bimestre Inicial
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
# Vida y Ministerio

> Aplicación web progresiva (PWA) de nivel empresarial para la gestión, consulta y auditoría inteligente de las asignaciones semanales del programa **Vida y Ministerio**. Desarrollada con arquitectura serverless sobre **Google Cloud Platform** (Cloud Run + Firestore Nativo) bajo costo \$0 permanente.

🌐 [**Ver aplicación en producción (Google Cloud)**](https://vida-ministerio-248389608743.us-central1.run.app/)  
📦 [**Repositorio en GitHub**](https://github.com/CDluyzGonzalez/vida-ministerio-villa-concha)

---

## 📋 Descripción del Proyecto

**Vida y Ministerio — Villa Concha** transforma la gestión tradicional basada en hojas de cálculo extensas en una plataforma web interactiva, moderna y automatizada. Permite programar reuniones bimestrales, asignar participantes respetando privilegios bíblicos específicos, auditar conflictos en tiempo real y brindar a la congregación una vista de solo lectura limpia, rápida y accesible desde cualquier dispositivo.

---

## 🎯 Objetivos y Solución Aportada

* **De Hojas de Cálculo a Base de Datos en la Nube:** Reemplazo de tablas estáticas por **Google Cloud Firestore** (modo nativo) con esquema híbrido normalizado en 3FN.
* **Cero Costo Operativo (\$0 USD):** Arquitectura serverless que escala a cero instancias en periodos de inactividad, aprovechando la capa gratuita permanente (*Always Free Tier*) de Google Cloud.
* **Auditoría Automática en Tiempo Real:** Algoritmos ejecutados del lado del cliente que detectan conflictos de misma semana, sobrecarga por semanas consecutivas y publicadores sin asignación.
* **Doble Modo (Público vs. Administrador):** Los hermanos disfrutan de una vista limpia y segura sin riesgo de alterar datos; el encargado administra con PIN seguro SHA-256.

---

## ✨ Características Principales

### 1. 📅 Gestión y Visualización de Programas
* **Navegación Bimestral:** Soporte completo para los 6 períodos del año (Enero - Febrero, Marzo - Abril, Mayo - Junio, Julio - Agosto, Septiembre - Octubre, Noviembre - Diciembre).
* **Transición Automatizada de Semanas:**
  * El sistema analiza la fecha exacta de fin de cada semana (`parseWeekEndDate`).
  * Si la última semana de un bimestre cruza al mes siguiente (ej. *Semana 31 De Agosto A 6 De Septiembre*), permanece visible hasta el último día domingo **mostrando únicamente esa última semana** y ocultando automáticamente las semanas pasadas.
  * Al vencer esa semana, el bimestre anterior desaparece solo.
  * Durante el segundo mes de cada bimestre (ej. Octubre), se activa automáticamente la vista anticipada del bimestre siguiente (Noviembre - Diciembre).
* **Renumeración Dinámica Continua:** Las partes del programa se renumeran correlativamente (1, 2, 3...) de forma automática, omitiendo los cánticos de apertura, intermedios y de cierre.

### 2. 🛡️ Presidencia Unificada
* Regla canónica implementada: Quien preside la reunión presenta las **Palabras de introducción (1 min.)** y las **Palabras de conclusión (3 min.)**.
* Al asignar al presidente en una de las partes, el sistema **sincroniza automáticamente la otra parte**, garantizando coherencia en todo momento.

### 3. 👥 Directorio de Publicadores y Privilegios Normalizados (3FN)
Cada publicador cuenta con un ID único, datos de contacto y un catálogo de **privilegios independientes** correspondientes a las asignaciones del programa:

| ID Privilegio | Nombre Visible / Checkbox | Uso en el Programa |
| :--- | :--- | :--- |
| `lectura_biblia` | **Lectura de la Biblia** | Asignación #3 de Tesoros (4 mins.) |
| `que_diria` | **¿Qué diría?** | Partes de Maestros con título "¿Qué diría?" |
| `maestros` | **Seamos Mejores Maestros** | Discursos, conversaciones y explicaciones |
| `perlas` | **Busquemos perlas escondidas** | Análisis de perlas (10 mins.) |
| `tesoros_p1` | **Asignación #1 (Tesoros)** | Discurso temático principal de Tesoros |
| `nvc` | **Nuestra Vida Cristiana** | Puntos temáticos de Vida Cristiana |
| `estudio_conductor` | **Estudio bíblico (Conductor)** | Dirigir el estudio bíblico de congregación |
| `estudio_lector` | **Estudio bíblico (Lector)** | Lectura de párrafos en el estudio bíblico |
| `intro_conclusion` | **Introducción / Conclusión** | Presidencia de la reunión |
| `oraciones` | **Oraciones** | Oración de apertura y de conclusión |

* **Gestión en Tiempo Real:** El administrador puede crear nuevos publicadores, editar sus privilegios (añadir o retirar casillas) y eliminarlos con sincronización atómica e inmediata en Firestore.

### 4. 📊 Dashboard de Auditoría y Control (Centro de Alertas)
El Dashboard realiza un análisis instantáneo en la memoria del navegador sin generar lecturas ni costos en Firestore:
* 🔴 **Conflictos de Misma Semana:** Detecta si un hermano tiene dos o más asignaciones distintas en la misma semana. *(Excepción inteligente: Introducción y Conclusión se consolidan como 1 sola función de Presidencia sin generar falsos positivos).*
* 🟡 **Asignaciones en Semanas Consecutivas:** Identifica rachas de hermanos asignados en 2 o más semanas seguidas, desglosando las partes asignadas en cada semana (ej. *Semana X (oración) ➔ Semana Y (perlas)*).
* 🔵 **Publicadores Sin Asignación:** Identifica hermanos disponibles que no han recibido asignación en el bimestre actual ni en el bimestre anterior, fomentando una distribución equitativa.
* 📈 **Métricas Generales:** Estadísticas de partes cubiertas, pendientes y cantidad de publicadores únicos utilizados.

### 5. 🔒 Seguridad y Persistencia de Sesión
* **Protección por PIN:** Acceso al modo Administrador mediante hash criptográfico **SHA-256**.
* **Sesión Persistente:** Al recargar la página o cambiar de aplicación en el celular, el token se conserva en `sessionStorage`/`localStorage`, evitando perder el estado de edición.
* **Control de Autorización en Backend:** Endpoints protegidos mediante validación estricta de token en cabeceras y cuerpo de peticiones.

### 6. 📄 Exportación a PDF de Alta Fidelidad
* Generación del programa completo a PDF mediante **jsPDF** y **html2canvas**.
* Modo de renderizado especial que oculta botones de edición, expande todas las semanas y aplica tipografías y bordes limpios para impresión o distribución digital.
* Disponible exclusivamente para el Administrador.

### 7. 📲 Progressive Web App (PWA)
* Botón integrado en el encabezado: **📲 Descargar app**.
* Instalación nativa en Android, Windows, macOS y Linux mediante `beforeinstallprompt`.
* Guía de instalación rápida asistida para usuarios de iOS (Safari).
* Detección automática de modo independiente (`display-mode: standalone`) para ocultar el botón cuando la app ya está instalada.

---

## 🏗️ Arquitectura del Sistema

```text
┌────────────────────────────────────────────────────────────────────────┐
│                          DISPOSITIVOS (CLIENTES)                       │
│             Smartphones  ·  Tablets  ·  Laptops  ·  Desktops           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    │ HTTPS (PWA / REST)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                 GOOGLE CLOUD RUN (Contenedor Serverless)               │
│                                                                        │
│   • Node.js 20 + Express API REST (server/server.js)                   │
│   • Compresión Gzip + Cabeceras de Seguridad + CORS                    │
│   • Serving Estático Optimizado (HTML, CSS, JS Modular)                │
│   • Auto-escalado a 0 instancias (Costo $0 en inactividad)             │
│   • Autenticación con Application Default Credentials (ADC)            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    │ gRPC Interno (roles/datastore.user)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                 GOOGLE CLOUD FIRESTORE (Modo Nativo)                   │
│                                                                        │
│   • Colección /programas (documentos bimestrales con array de semanas) │
│   • Colección /personas (121 publicadores con privilegios 3FN)         │
│   • Cuota Gratuita: 50.000 lecturas / 20.000 escrituras diarias        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Estructura del Código Fuente

```text
vida-ministerio-villa-concha/
│
├── server/
│   ├── server.js               # API REST Express (Rutas para programas, personas, PIN)
│   └── firestore.js            # Inicializador de Firestore con Application Default Credentials
│
├── js/
│   ├── app.js                  # Bootstrap, estado global, router de pestañas y PWA
│   │
│   ├── modules/
│   │   ├── api.js              # Cliente HTTP hacia Cloud Run con fallback offline
│   │   ├── privileges.js       # Catálogo de 10 privilegios, reglas y filtros
│   │   ├── people.js           # Directorio de publicadores y modal con 10 checkboxes
│   │   ├── program.js          # Renderizado de semanas, cálculo de fechas y asignaciones
│   │   ├── dashboard.js        # Motor de auditoría en tiempo real (conflictos y equidad)
│   │   ├── admin.js            # Autenticación PIN SHA-256 y sesión persistente
│   │   ├── pdf.js              # Motor de exportación a PDF (jsPDF + html2canvas)
│   │   └── utils.js            # Normalización de texto, toasts y almacenamiento local
│   │
│   └── data/
│       ├── people.js           # Semilla de respaldo offline de publicadores
│       ├── varones.js          # Datos auxiliares
│       └── program.js          # Semilla de respaldo offline del programa
│
├── css/
│   └── styles.css              # Sistema de diseño responsivo (Dark Teal + Terra Cotta)
│
├── icons/                      # Iconos PWA para alta resolución (192px, 512px)
├── screenshots/                # Capturas de pantalla para instalación PWA
├── Dockerfile                  # Empaquetado Docker multi-stage en Node.js 20 Alpine
├── cloudbuild.yaml             # Configuración de despliegue automatizado en Google Cloud
├── index.html                  # Punto de entrada HTML5 con cache-busting dinámico
├── manifest.json               # Configuración oficial de Progressive Web App
├── package.json                # Dependencias (Express, @google-cloud/firestore, cors, compression)
└── README.md                   # Documentación técnica completa del proyecto
```

---

## 🛠️ Tecnologías Utilizadas

### Frontend
* **HTML5 Semántico** & **CSS3 Moderno** (Flexbox, CSS Grid, Variables CSS, Media Queries).
* **JavaScript Moderno (ES6+)** bajo arquitectura modular por responsabilidades.
* **jsPDF** & **html2canvas** para renderizado e impresión de documentos vectoriales/rasterizados.

### Backend & Nube
* **Node.js 20 LTS** & **Express.js**.
* **Google Cloud Run** (Despliegue serverless contenerizado).
* **Google Cloud Firestore** (Base de datos NoSQL documental nativa).
* **Google Cloud IAM** (`roles/datastore.user` para autorización de mínima fricción).
* **Docker** (Contenedor optimizado Alpine Linux).

---

## 🚀 Guía de Despliegue y Mantenimiento

### 1. Pruebas Locales en Computadora
```bash
# Iniciar el servidor local
node server/server.js
```
Abre en tu navegador: `http://localhost:8080`.

### 2. Despliegue a Producción en Google Cloud Run

Cada vez que realices ajustes en tu repositorio local, el flujo de actualización es:

#### Paso A: En tu terminal local
```bash
git add -A
git commit -m "feat: descripcion del cambio realizado"
git push origin cloudrun
```

#### Paso B: En Google Cloud Shell
```bash
git pull origin cloudrun && gcloud run deploy vida-ministerio --source . --region us-central1 --allow-unauthenticated --set-env-vars GCP_PROJECT_ID=vida-y-ministerio-507400,NODE_ENV=production
```

---

## 👨‍💻 Autor

### Carlos D'Luyz
**Desarrollador de Software | Estudiante de Ingeniería de Sistemas**  
Interesado en desarrollo web full stack, arquitectura serverless en la nube, automatización de procesos y diseño centrado en el usuario.

* GitHub: [@CDluyzGonzalez](https://github.com/CDluyzGonzalez)
* Repositorio: [vida-ministerio-villa-concha](https://github.com/CDluyzGonzalez/vida-ministerio-villa-concha)

---

## 📄 Licencia
Este proyecto ha sido desarrollado con fines de servicio comunitario y demostración de competencias profesionales de ingeniería de software.

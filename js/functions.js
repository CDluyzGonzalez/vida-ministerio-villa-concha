// ============================================================
// VIDA Y MINISTERIO — VILLA CONCHA
// functions.js
// ============================================================
// Este archivo contiene las funciones principales de la app.
//
// Los datos están en:
// js/data/
//
// El estado y el arranque están en:
// js/app.js
// ============================================================


// ============================================================
// CONFIGURACIÓN DE CATEGORÍAS
// ============================================================

const CAT_LABELS = {
  perlas: 'Busquemos perlas escondidas',
  intro_conclusion: 'Palabras de introducción / conclusión',
  parte1: 'Asignación #1 (Tesoros de la Biblia)',
  nvc: 'Nuestra Vida Cristiana',
  estudio_biblico: 'Estudio bíblico de la congregación (conductor)',
  maestros_lectura: 'Seamos Mejores Maestros / Lectura de la Biblia',
  estudio_biblico_lector: 'Lector — Estudio bíblico',
  oraciones: 'Oraciones (cánticos de apertura y cierre)',
  libre: 'Sin restricción'
};


// ============================================================
// PERSONAS FIJAS PARA INTRODUCCIÓN Y CONCLUSIÓN
// ============================================================

const FIXED_INTRO_CONCLUSION = [
  'Eduardo Parra',
  'Eliu Rodríguez',
  "Carlos D' Luyz",
  'Sergio Cespedes',
  'Johan Duarte',
  'Nicolas Medina',
  'Anderson Gomez',
  'Sergio Rojas',
  'Alirio Calderón'
];


// ============================================================
// NORMALIZAR NOMBRES
// ============================================================

function normName(s) {

  return (s || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[´'`.]/g, '')
    .replace(/\s+/g, ' ');

}


// ============================================================
// CALCULAR CATEGORÍA DE UNA ASIGNACIÓN
// ============================================================

function computeCat(it) {

  const sec = it.section;

  const label =
    (it.label || '').toLowerCase();


  if (
    sec === 'OPEN' ||
    sec === 'CLOSE'
  ) {

    return 'oraciones';

  }


  if (
    sec === 'MID'
  ) {

    return 'libre';

  }


  if (
    sec === 'INTRO' ||
    sec === 'CONCLUSION'
  ) {

    return 'intro_conclusion';

  }


  if (
    sec === 'TESOROS'
  ) {

    if (
      it.num === 1
    ) {

      return 'parte1';

    }


    if (
      label.includes('perlas')
    ) {

      return 'perlas';

    }


    if (
      label.includes(
        'lectura de la biblia'
      )
    ) {

      return 'maestros_lectura';

    }


    return 'parte1';

  }


  if (
    sec === 'MAESTROS'
  ) {

    return 'maestros_lectura';

  }


  if (
    sec === 'NVC'
  ) {

    if (
      it.hasOwnProperty(
        'conductor'
      )
    ) {

      return 'estudio_biblico';

    }


    return 'nvc';

  }


  return 'libre';

}


// ============================================================
// LÍNEA DE CANCIÓN SIN ASIGNACIÓN
// ============================================================

function isPureSongLine(it) {

  return (
    it.section === 'MID' &&
    !/oraci[oó]n/i.test(
      it.label || ''
    ) &&
    /canc[ií]ó[nn]|^\s*[•·▪◦\-]?\s*\d+\s*$/i.test(
      it.label || ''
    )
  );

}


// ============================================================
// BIMESTRES VISIBLES PARA EL PUBLICADOR
// ============================================================

const BIMESTRE_MONTH_LABELS = {

  1: 'Enero - Febrero',

  3: 'Marzo - Abril',

  5: 'Mayo - Junio',

  7: 'Julio - Agosto',

  9: 'Septiembre - Octubre',

  11: 'Noviembre - Diciembre'

};


// ============================================================
// OBTENER BIMESTRES VISIBLES
// ============================================================

function computeViewerBimestres(
  date
) {

  const m =
    (date || new Date())
      .getMonth() + 1;


  const pairStart =
    m % 2 === 1
      ? m
      : m - 1;


  const nextStart =
    pairStart === 11
      ? 1
      : pairStart + 2;


  return [
    BIMESTRE_MONTH_LABELS[pairStart],
    BIMESTRE_MONTH_LABELS[nextStart]
  ].filter(Boolean);

}


// ============================================================
// OBTENER BIMESTRE ACTUAL
// ============================================================

function computeViewerBimestreLabel(
  date
) {

  return computeViewerBimestres(
    date
  )[0];

}


// ============================================================
// GOOGLE SHEETS
// ============================================================

async function getSheetsUrl() {

  APPS_SCRIPT_URL =
    APPS_SCRIPT_URL_DEFAULT || '';


  try {

    if (
      window.localStorage
    ) {

      const v =
        window.localStorage.getItem(
          'wm-sheets-url'
        );


      if (
        v
      ) {

        APPS_SCRIPT_URL =
          JSON.parse(v);

      }

    }

  } catch (e) {}


  try {

    if (
      window.storage &&
      typeof window.storage.get ===
        'function'
    ) {

      const r =
        await Promise.race([

          window.storage.get(
            'wm-sheets-url',
            true
          ),

          new Promise(
            resolve =>
              setTimeout(
                () => resolve(null),
                800
              )
          )

        ]);


      if (
        r &&
        r.value
      ) {

        APPS_SCRIPT_URL =
          JSON.parse(
            r.value
          );

      }

    }

  } catch (e) {}


  return APPS_SCRIPT_URL;

}


// ============================================================
// ESTADO DE GOOGLE SHEETS
// ============================================================

function setSheetsStatus(
  connected,
  message
) {

  sheetsConnected =
    !!connected;


  const badge =
    document.getElementById(
      'sheets-status'
    );


  if (
    !badge
  ) {

    return;

  }


  badge.className =
    'sheets-status ' +
    (
      connected
        ? 'connected'
        : 'offline'
    );


  badge.textContent =
    connected
      ? '☁ Sheets conectado'
      : (
          message ||
          '☁ Sheets no conectado'
        );

}


// ============================================================
// CARGAR DATOS MEDIANTE JSONP
// ============================================================

function jsonpLoad(
  url
) {

  return new Promise(
    (
      resolve,
      reject
    ) => {

      const cb =
        '__wmSheetsCallback_' +
        Date.now() +
        '_' +
        Math.floor(
          Math.random() * 10000
        );


      const script =
        document.createElement(
          'script'
        );


      const timer =
        setTimeout(
          () => {

            cleanup();

            reject(
              new Error(
                'Tiempo de espera conectando con Google Sheets'
              )
            );

          },
          12000
        );


      function cleanup() {

        clearTimeout(
          timer
        );


        script.remove();


        try {

          delete window[cb];

        } catch (e) {

          window[cb] =
            undefined;

        }

      }


      window[cb] =
        data => {

          cleanup();

          resolve(
            data
          );

        };


      script.onerror =
        () => {

          cleanup();

          reject(
            new Error(
              'No se pudo conectar con Google Sheets'
            )
          );

        };


      script.src =
        url +
        (
          url.includes('?')
            ? '&'
            : '?'
        ) +
        'action=load&callback=' +
        encodeURIComponent(cb);


      document.head.appendChild(
        script
      );

    }
  );

}


// ============================================================
// CARGAR DATOS REMOTOS
// ============================================================

async function loadRemoteData() {

  await getSheetsUrl();


  if (
    !APPS_SCRIPT_URL
  ) {

    return null;

  }


  try {

    const data =
      await jsonpLoad(
        APPS_SCRIPT_URL
      );


    if (
      !data ||
      !data.ok
    ) {

      throw new Error(
        data?.error ||
        'Respuesta inválida'
      );

    }


    setSheetsStatus(
      true
    );


    return data;

  } catch (e) {

    setSheetsStatus(
      false,
      '☁ Sheets error'
    );


    console.warn(
      e
    );


    return null;

  }

}


// ============================================================
// ENVIAR DATOS A GOOGLE SHEETS
// ============================================================

async function postRemote(
  action,
  payload
) {

  if (
    !APPS_SCRIPT_URL
  ) {

    return false;

  }


  try {

    await fetch(
      APPS_SCRIPT_URL,
      {

        method: 'POST',

        mode: 'no-cors',

        headers: {
          'Content-Type':
            'text/plain;charset=UTF-8'
        },

        body:
          JSON.stringify({
            action,
            payload
          })

      }
    );


    setSheetsStatus(
      true
    );


    return true;

  } catch (e) {

    setSheetsStatus(
      false,
      '☁ Sheets error'
    );


    console.warn(
      e
    );


    return false;

  }

}


// ============================================================
// CARGAR DATOS DE LA APLICACIÓN
// ============================================================

async function loadData() {

  const remote =
    await loadRemoteData();


  try {

    const p =
      await window.storage.get(
        'wm-program',
        true
      );


    PROGRAM =
      p
        ? JSON.parse(
            p.value
          )
        : JSON.parse(
            JSON.stringify(
              DEFAULT_PROGRAM
            )
          );

  } catch (e) {

    PROGRAM =
      JSON.parse(
        JSON.stringify(
          DEFAULT_PROGRAM
        )
      );

  }


  try {

    const pe =
      await window.storage.get(
        'wm-people',
        true
      );


    PEOPLE =
      pe
        ? JSON.parse(
            pe.value
          )
        : JSON.parse(
            JSON.stringify(
              DEFAULT_PEOPLE
            )
          );

  } catch (e) {

    PEOPLE =
      JSON.parse(
        JSON.stringify(
          DEFAULT_PEOPLE
        )
      );

  }


  const localProgram =
    PROGRAM || [];


  const localPeople =
    PEOPLE || [];


  const hadRemoteProgram =
    !!remote?.program;


  const hadRemotePeople =
    !!remote?.people;


  if (
    hadRemoteProgram
  ) {

    const remoteLabels =
      new Set(
        remote.program.map(
          b =>
            b.bimestre
        )
      );


    const localExtras =
      localProgram.filter(
        b =>
          !remoteLabels.has(
            b.bimestre
          )
      );


    PROGRAM =
      remote.program.concat(
        localExtras
      );


    if (
      localExtras.length &&
      APPS_SCRIPT_URL
    ) {

      setTimeout(
        () =>
          saveProgram(),
        0
      );

    }

  }


  if (
    hadRemotePeople
  ) {

    PEOPLE =
      remote.people;

  }


  ensurePeopleBimestreKeys();


  if (
    !currentBimestre
  ) {

    currentBimestre =
      PROGRAM[0]?.bimestre ||
      null;

  }


  await migrateVarones();


  if (
    APPS_SCRIPT_URL &&
    remote &&
    !hadRemoteProgram
  ) {

    await saveProgram();

  }


  if (
    APPS_SCRIPT_URL &&
    remote &&
    !hadRemotePeople
  ) {

    await savePeople();

  }

}


// ============================================================
// ASEGURAR CLAVES DE BIMESTRE
// ============================================================

function ensurePeopleBimestreKeys() {

  const bimestres =
    PROGRAM.map(
      b =>
        b.bimestre
    );


  PEOPLE.forEach(
    p => {

      if (
        !p.disponibilidad
      ) {

        p.disponibilidad =
          {};

      }


      bimestres.forEach(
        b => {

          if (
            !Object.prototype.hasOwnProperty.call(
              p.disponibilidad,
              b
            )
          ) {

            p.disponibilidad[b] =
              'Disponible';

          }

        }
      );

    }
  );

}


// ============================================================
// MIGRACIÓN DE VARONES
// ============================================================

async function migrateVarones() {

  let meta =
    null;


  try {

    const m =
      await window.storage.get(
        'wm-meta',
        true
      );


    meta =
      m
        ? JSON.parse(
            m.value
          )
        : null;

  } catch (e) {

    meta =
      null;

  }


  if (
    meta &&
    meta.varonesMigratedV2
  ) {

    const sane =
      PEOPLE.some(
        p =>
          p.elig_parte1
      ) &&
      PEOPLE.some(
        p =>
          p.elig_nvc
      ) &&
      PEOPLE.some(
        p =>
          p.elig_intro_conclusion
      );


    if (
      sane
    ) {

      return;

    }

  }


  const byNorm =
    {};


  PEOPLE.forEach(
    p => {

      byNorm[
        normName(
          p.nombre
        )
      ] =
        p;

    }
  );


  const bimestres =
    PROGRAM.map(
      b =>
        b.bimestre
    );


  VARONES_DATA.forEach(
    v => {

      const key =
        normName(
          v.nombre
        );


      let p =
        byNorm[key];


      if (
        !p
      ) {

        p = {

          id:
            'pv_' +
            key.replace(
              /\s+/g,
              '_'
            ),

          nombre:
            v.nombre,

          nota:
            '',

          disponibilidad:
            Object.fromEntries(
              bimestres.map(
                b =>
                  [
                    b,
                    ''
                  ]
              )
            ),

          elig_perlas:
            false,

          elig_maestros_lectura:
            false,

          elig_intro_conclusion:
            false,

          elig_parte1:
            false,

          elig_nvc:
            false,

          elig_estudio_biblico:
            false,

          elig_oraciones:
            false

        };


        PEOPLE.push(
          p
        );


        byNorm[key] =
          p;

      }


      p.elig_perlas =
        !!v.perlas;


      p.elig_parte1 =
        !!v.tesoros;


      p.elig_nvc =
        !!v.oradores;


      p.elig_estudio_biblico =
        !!v.dirigir_estudio;


      p.elig_oraciones =
        !!v.orar_publico;

    }
  );


  const fixedNorm =
    new Set(
      FIXED_INTRO_CONCLUSION.map(
        normName
      )
    );


  PEOPLE.forEach(
    p => {

      if (
        fixedNorm.has(
          normName(
            p.nombre
          )
        )
      ) {

        p.elig_intro_conclusion =
          true;

      }

    }
  );


  await savePeople();


  try {

    await window.storage.set(
      'wm-meta',
      JSON.stringify({
        varonesMigratedV2:
          true
      }),
      true
    );

  } catch (e) {}

}


// ============================================================
// GUARDAR PROGRAMA
// ============================================================

async function saveProgram() {

    try {

    if (
        window.storage &&
        typeof window.storage.set ===
        'function'
    ) {

    await window.storage.set(
        'wm-program',
        JSON.stringify(
        PROGRAM
        ),
        true
    );

    }

} catch (e) {

    // El almacenamiento local es opcional.
    // La fuente principal de datos es Apps Script / Sheets.

}


if (
    APPS_SCRIPT_URL
) {

    await postRemote(
        'saveProgram',
        PROGRAM
    );

}

}


// ============================================================
// GUARDAR PUBLICADORES
// ============================================================

async function savePeople() {

  try {

    if (
      window.storage &&
      typeof window.storage.set ===
        'function'
    ) {

      await window.storage.set(
        'wm-people',
        JSON.stringify(
          PEOPLE
        ),
        true
      );

    }

  } catch (e) {

    // El almacenamiento local es opcional.
    // La fuente principal de datos es Apps Script / Sheets.

  }


  if (
    APPS_SCRIPT_URL
  ) {

    await postRemote(
      'savePeople',
      PEOPLE
    );

  }

}


// ============================================================
// OBTENER PIN
// ============================================================

async function getAdminPin() {

  try {

    const r =
      await window.storage.get(
        'wm-admin-pin',
        true
      );


    return r
      ? JSON.parse(
          r.value
        )
      : DEFAULT_PIN;

  } catch (e) {

    return DEFAULT_PIN;

  }

}


// ============================================================
// GUARDAR PIN
// ============================================================

async function setAdminPin(
  pin
) {

  try {

    await window.storage.set(
      'wm-admin-pin',
      JSON.stringify(
        pin
      ),
      true
    );

  } catch (e) {

    console.error(
      e
    );

  }

}


// ============================================================
// MODAL DE GOOGLE SHEETS
// ============================================================

function openSheetsConfigModal() {

  const overlay =
    openOverlay(`
      <div class="modal-head">
        <h3>
          Conectar Google Sheets
        </h3>

        <p>
          Pega aquí la URL de tu Web App de Google Apps Script terminada en <b>/exec</b>.
          La app seguirá usando los Sheets como base de datos.
        </p>
      </div>

      <div class="modal-search">

        <input
          class="search-input"
          id="sheets-url"
          type="url"
          placeholder="https://script.google.com/macros/s/.../exec"
          value="${esc(
            APPS_SCRIPT_URL || ''
          )}"
        />

      </div>

      <div class="modal-foot">

        <button
          class="btn btn-ghost btn-sm"
          data-a="cancel"
        >
          Cancelar
        </button>

        <button
          class="btn btn-primary btn-sm"
          data-a="ok"
        >
          Conectar y probar
        </button>

      </div>
    `);


  const input =
    overlay.querySelector(
      '#sheets-url'
    );


  input.focus();

  input.select();


  const submitBtn =
    overlay.querySelector(
      '[data-a="ok"]'
    );


  const submit =
    async () => {

      const url =
        input.value
          .trim()
          .replace(
            /\/$/,
            ''
          );


      if (
        !/^https:\/\/script\.google\.com\/macros\/s\/[^\s]+\/exec$/.test(
          url
        )
      ) {

        input.setCustomValidity(
          'Debe ser la URL /exec de una implementación de Google Apps Script Web App.'
        );


        input.reportValidity();


        return;

      }


      input.setCustomValidity(
        ''
      );


      submitBtn.disabled =
        true;


      submitBtn.textContent =
        'Conectando…';


      setSheetsStatus(
        false,
        '☁ Probando conexión…'
      );


      try {

        if (
          window.localStorage
        ) {

          window.localStorage.setItem(
            'wm-sheets-url',
            JSON.stringify(
              url
            )
          );

        }

      } catch (_) {}


      try {

        if (
          window.storage &&
          typeof window.storage.set ===
            'function'
        ) {

          await Promise.race([

            window.storage.set(
              'wm-sheets-url',
              JSON.stringify(
                url
              ),
              true
            ),

            new Promise(
              resolve =>
                setTimeout(
                  resolve,
                  800
                )
            )

          ]);

        }

      } catch (_) {}


      APPS_SCRIPT_URL =
        url;


      try {

        const data =
          await Promise.race([

            loadRemoteData(),

            new Promise(
              (
                _,
                reject
              ) =>
                setTimeout(
                  () =>
                    reject(
                      new Error(
                        'Tiempo de espera agotado'
                      )
                    ),
                  15000
                )
            )

          ]);


        if (
          !data
        ) {

          throw new Error(
            'No se recibió una respuesta válida del Web App.'
          );

        }


        if (
          data.program
        ) {

          PROGRAM =
            data.program;

        }


        if (
          data.people
        ) {

          PEOPLE =
            data.people;

        }


        ensurePeopleBimestreKeys();


        setSheetsStatus(
          true,
          '☁ Sheets conectado'
        );


        overlay.remove();


        render();


        alert(
          '¡Conexión con Google Sheets correcta!'
        );

      } catch (err) {

        submitBtn.disabled =
          false;


        submitBtn.textContent =
          'Conectar y probar';


        setSheetsStatus(
          false,
          '☁ Sheets no conectado'
        );


        alert(
          'No se pudo conectar con Google Sheets.\n\n' +
          'Primero prueba la URL /exec directamente en una pestaña del navegador.\n\n' +
          'Detalle: ' +
          (
            err &&
            err.message
              ? err.message
              : err
          )
        );

      }

    };


  input.addEventListener(
    'keydown',
    e => {

      if (
        e.key ===
        'Enter'
      ) {

        submit();

      }

    }
  );


  overlay
    .querySelector(
      '[data-a="cancel"]'
    )
    .addEventListener(
      'click',
      () =>
        overlay.remove()
    );


  overlay
    .querySelector(
      '[data-a="ok"]'
    )
    .addEventListener(
      'click',
      submit
    );

}


// ============================================================
// MODAL GENERAL
// ============================================================

function openOverlay(
  innerHtml
) {

  const overlay =
    el(`
      <div class="overlay">
        <div class="modal">
          ${innerHtml}
        </div>
      </div>
    `);


  document.body.appendChild(
    overlay
  );


  overlay.addEventListener(
    'click',
    e => {

      if (
        e.target ===
        overlay
      ) {

        overlay.remove();

      }

    }
  );


  return overlay;

}


// ============================================================
// MODAL DE CONFIRMACIÓN
// ============================================================

function openConfirmModal(
  message,
  onConfirm,
  opts
) {

  opts =
    opts || {};


  const overlay =
    openOverlay(`
      <div class="modal-head">

        <h3>
          ${esc(
            opts.title ||
            'Confirmar'
          )}
        </h3>

        <p>
          ${esc(
            message
          )}
        </p>

      </div>

      <div class="modal-foot">

        <button
          class="btn btn-ghost btn-sm"
          data-a="cancel"
        >
          Cancelar
        </button>

        <button
          class="btn ${
            opts.danger
              ? 'btn-danger'
              : 'btn-primary'
          } btn-sm"
          data-a="ok"
        >
          ${esc(
            opts.okLabel ||
            'Confirmar'
          )}
        </button>

      </div>
    `);


  overlay
    .querySelector(
      '[data-a="cancel"]'
    )
    .addEventListener(
      'click',
      () =>
        overlay.remove()
    );


  overlay
    .querySelector(
      '[data-a="ok"]'
    )
    .addEventListener(
      'click',
      () => {

        overlay.remove();

        onConfirm();

      }
    );

}


// ============================================================
// MODAL DE TEXTO
// ============================================================

function openTextPromptModal(
  title,
  placeholder,
  onSubmit,
  prefill
) {

  const overlay =
    openOverlay(`
      <div class="modal-head">

        <h3>
          ${esc(title)}
        </h3>

      </div>

      <div class="modal-search">

        <input
          class="search-input"
          type="text"
          placeholder="${esc(
            placeholder || ''
          )}"
        />

      </div>

      <div class="modal-foot">

        <button
          class="btn btn-ghost btn-sm"
          data-a="cancel"
        >
          Cancelar
        </button>

        <button
          class="btn btn-primary btn-sm"
          data-a="ok"
        >
          Guardar
        </button>

      </div>
    `);


  const input =
    overlay.querySelector(
      'input'
    );


  if (
    prefill
  ) {

    input.value =
      prefill;

  }


  input.focus();

  input.select();


  const submit =
    () => {

      const v =
        input.value.trim();


      if (
        v
      ) {

        overlay.remove();

        onSubmit(
          v
        );

      }

    };


  input.addEventListener(
    'keydown',
    e => {

      if (
        e.key ===
        'Enter'
      ) {

        submit();

      }

    }
  );


  overlay
    .querySelector(
      '[data-a="cancel"]'
    )
    .addEventListener(
      'click',
      () =>
        overlay.remove()
    );


  overlay
    .querySelector(
      '[data-a="ok"]'
    )
    .addEventListener(
      'click',
      submit
    );

}


// ============================================================
// BOTÓN DE EDICIÓN
// ============================================================

function editPencil(
  title,
  currentValue,
  onSave
) {

  const btn =
    el(`
      <button
        class="edit-pencil"
        title="Editar"
      >
        ✎
      </button>
    `);


  btn.addEventListener(
    'click',
    e => {

      e.stopPropagation();


      openTextPromptModal(
        title,
        '',
        onSave,
        currentValue
      );

    }
  );


  return btn;

}


// ============================================================
// MODAL PIN
// ============================================================

async function openPinModal() {

  const pin =
    await getAdminPin();


  const overlay =
    openOverlay(`
      <div class="modal-head">

        <h3>
          Acceso de administrador
        </h3>

        <p>
          Ingresa el PIN para poder
          editar el programa y la
          base de datos.
        </p>

      </div>

      <div class="modal-search">

        <input
          class="search-input"
          type="password"
          inputmode="numeric"
          placeholder="PIN"
        />

      </div>

      <div class="modal-foot">

        <span
          class="empty-note"
          style="
            padding:0;
            margin-right:auto;
            display:none;
          "
          id="pin-error"
        >
          PIN incorrecto
        </span>

        <button
          class="btn btn-ghost btn-sm"
          data-a="cancel"
        >
          Cancelar
        </button>

        <button
          class="btn btn-primary btn-sm"
          data-a="ok"
        >
          Entrar
        </button>

      </div>
    `);


  const input =
    overlay.querySelector(
      'input'
    );


  input.focus();


  const tryEnter =
    () => {

      if (
        input.value ===
        pin
      ) {

        overlay.remove();


        isAdmin =
          true;


        render();

      } else {

        overlay
          .querySelector(
            '#pin-error'
          )
          .style.display =
          'inline';


        input.value =
          '';


        input.focus();

      }

    };


  input.addEventListener(
    'keydown',
    e => {

      if (
        e.key ===
        'Enter'
      ) {

        tryEnter();

      }

    }
  );


  overlay
    .querySelector(
      '[data-a="cancel"]'
    )
    .addEventListener(
      'click',
      () =>
        overlay.remove()
    );


  overlay
    .querySelector(
      '[data-a="ok"]'
    )
    .addEventListener(
      'click',
      tryEnter
    );

}


// ============================================================
// CAMBIAR PIN
// ============================================================

function openChangePinModal() {

  const overlay =
    openOverlay(`
      <div class="modal-head">

        <h3>
          Cambiar PIN de administrador
        </h3>

        <p>
          Elige un PIN nuevo.
          Compártelo solo con quienes
          preparan el programa.
        </p>

      </div>

      <div class="modal-search">

        <input
          class="search-input"
          type="text"
          inputmode="numeric"
          placeholder="Nuevo PIN"
        />

      </div>

      <div class="modal-foot">

        <button
          class="btn btn-ghost btn-sm"
          data-a="cancel"
        >
          Cancelar
        </button>

        <button
          class="btn btn-primary btn-sm"
          data-a="ok"
        >
          Guardar PIN
        </button>

      </div>
    `);


  const input =
    overlay.querySelector(
      'input'
    );


  input.focus();


  const submit =
    () => {

      const v =
        input.value.trim();


      if (
        !v
      ) {

        return;

      }


      setAdminPin(
        v
      );


      overlay.remove();

    };


  input.addEventListener(
    'keydown',
    e => {

      if (
        e.key ===
        'Enter'
      ) {

        submit();

      }

    }
  );


  overlay
    .querySelector(
      '[data-a="cancel"]'
    )
    .addEventListener(
      'click',
      () =>
        overlay.remove()
    );


  overlay
    .querySelector(
      '[data-a="ok"]'
    )
    .addEventListener(
      'click',
      submit
    );

}


// ============================================================
// UTILIDADES
// ============================================================

function esc(s) {

  return (
    s ?? ''
  )
    .toString()
    .replace(
      /[&<>"']/g,
      c =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;'
        }[c])
    );

}


function el(
  html
) {

  const t =
    document.createElement(
      'template'
    );


  t.innerHTML =
    html.trim();


  return t.content
    .firstElementChild;

}


function eligibleFor(
  cat
) {

  if (
    cat === 'libre'
  ) {

    return PEOPLE
      .slice()
      .sort(
        (a, b) =>
          a.nombre.localeCompare(
            b.nombre,
            'es'
          )
      );

  }


  const key =
    cat ===
    'estudio_biblico_lector'
      ? 'elig_maestros_lectura'
      : (
          'elig_' +
          cat
        );


  return PEOPLE
    .filter(
      p =>
        p[key]
    )
    .sort(
      (a, b) =>
        a.nombre.localeCompare(
          b.nombre,
          'es'
        )
    );

}


// ============================================================
// RENDER PRINCIPAL
// ============================================================

function render() {

  if (
    !isAdmin &&
    currentTab ===
      'publicadores'
  ) {

    currentTab =
      'programa';

  }


  const root =
    document.getElementById(
      'root'
    );


  root.innerHTML =
    '';


  root.appendChild(
    renderHeader()
  );


  if (
    APPS_SCRIPT_URL &&
    sheetsConnected
  ) {

    setSheetsStatus(
      true
    );

  } else if (
    APPS_SCRIPT_URL
  ) {

    setSheetsStatus(
      false,
      '☁ Sheets listo para conectar'
    );

  }


  const body =
    el(
      `<div class="section-pad"></div>`
    );


  if (
    !PROGRAM
  ) {

    body.appendChild(
      el(
        `<div class="loading">Cargando datos…</div>`
      )
    );

  } else if (
    currentTab ===
    'programa'
  ) {

    body.appendChild(
      renderProgramaTab()
    );

  } else {

    body.appendChild(
      renderPublicadoresTab()
    );

  }


  root.appendChild(
    body
  );

}


// ============================================================
// ENCABEZADO
// ============================================================

function renderHeader() {

  const header =
    el(`
      <div class="app-header">

        <div class="brand">

          <h1>
            Vida y Ministerio
          </h1>

          <span class="sub">
            Villa Concha
          </span>

          <span
            class="sheets-status offline"
            id="sheets-status"
          >
            ☁ Sheets no conectado
          </span>

          <span
            class="admin-toggle"
            style="margin-left:8px;"
          ></span>

        </div>

        <div class="tabbar">

          <button
            data-tab="programa"
            class="${
              currentTab ===
              'programa'
                ? 'active'
                : ''
            }"
          >
            Programa
          </button>

          ${
            isAdmin
              ? `
                <button
                  data-tab="publicadores"
                  class="${
                    currentTab ===
                    'publicadores'
                      ? 'active'
                      : ''
                  }"
                >
                  Publicadores
                </button>
              `
              : ''
          }

        </div>

      </div>
    `);


  header
    .querySelector(
      '.brand'
    )
    .style.display =
    'flex';


  const adminSlot =
    header.querySelector(
      '.admin-toggle'
    );


  if (
    isAdmin
  ) {

    adminSlot.innerHTML =
      `
        <button
          class="admin-btn admin-on"
        >
          🔓 Admin
        </button>
      `;


    adminSlot
      .querySelector(
        'button'
      )
      .addEventListener(
        'click',
        () => {

          openConfirmModal(
            '¿Salir del modo administrador? Dejarás de poder editar hasta ingresar el PIN de nuevo.',
            () => {

              isAdmin =
                false;

              render();

            },
            {
              title:
                'Salir de modo admin',

              okLabel:
                'Salir'
            }
          );

        }
      );

  } else {

    adminSlot.innerHTML =
      `
        <button
          class="admin-btn"
        >
          🔒 Admin
        </button>
      `;


    adminSlot
      .querySelector(
        'button'
      )
      .addEventListener(
        'click',
        () =>
          openPinModal()
      );

  }


  header
    .querySelectorAll(
      'button[data-tab]'
    )
    .forEach(
      b => {

        b.addEventListener(
          'click',
          () => {

            currentTab =
              b.dataset.tab;

            render();

          }
        );

      }
    );


  return header;

}


// ============================================================
// PESTAÑA PROGRAMA
// ============================================================

function renderProgramaTab() {

  const wrap =
    el(
      `<div></div>`
    );


  if (
    !isAdmin
  ) {

    const viewerLabels =
      computeViewerBimestres();


    const available =
      viewerLabels
        .map(
          label =>
            PROGRAM.find(
              b =>
                b.bimestre ===
                label
            )
        )
        .filter(Boolean);


    currentBimestre =
      available[0]?.bimestre ||
      viewerLabels[0];


    wrap.appendChild(
      el(
        `<div class="view-only-note">👁️ Estás viendo el programa en modo solo lectura. Desde el primer día de cada mes se muestran el bimestre vigente y el siguiente.</div>`
      )
    );


    if (
      !available.length
    ) {

      wrap.appendChild(
        el(
          `<div class="empty-note">Todavía no hay programa cargado para ${esc(
            viewerLabels.join(
              ' o '
            )
          )}.</div>`
        )
      );


      return wrap;

    }


    available.forEach(
      bim => {

        const title =
          el(
            `<div class="viewer-bimester-title">${esc(
              bim.bimestre
            )}</div>`
          );


        wrap.appendChild(
          title
        );


        bim.weeks.forEach(
          w =>
            wrap.appendChild(
              renderWeekCard(
                bim,
                w
              )
            )
        );

      }
    );


    return wrap;

  }


  const toolbar =
    el(`
      <div class="program-toolbar">

        <div
          class="pill-row"
          style="margin:0;"
        ></div>

        <div class="actions">

          <button
            class="btn btn-ghost btn-sm"
            id="pdf-bimestre"
          >
            ⬇ Descargar PDF
          </button>

          <button
            class="btn btn-ghost btn-sm"
            id="sheets-config"
          >
            ☁ Conectar Sheets
          </button>

          <button
            class="btn btn-primary btn-sm"
            id="add-bimestre"
          >
            + Agregar bimestre
          </button>

        </div>

      </div>
    `);


  const pills =
    toolbar.querySelector(
      '.pill-row'
    );


  PROGRAM.forEach(
    b => {

      const p =
        el(`
          <button
            class="pill ${
              b.bimestre ===
              currentBimestre
                ? 'active'
                : ''
            }"
          >
            ${esc(
              b.bimestre
            )}
          </button>
        `);


      p.addEventListener(
        'click',
        () => {

          currentBimestre =
            b.bimestre;

          render();

        }
      );


      pills.appendChild(
        p
      );

    }
  );


  wrap.appendChild(
    toolbar
  );


  toolbar
    .querySelector(
      '#add-bimestre'
    )
    .addEventListener(
      'click',
      () =>
        openAddBimestreModal()
    );


  toolbar
    .querySelector(
      '#pdf-bimestre'
    )
    .addEventListener(
      'click',
      () =>
        openPdfBimestreModal()
    );


  toolbar
    .querySelector(
      '#sheets-config'
    )
    .addEventListener(
      'click',
      () =>
        openSheetsConfigModal()
    );


  const bim =
    PROGRAM.find(
      b =>
        b.bimestre ===
        currentBimestre
    ) ||
    PROGRAM[0];


  if (
    !bim
  ) {

    return wrap;

  }


  bim.weeks.forEach(
    w =>
      wrap.appendChild(
        renderWeekCard(
          bim,
          w
        )
      )
  );


  return wrap;

}


// ============================================================
// GESTIÓN DE BIMESTRES
// ============================================================

function cloneForNewBimestre(
  template,
  newLabel
) {

  const clone =
    JSON.parse(
      JSON.stringify(
        template
      )
    );


  clone.bimestre =
    newLabel;


  clone.weeks =
    (
      clone.weeks ||
      []
    ).map(
      (
        w,
        wi
      ) => {

        const nw =
          JSON.parse(
            JSON.stringify(
              w
            )
          );


        nw.id =
          `${newLabel}__${wi}`;


        nw.items =
          (
            nw.items ||
            []
          ).map(
            it => {

              const ni =
                JSON.parse(
                  JSON.stringify(
                    it
                  )
                );


              if (
                Object.prototype.hasOwnProperty.call(
                  ni,
                  'name'
                )
              ) {

                ni.name =
                  '';

              }


              if (
                Object.prototype.hasOwnProperty.call(
                  ni,
                  'conductor'
                )
              ) {

                ni.conductor =
                  '';

              }


              if (
                Object.prototype.hasOwnProperty.call(
                  ni,
                  'lector'
                )
              ) {

                ni.lector =
                  '';

              }


              if (
                Array.isArray(
                  ni.subs
                )
              ) {

                ni.subs =
                  ni.subs.map(
                    s => ({
                      ...s,
                      name: ''
                    })
                  );

              }


              return ni;

            }
          );


        return nw;

      }
    );


  return clone;

}


// ============================================================
// AGREGAR BIMESTRE
// ============================================================

function openAddBimestreModal() {

  const options =
    PROGRAM
      .map(
        b =>
          `<option value="${esc(
            b.bimestre
          )}">${esc(
            b.bimestre
          )}</option>`
      )
      .join('');


  const overlay =
    openOverlay(`
      <div class="modal-head">

        <h3>
          Agregar bimestre
        </h3>

        <p>
          Se copiará el diseño del bimestre elegido y se crearán las asignaciones vacías para trabajarlo desde la app.
        </p>

      </div>

      <div class="modal-search">

        <label
          style="
            display:block;
            font-family:'IBM Plex Mono',monospace;
            font-size:10.5px;
            text-transform:uppercase;
            color:var(--muted);
            margin-bottom:5px;
          "
        >
          Nombre del nuevo bimestre
        </label>

        <input
          class="search-input"
          id="new-bim-name"
          placeholder="Ej. Noviembre - Diciembre"
        />

        <label
          style="
            display:block;
            font-family:'IBM Plex Mono',monospace;
            font-size:10.5px;
            text-transform:uppercase;
            color:var(--muted);
            margin:12px 0 5px;
          "
        >
          Usar como plantilla
        </label>

        <select
          class="search-input"
          id="new-bim-template"
        >
          ${options}
        </select>

      </div>

      <div class="modal-foot">

        <button
          class="btn btn-ghost btn-sm"
          data-a="cancel"
        >
          Cancelar
        </button>

        <button
          class="btn btn-primary btn-sm"
          data-a="ok"
        >
          Crear bimestre
        </button>

      </div>
    `);


  const input =
    overlay.querySelector(
      '#new-bim-name'
    );


  input.focus();


  const submit =
    () => {

      const label =
        input.value.trim();


      const templateLabel =
        overlay
          .querySelector(
            '#new-bim-template'
          )
          .value;


      if (
        !label
      ) {

        return;

      }


      if (
        PROGRAM.some(
          b =>
            b.bimestre.toLowerCase() ===
            label.toLowerCase()
        )
      ) {

        input.setCustomValidity(
          'Ese bimestre ya existe.'
        );


        input.reportValidity();


        return;

      }


      const template =
        PROGRAM.find(
          b =>
            b.bimestre ===
            templateLabel
        ) ||
        PROGRAM[
          PROGRAM.length - 1
        ];


      const newBim =
        cloneForNewBimestre(
          template,
          label
        );


      PROGRAM.push(
        newBim
      );


      PEOPLE.forEach(
        p => {

          if (
            !p.disponibilidad
          ) {

            p.disponibilidad =
              {};

          }


          if (
            !Object.prototype.hasOwnProperty.call(
              p.disponibilidad,
              label
            )
          ) {

            p.disponibilidad[
              label
            ] =
              'Disponible';

          }

        }
      );


      currentBimestre =
        label;


      openWeeks.clear();


      overlay.remove();


      Promise.all([
        saveProgram(),
        savePeople()
      ]).then(
        () =>
          render()
      );

    };


  input.addEventListener(
    'keydown',
    e => {

      if (
        e.key ===
        'Enter'
      ) {

        submit();

      }

    }
  );


  overlay
    .querySelector(
      '[data-a="cancel"]'
    )
    .addEventListener(
      'click',
      () =>
        overlay.remove()
    );


  overlay
    .querySelector(
      '[data-a="ok"]'
    )
    .addEventListener(
      'click',
      submit
    );

}


// ============================================================
// PDF
// ============================================================

function buildPdfWeekNode(
  bim,
  w
) {

  const root =
    el(`
      <div
        class="pdf-week-capture"
        style="
          width:820px;
          background:#faf6ee;
          padding:18px 0 24px;
        "
      ></div>
    `);


  const header =
    el(`
      <div
        style="
          font-family:'Fraunces',serif;
          color:#123338;
          margin:0 0 12px;
          padding:0 18px 10px;
          border-bottom:2px solid #123338;
        "
      >

        <div
          style="
            font-size:22px;
            font-weight:700;
          "
        >
          Vida y Ministerio — Villa Concha
        </div>

        <div
          style="
            font-family:'IBM Plex Mono',monospace;
            font-size:11px;
            color:#7c7263;
            margin-top:3px;
          "
        >
          ${esc(
            bim.bimestre
          )} · Programa completo
        </div>

      </div>
    `);


  root.appendChild(
    header
  );


  const card =
    el(`
      <div
        class="week-card open"
        style="
          margin:0 18px;
          box-shadow:
            0 1px 2px rgba(27,46,53,.06),
            0 6px 20px -8px rgba(27,46,53,.18);
        "
      >

        <div class="week-head">

          <div class="wk-titles">

            <p
              class="wk-semana"
              style="margin:0 0 4px;"
            >
              ${esc(
                (
                  w.semana ||
                  ''
                ).toLowerCase()
              )}
            </p>

            <p
              class="wk-lectura"
              style="margin:0;"
            >
              ${esc(
                w.lectura_semanal ||
                ''
              )}
            </p>

          </div>

        </div>

        <div
          class="week-body"
          style="
            display:block;
            padding-top:14px;
          "
        ></div>

      </div>
    `);


  const body =
    card.querySelector(
      '.week-body'
    );


  let lastSection =
    null;


  (
    w.items ||
    []
  ).forEach(
    it => {

      const sec =
        [
          'TESOROS',
          'MAESTROS',
          'NVC'
        ].includes(
          it.section
        )
          ? it.section
          : null;


      if (
        sec &&
        sec !== lastSection
      ) {

        body.appendChild(
          el(
            `<span class="section-label ${sec}">${sectionLabelHtml(
              sec
            )}</span>`
          )
        );


        lastSection =
          sec;

      } else if (
        !sec
      ) {

        lastSection =
          null;

      }


      if (
        isPureSongLine(it)
      ) {

        const songLabel =
          getSongDisplayLabel(
            it
          );


        body.appendChild(
          el(
            `<div class="item-row"><div class="item-label song-label">${songIconSvg()}<span class="song-text">${esc(
              songLabel
            )}</span></div></div>`
          )
        );


        return;

      }


      if (
        Object.prototype.hasOwnProperty.call(
          it,
          'conductor'
        )
      ) {

        body.appendChild(
          pdfAssignmentLine(
            it.label,
            it.conductor,
            'Conductor'
          )
        );


        body.appendChild(
          pdfAssignmentLine(
            it.label,
            it.lector,
            'Lector'
          )
        );

      } else if (
        Array.isArray(
          it.subs
        )
      ) {

        it.subs.forEach(
          s =>
            body.appendChild(
              pdfAssignmentLine(
                it.label,
                s.name,
                s.role
              )
            )
        );

      } else {

        body.appendChild(
          pdfAssignmentLine(
            it.label,
            it.name,
            ''
          )
        );

      }

    }
  );


  root.appendChild(
    card
  );


  return root;

}


function pdfAssignmentLine(
  label,
  name,
  role
) {

  return el(
    `<div class="item-row"><div class="item-label">${esc(
      label
    )}${
      role
        ? ` <span class="role-tag">— ${esc(
            role
          )}</span>`
        : ''
    }</div><span class="print-assignment ${
      name
        ? ''
        : 'empty'
    }">${esc(
      name ||
      'Sin asignar'
    )}</span></div>`
  );

}


// ============================================================
// MODAL PDF
// ============================================================

function openPdfBimestreModal() {

  const options =
    PROGRAM
      .map(
        b =>
          `<div class="modal-opt" data-bim="${esc(
            b.bimestre
          )}"><span>${esc(
            b.bimestre
          )}</span><span class="stat">${
            (
              b.weeks ||
              []
            ).length
          } semanas</span></div>`
      )
      .join('');


  const overlay =
    openOverlay(
      `
        <div class="modal-head">

          <h3>
            Descargar PDF
          </h3>

          <p>
            Selecciona un bimestre. El PDF tendrá todas sus semanas y todas las asignaciones completas, manteniendo el estilo de la app.
          </p>

        </div>

        <div class="modal-list">

          ${
            options ||
            '<div class="empty-note">No hay bimestres.</div>'
          }

        </div>

        <div class="modal-foot">

          <button
            class="btn btn-ghost btn-sm"
            data-a="cancel"
          >
            Cancelar
          </button>

        </div>
      `
    );


  overlay
    .querySelectorAll(
      '[data-bim]'
    )
    .forEach(
      opt => {

        opt.addEventListener(
          'click',
          async () => {

            const bim =
              PROGRAM.find(
                b =>
                  b.bimestre ===
                  opt.dataset.bim
              );


            overlay.remove();


            if (
              bim
            ) {

              await downloadBimestrePdf(
                bim
              );

            }

          }
        );

      }
    );


  overlay
    .querySelector(
      '[data-a="cancel"]'
    )
    .addEventListener(
      'click',
      () =>
        overlay.remove()
    );

}


// ============================================================
// DESCARGAR PDF
// ============================================================

async function downloadBimestrePdf(
  bim
) {

  if (
    !window.jspdf?.jsPDF
  ) {

    alert(
      'No se pudo cargar el generador PDF. Abre la aplicación con conexión a Internet y vuelve a intentarlo.'
    );


    return;

  }


  const {
    jsPDF
  } =
    window.jspdf;


  const doc =
    new jsPDF(
      {
        orientation:
          'p',

        unit:
          'mm',

        format:
          'a4',

        compress:
          true
      }
    );


  const pageW =
    210;


  const pageH =
    297;


  const margin =
    12;


  const contentW =
    pageW -
    margin * 2;


  let y =
    margin;


  function ensureSpace(
    h
  ) {

    if (
      y + h >
      pageH - margin
    ) {

      doc.addPage();

      y =
        margin;

    }

  }


  function wrapText(
    text,
    maxWidth,
    fontSize
  ) {

    doc.setFontSize(
      fontSize
    );


    return doc.splitTextToSize(
      String(
        text || ''
      ),
      maxWidth
    );

  }


  function drawHeader(
    first
  ) {

    const h =
      20;


    ensureSpace(
      h + 8
    );


    doc.setFillColor(
      18,
      51,
      56
    );


    doc.roundedRect(
      margin,
      y,
      contentW,
      h,
      3,
      3,
      'F'
    );


    doc.setTextColor(
      255,
      255,
      255
    );


    doc.setFont(
      'helvetica',
      'bold'
    );


    doc.setFontSize(
      15
    );


    doc.text(
      'Vida y Ministerio — Villa Concha',
      margin + 6,
      y + 8
    );


    doc.setFont(
      'helvetica',
      'normal'
    );


    doc.setFontSize(
      8.5
    );


    doc.text(
      String(
        bim.bimestre
      ),
      margin + 6,
      y + 14
    );


    doc.setTextColor(
      27,
      46,
      53
    );


    y +=
      h + 7;

  }


  async function drawWeek(
    w,
    index
  ) {

    const title =
      String(
        w.semana ||
        ''
      ).toLowerCase();


    const lectura =
      String(
        w.lectura_semanal ||
        ''
      );


    let rows =
      [];


    let lastSection =
      null;


    (
      w.items ||
      []
    ).forEach(
      it => {

        const sec =
          [
            'TESOROS',
            'MAESTROS',
            'NVC'
          ].includes(
            it.section
          )
            ? it.section
            : null;


        if (
          sec &&
          sec !== lastSection
        ) {

          rows.push({
            type:
              'section',

            text:
              sectionLabelText(
                sec
              ),

            sec

          });

        }


        if (
          !sec
        ) {

          lastSection =
            null;

        } else {

          lastSection =
            sec;

        }


        if (
          isPureSongLine(it)
        ) {

          rows.push({
            type:
              'row',

            label:
              getSongDisplayLabel(
                it
              ),

            name:
              '',

            song:
              true

          });

        } else if (
          Object.prototype.hasOwnProperty.call(
            it,
            'conductor'
          )
        ) {

          rows.push({
            type:
              'row',

            label:
              it.label,

            name:
              it.conductor,

            role:
              'Conductor'
          });


          rows.push({
            type:
              'row',

            label:
              it.label,

            name:
              it.lector,

            role:
              'Lector'
          });

        } else if (
          Array.isArray(
            it.subs
          )
        ) {

          it.subs.forEach(
            sub => {

              rows.push({
                type:
                  'row',

                label:
                  it.label,

                name:
                  sub.name,

                role:
                  sub.role

              });

            }
          );

        } else {

          rows.push({
            type:
              'row',

            label:
              it.label,

            name:
              it.name

          });

        }

      }
    );


    let estimate =
      18;


    rows.forEach(
      r => {

        if (
          r.type ===
          'section'
        ) {

          estimate +=
            9;

        } else {

          estimate +=
            10;

        }

      }
    );


    estimate +=
      18;


    if (
      y +
        Math.min(
          estimate,
          pageH -
            margin * 2
        ) >
        pageH -
          margin &&
      y >
        margin + 25
    ) {

      doc.addPage();

      y =
        margin;

    }


    doc.setFillColor(
      255,
      255,
      255
    );


    doc.setDrawColor(
      227,
      217,
      196
    );


    const top =
      y;


    doc.roundedRect(
      margin,
      y,
      contentW,
      16,
      3,
      3,
      'FD'
    );


    doc.setTextColor(
      18,
      51,
      56
    );


    doc.setFont(
      'helvetica',
      'bold'
    );


    doc.setFontSize(
      12
    );


    doc.text(
      title,
      margin + 5,
      y + 7
    );


    doc.setTextColor(
      124,
      114,
      99
    );


    doc.setFont(
      'courier',
      'normal'
    );


    doc.setFontSize(
      7.5
    );


    const lectLines =
      wrapText(
        lectura,
        contentW - 10,
        7.5
      );


    doc.text(
      lectLines.slice(
        0,
        2
      ),
      margin + 5,
      y + 12
    );


    y +=
      20;


    for (
      const r of rows
    ) {

      if (
        r.type ===
        'section'
      ) {

        ensureSpace(
          10
        );


        const label =
          String(
            r.text || ''
          ).toUpperCase();


        const colors = {

          TESOROS:
            [
              87,
              90,
              93
            ],

          MAESTROS:
            [
              190,
              137,
              0
            ],

          NVC:
            [
              126,
              0,
              36
            ]

        };


        const fill =
          colors[
            r.sec
          ] ||
          [
            138,
            131,
            117
          ];


        doc.setFillColor(
          ...fill
        );


        doc.setFont(
          'times',
          'bold'
        );


        doc.setFontSize(
          7.0
        );


        const textW =
          doc.getTextWidth(
            label
          );


        const iconW =
          7;


        const tw =
          Math.min(
            contentW - 8,
            textW +
              iconW +
              13
          );


        doc.roundedRect(
          margin + 3,
          y,
          tw,
          7,
          1.5,
          1.5,
          'F'
        );


        doc.setTextColor(
          255,
          255,
          255
        );


        const iconData =
          await svgToPngDataUrl(
            PDF_ICON_SVG[
              r.sec
            ],
            48,
            48
          );


        doc.addImage(
          iconData,
          'PNG',
          margin + 5.0,
          y + 0.9,
          6.0,
          6.0,
          undefined,
          'FAST'
        );


        doc.text(
          label,
          margin + 13,
          y + 4.8
        );


        y +=
          10;


        continue;

      }


      const labelLines =
        wrapText(
          r.label,
          r.song
            ? contentW - 64
            : contentW - 62,
          8.2
        );


      const rowH =
        Math.max(
          9,
          labelLines.length *
            4.2 +
            4
        );


      ensureSpace(
        rowH
      );


      doc.setDrawColor(
        241,
        235,
        221
      );


      doc.line(
        margin + 3,
        y + rowH,
        margin +
          contentW -
          3,
        y + rowH
      );


      doc.setTextColor(
        27,
        46,
        53
      );


      doc.setFont(
        'helvetica',
        'normal'
      );


      doc.setFontSize(
        8.2
      );


      const labelX =
        r.song
          ? margin + 11
          : margin + 4;


      if (
        r.song
      ) {

        const songData =
          await svgToPngDataUrl(
            PDF_ICON_SVG.SONG,
            36,
            36
          );


        doc.addImage(
          songData,
          'PNG',
          margin + 4.0,
          y + 1.0,
          4.8,
          4.8,
          undefined,
          'FAST'
        );

      }


      doc.text(
        labelLines,
        labelX,
        y + 5
      );


      const right =
        r.name
          ? String(
              r.name
            )
          : 'Sin asignar';


      doc.setTextColor(
        r.name
          ? 18
          : 181,
        r.name
          ? 51
          : 80,
        r.name
          ? 56
          : 46
      );


      doc.setFont(
        'helvetica',
        r.name
          ? 'bold'
          : 'italic'
      );


      doc.setFontSize(
        7.8
      );


      const nameLines =
        wrapText(
          right,
          50,
          7.8
        ).slice(
          0,
          2
        );


      const nx =
        margin +
        contentW -
        4;


      nameLines.forEach(
        (
          line,
          ii
        ) =>
          doc.text(
            line,
            nx,
            y +
              5 +
              ii * 4,
            {
              align:
                'right'
            }
          )
      );


      if (
        r.role
      ) {

        doc.setTextColor(
          124,
          114,
          99
        );


        doc.setFont(
          'courier',
          'normal'
        );


        doc.setFontSize(
          6.3
        );


        doc.text(
          '— ' +
            String(
              r.role
            ),
          margin + 4,
          y +
            rowH -
            2
        );

      }


      y +=
        rowH;

    }


    y +=
      6;

  }


  drawHeader(
    true
  );


  for (
    let i = 0;
    i <
      (
        bim.weeks ||
        []
      ).length;
    i++
  ) {

    const w =
      bim.weeks[i];


    if (
      y >
      pageH -
        margin -
        25
    ) {

      doc.addPage();

      y =
        margin;

    }


    await drawWeek(
      w,
      i
    );

  }


  const safeName =
    String(
      bim.bimestre
    )
      .replace(
        /[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ -]/g,
        ''
      )
      .trim()
      .replace(
        /\s+/g,
        '_'
      );


  doc.save(
    `Vida_y_Ministerio_${safeName}.pdf`
  );

}


// ============================================================
// ETIQUETAS DE SECCIONES
// ============================================================

function sectionLabelText(
  sec
) {

  if (
    sec ===
    'TESOROS'
  ) {

    return 'Tesoros de la Biblia';

  }


  if (
    sec ===
    'MAESTROS'
  ) {

    return 'Seamos mejores maestros';

  }


  if (
    sec ===
    'NVC'
  ) {

    return 'Nuestra vida cristiana';

  }


  return null;

}


function sectionIconSvg(
  sec
) {

  if (
    sec ===
    'TESOROS'
  ) {

    return `
      <span class="section-icon">

        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.7"
          stroke-linejoin="round"
        >

          <path
            d="M6 3h12l4 6-10 12L2 9z"
          />

          <path
            d="M11 3 8 9l4 12 4-12-3-6"
          />

          <path
            d="M2 9h20"
          />

        </svg>

      </span>
    `;

  }


  if (
    sec ===
    'MAESTROS'
  ) {

    return `
      <span class="section-icon">

        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.7"
          stroke-linecap="round"
          stroke-linejoin="round"
        >

          <path
            d="M12 2v20"
          />

          <path
            d="M12 6C9 6 7 8 7 10c0 2 2 2 5 0"
          />

          <path
            d="M12 11c-3 0-5 2-5 4 0 2 2 2 5 0"
          />

          <path
            d="M12 8c3 0 5 2 5 4 0 2-2 2-5 0"
          />

          <path
            d="M12 13c3 0 5 2 5 4 0 2-2 2-5 0"
          />

        </svg>

      </span>
    `;

  }


  if (
    sec ===
    'NVC'
  ) {

    return `
      <span class="section-icon">

        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.7"
          stroke-linecap="round"
          stroke-linejoin="round"
        >

          <path
            d="M15.8 8.4c.8-1.7 2.2-2.4 3.5-1.8 1.2.5 1.6 1.7 1.1 2.8-.3.8-.9 1.3-1.7 1.5"
          />

          <path
            d="M6.8 16.8h8.1a4.2 4.2 0 1 0-1.8-8 5.2 5.2 0 0 0-8.9 2.7 3.9 3.9 0 0 0 2.6 5.3Z"
          />

          <path
            d="M9 17v3M14 17v3"
          />

          <circle
            cx="19.1"
            cy="9.6"
            r=".55"
            fill="currentColor"
            stroke="none"
          />

        </svg>

      </span>
    `;

  }


  return '';

}


function sectionLabelHtml(
  sec
) {

  const text =
    sectionLabelText(
      sec
    );


  return text
    ? `${sectionIconSvg(
        sec
      )}<span>${esc(
        text
      )}</span>`
    : '';

}


// ============================================================
// ICONO DE CANCIÓN
// ============================================================

function songIconSvg() {

  return `
    <span
      class="song-icon"
      aria-hidden="true"
    >

      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      >

        <path
          d="M9 17V5l11-2v12"
        />

        <path
          d="M9 5l11-2"
        />

        <circle
          cx="6"
          cy="17"
          r="3"
        />

        <circle
          cx="17"
          cy="15"
          r="3"
        />

      </svg>

    </span>
  `;

}


// ============================================================
// ICONOS PARA PDF
// ============================================================

const PDF_ICON_SVG = {

  TESOROS:
    `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="1.7" stroke-linejoin="round"><path d="M6 3h12l4 6-10 12L2 9z"/><path d="M11 3 8 9l4 12 4-12-3-6"/><path d="M2 9h20"/></svg>`,

  MAESTROS:
    `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"/><path d="M12 6C9 6 7 8 7 10c0 2 2 2 5 0"/><path d="M12 11c-3 0-5 2-5 4 0 2 2 2 5 0"/><path d="M12 8c3 0 5 2 5 4 0 2-2 2-5 0"/><path d="M12 13c3 0 5 2 5 4 0 2-2 2-5 0"/></svg>`,

  NVC:
    `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M15.8 8.4c.8-1.7 2.2-2.4 3.5-1.8 1.2.5 1.6 1.7 1.1 2.8-.3.8-.9 1.3-1.7 1.5"/><path d="M6.8 16.8h8.1a4.2 4.2 0 1 0-1.8-8 5.2 5.2 0 0 0-8.9 2.7 3.9 3.9 0 0 0 2.6 5.3Z"/><path d="M9 17v3M14 17v3"/><circle cx="19.1" cy="9.6" r=".55" fill="#ffffff" stroke="none"/></svg>`,

  SONG:
    `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#be8900" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 17V5l11-2v12"/><path d="M9 5l11-2"/><circle cx="6" cy="17" r="3"/><circle cx="17" cy="15" r="3"/></svg>`

};


const PDF_ICON_CACHE =
  {};


function svgToPngDataUrl(
  svg,
  w = 48,
  h = 48
) {

  const key =
    svg +
    '|' +
    w +
    '|' +
    h;


  if (
    PDF_ICON_CACHE[key]
  ) {

    return PDF_ICON_CACHE[key];

  }


  PDF_ICON_CACHE[key] =
    new Promise(
      (
        resolve,
        reject
      ) => {

        const img =
          new Image();


        img.onload =
          () => {

            const c =
              document.createElement(
                'canvas'
              );


            c.width =
              w;


            c.height =
              h;


            const ctx =
              c.getContext(
                '2d'
              );


            ctx.clearRect(
              0,
              0,
              w,
              h
            );


            ctx.drawImage(
              img,
              0,
              0,
              w,
              h
            );


            resolve(
              c.toDataURL(
                'image/png'
              )
            );

          };


        img.onerror =
          reject;


        img.src =
          'data:image/svg+xml;charset=utf-8,' +
          encodeURIComponent(
            svg
          );

      }
    );


  return PDF_ICON_CACHE[key];

}


// ============================================================
// TARJETA DE SEMANA
// ============================================================

function renderWeekCard(
  bim,
  w
) {

  const isOpen =
    openWeeks.has(
      w.id
    );


  const card =
    el(`
      <div
        class="week-card ${
          isOpen
            ? 'open'
            : ''
        }"
      >

        <div class="week-head">

          <div class="wk-titles">

            <div class="wk-titles-row">

              <p class="wk-semana">
                ${esc(
                  w.semana.toLowerCase()
                )}
              </p>

            </div>

            <div class="wk-lectura-row">

              <p class="wk-lectura">
                ${esc(
                  w.lectura_semanal ||
                  ''
                )}
              </p>

            </div>

          </div>

          <svg
            class="chevron"
            viewBox="0 0 24 24"
            fill="none"
          >

            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />

          </svg>

        </div>

        <div
          class="week-body"
        ></div>

      </div>
    `);


  card
    .querySelector(
      '.week-head'
    )
    .addEventListener(
      'click',
      () => {

        if (
          openWeeks.has(
            w.id
          )
        ) {

          openWeeks.delete(
            w.id
          );

        } else {

          openWeeks.add(
            w.id
          );

        }


        render();

      }
    );


  if (
    isAdmin
  ) {

    card
      .querySelector(
        '.wk-titles-row'
      )
      .appendChild(
        editPencil(
          'Editar semana',
          w.semana,
          v => {

            w.semana =
              v;

            saveProgram();

            render();

          }
        )
      );


    card
      .querySelector(
        '.wk-lectura-row'
      )
      .appendChild(
        editPencil(
          'Editar lectura semanal',
          w.lectura_semanal ||
            '',
          v => {

            w.lectura_semanal =
              v;

            saveProgram();

            render();

          }
        )
      );

  }


  if (
    isOpen
  ) {

    const bodyEl =
      card.querySelector(
        '.week-body'
      );


    let lastSection =
      null;


    w.items.forEach(
      (
        it,
        idx
      ) => {

        const sec =
          [
            'TESOROS',
            'MAESTROS',
            'NVC'
          ].includes(
            it.section
          )
            ? it.section
            : null;


        if (
          sec &&
          sec !==
            lastSection
        ) {

          bodyEl.appendChild(
            el(
              `<span class="section-label ${sec}">${sectionLabelHtml(
                sec
              )}</span>`
            )
          );


          lastSection =
            sec;

        } else if (
          !sec
        ) {

          lastSection =
            null;

        }


        bodyEl.appendChild(
          renderItemRow(
            bim,
            w,
            it,
            idx
          )
        );

      }
    );

  }


  return card;

}


// ============================================================
// CANCIÓN
// ============================================================

function getSongDisplayLabel(
  it
) {

  let text =
    String(
      it &&
      it.label ||
      ''
    ).trim();


  text =
    text
      .replace(
        /^[•·▪◦\-\s]+/,
        ''
      )
      .trim();


  const match =
    text.match(
      /canc[ií]ó[nn]\s*(?:n[º°.]?\s*)?(\d+)/i
    );


  if (
    match
  ) {

    return (
      'Canción ' +
      match[1]
    );

  }


  const possibleNumber =
    it &&
    (
      it.cancionNumero ??
      it.numeroCancion ??
      it.songNumber ??
      it.cancion ??
      it.song ??
      it.numCancion ??
      ''
    );


  const numberMatch =
    String(
      possibleNumber ||
      ''
    ).match(
      /\d+/
    );


  if (
    numberMatch
  ) {

    return (
      'Canción ' +
      numberMatch[0]
    );

  }


  const onlyNumber =
    text.match(
      /^\d+$/
    );


  if (
    onlyNumber
  ) {

    return (
      'Canción ' +
      onlyNumber[0]
    );

  }


  return /canc[ií]ó[nn]/i.test(
    text
  )
    ? text
    : 'Canción';

}


function saveSongLabel(
  it,
  value
) {

  let text =
    String(
      value ||
      ''
    ).trim();


  text =
    text
      .replace(
        /^[•·▪◦\-\s]+/,
        ''
      )
      .trim();


  const match =
    text.match(
      /canc[ií]ó[nn]\s*(?:n[º°.]?\s*)?(\d+)/i
    );


  const numberMatch =
    match ||
    text.match(
      /^(\d+)$/
    );


  if (
    numberMatch
  ) {

    it.label =
      '• Canción ' +
      numberMatch[1];

  } else {

    it.label =
      text
        ? '• ' + text
        : '• Canción';

  }

}


// ============================================================
// FILA DE ASIGNACIÓN
// ============================================================

function renderItemRow(
  bim,
  w,
  it,
  idx
) {

  if (
    isPureSongLine(it)
  ) {

    const songLabel =
      getSongDisplayLabel(
        it
      );


    const row =
      el(`
        <div class="item-row">

          <div
            class="item-label song-label"
          ></div>

        </div>
      `);


    const labelDiv =
      row.querySelector(
        '.item-label'
      );


    labelDiv.innerHTML =
      songIconSvg();

    labelDiv.appendChild(
      document.createTextNode(
        ' ' + songLabel
      )
    );


    if (
      isAdmin
    ) {

      labelDiv.appendChild(
        editPencil(
          'Editar cántico',
          songLabel,
          v => {

            saveSongLabel(
              it,
              v
            );


            saveProgram();


            render();

          }
        )
      );

    }


    return row;

  }


  const cat =
    computeCat(
      it
    );


  if (
    it.hasOwnProperty(
      'conductor'
    )
  ) {

    const wrap =
      el(
        `<div></div>`
      );


    wrap.appendChild(
      renderAssignLine(
        bim,
        w,
        it,
        idx,
        'conductor',
        it.label,
        cat,
        it.conductor
      )
    );


    wrap.appendChild(
      renderAssignLine(
        bim,
        w,
        it,
        idx,
        'lector',
        it.label,
        'estudio_biblico_lector',
        it.lector,
        'Lector'
      )
    );


    return wrap;

  }


  if (
    it.subs
  ) {

    const wrap =
      el(
        `<div></div>`
      );


    it.subs.forEach(
      (
        s,
        si
      ) => {

        wrap.appendChild(
          renderAssignLine(
            bim,
            w,
            it,
            idx,
            'sub' +
              si,
            it.label,
            cat,
            s.name,
            s.role
          )
        );

      }
    );


    return wrap;

  }


  return renderAssignLine(
    bim,
    w,
    it,
    idx,
    'name',
    it.label,
    cat,
    it.name
  );

}


// ============================================================
// LÍNEA DE ASIGNACIÓN
// ============================================================

function renderAssignLine(
  bim,
  w,
  it,
  idx,
  slot,
  label,
  cat,
  currentName,
  roleTag
) {

  const nameHtml =
    currentName
      ? esc(
          currentName
        )
      : 'Sin asignar';


  // Las canciones de apertura y cierre conservan su asignación
  // normal, pero se muestran con el icono de canción y el texto
  // unificado: "Canción N y oración".
  const isSongPrayerLine =
    (
      it.section === 'OPEN' ||
      it.section === 'CLOSE'
    ) &&
    /canc[ií]ó[nn]/i.test(
      label || ''
    );


  const displayLabelHtml =
    isSongPrayerLine
      ? `${songIconSvg()}<span class="song-text">${esc(
          getSongDisplayLabel(it) +
          ' y oración'
        )}</span>`
      : esc(
          label
        );


  const row =
    el(`
      <div class="item-row">

        <div
          class="item-label label-with-pencil ${
            isSongPrayerLine
              ? 'song-label'
              : ''
          }"
        >

          <span>
            ${displayLabelHtml}

            ${
              roleTag
                ? `
                  <span class="role-tag">
                    — ${esc(
                      roleTag
                    )}
                  </span>
                `
                : ''
            }

          </span>

        </div>

        ${
          isAdmin
            ? `
              <button
                class="assign-btn ${
                  currentName
                    ? ''
                    : 'empty'
                }"
              >
                ${nameHtml}
              </button>
            `
            : `
              <span
                class="assign-static ${
                  currentName
                    ? ''
                    : 'empty'
                }"
              >
                ${nameHtml}
              </span>
            `
        }

      </div>
    `);


  const showPencil =
    isAdmin &&
    cat !==
      'intro_conclusion' &&
    slot !==
      'lector' &&
    slot !==
      'sub1';


  if (
    showPencil
  ) {

    row
      .querySelector(
        '.label-with-pencil'
      )
      .appendChild(
        editPencil(
          'Editar texto de la parte',
          it.label,
          v => {

            it.label =
              v;

            saveProgram();

            render();

          }
        )
      );

  }


  if (
    isAdmin
  ) {

    row
      .querySelector(
        '.assign-btn'
      )
      .addEventListener(
        'click',
        () => {

          openAssignModal(
            cat,
            currentName,
            newName => {

              applyAssignment(
                bim,
                w,
                it,
                slot,
                newName
              );

            }
          );

        }
      );

  }


  return row;

}


// ============================================================
// APLICAR ASIGNACIÓN
// ============================================================

function applyAssignment(
  bim,
  w,
  it,
  slot,
  newName
) {

  if (
    slot ===
    'name'
  ) {

    it.name =
      newName;

  } else if (
    slot ===
    'conductor'
  ) {

    it.conductor =
      newName;

  } else if (
    slot ===
    'lector'
  ) {

    it.lector =
      newName;

  } else if (
    slot.startsWith(
      'sub'
    )
  ) {

    const si =
      parseInt(
        slot.slice(3),
        10
      );


    it.subs[si].name =
      newName;

  }


  saveProgram();

  render();

}


// ============================================================
// MODAL DE ASIGNACIÓN
// ============================================================

function openAssignModal(
  cat,
  currentName,
  onPick
) {

  const options =
    eligibleFor(
      cat
    );


  const overlay =
    el(`
      <div class="overlay">

        <div class="modal">

          <div class="modal-head">

            <h3>
              Elegir publicador
            </h3>

            <p>
              ${esc(
                CAT_LABELS[
                  cat
                ] || ''
              )}
              ·
              ${
                options.length
              }
              elegible${
                options.length ===
                1
                  ? ''
                  : 's'
              }
            </p>

          </div>

          <div class="modal-search">

            <input
              class="search-input"
              placeholder="Buscar nombre…"
            />

          </div>

          <div class="modal-list"></div>

          <div class="modal-foot">

            <button
              class="btn btn-ghost btn-sm"
              data-action="clear"
            >
              Quitar asignación
            </button>

            <button
              class="btn btn-ghost btn-sm"
              data-action="close"
            >
              Cerrar
            </button>

          </div>

        </div>

      </div>
    `);


  document.body.appendChild(
    overlay
  );


  function paintList(
    filter
  ) {

    const list =
      overlay.querySelector(
        '.modal-list'
      );


    list.innerHTML =
      '';


    const f =
      (
        filter ||
        ''
      ).toLowerCase();


    const filtered =
      options.filter(
        p =>
          p.nombre
            .toLowerCase()
            .includes(
              f
            )
      );


    if (
      !filtered.length
    ) {

      list.appendChild(
        el(
          `<div class="empty-note">No hay publicadores que coincidan.</div>`
        )
      );


      return;

    }


    filtered.forEach(
      p => {

        const opt =
          el(`
            <div
              class="modal-opt ${
                p.nombre ===
                currentName
                  ? 'selected'
                  : ''
              }"
            >

              <span>
                ${esc(
                  p.nombre
                )}
              </span>

            </div>
          `);


        opt.addEventListener(
          'click',
          () => {

            onPick(
              p.nombre
            );


            overlay.remove();

          }
        );


        list.appendChild(
          opt
        );

      }
    );

  }


  paintList(
    ''
  );


  overlay
    .querySelector(
      '.search-input'
    )
    .addEventListener(
      'input',
      e =>
        paintList(
          e.target.value
        )
    );


  overlay
    .querySelector(
      '[data-action="close"]'
    )
    .addEventListener(
      'click',
      () =>
        overlay.remove()
    );


  overlay
    .querySelector(
      '[data-action="clear"]'
    )
    .addEventListener(
      'click',
      () => {

        onPick(
          ''
        );


        overlay.remove();

      }
    );


  overlay.addEventListener(
    'click',
    e => {

      if (
        e.target ===
        overlay
      ) {

        overlay.remove();

      }

    }
  );

}


// ============================================================
// PESTAÑA PUBLICADORES
// ============================================================

function renderPublicadoresTab() {

  const wrap =
    el(
      `<div></div>`
    );


  const toolbar =
    el(`
      <div class="toolbar">

        <input
          class="search-input"
          id="people-search"
          placeholder="Buscar publicador…"
          style="max-width:260px"
          value="${esc(
            peopleSearch
          )}"
        />

        <div
          style="
            display:flex;
            gap:8px;
          "
        >

          ${
            isAdmin
              ? `
                <button
                  class="btn btn-ghost btn-sm"
                  id="resync-varones"
                >
                  ↻ Re-sincronizar Varones
                </button>
              `
              : ''
          }

          ${
            isAdmin
              ? `
                <button
                  class="btn btn-ghost btn-sm"
                  id="change-pin"
                >
                  Cambiar PIN
                </button>
              `
              : ''
          }

          ${
            isAdmin
              ? `
                <button
                  class="btn btn-primary btn-sm"
                  id="add-person"
                >
                  + Agregar publicador
                </button>
              `
              : ''
          }

        </div>

      </div>
    `);


  const list =
    el(
      `<div id="people-list"></div>`
    );


  toolbar
    .querySelector(
      '#people-search'
    )
    .addEventListener(
      'input',
      e => {

        peopleSearch =
          e.target.value;

        renderPeopleList(
          list
        );

      }
    );


  if (
    isAdmin
  ) {

    toolbar
      .querySelector(
        '#add-person'
      )
      .addEventListener(
        'click',
        () =>
          addNewPerson()
      );


    toolbar
      .querySelector(
        '#change-pin'
      )
      .addEventListener(
        'click',
        () =>
          openChangePinModal()
      );


    toolbar
      .querySelector(
        '#resync-varones'
      )
      .addEventListener(
        'click',
        () => {

          openConfirmModal(
            'Esto vuelve a aplicar las reglas de Oraciones, Asignación #1, Perlas, NVC, Estudio bíblico e Introducción/Conclusión desde el archivo de Varones, sobre todos los publicadores que coincidan por nombre.',

            async () => {

              await window.storage
                .set(
                  'wm-meta',
                  JSON.stringify({
                    varonesMigratedV2:
                      false
                  }),
                  true
                )
                .catch(
                  () => {}
                );


              await migrateVarones();


              render();

            },

            {
              title:
                'Re-sincronizar Varones',

              okLabel:
                'Sincronizar'
            }
          );

        }
      );

  }


  wrap.appendChild(
    toolbar
  );


  if (
    !isAdmin
  ) {

    wrap.appendChild(
      el(
        `<div class="view-only-note">👁️ Estás viendo la base de datos en modo solo lectura. Toca «🔒 Admin» arriba para editar disponibilidad, agregar o quitar publicadores.</div>`
      )
    );

  } else {

    wrap.appendChild(
      el(
        `<p class="hint">Toca un nombre para editar su disponibilidad o qué partes puede dar. Los cambios se guardan automáticamente y los ve todo el que use esta app.</p>`
      )
    );

  }


  wrap.appendChild(
    list
  );


  renderPeopleList(
    list
  );


  return wrap;

}


// ============================================================
// LISTA DE PUBLICADORES
// ============================================================

function renderPeopleList(
  container
) {

  container.innerHTML =
    '';


  const f =
    peopleSearch.toLowerCase();


  const filtered =
    PEOPLE
      .filter(
        p =>
          p.nombre
            .toLowerCase()
            .includes(
              f
            )
      )
      .sort(
        (
          a,
          b
        ) =>
          a.nombre.localeCompare(
            b.nombre,
            'es'
          )
      );


  if (
    !filtered.length
  ) {

    container.appendChild(
      el(
        `<div class="empty-note">No se encontraron publicadores.</div>`
      )
    );


    return;

  }


  filtered.forEach(
    p =>
      container.appendChild(
        renderPersonCard(
          p
        )
      )
  );

}


// ============================================================
// BADGE
// ============================================================

function badgeHtml(
  active,
  text
) {

  return `
    <span
      class="badge ${
        active
          ? 'on'
          : 'off'
      }"
    >
      ${esc(
        text
      )}
    </span>
  `;

}


// ============================================================
// TARJETA DE PUBLICADOR
// ============================================================

function renderPersonCard(
  p
) {

  const isOpen =
    openPersonId ===
    p.id;


  const card =
    el(`
      <div class="person-card">

        <div class="person-top">

          <div>

            <div class="person-name">
              ${esc(
                p.nombre
              )}
            </div>

            <div class="badge-row">

              ${badgeHtml(
                p.elig_oraciones,
                'Oraciones'
              )}

              ${badgeHtml(
                p.elig_parte1,
                'Asig. #1'
              )}

              ${badgeHtml(
                p.elig_perlas,
                'Perlas'
              )}

              ${badgeHtml(
                p.elig_nvc,
                'NVC'
              )}

              ${badgeHtml(
                p.elig_estudio_biblico,
                'Estudio bíblico'
              )}

              ${badgeHtml(
                p.elig_intro_conclusion,
                'Intro/Concl'
              )}

              ${badgeHtml(
                p.elig_maestros_lectura,
                'Maestros/Lectura'
              )}

            </div>

          </div>

          <svg
            class="chevron"
            style="color:#8f6423"
            viewBox="0 0 24 24"
            fill="none"
          >

            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />

          </svg>

        </div>

        <div
          class="edit-holder"
        ></div>

      </div>
    `);


  if (
    isOpen
  ) {

    card
      .querySelector(
        '.chevron'
      )
      .style.transform =
      'rotate(180deg)';

  }


  card
    .querySelector(
      '.person-top'
    )
    .addEventListener(
      'click',
      () => {

        openPersonId =
          isOpen
            ? null
            : p.id;


        render();

      }
    );


  if (
    isOpen
  ) {

    card
      .querySelector(
        '.edit-holder'
      )
      .appendChild(
        isAdmin
          ? renderPersonEditForm(
              p
            )
          : renderPersonReadOnly(
              p
            )
      );

  }


  return card;

}


// ============================================================
// PUBLICADOR SOLO LECTURA
// ============================================================

function renderPersonReadOnly(
  p
) {

  const bimestres =
    PROGRAM.map(
      b =>
        b.bimestre
    );


  return el(
    `
      <div class="edit-grid">

        <div class="field">

          <label>
            Disponibilidad por bimestre
          </label>

          <div class="avail-grid">

            ${bimestres
              .map(
                b =>
                  `
                    <div
                      class="avail-item"
                    >

                      <label>
                        ${esc(
                          b
                        )}
                      </label>

                      <span>
                        ${esc(
                          p.disponibilidad[
                            b
                          ] ||
                          '—'
                        )}
                      </span>

                    </div>
                  `
              )
              .join('')}

          </div>

        </div>

        ${
          p.nota
            ? `
              <div class="field">

                <label>
                  Nota
                </label>

                <span>
                  ${esc(
                    p.nota
                  )}
                </span>

              </div>
            `
            : ''
        }

      </div>
    `
  );

}


// ============================================================
// FORMULARIO DE EDICIÓN DE PUBLICADOR
// ============================================================

function renderPersonEditForm(
  p
) {

  const bimestres =
    PROGRAM.map(
      b =>
        b.bimestre
    );


  const form =
    el(`
      <div class="edit-grid">

        <div class="field">

          <label>
            Nombre
          </label>

          <input
            type="text"
            value="${esc(
              p.nombre
            )}"
            data-field="nombre"
          />

        </div>

        <div class="field">

          <label>
            Puede dar estas partes
          </label>

          <div class="check-row">

            <label class="check-item">

              <input
                type="checkbox"
                data-field="elig_oraciones"
                ${
                  p.elig_oraciones
                    ? 'checked'
                    : ''
                }
              />

              Oraciones

            </label>


            <label class="check-item">

              <input
                type="checkbox"
                data-field="elig_parte1"
                ${
                  p.elig_parte1
                    ? 'checked'
                    : ''
                }
              />

              Asignación #1 (Tesoros)

            </label>


            <label class="check-item">

              <input
                type="checkbox"
                data-field="elig_perlas"
                ${
                  p.elig_perlas
                    ? 'checked'
                    : ''
                }
              />

              Perlas escondidas

            </label>


            <label class="check-item">

              <input
                type="checkbox"
                data-field="elig_nvc"
                ${
                  p.elig_nvc
                    ? 'checked'
                    : ''
                }
              />

              Nuestra Vida Cristiana

            </label>


            <label class="check-item">

              <input
                type="checkbox"
                data-field="elig_estudio_biblico"
                ${
                  p.elig_estudio_biblico
                    ? 'checked'
                    : ''
                }
              />

              Estudio bíblico (conductor)

            </label>


            <label class="check-item">

              <input
                type="checkbox"
                data-field="elig_intro_conclusion"
                ${
                  p.elig_intro_conclusion
                    ? 'checked'
                    : ''
                }
              />

              Introducción / Conclusión

            </label>


            <label class="check-item">

              <input
                type="checkbox"
                data-field="elig_maestros_lectura"
                ${
                  p.elig_maestros_lectura
                    ? 'checked'
                    : ''
                }
              />

              Mejores Maestros / Lectura Biblia

            </label>

          </div>

        </div>

        <div class="field">

          <label>
            Disponibilidad por bimestre
          </label>

          <div class="avail-grid">

            ${bimestres
              .map(
                b =>
                  `
                    <div
                      class="avail-item"
                    >

                      <label>
                        ${esc(
                          b
                        )}
                      </label>

                      <select
                        data-avail="${esc(
                          b
                        )}"
                      >

                        <option
                          value=""
                          ${
                            !p.disponibilidad[
                              b
                            ]
                              ? 'selected'
                              : ''
                          }
                        >
                          —
                        </option>

                        <option
                          value="Disponible"
                          ${
                            p.disponibilidad[
                              b
                            ] ===
                            'Disponible'
                              ? 'selected'
                              : ''
                          }
                        >
                          Disponible
                        </option>

                        <option
                          value="Usado"
                          ${
                            p.disponibilidad[
                              b
                            ] ===
                            'Usado'
                              ? 'selected'
                              : ''
                          }
                        >
                          Usado
                        </option>

                      </select>

                    </div>
                  `
              )
              .join('')}

          </div>

        </div>

        <div class="field">

          <label>
            Nota
          </label>

          <input
            type="text"
            value="${esc(
              p.nota ||
              ''
            )}"
            data-field="nota"
            placeholder="Ej: por ahora no, problema de salud…"
          />

        </div>

        <div
          style="
            display:flex;
            justify-content:flex-end;
            gap:8px;
            margin-top:4px;
          "
        >

          <button
            class="btn btn-danger btn-sm"
            id="del-person"
          >
            Eliminar publicador
          </button>

        </div>

      </div>
    `);


  form
    .querySelector(
      '[data-field="nombre"]'
    )
    .addEventListener(
      'change',
      e => {

        p.nombre =
          e.target.value.trim() ||
          p.nombre;


        savePeople();

        render();

      }
    );


  form
    .querySelector(
      '[data-field="nota"]'
    )
    .addEventListener(
      'change',
      e => {

        p.nota =
          e.target.value;


        savePeople();

      }
    );


  [
    'elig_oraciones',
    'elig_parte1',
    'elig_perlas',
    'elig_nvc',
    'elig_estudio_biblico',
    'elig_intro_conclusion',
    'elig_maestros_lectura'
  ].forEach(
    f => {

      form
        .querySelector(
          `[data-field="${f}"]`
        )
        .addEventListener(
          'change',
          e => {

            p[f] =
              e.target.checked;


            savePeople();

            render();

          }
        );

    }
  );


  form
    .querySelectorAll(
      '[data-avail]'
    )
    .forEach(
      sel => {

        sel.addEventListener(
          'change',
          e => {

            p.disponibilidad[
              sel.dataset.avail
            ] =
              e.target.value;


            savePeople();

          }
        );

      }
    );


  form
    .querySelector(
      '#del-person'
    )
    .addEventListener(
      'click',
      () => {

        openConfirmModal(
          `¿Eliminar a ${p.nombre} de la base de datos? Esta acción no se puede deshacer.`,

          () => {

            PEOPLE =
              PEOPLE.filter(
                x =>
                  x.id !==
                  p.id
              );


            openPersonId =
              null;


            savePeople();

            render();

          },

          {
            title:
              'Eliminar publicador',

            okLabel:
              'Eliminar',

            danger:
              true
          }
        );

      }
    );


  return form;

}


// ============================================================
// AGREGAR NUEVO PUBLICADOR
// ============================================================

function addNewPerson() {

  openTextPromptModal(
    'Nuevo publicador',
    'Nombre completo',
    nombre => {

      const bimestres =
        PROGRAM.map(
          b =>
            b.bimestre
        );


      const disp =
        {};


      bimestres.forEach(
        b => {

          disp[b] =
            'Disponible';

        }
      );


      const newP = {

        id:
          'p_' +
          Date.now(),

        nombre:
          nombre.trim(),

        nota:
          '',

        disponibilidad:
          disp,

        elig_perlas:
          false,

        elig_intro_conclusion:
          false,

        elig_parte1:
          false,

        elig_nvc:
          false,

        elig_estudio_biblico:
          false,

        elig_oraciones:
          false,

        elig_maestros_lectura:
          false

      };


      PEOPLE.push(
        newP
      );


      openPersonId =
        newP.id;


      savePeople();


      render();

    }
  );

}
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
// ALMACENAMIENTO LOCAL COMPATIBLE CON LIVE SERVER
// ============================================================
// El entorno original puede ofrecer window.storage. Live Server no.
// Este respaldo usa localStorage para que la app pueda cargar y guardar
// sin producir TypeError cuando se prueba localmente.

async function appStorageGet(key) {
  try {
    if (window.storage && typeof window.storage.get === 'function') {
      const result = await window.storage.get(key, true);
      if (result) return result;
    }
  } catch (_) {}

  try {
    if (window.localStorage) {
      const value = window.localStorage.getItem(key);
      return value === null ? null : { value };
    }
  } catch (_) {}

  return null;
}

async function appStorageSet(key, value) {
  try {
    if (window.storage && typeof window.storage.set === 'function') {
      await window.storage.set(key, value, true);
      return true;
    }
  } catch (_) {}

  try {
    if (window.localStorage) {
      window.localStorage.setItem(key, value);
      return true;
    }
  } catch (_) {}

  return false;
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
  if (!it) return false;

  const label =
    String(it.label || '')
      .trim()
      .replace(/^[•·▪◦\-\s]+/, '')
      .trim();

  // Canción independiente: puede venir en MID o NVC.
  // Una canción acompañada de "y oración" sigue siendo una asignación normal.
  const looksLikeStandaloneSong =
    /^canc[ií]ó[nn]\s*(?:n[º°.]?\s*)?\d+$/i.test(label) ||
    /^\d+$/.test(label);

  if (looksLikeStandaloneSong) {
    const hasAssignment =
      !!String(it.name || '').trim() ||
      !!String(it.conductor || '').trim() ||
      !!String(it.lector || '').trim() ||
      (Array.isArray(it.subs) &&
        it.subs.some(
          s => String(s?.name || '').trim()
        ));

    return !hasAssignment;
  }

  // Compatibilidad con líneas antiguas MID que no traían el número
  // dentro del texto, pero sí representaban una canción independiente.
  return (
    it.section === 'MID' &&
    !/oraci[oó]n/i.test(label) &&
    !String(it.name || '').trim() &&
    !Array.isArray(it.subs)
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
      await appStorageGet('wm-program');


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
      await appStorageGet('wm-people');


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

    const basePeople =
      Array.isArray(localPeople)
        ? localPeople.map(p => ({ ...p }))
        : [];

    const indexById = new Map();
    const indexByName = new Map();

    basePeople.forEach((p, index) => {
      if (p?.id) indexById.set(String(p.id), index);
      if (p?.nombre) indexByName.set(normName(p.nombre), index);
    });

    (Array.isArray(remote.people) ? remote.people : []).forEach(remotePerson => {
      const idKey = remotePerson?.id ? String(remotePerson.id) : '';
      const nameKey = normName(remotePerson?.nombre || '');
      let index = idKey && indexById.has(idKey)
        ? indexById.get(idKey)
        : indexByName.get(nameKey);

      if (index === undefined) {
        index = basePeople.length;
        basePeople.push({ ...remotePerson });
        if (idKey) indexById.set(idKey, index);
        if (nameKey) indexByName.set(nameKey, index);
      } else {
        basePeople[index] = { ...basePeople[index], ...remotePerson };
      }
    });

    PEOPLE = basePeople;

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
      await appStorageGet('wm-meta');


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

    await appStorageSet(
      'wm-meta',
      JSON.stringify({ varonesMigratedV2: true })
    );

  } catch (e) {}

}


// ============================================================
// GUARDAR PROGRAMA
// ============================================================

async function saveProgram() {

  try {

    await appStorageSet(
      'wm-program',
      JSON.stringify(PROGRAM)
    );

  } catch (e) {

    console.error(
      e
    );

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

    await appStorageSet(
      'wm-people',
      JSON.stringify(PEOPLE)
    );

  } catch (e) {

    console.error(
      e
    );

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
      await appStorageGet('wm-admin-pin');


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

    await appStorageSet(
      'wm-admin-pin',
      JSON.stringify(pin)
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
    cat === 'maestros_lectura' ||
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
// SEAMOS MEJORES MAESTROS — BIMESTRE ANTERIOR
// ============================================================

function getPreviousBimestreLabel(bimestre) {
  const labels = (PROGRAM || []).map(b => b && b.bimestre).filter(Boolean);
  const index = labels.indexOf(bimestre);
  return index > 0 ? labels[index - 1] : null;
}

function collectAssignedNamesFromItem(it, out) {
  if (!it || !out) return;
  [it.name, it.conductor, it.lector].forEach(name => {
    if (name) out.add(normName(name));
  });
  if (Array.isArray(it.subs)) {
    it.subs.forEach(sub => {
      if (sub && sub.name) out.add(normName(sub.name));
    });
  }
}

function getUsedNamesInBimestre(bimestre) {
  const used = new Set();
  const bim = (PROGRAM || []).find(b => b && b.bimestre === bimestre);
  if (!bim) return used;
  (bim.weeks || []).forEach(w => {
    (w.items || []).forEach(it => collectAssignedNamesFromItem(it, used));
  });
  return used;
}

function wasUsedInPreviousBimestre(nombre) {
  if (!currentBimestre || !nombre) return false;
  const previous = getPreviousBimestreLabel(currentBimestre);
  if (!previous) return false;
  return getUsedNamesInBimestre(previous).has(normName(nombre));
}

// ============================================================
// SEAMOS MEJORES MAESTROS — GESTIÓN DE ASIGNACIONES
// ============================================================

function openAddMaestrosAssignmentModal(bim, w) {
  const overlay = openOverlay(`
    <div class="modal-head">
      <h3>Agregar asignación</h3>
      <p>Seamos Mejores Maestros · ${esc(w.semana || '')}</p>
    </div>
    <div class="field">
      <label>Texto de la asignación</label>
      <input class="search-input" id="new-maestros-label" placeholder="Ej.: Empiece conversaciones (3 mins.) (lmd lección 4 punto 3)." />
    </div>
    <div class="field" style="margin-top:12px;">
      <label>Personas que necesita</label>
      <select class="search-input" id="new-maestros-structure">
        <option value="name">Solo Nombre</option>
        <option value="pair">Nombre + Ayudante</option>
      </select>
    </div>
    <div class="modal-foot" style="margin-top:16px;">
      <button class="btn btn-ghost btn-sm" data-action="close">Cancelar</button>
      <button class="btn btn-primary btn-sm" data-action="save">Agregar</button>
    </div>
  `);
  const input = overlay.querySelector('#new-maestros-label');
  input.focus();
  overlay.querySelector('[data-action="close"]').addEventListener('click', () => overlay.remove());
  overlay.querySelector('[data-action="save"]').addEventListener('click', async () => {
    const label = String(input.value || '').trim();
    if (!label) { input.focus(); return; }
    const structure = overlay.querySelector('#new-maestros-structure').value;
    const item = { section: 'MAESTROS', label };
    if (structure === 'pair') {
      item.subs = [
        { role: 'Nombre', name: '' },
        { role: 'Ayudante', name: '' }
      ];
    } else {
      item.name = '';
    }
    if (!Array.isArray(w.items)) w.items = [];

    // Insertar dentro del primer bloque de Seamos Mejores Maestros,
    // justo antes de la siguiente sección (normalmente NVC).
    let insertAt = w.items.findIndex(x => x?.section === 'MAESTROS');

    if (insertAt === -1) {
      insertAt = w.items.findIndex(x => x?.section === 'NVC');
      if (insertAt === -1) insertAt = w.items.length;
    } else {
      let cursor = insertAt;
      while (cursor + 1 < w.items.length && w.items[cursor + 1]?.section === 'MAESTROS') {
        cursor++;
      }
      insertAt = cursor + 1;
    }

    const maestrosNums = w.items
      .filter(x => x?.section === 'MAESTROS' && Number.isFinite(Number(x?.num)))
      .map(x => Number(x.num));

    if (maestrosNums.length) {
      item.num = Math.max(...maestrosNums) + 1;
    }

    w.items.splice(insertAt, 0, item);
    await saveProgram();
    overlay.remove();
    openWeeks.add(w.id);
    render();
  });
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

function changeMaestrosAssignmentStructure(bim, w, it) {
  const isPair = Array.isArray(it.subs);
  const overlay = openOverlay(`
    <div class="modal-head">
      <h3>Editar tipo de asignación</h3>
      <p>${esc(it.label || '')}</p>
    </div>
    <div class="field">
      <label>Personas que necesita</label>
      <select class="search-input" id="edit-maestros-structure">
        <option value="name" ${!isPair ? 'selected' : ''}>Solo Nombre</option>
        <option value="pair" ${isPair ? 'selected' : ''}>Nombre + Ayudante</option>
      </select>
    </div>
    <div class="modal-foot" style="margin-top:16px;">
      <button class="btn btn-ghost btn-sm" data-action="close">Cancelar</button>
      <button class="btn btn-primary btn-sm" data-action="save">Guardar</button>
    </div>
  `);
  overlay.querySelector('[data-action="close"]').addEventListener('click', () => overlay.remove());
  overlay.querySelector('[data-action="save"]').addEventListener('click', () => {
    const structure = overlay.querySelector('#edit-maestros-structure').value;
    if (structure === 'pair') {
      const oldSubs = Array.isArray(it.subs) ? it.subs : [];
      const nombre = oldSubs.find(s => normName(s.role) === 'nombre')?.name || it.name || '';
      const ayudante = oldSubs.find(s => normName(s.role) === 'ayudante')?.name || '';
      delete it.name;
      it.subs = [
        { role: 'Nombre', name: nombre },
        { role: 'Ayudante', name: ayudante }
      ];
    } else {
      const oldSubs = Array.isArray(it.subs) ? it.subs : [];
      const nombre = oldSubs.find(s => normName(s.role) === 'nombre')?.name || '';
      delete it.subs;
      it.name = nombre;
    }
    saveProgram();
    overlay.remove();
    render();
  });
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

function deleteMaestrosAssignment(bim, w, idx) {
  const item = w.items?.[idx];
  if (!item) return;
  openConfirmModal(
    `¿Eliminar esta asignación?\n\n${item.label || ''}`,
    () => {
      if (Array.isArray(w.items) && idx >= 0 && idx < w.items.length) {
        w.items.splice(idx, 1);
        saveProgram();
        render();
      }
    },
    { title: 'Eliminar asignación', okLabel: 'Eliminar' }
  );
}

function appendMaestrosAdminControls(node, bim, w, it, idx) {
  if (!isAdmin || !it || it.section !== 'MAESTROS') return;
  const target =
    node?.matches?.('.item-row')
      ? node
      : node?.querySelector?.('.item-row');
  if (!target) return;
  const controls = el(`
    <span style="display:inline-flex;gap:4px;margin-left:8px;align-items:center;">
      <button type="button" class="edit-pencil" title="Cambiar entre solo Nombre y Nombre + Ayudante">⚙</button>
      <button type="button" class="edit-pencil" title="Eliminar asignación" style="color:#b42318;">×</button>
    </span>
  `);
  const buttons = controls.querySelectorAll('button');
  buttons[0].addEventListener('click', e => { e.stopPropagation(); changeMaestrosAssignmentStructure(bim, w, it); });
  buttons[1].addEventListener('click', e => { e.stopPropagation(); deleteMaestrosAssignment(bim, w, idx); });
  const label = target.querySelector('.item-label');
  if (label) label.appendChild(controls);
}

// Exponer los controles explícitamente en el ámbito global del navegador.
window.appendMaestrosAdminControls = appendMaestrosAdminControls;
window.openAddMaestrosAssignmentModal = openAddMaestrosAssignmentModal;
window.changeMaestrosAssignmentStructure = changeMaestrosAssignmentStructure;
window.deleteMaestrosAssignment = deleteMaestrosAssignment;


// ============================================================
// RESPONSIVE: apila Nombre/Ayudante en pantallas angostas (celular)
// ============================================================
// La fila de Seamos Mejores Maestros usa una grilla de 3 columnas con
// mínimos fijos (300px + 145px + 145px) que no cabe en un celular.
// Se inyecta una sola vez una hoja de estilos que, con !important,
// gana sobre el style inline y apila las columnas en una sola.
(function injectMaestrosResponsiveCSS() {
  if (document.getElementById('wm-responsive-fix')) return;
  const style = document.createElement('style');
  style.id = 'wm-responsive-fix';
  style.textContent = `
    @media (max-width: 680px) {
      .maestros-pair-row {
        display: flex !important;
        flex-direction: column !important;
        align-items: stretch !important;
        gap: 10px !important;
      }
      .maestros-pair-row .maestros-person-column {
        width: 100% !important;
      }
      .maestros-pair-row .maestros-person-column .assign-btn,
      .maestros-pair-row .maestros-person-column .assign-static {
        width: 100% !important;
        max-width: none !important;
        text-align: left !important;
        box-sizing: border-box !important;
      }
    }
  `;
  document.head.appendChild(style);
})();


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
            `<div class="item-row"><div class="item-label song-label">${songIconSvg()}<span style="display:inline !important;visibility:visible !important;opacity:1 !important;color:#363535 !important;font-weight:600 !important;white-space:nowrap !important;">${esc(
              songLabel || 'Canción'
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

  if (!window.jspdf?.jsPDF) {
    alert(
      'No se pudo cargar el generador PDF. Abre la aplicación con conexión a Internet y vuelve a intentarlo.'
    );
    return;
  }

  if (typeof window.html2canvas !== 'function') {
    alert(
      'No se pudo cargar el generador visual del PDF. Recarga la página e inténtalo de nuevo.'
    );
    return;
  }

  const { jsPDF } = window.jspdf;

  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const pageW = 210;
  const pageH = 297;
  const margin = 8;
  const contentW = pageW - margin * 2;
  const contentH = pageH - margin * 2;
  let firstPage = true;

  // El PDF se genera capturando el mismo HTML/CSS visual de la app.
  // Así deja de existir una segunda maquetación PDF distinta de la web.
  for (let i = 0; i < (bim.weeks || []).length; i++) {
    const week = bim.weeks[i];
    const node = buildPdfWeekNode(bim, week);

    node.style.position = 'fixed';
    node.style.left = '-100000px';
    node.style.top = '0';
    node.style.zIndex = '-1';
    node.style.width = '820px';
    node.style.background = '#faf6ee';

    document.body.appendChild(node);

    try {
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      const canvas = await window.html2canvas(node, {
        backgroundColor: '#faf6ee',
        scale: 2,
        useCORS: true,
        logging: false,
        imageTimeout: 15000,
        removeContainer: true
      });

      const pagePxH = Math.max(
        1,
        Math.floor(canvas.width * contentH / contentW)
      );

      let offsetPx = 0;

      while (offsetPx < canvas.height) {
        if (!firstPage) {
          doc.addPage();
        }
        firstPage = false;

        const sliceH = Math.min(
          pagePxH,
          canvas.height - offsetPx
        );

        const slice = document.createElement('canvas');
        slice.width = canvas.width;
        slice.height = sliceH;

        const ctx = slice.getContext('2d');
        ctx.fillStyle = '#faf6ee';
        ctx.fillRect(0, 0, slice.width, slice.height);
        ctx.drawImage(
          canvas,
          0, offsetPx,
          canvas.width, sliceH,
          0, 0,
          slice.width, slice.height
        );

        const sliceHmm =
          slice.height * contentW / slice.width;

        doc.addImage(
          slice.toDataURL('image/jpeg', 0.94),
          'JPEG',
          margin,
          margin,
          contentW,
          sliceHmm,
          undefined,
          'FAST'
        );

        offsetPx += sliceH;
      }
    } finally {
      node.remove();
    }
  }

  const safeName =
    String(bim.bimestre)
      .replace(
        /[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ -]/g,
        ''
      )
      .trim()
      .replace(/\s+/g, '_');

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


  const bodyEl =
    card.querySelector(
      '.week-body'
    );


  if (
    isOpen
  ) {

    let lastSection =
      null;

    let maestrosRendered =
      false;

    let maestrosAddShown =
      false;


    const appendMaestrosAddControl =
      () => {

        if (
          !isAdmin ||
          maestrosAddShown
        ) {

          return;

        }

        const addBox =
          el(`
            <div
              style="
                padding:8px 0 12px;
                margin-top:2px;
              "
            >

              <button
                type="button"
                class="btn btn-ghost btn-sm"
                style="width:100%;"
              >
                + Agregar asignación de Seamos Mejores Maestros
              </button>

            </div>
          `);


        addBox
          .querySelector(
            'button'
          )
          .addEventListener(
            'click',
            e => {

              e.stopPropagation();

              openAddMaestrosAssignmentModal(
                bim,
                w
              );

            }
          );


        bodyEl.appendChild(
          addBox
        );


        maestrosAddShown =
          true;

      };


    (
      w.items ||
      []
    ).forEach(
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


        /*
         * Si estamos saliendo de MAESTROS para entrar
         * a otra sección, ponemos el botón de agregar
         * justo al final de MAESTROS.
         */
        if (
          maestrosRendered &&
          sec !== 'MAESTROS'
        ) {

          appendMaestrosAddControl();

        }


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


        if (
          sec ===
          'MAESTROS'
        ) {

          maestrosRendered =
            true;

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


    /*
     * Si MAESTROS es la última sección de la semana,
     * agregamos el botón al final.
     */
    if (
      maestrosRendered
    ) {

      appendMaestrosAddControl();

    }

  }


  return card;

}

// ============================================================
// CANCIÓN
// ============================================================

function getSongDisplayLabel(
  it
) {

  if (!it) {
    return 'Canción';
  }

  /*
   * La canción intermedia puede venir con distintas estructuras
   * según el bimestre. Primero revisamos todos los campos que
   * normalmente contienen el texto visible de la canción.
   */
  const candidates = [
    it.label,
    it.title,
    it.text,
    it.description,
    it.nombreCancion,
    it.tituloCancion,
    it.cancionTitulo
  ];

  for (const candidate of candidates) {

    const value =
      String(
        candidate ?? ''
      )
      .trim()
      .replace(/^[•·▪◦\-\s🎵🎶]+/, '')
      .trim();

    if (!value) {
      continue;
    }

    const match =
      value.match(
        /canc[ií]ó[nn]\s*(?:n[º°.]?\s*)?(\d+)/i
      );

    if (match) {
      return 'Canción ' + match[1];
    }

    const onlyNumber =
      value.match(
        /^\d+$/
      );

    if (onlyNumber) {
      return 'Canción ' + onlyNumber[0];
    }

    /*
     * Si ya contiene la palabra canción pero no pudimos extraer
     * el número, mostramos el texto original en vez de ocultarlo.
     */
    if (
      /canc[ií]ó[nn]/i.test(
        value
      )
    ) {
      return value;
    }
  }

  /*
   * Compatibilidad con estructuras donde el número está separado.
   */
  const possibleNumber =
    it.cancionNumero ??
    it.numeroCancion ??
    it.songNumber ??
    it.cancion ??
    it.song ??
    it.numCancion ??
    it.numero ??
    it.num ??
    '';

  if (
    typeof possibleNumber === 'object' &&
    possibleNumber !== null
  ) {

    const objectNumber =
      possibleNumber.numero ??
      possibleNumber.number ??
      possibleNumber.num ??
      possibleNumber.id ??
      '';

    const objectMatch =
      String(
        objectNumber || ''
      ).match(
        /\d+/
      );

    if (objectMatch) {
      return 'Canción ' + objectMatch[0];
    }
  }

  const numberMatch =
    String(
      possibleNumber || ''
    ).match(
      /\d+/
    );

  if (numberMatch) {
    return 'Canción ' + numberMatch[0];
  }

  return 'Canción';

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
            style="
              display:flex;
              align-items:center;
              gap:8px;
            "
          ></div>

        </div>
      `);


    const labelDiv =
      row.querySelector(
        '.item-label'
      );


    /*
     * El texto se fuerza visible con estilo inline para
     * evitar que un CSS anterior oculte .song-text.
     */
    labelDiv.appendChild(
      el(
        `<span style="display:inline-flex;align-items:center;gap:8px;">${songIconSvg()}<span style="display:inline !important;visibility:visible !important;opacity:1 !important;color:#363535 !important;font-weight:600 !important;white-space:nowrap !important;">${esc(
          songLabel || 'Canción'
        )}</span></span>`
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
    Object.prototype.hasOwnProperty.call(
      it,
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


  /*
   * SEAMOS MEJORES MAESTROS CON DOS PERSONAS
   *
   * Se muestra UNA sola fila:
   *
   *  [texto de asignación]   Nombre      Ayudante
   *                           Alba        Nancy
   *
   * Nunca se duplica el texto de la asignación.
   */
  if (
    Array.isArray(
      it.subs
    )
  ) {

    const nombre =
      it.subs.find(
        s =>
          normName(
            s?.role
          ) ===
          'nombre'
      )?.name ||
      it.subs[0]?.name ||
      '';


    const ayudante =
      it.subs.find(
        s =>
          normName(
            s?.role
          ) ===
          'ayudante'
      )?.name ||
      it.subs[1]?.name ||
      '';


    const wrap =
      el(`
        <div
          class="item-row maestros-pair-row"
          style="
            display:grid;
            grid-template-columns:minmax(300px,1fr) minmax(145px,190px) minmax(145px,190px);
            gap:14px;
            align-items:end;
          "
        >

          <div
            class="item-label label-with-pencil"
            style="min-width:0;"
          >

            <span>
              ${esc(
                it.label ||
                ''
              )}
            </span>

          </div>


          <div
            class="maestros-person-column"
            style="
              display:flex;
              flex-direction:column;
              gap:4px;
              min-width:0;
            "
          >

            <span
              style="
                font-size:12px;
                font-weight:700;
                color:#363535;
              "
            >
              Nombre
            </span>

            ${
              isAdmin
                ? `
                  <button
                    type="button"
                    class="assign-btn ${
                      nombre
                        ? ''
                        : 'empty'
                    }"
                    style="font-weight:700;color:#363535;"
                  >
                    ${
                      nombre
                        ? esc(
                            nombre
                          )
                        : 'Sin asignar'
                    }
                  </button>
                `
                : `
                  <span
                    class="assign-static ${
                      nombre
                        ? ''
                        : 'public-empty'
                    }"
                    style="
                      font-weight:700;
                      color:#363535;
                    "
                  >
                    ${
                      nombre
                        ? esc(
                            nombre
                          )
                        : ''
                    }
                  </span>
                `
            }

          </div>


          <div
            class="maestros-person-column"
            style="
              display:flex;
              flex-direction:column;
              gap:4px;
              min-width:0;
            "
          >

            <span
              style="
                font-size:12px;
                font-weight:700;
                color:#363535;
              "
            >
              Ayudante
            </span>

            ${
              isAdmin
                ? `
                  <button
                    type="button"
                    class="assign-btn ${
                      ayudante
                        ? ''
                        : 'empty'
                    }"
                    style="font-weight:700;color:#363535;"
                  >
                    ${
                      ayudante
                        ? esc(
                            ayudante
                          )
                        : 'Sin asignar'
                    }
                  </button>
                `
                : `
                  <span
                    class="assign-static ${
                      ayudante
                        ? ''
                        : 'public-empty'
                    }"
                    style="
                      font-weight:700;
                      color:#363535;
                    "
                  >
                    ${
                      ayudante
                        ? esc(
                            ayudante
                          )
                        : ''
                    }
                  </span>
                `
            }

          </div>

        </div>
      `);


    if (
      isAdmin
    ) {

      wrap
        .querySelector(
          '.label-with-pencil'
        )
        .appendChild(
          editPencil(
            'Editar texto de la parte',
            it.label ||
              '',
            v => {

              it.label =
                v;

              saveProgram();

              render();

            }
          )
        );


      const buttons =
        wrap.querySelectorAll(
          '.assign-btn'
        );


      buttons[0]?.addEventListener(
        'click',
        e => {

          e.stopPropagation();

          openAssignModal(
            'maestros_lectura',
            nombre,
            newName => {

              applyAssignment(
                bim,
                w,
                it,
                'sub0',
                newName
              );

            }
          );

        }
      );


      buttons[1]?.addEventListener(
        'click',
        e => {

          e.stopPropagation();

          openAssignModal(
            'maestros_lectura',
            ayudante,
            newName => {

              applyAssignment(
                bim,
                w,
                it,
                'sub1',
                newName
              );

            }
          );

        }
      );

    }


    appendMaestrosAdminControls(
      wrap,
      bim,
      w,
      it,
      idx
    );


    return wrap;

  }


  /*
   * ASIGNACIÓN DE UNA SOLA PERSONA.
   */
  const row =
    renderAssignLine(
      bim,
      w,
      it,
      idx,
      'name',
      it.label,
      cat,
      it.name ||
        ''
    );


  appendMaestrosAdminControls(
    row,
    bim,
    w,
    it,
    idx
  );


  return row;

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

  const safeCurrentName =
    String(
      currentName ??
      ''
    ).trim();


  const nameHtml =
    safeCurrentName
      ? esc(
          safeCurrentName
        )
      : (
          isAdmin
            ? 'Sin asignar'
            : ''
        );


  const row =
    el(`
      <div class="item-row">

        <div
          class="item-label label-with-pencil"
        >

          <span style="display:inline-flex;align-items:center;gap:8px;">
            ${/canc[ií]ó[nn]/i.test(String(label || '')) ? songIconSvg() : ''}
            <span style="${/canc[ií]ó[nn]/i.test(String(label || '')) ? 'color:#363535 !important;font-weight:600 !important;' : ''}">${esc(/canc[ií]ó[nn]/i.test(String(label || '')) ? String(label || '').trim().replace(/^[•·▪◦\-\s]+/, '') : label)}</span>

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
                type="button"
                class="assign-btn ${
                  safeCurrentName
                    ? ''
                    : 'empty'
                }"
                style="
                  font-weight:700;
                  color:#363535;
                "
              >
                ${nameHtml}
              </button>
            `
            : `
              <span
                class="assign-static ${
                  safeCurrentName
                    ? ''
                    : 'public-empty'
                }"
                style="
                  font-weight:700;
                  color:#363535;
                "
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
            safeCurrentName,
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
    !it
  ) {

    console.warn(
      'No se pudo aplicar la asignación: elemento inexistente.'
    );

    return;

  }


  const value =
    String(
      newName ??
      ''
    ).trim();


  if (
    slot ===
    'name'
  ) {

    it.name =
      value;

  } else if (
    slot ===
    'conductor'
  ) {

    it.conductor =
      value;

  } else if (
    slot ===
    'lector'
  ) {

    it.lector =
      value;

  } else if (
    slot.startsWith(
      'sub'
    )
  ) {

    const si =
      Number.parseInt(
        slot.slice(3),
        10
      );


    if (
      !Number.isInteger(
        si
      ) ||
      si < 0
    ) {

      return;

    }


    if (
      !Array.isArray(
        it.subs
      )
    ) {

      it.subs =
        [];

    }


    while (
      it.subs.length <=
      si
    ) {

      it.subs.push(
        {
          role:
            it.subs.length === 0
              ? 'Nombre'
              : 'Ayudante',

          name:
            ''
        }
      );

    }


    if (
      !it.subs[si]
    ) {

      it.subs[si] =
        {
          role:
            si === 0
              ? 'Nombre'
              : 'Ayudante',

          name:
            ''
        };

    }


    it.subs[si].name =
      value;

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


    const previousBimestre =
      cat === 'maestros_lectura'
        ? getPreviousBimestreLabel(currentBimestre)
        : null;

    filtered.forEach(
      p => {
        const usedBefore =
          cat === 'maestros_lectura' &&
          wasUsedInPreviousBimestre(p.nombre);

        const previousWarning = usedBefore
          ? `<span style="display:block;color:#c62828;font-size:12px;font-weight:700;margin-top:2px;">No Disponible — usado en ${esc(previousBimestre || 'el bimestre anterior')}</span>`
          : '';

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
                <strong style="font-weight:700;color:#363535;">
                  ${esc(p.nombre)}
                </strong>
                ${previousWarning}
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

              await appStorageSet(
                'wm-meta',
                JSON.stringify({ varonesMigratedV2: false })
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
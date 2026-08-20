// ============================================================
// VIDA Y MINISTERIO — VILLA CONCHA
// app.js
// ============================================================
// Archivo principal de la aplicación.
//
// RESPONSABILIDAD:
// - Mantener el estado global.
// - Mantener la configuración general.
// - Iniciar la aplicación.
//
// Las funciones están en:
// js/functions.js
//
// Los datos están en:
// js/data/
// ============================================================


// ============================================================
// ESTADO GLOBAL
// ============================================================

let PROGRAM = null;

let PEOPLE = null;

let currentTab = 'programa';

let currentBimestre = null;

let openWeeks = new Set();

let peopleSearch = '';

let saving = false;

let isAdmin = false;

let openPersonId = null;

let sheetsConnected = false;


// ============================================================
// CONFIGURACIÓN GENERAL
// ============================================================

// El PIN de administrador NO vive aquí en texto plano. Su huella
// SHA-256 (DEFAULT_PIN_HASH) está en functions.js, y getAdminPin()/
// setAdminPin() en ese mismo archivo son las únicas funciones que
// deben tocar el PIN — nunca se guarda ni compara en texto plano.


// URL predeterminada del Web App de Google Apps Script.
const APPS_SCRIPT_URL_DEFAULT =
    'https://script.google.com/macros/s/AKfycbxe9AFa9qZJBnqJJpbQ7nLjdNFRTrPlACFKZkA6Z-QFAmA3Pbn2YcRM6JafV3H3Njfo-Q/exec';


// URL que realmente utilizará la aplicación.
let APPS_SCRIPT_URL = '';


// ============================================================
// INICIO DE LA APLICACIÓN
// ============================================================

async function boot() {

    // ----------------------------------------------------------
    // 1. Obtener la URL de Google Sheets
    // ----------------------------------------------------------

    try {

        await getSheetsUrl();

    } catch (error) {

        console.warn(
            'No se pudo obtener la URL de Google Sheets.',
            error
        );

        APPS_SCRIPT_URL =
            APPS_SCRIPT_URL_DEFAULT || '';
    }


    // ----------------------------------------------------------
    // 2. Mostrar la interfaz inicialmente
    // ----------------------------------------------------------

    render();


    // ----------------------------------------------------------
    // 3. Cargar los datos
    // ----------------------------------------------------------

    try {

        await Promise.race([

            loadData(),

            new Promise((_, reject) => {

                setTimeout(() => {

                    reject(
                        new Error(
                            'Tiempo de espera de carga'
                        )
                    );

                }, 15000);

            })

        ]);

    } catch (error) {

        console.warn(
            'La carga remota no respondió. ' +
            'Se utilizarán los datos locales.',
            error
        );


        // ------------------------------------------------------
        // Datos locales
        // ------------------------------------------------------

        if (!PROGRAM) {

            if (
                typeof DEFAULT_PROGRAM !==
                'undefined'
            ) {

                PROGRAM =
                    JSON.parse(
                        JSON.stringify(
                            DEFAULT_PROGRAM
                        )
                    );
            }
        }


        if (!PEOPLE) {

            if (
                typeof DEFAULT_PEOPLE !==
                'undefined'
            ) {

                PEOPLE =
                    JSON.parse(
                        JSON.stringify(
                            DEFAULT_PEOPLE
                        )
                    );
            }
        }

    }


    // ----------------------------------------------------------
    // 4. Volver a renderizar
    // ----------------------------------------------------------

    render();


    // ----------------------------------------------------------
    // 5. Actualizar estado de Google Sheets
    // ----------------------------------------------------------

    if (
        APPS_SCRIPT_URL &&
        sheetsConnected
    ) {

        setSheetsStatus(true);

    } else if (
        APPS_SCRIPT_URL
    ) {

        setSheetsStatus(
            false,
            '☁ Sheets listo para conectar'
        );

    } else {

        setSheetsStatus(
            false,
            '☁ Sheets no conectado'
        );

    }

}


// ============================================================
// ARRANCAR APLICACIÓN
// ============================================================

document.addEventListener(
    'DOMContentLoaded',
    boot
);
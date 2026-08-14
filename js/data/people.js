// ============================================================
// PUBLICADORES
// data/people.js
// ============================================================

const DEFAULT_PEOPLE = [

    {
        "id": "p2",
        "nombre": "Endrianly Alexandra Suarez",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Usado",
            "Mayo - Junio": "Disponible",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Usado"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p3",
        "nombre": "Alba Sandoval",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Disponible",
            "Julio - Agosto": "Usado",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p4",
        "nombre": "Andrea Reyes",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Disponible",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p5",
        "nombre": "María Alejandra Toro",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Disponible",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Usado"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p6",
        "nombre": "Diana Larrahondo",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Disponible",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p7",
        "nombre": "Doris Peña",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Disponible",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p8",
        "nombre": "Cristina  Zurita",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Usado",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p9",
        "nombre": "Maria Eugenia Luna",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Usado",
            "Mayo - Junio": "Disponible",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p10",
        "nombre": "Diana Quecho",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Usado",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p11",
        "nombre": "Alejandra Obando",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Usado",
            "Mayo - Junio": "Usado",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p12",
        "nombre": "Amparo Blanco",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Usado",
            "Mayo - Junio": "Disponible",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Usado"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p13",
        "nombre": "Ingrid Beleño",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Disponible",
            "Julio - Agosto": "Usado",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": false,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p14",
        "nombre": "Emilce Ochoa Guerrero",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Disponible",
            "Julio - Agosto": "Usado",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p15",
        "nombre": "Leonor Chacon Vera",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Usado",
            "Mayo - Junio": "Disponible",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Usado"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p16",
        "nombre": "Natividad Rojas",
        "nota": "Ayudante para discursos",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Usado",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": false,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p17",
        "nombre": "Nancy Rojas",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Usado",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p18",
        "nombre": "Janeth Caballero",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Disponible",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p19",
        "nombre": "Laura Tarazona",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Usado",
            "Mayo - Junio": "Disponible",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p20",
        "nombre": "Ivanna Calderón",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Disponible",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p21",
        "nombre": "Graciela Quiñónez",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Disponible",
            "Julio - Agosto": "Usado",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p22",
        "nombre": "Lisset Chacon Moreno",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Disponible",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Usado"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p23",
        "nombre": "Mary Suárez Acosta",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Usado",
            "Mayo - Junio": "Disponible",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p24",
        "nombre": "Johanna  Oviedo",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Usado",
            "Mayo - Junio": "Disponible",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p25",
        "nombre": "Patricia Parra",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Usado",
            "Mayo - Junio": "Disponible",
            "Julio - Agosto": "Usado",
            "Septiembre - Octubre": "Usado"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p26",
        "nombre": "Jaqueline Medina",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Usado",
            "Mayo - Junio": "Disponible",
            "Julio - Agosto": "Usado",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p27",
        "nombre": "Mileydis Rodríguez",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Disponible",
            "Julio - Agosto": "Usado",
            "Septiembre - Octubre": "Usado"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p28",
        "nombre": "Lizeth Rodríguez",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Usado",
            "Julio - Agosto": "Usado",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p29",
        "nombre": "Yolanda Barón",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Usado",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p30",
        "nombre": "Mariana Gomez",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Disponible",
            "Julio - Agosto": "Usado",
            "Septiembre - Octubre": "Usado"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p31",
        "nombre": "Emilse Rodríguez",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Usado",
            "Mayo - Junio": "Disponible",
            "Julio - Agosto": "Usado",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p32",
        "nombre": "Rosa Rojas",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Usado",
            "Mayo - Junio": "Usado",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p33",
        "nombre": "Andrea Velasquez",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Usado",
            "Julio - Agosto": "Usado",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p34",
        "nombre": "Mayreth D' Luyz",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Usado",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Usado"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p35",
        "nombre": "Shirley Cáceres",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Disponible",
            "Julio - Agosto": "Usado",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p36",
        "nombre": "Vanesa Rodriguez",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Disponible",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Usado"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p37",
        "nombre": "Linda Cote",
        "nota": "ayudante con shirle, vane, patricia avila, Jaqueline",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Usado",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": false,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p38",
        "nombre": "Libia Cardenas",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Usado",
            "Julio - Agosto": "Usado",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p39",
        "nombre": "Bernarda Sanchez",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Usado",
            "Mayo - Junio": "Usado",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p40",
        "nombre": "Gabriela Guerrero",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Usado",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Usado"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": false,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p41",
        "nombre": "Ilsy Sanabria Durán",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Usado",
            "Mayo - Junio": "Usado",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p42",
        "nombre": "Perla Lucely Torres",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Disponible",
            "Julio - Agosto": "Usado",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p43",
        "nombre": "Mariela Celis Pinzón",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Disponible",
            "Julio - Agosto": "Usado",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p44",
        "nombre": "Ofelmina Caballero",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Disponible",
            "Julio - Agosto": "Usado",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p45",
        "nombre": "Vanesa Muñoz Reyes",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Usado",
            "Julio - Agosto": "Usado",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": false,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },
    
        {
        "id": "p46",
        "nombre": "Ana Prieto",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Disponible",
            "Julio - Agosto": "Usado",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p47",
        "nombre": "Edilma prieto",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Usado",
            "Mayo - Junio": "Disponible",
            "Julio - Agosto": "Usado",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p48",
        "nombre": "Luz Marina Muñoz",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Usado",
            "Mayo - Junio": "Usado",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p49",
        "nombre": "Nilda Acosta",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Disponible",
            "Julio - Agosto": "Usado",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p50",
        "nombre": "Angela Gaona",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Disponible",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p51",
        "nombre": "Dayana Duarte",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Usado",
            "Julio - Agosto": "Usado",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p52",
        "nombre": "Patricia Avila",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Usado",
            "Julio - Agosto": "Usado",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p53",
        "nombre": "Maria Luisa Mendoza",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Usado",
            "Mayo - Junio": "Disponible",
            "Julio - Agosto": "Usado",
            "Septiembre - Octubre": "Usado"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p54",
        "nombre": "Amparo Laytón",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Usado",
            "Mayo - Junio": "Usado",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p55",
        "nombre": "Beatriz Serrano",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Usado",
            "Julio - Agosto": "Usado",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p56",
        "nombre": "Luisa Serrano",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Usado",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p57",
        "nombre": "Ligia Prada",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Disponible",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Usado"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p58",
        "nombre": "Nhora Rodriguez",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Disponible",
            "Julio - Agosto": "Usado",
            "Septiembre - Octubre": "Usado"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p59",
        "nombre": "Angie Beleño",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Usado",
            "Mayo - Junio": "Usado",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p60",
        "nombre": "Leidy Reyes",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Disponible",
            "Julio - Agosto": "Usado",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

        {
        "id": "p61",
        "nombre": "Nancy Torres",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Usado",
            "Mayo - Junio": "Usado",
            "Julio - Agosto": "Usado",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p62",
        "nombre": "Graciela Reyes",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Usado",
            "Julio - Agosto": "Usado",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p63",
        "nombre": "Flor Reyes",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Usado",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p64",
        "nombre": "Lissette Santacruz",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Usado",
            "Mayo - Junio": "Usado",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p65",
        "nombre": "Sarai Tallaferro",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Disponible",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p66",
        "nombre": "Carlina Tallaferro",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Usado",
            "Mayo - Junio": "Disponible",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p67",
        "nombre": "Ashley Ojeda",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Usado",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p68",
        "nombre": "Angie Sandoval Sanchez",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Usado",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p69",
        "nombre": "Sophia Velazquez",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Disponible",
            "Julio - Agosto": "Usado",
            "Septiembre - Octubre": "Usado"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": false,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p70",
        "nombre": "Sandra Moreno",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Usado",
            "Mayo - Junio": "Usado",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p71",
        "nombre": "Andrea Cespedes",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Usado",
            "Mayo - Junio": "Usado",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": false,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p72",
        "nombre": "Luz Francy Serrano",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Disponible",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": false,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p73",
        "nombre": "Adriana bolivar",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Usado",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Usado"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": false,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p74",
        "nombre": "Karol Moreno",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Disponible",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": false,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p75",
        "nombre": "Victor Serrano",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Disponible",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": false,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p76",
        "nombre": "Andres Herrera",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Usado",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": false,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

        {
        "id": "p77",
        "nombre": "Edgar Sandoval",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Usado",
            "Mayo - Junio": "Usado",
            "Julio - Agosto": "Usado",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": false,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": true
    },

    {
        "id": "p78",
        "nombre": "Miguel Blanco",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Usado",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": false,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": true
    },

    {
        "id": "p79",
        "nombre": "Jose Antonio Chacon",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Disponible",
            "Julio - Agosto": "Usado",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": false,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": true
    },

    {
        "id": "p80",
        "nombre": "Alirio Calderón",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Usado",
            "Mayo - Junio": "Usado",
            "Julio - Agosto": "Usado",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": true,
        "elig_maestros_lectura": false,
        "elig_intro_conclusion": true,
        "elig_parte1": true,
        "elig_nvc": true,
        "elig_estudio_biblico": true,
        "elig_oraciones": true
    },

    {
        "id": "p81",
        "nombre": "Nolberto Calderón",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Usado",
            "Mayo - Junio": "Disponible",
            "Julio - Agosto": "Usado",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": true,
        "elig_maestros_lectura": false,
        "elig_intro_conclusion": false,
        "elig_parte1": true,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": true
    },

    {
        "id": "p82",
        "nombre": "David Quiñonez",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Usado",
            "Julio - Agosto": "Usado",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": false,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p83",
        "nombre": "Favio tarazona",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Usado",
            "Mayo - Junio": "Usado",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": false,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": true
    },

    {
        "id": "p84",
        "nombre": "Eduardo Parra",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Usado",
            "Mayo - Junio": "Disponible",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": true,
        "elig_maestros_lectura": false,
        "elig_intro_conclusion": true,
        "elig_parte1": true,
        "elig_nvc": true,
        "elig_estudio_biblico": true,
        "elig_oraciones": true
    },

    {
        "id": "p85",
        "nombre": "Cristian Reyes",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Usado",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": false,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p86",
        "nombre": "Nicolas Medina",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Usado",
            "Mayo - Junio": "Disponible",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": true,
        "elig_maestros_lectura": false,
        "elig_intro_conclusion": true,
        "elig_parte1": true,
        "elig_nvc": true,
        "elig_estudio_biblico": true,
        "elig_oraciones": true
    },

    {
        "id": "p87",
        "nombre": "Anderson Gomez",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Disponible",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": true,
        "elig_maestros_lectura": false,
        "elig_intro_conclusion": true,
        "elig_parte1": true,
        "elig_nvc": true,
        "elig_estudio_biblico": true,
        "elig_oraciones": true
    },

    {
        "id": "p88",
        "nombre": "Ismael Medina",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Disponible",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": false,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p89",
        "nombre": "Eliu Rodriguez",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Usado",
            "Mayo - Junio": "Disponible",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": true,
        "elig_maestros_lectura": false,
        "elig_intro_conclusion": true,
        "elig_parte1": true,
        "elig_nvc": true,
        "elig_estudio_biblico": true,
        "elig_oraciones": true
    },

    {
        "id": "p90",
        "nombre": "Diego Velasquez",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Usado",
            "Mayo - Junio": "Usado",
            "Julio - Agosto": "Usado",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": false,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": true
    },

    {
        "id": "p91",
        "nombre": "Albeiro Prieto",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Usado",
            "Mayo - Junio": "Disponible",
            "Julio - Agosto": "Usado",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": true,
        "elig_maestros_lectura": false,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": true
    },

        {
        "id": "p92",
        "nombre": "Sebastián Beleño",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Usado",
            "Julio - Agosto": "Usado",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": false,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p93",
        "nombre": "Johan Duarte",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Usado",
            "Mayo - Junio": "Disponible",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Usado"
        },
        "elig_perlas": true,
        "elig_maestros_lectura": false,
        "elig_intro_conclusion": true,
        "elig_parte1": true,
        "elig_nvc": true,
        "elig_estudio_biblico": true,
        "elig_oraciones": true
    },

    {
        "id": "p94",
        "nombre": "Oscar Duarte",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Usado",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Usado"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": false,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p95",
        "nombre": "Jose Duran",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Usado",
            "Mayo - Junio": "Usado",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": false,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p96",
        "nombre": "Alejandro Castañeda",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Disponible",
            "Julio - Agosto": "Usado",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": false,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p97",
        "nombre": "Santiago Serrano",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Disponible",
            "Julio - Agosto": "Usado",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": false,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p98",
        "nombre": "Orlando Prada",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Usado",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": false,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": true
    },

    {
        "id": "p99",
        "nombre": "Wilmer Reyes",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Usado",
            "Julio - Agosto": "Usado",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": true,
        "elig_maestros_lectura": false,
        "elig_intro_conclusion": false,
        "elig_parte1": true,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": true
    },

    {
        "id": "p100",
        "nombre": "Daniel Jaimes",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Usado",
            "Julio - Agosto": "Usado",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": false,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p101",
        "nombre": "Justin Reyes",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Usado",
            "Mayo - Junio": "Disponible",
            "Julio - Agosto": "Usado",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": false,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p102",
        "nombre": "Joel Reyes",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Disponible",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Usado"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": false,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p103",
        "nombre": "Luis A. Reyes",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Usado",
            "Mayo - Junio": "Disponible",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": false,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p104",
        "nombre": "Esteban Santacruz",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Disponible",
            "Julio - Agosto": "Usado",
            "Septiembre - Octubre": "Usado"
        },
        "elig_perlas": true,
        "elig_maestros_lectura": false,
        "elig_intro_conclusion": false,
        "elig_parte1": true,
        "elig_nvc": true,
        "elig_estudio_biblico": true,
        "elig_oraciones": true
    },

    {
        "id": "p105",
        "nombre": "Caleb Santacruz",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Usado",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": false,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p106",
        "nombre": "Luis Serrano",
        "nota": "Solo lectura",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Usado",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Usado"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": false,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

        {
        "id": "p107",
        "nombre": "Alex Reyes",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Disponible",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": false,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p108",
        "nombre": "Gabriel Ojeda",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Usado",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Usado"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": false,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p109",
        "nombre": "Edgar Serrano",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Disponible",
            "Julio - Agosto": "Usado",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": false,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p110",
        "nombre": "Hernando Rojas",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Usado",
            "Mayo - Junio": "Usado",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": false,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": true
    },

    {
        "id": "p111",
        "nombre": "Sergio Rojas",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Disponible",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": true,
        "elig_maestros_lectura": false,
        "elig_intro_conclusion": true,
        "elig_parte1": true,
        "elig_nvc": true,
        "elig_estudio_biblico": true,
        "elig_oraciones": true
    },

    {
        "id": "p112",
        "nombre": "Sebastián Beleño",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Usado",
            "Julio - Agosto": "Usado",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": false,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p113",
        "nombre": "David Obando",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Usado",
            "Mayo - Junio": "Disponible",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": false,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": true
    },

    {
        "id": "p114",
        "nombre": "Orlando Caballero",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Usado",
            "Mayo - Junio": "Disponible",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p115",
        "nombre": "Henry Luna",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Disponible",
            "Julio - Agosto": "Usado",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": true,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": true
    },

    {
        "id": "p116",
        "nombre": "Alexander Chacon",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Disponible",
            "Julio - Agosto": "Usado",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p117",
        "nombre": "Luis Quecho",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Usado",
            "Mayo - Junio": "Usado",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": true,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": true
    },

    {
        "id": "p118",
        "nombre": "Jorge Andres Jaimes",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Usado",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": false,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p119",
        "nombre": "Fabián Reyes",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Usado",
            "Mayo - Junio": "Disponible",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": false,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p120",
        "nombre": "Anderson Rodriguez",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Usado",
            "Mayo - Junio": "Usado",
            "Julio - Agosto": "Usado",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": false,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    },

    {
        "id": "p121",
        "nombre": "Sergio Cespedes",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Disponible",
            "Mayo - Junio": "Usado",
            "Julio - Agosto": "Usado",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": true,
        "elig_maestros_lectura": false,
        "elig_intro_conclusion": true,
        "elig_parte1": true,
        "elig_nvc": true,
        "elig_estudio_biblico": true,
        "elig_oraciones": true
    },

    {
        "id": "p122",
        "nombre": "Andres Camilo Muñoz",
        "nota": "",
        "disponibilidad": {
            "Marzo - Abril": "Usado",
            "Mayo - Junio": "Usado",
            "Julio - Agosto": "Disponible",
            "Septiembre - Octubre": "Disponible"
        },
        "elig_perlas": false,
        "elig_maestros_lectura": false,
        "elig_intro_conclusion": false,
        "elig_parte1": false,
        "elig_nvc": false,
        "elig_estudio_biblico": false,
        "elig_oraciones": false
    }
];
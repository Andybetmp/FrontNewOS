/* ============================================================================
   Fase 7 · El enlace público. La única pantalla sin cuenta y sin sesión.
   ----------------------------------------------------------------------------
   Quien abre esto NO es usuario de la aplicación: no tiene cuenta, ni fila en
   `perfiles`, ni rol. Recibió un enlace por WhatsApp y lo abrió en su teléfono.
   Por eso aquí no se llama a `tokenDeAhora()` — no hay sesión de la que sacarlo
   — y el token viaja en el CUERPO, no en la cabecera `authorization`.

   ⚠️⚠️ EL ENLACE MUERE AL ABRIRSE, Y ESO OBLIGA A GUARDAR EL TOKEN
   ---------------------------------------------------------------
   Esto es lo contrario de lo que decidimos en la fase 5, y la diferencia NO es
   un descuido: es que el secreto es otro y el dueño es otro.

   `EnlacesDeEquipo.abrir` lo hace así: en la primera apertura acuña un token de
   sesión nuevo y **reemplaza el resumen guardado por el suyo**. En ese instante
   el token que viajó por WhatsApp deja de existir en la base — no cuando
   caduque: al abrirse. El backend lo dice con todas las letras: «el mensaje de
   WhatsApp que llevó el enlace queda inútil EN ESE MOMENTO».

   Consecuencia, y hay que leerla despacio:

       Si esta pantalla no guarda el `tokenDeSesion` que le devuelven,
       la persona queda fuera PARA SIEMPRE en cuanto recargue la página.

   Su enlace ya no vale —lo mató su propia apertura— y el de sesión se perdió
   con la pestaña. No hay forma de recuperarlo: en la base vive solo un SHA-256.
   Tendría que pedir otro enlace a quien se lo mandó, y no sabría por qué.

   Así que aquí SÍ se guarda, y por eso:

   · En la fase 5 el secreto es de la EMPRESA y se enseña a quien administra:
     guardarlo dejaría la llave de un colaborador en el navegador de una oficina
     compartida. No se guarda.
   · Aquí el secreto es de la PERSONA, en su propio teléfono, y es la única
     copia que queda en el mundo. No guardarlo es tirarlo.

   La regla de la casa no es «los secretos no se guardan»: es «un secreto vive
   donde su dueño, y en ningún otro sitio».
   ========================================================================= */

import { pedirAlBackend } from "../nucleo/backend.js";

/** Los cinco campos de texto. `documentado` va aparte: es una casilla. */
export const CAMPOS_RESPUESTA = [
  "situacion", "senal", "reglaPractica", "errorFrecuente", "escalamiento",
];

/**
 * ⚠️ El único obligatorio, y el backend lo dice con esas palabras: «Falta lo
 * principal: qué haces tú en esa situación». Los otros cuatro pueden quedar
 * vacíos — vacío viaja como NULO, que es «no contestó», distinto de «contestó
 * la cadena vacía». El backend hace lo mismo con `recortado()`.
 */
export const OBLIGATORIO = "reglaPractica";

const raiz = (empresa) => `/publico/equipo/${encodeURIComponent(empresa)}`;

/**
 * Abre el enlace. Devuelve el saludo, y **solo la primera vez**, el token de
 * sesión.
 *
 * ⚠️ Cada llamada gasta un uso de los 200 que tiene el enlace. Por eso se llama
 * UNA vez al montar la pantalla y no después de cada respuesta: refrescar el
 * contador a costa de gastar aperturas sería pagar con la vida del enlace por
 * un número que ya sabemos.
 *
 * @returns {{tokenDeSesion: string|null, nombre, puesto, area, yaRespondidas}}
 */
export async function abrir(empresa, token) {
  return pedirAlBackend(`${raiz(empresa)}/apertura`, {
    metodo: "POST", cuerpo: { token: token ?? null },
  });
}

/**
 * Lo que se manda como `respuesta`, a partir de lo que tecleó la persona.
 *
 * ⚠️ ESTÁ SEPARADO DE `responder` A PROPÓSITO, Y NO ES ESTILO
 * -----------------------------------------------------------
 * El backend hace `recortado()` sobre cada campo: recorta, y lo que quede vacío
 * lo guarda NULO. O sea que si esta función se equivocara y mandase `""`, la
 * base acabaría igual de bien y **ninguna comprobación por HTTP lo notaría**.
 *
 * Una prueba que solo mire lo que quedó guardado pasa haga lo que haga el
 * front: la está pasando el backend, no el código que dice comprobar. Por eso
 * lo que viaja se construye aquí, donde se puede mirar sin servidor.
 */
export function cuerpoDeRespuesta(valores) {
  const respuesta = Object.fromEntries(
    CAMPOS_RESPUESTA.map((c) => {
      const v = valores?.[c];
      const limpio = typeof v === "string" ? v.trim() : v;
      return [c, limpio === "" || limpio === undefined ? null : limpio];
    })
  );
  /* Omitirlo significa `false`, no «no se sabe»: la columna es
     `boolean default false not null`, dos estados. Es distinto de
     `recontratar` en Logística, que sí admite el tercero. */
  respuesta.documentado = valores?.documentado === true;
  return respuesta;
}

/**
 * Guarda una entrada de la Caleta. No devuelve nada: un 200 con el cuerpo
 * vacío, que `pedirAlBackend` traduce a `null`.
 *
 * ⚠️ El token que va aquí es el DE SESIÓN, no el del enlace. Un token sin
 * canjear no puede escribir — el backend lo rechaza a propósito: «escribir sin
 * haber abierto no es un camino que exista en ninguna pantalla».
 */
export async function responder(empresa, token, valores) {
  return pedirAlBackend(`${raiz(empresa)}/respuesta`, {
    metodo: "POST",
    cuerpo: { token: token ?? null, respuesta: cuerpoDeRespuesta(valores) },
  });
}

/* ---------------------------------------------------------------------------
   Dónde vive el token de sesión.
   ---------------------------------------------------------------------------
   Se guarda bajo el token del enlace: así el mismo enlace abierto otra vez en
   el mismo teléfono se reconoce, y dos enlaces distintos no se pisan.

   ⚠️ `localStorage` revienta en algunos navegadores en modo privado —no
   devuelve vacío: LANZA— y quien lo llame sin proteger se lleva la pantalla por
   delante. Se captura, y quien pregunta se entera de que no se pudo.
   ------------------------------------------------------------------------ */

const CAJON = "renaser.enlace";

const llave = (empresa, tokenDelEnlace) => `${CAJON}:${empresa}:${tokenDelEnlace}`;

/** @returns {boolean} si se pudo guardar de verdad. */
export function recordar(empresa, tokenDelEnlace, tokenDeSesion) {
  try {
    globalThis.localStorage?.setItem(llave(empresa, tokenDelEnlace), tokenDeSesion);
    return true;
  } catch {
    return false;
  }
}

/** @returns {string|null} el token de sesión de un enlace ya abierto aquí. */
export function recordado(empresa, tokenDelEnlace) {
  try {
    return globalThis.localStorage?.getItem(llave(empresa, tokenDelEnlace)) ?? null;
  } catch {
    return null;
  }
}

/**
 * La URL que se manda por WhatsApp.
 *
 * ⚠️ Vive aquí y no en la pantalla de Ajustes porque el que construye el enlace
 * y el que lo lee tienen que estar de acuerdo, y la única forma de garantizarlo
 * es que sea la misma función. Hasta la fase 7 no existía: Ajustes copiaba el
 * token pelado y quien lo emitía tenía que fabricar la dirección a mano.
 */
export function enlaceDe(empresa, token, origen = globalThis.location?.origin ?? "") {
  return `${origen}/e/${encodeURIComponent(empresa)}/${token}`;
}

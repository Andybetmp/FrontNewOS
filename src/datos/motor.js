import { pedirAlBackend } from "../nucleo/backend.js";
import { tokenDeAhora } from "../nucleo/sesionLocal.js";

/* ============================================================================
   El motor de IA · las cuatro operaciones que CUESTAN DINERO.
   ----------------------------------------------------------------------------
   ⚠️ ESTA ES LA ÚNICA CAPA DE DATOS DE LA APLICACIÓN QUE GASTA
   ------------------------------------------------------------
   Cada llamada de verdad paga tokens a un proveedor, y una imagen paga mucho
   más que un texto. Eso cambia tres cosas respecto a todo lo demás:

   1. **La corrida en seco no es una comodidad de desarrollo.** Es la forma de
      ver qué se va a pedir sin pagarlo, y el backend la soporta en las cuatro.
      La pantalla la ofrece siempre y en primer lugar.
   2. **No se reintenta solo.** Un reintento automático de algo que cobra es
      cobrar dos veces. Si falla, lo vuelve a pedir una persona.
   3. **Lo que costó se enseña.** Una llamada que se paga y no se apunta es
      gasto invisible. Cuando el backend devuelve `costoUsd` o `costoIaUsd`, va
      a la pantalla; cuando devuelve nulo, se dice que no se pudo calcular —no
      se pinta un cero.

   ⚠️ Y HAY UN FRENO DELANTE
   -------------------------
   El interruptor del motor tiene que estar encendido. Si no, el backend
   contesta `ElMotorEstaDetenido` con el motivo escrito, y eso NO es un error de
   la pantalla: es el sistema haciendo lo que se le pidió.
   ========================================================================= */

/** ⚠️ Sin tiempo de espera corto: una ilustración real tarda más de un minuto. */
const LARGO = { senal: undefined };

export const motor = {
  /**
   * @param seco true = no llama al proveedor y no cobra. Devuelve qué haría.
   */
  diagnosticar: async ({ seco = true } = {}) =>
    pedirAlBackend(`/diagnostico?seco=${seco}`, {
      metodo: "POST", token: await tokenDeAhora(), ...LARGO,
    }),

  planificar: async ({ seco = true } = {}) =>
    pedirAlBackend(`/plan?seco=${seco}`, {
      metodo: "POST", token: await tokenDeAhora(), ...LARGO,
    }),

  redactar: async ({ encargo, seco = true } = {}) =>
    pedirAlBackend(`/campanas?seco=${seco}`, {
      metodo: "POST", cuerpo: { encargo: encargo ?? null },
      token: await tokenDeAhora(), ...LARGO,
    }),

  /**
   * @param campana el identificador de la campaña redactada
   * @param angulos cuáles ilustrar. Vacío = los que el paquete traiga
   * @param esFinal ⚠️ decide el modelo: boceto barato o definitivo bueno. La
   *                diferencia de precio es de veintitrés veces, así que lo dice
   *                quien llama y nunca se supone
   */
  ilustrar: async ({ campana, angulos = null, esFinal = false, seco = true } = {}) =>
    pedirAlBackend(`/campanas/ilustrar?seco=${seco}`, {
      metodo: "POST", token: await tokenDeAhora(), ...LARGO,
      cuerpo: {
        campana_agente_id: campana ?? null,
        angulos: angulos && angulos.length ? angulos : null,
        final: esFinal,
      },
    }),
};

/** Lo que cada operación necesita antes de poder correr. Sale del backend. */
export const OPERACIONES = [
  {
    id: "diagnosticar",
    titulo: "Diagnosticar por documentos",
    queHace: "Lee las afirmaciones de los documentos y propone hallazgos con su evidencia.",
    exige: "Hace falta material: afirmaciones extraídas de documentos.",
  },
  {
    id: "planificar",
    titulo: "Planificar frentes",
    queHace: "Convierte los hallazgos en frentes de trabajo con responsable y semana.",
    exige: "Hace falta al menos un hallazgo con evidencia.",
  },
  {
    id: "redactar",
    titulo: "Redactar una campaña",
    queHace: "Escribe los ángulos, titulares y cuerpos de una campaña.",
    exige: "Hace falta un sobre de presupuesto vigente y firmado.",
  },
  {
    id: "ilustrar",
    titulo: "Ilustrar una campaña",
    queHace: "Genera los creativos de cada ángulo del paquete redactado.",
    exige: "Hace falta una campaña ya redactada. Primero se escribe, luego se ilustra.",
  },
];

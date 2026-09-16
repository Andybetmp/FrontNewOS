import { pedirAlBackend } from "../nucleo/backend.js";
import { tokenDeAhora } from "../nucleo/sesionLocal.js";

/* ============================================================================
   Los dos catálogos de logística.
   ----------------------------------------------------------------------------
   ⚠️ CORREGIR ES REEMPLAZAR, Y ESO MANDA SOBRE EL FORMULARIO
   ----------------------------------------------------------
   El PUT no acepta cuerpos a medias: el backend exige el recurso ENTERO y, si
   falta algo, contesta 400 nombrando los campos que faltan. No es una manía —
   antes un PUT parcial borraba en silencio lo que no venía, y se descubrió que
   corregir el nombre de un evento le quitaba la ciudad, la fecha y la sede.

   Consecuencia para quien escriba pantallas: el formulario **no puede enviar
   solo lo que cambió**. Manda todos los campos del contrato, y un nulo
   explícito significa «vaciar esto», que es distinto de «no lo toques».

   Por eso `CAMPOS_*` está aquí escrito: es el contrato, no una comodidad.
   ========================================================================= */

export const CAMPOS_LUGAR = [
  "nombre", "tipo", "ciudad", "aforo", "precio", "contacto", "observaciones",
];

export const CAMPOS_PROVEEDOR = [
  "nombre", "tipo", "contacto", "ciudad", "precio", "calidad", "recontratar",
  "observaciones",
];

/** El cuerpo completo que exige un reemplazo. Lo que no esté, va nulo a propósito. */
function cuerpoEntero(campos, valores) {
  return Object.fromEntries(campos.map((c) => [c, valores[c] ?? null]));
}

export const lugares = {
  listar: async () => pedirAlBackend("/logistica/lugares", { token: await tokenDeAhora() }),
  crear: async (datos) =>
    pedirAlBackend("/logistica/lugares", {
      metodo: "POST", cuerpo: cuerpoEntero(CAMPOS_LUGAR, datos), token: await tokenDeAhora(),
    }),
  corregir: async (id, datos) =>
    pedirAlBackend(`/logistica/lugares/${id}`, {
      metodo: "PUT", cuerpo: cuerpoEntero(CAMPOS_LUGAR, datos), token: await tokenDeAhora(),
    }),
};

export const proveedores = {
  listar: async () => pedirAlBackend("/logistica/proveedores", { token: await tokenDeAhora() }),
  crear: async (datos) =>
    pedirAlBackend("/logistica/proveedores", {
      metodo: "POST", cuerpo: cuerpoEntero(CAMPOS_PROVEEDOR, datos), token: await tokenDeAhora(),
    }),
  corregir: async (id, datos) =>
    pedirAlBackend(`/logistica/proveedores/${id}`, {
      metodo: "PUT", cuerpo: cuerpoEntero(CAMPOS_PROVEEDOR, datos), token: await tokenDeAhora(),
    }),
};

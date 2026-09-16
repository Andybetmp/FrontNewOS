import { pedirAlBackend } from "../nucleo/backend.js";
import { tokenDeAhora } from "../nucleo/sesionLocal.js";

/* ============================================================================
   Eventos, y las dos cosas que cuelgan de un evento.
   ----------------------------------------------------------------------------
   ⚠️ ONCE CAMPOS, Y EL PUT LOS QUIERE TODOS
   -----------------------------------------
   `DatosDeEvento` tiene once campos y sirve para el alta Y para la corrección.
   Corregir REEMPLAZA: el backend exige el recurso entero y, si falta algo,
   contesta 400 nombrándolo.

   Aquí eso duele más que en Logística, y por eso Eventos es la fase 2: un
   formulario de once campos que envía «solo lo que cambió» borraría la fecha,
   la sede y el presupuesto de un evento en producción. Ya pasó una vez —P14 del
   backend—: corregir el nombre lo devolvía de fase «campaña» a «idea», con un
   200 y sin una palabra.

   ⚠️ Y `estado` ES UNO DE LOS ONCE
   --------------------------------
   O sea que un reemplazo que no lo mande retrocede la fase. El formulario tiene
   que traerlo siempre, aunque nadie lo esté tocando.
   ========================================================================= */

export const CAMPOS_EVENTO = [
  "nombre", "ciudad", "fecha", "ponente", "metaInscritos", "metaAsistentes",
  "metaVentas", "presupuesto", "gastoReal", "estado", "lugar",
];

/** Los que el formulario manda como número. El resto, texto o nulo. */
export const NUMERICOS_EVENTO = [
  "metaInscritos", "metaAsistentes", "metaVentas", "presupuesto", "gastoReal",
];

function cuerpoEntero(campos, valores) {
  return Object.fromEntries(campos.map((c) => [c, valores[c] ?? null]));
}

export const eventos = {
  listar: async () => pedirAlBackend("/eventos", { token: await tokenDeAhora() }),
  ver: async (id) => pedirAlBackend(`/eventos/${id}`, { token: await tokenDeAhora() }),
  /** Las ocho fases, en el orden en que ocurren. Sale del backend, no de aquí. */
  fases: async () => pedirAlBackend("/eventos/fases", { token: await tokenDeAhora() }),
  crear: async (datos) =>
    pedirAlBackend("/eventos", {
      metodo: "POST", cuerpo: cuerpoEntero(CAMPOS_EVENTO, datos), token: await tokenDeAhora(),
    }),
  corregir: async (id, datos) =>
    pedirAlBackend(`/eventos/${id}`, {
      metodo: "PUT", cuerpo: cuerpoEntero(CAMPOS_EVENTO, datos), token: await tokenDeAhora(),
    }),
};

export const inscritos = {
  listar: async (evento) =>
    pedirAlBackend(`/eventos/${evento}/inscritos`, { token: await tokenDeAhora() }),
  resumen: async (evento) =>
    pedirAlBackend(`/eventos/${evento}/inscritos/resumen`, { token: await tokenDeAhora() }),
  inscribir: async (evento, datos) =>
    pedirAlBackend(`/eventos/${evento}/inscritos`, {
      metodo: "POST", token: await tokenDeAhora(),
      cuerpo: {
        prospecto: datos.prospecto ?? null,
        montoPagado: datos.montoPagado ?? null,
        comprobante: datos.comprobante ?? null,
      },
    }),
  /** ⚠️ El monto es OPCIONAL: si no viene, se da por bueno lo que se declaró. */
  validar: async (evento, id, montoConfirmado) =>
    pedirAlBackend(`/eventos/${evento}/inscritos/${id}/validacion`, {
      metodo: "POST", cuerpo: { montoConfirmado: montoConfirmado ?? null },
      token: await tokenDeAhora(),
    }),
  /** ⚠️ El motivo NO es opcional. «Toda transición manual exige motivo escrito». */
  rechazar: async (evento, id, motivo) =>
    pedirAlBackend(`/eventos/${evento}/inscritos/${id}/rechazo`, {
      metodo: "POST", cuerpo: { motivo }, token: await tokenDeAhora(),
    }),
};

export const proveedoresDelEvento = {
  listar: async (evento) =>
    pedirAlBackend(`/eventos/${evento}/proveedores`, { token: await tokenDeAhora() }),
  resumen: async (evento) =>
    pedirAlBackend(`/eventos/${evento}/proveedores/resumen`, { token: await tokenDeAhora() }),
  contratar: async (evento, datos) =>
    pedirAlBackend(`/eventos/${evento}/proveedores`, {
      metodo: "POST", token: await tokenDeAhora(),
      cuerpo: {
        proveedor: datos.proveedor ?? null,
        concepto: datos.concepto ?? null,
        costoAcordado: datos.costoAcordado ?? null,
        notas: datos.notas ?? null,
      },
    }),
  /* ⚠️ El evento y el proveedor NO se corrigen: eso sería otro contrato, no una
     corrección. Por eso `Correccion` solo tiene tres campos. */
  corregir: async (evento, id, datos) =>
    pedirAlBackend(`/eventos/${evento}/proveedores/${id}`, {
      metodo: "PUT", token: await tokenDeAhora(),
      cuerpo: {
        concepto: datos.concepto ?? null,
        costoAcordado: datos.costoAcordado ?? null,
        notas: datos.notas ?? null,
      },
    }),
};

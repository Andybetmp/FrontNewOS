import { pedirAlBackend } from "../nucleo/backend.js";
import { tokenDeAhora } from "../nucleo/sesionLocal.js";

/* ============================================================================
   Programas, sus clientes y sus pagos.
   ----------------------------------------------------------------------------
   ⚠️ D11 · LO DECLARADO Y LO COBRADO VIAJAN JUNTOS Y NO SE FUNDEN
   ---------------------------------------------------------------
   El backend lo dice así, y la pantalla tiene que obedecerlo:

     «`ingresosDeclarados` lo escribe una persona; `cobradoSoles` sale de sumar
      los pagos. Con solo el primero no se sabe si el dinero entró; con solo el
      segundo se borra el dinero que no vino de un cliente —un patrocinio, una
      venta de material—. QUE DIFIERAN ES EL DATO, y por eso van juntos.»

   Consecuencia para quien diseñe: **no hay un número «de ingresos»**. Hay dos, y
   la diferencia entre ellos es información. Un tablero que los sume, los
   promedie o enseñe solo uno borra la única señal que importa.

   ⚠️ Y UN NULO NO ES UN CERO
   --------------------------
   `ingresosDeclarados: null` significa «nadie lo ha declarado todavía». Pintarlo
   como S/ 0 diría que el programa no ingresa nada, que es una afirmación que
   nadie hizo.
   ========================================================================= */

export const TIPOS = ["formacion", "escuela", "certificacion", "adicional"];
export const MONEDAS = ["PEN", "USD"];
export const MODALIDADES = ["contado", "cuota"];

/** ⚠️ USD exige tasa de cambio. Sin ella no se sabe cuánto entró en soles. */
export const exigeTasa = (moneda) => moneda === "USD";

export const programas = {
  listar: async () => pedirAlBackend("/programas", { token: await tokenDeAhora() }),
  ver: async (id) => pedirAlBackend(`/programas/${id}`, { token: await tokenDeAhora() }),
  crear: async (d) =>
    pedirAlBackend("/programas", {
      metodo: "POST", token: await tokenDeAhora(),
      cuerpo: {
        nombre: d.nombre ?? null,
        tipo: d.tipo ?? null,
        /* Vacío va NULO: «nadie lo ha declarado», no «declaró cero». */
        ingresosDeclarados: d.ingresosDeclarados ?? null,
        egresosDeclarados: d.egresosDeclarados ?? null,
      },
    }),
};

export const inscripciones = {
  deUnPrograma: async (programa) =>
    pedirAlBackend(`/programas/inscripciones/programa/${programa}`, { token: await tokenDeAhora() }),
  crear: async (d) =>
    pedirAlBackend("/programas/inscripciones", {
      metodo: "POST", token: await tokenDeAhora(),
      cuerpo: {
        nombre: d.nombre ?? null,
        programa: d.programa ?? null,
        /* ⚠️ Obligatorio: de él cuelga el día de programa en que va cada
           persona y cualquier cálculo de atraso. */
        ingresoEl: d.ingresoEl ?? null,
        responsable: d.responsable ?? null,
      },
    }),
};

export const pagos = {
  deUnCliente: async (cliente) =>
    pedirAlBackend(`/programas/pagos/cliente/${cliente}`, { token: await tokenDeAhora() }),
  registrar: async (d) =>
    pedirAlBackend("/programas/pagos", {
      metodo: "POST", token: await tokenDeAhora(),
      cuerpo: {
        clienteDePrograma: d.clienteDePrograma ?? null,
        monto: d.monto ?? null,
        moneda: d.moneda ?? null,
        /* Solo con USD. En soles, una tasa sería ruido. */
        tasaCambio: exigeTasa(d.moneda) ? (d.tasaCambio ?? null) : null,
        pagadoEl: d.pagadoEl ?? null,
        modalidad: d.modalidad ?? null,
        /* Solo con «cuota». En contado no hay número de cuota que valga. */
        cuotaNumero: d.modalidad === "cuota" ? (d.cuotaNumero ?? null) : null,
        medio: d.medio ?? null,
        comprobante: d.comprobante ?? null,
      },
    }),
};

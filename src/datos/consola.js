import { pedirAlBackend } from "../nucleo/backend.js";
import { tokenDeAhora } from "../nucleo/sesionLocal.js";

/* ============================================================================
   Fase 6 · La consola de RENASER. Otra aplicación, no otra pantalla.
   ----------------------------------------------------------------------------
   Todo lo de aquí lista o toca a TODOS los clientes. La ruta `/control/**` del
   backend exige la autoridad EQUIPO_RENASER, que sale de la reclamación
   `equipo` del token y nunca de tener o no tener empresa.

   ⚠️ Y NO PASA POR EL ENRUTADOR
   -----------------------------
   El backend lo dice en su javadoc: la consola «habla solo con la base de
   control. Es lo que permite que funcione cuando no hay ninguna empresa dada de
   alta — que es, precisamente, cuando hace falta para dar de alta a la
   primera».

   Consecuencia para esta capa: aquí NO se resuelve ninguna instancia, no se
   lee `EMPRESA`, y una lista vacía es el estado normal de una instalación
   recién puesta. No es un error y no se pinta como tal.
   ========================================================================= */

const conSesion = async () => ({ token: await tokenDeAhora() });

export const empresas = {
  listar: async () => pedirAlBackend("/control/empresas", await conSesion()),
  ver: async (clave) => pedirAlBackend(`/control/empresas/${encodeURIComponent(clave)}`, await conSesion()),

  /** La historia de lo que se le hizo, de lo más reciente a lo más viejo. */
  historia: async (clave) =>
    pedirAlBackend(`/control/empresas/${encodeURIComponent(clave)}/eventos`, await conSesion()),

  darDeAlta: async (datos) =>
    pedirAlBackend("/control/empresas", {
      metodo: "POST", token: await tokenDeAhora(),
      cuerpo: {
        clave: datos.clave ?? null,
        nombre: datos.nombre ?? null,
        plan: datos.plan ?? null,
        correoAdministrador: datos.correoAdministrador ?? null,
      },
    }),

  /**
   * ⚠️ Las tres transiciones exigen MOTIVO, y el backend las rechaza sin él.
   *
   * «Toda transición manual exige motivo escrito» — y lo dice con sus palabras:
   * *«una suspensión sin motivo es indistinguible de un error»*. El mínimo son
   * diez caracteres, y lo impone el servidor: ver `MOTIVO_MINIMO`.
   */
  suspender: async (clave, motivo) => transicion(clave, "suspension", motivo),
  reactivar: async (clave, motivo) => transicion(clave, "reactivacion", motivo),
  cerrar: async (clave, motivo) => transicion(clave, "cierre", motivo),

  /** Deja al primer administrador dentro. No devuelve nada. */
  darAcceso: async (clave, cuenta, correo) =>
    pedirAlBackend(`/control/empresas/${encodeURIComponent(clave)}/administrador`, {
      metodo: "POST", token: await tokenDeAhora(),
      cuerpo: { cuenta: cuenta ?? null, correo: correo ?? null },
    }),
};

async function transicion(clave, cual, motivo) {
  return pedirAlBackend(`/control/empresas/${encodeURIComponent(clave)}/${cual}`, {
    metodo: "POST", cuerpo: { motivo: motivo ?? null }, token: await tokenDeAhora(),
  });
}

/** Lo exige el backend en `CicloDeVidaDeEmpresa`. Aquí solo sirve para avisar antes. */
export const MOTIVO_MINIMO = 10;

export const planes = {
  listar: async () => pedirAlBackend("/control/planes", await conSesion()),
  ver: async (clave) => pedirAlBackend(`/control/planes/${encodeURIComponent(clave)}`, await conSesion()),

  /**
   * ⚠️ `limitePersonas` NULO es «sin límite». Un cero diría «no cabe nadie», y
   * el backend lo rechaza justo para que nadie escriba uno creyendo lo otro.
   * Es el tercer sitio de este proyecto donde nulo y cero no son lo mismo.
   */
  crear: async (datos) =>
    pedirAlBackend("/control/planes", {
      metodo: "POST", token: await tokenDeAhora(),
      cuerpo: {
        clave: datos.clave ?? null,
        nombre: datos.nombre ?? null,
        limitePersonas: datos.limitePersonas ?? null,
      },
    }),
};

/* ---------------------------------------------------------------------------
   QUÉ TRANSICIÓN CABE · LO DICE EL BACKEND, Y AQUÍ NO HAY NINGUNA TABLA
   ---------------------------------------------------------------------------
   Hasta el 16 de septiembre de 2026 esto era una COPIA de la regla que vive en
   `Empresa.java`, con su aviso de que era una copia. Ya no: la ficha trae las
   tres transiciones con `cabe` y con `desde`, y las calcula el mismo `Transicion`
   que las impide. Si alguien cambia lo que admite una, cambian las dos a la vez
   porque leen lo mismo.

   Es lo mismo que ya pasaba con las ocho fases de un evento: salen del backend
   para que no haya dos verdades que algún día discrepen sin que nadie se entere.

   Lo que queda aquí NO es la regla: es cómo se cuenta.
   ------------------------------------------------------------------------ */

/**
 * Por qué no se puede, dicho para leer. Nulo cuando sí se puede.
 *
 * ⚠️ Todo sale de la respuesta: `desde` lo manda el backend —es la misma lista
 * que aparece en su mensaje de error, para que lo que se explica al mirar y lo
 * que se contesta al fallar digan lo mismo—, y «es definitivo» se deduce de que
 * NINGUNA quepa. En ningún sitio de este fichero está escrito que `cerrada` sea
 * terminal: se ve.
 */
export function porQueNo(transicion, estado, todas) {
  if (transicion.cabe) {
    return null;
  }
  if (todas.every((t) => !t.cabe)) {
    return "Esta empresa ya no admite ninguna transición. Es definitivo.";
  }
  return `Está en «${estado}», y esto solo se permite desde: ${transicion.desde.join(", ")}.`;
}

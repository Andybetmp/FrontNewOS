import { pedirAlBackend } from "../nucleo/backend.js";
import { tokenDeAhora } from "../nucleo/sesionLocal.js";

/* ============================================================================
   Ajustes · la conexión con Meta y los enlaces de equipo.
   ----------------------------------------------------------------------------
   ⚠️ EL TOKEN DE UN ENLACE SALE UNA SOLA VEZ
   ------------------------------------------
   El backend lo dice en su javadoc: «la ÚNICA vez que el token plano sale de
   este sistema. No se guarda en ningún sitio: si se pierde, se emite otro».

   En la base vive solo su resumen, así que nadie —ni el equipo, ni una consulta
   de soporte— puede recuperarlo después. Consecuencia para la pantalla:

   · Se enseña UNA vez, y se dice que es la única.
   · No se guarda en memoria, ni en localStorage, ni en la URL.
   · Al cerrar el aviso, se pierde. Eso no es un fallo: es el diseño.

   Un front que lo guardara «por comodidad» convertiría un secreto de un solo
   uso en uno que vive en el navegador de cualquiera que abra esa pestaña.
   ========================================================================= */

export const meta = {
  /** Solo lectura: dice si hay credenciales, si Meta contesta, y QUÉ HACER. */
  conexion: async () => pedirAlBackend("/meta/conexion", { token: await tokenDeAhora() }),
};

export const colaboradores = {
  /**
   * A quién se le puede mandar un enlace.
   *
   * ⚠️ Devuelve cuatro campos y el semáforo, y NADA más: la tabla guarda correos
   * personales, whatsapp y desempeño, y esto existe para elegir a alguien de una
   * lista. Ver `DirectorioDelEquipo` en el backend, que tiene una prueba que lo
   * vigila por nombre.
   *
   * ⚠️ Y NO viene filtrada por estado. `estado` es un semáforo —ok/warn/crit—,
   * no un «activo». A quien está en `crit` es a quien más falta hace escuchar.
   */
  listar: async () => pedirAlBackend("/equipo/colaboradores", { token: await tokenDeAhora() }),
};

export const enlaces = {
  /**
   * @returns {{id, token, expiraEl}} ⚠️ `token` solo existe en esta respuesta.
   */
  emitir: async (colaborador) =>
    pedirAlBackend("/equipo/enlaces", {
      metodo: "POST", cuerpo: { colaborador: colaborador ?? null },
      token: await tokenDeAhora(),
    }),

  /**
   * ⚠️ Revocar un enlace que NO EXISTE falla desde el 15 de septiembre de 2026.
   *
   * Antes contestaba 200 y no hacía nada: quien revocaba un acceso con un id
   * equivocado oía «hecho» y dejaba de mirar, mientras el enlace de verdad
   * seguía vivo. Revocar dos veces el mismo SÍ sigue valiendo — la diferencia
   * está en si la fila existe, no en si ya estaba revocada.
   */
  revocar: async (id) =>
    pedirAlBackend(`/equipo/enlaces/${id}/revocacion`, {
      metodo: "POST", token: await tokenDeAhora(),
    }),
};

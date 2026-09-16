/* ============================================================================
   v2 · Resolver a QUÉ empresa se conecta esta pestaña
   ----------------------------------------------------------------------------
   La aplicación de hoy fija la URL de Supabase EN TIEMPO DE COMPILACIÓN
   (VITE_SUPABASE_URL). Eso significa un despliegue por empresa, y es la razón
   de que no pueda servir a dos clientes a la vez.

   Aquí no. El backend expone una ruta pública que, dada la clave de una
   empresa, devuelve dónde vive y con qué llave pública se entra:

       GET /publico/instancia/acme
       → { clave, nombre, urlApi, clavePublica }

   ⚠️ DOS COSAS QUE NO SE PARECEN Y SE CONFUNDEN A DIARIO
   -----------------------------------------------------
   · Supabase es POR EMPRESA. Cada cliente tiene su proyecto, su base y su
     emisor de tokens. La URL sale de aquí, nunca de una variable de entorno.
   · El backend es UNO SOLO para todos. Su URL sí es una variable de entorno,
     porque no depende de quién mire.

   Mezclarlas es el error que este módulo existe para hacer imposible.

   ⚠️ POR QUÉ LA CLAVE PÚBLICA VIAJA Y NO PASA NADA
   ------------------------------------------------
   Es la anon key: es pública por diseño, llega a cada navegador que abre la
   aplicación, y quien protege los datos es la RLS de esa base. El secreto de
   servicio NO sale de aquí ni existe en el navegador.
   ========================================================================= */

import { urlDelBackend } from "./backend.js";

/** Lo que el backend sabe de una empresa. Ninguno de los cuatro puede faltar. */
/**
 * De que empresa es esta pestaña.
 *
 * ⚠️ Vive aqui y no en `App.jsx` porque desde la fase 7 la necesitan DOS sitios
 * —el armazon del cliente y el enlace que se copia en Ajustes—, y una constante
 * escrita dos veces es una segunda verdad: el dia que discrepen, el enlace que
 * se manda por WhatsApp apunta a una empresa distinta de la que esta abierta y
 * nadie sabe cual manda.
 *
 * En produccion saldra del subdominio o del acceso. Hoy se fija en el `.env`.
 */
export const EMPRESA = (import.meta?.env?.VITE_EMPRESA ?? "acme").trim();

export class NoSeSabeDondeVive extends Error {
  constructor(clave, motivo) {
    super(
      `No se pudo resolver dónde vive la empresa «${clave}»: ${motivo}. ` +
        `Sin eso no hay a qué base conectarse, y conectarse «a la que sea» ` +
        `sería servirle a alguien los datos de otro.`
    );
    this.clave = clave;
  }
}

/**
 * Dónde vive una empresa.
 *
 * ⚠️ No devuelve nada a medias: si falta cualquiera de los cuatro campos,
 * revienta. Un destino con la URL puesta y la llave vacía es peor que ninguno,
 * porque el fallo aparece tres pantallas más tarde.
 */
export async function resolverInstancia(clave) {
  if (!clave || !clave.trim()) {
    throw new NoSeSabeDondeVive(clave, "no se dijo de qué empresa");
  }

  let respuesta;
  try {
    respuesta = await fetch(`${urlDelBackend()}/publico/instancia/${encodeURIComponent(clave)}`);
  } catch (e) {
    /* Error de red: el backend no contesta. Se distingue del 404 a propósito —
       son dos averías con dos culpables distintos. */
    throw new NoSeSabeDondeVive(clave, `no se pudo hablar con el backend (${e.message})`);
  }

  if (respuesta.status === 404) {
    throw new NoSeSabeDondeVive(clave, "no hay ninguna empresa con esa clave");
  }
  if (!respuesta.ok) {
    throw new NoSeSabeDondeVive(clave, `el backend contestó ${respuesta.status}`);
  }

  const destino = await respuesta.json();
  const faltan = ["clave", "nombre", "urlApi", "clavePublica"].filter((c) => !destino?.[c]);
  if (faltan.length > 0) {
    throw new NoSeSabeDondeVive(clave, `la respuesta no trae ${faltan.join(", ")}`);
  }
  return destino;
}

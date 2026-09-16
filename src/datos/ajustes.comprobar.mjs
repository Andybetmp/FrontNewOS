/* ============================================================================
   Fase 5 · Ajustes y equipo, contra el backend de verdad.
   ========================================================================= */

import { BACKEND, vista, exigir, tokenLocal } from "../comprobar/arnes.mjs";

globalThis.VITE_BACKEND_URL = BACKEND;

const { meta, enlaces, colaboradores } = await import("./ajustes.js");
const { ErrorDelBackend } = await import("../nucleo/backend.js");

/** Un colaborador de verdad, del endpoint que ahora sí existe. */
async function unColaborador() {
  const lista = await colaboradores.listar();
  return lista.length ? lista[0].id : null;
}

vista("Fase 5 · Ajustes y equipo", (caso) => {

  caso("⚠️ El directorio trae lo justo para elegir, y NADA de recursos humanos", async () => {
    const lista = await colaboradores.listar();
    exigir(Array.isArray(lista), "tiene que ser una lista");
    if (lista.length === 0) return;
    for (const c of ["id", "nombre", "rolLabel", "area", "estado"]) {
      exigir(c in lista[0], `tiene que traer ${c}`);
    }
    /* ⚠️ Lo que NO puede venir. Si el backend cambiara el select por un `*`,
       la pantalla empezaría a recibir la ficha entera sin enterarse. */
    const crudo = JSON.stringify(lista);
    for (const prohibido of ["email", "whatsapp", "desempeno", "potencial", "e360", "lider"]) {
      exigir(!crudo.includes(prohibido),
        `esto es una lista para elegir, no la ficha de recursos humanos: ${prohibido}`);
    }
  });

  caso("La conexión con Meta dice QUÉ HACER, no solo que falla", async () => {
    const c = await meta.conexion();
    for (const campo of ["hayCredenciales", "metaContesta", "cuenta", "campanasVisibles", "queHacer"]) {
      exigir(campo in c, `la respuesta tiene que traer ${campo}`);
    }
    /* Lo que hace útil este endpoint no es el booleano: es la frase. Un «false»
       sin qué hacer manda a abrir el código. */
    exigir(typeof c.queHacer === "string" && c.queHacer.length > 20,
      "tiene que decir qué hacer, con palabras");
  });

  caso("⚠️ Emitir un enlace devuelve el token UNA vez, y con su caducidad", async () => {
    const colaborador = await unColaborador();
    if (!colaborador) {
      /* Sin colaborador no se puede emitir. Se dice, no se finge. */
      throw new Error("No hay ningún colaborador en la base de esta empresa.");
    }
    const e = await enlaces.emitir(colaborador);
    exigir(e.id, "tiene que traer el id, que es lo único que se puede revocar después");
    exigir(e.token && e.token.length > 10, "y el token, que no vuelve a salir nunca");
    exigir(e.expiraEl, "y cuándo caduca");
  });

  caso("⚠️ Revocar uno que NO EXISTE falla · era un 200 mudo hasta el 15-sep", async () => {
    try {
      await enlaces.revocar("11111111-2222-3333-4444-555555555555");
      throw new Error("un id inexistente tenía que fallar");
    } catch (e) {
      exigir(e instanceof ErrorDelBackend, "tiene que ser un error del backend");
      exigir(!e.esGenerico, "explicado: quien revoca un acceso y oye «hecho» deja de mirar");
    }
  });

  caso("Emitir sin colaborador se explica, no revienta", async () => {
    try {
      await enlaces.emitir(null);
      throw new Error("sin colaborador tenía que fallar");
    } catch (e) {
      exigir(e instanceof ErrorDelBackend && !e.esGenerico, "explicado");
      exigir(e.detalle.toLowerCase().includes("colaborador"), "diciendo qué falta");
    }
  });
});

/* ============================================================================
   Fase 7 · El enlace público, contra el backend de verdad.
   ----------------------------------------------------------------------------
   Es la única comprobación que recorre las DOS puertas: emite el enlace con un
   token de administración —como haría Ajustes— y después lo abre SIN token
   ninguno, como haría un teléfono que llegó desde WhatsApp.

   Un doble no habría servido para nada aquí: lo que hay que acertar es
   exactamente lo que solo sabe el backend — que el enlace se muere al abrirse.
   ========================================================================= */

import { BACKEND, EMPRESA, vista, exigir, tokenLocal } from "../comprobar/arnes.mjs";

globalThis.VITE_BACKEND_URL = BACKEND;

const { fijarProveedorDeToken } = await import("../nucleo/sesionLocal.js");
fijarProveedorDeToken(() => tokenLocal());

const { enlaces, colaboradores } = await import("./ajustes.js");
const { abrir, responder, enlaceDe, cuerpoDeRespuesta } = await import("./enlacePublico.js");
const { ErrorDelBackend } = await import("../nucleo/backend.js");

/** Emite un enlace de verdad y devuelve `{id, token}`. */
async function unEnlaceNuevo() {
  const lista = await colaboradores.listar();
  if (!lista.length) {
    throw new Error("No hay ningun colaborador en la base de esta empresa.");
  }
  return enlaces.emitir(lista[0].id);
}

/** Lo que salió por el cable, para poder compararlo carácter a carácter. */
async function loQueContesta(fn) {
  try {
    await fn();
    return null;
  } catch (e) {
    exigir(e instanceof ErrorDelBackend, `tenia que fallar con un error del backend: ${e.message}`);
    return { estado: e.estado, titulo: e.titulo, detalle: e.detalle };
  }
}

vista("Fase 7 · Enlace público", (caso) => {

  caso("Abrir un enlace saluda por el nombre y entrega el token de sesión", async () => {
    const { token } = await unEnlaceNuevo();
    const a = await abrir(EMPRESA, token);

    exigir(a.tokenDeSesion, "la PRIMERA apertura tiene que entregar el token de sesión");
    exigir(typeof a.nombre === "string" && a.nombre.length > 0, "y saludar por el nombre");
    /* Solo el primer nombre: «es un saludo, no un expediente», dice el backend. */
    exigir(!a.nombre.includes(" "), `solo el primer nombre, y llegó «${a.nombre}»`);
    exigir("puesto" in a && "area" in a, "con el puesto y el área");
    exigir(a.yaRespondidas === 0, "un enlace nuevo no tiene respuestas todavía");
  });

  caso("⚠️ EL ENLACE MUERE AL ABRIRSE · el token original ya no vale", async () => {
    const { token } = await unEnlaceNuevo();
    const primera = await abrir(EMPRESA, token);
    exigir(primera.tokenDeSesion, "la primera abre");

    /* ⚠️ ESTE es el caso que justifica que la pantalla guarde el token de
       sesión. Si el front no lo guardara, una recarga dejaría a la persona
       fuera para siempre: su enlace ya no existe en la base. */
    const fallo = await loQueContesta(() => abrir(EMPRESA, token));
    exigir(fallo, "el token original tenía que dejar de valer en cuanto se abrió");
    exigir(fallo.estado === 401, `401, y llegó ${fallo?.estado}`);
  });

  caso("El token de sesión sí sigue abriendo, y no entrega otro", async () => {
    const { token } = await unEnlaceNuevo();
    const { tokenDeSesion } = await abrir(EMPRESA, token);

    const vuelta = await abrir(EMPRESA, tokenDeSesion);
    exigir(vuelta.nombre, "el de sesión abre igual");
    /* No se repite un secreto que el teléfono ya tiene guardado. */
    exigir(vuelta.tokenDeSesion === null,
      "en las vueltas siguientes NO se vuelve a mandar el token");
  });

  caso("⚠️ LAS CINCO FORMAS DE FALLAR CONTESTAN LO MISMO, carácter a carácter", async () => {
    const inventado = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";      // forma válida, no existe
    const malEscrito = "hola";                                  // ni forma tiene

    const { id, token: revocado } = await unEnlaceNuevo();
    await enlaces.revocar(id);

    const { token: canjeado } = await unEnlaceNuevo();
    await abrir(EMPRESA, canjeado);                             // se muere aquí

    const respuestas = {
      "no existe": await loQueContesta(() => abrir(EMPRESA, inventado)),
      "mal escrito": await loQueContesta(() => abrir(EMPRESA, malEscrito)),
      "revocado": await loQueContesta(() => abrir(EMPRESA, revocado)),
      "ya canjeado": await loQueContesta(() => abrir(EMPRESA, canjeado)),
      /* ⚠️ Una empresa que no existe NO da 404: eso sería un directorio de
         clientes de RENASER, y se podrían probar nombres. */
      "empresa que no existe": await loQueContesta(() => abrir("no-existe-esta", inventado)),
    };

    const patron = JSON.stringify(respuestas["no existe"]);
    exigir(respuestas["no existe"]?.estado === 401, "todas son 401");
    for (const [comoFalla, cual] of Object.entries(respuestas)) {
      exigir(cual, `«${comoFalla}» tenía que fallar y no falló`);
      exigir(JSON.stringify(cual) === patron,
        `«${comoFalla}» se distingue de las demás, y eso confirma que un token existió:\n` +
        `        esperado ${patron}\n        llegó    ${JSON.stringify(cual)}`);
    }
  });

  caso("Escribir sin haber abierto no se puede", async () => {
    const { token } = await unEnlaceNuevo();
    /* El token del enlace, sin canjear. No es un camino que exista en ninguna
       pantalla, y el backend lo cierra igualmente. */
    const fallo = await loQueContesta(() =>
      responder(EMPRESA, token, { reglaPractica: "algo" }));
    exigir(fallo?.estado === 401, `401, y llegó ${fallo?.estado}`);
  });

  caso("⚠️ Sin «qué haces tú» contesta 400 y NO 401 · el enlace sí valía", async () => {
    const { token } = await unEnlaceNuevo();
    const { tokenDeSesion } = await abrir(EMPRESA, token);

    const fallo = await loQueContesta(() =>
      responder(EMPRESA, tokenDeSesion, { situacion: "una situación, y nada más" }));

    /* Decirle «tu enlace no sirve» a alguien cuyo enlace SÍ sirve lo manda a
       pedir otro para nada. Por eso el backend separa los dos códigos, y por eso
       la pantalla no puede tratar todos los fallos como «pide uno nuevo». */
    exigir(fallo?.estado === 400, `400 y no 401, y llegó ${fallo?.estado}`);
    exigir(!fallo.titulo?.includes("enlace"),
      `el título no puede hablar del enlace: «${fallo.titulo}»`);
  });

  caso("Una respuesta entera se guarda, y la siguiente apertura la cuenta", async () => {
    const { token } = await unEnlaceNuevo();
    const { tokenDeSesion, yaRespondidas } = await abrir(EMPRESA, token);
    exigir(yaRespondidas === 0, "empieza en cero");

    await responder(EMPRESA, tokenDeSesion, {
      situacion: "Un proveedor no confirma el día antes del evento",
      senal: "No contesta el WhatsApp en toda la mañana",
      reglaPractica: "Llamo al teléfono fijo y si no, activo al suplente de la lista",
      errorFrecuente: "Esperar a la tarde por no molestar",
      escalamiento: "Si a las 2 no hay nadie, aviso a coordinación",
      documentado: false,
    });

    const vuelta = await abrir(EMPRESA, tokenDeSesion);
    exigir(vuelta.yaRespondidas === 1,
      `tenía que contar 1 y contó ${vuelta.yaRespondidas}`);
  });

  caso("⚠️ Los campos vacíos viajan como NULO, y esto se mira SIN servidor", () => {
    /* Se mira el cuerpo, no lo que quedó guardado: el backend hace `recortado()`
       y convierte `""` en nulo él solito, así que una comprobación por HTTP
       pasaría aunque esta capa mandase la cadena vacía. La estaría pasando el
       backend, no el código que dice comprobar. */
    const c = cuerpoDeRespuesta({
      reglaPractica: "  Lo resuelvo yo  ", senal: "   ", situacion: "",
    });
    exigir(c.reglaPractica === "Lo resuelvo yo", `recortado, y salió «${c.reglaPractica}»`);
    exigir(c.senal === null, `los espacios son nada, y salió ${JSON.stringify(c.senal)}`);
    exigir(c.situacion === null, `vacío es nulo, y salió ${JSON.stringify(c.situacion)}`);
    exigir(c.errorFrecuente === null, "lo que no se tecleó viaja, en nulo");
    exigir("escalamiento" in c, "los cinco campos van siempre, aunque vayan nulos");
    /* Omitir la casilla es `false`, no «no se sabe»: la columna tiene dos
       estados. Un `undefined` aquí rompería la petición entera — P15. */
    exigir(c.documentado === false, `sin marcar es false, y salió ${JSON.stringify(c.documentado)}`);
    exigir(cuerpoDeRespuesta({ documentado: true }).documentado === true, "y marcada, true");
  });

  caso("El enlace que se manda por WhatsApp lo construye una sola función", () => {
    const url = enlaceDe("acme", "UnTokenDeMentira", "https://os.renaser.pe");
    exigir(url === "https://os.renaser.pe/e/acme/UnTokenDeMentira", `salió «${url}»`);
  });
});

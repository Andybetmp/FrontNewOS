/* ============================================================================
   Fase 6 · La consola de RENASER, contra el backend de verdad.
   ----------------------------------------------------------------------------
   Es la única comprobación que corre con un token de EQUIPO. Las demás entran
   como un inquilino; ésta entra como quien ve a todos los clientes.

   ⚠️ NADA DE LO QUE HACE AQUÍ QUEDA SIN DESHACER
   ----------------------------------------------
   El alta de una empresa NO se comprueba automáticamente, y no por pereza: el
   perfil `local` del backend lleva un mapa fijo de puertos —`renaser: 5441`,
   `acme: 5442`—, así que no se puede inventar una empresa; y dar de alta no se
   puede deshacer, porque `cerrada` es terminal. Una comprobación que ensucia la
   base es una que se deja de correr a la tercera vez.

   Lo que sí se comprueba de las transiciones se hace sobre `acme` y **se
   restaura en un `finally`**, para que un fallo a mitad no deje al cliente
   suspendido y tumbe todo lo demás en la siguiente vuelta.
   ========================================================================= */

import { BACKEND, vista, exigir, tokenLocal } from "../comprobar/arnes.mjs";

globalThis.VITE_BACKEND_URL = BACKEND;

const { fijarProveedorDeToken } = await import("../nucleo/sesionLocal.js");

/** ⚠️ La unica vista que entra como el EQUIPO. Se declara abajo, en `vista`. */
const COMO_EL_EQUIPO = () => tokenLocal({ equipo: true });

const { empresas, planes, porQueNo, MOTIVO_MINIMO } = await import("./consola.js");
const { ErrorDelBackend } = await import("../nucleo/backend.js");

async function loQueContesta(fn) {
  try {
    await fn();
    return null;
  } catch (e) {
    exigir(e instanceof ErrorDelBackend, `tenia que fallar con un error del backend: ${e.message}`);
    return { estado: e.estado, titulo: e.titulo, detalle: e.detalle, generico: e.esGenerico };
  }
}

/**
 * La primera que haya.
 *
 * ⚠️ REVIENTA si no hay ninguna, en vez de devolver nulo. Seis casos dependen de
 * esto, y con un `return` silencioso los seis se darían por buenos contra una
 * base vacía: catorce verdes que no comprobaron nada. Que no haya con qué
 * comprobar es una noticia, no un aprobado.
 */
async function unaEmpresa() {
  const lista = await empresas.listar();
  if (!lista.length) {
    throw new Error(
      "No hay ninguna empresa dada de alta, asi que esto no comprueba nada. " +
      "Da de alta una desde la consola antes de correr esto.");
  }
  return lista[0];
}

vista("Fase 6 · Consola interna", (caso) => {

  caso("La consola lista TODAS las empresas, sin pasar por el enrutador", async () => {
    const lista = await empresas.listar();
    exigir(Array.isArray(lista), "tiene que ser una lista");
    /* ⚠️ Vacía es el estado NORMAL de una instalación recién puesta: la consola
       existe para dar de alta a la primera. No es un error y no se pinta así. */
    if (lista.length === 0) return;
    for (const c of ["clave", "nombre", "estado", "altaEl", "salud",
                     "saludComprobadaEl", "enrutandoAhora", "motivoSiNoEnruta"]) {
      exigir(c in lista[0], `la ficha tiene que traer ${c}`);
    }
  });

  caso("⚠️ La salud NUNCA viene sin su fecha al lado", async () => {
    const lista = await empresas.listar();
    for (const e of lista) {
      /* El backend lo dice literal: «un "al dia" sin cuando miente en cuanto
         pasa una hora, y quien lee la consola no tiene forma de saberlo». La
         única salud sin fecha admitida es la que dice que no hay instancia. */
      if (e.salud !== "sin_instancia") {
        /* ⚠️ Se mira el VALOR, no que exista la clave. Un `in` daría por bueno
           un `saludComprobadaEl: null`, que es exactamente el caso contra el
           que avisa el backend: la salud sin su fecha. */
        exigir(e.saludComprobadaEl != null,
          `«${e.clave}» dice salud «${e.salud}» y no trae cuándo se miró`);
        exigir(!Number.isNaN(new Date(e.saludComprobadaEl).getTime()),
          `«${e.clave}» trae una fecha que no es fecha: ${e.saludComprobadaEl}`);
      }
    }
    exigir(lista.length > 0, "sin ninguna empresa, esto no comprueba nada");
  });

  caso("⚠️ Lo que dice el plano y lo que enruta AHORA son dos campos, no uno", async () => {
    const e = await unaEmpresa();
    /* Hermano de D11. El backend: «lo que dice el plano de control y lo que hace
       el enrutador ahora mismo son dos cosas, y pueden diferir. Se enseñan las
       dos: QUE DIFIERAN ES EL DATO». Fundirlas en un semáforo borraría
       exactamente la información que hace útil esta pantalla. */
    exigir(typeof e.estado === "string", "el plano de control dice un estado");
    exigir(typeof e.enrutandoAhora === "boolean", "y el enrutador dice si conecta");
    exigir("motivoSiNoEnruta" in e, "y si no conecta, por qué");
  });

  caso("⚠️ La ficha NO lleva credenciales ni cadenas de conexión", async () => {
    const crudo = JSON.stringify(await empresas.listar());
    /* «Una pantalla que las enseña acaba con una de ellas pegada en un chat».
       Si el backend ampliara la ficha, esto lo caza antes que nadie. */
    for (const prohibido of ["referencia", "credencial", "clavePublica", "clave_publica",
                             "anon", "service", "urlApi", "url_api", "secret"]) {
      exigir(!crudo.includes(prohibido),
        `la consola sirve para operar, no para copiar conexiones: ${prohibido}`);
    }
  });

  caso("⚠️ Un token de INQUILINO no llega a /control", async () => {
    fijarProveedorDeToken(() => tokenLocal({ equipo: false }));
    try {
      const fallo = await loQueContesta(() => empresas.listar());
      exigir(fallo, "un inquilino no puede listar a todos los clientes");
      exigir(fallo.estado === 403 || fallo.estado === 401,
        `403 o 401, y llegó ${fallo.estado}`);
    } finally {
      /* El arnés lo restaura antes del siguiente caso de todas formas; esto
         deja el bloque honesto por sí solo, sin depender de eso. */
      fijarProveedorDeToken(COMO_EL_EQUIPO);
    }
  });

  caso("Una empresa que no existe da 404, y lo dice", async () => {
    const fallo = await loQueContesta(() => empresas.ver("no-existe-esta-empresa"));
    exigir(fallo?.estado === 404, `404, y llegó ${fallo?.estado}`);
    exigir(!fallo.generico, "explicado por la casa, no por el marco");
  });

  caso("⚠️ Una transición SIN motivo se rechaza nombrando el mínimo", async () => {
    const e = await unaEmpresa();
    const fallo = await loQueContesta(() => empresas.suspender(e.clave, "corto"));
    exigir(fallo, "«corto» no llega al mínimo y tenía que caer");
    exigir(fallo.estado === 400, `400, y llegó ${fallo.estado}`);
    exigir(String(fallo.detalle).includes(String(MOTIVO_MINIMO)),
      `tiene que decir cuántos caracteres hacen falta: «${fallo.detalle}»`);
  });

  caso("⚠️ Suspender y reactivar, de verdad, dejando la empresa como estaba", async () => {
    const e = await unaEmpresa();
    exigir(e.estado === "activa", `«${e.clave}» no está activa sino en «${e.estado}»`);

    let suspendida = null;
    try {
      suspendida = await empresas.suspender(e.clave,
        "Comprobacion automatica de la consola: se reactiva a continuacion.");
      exigir(suspendida.estado === "suspendida", `quedó en «${suspendida.estado}»`);
      /* ⚠️ Y el enrutador tiene que haberse enterado: suspender retira la
         conexión del catálogo. Si el estado cambiara y el enrutado no, el
         cliente seguiría entrando a una empresa suspendida. */
      exigir(suspendida.enrutandoAhora === false,
        "una empresa suspendida no puede seguir enrutando");
    } finally {
      if (suspendida) {
        const vuelta = await empresas.reactivar(e.clave,
          "Fin de la comprobacion automatica: se devuelve a activa.");
        exigir(vuelta.estado === "activa", `no se pudo restaurar: quedó en «${vuelta.estado}»`);
      }
    }
  });

  caso("Una transición que el estado no admite contesta 409, diciendo desde dónde sí", async () => {
    const e = await unaEmpresa();
    exigir(e.estado === "activa", `«${e.clave}» no está activa sino en «${e.estado}»`);
    /* Reactivar una empresa ACTIVA no cabe: solo desde provisionando o
       suspendida. Y el 409 tiene que decir desde cuáles, o manda a leer código. */
    const fallo = await loQueContesta(() => empresas.reactivar(e.clave,
      "Motivo suficientemente largo para pasar el minimo del servidor."));
    exigir(fallo?.estado === 409, `409, y llegó ${fallo?.estado}`);
    exigir(!fallo.generico, "con el motivo dentro: un fallo mudo es peor que un error");
  });

  caso("La historia de una empresa llega de lo más reciente a lo más viejo", async () => {
    const e = await unaEmpresa();
    const historia = await empresas.historia(e.clave);
    exigir(Array.isArray(historia), "tiene que ser una lista");
    if (historia.length === 0) return;
    for (const c of ["que", "ocurrioEl", "quien", "motivo"]) {
      exigir(c in historia[0], `cada anotación tiene que traer ${c}`);
    }
    const fechas = historia.map((a) => new Date(a.ocurrioEl).getTime());
    exigir(fechas.every((f, i) => i === 0 || fechas[i - 1] >= f),
      "de lo más reciente a lo más viejo, que es como se lee una historia");
  });

  caso("Los planes se listan y se crean", async () => {
    const antes = await planes.listar();
    exigir(Array.isArray(antes), "tiene que ser una lista");

    /* Clave única por vuelta: reutilizarla haría que la segunda vuelta
       comprobara otra cosa distinta que la primera.

       ⚠️ Y SE BORRA AL TERMINAR, en un `finally`. Hasta el 17-09 no se podía
       —no había endpoint— y la suite dejaba un plan por vuelta: se llegó a 21,
       y el desplegable del alta era un montón de escombros indistinguibles.
       Esa basura es lo que motivó el borrado, así que lo menos que puede hacer
       esta comprobación es no volver a generarla. */
    const clave = `p${Date.now()}`;
    try {
      const creado = await planes.crear({
        clave, nombre: "ZZ comprobacion automatica", limitePersonas: 25,
      });
      exigir(creado.clave === clave, "devuelve la ficha del plan creado");
      exigir(creado.limitePersonas === 25, "con su límite");

      const visto = await planes.ver(clave);
      exigir(visto.nombre === "ZZ comprobacion automatica", "y se puede leer después");
    } finally {
      /* Aunque el caso falle a mitad: un fallo no es excusa para ensuciar. */
      await planes.borrar(clave).catch(() => {});
    }
  });

  caso("Un plan sin empresas se borra, y deja de listarse", async () => {
    const clave = `b${Date.now()}`;
    await planes.crear({ clave, nombre: "ZZ para borrar", limitePersonas: 3 });
    await planes.borrar(clave);

    const fallo = await loQueContesta(() => planes.ver(clave));
    exigir(fallo?.estado === 404, `tras borrarlo, 404 · llegó ${fallo?.estado}`);
    const lista = await planes.listar();
    exigir(!lista.some((p) => p.clave === clave), "y ya no sale en la lista");
  });

  caso("⚠️ Un plan CON empresas no se borra, y el 409 dice CUÁNTAS", async () => {
    /* La empresa que hay cuelga de algún plan: ése es el que no se puede borrar.
       Se busca en vez de suponer que se llama «piloto». */
    const e = await unaEmpresa();
    exigir(e.clave, "hay una empresa con la que probar");

    /* Se prueban todos los planes: el que tenga empresas tiene que dar 409.
       Si NINGUNO diera 409, este caso no habría comprobado nada — y eso se dice. */
    let hubo409 = false;
    for (const p of await planes.listar()) {
      const fallo = await loQueContesta(() => planes.borrar(p.clave));
      if (fallo?.estado === 409) {
        hubo409 = true;
        exigir(/\d+ empresas?/.test(String(fallo.detalle)),
          `tiene que decir cuántas lo impiden: «${fallo.detalle}»`);
        exigir(!fallo.generico, "con la voz de la casa");
      }
    }
    exigir(hubo409, "ningún plan estaba contratado, así que esto no comprobó nada");
  });

  caso("Borrar un plan que no existe da 404, no un 204 mudo", async () => {
    const fallo = await loQueContesta(() => planes.borrar("no-existe-este-plan"));
    /* Un 204 aquí diría «hecho» a quien se equivocó de clave. Es el mismo fallo
       que se arregló el 15-sep en los enlaces de equipo. */
    exigir(fallo?.estado === 404, `404, y llegó ${fallo?.estado}`);
  });

  caso("⚠️ Un plan con límite CERO se rechaza · nulo es «sin límite»", async () => {
    const fallo = await loQueContesta(() => planes.crear({
      clave: `c${Date.now()}`, nombre: "Con cero", limitePersonas: 0,
    }));
    /* Tercer sitio de este proyecto donde nulo y cero no son lo mismo, y aquí
       la diferencia cuesta dinero: nulo es «sin límite», cero sería «no cabe
       nadie». El backend rechaza el cero para que nadie escriba uno creyendo
       que dice lo primero. */
    exigir(fallo?.estado === 400, `400, y llegó ${fallo?.estado}`);
    exigir(String(fallo.detalle).toLowerCase().includes("limite"),
      `diciendo de qué campo habla: «${fallo.detalle}»`);
  });

  caso("Una clave de plan mal formada se explica, no revienta", async () => {
    const fallo = await loQueContesta(() => planes.crear({
      clave: "Con Mayusculas Y Espacios", nombre: "No vale", limitePersonas: null,
    }));
    exigir(fallo?.estado === 400, `400, y llegó ${fallo?.estado}`);
    exigir(!fallo.generico, "con la voz de la casa");
  });

  caso("⚠️ Qué transiciones caben lo dice la FICHA, no una tabla de aquí", async () => {
    const e = await unaEmpresa();
    exigir(Array.isArray(e.transiciones), "la ficha tiene que traer las transiciones");
    /* Las TRES siempre, quepan o no: con solo las que caben, la pantalla tendría
       que inventarse qué decir de las que faltan — y lo que se inventaría es una
       copia de la regla del backend, que es justo lo que esto vino a quitar. */
    exigir(e.transiciones.length === 3, `las tres siempre, y llegaron ${e.transiciones.length}`);

    for (const t of e.transiciones) {
      exigir(typeof t.cual === "string", "cada una dice cuál es");
      exigir(typeof t.cabe === "boolean", "y si cabe ahora");
      exigir(Array.isArray(t.desde) && t.desde.length > 0,
        `«${t.cual}» tiene que decir desde qué estados se permite`);
    }
    /* ⚠️ `cual` es también el segmento de la URL. Si dejaran de coincidir, la
       pantalla construiría direcciones que no existen. */
    const nombres = e.transiciones.map((t) => t.cual).sort().join(",");
    exigir(nombres === "cierre,reactivacion,suspension", `llegaron: ${nombres}`);
  });

  caso("⚠️ Lo que la ficha anuncia coincide con lo que el servidor acepta", async () => {
    const e = await unaEmpresa();
    /* Se intenta de verdad una que la ficha da por IMPOSIBLE. Si el backend la
       aceptara, la pantalla estaría escondiendo algo que sí se podía — y eso no
       lo nota nadie hasta que un cliente se queda sin poder reactivarse. */
    const imposible = e.transiciones.find((t) => !t.cabe);
    exigir(imposible, `«${e.clave}» está en «${e.estado}» y dice que todo cabe`);

    const fallo = await loQueContesta(() =>
      empresas[({ suspension: "suspender", reactivacion: "reactivar", cierre: "cerrar" })[imposible.cual]](
        e.clave, "Comprobacion de que lo anunciado coincide con lo aceptado."));
    exigir(fallo?.estado === 409,
      `la ficha dice que «${imposible.cual}» no cabe, y el servidor contestó ${fallo?.estado}`);
  });

  caso("«Es definitivo» se DEDUCE de que ninguna quepa, no está escrito", () => {
    /* Sin servidor, sobre datos con la forma que manda el backend. En el front
       no hay ningún sitio donde ponga que `cerrada` es terminal: se ve. */
    const cerrada = [
      { cual: "suspension", cabe: false, desde: ["activa"] },
      { cual: "reactivacion", cabe: false, desde: ["provisionando", "suspendida"] },
      { cual: "cierre", cabe: false, desde: ["activa", "suspendida"] },
    ];
    exigir(String(porQueNo(cerrada[0], "cerrada", cerrada)).includes("definitivo"),
      "sin ninguna posible, se dice que es definitivo");

    const activa = [
      { cual: "suspension", cabe: true, desde: ["activa"] },
      { cual: "reactivacion", cabe: false, desde: ["provisionando", "suspendida"] },
      { cual: "cierre", cabe: true, desde: ["activa", "suspendida"] },
    ];
    exigir(porQueNo(activa[0], "activa", activa) === null,
      "cuando sí se puede, no hay excusa que dar");
    const excusa = porQueNo(activa[1], "activa", activa);
    exigir(!excusa.includes("definitivo"), "con otras posibles, NO es definitivo");
    /* La lista `desde` viene del backend: es la misma que sale en su 409. */
    exigir(excusa.includes("provisionando") && excusa.includes("suspendida"),
      `tiene que decir desde dónde sí: «${excusa}»`);
  });

}, { comoQuien: COMO_EL_EQUIPO });

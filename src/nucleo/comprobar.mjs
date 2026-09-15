#!/usr/bin/env node
/* ============================================================================
   Comprobación del núcleo de v2 · CONTRA EL BACKEND DE VERDAD
   ----------------------------------------------------------------------------
   Este repositorio no tiene runner de pruebas unitarias: tiene Playwright para
   el extremo a extremo y guiones de Node para lo demás (revisar-props,
   revisar-libres, medir). Esto es de los segundos.

   ⚠️ NO HAY NINGÚN DOBLE AQUÍ, Y ES EL PUNTO
   ------------------------------------------
   Lo que este núcleo tiene que acertar es la FORMA de lo que contesta el
   backend: qué campos trae un destino, cómo viaja un error explicado, y qué
   pasa cuando la respuesta NO viene de un manejador de la casa. Un doble que
   devuelve lo que se le pide no comprueba nada de eso — comprueba que el
   código llama al código.

   Así que habla con el backend local. Si no está levantado, lo dice y no
   finge que pasó.

       docker compose up -d      (en el repositorio del backend)
       ./mvnw spring-boot:run -Dspring-boot.run.profiles=local
       npm run comprobar

   ⚠️ AQUÍ SÍ SE HABLA DIRECTO AL 8090, Y EN EL NAVEGADOR NO
   ---------------------------------------------------------
   Esto es Node: no hay política de origen cruzado que valga, así que llama al
   backend directamente. El navegador no puede hacerlo —el backend no tiene
   CORS— y por eso allí todo pasa por el proxy de Vite. Son dos caminos para la
   misma casa, y conviene saber cuál se está mirando.

   ⚠️ Y NO HACE FALTA NINGÚN TOKEN
   -------------------------------
   Los tres casos de error usan rutas PÚBLICAS que ya contestan con la voz de
   la casa. Pedir un secreto para comprobar esto habría hecho que nadie lo
   corriera.
   ========================================================================= */

globalThis.VITE_BACKEND_URL = process.env.BACKEND ?? "http://localhost:8090";

const { resolverInstancia, NoSeSabeDondeVive } = await import("./instancia.js");
const { pedirAlBackend, ErrorDelBackend, urlDelBackend } = await import("./backend.js");
const { queEnsenar, quienFirma, QUE_ENSENAR } = await import("./sesion.js");

let fallos = 0;
const casos = [];

function caso(nombre, fn) {
  casos.push([nombre, fn]);
}

function exigir(condicion, queSeEsperaba) {
  if (!condicion) {
    throw new Error(queSeEsperaba);
  }
}

/** Un JWT de mentira. Solo se decodifica: aquí nadie verifica ninguna firma. */
function tokenCon(reclamaciones) {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  return `${b64({ alg: "none" })}.${b64(reclamaciones)}.firma-que-nadie-mira`;
}

// ---- A · dónde vive una empresa -------------------------------------------

caso("A1 · Un destino trae los CUATRO campos, o no vale", async () => {
  const destino = await resolverInstancia("acme");
  for (const campo of ["clave", "nombre", "urlApi", "clavePublica"]) {
    exigir(destino[campo], `el destino tiene que traer ${campo}`);
  }
  exigir(destino.clave === "acme", "y tiene que ser el de la empresa que se pidió");
});

caso("A2 · Una empresa que no existe lo dice, y dice cuál", async () => {
  try {
    await resolverInstancia("no-existe-esta-empresa");
    throw new Error("tenía que haber reventado");
  } catch (e) {
    exigir(e instanceof NoSeSabeDondeVive, "con su propio error, no uno cualquiera");
    exigir(e.message.includes("no-existe-esta-empresa"), "nombrando la clave que se pidió");
  }
});

caso("A3 · ⚠️ Sin clave no se resuelve «la que sea»", async () => {
  try {
    await resolverInstancia("  ");
    throw new Error("tenía que haber reventado");
  } catch (e) {
    exigir(e instanceof NoSeSabeDondeVive, "conectarse «a la que sea» es servirle a alguien los datos de otro");
  }
});

caso("A4 · ⚠️ Un destino a MEDIAS no vale, y dice qué falta", async () => {
  /* ⚠️ El backend de verdad siempre trae los cuatro, así que esta guarda no se
     ejercitaría nunca contra él — y una guarda que no se ejercita es una que
     alguien quita el día que estorba. Se le pone delante un servidor mínimo que
     contesta a medias, que es lo que pasaría con un backend más viejo o con un
     proxy que recorta. */
  const { createServer } = await import("node:http");
  const servidor = createServer((_, res) => {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ clave: "acme", nombre: "Acme S.A.C." })); // sin urlApi ni clavePublica
  });
  await new Promise((listo) => servidor.listen(0, listo));
  const antes = globalThis.VITE_BACKEND_URL;
  globalThis.VITE_BACKEND_URL = `http://localhost:${servidor.address().port}`;
  try {
    await resolverInstancia("acme");
    throw new Error("un destino sin URL ni llave tenía que reventar");
  } catch (e) {
    exigir(e instanceof NoSeSabeDondeVive, "con su propio error");
    exigir(e.message.includes("urlApi") && e.message.includes("clavePublica"),
      "y nombrando los dos que faltan, no «faltan campos»");
  } finally {
    globalThis.VITE_BACKEND_URL = antes;
    servidor.close();
  }
});

// ---- B · los mensajes de la casa llegan enteros ----------------------------

caso("B1 · ⚠️ El título y el detalle se conservan TAL CUAL", async () => {
  try {
    await pedirAlBackend("/publico/manychat/acme", { metodo: "POST", cuerpo: { id: "1" } });
    throw new Error("esa ruta tenía que fallar sin llave configurada");
  } catch (e) {
    exigir(e instanceof ErrorDelBackend, "tiene que ser un error del backend");
    exigir(e.titulo && e.titulo.length > 0, "el título va al titular del aviso");
    exigir(e.detalle && e.detalle.length > 0, "y el detalle al cuerpo");
    exigir(!e.esGenerico, "esto SÍ lo contestó un manejador de la casa");
  }
});

caso("B2 · ⚠️ Cuando NO hay título, no se fabrica uno", async () => {
  try {
    /* Segmento vacío: lo rechaza el marco antes del despacho. El cuerpo es el
       genérico del contenedor, sin title ni detail. */
    await pedirAlBackend("/eventos//fases");
    throw new Error("tenía que fallar");
  } catch (e) {
    exigir(e instanceof ErrorDelBackend, "sigue siendo un error del backend");
    exigir(e.esGenerico, "y hay que saber que NO lo contestó la casa");
    exigir(e.titulo === null && e.detalle === null, "rellenar el hueco sería fingir que contestó");
    exigir(e.estado === 400, "lo que sí se sabe es el código, y ese se dice");
  }
});

caso("B3 · Una ruta protegida sin token da 401, y se nota", async () => {
  try {
    await pedirAlBackend("/eventos");
    throw new Error("sin token no tenía que pasar");
  } catch (e) {
    exigir(e.estado === 401, `se esperaba 401 y vino ${e.estado}`);
  }
});

// ---- C · qué navegación se pinta ------------------------------------------

caso("C1 · El token del equipo abre la consola", () => {
  exigir(queEnsenar(tokenCon({ equipo: "renaser" })) === QUE_ENSENAR.consola,
    "con equipo:renaser se pinta la consola");
});

caso("C2 · El de una empresa abre la aplicación del cliente", () => {
  exigir(queEnsenar(tokenCon({ empresa: "acme" })) === QUE_ENSENAR.cliente,
    "sin equipo:renaser se pinta la del cliente");
});

caso("C3 · ⚠️ Sin token no se pinta la del cliente «por si acaso»", () => {
  exigir(queEnsenar(null) === QUE_ENSENAR.nada,
    "un menú sin sesión es una promesa que cada pulsación incumple");
  exigir(queEnsenar("esto-no-es-un-jwt") === QUE_ENSENAR.nada,
    "y un token ilegible tampoco vale");
});

caso("C4 · ⚠️ Un `sub` que no es identificador devuelve nulo, no un invento", () => {
  exigir(quienFirma(tokenCon({ sub: "no-soy-un-uuid" })) === null,
    "inventarlo haría que el error del backend llegara más tarde y peor explicado");
  const bueno = "11111111-1111-1111-1111-111111111111";
  exigir(quienFirma(tokenCon({ sub: bueno })) === bueno, "y el bueno pasa entero");
});

// ---- correr ----------------------------------------------------------------

console.log(`\n  Núcleo v2 contra ${urlDelBackend()}\n`);
try {
  await fetch(`${urlDelBackend()}/actuator/health`);
} catch {
  console.error(`  ✘ El backend no contesta en ${urlDelBackend()}.\n` +
    `    Levántalo antes: ./mvnw spring-boot:run -Dspring-boot.run.profiles=local\n`);
  process.exit(2);
}

for (const [nombre, fn] of casos) {
  try {
    await fn();
    console.log(`  ✔ ${nombre}`);
  } catch (e) {
    fallos++;
    console.log(`  ✘ ${nombre}\n      ${e.message}`);
  }
}
console.log(`\n  ${casos.length - fallos} de ${casos.length}${fallos ? ` · ${fallos} FALLOS` : ""}\n`);
process.exit(fallos ? 1 : 0);

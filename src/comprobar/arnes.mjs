/* ============================================================================
   El arnés de las comprobaciones.
   ----------------------------------------------------------------------------
   Cada vista trae su propio fichero `*.comprobar.mjs` junto a su capa de datos,
   y todos usan esto. Así «validar todas las vistas contra el backend» no es una
   intención: es un comando que crece solo al añadir una vista.
   ========================================================================= */

import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { fijarProveedorDeToken } from "../nucleo/sesionLocal.js";

/** El backend de verdad. En Node se le habla directo: no hay CORS que valga. */
export const BACKEND = process.env.BACKEND ?? "http://localhost:8090";

/** Lee el `.env` sin dependencias: solo hacen falta dos o tres valores. */
function delEnv(nombre) {
  if (process.env[nombre]) return process.env[nombre];
  try {
    const linea = readFileSync(".env", "utf8")
      .split("\n").find((l) => l.startsWith(`${nombre}=`));
    return linea ? linea.slice(nombre.length + 1).trim() : null;
  } catch {
    return null;
  }
}

export const EMPRESA = delEnv("VITE_EMPRESA") ?? "acme";

/**
 * Un token firmado con la clave del perfil local del backend.
 *
 * ⚠️ Aquí SÍ se firma en Node, al revés que en el navegador. La diferencia no
 * es de comodidad: en el navegador la clave viajaría dentro del paquete que
 * cualquiera descarga; aquí no sale de esta máquina.
 */
export function tokenLocal({ sub = "11111111-1111-1111-1111-111111111111", equipo = false } = {}) {
  const clave = delEnv("CLAVE_LOCAL");
  if (!clave) {
    throw new Error(
      "Falta CLAVE_LOCAL en el .env. Se copia del perfil `local` del application.yml " +
      "del backend, donde está a la vista y con su aviso. Ver .env.ejemplo."
    );
  }
  const ahora = Math.floor(Date.now() / 1000);
  const cuerpo = equipo
    ? { sub, equipo: "renaser", iat: ahora, exp: ahora + 3600 }
    : { sub, empresa: EMPRESA, iat: ahora, exp: ahora + 3600 };
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const cab = b64({ alg: "HS256", typ: "JWT" });
  const car = b64(cuerpo);
  return `${cab}.${car}.${createHmac("sha256", clave).update(`${cab}.${car}`).digest("base64url")}`;
}

const grupos = [];

/**
 * Declara el bloque de una vista.
 *
 * ⚠️ `comoQuien` DICE CON QUE IDENTIDAD CORRE ESTE BLOQUE, Y NO ES DECORACION
 * ---------------------------------------------------------------------------
 * Hasta la fase 6 cada fichero llamaba a `fijarProveedorDeToken` al cargarse, y
 * funcionaba por casualidad: los siete ponian el mismo tipo de token.
 *
 * Pero eso es estado global ESCRITO AL CARGAR y LEIDO AL CORRER, y los modulos
 * cargan todos antes de que corra ningun caso. O sea que mandaba el ultimo que
 * escribiera. La consola fue la primera en pedir un token distinto —de equipo,
 * sin empresa— y dejo a las otras siete hablando con el suyo: 33 fallos en
 * fases que nadie habia tocado, todos con «peticion sin empresa resuelta».
 *
 * Ahora la identidad es parte de la DECLARACION del bloque y se vuelve a fijar
 * antes de cada caso. Un fichero no puede pisar a otro aunque quiera, y quien
 * lea cualquiera de ellos ve con quien entra sin tener que adivinarlo.
 */
export function vista(nombre, declarar, { comoQuien = () => tokenLocal() } = {}) {
  const casos = [];
  declarar((titulo, fn) => casos.push([titulo, fn]));
  grupos.push([nombre, casos, comoQuien]);
}

export function exigir(condicion, queSeEsperaba) {
  if (!condicion) {
    throw new Error(queSeEsperaba);
  }
}

/** Corre todo lo declarado. Devuelve cuántos fallaron. */
export async function correr() {
  console.log(`\n  Contra ${BACKEND} · empresa «${EMPRESA}»`);
  let fallos = 0;
  let total = 0;

  try {
    const r = await fetch(`${BACKEND}/actuator/health`);
    if (!r.ok) throw new Error(String(r.status));
  } catch {
    console.error(
      `\n  ✘ El backend no contesta en ${BACKEND}.\n` +
      `    Levántalo antes:\n` +
      `      docker compose up -d\n` +
      `      ./mvnw spring-boot:run -Dspring-boot.run.profiles=local\n`
    );
    process.exit(2);
  }

  for (const [nombre, casos, comoQuien] of grupos) {
    console.log(`\n  ${nombre}`);
    for (const [titulo, fn] of casos) {
      total++;
      /* Antes de CADA caso, no una vez por bloque: un caso que cambie de
         identidad a proposito —el que comprueba que un inquilino no entra en
         /control— no puede dejar al siguiente hablando con su token. */
      fijarProveedorDeToken(comoQuien);
      try {
        await fn();
        console.log(`    ✔ ${titulo}`);
      } catch (e) {
        fallos++;
        console.log(`    ✘ ${titulo}\n        ${e.message}`);
      }
    }
  }

  console.log(`\n  ${total - fallos} de ${total}${fallos ? ` · ${fallos} FALLOS` : ""}\n`);
  return fallos;
}

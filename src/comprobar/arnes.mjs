/* ============================================================================
   El arnés de las comprobaciones.
   ----------------------------------------------------------------------------
   Cada vista trae su propio fichero `*.comprobar.mjs` junto a su capa de datos,
   y todos usan esto. Así «validar todas las vistas contra el backend» no es una
   intención: es un comando que crece solo al añadir una vista.
   ========================================================================= */

import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";

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

/** Declara el bloque de una vista. El nombre sale en el informe. */
export function vista(nombre, declarar) {
  const casos = [];
  declarar((titulo, fn) => casos.push([titulo, fn]));
  grupos.push([nombre, casos]);
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

  for (const [nombre, casos] of grupos) {
    console.log(`\n  ${nombre}`);
    for (const [titulo, fn] of casos) {
      total++;
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

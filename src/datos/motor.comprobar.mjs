/* ============================================================================
   Fase 4 · El motor de IA, contra el backend de verdad.
   ----------------------------------------------------------------------------
   ⚠️ NINGÚN CASO DE AQUÍ GASTA UN CÉNTIMO, Y ESO ES DELIBERADO
   ------------------------------------------------------------
   Una suite que llamara de verdad al proveedor costaría dinero cada vez que
   alguien la corre — y la correría cada vez menos gente hasta que nadie.

   Lo que se comprueba es lo que se puede comprobar sin pagar: que la pantalla
   ofrece la corrida en seco, que el 409 de «esta empresa no tiene IA» llega
   explicado, y que el freno contesta lo suyo. Lo que hay detrás de la llamada
   ya lo prueban las 411 pruebas del backend, con servidores de mentira.
   ========================================================================= */

import { BACKEND, vista, exigir, tokenLocal } from "../comprobar/arnes.mjs";

globalThis.VITE_BACKEND_URL = BACKEND;

const { fijarProveedorDeToken } = await import("../nucleo/sesionLocal.js");
fijarProveedorDeToken(() => tokenLocal());

const { motor, OPERACIONES } = await import("./motor.js");
const { ErrorDelBackend } = await import("../nucleo/backend.js");

/** Las cuatro contestan igual hoy: acme no tiene credenciales de IA. */
async function seExplicaSinGastar(llamada) {
  try {
    await llamada();
    /* Si algún día acme SÍ tiene credenciales, esto pasaría de largo. No es un
       fallo del caso: es que el escenario cambió, y entonces el caso de abajo
       —el del seco— es el que sigue valiendo. */
    return null;
  } catch (e) {
    exigir(e instanceof ErrorDelBackend, "tiene que ser un error del backend");
    exigir(!e.esGenerico, "explicado, no el cuerpo genérico del contenedor");
    return e;
  }
}

vista("Fase 4 · Motor de IA", (caso) => {

  caso("⚠️ Sin IA configurada, las CUATRO se explican con 409 · no con 500", async () => {
    /* Hasta el 15 de septiembre de 2026, cuatro de las cinco contestaban 500
       con el cuerpo genérico. La misma decisión estaba escrita tres veces y
       solo una tenía manejador. Este caso vigila que no vuelva a separarse. */
    for (const llamada of [
      () => motor.diagnosticar({ seco: true }),
      () => motor.planificar({ seco: true }),
      () => motor.redactar({ encargo: "una campaña para el congreso de septiembre", seco: true }),
      () => motor.ilustrar({ campana: "11111111-2222-3333-4444-555555555555", seco: true }),
    ]) {
      const e = await seExplicaSinGastar(llamada);
      if (e === null) continue; // la empresa ya tiene IA: otro escenario
      exigir(e.estado === 409, `se esperaba 409 y vino ${e.estado}`);
      exigir(e.titulo === "Esta empresa no tiene IA configurada", `título inesperado: ${e.titulo}`);
    }
  });

  caso("⚠️ La corrida en seco viaja SIEMPRE en la petición", async () => {
    /* No se comprueba llamando —eso costaría— sino mirando lo que la capa de
       datos construye. Que `seco` se olvidara sería gastar sin pedirlo. */
    const pedidas = [];
    const original = globalThis.fetch;
    globalThis.fetch = async (url, ...resto) => {
      pedidas.push(String(url));
      return original(url, ...resto);
    };
    try {
      await motor.diagnosticar({ seco: true }).catch(() => {});
      await motor.planificar({ seco: true }).catch(() => {});
      await motor.redactar({ encargo: "x", seco: true }).catch(() => {});
      await motor.ilustrar({ campana: "x", seco: true }).catch(() => {});
    } finally {
      globalThis.fetch = original;
    }
    const conSeco = pedidas.filter((u) => u.includes("seco=true"));
    exigir(conSeco.length === 4, `las cuatro tienen que llevar seco=true, llevaron ${conSeco.length}`);
  });

  caso("⚠️ Y una corrida de VERDAD lo dice en la URL, no por omisión", async () => {
    const pedidas = [];
    const original = globalThis.fetch;
    globalThis.fetch = async (url, ...resto) => { pedidas.push(String(url)); return original(url, ...resto); };
    try {
      await motor.diagnosticar({ seco: false }).catch(() => {});
    } finally {
      globalThis.fetch = original;
    }
    exigir(pedidas[0].includes("seco=false"),
      "gastar tiene que ser explícito en la petición, no el valor que queda cuando nadie dice nada");
  });

  caso("Cada operación dice qué hace y qué necesita antes de correr", () => {
    exigir(OPERACIONES.length === 4, "son cuatro");
    for (const o of OPERACIONES) {
      exigir(o.queHace && o.queHace.length > 20, `${o.id} tiene que decir qué hace`);
      exigir(o.exige && o.exige.length > 20, `${o.id} tiene que decir qué necesita`);
    }
  });
});

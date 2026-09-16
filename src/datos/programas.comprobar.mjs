/* ============================================================================
   Fase 3 · Programas, contra el backend de verdad.
   ----------------------------------------------------------------------------
   El caso que justifica la suite es D11: que lo declarado y lo cobrado sigan
   llegando por separado. El día que el backend los fundiera en un solo número,
   la pantalla lo estaría pintando sin saberlo y nadie se enteraría hasta que
   alguien preguntara por un patrocinio que no aparece.
   ========================================================================= */

import { BACKEND, vista, exigir, tokenLocal } from "../comprobar/arnes.mjs";

globalThis.VITE_BACKEND_URL = BACKEND;

const { fijarProveedorDeToken } = await import("../nucleo/sesionLocal.js");
fijarProveedorDeToken(() => tokenLocal());

const { programas, inscripciones, pagos, exigeTasa } = await import("./programas.js");
const { ErrorDelBackend } = await import("../nucleo/backend.js");

vista("Fase 3 · Programas", (caso) => {

  caso("⚠️ D11 · lo declarado y lo cobrado llegan POR SEPARADO", async () => {
    const hecho = await programas.crear({
      nombre: `D11 ${Date.now()}`, tipo: "formacion", ingresosDeclarados: 15000,
    });
    exigir("ingresosDeclarados" in hecho, "tiene que venir lo declarado");
    exigir("cobradoSoles" in hecho, "y lo cobrado, que es otra cosa");
    exigir(Number(hecho.ingresosDeclarados) === 15000, "lo declarado es lo que se declaró");
    exigir(Number(hecho.cobradoSoles) === 0, "y sin pagos, lo cobrado es cero de verdad");
    /* Que difieran es el dato. Si algún día viniera uno solo, la pantalla
       estaría mintiendo sin saberlo. */
  });

  caso("⚠️ Lo NO declarado llega NULO, no cero", async () => {
    const hecho = await programas.crear({ nombre: `Sin declarar ${Date.now()}`, tipo: "formacion" });
    exigir(hecho.egresosDeclarados === null,
      `nadie declaró egresos, así que tiene que venir nulo y vino ${hecho.egresosDeclarados}`);
    /* ⚠️ Y cobradoSoles SÍ es cero, porque cero pagos suman cero de verdad.
       Son dos ausencias distintas y la pantalla las pinta distinto. */
    exigir(Number(hecho.cobradoSoles) === 0, "lo cobrado sí es un cero medido");
  });

  caso("Un pago mueve lo cobrado, y no toca lo declarado", async () => {
    const p = await programas.crear({
      nombre: `Con pago ${Date.now()}`, tipo: "formacion", ingresosDeclarados: 900,
    });
    const cliente = await inscripciones.crear({
      nombre: "Cliente de comprobación", programa: p.id, ingresoEl: "2026-09-01",
    });
    await pagos.registrar({
      clienteDePrograma: cliente.id, monto: 300, moneda: "PEN",
      pagadoEl: "2026-09-02", modalidad: "contado", medio: "transferencia",
    });
    const tras = await programas.ver(p.id);
    exigir(Number(tras.cobradoSoles) === 300, `lo cobrado tenía que ser 300 y es ${tras.cobradoSoles}`);
    exigir(Number(tras.ingresosDeclarados) === 900, "y lo declarado no lo toca nadie automáticamente");
    exigir(tras.clientes === 1 && tras.pagos === 1, "y los recuentos siguen");
  });

  caso("⚠️ Un pago sin cliente se EXPLICA · era un 500 hasta el 15-sep", async () => {
    try {
      await pagos.registrar({
        monto: 300, moneda: "PEN", pagadoEl: "2026-09-02",
        modalidad: "contado", medio: "transferencia",
      });
      throw new Error("sin cliente tenía que fallar");
    } catch (e) {
      exigir(e instanceof ErrorDelBackend, "tiene que ser un error del backend");
      exigir(e.estado === 400, `y un 400, no un 500. Vino ${e.estado}`);
      exigir(!e.esGenerico, "con título y detalle escritos");
    }
  });

  caso("⚠️ Un pago en USD SIN tasa se rechaza: no se sabe cuánto entró en soles", async () => {
    exigir(exigeTasa("USD") && !exigeTasa("PEN"), "la regla de la tasa es de la moneda");
    const p = await programas.crear({ nombre: `USD ${Date.now()}`, tipo: "formacion" });
    const cliente = await inscripciones.crear({
      nombre: "Paga en dólares", programa: p.id, ingresoEl: "2026-09-01",
    });
    try {
      await pagos.registrar({
        clienteDePrograma: cliente.id, monto: 100, moneda: "USD", tasaCambio: null,
        pagadoEl: "2026-09-02", modalidad: "contado", medio: "transferencia",
      });
      throw new Error("USD sin tasa tenía que fallar");
    } catch (e) {
      exigir(e instanceof ErrorDelBackend && !e.esGenerico, "explicado, no genérico");
      exigir(e.detalle.toLowerCase().includes("tasa"), "y hablando de la tasa");
    }
  });

  caso("⚠️ Una inscripción SIN día de ingreso se rechaza", async () => {
    const p = await programas.crear({ nombre: `Sin fecha ${Date.now()}`, tipo: "formacion" });
    try {
      await inscripciones.crear({ nombre: "Sin fecha", programa: p.id });
      throw new Error("sin ingresoEl tenía que fallar");
    } catch (e) {
      exigir(e instanceof ErrorDelBackend && !e.esGenerico, "explicado");
      /* De él cuelga el día de programa de cada persona y cualquier cálculo de
         atraso: sin él no se puede decir nada sobre su avance. */
      exigir(e.detalle.toLowerCase().includes("ingreso"), "y diciendo qué falta");
    }
  });

  caso("El recibo devuelve el importe EN SOLES, que es el que cuenta", async () => {
    const p = await programas.crear({ nombre: `Recibo ${Date.now()}`, tipo: "formacion" });
    const cliente = await inscripciones.crear({
      nombre: "Con recibo", programa: p.id, ingresoEl: "2026-09-01",
    });
    await pagos.registrar({
      clienteDePrograma: cliente.id, monto: 100, moneda: "USD", tasaCambio: 3.8,
      pagadoEl: "2026-09-02", modalidad: "contado", medio: "transferencia",
    });
    const recibos = await pagos.deUnCliente(cliente.id);
    exigir(recibos.length === 1, "tiene que haber un recibo");
    exigir("montoSoles" in recibos[0], "el recibo trae el importe en soles");
    exigir(Number(recibos[0].montoSoles) === 380,
      `100 USD a 3,8 son 380 soles, y vino ${recibos[0].montoSoles}`);
  });
});

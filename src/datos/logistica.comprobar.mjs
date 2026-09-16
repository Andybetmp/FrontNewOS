/* ============================================================================
   Fase 1 · Logística, contra el backend de verdad.
   ----------------------------------------------------------------------------
   Lo que se comprueba aquí no es que el código llame al código: es que la FORMA
   de lo que contesta el backend sigue siendo la que la pantalla espera. Si
   mañana `FichaDeProveedor` pierde un campo o `recontratar` deja de admitir
   nulo, esto cae antes de que nadie abra el navegador.
   ========================================================================= */

import { BACKEND, vista, exigir, tokenLocal } from "../comprobar/arnes.mjs";

globalThis.VITE_BACKEND_URL = BACKEND;

const { fijarProveedorDeToken } = await import("../nucleo/sesionLocal.js");
fijarProveedorDeToken(() => tokenLocal());

const { lugares, proveedores, CAMPOS_LUGAR, CAMPOS_PROVEEDOR } = await import("./logistica.js");
const { ErrorDelBackend } = await import("../nucleo/backend.js");

vista("Fase 1 · Logística", (caso) => {

  caso("Los lugares llegan con los campos que la tabla pinta", async () => {
    const filas = await lugares.listar();
    exigir(Array.isArray(filas), "tiene que ser una lista");
    if (filas.length === 0) return;
    for (const c of ["id", ...CAMPOS_LUGAR]) {
      exigir(c in filas[0], `la ficha tiene que traer ${c}`);
    }
  });

  caso("⚠️ `recontratar` sigue admitiendo NULO · son tres estados, no dos", async () => {
    const filas = await proveedores.listar();
    exigir(Array.isArray(filas), "tiene que ser una lista");
    if (filas.length === 0) return;
    exigir("recontratar" in filas[0], "el campo tiene que venir");
    const valores = new Set(filas.map((f) => f.recontratar));
    /* El día que esto deje de poder ser nulo, «no lo hemos hablado» se habrá
       convertido en «lo descartamos» sin que nadie lo decidiera. */
    exigir(
      [...valores].every((v) => v === null || typeof v === "boolean"),
      `recontratar trajo algo que no es booleano ni nulo: ${[...valores]}`
    );
  });

  caso("Un alta devuelve la ficha entera, con su id", async () => {
    const nombre = `Comprobación ${Date.now()}`;
    const hecho = await lugares.crear({ nombre, ciudad: "Lima", aforo: 10 });
    exigir(hecho.id, "sin id no se puede corregir después");
    exigir(hecho.nombre === nombre, "y tiene que devolver lo que se guardó");
  });

  caso("⚠️ Corregir REEMPLAZA: lo que no se manda queda vacío", async () => {
    const hecho = await lugares.crear({
      nombre: `Con ciudad ${Date.now()}`, ciudad: "Arequipa", aforo: 50,
    });
    /* Se corrige mandando SOLO el nombre. El resto va nulo porque `cuerpoEntero`
       completa el contrato — que es exactamente lo que el backend exige. */
    const tras = await lugares.corregir(hecho.id, { nombre: "Ya sin ciudad" });
    exigir(tras.ciudad === null, "la ciudad tenía que quedar vacía, no conservarse");
    exigir(tras.aforo === null, "y el aforo también");
  });

  caso("⚠️ Un cuerpo INCOMPLETO lo rechaza el backend nombrando lo que falta", async () => {
    /* Se salta a propósito la capa de datos: se manda un PUT a medias, como lo
       haría un formulario que enviara «solo lo que cambió». Tiene que fallar. */
    const { pedirAlBackend } = await import("../nucleo/backend.js");
    const hecho = await lugares.crear({ nombre: `A medias ${Date.now()}` });
    try {
      await pedirAlBackend(`/logistica/lugares/${hecho.id}`, {
        metodo: "PUT", cuerpo: { nombre: "solo esto" }, token: tokenLocal(),
      });
      throw new Error("un PUT a medias tenía que ser rechazado");
    } catch (e) {
      exigir(e instanceof ErrorDelBackend && e.estado === 400, `se esperaba 400 y vino ${e.estado}`);
      exigir(e.detalle?.includes("Faltan"), "y tiene que decir QUÉ falta, no solo que falta algo");
    }
  });

  caso("Un alta sin nombre se explica con la voz de la casa", async () => {
    try {
      await proveedores.crear({ ciudad: "Lima" });
      throw new Error("sin nombre tenía que fallar");
    } catch (e) {
      exigir(e instanceof ErrorDelBackend, "tiene que ser un error del backend");
      exigir(!e.esGenerico, "y tiene que traer título y detalle escritos");
      exigir(e.detalle.toLowerCase().includes("nombre"), "hablando del nombre");
    }
  });
});

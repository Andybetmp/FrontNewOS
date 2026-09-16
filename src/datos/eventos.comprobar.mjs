/* ============================================================================
   Fase 2 · Eventos, contra el backend de verdad.
   ----------------------------------------------------------------------------
   El caso que justifica la mitad de esta suite es el del reemplazo. En el
   backend, P14 nació porque corregir el nombre de un evento le quitaba la
   ciudad, la fecha y la sede, y lo devolvía de fase «campaña» a «idea». Con un
   200 y sin una palabra.

   Aquí se comprueba las dos mitades: que el backend sigue exigiendo el cuerpo
   entero, y que la capa de datos lo manda entero.
   ========================================================================= */

import { BACKEND, vista, exigir, tokenLocal } from "../comprobar/arnes.mjs";

globalThis.VITE_BACKEND_URL = BACKEND;

const { fijarProveedorDeToken } = await import("../nucleo/sesionLocal.js");
fijarProveedorDeToken(() => tokenLocal());

const { eventos, inscritos, proveedoresDelEvento, CAMPOS_EVENTO } = await import("./eventos.js");
const { pedirAlBackend, ErrorDelBackend } = await import("../nucleo/backend.js");

vista("Fase 2 · Eventos", (caso) => {

  caso("La ficha trae los once campos que el formulario necesita", async () => {
    const hecho = await eventos.crear({ nombre: `Comprobación ${Date.now()}`, ciudad: "Lima" });
    for (const c of ["id", ...CAMPOS_EVENTO]) {
      exigir(c in hecho, `la ficha tiene que traer ${c}`);
    }
  });

  caso("Las ocho fases salen del backend, no de una lista escrita aquí", async () => {
    const fases = await eventos.fases();
    exigir(Array.isArray(fases) && fases.length === 8, `se esperaban 8 fases y vinieron ${fases.length}`);
    exigir(fases[0] === "idea", "la primera es «idea»");
    /* Si el backend añade una novena, la pantalla la pinta sola. Tenerlas
       escritas aquí sería una segunda verdad que un día discreparía. */
  });

  caso("⚠️ EL CASO DE P14 · corregir REEMPLAZA, también la fase", async () => {
    const hecho = await eventos.crear({
      nombre: `Con todo ${Date.now()}`, ciudad: "Arequipa", estado: "campaña", presupuesto: 5000,
    });
    exigir(hecho.estado === "campaña", "nació en campaña");

    /* Se corrige mandando SOLO el nombre a través de la capa de datos: ella
       completa el contrato, así que el resto viaja NULO a propósito. */
    const tras = await eventos.corregir(hecho.id, { nombre: "Ya sin nada" });
    exigir(tras.ciudad === null, "la ciudad tenía que vaciarse");
    exigir(tras.presupuesto === null, "y el presupuesto");
    exigir(tras.estado === "idea", `la fase vuelve a «idea» y vino «${tras.estado}»`);
  });

  caso("⚠️ Un PUT a medias lo rechaza el backend NOMBRANDO lo que falta", async () => {
    const hecho = await eventos.crear({ nombre: `A medias ${Date.now()}` });
    try {
      await pedirAlBackend(`/eventos/${hecho.id}`, {
        metodo: "PUT", cuerpo: { nombre: "solo esto" }, token: tokenLocal(),
      });
      throw new Error("tenía que ser rechazado");
    } catch (e) {
      exigir(e instanceof ErrorDelBackend && e.estado === 400, `se esperaba 400 y vino ${e.estado}`);
      exigir(e.detalle?.includes("estado"), "y tiene que nombrar `estado`, que es el que retrocede la fase");
    }
  });

  caso("El resumen de inscritos cuenta lo que hay que perseguir", async () => {
    const hecho = await eventos.crear({ nombre: `Resumen ${Date.now()}` });
    const r = await inscritos.resumen(hecho.id);
    for (const c of ["inscritos", "validados", "porValidar", "rechazados", "validadosSinMonto"]) {
      exigir(c in r, `el resumen tiene que traer ${c}`);
    }
    /* ⚠️ `validadosSinMonto` son pagos dados por buenos sin anotar cuánto entró.
       No es un fallo de la respuesta: es lo que hay que perseguir. */
    exigir(r.validadosSinMonto === 0, "un evento nuevo no tiene validados sin monto");
  });

  caso("⚠️ Un rechazo SIN motivo se rechaza: no es un campo opcional", async () => {
    const hecho = await eventos.crear({ nombre: `Sin motivo ${Date.now()}` });
    try {
      await inscritos.rechazar(hecho.id, "11111111-2222-3333-4444-555555555555", null);
      throw new Error("un rechazo sin motivo tenía que fallar");
    } catch (e) {
      exigir(e instanceof ErrorDelBackend, "tiene que ser un error del backend");
      exigir(!e.esGenerico, "y explicado, no genérico");
    }
  });

  caso("El resumen de proveedores dice lo comprometido y lo que no tiene precio", async () => {
    const hecho = await eventos.crear({ nombre: `Logística ${Date.now()}` });
    const r = await proveedoresDelEvento.resumen(hecho.id);
    for (const c of ["contratos", "comprometido", "sinPrecioCerrado"]) {
      exigir(c in r, `el resumen tiene que traer ${c}`);
    }
    exigir(r.contratos === 0, "un evento nuevo no tiene contratos");
  });

  caso("⚠️ Contratar sin decir QUIÉN lo registra no cuela", async () => {
    /* La firma sale del token; aquí se manda uno cuyo `sub` no está en
       `perfiles`, que es lo que pasaría con un usuario recién creado. */
    const hecho = await eventos.crear({ nombre: `Sin perfil ${Date.now()}` });
    const proveedores = await (await import("./logistica.js")).proveedores.listar();
    if (proveedores.length === 0) return;
    try {
      await pedirAlBackend(`/eventos/${hecho.id}/proveedores`, {
        metodo: "POST",
        cuerpo: { proveedor: proveedores[0].id, concepto: "prueba", costoAcordado: 100 },
        token: tokenLocal({ sub: "99999999-9999-9999-9999-999999999999" }),
      });
      throw new Error("un sub sin perfil tenía que fallar");
    } catch (e) {
      exigir(e instanceof ErrorDelBackend, "tiene que ser un error del backend");
      exigir(!e.esGenerico, "y explicado: un `violates foreign key` no le dice nada a nadie");
    }
  });
});

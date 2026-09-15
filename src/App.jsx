import { useEffect, useState } from "react";
import { resolverInstancia, NoSeSabeDondeVive } from "./nucleo/instancia.js";
import { pedirAlBackend, ErrorDelBackend, urlDelBackend } from "./nucleo/backend.js";
import { queEnsenar, QUE_ENSENAR } from "./nucleo/sesion.js";
import Cimiento from "./Cimiento.jsx";

/* ============================================================================
   Fase 0 · Lo único que hay todavía: el estado del cimiento.
   ----------------------------------------------------------------------------
   No es una pantalla del producto. Es la que responde a «¿está bien montado
   esto?» sin abrir la consola del navegador: resuelve la empresa de verdad,
   llama al backend de verdad y enseña lo que contesta.

   ⚠️ Se borra el día que entre la primera pantalla real. Está aquí porque un
   cimiento que no se puede mirar se da por bueno.
   ========================================================================= */

const EMPRESA = (import.meta.env.VITE_EMPRESA ?? "acme").trim();

export default function App() {
  const [instancia, setInstancia] = useState(null);
  const [fallo, setFallo] = useState(null);
  const [comprobaciones, setComprobaciones] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vivo = true;

    (async () => {
      const hechas = [];

      /* 1 · ¿Dónde vive esta empresa? */
      try {
        const destino = await resolverInstancia(EMPRESA);
        if (!vivo) return;
        setInstancia(destino);
        hechas.push({
          que: "Resolver la empresa",
          como: "bien",
          dice: `${destino.nombre} · ${destino.urlApi}`,
        });
      } catch (e) {
        if (!vivo) return;
        setFallo(e);
        hechas.push({
          que: "Resolver la empresa",
          como: "mal",
          dice: e instanceof NoSeSabeDondeVive ? e.message : String(e),
        });
      }

      /* 2 · Una ruta protegida sin sesión: tiene que rechazar. */
      try {
        await pedirAlBackend("/eventos");
        hechas.push({
          que: "Una ruta protegida sin sesión",
          como: "mal",
          dice: "contestó como si nada. La puerta está abierta.",
        });
      } catch (e) {
        const esperado = e instanceof ErrorDelBackend && e.estado === 401;
        hechas.push({
          que: "Una ruta protegida sin sesión",
          como: esperado ? "bien" : "mal",
          dice: esperado ? "401, como debe" : `se esperaba 401 y vino ${e.estado ?? e.message}`,
        });
      }

      /* 3 · Un error CON la voz de la casa: el título y el detalle llegan. */
      try {
        await pedirAlBackend("/publico/manychat/" + EMPRESA, { metodo: "POST", cuerpo: { id: "1" } });
        hechas.push({ que: "Un error explicado", como: "aviso", dice: "no falló; esta comprobación necesita un webhook sin llave" });
      } catch (e) {
        const explicado = e instanceof ErrorDelBackend && !e.esGenerico;
        hechas.push({
          que: "Un error explicado",
          como: explicado ? "bien" : "mal",
          dice: explicado ? `«${e.titulo}»` : "llegó sin título ni detalle",
          detalle: explicado ? e.detalle : null,
        });
      }

      if (vivo) {
        setComprobaciones(hechas);
        setCargando(false);
      }
    })();

    return () => { vivo = false; };
  }, []);

  return (
    <Cimiento
      empresa={EMPRESA}
      backend={urlDelBackend()}
      instancia={instancia}
      fallo={fallo}
      comprobaciones={comprobaciones}
      cargando={cargando}
      navegacion={queEnsenar(null)}
      QUE_ENSENAR={QUE_ENSENAR}
    />
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { eventos, CAMPOS_EVENTO, NUMERICOS_EVENTO } from "../datos/eventos.js";
import { Boton, Campo, Aviso, Celda } from "../ui/piezas.jsx";

/* ============================================================================
   El listado de eventos, y el alta.
   ----------------------------------------------------------------------------
   El alta y la corrección comparten contrato —los mismos once campos— pero NO
   comparten formulario: dar de alta y reemplazar no son lo mismo, y una
   pantalla que los junte acaba enseñando «lo que se deje vacío queda vacío» a
   quien está creando algo por primera vez, que no tiene nada que vaciar.
   ========================================================================= */

export function normalizar(valores, numericos) {
  const salida = {};
  for (const [k, v] of Object.entries(valores)) {
    if (v === "" || v === undefined) {
      salida[k] = null; // vacío es «no se sabe», no cadena vacía
    } else if (numericos.includes(k)) {
      const n = Number(v);
      salida[k] = Number.isFinite(n) ? n : null;
    } else {
      salida[k] = v;
    }
  }
  return salida;
}

export default function Eventos() {
  const [filas, setFilas] = useState(null);
  const [fases, setFases] = useState([]);
  const [error, setError] = useState(null);
  const [dandoDeAlta, setDandoDeAlta] = useState(false);
  const [guardando, setGuardando] = useState(false);

  async function recargar() {
    setError(null);
    try {
      setFilas(await eventos.listar());
    } catch (e) {
      setError(e);
      setFilas([]);
    }
  }

  useEffect(() => {
    recargar();
    eventos.fases().then(setFases).catch(() => {});
  }, []);

  async function crear(evento) {
    evento.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      await eventos.crear(normalizar(
        Object.fromEntries(new FormData(evento.target).entries()), NUMERICOS_EVENTO
      ));
      setDandoDeAlta(false);
      await recargar();
    } catch (e) {
      setError(e);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: "var(--esp-5)" }}>
      <Aviso error={error} />

      {dandoDeAlta ? (
        <form onSubmit={crear} style={{
          background: "var(--color-surface)", border: "1px solid var(--color-line)",
          borderRadius: "var(--radio-tarjeta)", padding: "var(--esp-5)",
          display: "grid", gap: "var(--esp-4)",
        }}>
          <strong style={{ fontSize: 16 }}>Nuevo evento</strong>
          <div style={{ display: "grid", gap: "var(--esp-4)", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
            <Campo name="nombre" rotulo="nombre" required />
            <Campo name="ciudad" rotulo="ciudad" />
            <Campo name="fecha" rotulo="fecha" type="date" />
            <Campo name="ponente" rotulo="ponente" />
            <Campo name="metaInscritos" rotulo="metaInscritos" type="number" />
            <Campo name="presupuesto" rotulo="presupuesto" type="number" step="0.01" />
          </div>
          <span style={{ fontSize: 11, color: "var(--color-ink-3)" }}>
            Un evento nace en «idea». Las metas y el gasto se ponen después, al corregirlo.
          </span>
          <div style={{ display: "flex", gap: "var(--esp-2)", justifyContent: "flex-end" }}>
            <Boton type="button" variante="fantasma" onClick={() => setDandoDeAlta(false)}>Cancelar</Boton>
            <Boton type="submit" variante="primario" disabled={guardando}>
              {guardando ? "Creando…" : "Crear"}
            </Boton>
          </div>
        </form>
      ) : (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Boton variante="primario" onClick={() => setDandoDeAlta(true)}>Nuevo evento</Boton>
        </div>
      )}

      <div style={{
        background: "var(--color-surface)", border: "1px solid var(--color-line)",
        borderRadius: "var(--radio-tarjeta)", overflow: "hidden",
      }}>
        {filas === null && <div style={{ padding: "var(--esp-4)", color: "var(--color-ink-2)" }}>Cargando…</div>}
        {filas?.length === 0 && !error && (
          <div style={{ padding: "var(--esp-5)", textAlign: "center", color: "var(--color-ink-2)" }}>
            <div>Todavía no hay eventos</div>
            <div style={{ fontSize: 13, color: "var(--color-ink-3)", marginTop: 4 }}>
              Nada que enseñar no es lo mismo que un error.
            </div>
          </div>
        )}
        {filas?.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr>
                  {["nombre", "ciudad", "fecha", "fase", "metaInscritos"].map((c) => (
                    <th key={c} style={{
                      textAlign: "left", padding: "var(--esp-3) var(--esp-4)", fontSize: 12,
                      fontWeight: 600, color: "var(--color-ink-2)",
                      borderBottom: "1px solid var(--color-line)", whiteSpace: "nowrap",
                    }}>{c}</th>
                  ))}
                  <th style={{ borderBottom: "1px solid var(--color-line)" }} />
                </tr>
              </thead>
              <tbody>
                {filas.map((e) => (
                  <tr key={e.id}>
                    <td style={celda}>{e.nombre}</td>
                    <td style={celda}><Celda valor={e.ciudad} /></td>
                    <td style={celda}><Celda valor={e.fecha} /></td>
                    <td style={celda}><Fase valor={e.estado} fases={fases} /></td>
                    <td style={celda} className="cifras"><Celda valor={e.metaInscritos} /></td>
                    <td style={{ ...celda, textAlign: "right" }}>
                      <Link to={`/eventos/${e.id}`} style={{
                        color: "var(--color-ink-2)", textDecoration: "none", fontSize: 13,
                      }}>Abrir</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const celda = { padding: "var(--esp-3) var(--esp-4)", borderBottom: "1px solid var(--color-line)" };

/**
 * La fase, con su posición en el recorrido.
 *
 * ⚠️ Las ocho salen del backend (`GET /eventos/fases`). Tenerlas escritas aquí
 * sería una segunda verdad, y el día que discreparan nadie sabría cuál manda.
 */
function Fase({ valor, fases }) {
  if (!valor) return <Celda valor={valor} />;
  const i = fases.indexOf(valor);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <span>{valor}</span>
      {i >= 0 && (
        <span className="cifras" style={{ fontSize: 11, color: "var(--color-ink-3)" }}>
          {i + 1}/{fases.length}
        </span>
      )}
    </span>
  );
}

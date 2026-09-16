import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { empresas, planes } from "../../datos/consola.js";
import { Boton, Campo, Aviso, Celda } from "../../ui/piezas.jsx";
import { Salud, Estado, celda, hace } from "./piezas.jsx";

/* ============================================================================
   Los clientes de RENASER. Todos, que es lo que hace distinta a esta pantalla.
   ========================================================================= */

export default function Empresas() {
  const [filas, setFilas] = useState(null);
  const [error, setError] = useState(null);
  const [dandoDeAlta, setDandoDeAlta] = useState(false);

  async function recargar() {
    setError(null);
    try {
      setFilas(await empresas.listar());
    } catch (e) {
      setError(e);
      setFilas([]);
    }
  }

  useEffect(() => { recargar(); }, []);

  return (
    <div style={{ display: "grid", gap: "var(--esp-5)" }}>
      <Aviso error={error} />

      {dandoDeAlta
        ? <Alta alTerminar={async () => { setDandoDeAlta(false); await recargar(); }}
                alCancelar={() => setDandoDeAlta(false)} />
        : (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--esp-4)" }}>
            <span style={{ fontSize: 13, color: "var(--color-ink-2)" }}>
              {filas === null ? "" : `${filas.length} ${filas.length === 1 ? "cliente" : "clientes"}`}
            </span>
            <Boton variante="primario" onClick={() => setDandoDeAlta(true)}>Dar de alta</Boton>
          </div>
        )}

      <div style={{
        background: "var(--color-surface)", border: "1px solid var(--color-line)",
        borderRadius: "var(--radio-tarjeta)", overflow: "hidden",
      }}>
        {filas === null && (
          <div style={{ padding: "var(--esp-4)", color: "var(--color-ink-2)" }}>Cargando…</div>
        )}

        {filas?.length === 0 && !error && (
          /* ⚠️ Vacío NO es un error, y aquí menos que en ningún sitio: la
             consola habla solo con la base de control precisamente para poder
             funcionar cuando todavía no hay ningún cliente. */
          <div style={{ padding: "var(--esp-6, 32px) var(--esp-5)", textAlign: "center" }}>
            <div style={{ fontSize: 15 }}>Todavía no hay ningún cliente</div>
            <div style={{ fontSize: 13, color: "var(--color-ink-3)", marginTop: 6, lineHeight: 1.5 }}>
              Es lo normal en una instalación recién puesta. Esta pantalla existe
              justamente para dar de alta al primero.
            </div>
          </div>
        )}

        {filas?.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr>
                  {["clave", "nombre", "estado · enrutado", "salud", "alta"].map((c) => (
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
                  <tr key={e.clave}>
                    <td style={{ ...celda, fontFamily: "var(--fuente-mono)", fontSize: 13 }}>{e.clave}</td>
                    <td style={celda}>{e.nombre}</td>
                    {/* Los dos juntos y sin fundir: ver `Estado`. */}
                    <td style={celda}>
                      <Estado estado={e.estado} enrutandoAhora={e.enrutandoAhora}
                              motivoSiNoEnruta={e.motivoSiNoEnruta} />
                    </td>
                    {/* La salud NUNCA sin su fecha: ver `Salud`. */}
                    <td style={celda}>
                      <Salud salud={e.salud} comprobadaEl={e.saludComprobadaEl} />
                    </td>
                    <td style={{ ...celda, fontSize: 13, color: "var(--color-ink-2)" }}
                        title={String(e.altaEl)}>{hace(e.altaEl)}</td>
                    <td style={{ ...celda, textAlign: "right" }}>
                      <Link to={`/empresas/${e.clave}`} style={{
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

/**
 * El alta.
 *
 * ⚠️ El plan es un SELECTOR, no un campo de texto donde teclear una clave.
 * Es la lección de la fase 5: emitir un enlace pedía un UUID que no se podía
 * buscar desde ninguna parte. Aquí el backend exige que el plan exista, y
 * pedirlo a mano sería el mismo agujero con otro nombre.
 */
function Alta({ alTerminar, alCancelar }) {
  const [disponibles, setDisponibles] = useState(null);
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => { planes.listar().then(setDisponibles).catch(() => setDisponibles([])); }, []);

  async function crear(evento) {
    evento.preventDefault();
    setGuardando(true);
    setError(null);
    const datos = Object.fromEntries(new FormData(evento.target).entries());
    try {
      await empresas.darDeAlta(datos);
      await alTerminar();
    } catch (e) {
      setError(e);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={crear} style={{
      background: "var(--color-surface)", border: "1px solid var(--color-line)",
      borderRadius: "var(--radio-tarjeta)", padding: "var(--esp-5)",
      display: "grid", gap: "var(--esp-4)",
    }}>
      <strong style={{ fontSize: 16 }}>Dar de alta un cliente</strong>
      <Aviso error={error} />

      <div style={{ display: "grid", gap: "var(--esp-4)",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        <Campo name="clave" rotulo="clave" required
               pista="minúsculas, dígitos y guiones. Viaja en URLs: no se cambia después" />
        <Campo name="nombre" rotulo="nombre" required pista="lo que ve una persona" />
        <label style={{ display: "grid", gap: "var(--esp-1)" }}>
          <span style={{ fontSize: 12, color: "var(--color-ink-2)" }}>plan</span>
          <select name="plan" required style={{
            background: "var(--color-surface-2)", color: "var(--color-ink)",
            border: "1px solid var(--color-line)", borderRadius: "var(--radio-control)",
            padding: "9px 12px", fontSize: 14, fontFamily: "inherit",
          }}>
            <option value="">—</option>
            {(disponibles ?? []).map((p) => (
              <option key={p.clave} value={p.clave}>
                {p.nombre} · {p.limitePersonas == null ? "sin límite" : `${p.limitePersonas} personas`}
              </option>
            ))}
          </select>
          {disponibles?.length === 0 && (
            <span style={{ fontSize: 11, color: "var(--color-warn-txt)", lineHeight: 1.4 }}>
              No hay ningún plan todavía, y sin plan no se puede dar de alta.
              Créalo primero en «Planes».
            </span>
          )}
        </label>
        <Campo name="correoAdministrador" rotulo="correo del administrador" type="email" />
      </div>

      <span style={{ fontSize: 11, color: "var(--color-ink-3)", lineHeight: 1.5 }}>
        Dar de alta crea la base del cliente entera y la deja enrutando. No se
        deshace: para retirar a un cliente se le cierra, y cerrar es definitivo.
      </span>

      <div style={{ display: "flex", gap: "var(--esp-2)", justifyContent: "flex-end" }}>
        <Boton type="button" variante="fantasma" onClick={alCancelar}>Cancelar</Boton>
        <Boton type="submit" variante="primario" disabled={guardando}>
          {guardando ? "Dando de alta…" : "Dar de alta"}
        </Boton>
      </div>
    </form>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { programas, TIPOS } from "../datos/programas.js";
import { Boton, Campo, Aviso, Celda } from "../ui/piezas.jsx";

/* ============================================================================
   El listado de programas.
   ----------------------------------------------------------------------------
   ⚠️ La tabla enseña las DOS cifras, no una. Una columna «ingresos» que
   escogiera cualquiera de las dos mentiría en la mitad de las filas. Ver
   `ui/D11.jsx` para el porqué entero.
   ========================================================================= */

const soles = (n) => (n === null || n === undefined)
  ? null
  : new Intl.NumberFormat("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n));

export default function Programas() {
  const [filas, setFilas] = useState(null);
  const [error, setError] = useState(null);
  const [dandoDeAlta, setDandoDeAlta] = useState(false);
  const [guardando, setGuardando] = useState(false);

  async function recargar() {
    setError(null);
    try { setFilas(await programas.listar()); }
    catch (e) { setError(e); setFilas([]); }
  }
  useEffect(() => { recargar(); }, []);

  async function crear(ev) {
    ev.preventDefault();
    const d = Object.fromEntries(new FormData(ev.target).entries());
    setGuardando(true);
    setError(null);
    try {
      await programas.crear({
        nombre: d.nombre || null,
        tipo: d.tipo || null,
        /* ⚠️ Vacío va NULO. «Nadie lo ha declarado» no es «declaró cero». */
        ingresosDeclarados: d.ingresosDeclarados ? Number(d.ingresosDeclarados) : null,
        egresosDeclarados: d.egresosDeclarados ? Number(d.egresosDeclarados) : null,
      });
      setDandoDeAlta(false);
      await recargar();
    } catch (e) { setError(e); }
    finally { setGuardando(false); }
  }

  return (
    <div style={{ display: "grid", gap: "var(--esp-5)" }}>
      <Aviso error={error} />

      {dandoDeAlta ? (
        <form onSubmit={crear} style={tarjeta}>
          <strong style={{ fontSize: 16 }}>Nuevo programa</strong>
          <div style={{ display: "grid", gap: "var(--esp-4)", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
            <Campo name="nombre" rotulo="nombre" required />
            <label style={{ display: "grid", gap: "var(--esp-1)" }}>
              <span style={{ fontSize: 12, color: "var(--color-ink-2)" }}>tipo</span>
              <select name="tipo" required style={selector}>
                <option value="">—</option>
                {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <Campo name="ingresosDeclarados" rotulo="ingresos declarados" type="number" step="0.01"
                   pista="Déjalo vacío si todavía nadie lo ha declarado. Vacío ≠ cero." />
            <Campo name="egresosDeclarados" rotulo="egresos declarados" type="number" step="0.01"
                   pista="Lo mismo: vacío significa «no se sabe»." />
          </div>
          <div style={{ display: "flex", gap: "var(--esp-2)", justifyContent: "flex-end" }}>
            <Boton type="button" variante="fantasma" onClick={() => setDandoDeAlta(false)}>Cancelar</Boton>
            <Boton type="submit" variante="primario" disabled={guardando}>
              {guardando ? "Creando…" : "Crear"}
            </Boton>
          </div>
        </form>
      ) : (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Boton variante="primario" onClick={() => setDandoDeAlta(true)}>Nuevo programa</Boton>
        </div>
      )}

      <div style={{ ...tarjeta, padding: 0, display: "block", overflow: "hidden" }}>
        {filas === null && <div style={{ padding: "var(--esp-4)", color: "var(--color-ink-2)" }}>Cargando…</div>}
        {filas?.length === 0 && !error && (
          <div style={{ padding: "var(--esp-5)", textAlign: "center", color: "var(--color-ink-2)" }}>
            Todavía no hay programas
          </div>
        )}
        {filas?.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr>
                  {["nombre", "tipo", "declarado", "cobrado", "clientes"].map((c) => (
                    <th key={c} style={th}>{c}</th>
                  ))}
                  <th style={{ borderBottom: "1px solid var(--color-line)" }} />
                </tr>
              </thead>
              <tbody>
                {filas.map((p) => (
                  <tr key={p.id}>
                    <td style={celda}>{p.nombre}</td>
                    <td style={celda}><Celda valor={p.tipo} /></td>
                    {/* Las dos columnas, siempre. Y el nulo se dice, no se rellena. */}
                    <td style={celda} className="cifras">
                      {soles(p.ingresosDeclarados) ?? (
                        <span style={{ color: "var(--color-ink-3)", fontStyle: "italic" }}>sin declarar</span>
                      )}
                    </td>
                    <td style={celda} className="cifras">{soles(p.cobradoSoles) ?? "—"}</td>
                    <td style={celda} className="cifras">{p.clientes}</td>
                    <td style={{ ...celda, textAlign: "right" }}>
                      <Link to={`/programas/${p.id}`} style={{
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

const tarjeta = {
  background: "var(--color-surface)", border: "1px solid var(--color-line)",
  borderRadius: "var(--radio-tarjeta)", padding: "var(--esp-5)",
  display: "grid", gap: "var(--esp-4)",
};
const celda = { padding: "var(--esp-3) var(--esp-4)", borderBottom: "1px solid var(--color-line)" };
const th = {
  textAlign: "left", padding: "var(--esp-3) var(--esp-4)", fontSize: 12, fontWeight: 600,
  color: "var(--color-ink-2)", borderBottom: "1px solid var(--color-line)", whiteSpace: "nowrap",
};
const selector = {
  background: "var(--color-surface-2)", color: "var(--color-ink)",
  border: "1px solid var(--color-line)", borderRadius: "var(--radio-control)",
  padding: "9px 12px", fontSize: 14, fontFamily: "inherit",
};

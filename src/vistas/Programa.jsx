import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { programas, inscripciones, pagos, MONEDAS, MODALIDADES, exigeTasa } from "../datos/programas.js";
import { Boton, Campo, Aviso, Celda } from "../ui/piezas.jsx";
import D11 from "../ui/D11.jsx";

/* ============================================================================
   La ficha de un programa: D11 arriba, sus clientes debajo, y los pagos de cada
   uno cuando se abre.
   ========================================================================= */

export default function Programa() {
  const { id } = useParams();
  const [ficha, setFicha] = useState(null);
  const [clientes, setClientes] = useState(null);
  const [error, setError] = useState(null);
  const [inscribiendo, setInscribiendo] = useState(false);
  const [cobrandoA, setCobrandoA] = useState(null);

  async function recargar() {
    setError(null);
    try {
      const [f, c] = await Promise.all([
        programas.ver(id), inscripciones.deUnPrograma(id),
      ]);
      setFicha(f);
      setClientes(c);
    } catch (e) { setError(e); }
  }
  useEffect(() => { recargar(); /* eslint-disable-next-line */ }, [id]);

  async function inscribir(ev) {
    ev.preventDefault();
    const d = Object.fromEntries(new FormData(ev.target).entries());
    setError(null);
    try {
      await inscripciones.crear({
        nombre: d.nombre || null, programa: id,
        ingresoEl: d.ingresoEl || null, responsable: d.responsable || null,
      });
      setInscribiendo(false);
      await recargar();
    } catch (e) { setError(e); }
  }

  return (
    <div style={{ display: "grid", gap: "var(--esp-5)" }}>
      <div>
        <Link to="/programas" style={{ fontSize: 13, color: "var(--color-ink-2)", textDecoration: "none" }}>
          ← Programas
        </Link>
        <h2 style={{ margin: "var(--esp-2) 0 0", fontSize: 22, fontWeight: 600 }}>
          {ficha?.nombre ?? (error ? "No se pudo abrir" : "…")}
        </h2>
        {ficha?.tipo && (
          <span style={{ fontSize: 13, color: "var(--color-ink-2)" }}>{ficha.tipo}</span>
        )}
      </div>

      <Aviso error={error} />

      {ficha && <D11 ficha={ficha} />}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.04em", margin: 0,
                     color: "var(--color-ink-2)" }}>CLIENTES INSCRITOS</h3>
        {!inscribiendo && !cobrandoA && (
          <Boton variante="primario" onClick={() => setInscribiendo(true)}>Inscribir</Boton>
        )}
      </div>

      {inscribiendo && (
        <form onSubmit={inscribir} style={tarjeta}>
          <div style={{ display: "grid", gap: "var(--esp-4)", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
            <Campo name="nombre" rotulo="nombre" required
                   pista="De esta inscripción van a colgar pagos: una sin nombre no se puede reclamar." />
            <Campo name="ingresoEl" rotulo="día de ingreso" type="date" required
                   pista="Obligatorio. De él cuelga el día de programa y cualquier cálculo de atraso." />
            <Campo name="responsable" rotulo="responsable (id)" />
          </div>
          <div style={{ display: "flex", gap: "var(--esp-2)", justifyContent: "flex-end" }}>
            <Boton type="button" variante="fantasma" onClick={() => setInscribiendo(false)}>Cancelar</Boton>
            <Boton type="submit" variante="primario">Inscribir</Boton>
          </div>
        </form>
      )}

      {cobrandoA && (
        <FormularioDePago
          cliente={cobrandoA}
          alCerrar={() => setCobrandoA(null)}
          alGuardar={async () => { setCobrandoA(null); await recargar(); }}
          alFallar={setError}
        />
      )}

      <div style={{ ...tarjeta, padding: 0, display: "block", overflow: "hidden" }}>
        {clientes?.length === 0 && (
          <div style={{ padding: "var(--esp-5)", textAlign: "center", color: "var(--color-ink-2)" }}>
            Nadie inscrito todavía
          </div>
        )}
        {clientes?.length > 0 && clientes.map((c) => (
          <Cliente key={c.id} cliente={c} alCobrar={() => setCobrandoA(c)} bloqueado={!!cobrandoA} />
        ))}
      </div>
    </div>
  );
}

function Cliente({ cliente, alCobrar, bloqueado }) {
  const [recibos, setRecibos] = useState(null);
  const [abierto, setAbierto] = useState(false);

  async function alternar() {
    const nuevo = !abierto;
    setAbierto(nuevo);
    if (nuevo && recibos === null) {
      try { setRecibos(await pagos.deUnCliente(cliente.id)); }
      catch { setRecibos([]); }
    }
  }

  return (
    <div style={{ borderBottom: "1px solid var(--color-line)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--esp-3)",
                    padding: "var(--esp-3) var(--esp-4)" }}>
        <button type="button" onClick={alternar} style={{
          background: "none", border: "none", cursor: "pointer", fontFamily: "inherit",
          color: "var(--color-ink)", fontSize: 14, flex: 1, textAlign: "left", padding: 0,
        }}>
          <span style={{ color: "var(--color-ink-3)", marginRight: 8 }}>{abierto ? "▾" : "▸"}</span>
          {cliente.nombre}
          <span style={{ color: "var(--color-ink-3)", fontSize: 12, marginLeft: 10 }}>
            desde <Celda valor={cliente.ingresoEl} />
          </span>
        </button>
        {!bloqueado && (
          <Boton variante="fantasma" onClick={alCobrar} style={{ padding: "4px 10px", fontSize: 13 }}>
            Registrar pago
          </Boton>
        )}
      </div>

      {abierto && (
        <div style={{ padding: "0 var(--esp-4) var(--esp-4)", fontSize: 13 }}>
          {recibos === null && <span style={{ color: "var(--color-ink-2)" }}>Cargando…</span>}
          {recibos?.length === 0 && <span style={{ color: "var(--color-ink-3)" }}>Sin pagos todavía</span>}
          {recibos?.length > 0 && (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {recibos.map((r) => (
                  <tr key={r.id}>
                    <td style={reciboCelda}><Celda valor={r.pagadoEl} /></td>
                    <td style={reciboCelda} className="cifras">
                      {r.moneda} <Celda valor={r.monto} />
                    </td>
                    {/* ⚠️ El importe en soles va SIEMPRE, también en un pago en
                        soles: es el que cuenta para lo cobrado, y enseñarlo solo
                        en los de dólares haría pensar que son cosas distintas. */}
                    <td style={reciboCelda} className="cifras" title="lo que cuenta para lo cobrado">
                      = S/ <Celda valor={r.montoSoles} />
                    </td>
                    <td style={reciboCelda}>
                      <Celda valor={r.modalidad} />
                      {r.cuotaNumero !== null && r.cuotaNumero !== undefined && (
                        <span style={{ color: "var(--color-ink-3)" }}> nº {r.cuotaNumero}</span>
                      )}
                    </td>
                    <td style={reciboCelda}><Celda valor={r.medio} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * El pago.
 *
 * ⚠️ Dos campos aparecen y desaparecen, y los dos por un motivo del negocio:
 * · `tasaCambio` solo con USD — sin ella no se sabe cuánto entró en soles.
 * · `cuotaNumero` solo con «cuota» — en contado no hay número que valga.
 *
 * El backend rechaza las dos combinaciones malas. Aquí se esconden en vez de
 * dejarlas pedir un dato que no significa nada.
 */
function FormularioDePago({ cliente, alCerrar, alGuardar, alFallar }) {
  const [moneda, setMoneda] = useState("PEN");
  const [modalidad, setModalidad] = useState("contado");
  const [guardando, setGuardando] = useState(false);

  async function guardar(ev) {
    ev.preventDefault();
    const d = Object.fromEntries(new FormData(ev.target).entries());
    setGuardando(true);
    try {
      await pagos.registrar({
        clienteDePrograma: cliente.id,
        monto: d.monto ? Number(d.monto) : null,
        moneda,
        tasaCambio: d.tasaCambio ? Number(d.tasaCambio) : null,
        pagadoEl: d.pagadoEl || null,
        modalidad,
        cuotaNumero: d.cuotaNumero ? Number(d.cuotaNumero) : null,
        medio: d.medio || null,
        comprobante: d.comprobante || null,
      });
      await alGuardar();
    } catch (e) { alFallar(e); }
    finally { setGuardando(false); }
  }

  return (
    <form onSubmit={guardar} style={tarjeta}>
      <strong style={{ fontSize: 15 }}>Registrar un pago de {cliente.nombre}</strong>
      <div style={{ display: "grid", gap: "var(--esp-4)", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        <Campo name="monto" rotulo="monto" type="number" step="0.01" required />
        <label style={{ display: "grid", gap: "var(--esp-1)" }}>
          <span style={{ fontSize: 12, color: "var(--color-ink-2)" }}>moneda</span>
          <select value={moneda} onChange={(e) => setMoneda(e.target.value)} style={selector}>
            {MONEDAS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
        {exigeTasa(moneda) && (
          <Campo name="tasaCambio" rotulo="tasa de cambio" type="number" step="0.0001" required
                 pista="Obligatoria en dólares: es lo que decide el importe en soles." />
        )}
        <Campo name="pagadoEl" rotulo="día del pago" type="date" required
               pista="Decide qué tasa aplicar." />
        <label style={{ display: "grid", gap: "var(--esp-1)" }}>
          <span style={{ fontSize: 12, color: "var(--color-ink-2)" }}>modalidad</span>
          <select value={modalidad} onChange={(e) => setModalidad(e.target.value)} style={selector}>
            {MODALIDADES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
        {modalidad === "cuota" && (
          <Campo name="cuotaNumero" rotulo="nº de cuota" type="number" required />
        )}
        <Campo name="medio" rotulo="medio" />
        <Campo name="comprobante" rotulo="comprobante" />
      </div>
      <div style={{ display: "flex", gap: "var(--esp-2)", justifyContent: "flex-end" }}>
        <Boton type="button" variante="fantasma" onClick={alCerrar}>Cancelar</Boton>
        <Boton type="submit" variante="primario" disabled={guardando}>
          {guardando ? "Registrando…" : "Registrar"}
        </Boton>
      </div>
    </form>
  );
}

const tarjeta = {
  background: "var(--color-surface)", border: "1px solid var(--color-line)",
  borderRadius: "var(--radio-tarjeta)", padding: "var(--esp-5)",
  display: "grid", gap: "var(--esp-4)",
};
const reciboCelda = { padding: "6px 10px 6px 0", color: "var(--color-ink-2)" };
const selector = {
  background: "var(--color-surface-2)", color: "var(--color-ink)",
  border: "1px solid var(--color-line)", borderRadius: "var(--radio-control)",
  padding: "9px 12px", fontSize: 14, fontFamily: "inherit",
};

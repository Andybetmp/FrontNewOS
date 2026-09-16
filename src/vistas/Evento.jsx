import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { eventos, inscritos, proveedoresDelEvento, CAMPOS_EVENTO, NUMERICOS_EVENTO } from "../datos/eventos.js";
import { proveedores as catalogoProveedores } from "../datos/logistica.js";
import { Boton, Campo, Aviso, Celda } from "../ui/piezas.jsx";
import { normalizar } from "./Eventos.jsx";

/* ============================================================================
   La ficha de un evento · tres pestañas.
   ----------------------------------------------------------------------------
   ⚠️ EL FORMULARIO DE DATOS ES EL SITIO MÁS PELIGROSO DE TODA LA APLICACIÓN
   ------------------------------------------------------------------------
   Once campos y corregir REEMPLAZA. Un formulario que enviara «solo lo que
   cambió» borraría la fecha, la sede y el presupuesto — y devolvería la fase a
   «idea». Es exactamente lo que pasaba en producción antes de P14.

   Por eso este formulario:
   · Trae los once campos SIEMPRE, incluida la fase, aunque nadie la toque.
   · Lo dice arriba, con esas palabras.
   · Manda `estado` con el valor actual si no se cambia.
   ========================================================================= */

const PESTANAS = [
  ["datos", "Datos"],
  ["inscritos", "Inscritos"],
  ["proveedores", "Proveedores"],
];

export default function Evento() {
  const { id } = useParams();
  const [pestana, setPestana] = useState("datos");
  const [evento, setEvento] = useState(null);
  const [fases, setFases] = useState([]);
  const [error, setError] = useState(null);

  async function recargar() {
    setError(null);
    try {
      setEvento(await eventos.ver(id));
    } catch (e) {
      setError(e);
    }
  }

  useEffect(() => {
    recargar();
    eventos.fases().then(setFases).catch(() => {});
    /* eslint-disable-next-line */
  }, [id]);

  return (
    <div style={{ display: "grid", gap: "var(--esp-5)" }}>
      <div>
        <Link to="/" style={{ fontSize: 13, color: "var(--color-ink-2)", textDecoration: "none" }}>
          ← Eventos
        </Link>
        <h2 style={{ margin: "var(--esp-2) 0 0", fontSize: 22, fontWeight: 600 }}>
          {evento?.nombre ?? (error ? "No se pudo abrir" : "…")}
        </h2>
      </div>

      <Aviso error={error} />

      <div style={{ display: "flex", gap: "var(--esp-5)", borderBottom: "1px solid var(--color-line)" }}>
        {PESTANAS.map(([id_, titulo]) => {
          const activa = id_ === pestana;
          return (
            <button key={id_} type="button" onClick={() => setPestana(id_)} style={{
              background: "none", border: "none", cursor: "pointer", fontFamily: "inherit",
              padding: "0 0 var(--esp-3)", fontSize: 15, marginBottom: -1,
              color: activa ? "var(--color-ink)" : "var(--color-ink-2)",
              fontWeight: activa ? 600 : 400,
              borderBottom: `2px solid ${activa ? "var(--color-ink)" : "transparent"}`,
            }}>{titulo}</button>
          );
        })}
      </div>

      {evento && pestana === "datos" && (
        <Datos evento={evento} fases={fases} alGuardar={recargar} />
      )}
      {evento && pestana === "inscritos" && <Inscritos evento={evento} />}
      {evento && pestana === "proveedores" && <Proveedores evento={evento} />}
    </div>
  );
}

function Datos({ evento, fases, alGuardar }) {
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);

  async function guardar(ev) {
    ev.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      await eventos.corregir(evento.id, normalizar(
        Object.fromEntries(new FormData(ev.target).entries()), NUMERICOS_EVENTO
      ));
      await alGuardar();
    } catch (e) {
      setError(e);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={guardar} style={tarjeta}>
      <div style={{
        background: "var(--color-warn-bg)", color: "var(--color-warn-txt)",
        borderRadius: "var(--radio-control)", padding: "var(--esp-3) var(--esp-4)",
        fontSize: 13, lineHeight: 1.5,
      }}>
        <strong>Corregir reemplaza el evento entero.</strong> Los once campos viajan tal y como
        estén aquí: lo que se deje vacío queda vacío, y eso incluye la fase. No es una edición
        parcial.
      </div>

      <Aviso error={error} />

      <div style={{ display: "grid", gap: "var(--esp-4)", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        {CAMPOS_EVENTO.filter((c) => c !== "estado" && c !== "lugar").map((c) => (
          <Campo key={c} name={c} rotulo={c}
                 defaultValue={evento[c] ?? ""}
                 type={NUMERICOS_EVENTO.includes(c) ? "number" : c === "fecha" ? "date" : "text"}
                 step={["metaVentas", "presupuesto", "gastoReal"].includes(c) ? "0.01" : undefined} />
        ))}

        <label style={{ display: "grid", gap: "var(--esp-1)" }}>
          <span style={{ fontSize: 12, color: "var(--color-ink-2)" }}>estado (fase)</span>
          <select name="estado" defaultValue={evento.estado ?? ""} style={{
            background: "var(--color-surface-2)", color: "var(--color-ink)",
            border: "1px solid var(--color-line)", borderRadius: "var(--radio-control)",
            padding: "9px 12px", fontSize: 14, fontFamily: "inherit",
          }}>
            {fases.map((f, i) => <option key={f} value={f}>{i + 1} · {f}</option>)}
          </select>
          <span style={{ fontSize: 11, color: "var(--color-ink-3)" }}>
            Viaja siempre, aunque no se toque: si faltara, el evento retrocedería a «idea».
          </span>
        </label>

        <Campo name="lugar" rotulo="lugar (id)" defaultValue={evento.lugar ?? ""}
               pista="Vacío = sin sede asignada" />
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Boton type="submit" variante="primario" disabled={guardando}>
          {guardando ? "Reemplazando…" : "Reemplazar"}
        </Boton>
      </div>
    </form>
  );
}

function Inscritos({ evento }) {
  const [filas, setFilas] = useState(null);
  const [resumen, setResumen] = useState(null);
  const [error, setError] = useState(null);
  const [rechazando, setRechazando] = useState(null);

  async function recargar() {
    setError(null);
    try {
      const [lista, r] = await Promise.all([
        inscritos.listar(evento.id), inscritos.resumen(evento.id),
      ]);
      setFilas(lista);
      setResumen(r);
    } catch (e) { setError(e); setFilas([]); }
  }
  useEffect(() => { recargar(); /* eslint-disable-next-line */ }, [evento.id]);

  async function validar(f) {
    setError(null);
    try { await inscritos.validar(evento.id, f.id, null); await recargar(); }
    catch (e) { setError(e); }
  }

  async function rechazar(ev) {
    ev.preventDefault();
    const motivo = new FormData(ev.target).get("motivo");
    setError(null);
    try {
      await inscritos.rechazar(evento.id, rechazando.id, motivo);
      setRechazando(null);
      await recargar();
    } catch (e) { setError(e); }
  }

  return (
    <div style={{ display: "grid", gap: "var(--esp-4)" }}>
      <Aviso error={error} />

      {resumen && (
        <div style={{ ...tarjeta, gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", display: "grid" }}>
          {[
            ["inscritos", resumen.inscritos],
            ["validados", resumen.validados],
            ["por validar", resumen.porValidar],
            ["rechazados", resumen.rechazados],
            ["recaudado S/", resumen.recaudadoSoles],
          ].map(([r, v]) => (
            <div key={r} style={{ display: "grid", gap: 2 }}>
              <span style={{ fontSize: 11, color: "var(--color-ink-2)" }}>{r}</span>
              <span className="cifras" style={{ fontSize: 20, fontWeight: 600 }}><Celda valor={v} /></span>
            </div>
          ))}
          <div style={{ display: "grid", gap: 2 }}>
            <span style={{ fontSize: 11, color: "var(--color-ink-2)" }}>validados SIN monto</span>
            <span className="cifras" style={{
              fontSize: 20, fontWeight: 600,
              color: resumen.validadosSinMonto > 0 ? "var(--color-warn-txt)" : "var(--color-ink)",
            }}>{resumen.validadosSinMonto}</span>
            {/* ⚠️ No es un fallo de la respuesta: son pagos dados por buenos sin
                anotar cuánto entró. Es lo que hay que perseguir, y por eso se
                pinta aparte y en ámbar cuando hay alguno. */}
            {resumen.validadosSinMonto > 0 && (
              <span style={{ fontSize: 11, color: "var(--color-ink-3)" }}>pagos sin cuánto entró</span>
            )}
          </div>
        </div>
      )}

      {rechazando && (
        <form onSubmit={rechazar} style={tarjeta}>
          <strong style={{ fontSize: 15 }}>Rechazar el pago</strong>
          <Campo name="motivo" rotulo="motivo" required
                 pista="Obligatorio. Un rechazo sin motivo escrito deja a alguien fuera sin poder reclamar." />
          <div style={{ display: "flex", gap: "var(--esp-2)", justifyContent: "flex-end" }}>
            <Boton type="button" variante="fantasma" onClick={() => setRechazando(null)}>Cancelar</Boton>
            <Boton type="submit" variante="primario">Rechazar</Boton>
          </div>
        </form>
      )}

      <div style={{ ...tarjeta, padding: 0, display: "block" }}>
        {filas?.length === 0 && (
          <div style={{ padding: "var(--esp-5)", textAlign: "center", color: "var(--color-ink-2)" }}>
            Nadie inscrito todavía
          </div>
        )}
        {filas?.length > 0 && (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <tbody>
              {filas.map((f) => (
                <tr key={f.id}>
                  <td style={celda}><Celda valor={f.estadoDePago} /></td>
                  <td style={celda} className="cifras">S/ <Celda valor={f.montoPagado} /></td>
                  <td style={celda}><Celda valor={f.motivoDelRechazo} /></td>
                  <td style={{ ...celda, textAlign: "right", whiteSpace: "nowrap" }}>
                    {f.estadoDePago === "POR_VALIDAR" && !rechazando && (
                      <>
                        <Boton variante="fantasma" onClick={() => setRechazando(f)}
                               style={{ padding: "4px 10px", fontSize: 13 }}>Rechazar</Boton>
                        <Boton variante="primario" onClick={() => validar(f)}
                               style={{ padding: "4px 10px", fontSize: 13, marginLeft: 8 }}>Validar</Boton>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Proveedores({ evento }) {
  const [filas, setFilas] = useState(null);
  const [resumen, setResumen] = useState(null);
  const [catalogo, setCatalogo] = useState([]);
  const [error, setError] = useState(null);
  const [contratando, setContratando] = useState(false);

  async function recargar() {
    setError(null);
    try {
      const [lista, r] = await Promise.all([
        proveedoresDelEvento.listar(evento.id), proveedoresDelEvento.resumen(evento.id),
      ]);
      setFilas(lista); setResumen(r);
    } catch (e) { setError(e); setFilas([]); }
  }
  useEffect(() => {
    recargar();
    catalogoProveedores.listar().then(setCatalogo).catch(() => {});
    /* eslint-disable-next-line */
  }, [evento.id]);

  async function contratar(ev) {
    ev.preventDefault();
    const d = Object.fromEntries(new FormData(ev.target).entries());
    setError(null);
    try {
      await proveedoresDelEvento.contratar(evento.id, {
        proveedor: d.proveedor || null,
        concepto: d.concepto || null,
        costoAcordado: d.costoAcordado ? Number(d.costoAcordado) : null,
        notas: d.notas || null,
      });
      setContratando(false);
      await recargar();
    } catch (e) { setError(e); }
  }

  return (
    <div style={{ display: "grid", gap: "var(--esp-4)" }}>
      <Aviso error={error} />

      {resumen && (
        <div style={{ ...tarjeta, display: "flex", gap: "var(--esp-5)" }}>
          {[["contratos", resumen.contratos], ["comprometido S/", resumen.comprometido],
            ["sin precio cerrado", resumen.sinPrecioCerrado]].map(([r, v]) => (
            <div key={r} style={{ display: "grid", gap: 2 }}>
              <span style={{ fontSize: 11, color: "var(--color-ink-2)" }}>{r}</span>
              <span className="cifras" style={{ fontSize: 20, fontWeight: 600 }}><Celda valor={v} /></span>
            </div>
          ))}
        </div>
      )}

      {contratando ? (
        <form onSubmit={contratar} style={tarjeta}>
          <strong style={{ fontSize: 15 }}>Contratar a un proveedor</strong>
          <div style={{ display: "grid", gap: "var(--esp-4)", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
            <label style={{ display: "grid", gap: "var(--esp-1)" }}>
              <span style={{ fontSize: 12, color: "var(--color-ink-2)" }}>proveedor</span>
              <select name="proveedor" required style={{
                background: "var(--color-surface-2)", color: "var(--color-ink)",
                border: "1px solid var(--color-line)", borderRadius: "var(--radio-control)",
                padding: "9px 12px", fontSize: 14, fontFamily: "inherit",
              }}>
                <option value="">—</option>
                {catalogo.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </label>
            <Campo name="concepto" rotulo="concepto"
                   pista="Si el mismo proveedor va dos veces, cada fila dice QUÉ surte." />
            <Campo name="costoAcordado" rotulo="costoAcordado" type="number" step="0.01" />
            <Campo name="notas" rotulo="notas" />
          </div>
          <div style={{ display: "flex", gap: "var(--esp-2)", justifyContent: "flex-end" }}>
            <Boton type="button" variante="fantasma" onClick={() => setContratando(false)}>Cancelar</Boton>
            <Boton type="submit" variante="primario">Contratar</Boton>
          </div>
        </form>
      ) : (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Boton variante="primario" onClick={() => setContratando(true)}>Contratar</Boton>
        </div>
      )}

      <div style={{ ...tarjeta, padding: 0, display: "block" }}>
        {filas?.length === 0 && (
          <div style={{ padding: "var(--esp-5)", textAlign: "center", color: "var(--color-ink-2)" }}>
            Ningún proveedor contratado
          </div>
        )}
        {filas?.length > 0 && (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <tbody>
              {filas.map((f) => (
                <tr key={f.id}>
                  <td style={celda}><Celda valor={f.concepto} /></td>
                  <td style={celda} className="cifras">S/ <Celda valor={f.costoAcordado} /></td>
                  <td style={celda}><Celda valor={f.notas} /></td>
                </tr>
              ))}
            </tbody>
          </table>
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

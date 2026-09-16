import { useEffect, useState } from "react";
import { meta, enlaces, colaboradores } from "../datos/ajustes.js";
import { enlaceDe } from "../datos/enlacePublico.js";
import { EMPRESA } from "../nucleo/instancia.js";
import { Boton, Campo, Aviso, Celda } from "../ui/piezas.jsx";

/* ============================================================================
   Fase 5 · Ajustes · la conexión con Meta y los enlaces de equipo.
   ========================================================================= */

export default function Ajustes() {
  return (
    <div style={{ display: "grid", gap: "var(--esp-5)" }}>
      <Meta />
      <Enlaces />
    </div>
  );
}

function Meta() {
  const [c, setC] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => { meta.conexion().then(setC).catch(setError); }, []);

  return (
    <section style={tarjeta}>
      <h2 style={titulo}>CONEXIÓN CON META</h2>
      <Aviso error={error} />
      {!c && !error && <span style={{ color: "var(--color-ink-2)" }}>Comprobando…</span>}
      {c && (
        <>
          <div style={{ display: "flex", gap: "var(--esp-5)", flexWrap: "wrap" }}>
            <Semaforo rotulo="credenciales" si={c.hayCredenciales} />
            <Semaforo rotulo="Meta contesta" si={c.metaContesta} />
            <div style={{ display: "grid", gap: 2 }}>
              <span style={{ fontSize: 11, color: "var(--color-ink-2)" }}>cuenta</span>
              <span style={{ fontSize: 15 }}><Celda valor={c.cuenta} /></span>
            </div>
            <div style={{ display: "grid", gap: 2 }}>
              <span style={{ fontSize: 11, color: "var(--color-ink-2)" }}>campañas visibles</span>
              <span className="cifras" style={{ fontSize: 15 }}><Celda valor={c.campanasVisibles} /></span>
            </div>
          </div>
          {/* ⚠️ Lo que hace útil este endpoint no es el booleano: es esta frase.
              El backend ya dice qué hacer, así que la pantalla no la reescribe. */}
          <div style={{
            background: "var(--color-surface-2)", borderRadius: "var(--radio-control)",
            padding: "var(--esp-3) var(--esp-4)", fontSize: 13, lineHeight: 1.5,
            color: "var(--color-ink-2)",
          }}>{c.queHacer}</div>
        </>
      )}
    </section>
  );
}

function Semaforo({ rotulo, si }) {
  return (
    <div style={{ display: "grid", gap: 2 }}>
      <span style={{ fontSize: 11, color: "var(--color-ink-2)" }}>{rotulo}</span>
      <span style={{
        fontSize: 13, fontWeight: 600,
        color: si ? "var(--color-ok-txt)" : "var(--color-warn-txt)",
      }}>{si ? "sí" : "no"}</span>
    </div>
  );
}

function Enlaces() {
  const [equipo, setEquipo] = useState(null);
  const [colaborador, setColaborador] = useState("");
  const [aRevocar, setARevocar] = useState("");
  const [emitido, setEmitido] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [error, setError] = useState(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => { colaboradores.listar().then(setEquipo).catch(() => setEquipo([])); }, []);

  async function emitir() {
    setError(null); setAviso(null);
    try {
      setEmitido(await enlaces.emitir(colaborador.trim() || null));
      setColaborador("");
      setCopiado(false);
    } catch (e) { setError(e); }
  }

  async function revocar() {
    setError(null); setAviso(null);
    try {
      await enlaces.revocar(aRevocar.trim());
      setAviso(`Enlace ${aRevocar.trim()} revocado.`);
      setARevocar("");
    } catch (e) { setError(e); }
  }

  return (
    <section style={tarjeta}>
      <h2 style={titulo}>ENLACES DE EQUIPO</h2>

      {/* ⚠️ EL TOKEN, LA ÚNICA VEZ QUE EXISTE FUERA DEL SISTEMA.
          En la base vive solo su resumen: nadie puede recuperarlo después, ni
          soporte. Por eso el aviso es lo más grande de la pantalla y por eso
          cerrarlo lo pierde de verdad — no se guarda en ningún sitio. */}
      {emitido && (
        <div style={{
          background: "var(--color-inv)", color: "var(--color-inv-ink)",
          borderRadius: "var(--radio-tarjeta)", padding: "var(--esp-5)",
          display: "grid", gap: "var(--esp-3)",
        }}>
          <strong style={{ fontSize: 15 }}>
            Ésta es la única vez que vas a ver este enlace
          </strong>
          <p style={{ margin: 0, fontSize: 13, opacity: 0.85, lineHeight: 1.5 }}>
            No se guarda en ningún sitio: en la base solo vive su resumen. Si se pierde, no se
            recupera — se emite otro. Cópialo y mándaselo a quien va dirigido.
          </p>
          {/* ⚠️ Se copia el ENLACE ENTERO, no el token pelado, desde la fase 7.
              Antes salía el token solo y quien lo emitía tenía que fabricar la
              dirección a mano — o mandarlo tal cual, que no lleva a ninguna
              parte. La construye `enlaceDe`, la misma función que lee la
              pantalla pública: si la ruta cambiara, cambian las dos a la vez. */}
          <p style={{ margin: 0, fontSize: 13, opacity: 0.85, lineHeight: 1.5 }}>
            Se abre <b>una sola vez y en un solo teléfono</b>: el primero que lo abra se
            queda con él. Mándaselo directamente a esa persona, no a un grupo.
          </p>
          <code style={{
            fontFamily: "var(--fuente-mono)", fontSize: 15, wordBreak: "break-all",
            background: "rgba(0,0,0,0.25)", padding: "var(--esp-3)",
            borderRadius: "var(--radio-chico)",
          }}>{enlaceDe(EMPRESA, emitido.token)}</code>
          <div style={{ display: "flex", gap: "var(--esp-3)", alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, opacity: 0.75 }}>
              caduca el <b>{String(emitido.expiraEl).slice(0, 10)}</b>
            </span>
            <span style={{ fontSize: 12, opacity: 0.6, marginLeft: "auto" }}>
              id {emitido.id}
            </span>
            <Boton variante="invertidoClaro"
                   onClick={() => {
                     navigator.clipboard?.writeText(enlaceDe(EMPRESA, emitido.token));
                     setCopiado(true);
                   }}
                   style={{ background: "var(--color-inv-ink)", color: "var(--color-inv)",
                            border: "none" }}>
              {copiado ? "Copiado" : "Copiar"}
            </Boton>
            <Boton onClick={() => setEmitido(null)}
                   style={{ background: "transparent", color: "inherit",
                            border: "1px solid rgba(255,255,255,0.25)" }}>
              Ya lo tengo
            </Boton>
          </div>
        </div>
      )}

      <Aviso error={error} />
      {aviso && (
        <div style={{
          background: "var(--color-ok-bg)", color: "var(--color-ok-txt)",
          borderRadius: "var(--radio-control)", padding: "var(--esp-3) var(--esp-4)", fontSize: 14,
        }}>{aviso}</div>
      )}

      <div style={{ display: "grid", gap: "var(--esp-4)",
                    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
        <div style={{ display: "grid", gap: "var(--esp-3)" }}>
          <label style={{ display: "grid", gap: "var(--esp-1)" }}>
            <span style={{ fontSize: 12, color: "var(--color-ink-2)" }}>
              emitir para el colaborador
            </span>
            <select value={colaborador} onChange={(e) => setColaborador(e.target.value)}
                    style={{
                      background: "var(--color-surface-2)", color: "var(--color-ink)",
                      border: "1px solid var(--color-line)", borderRadius: "var(--radio-control)",
                      padding: "9px 12px", fontSize: 14, fontFamily: "inherit",
                    }}>
              <option value="">—</option>
              {(equipo ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}{c.rolLabel ? ` · ${c.rolLabel}` : ""}{c.area ? ` · ${c.area}` : ""}
                </option>
              ))}
            </select>
            {/* ⚠️ El semáforo se enseña, no se usa para filtrar. A quien está en
                `crit` es a quien más falta hace escuchar, y un enlace de equipo
                es precisamente para escuchar. */}
            {colaborador && equipo && (
              <Estado de={equipo.find((c) => c.id === colaborador)?.estado} />
            )}
            {equipo?.length === 0 && (
              <span style={{ fontSize: 11, color: "var(--color-ink-3)" }}>
                No hay colaboradores en esta empresa todavía.
              </span>
            )}
          </label>
          <Boton variante="primario" disabled={!colaborador.trim()} onClick={emitir}>
            Emitir enlace
          </Boton>
        </div>

        <div style={{ display: "grid", gap: "var(--esp-3)" }}>
          <Campo rotulo="revocar el enlace (id)"
                 value={aRevocar} onChange={(e) => setARevocar(e.target.value)}
                 pista="Revocar dos veces el mismo sigue valiendo. Uno que no existe se dice." />
          <Boton disabled={!aRevocar.trim()} onClick={revocar}>Revocar</Boton>
        </div>
      </div>
    </section>
  );
}

/**
 * El semáforo de esa persona. ⚠️ Informa, no bloquea.
 *
 * `estado` es del tipo `semaforo` —ok/warn/crit—, NO un «activo/inactivo».
 * Leerlo como lo segundo y esconder a quien está en `crit` dejaría fuera justo
 * a las personas por las que se pregunta.
 */
function Estado({ de }) {
  if (!de) return null;
  const segun = {
    ok: ["var(--color-ok-bg)", "var(--color-ok-txt)", "su semáforo está en verde"],
    warn: ["var(--color-warn-bg)", "var(--color-warn-txt)", "su semáforo está en ámbar"],
    crit: ["var(--color-crit-bg, var(--color-warn-bg))", "var(--color-crit-txt, var(--color-warn-txt))",
           "su semáforo está en rojo — razón de más para escucharle"],
  }[de];
  if (!segun) return null;
  return (
    <span style={{
      background: segun[0], color: segun[1], fontSize: 11, marginTop: 2,
      borderRadius: "var(--radio-pildora)", padding: "2px 10px", justifySelf: "start",
    }}>{segun[2]}</span>
  );
}

const tarjeta = {
  background: "var(--color-surface)", border: "1px solid var(--color-line)",
  borderRadius: "var(--radio-tarjeta)", padding: "var(--esp-5)",
  display: "grid", gap: "var(--esp-4)",
};
const titulo = {
  fontSize: 13, fontWeight: 600, letterSpacing: "0.04em", margin: 0,
  color: "var(--color-ink-2)",
};

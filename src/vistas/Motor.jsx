import { useState } from "react";
import { motor, OPERACIONES } from "../datos/motor.js";
import { Boton, Campo, Aviso, Celda } from "../ui/piezas.jsx";
import Cronometro from "../ui/Cronometro.jsx";

/* ============================================================================
   Fase 4 · El motor de IA.
   ----------------------------------------------------------------------------
   ⚠️ LA ÚNICA PANTALLA DE LA APLICACIÓN QUE GASTA DINERO
   ------------------------------------------------------
   Eso decide toda su forma:

   · **El primario es «Ver qué haría»**, la corrida en seco. Gastar es una
     segunda acción, deliberada y con su propio aviso. Si el botón que cobra
     fuera el más fácil de pulsar, se pulsaría por costumbre.
   · **No se reintenta solo.** Un reintento automático de algo que cobra es
     cobrar dos veces. Si falla, lo vuelve a pedir una persona.
   · **Lo que costó se enseña**, y si el backend no pudo calcularlo se dice —no
     se pinta un cero, que afirmaría que fue gratis.
   · **El cronómetro no es una barra**: ver `ui/Cronometro.jsx`.
   ========================================================================= */

const SUELE_TARDAR = { diagnosticar: 40, planificar: 30, redactar: 35, ilustrar: 90 };

export default function Motor() {
  const [abierta, setAbierta] = useState(null);

  return (
    <div style={{ display: "grid", gap: "var(--esp-5)" }}>
      <div style={{
        background: "var(--color-surface-2)", border: "1px solid var(--color-line)",
        borderRadius: "var(--radio-tarjeta)", padding: "var(--esp-4)",
        fontSize: 13, color: "var(--color-ink-2)", lineHeight: 1.55,
      }}>
        <strong style={{ color: "var(--color-ink)" }}>Estas cuatro operaciones cuestan dinero.</strong>{" "}
        Cada una llama a un proveedor de IA y paga por lo que pide. Por eso todas empiezan por una
        corrida <b>en seco</b>: enseña qué se va a pedir sin pagarlo. Gastar es siempre un segundo
        paso, y nunca se reintenta solo.
      </div>

      {OPERACIONES.map((o) => (
        <Operacion
          key={o.id} operacion={o}
          abierta={abierta === o.id}
          alAbrir={() => setAbierta(abierta === o.id ? null : o.id)}
        />
      ))}
    </div>
  );
}

function Operacion({ operacion, abierta, alAbrir }) {
  const [encargo, setEncargo] = useState("");
  const [campana, setCampana] = useState("");
  const [esFinal, setEsFinal] = useState(false);
  const [corriendo, setCorriendo] = useState(null); // null | {desde, seco}
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);

  const necesitaEncargo = operacion.id === "redactar";
  const necesitaCampana = operacion.id === "ilustrar";
  const listo = (!necesitaEncargo || encargo.trim().length >= 10)
    && (!necesitaCampana || campana.trim().length > 0);

  async function correr(seco) {
    setCorriendo({ desde: Date.now(), seco });
    setResultado(null);
    setError(null);
    try {
      const r = await motor[operacion.id]({ seco, encargo, campana, esFinal });
      setResultado({ ...r, seco });
    } catch (e) {
      /* ⚠️ Se enseña y se para. No hay reintento: lo vuelve a pedir una persona. */
      setError(e);
    } finally {
      setCorriendo(null);
    }
  }

  return (
    <div style={{
      background: "var(--color-surface)", border: "1px solid var(--color-line)",
      borderRadius: "var(--radio-tarjeta)", overflow: "hidden",
    }}>
      <button type="button" onClick={alAbrir} style={{
        width: "100%", background: "none", border: "none", cursor: "pointer",
        fontFamily: "inherit", textAlign: "left", padding: "var(--esp-4) var(--esp-5)",
        color: "var(--color-ink)", display: "grid", gap: 4,
      }}>
        <span style={{ fontSize: 16, fontWeight: 600 }}>
          <span style={{ color: "var(--color-ink-3)", marginRight: 10 }}>{abierta ? "▾" : "▸"}</span>
          {operacion.titulo}
        </span>
        <span style={{ fontSize: 13, color: "var(--color-ink-2)", paddingLeft: 26 }}>
          {operacion.queHace}
        </span>
      </button>

      {abierta && (
        <div style={{
          borderTop: "1px solid var(--color-line)", padding: "var(--esp-5)",
          display: "grid", gap: "var(--esp-4)",
        }}>
          <span style={{ fontSize: 12, color: "var(--color-ink-3)" }}>{operacion.exige}</span>

          {necesitaEncargo && (
            <Campo rotulo="encargo" value={encargo} onChange={(e) => setEncargo(e.target.value)}
                   pista="Al menos diez caracteres: el modelo necesita saber de qué va." />
          )}
          {necesitaCampana && (
            <>
              <Campo rotulo="campaña redactada (id)" value={campana}
                     onChange={(e) => setCampana(e.target.value)}
                     pista="Primero se escribe, luego se ilustra." />
              {/* ⚠️ VEINTITRÉS VECES DE DIFERENCIA. No es una casilla más. */}
              <label style={{
                display: "flex", gap: "var(--esp-3)", alignItems: "flex-start",
                background: esFinal ? "var(--color-warn-bg)" : "var(--color-surface-2)",
                border: "1px solid var(--color-line)", borderRadius: "var(--radio-control)",
                padding: "var(--esp-3) var(--esp-4)", cursor: "pointer",
              }}>
                <input type="checkbox" checked={esFinal}
                       onChange={(e) => setEsFinal(e.target.checked)} style={{ marginTop: 3 }} />
                <span style={{ fontSize: 13, lineHeight: 1.5,
                               color: esFinal ? "var(--color-warn-txt)" : "var(--color-ink-2)" }}>
                  <b>Definitivo</b> en vez de boceto. El modelo bueno cuesta
                  {" "}<b>veintitrés veces más</b> que el barato, así que se dice a propósito y
                  no se supone.
                </span>
              </label>
            </>
          )}

          {corriendo ? (
            <div style={{
              display: "flex", alignItems: "center", gap: "var(--esp-4)",
              background: "var(--color-surface-2)", borderRadius: "var(--radio-control)",
              padding: "var(--esp-4)",
            }}>
              <Cronometro desde={corriendo.desde} sueleTardar={SUELE_TARDAR[operacion.id]} />
              <span style={{ fontSize: 13, color: "var(--color-ink-2)" }}>
                {corriendo.seco
                  ? "Corriendo en seco. Esto no paga nada."
                  : "Corriendo de verdad. Esto está pagando."}
              </span>
            </div>
          ) : (
            <div style={{ display: "flex", gap: "var(--esp-2)", justifyContent: "flex-end",
                          alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, color: "var(--color-ink-3)", marginRight: "auto" }}>
                Gastar es el segundo botón, y a propósito.
              </span>
              <Boton variante="secundario" disabled={!listo} onClick={() => correr(false)}>
                Correr y pagar
              </Boton>
              {/* El único primario: el que NO cobra. */}
              <Boton variante="primario" disabled={!listo} onClick={() => correr(true)}>
                Ver qué haría
              </Boton>
            </div>
          )}

          <Aviso error={error} />
          {resultado && <Resultado id={operacion.id} r={resultado} />}
        </div>
      )}
    </div>
  );
}

/** Lo que devolvió. Cada operación cuenta cosas distintas. */
function Resultado({ id, r }) {
  const filas = {
    diagnosticar: [
      ["afirmaciones leídas", r.afirmacionesLeidas], ["de un total de", r.afirmacionesTotales],
      ["hallazgos", r.hallazgos], ["rebajados", r.rebajados],
      ["descartados sin evidencia", r.descartadosSinEvidencia], ["reemplazados", r.reemplazados],
    ],
    planificar: [
      ["hallazgos leídos", r.hallazgosLeidos], ["frentes", r.frentes],
      ["excluidos sin evidencia", r.excluidosSinEvidencia], ["huérfanos", r.huerfanos],
      ["sin responsable real", r.sinResponsableReal],
    ],
    redactar: [
      ["presupuesto diario", r.presupuestoDiario],
      ["palabras prohibidas coladas", r.palabrasProhibidasColadas?.length],
      ["titulares largos", r.titularesLargos?.length],
    ],
    ilustrar: [
      ["hechas", r.hechas?.length], ["fallidas", r.fallidas?.length],
      ["recortadas", r.recortadas], ["segundos", r.segundos],
    ],
  }[id] ?? [];

  const costo = r.costoUsd ?? r.costoIaUsd ?? null;

  return (
    <div style={{
      background: "var(--color-surface-2)", border: "1px solid var(--color-line)",
      borderRadius: "var(--radio-control)", padding: "var(--esp-4)",
      display: "grid", gap: "var(--esp-3)",
    }}>
      <div style={{ display: "flex", gap: "var(--esp-3)", alignItems: "center" }}>
        <strong style={{ fontSize: 14 }}>
          {r.seco ? "Esto es lo que haría" : "Hecho"}
        </strong>
        {r.seco && (
          <span style={{
            background: "var(--color-info-bg)", color: "var(--color-info-txt)",
            borderRadius: "var(--radio-pildora)", padding: "2px 10px", fontSize: 11, fontWeight: 600,
          }}>en seco · no se pagó nada</span>
        )}
        {r.modelo && (
          <span style={{ fontSize: 12, color: "var(--color-ink-3)", marginLeft: "auto" }}>
            {r.modelo}
          </span>
        )}
      </div>

      <div style={{ display: "grid", gap: "var(--esp-3)",
                    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
        {filas.filter(([, v]) => v !== undefined).map(([rotulo, valor]) => (
          <div key={rotulo} style={{ display: "grid", gap: 2 }}>
            <span style={{ fontSize: 11, color: "var(--color-ink-2)" }}>{rotulo}</span>
            <span className="cifras" style={{ fontSize: 18, fontWeight: 600 }}>
              <Celda valor={valor} />
            </span>
          </div>
        ))}
      </div>

      {/* ⚠️ El coste. Nulo NO se pinta como cero: diría que fue gratis. */}
      {!r.seco && (
        <div style={{ borderTop: "1px solid var(--color-line)", paddingTop: "var(--esp-3)",
                      fontSize: 13, color: "var(--color-ink-2)" }}>
          {costo !== null && costo !== undefined
            ? <>Costó <b className="cifras" style={{ color: "var(--color-ink)" }}>US$ {costo}</b></>
            : <>No se pudo calcular cuánto costó. <span style={{ color: "var(--color-ink-3)" }}>
                La llamada se pagó igual: lo que falta es la tarifa de ese modelo.</span></>}
        </div>
      )}

      {r.nota && (
        <div style={{ fontSize: 13, color: "var(--color-ink-2)", lineHeight: 1.5 }}>{r.nota}</div>
      )}

      {r.fallidas?.length > 0 && (
        <div style={{ display: "grid", gap: 4, fontSize: 13, color: "var(--color-warn-txt)" }}>
          {r.fallidas.map((f) => (
            <div key={f.angulo}>ángulo {f.angulo + 1}: {f.error}</div>
          ))}
        </div>
      )}
    </div>
  );
}

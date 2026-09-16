import { useState } from "react";
import { MOTIVO_MINIMO } from "../../datos/consola.js";
import { Boton } from "../../ui/piezas.jsx";

/* ============================================================================
   Las piezas de la consola, y una regla que NO se puede saltar por descuido.
   ----------------------------------------------------------------------------
   Viven aquí y no en `ui/piezas.jsx` porque son de esta aplicación: un semáforo
   de empresas no tiene ningún sentido en la pantalla de un cliente, que solo se
   ve a sí mismo.
   ========================================================================= */

/**
 * ⚠️ LA SALUD Y SU FECHA, O NINGUNA DE LAS DOS.
 *
 * El backend lo dice en su javadoc: *«la salud se dice SIEMPRE con su fecha al
 * lado, y nunca una sin la otra. Un “al día” sin cuándo miente en cuanto pasa
 * una hora, y quien lee la consola no tiene forma de saberlo»*.
 *
 * Por eso esto es un componente y no dos campos sueltos en una tabla: para
 * pintar la salud hay que pasar por aquí, y aquí las dos van juntas. Si algún
 * día llega una salud sin fecha, se dice que no se sabe — no se calla.
 */
export function Salud({ salud, comprobadaEl }) {
  if (salud === "sin_instancia") {
    return (
      <span style={{ color: "var(--color-ink-3)", fontStyle: "italic" }}>
        sin instancia
      </span>
    );
  }
  return (
    <span style={{ display: "grid", gap: 1 }}>
      <span>{salud}</span>
      <span style={{ fontSize: 11, color: "var(--color-ink-3)" }} className="cifras">
        {comprobadaEl
          ? `mirado ${hace(comprobadaEl)}`
          /* No se calla ni se inventa: una salud sin fecha es justo el caso del
             que avisa el backend, y lo que hay que hacer es decirlo. */
          : <span style={{ color: "var(--color-warn-txt)" }}>sin fecha de comprobación</span>}
      </span>
    </span>
  );
}

/**
 * ⚠️ EL PLANO DE CONTROL Y EL ENRUTADOR, LADO A LADO Y SIN FUNDIR.
 *
 * Hermano de D11. El backend: *«lo que dice el plano de control y lo que hace
 * el enrutador AHORA MISMO son dos cosas, y pueden diferir —entre una
 * suspensión y su commit, o si el catálogo no pudo conectar—. Se enseñan las
 * dos: que difieran es el dato»*.
 *
 * Así que aquí no hay un semáforo único. Un solo indicador tendría que elegir a
 * cuál de los dos creer, y el día que discrepan es justo el día que alguien
 * necesita mirar esta pantalla.
 */
export function Estado({ estado, enrutandoAhora, motivoSiNoEnruta }) {
  const discrepan = (estado === "activa") !== enrutandoAhora;
  return (
    <span style={{ display: "grid", gap: 2 }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <i style={{
          width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
          background: estado === "activa" ? "var(--color-ok)"
            : estado === "cerrada" ? "var(--color-ink-3)" : "var(--color-warn)",
        }} />
        <span>{estado}</span>
      </span>
      <span style={{ fontSize: 11, color: discrepan ? "var(--color-warn-txt)" : "var(--color-ink-3)" }}>
        {enrutandoAhora ? "enrutando" : "no enruta"}
        {motivoSiNoEnruta ? ` · ${motivoSiNoEnruta}` : ""}
      </span>
      {discrepan && (
        /* No es un fallo de la respuesta: es LA información. Se dice con
           palabras, no con un icono de alarma que invite a «arreglarlo». */
        <span style={{ fontSize: 11, color: "var(--color-warn-txt)", lineHeight: 1.4 }}>
          El plano dice «{estado}» y el enrutador hace otra cosa. Que difieran es el dato.
        </span>
      )}
    </span>
  );
}

/**
 * Pide el motivo de una transición y no deja seguir sin él.
 *
 * ⚠️ El mínimo lo impone el servidor —*«una suspensión sin motivo es
 * indistinguible de un error»*—. Aquí se adelanta para no gastar un viaje, pero
 * el que manda sigue siendo él: si discreparan, lo que se pinta es su 400.
 */
export function ConMotivo({ que, aviso, peligroso, alConfirmar, alCancelar, ocupado }) {
  const [motivo, setMotivo] = useState("");
  const [eco, setEco] = useState("");
  const corto = motivo.trim().length < MOTIVO_MINIMO;

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); alConfirmar(motivo.trim()); }}
      style={{
        display: "grid", gap: "var(--esp-4)",
        border: `1px solid ${peligroso ? "var(--color-warn-txt)" : "var(--color-line)"}`,
        background: peligroso ? "var(--color-warn-bg)" : "var(--color-surface-2)",
        borderRadius: "var(--radio-tarjeta)", padding: "var(--esp-5)",
      }}
    >
      <strong style={{ fontSize: 15, color: peligroso ? "var(--color-warn-txt)" : "inherit" }}>
        {que}
      </strong>
      {aviso && (
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5,
                    color: peligroso ? "var(--color-warn-txt)" : "var(--color-ink-2)" }}>
          {aviso}
        </p>
      )}

      <label style={{ display: "grid", gap: "var(--esp-1)" }}>
        <span style={{ fontSize: 12, color: "var(--color-ink-2)" }}>
          motivo — queda escrito en la historia, con tu firma
        </span>
        <textarea
          value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={2} autoFocus
          placeholder="Por qué se hace, para quien lo lea dentro de seis meses"
          style={{
            background: "var(--color-surface)", color: "var(--color-ink)",
            border: "1px solid var(--color-line)", borderRadius: "var(--radio-control)",
            padding: "9px 12px", fontSize: 14, fontFamily: "inherit", resize: "vertical",
          }}
        />
        <span style={{ fontSize: 11, color: corto ? "var(--color-warn-txt)" : "var(--color-ink-3)" }}>
          {corto
            ? `Faltan ${MOTIVO_MINIMO - motivo.trim().length} caracteres. Un motivo sin escribir hace que esto sea indistinguible de un error.`
            : "Suficiente."}
        </span>
      </label>

      {peligroso && (
        /* ⚠️ Escribir la clave a mano, y no una casilla de «entiendo». Cerrar es
           terminal: `cerrada` no admite ninguna transición. Un botón que no se
           puede deshacer no puede estar a una pulsación de distancia. */
        <label style={{ display: "grid", gap: "var(--esp-1)" }}>
          <span style={{ fontSize: 12, color: "var(--color-warn-txt)" }}>
            escribe <b>{peligroso}</b> para confirmar que sabes a quién estás cerrando
          </span>
          <input
            value={eco} onChange={(e) => setEco(e.target.value)}
            style={{
              background: "var(--color-surface)", color: "var(--color-ink)",
              border: "1px solid var(--color-line)", borderRadius: "var(--radio-control)",
              padding: "9px 12px", fontSize: 14, fontFamily: "var(--fuente-mono)",
            }}
          />
        </label>
      )}

      <div style={{ display: "flex", gap: "var(--esp-2)", justifyContent: "flex-end" }}>
        <Boton type="button" variante="fantasma" onClick={alCancelar}>Cancelar</Boton>
        <Boton type="submit" variante="primario"
               disabled={ocupado || corto || (peligroso && eco !== peligroso)}>
          {ocupado ? "Haciéndolo…" : que}
        </Boton>
      </div>
    </form>
  );
}

/** Hace cuánto, en palabras. La fecha entera va en el `title`. */
export function hace(cuando) {
  const ms = Date.now() - new Date(cuando).getTime();
  if (Number.isNaN(ms)) return String(cuando);
  const min = Math.round(ms / 60000);
  if (min < 1) return "hace un momento";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.round(h / 24)} d`;
}

export const celda = {
  padding: "var(--esp-3) var(--esp-4)",
  borderBottom: "1px solid var(--color-line)",
  verticalAlign: "top",
};

/* ============================================================================
   Las piezas mínimas, vestidas con Obsidian Kinpaku.
   ----------------------------------------------------------------------------
   NO es la biblioteca: los 25 componentes de RENASER OS viven en el repositorio
   anterior y se traerán cuando haga falta. Esto es lo justo para que Logística
   se pueda mirar, escrito contra los mismos tokens para que el día que lleguen
   los buenos no haya que reescribir nada de vuelta.

   Se respetan dos reglas del sistema:
   · Un solo botón primario por estado visible.
   · El semáforo es el único color, y solo cuando informa.
   ========================================================================= */

export function Boton({ variante = "secundario", children, ...props }) {
  const pieles = {
    primario: { background: "var(--color-ink)", color: "var(--color-bg)", border: "1px solid var(--color-ink)" },
    secundario: { background: "transparent", color: "var(--color-ink)", border: "1px solid var(--color-line)" },
    fantasma: { background: "transparent", color: "var(--color-ink-2)", border: "1px solid transparent" },
  };
  return (
    <button
      {...props}
      style={{
        ...pieles[variante], borderRadius: "var(--radio-control)",
        padding: "8px 14px", fontSize: 14, fontWeight: 500, cursor: "pointer",
        fontFamily: "inherit", transition: `opacity var(--mov-rapido) var(--mov-curva)`,
        opacity: props.disabled ? 0.45 : 1, ...props.style,
      }}
    >{children}</button>
  );
}

export function Campo({ rotulo, pista, ...props }) {
  return (
    <label style={{ display: "grid", gap: "var(--esp-1)" }}>
      <span style={{ fontSize: 12, color: "var(--color-ink-2)" }}>{rotulo}</span>
      <input
        {...props}
        style={{
          background: "var(--color-surface-2)", color: "var(--color-ink)",
          border: "1px solid var(--color-line)", borderRadius: "var(--radio-control)",
          padding: "9px 12px", fontSize: 14, fontFamily: "inherit", ...props.style,
        }}
      />
      {pista && <span style={{ fontSize: 11, color: "var(--color-ink-3)" }}>{pista}</span>}
    </label>
  );
}

/**
 * ⚠️ TRES ESTADOS, NO DOS. Es la pieza que justifica empezar por Logística.
 *
 * `recontratar` admite nulo, y ese nulo es el dato: «todavía no se ha decidido».
 * Una casilla de dos posiciones convertiría «no lo hemos hablado» en «lo
 * descartamos», que es una decisión que nadie tomó. El backend lo documenta en
 * `Proveedor` y por eso el campo es Boolean y no boolean.
 */
export function TresEstados({ rotulo, valor, alCambiar }) {
  const opciones = [
    [null, "sin decidir"],
    [true, "sí"],
    [false, "no"],
  ];
  return (
    <div style={{ display: "grid", gap: "var(--esp-1)" }}>
      <span style={{ fontSize: 12, color: "var(--color-ink-2)" }}>{rotulo}</span>
      <div style={{ display: "flex", gap: "var(--esp-1)" }}>
        {opciones.map(([v, texto]) => {
          const puesto = valor === v;
          return (
            <button
              key={String(v)} type="button" onClick={() => alCambiar(v)}
              style={{
                flex: 1, padding: "8px 6px", fontSize: 13, fontFamily: "inherit",
                cursor: "pointer", borderRadius: "var(--radio-chico)",
                border: `1px solid ${puesto ? "var(--color-ink)" : "var(--color-line)"}`,
                background: puesto ? "var(--color-surface-3, var(--color-surface-2))" : "transparent",
                color: puesto ? "var(--color-ink)" : "var(--color-ink-2)",
                fontWeight: puesto ? 600 : 400,
              }}
            >{texto}</button>
          );
        })}
      </div>
      {valor === null && (
        <span style={{ fontSize: 11, color: "var(--color-ink-3)" }}>
          Nadie lo ha decidido todavía. No es un «no».
        </span>
      )}
    </div>
  );
}

/** El error del backend, con su pareja título/detalle. Nunca se inventa texto. */
export function Aviso({ error }) {
  if (!error) return null;
  const generico = error.esGenerico;
  return (
    <div style={{
      border: "1px solid var(--color-warn-bg)", background: "var(--color-warn-bg)",
      color: "var(--color-warn-txt)", borderRadius: "var(--radio-control)",
      padding: "var(--esp-3) var(--esp-4)", display: "grid", gap: 4, fontSize: 14,
    }}>
      <strong style={{ fontWeight: 600 }}>
        {error.titulo ?? (generico ? `El backend contestó ${error.estado}` : "No se pudo")}
      </strong>
      {error.detalle && <span style={{ opacity: 0.9, lineHeight: 1.45 }}>{error.detalle}</span>}
      {generico && (
        <span style={{ opacity: 0.7, fontSize: 12 }}>
          Esta respuesta no la escribió el backend: la rechazó el marco antes de llegar.
        </span>
      )}
    </div>
  );
}

/** «Dato faltante», nunca un cero ni un guion mudo. */
export function Celda({ valor }) {
  if (valor === null || valor === undefined || valor === "") {
    return <span style={{ color: "var(--color-ink-3)", fontStyle: "italic" }}>sin dato</span>;
  }
  if (valor === true) return "sí";
  if (valor === false) return "no";
  return String(valor);
}

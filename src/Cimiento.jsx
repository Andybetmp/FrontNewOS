/* ============================================================================
   La pantalla del cimiento, vestida con «Tinta sobre neutro».
   ----------------------------------------------------------------------------
   Sigue las reglas del sistema aunque sea una pantalla de paso, porque es donde
   se comprueba que el sistema funciona:

   · Monocromo. La jerarquía sale del bloque invertido, del peso y del
     contraste — nunca de un color corporativo.
   · El semáforo es el ÚNICO color, y solo cuando informa: aquí marca si una
     comprobación salió bien, mal o a medias. En ningún otro sitio.
   · Cero botones primarios: es una superficie de pura lectura, y el sistema lo
     permite explícitamente para esos casos.
   ========================================================================= */

function Chip({ como }) {
  const segun = {
    bien: ["var(--color-ok-bg)", "var(--color-ok-txt)", "bien"],
    mal: ["var(--color-warn-bg)", "var(--color-warn-txt)", "mal"],
    aviso: ["var(--color-info-bg)", "var(--color-info-txt)", "a medias"],
  }[como] ?? ["var(--color-info-bg)", "var(--color-info-txt)", "—"];

  return (
    <span style={{
      background: segun[0], color: segun[1],
      borderRadius: "var(--radio-pildora)",
      padding: "2px 10px", fontSize: 12, fontWeight: 600,
      whiteSpace: "nowrap",
    }}>{segun[2]}</span>
  );
}

function Dato({ rotulo, children }) {
  return (
    <div style={{ display: "grid", gap: "var(--esp-1)" }}>
      <div style={{ fontSize: 12, color: "var(--color-ink-3, #6A6A65)", letterSpacing: "0.02em" }}>
        {rotulo}
      </div>
      <div style={{ fontSize: 15 }}>{children}</div>
    </div>
  );
}

export default function Cimiento({
  empresa, backend, instancia, fallo, comprobaciones, cargando, navegacion, QUE_ENSENAR,
}) {
  return (
    <div style={{ minHeight: "100%", display: "grid", gridTemplateRows: "auto 1fr" }}>

      {/* El bloque invertido: así crea jerarquía este sistema, sin color de marca. */}
      <header style={{
        background: "var(--color-inv)", color: "var(--color-inv-ink)",
        padding: "var(--esp-5) var(--esp-5)",
      }}>
        <div style={{ maxWidth: 880, margin: "0 auto" }}>
          <div style={{ fontSize: 12, opacity: 0.7, letterSpacing: "0.04em" }}>RENASER OS</div>
          <h1 style={{ margin: "var(--esp-1) 0 0", fontSize: 26, fontWeight: 600, letterSpacing: "-0.01em" }}>
            Estado del cimiento
          </h1>
          <p style={{ margin: "var(--esp-2) 0 0", opacity: 0.75, fontSize: 14, maxWidth: 560 }}>
            Fase 0. Esta pantalla no es del producto: está para que un cimiento
            no se dé por bueno sin mirarlo. Se borra con la primera vista real.
          </p>
        </div>
      </header>

      <main style={{ padding: "var(--esp-5)", maxWidth: 880, margin: "0 auto", width: "100%" }}>

        <section style={{
          background: "var(--color-surface)", border: "1px solid var(--color-line)",
          borderRadius: "var(--radio-tarjeta)", padding: "var(--esp-5)",
          display: "grid", gap: "var(--esp-4)",
        }}>
          <div style={{ display: "grid", gap: "var(--esp-4)", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            <Dato rotulo="Empresa que se abre">
              <span className="cifras">{empresa}</span>
            </Dato>
            <Dato rotulo="Backend (mismo origen, por el proxy)">
              <code style={{ fontFamily: "var(--fuente-mono)", fontSize: 13 }}>{backend}</code>
            </Dato>
            <Dato rotulo="Navegación que se pintaría">
              {navegacion === QUE_ENSENAR.nada
                ? "ninguna · no hay sesión todavía"
                : navegacion}
            </Dato>
          </div>

          {instancia && (
            <div style={{
              borderTop: "1px solid var(--color-line)", paddingTop: "var(--esp-4)",
              display: "grid", gap: "var(--esp-4)", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            }}>
              <Dato rotulo="Se llama">{instancia.nombre}</Dato>
              <Dato rotulo="Su Supabase vive en">
                <code style={{ fontFamily: "var(--fuente-mono)", fontSize: 13 }}>{instancia.urlApi}</code>
              </Dato>
              <Dato rotulo="Llave pública">
                {/* Es pública por diseño y aun así no se enseña entera: no hace
                    falta para nada y llena la pantalla de ruido. */}
                <code style={{ fontFamily: "var(--fuente-mono)", fontSize: 13 }}>
                  {instancia.clavePublica.slice(0, 8)}…
                </code>
              </Dato>
            </div>
          )}

          {fallo && (
            <div style={{
              borderTop: "1px solid var(--color-line)", paddingTop: "var(--esp-4)",
              color: "var(--color-warn-txt)", fontSize: 14, lineHeight: 1.5,
            }}>
              {fallo.message}
            </div>
          )}
        </section>

        <h2 style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.04em",
                     margin: "var(--esp-5) 0 var(--esp-3)", color: "var(--color-ink)" }}>
          COMPROBACIONES CONTRA EL BACKEND
        </h2>

        <div style={{
          background: "var(--color-surface)", border: "1px solid var(--color-line)",
          borderRadius: "var(--radio-tarjeta)", overflow: "hidden",
        }}>
          {cargando && (
            <div style={{ padding: "var(--esp-4)", fontSize: 14, opacity: 0.6 }}>
              Preguntando…
            </div>
          )}
          {comprobaciones.map((c, i) => (
            <div key={c.que} style={{
              padding: "var(--esp-4)",
              borderTop: i === 0 ? "none" : "1px solid var(--color-line)",
              display: "grid", gap: "var(--esp-2)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--esp-3)", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 500 }}>{c.que}</span>
                <Chip como={c.como} />
              </div>
              <div style={{ fontSize: 14, color: "var(--color-ink)", opacity: 0.8 }}>{c.dice}</div>
              {c.detalle && (
                /* El `detail` del backend, entero y sin traducir. Es el sitio
                   donde se ve que el contrato de errores llega vivo. */
                <div style={{ fontSize: 13, opacity: 0.6, lineHeight: 1.5 }}>{c.detalle}</div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

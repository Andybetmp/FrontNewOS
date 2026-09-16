import { useEffect, useState } from "react";
import { planes } from "../../datos/consola.js";
import { Boton, Campo, Aviso } from "../../ui/piezas.jsx";
import { celda } from "./piezas.jsx";

/* ============================================================================
   Los planes. Lo primero que hay que poder crear.
   ----------------------------------------------------------------------------
   El backend cuenta por qué existe esta pantalla: hasta el 9 de septiembre de
   2026 no había forma de crear un plan por la API, y como dar de alta una
   empresa exige una clave de plan que exista, **una instalación nueva no podía
   dar de alta a su primer cliente sin que alguien entrara a la base a mano**.

   ⚠️ NO SE BORRAN NI SE RENOMBRAN, Y NO ES QUE FALTE EL BOTÓN
   -----------------------------------------------------------
   Un plan tiene empresas colgando: borrarlo las dejaría apuntando a nada, y
   cambiarle la clave las dejaría apuntando a otra cosa sin que nadie lo pidiera.
   Si un plan deja de ofrecerse, se crea el nuevo y se dejan de dar altas con el
   viejo; las empresas que ya lo tienen siguen con lo que contrataron.

   Por eso aquí solo hay listar y crear. Se dice en la pantalla, para que nadie
   lo lea como una pantalla a medio hacer.
   ========================================================================= */

export default function Planes() {
  const [filas, setFilas] = useState(null);
  const [error, setError] = useState(null);
  const [creando, setCreando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  async function recargar() {
    setError(null);
    try {
      setFilas(await planes.listar());
    } catch (e) {
      setError(e);
      setFilas([]);
    }
  }

  useEffect(() => { recargar(); }, []);

  async function crear(evento) {
    evento.preventDefault();
    setGuardando(true);
    setError(null);
    const d = Object.fromEntries(new FormData(evento.target).entries());
    try {
      await planes.crear({
        clave: d.clave?.trim(),
        nombre: d.nombre?.trim(),
        /* ⚠️ Vacío viaja NULO, que es «sin límite». Mandar cero diría «no cabe
           nadie», y el backend lo rechaza justamente para que nadie escriba uno
           creyendo que dice lo primero. */
        limitePersonas: d.limitePersonas === "" ? null : Number(d.limitePersonas),
      });
      setCreando(false);
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

      {creando ? (
        <form onSubmit={crear} style={{
          background: "var(--color-surface)", border: "1px solid var(--color-line)",
          borderRadius: "var(--radio-tarjeta)", padding: "var(--esp-5)",
          display: "grid", gap: "var(--esp-4)",
        }}>
          <strong style={{ fontSize: 16 }}>Nuevo plan</strong>
          <div style={{ display: "grid", gap: "var(--esp-4)",
                        gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
            <Campo name="clave" rotulo="clave" required
                   pista="minúsculas, dígitos y guiones. No se cambia después" />
            <Campo name="nombre" rotulo="nombre" required pista="lo que ve una persona" />
            <Campo name="limitePersonas" rotulo="límite de personas" type="number" min="1"
                   pista="déjalo vacío para «sin límite». Un cero diría que no cabe nadie" />
          </div>
          <div style={{ display: "flex", gap: "var(--esp-2)", justifyContent: "flex-end" }}>
            <Boton type="button" variante="fantasma" onClick={() => setCreando(false)}>Cancelar</Boton>
            <Boton type="submit" variante="primario" disabled={guardando}>
              {guardando ? "Creando…" : "Crear"}
            </Boton>
          </div>
        </form>
      ) : (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--esp-4)" }}>
          <span style={{ fontSize: 12, color: "var(--color-ink-3)", lineHeight: 1.5, maxWidth: "52ch" }}>
            Un plan no se borra ni se renombra: hay empresas colgando de su clave.
            Si uno deja de ofrecerse, se crea el nuevo y se dejan de dar altas con el viejo.
          </span>
          <Boton variante="primario" onClick={() => setCreando(true)}>Nuevo plan</Boton>
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
          <div style={{ padding: "var(--esp-6, 32px) var(--esp-5)", textAlign: "center" }}>
            <div style={{ fontSize: 15 }}>No hay ningún plan</div>
            <div style={{ fontSize: 13, color: "var(--color-ink-3)", marginTop: 6, lineHeight: 1.5 }}>
              Y sin plan no se puede dar de alta a nadie. Es lo primero que hay que crear.
            </div>
          </div>
        )}
        {filas?.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr>
                  {["clave", "nombre", "límite de personas"].map((c) => (
                    <th key={c} style={{
                      textAlign: "left", padding: "var(--esp-3) var(--esp-4)", fontSize: 12,
                      fontWeight: 600, color: "var(--color-ink-2)",
                      borderBottom: "1px solid var(--color-line)", whiteSpace: "nowrap",
                    }}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filas.map((p) => (
                  <tr key={p.clave}>
                    <td style={{ ...celda, fontFamily: "var(--fuente-mono)", fontSize: 13 }}>{p.clave}</td>
                    <td style={celda}>{p.nombre}</td>
                    <td style={celda}>
                      {/* Nulo y cero no son lo mismo, y aquí la diferencia cuesta
                          dinero: se escribe con palabras, no con un guion. */}
                      {p.limitePersonas == null
                        ? <span style={{ color: "var(--color-ink-3)", fontStyle: "italic" }}>sin límite</span>
                        : <span className="cifras">{p.limitePersonas}</span>}
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

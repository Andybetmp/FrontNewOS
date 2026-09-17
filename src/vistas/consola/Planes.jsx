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

   ⚠️ NO SE RENOMBRAN, Y SOLO SE BORRA EL QUE NO TIENE A NADIE
   -----------------------------------------------------------
   Un plan CON empresas no se borra: las dejaría apuntando a nada. Si deja de
   ofrecerse, se crea el nuevo y se dejan de dar altas con el viejo; quien ya lo
   tiene sigue con lo que contrató. El backend lo rechaza con un 409 que dice
   **cuántas** empresas lo impiden, y esa cifra es la que permite decidir sin
   salir a averiguarla.

   ⚠️ Pero uno con CERO empresas sí se borra, desde el 17-09. Antes no había
   forma, y eso convertía un error de tecleo —la clave tampoco se puede cambiar—
   en un renglón permanente del desplegable del alta. Se vio con 21 planes de
   prueba que no se podían retirar.

   Renombrar sigue sin existir, y eso sí es a propósito: cambiar la clave dejaría
   a las empresas apuntando a otra cosa sin que nadie lo pidiera.
   ========================================================================= */

/**
 * Borrar un plan · con confirmación, y sin prometer que va a poder.
 *
 * ⚠️ El botón se ofrece SIEMPRE, no solo cuando se puede. La ficha de un plan no
 * dice cuántas empresas lo tienen —y añadir ese recuento solo para pintar o no
 * un botón sería pedirle al backend un dato para una decisión de la pantalla—.
 * Así que aquí se pide, y si no se puede, lo que llega es el 409 del servidor
 * diciendo cuántas lo impiden. Eso es más útil que un botón gris sin explicación.
 */
function Borrar({ clave, alBorrar, alFallar }) {
  const [pidiendo, setPidiendo] = useState(false);
  const [borrando, setBorrando] = useState(false);

  if (!pidiendo) {
    return (
      <Boton variante="fantasma" onClick={() => setPidiendo(true)}
             style={{ fontSize: 13, padding: "4px 8px" }}>Borrar</Boton>
    );
  }
  return (
    <span style={{ display: "inline-flex", gap: "var(--esp-2)", alignItems: "center" }}>
      <span style={{ fontSize: 12, color: "var(--color-ink-3)" }}>¿seguro?</span>
      <Boton variante="fantasma" onClick={() => setPidiendo(false)}
             style={{ fontSize: 13, padding: "4px 8px" }}>No</Boton>
      <Boton disabled={borrando}
             onClick={async () => {
               setBorrando(true);
               alFallar(null);
               try {
                 await planes.borrar(clave);
                 await alBorrar();
               } catch (e) {
                 alFallar(e);
                 setPidiendo(false);
               } finally {
                 setBorrando(false);
               }
             }}
             style={{ fontSize: 13, padding: "4px 8px",
                      borderColor: "var(--color-warn-txt)", color: "var(--color-warn-txt)" }}>
        {borrando ? "…" : "Sí, borrar"}
      </Boton>
    </span>
  );
}

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
            Un plan con empresas no se borra ni se renombra: hay clientes colgando de su clave.
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
                  <th style={{ borderBottom: "1px solid var(--color-line)" }} />
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
                    <td style={{ ...celda, textAlign: "right" }}>
                      <Borrar clave={p.clave} alBorrar={recargar} alFallar={setError} />
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

import { useEffect, useState } from "react";
import { lugares, proveedores, CAMPOS_LUGAR, CAMPOS_PROVEEDOR } from "../datos/logistica.js";
import { Boton, Campo, TresEstados, Aviso, Celda } from "../ui/piezas.jsx";

/* ============================================================================
   Fase 1 · Los dos catálogos de logística.
   ----------------------------------------------------------------------------
   La elegimos primera no por importante, sino porque es la más simple que
   ejercita TODO: resolver la empresa, listar, dar de alta, corregir con el
   contrato de reemplazo, y enseñar un error explicado. Si el cimiento está mal,
   se ve aquí en un día en vez de en tres semanas.
   ========================================================================= */

const CATALOGOS = {
  lugares: {
    titulo: "Lugares",
    api: lugares,
    campos: CAMPOS_LUGAR,
    columnas: ["nombre", "ciudad", "aforo", "tipo", "contacto"],
    numericos: ["aforo", "precio"],
  },
  proveedores: {
    titulo: "Proveedores",
    api: proveedores,
    campos: CAMPOS_PROVEEDOR,
    columnas: ["nombre", "ciudad", "calidad", "recontratar", "contacto"],
    numericos: ["precio", "calidad"],
  },
};

/** Lo que el formulario manda: números como números, vacío como NULO. */
function normalizar(valores, numericos) {
  const salida = {};
  for (const [k, v] of Object.entries(valores)) {
    if (v === "" || v === undefined) {
      /* ⚠️ Vacío va NULO, no cadena vacía. En este producto un nulo significa
         «no se sabe» y una cadena vacía significaría «se sabe, y es nada». */
      salida[k] = null;
    } else if (numericos.includes(k)) {
      const n = Number(v);
      salida[k] = Number.isFinite(n) ? n : null;
    } else {
      salida[k] = v;
    }
  }
  return salida;
}

export default function Logistica() {
  const [cual, setCual] = useState("lugares");
  const [filas, setFilas] = useState(null);
  const [error, setError] = useState(null);
  const [editando, setEditando] = useState(null); // null | {} (alta) | fila (corrección)
  const [guardando, setGuardando] = useState(false);

  const cat = CATALOGOS[cual];

  async function recargar() {
    setError(null);
    setFilas(null);
    try {
      setFilas(await cat.api.listar());
    } catch (e) {
      setError(e);
      setFilas([]);
    }
  }

  useEffect(() => { recargar(); /* eslint-disable-next-line */ }, [cual]);

  async function guardar(evento) {
    evento.preventDefault();
    const datos = normalizar(
      Object.fromEntries(new FormData(evento.target).entries()),
      cat.numericos
    );
    /* `recontratar` no viaja en el FormData: son tres estados y vive en su
       propio control. Se añade a mano, incluido el nulo. */
    if (cat.campos.includes("recontratar")) {
      datos.recontratar = editando.recontratar ?? null;
    }
    setGuardando(true);
    setError(null);
    try {
      if (editando.id) {
        await cat.api.corregir(editando.id, datos);
      } else {
        await cat.api.crear(datos);
      }
      setEditando(null);
      await recargar();
    } catch (e) {
      setError(e);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: "var(--esp-5)" }}>

      {/* Pestañas: el sistema dice que una pestaña activa NO es una acción, así
          que se marca con subrayado y peso, nunca con un botón primario. */}
      <div style={{ display: "flex", gap: "var(--esp-5)", borderBottom: "1px solid var(--color-line)" }}>
        {Object.entries(CATALOGOS).map(([id, c]) => {
          const activa = id === cual;
          return (
            <button
              key={id} type="button"
              onClick={() => { setCual(id); setEditando(null); }}
              style={{
                background: "none", border: "none", cursor: "pointer", fontFamily: "inherit",
                padding: "0 0 var(--esp-3)", fontSize: 15,
                color: activa ? "var(--color-ink)" : "var(--color-ink-2)",
                fontWeight: activa ? 600 : 400,
                borderBottom: `2px solid ${activa ? "var(--color-ink)" : "transparent"}`,
                marginBottom: -1,
              }}
            >{c.titulo}</button>
          );
        })}
      </div>

      <Aviso error={error} />

      {editando ? (
        <form onSubmit={guardar} style={{
          background: "var(--color-surface)", border: "1px solid var(--color-line)",
          borderRadius: "var(--radio-tarjeta)", padding: "var(--esp-5)",
          display: "grid", gap: "var(--esp-4)",
        }}>
          <div style={{ display: "grid", gap: 4 }}>
            <strong style={{ fontSize: 16 }}>
              {editando.id ? `Corregir «${editando.nombre}»` : `Nuevo en ${cat.titulo.toLowerCase()}`}
            </strong>
            {editando.id && (
              /* ⚠️ Se dice, porque cambia lo que hace el formulario. */
              <span style={{ fontSize: 12, color: "var(--color-ink-3)", lineHeight: 1.5 }}>
                Corregir <b>reemplaza el registro entero</b>: lo que se deje vacío queda vacío.
                No es una edición parcial.
              </span>
            )}
          </div>

          <div style={{ display: "grid", gap: "var(--esp-4)", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            {cat.campos.filter((c) => c !== "recontratar").map((c) => (
              <Campo
                key={c} name={c} rotulo={c}
                defaultValue={editando[c] ?? ""}
                type={cat.numericos.includes(c) ? "number" : "text"}
                step={c === "precio" ? "0.01" : undefined}
              />
            ))}
            {cat.campos.includes("recontratar") && (
              <TresEstados
                rotulo="recontratar"
                valor={editando.recontratar ?? null}
                alCambiar={(v) => setEditando({ ...editando, recontratar: v })}
              />
            )}
          </div>

          <div style={{ display: "flex", gap: "var(--esp-2)", justifyContent: "flex-end" }}>
            <Boton type="button" variante="fantasma" onClick={() => setEditando(null)}>
              Cancelar
            </Boton>
            {/* El único primario de este estado visible. */}
            <Boton type="submit" variante="primario" disabled={guardando}>
              {guardando ? "Guardando…" : editando.id ? "Reemplazar" : "Dar de alta"}
            </Boton>
          </div>
        </form>
      ) : (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Boton variante="primario" onClick={() => setEditando({})}>
            Nuevo
          </Boton>
        </div>
      )}

      <div style={{
        background: "var(--color-surface)", border: "1px solid var(--color-line)",
        borderRadius: "var(--radio-tarjeta)", overflow: "hidden",
      }}>
        {filas === null && (
          <div style={{ padding: "var(--esp-4)", color: "var(--color-ink-2)", fontSize: 14 }}>
            Cargando…
          </div>
        )}
        {filas?.length === 0 && !error && (
          <div style={{ padding: "var(--esp-5)", textAlign: "center", color: "var(--color-ink-2)" }}>
            <div style={{ fontSize: 15, marginBottom: 4 }}>Todavía no hay {cat.titulo.toLowerCase()}</div>
            <div style={{ fontSize: 13, color: "var(--color-ink-3)" }}>
              Nada que enseñar no es lo mismo que un error: aquí no ha fallado nada.
            </div>
          </div>
        )}
        {filas?.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr>
                  {cat.columnas.map((c) => (
                    <th key={c} style={{
                      textAlign: "left", padding: "var(--esp-3) var(--esp-4)",
                      fontSize: 12, fontWeight: 600, color: "var(--color-ink-2)",
                      borderBottom: "1px solid var(--color-line)", whiteSpace: "nowrap",
                    }}>{c}</th>
                  ))}
                  <th style={{ borderBottom: "1px solid var(--color-line)" }} />
                </tr>
              </thead>
              <tbody>
                {filas.map((f) => (
                  <tr key={f.id}>
                    {cat.columnas.map((c) => (
                      <td key={c} className={cat.numericos.includes(c) ? "cifras" : undefined}
                          style={{ padding: "var(--esp-3) var(--esp-4)", borderBottom: "1px solid var(--color-line)" }}>
                        <Celda valor={f[c]} />
                      </td>
                    ))}
                    <td style={{ padding: "var(--esp-2) var(--esp-4)", borderBottom: "1px solid var(--color-line)", textAlign: "right" }}>
                      <Boton variante="fantasma" onClick={() => setEditando(f)}
                             style={{ padding: "4px 10px", fontSize: 13 }}>
                        Corregir
                      </Boton>
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

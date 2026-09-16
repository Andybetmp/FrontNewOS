import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { empresas, porQueNo } from "../../datos/consola.js";
import { Boton, Campo, Aviso, Celda } from "../../ui/piezas.jsx";
import { Salud, Estado, ConMotivo, celda, hace } from "./piezas.jsx";

/* ============================================================================
   La ficha de un cliente: lo que se sabe de él y lo que se le puede hacer.
   ----------------------------------------------------------------------------
   ⚠️ NO SE OFRECEN BOTONES QUE NO CABEN, Y TAMPOCO SE ESCONDEN SIN DECIR NADA
   ---------------------------------------------------------------------------
   Un botón que contesta 409 al pulsarlo es una promesa incumplida; uno que
   desaparece sin explicación deja a quien mira preguntándose si le faltan
   permisos. Se dice lo que cabe y, de lo que no, por qué no.

   ⚠️ Y QUÉ CABE LO DICE LA FICHA, NO ESTA PANTALLA
   ------------------------------------------------
   `ficha.transiciones` trae las tres con `cabe` y con `desde`, calculadas por el
   mismo `Transicion` del backend que las impide. Aquí no hay ninguna tabla de
   estados: si la hubiera, sería una segunda verdad, y el día que discrepara la
   pantalla ofrecería algo que el servidor rechaza —o escondería algo que sí se
   podía— sin que nadie lo notara.

   Lo único que queda escrito aquí es CÓMO SE CUENTA cada una: su rótulo, su
   aviso, y cuál se pinta como peligrosa. Eso no es una regla de negocio y el
   backend no tiene opinión sobre ello.
   ========================================================================= */

/**
 * Cómo se cuenta cada transición. ⚠️ NO qué se permite: eso lo dice la ficha.
 *
 * Se indexa por `cual`, que es el nombre que manda el backend y también el
 * segmento de su URL. Hay un caso en la suite del backend que lo vigila.
 */
const COMO_SE_CUENTA = {
  suspension: {
    que: "Suspender",
    aviso: "Deja de enrutar inmediatamente. Quien esté dentro pierde el acceso en cuanto "
      + "termine lo que esté haciendo, y sus peticiones le dirán que la empresa está "
      + "suspendida, con este motivo.",
    hacer: empresas.suspender,
  },
  reactivacion: {
    que: "Reactivar",
    aviso: "Vuelve a enrutar. Lo que estaba guardado sigue estando: suspender no borra nada.",
    hacer: empresas.reactivar,
  },
  cierre: {
    que: "Cerrar",
    /* Que sea la peligrosa es un juicio sobre cómo presentarla, no sobre si se
       permite. El backend dice lo segundo; lo primero es de esta pantalla. */
    peligroso: true,
    aviso: "Esto es DEFINITIVO. Una empresa cerrada no admite ninguna transición: no se "
      + "reactiva, no se vuelve a abrir. Deja de enrutar y se queda así para siempre.",
    hacer: empresas.cerrar,
  },
};

export default function Empresa() {
  const { clave } = useParams();

  const [ficha, setFicha] = useState(null);
  const [historia, setHistoria] = useState(null);
  const [error, setError] = useState(null);
  const [pidiendo, setPidiendo] = useState(null);   // qué acción se está confirmando
  const [ocupado, setOcupado] = useState(false);

  const recargar = useCallback(async () => {
    setError(null);
    try {
      const [f, h] = await Promise.all([empresas.ver(clave), empresas.historia(clave)]);
      setFicha(f);
      setHistoria(h);
    } catch (e) {
      setError(e);
    }
  }, [clave]);

  useEffect(() => { recargar(); }, [recargar]);

  async function mover(accion, motivo) {
    setOcupado(true);
    setError(null);
    try {
      setFicha(await accion.hacer(clave, motivo));
      setPidiendo(null);
      /* La historia cambió: se vuelve a pedir. Una anotación que no aparece
         hasta recargar a mano hace dudar de si se guardó. */
      setHistoria(await empresas.historia(clave));
    } catch (e) {
      setError(e);
    } finally {
      setOcupado(false);
    }
  }

  if (!ficha) {
    return (
      <div style={{ display: "grid", gap: "var(--esp-4)" }}>
        <Aviso error={error} />
        {!error && <span style={{ color: "var(--color-ink-2)" }}>Cargando…</span>}
        <Link to="/" style={{ color: "var(--color-ink-2)", fontSize: 13 }}>← Todos los clientes</Link>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: "var(--esp-5)" }}>
      <Link to="/" style={{ color: "var(--color-ink-2)", fontSize: 13, textDecoration: "none" }}>
        ← Todos los clientes
      </Link>

      <Aviso error={error} />

      <header style={{ display: "grid", gap: 4 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>{ficha.nombre}</h1>
        <span style={{ fontFamily: "var(--fuente-mono)", fontSize: 13, color: "var(--color-ink-3)" }}>
          {ficha.clave}
        </span>
      </header>

      <div style={{
        background: "var(--color-surface)", border: "1px solid var(--color-line)",
        borderRadius: "var(--radio-tarjeta)", padding: "var(--esp-5)",
        display: "grid", gap: "var(--esp-5)",
        gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
      }}>
        <Dato rotulo="estado y enrutado">
          <Estado estado={ficha.estado} enrutandoAhora={ficha.enrutandoAhora}
                  motivoSiNoEnruta={ficha.motivoSiNoEnruta} />
        </Dato>
        <Dato rotulo="salud">
          <Salud salud={ficha.salud} comprobadaEl={ficha.saludComprobadaEl} />
        </Dato>
        <Dato rotulo="dada de alta">
          <span title={String(ficha.altaEl)}>{hace(ficha.altaEl)}</span>
        </Dato>
      </div>

      {/* ---- lo que se le puede hacer ---- */}
      {pidiendo ? (
        <ConMotivo
          que={pidiendo.que} aviso={pidiendo.aviso} ocupado={ocupado}
          peligroso={pidiendo.peligroso ? ficha.clave : null}
          alConfirmar={(motivo) => mover(pidiendo, motivo)}
          alCancelar={() => setPidiendo(null)}
        />
      ) : (
        <section style={{ display: "grid", gap: "var(--esp-3)" }}>
          <div className="rotulo" style={{ fontSize: 12, color: "var(--color-ink-2)" }}>
            Transiciones
          </div>
          <div style={{ display: "flex", gap: "var(--esp-2)", flexWrap: "wrap" }}>
            {ficha.transiciones.filter((t) => t.cabe).map((t) => (
              <Boton key={t.cual} onClick={() => setPidiendo(conSuTexto(t))}
                     style={COMO_SE_CUENTA[t.cual]?.peligroso
                       ? { borderColor: "var(--color-warn-txt)", color: "var(--color-warn-txt)" }
                       : undefined}>
                {COMO_SE_CUENTA[t.cual]?.que ?? t.cual}
              </Boton>
            ))}
          </div>
          {/* Y de lo que no cabe, por qué — con la lista `desde` que manda el
              propio backend, no con una regla escrita aquí. */}
          {ficha.transiciones.filter((t) => !t.cabe).map((t) => (
            <span key={t.cual} style={{ fontSize: 12, color: "var(--color-ink-3)", lineHeight: 1.45 }}>
              <b style={{ fontWeight: 600 }}>{COMO_SE_CUENTA[t.cual]?.que ?? t.cual}</b>
              {" — "}{porQueNo(t, ficha.estado, ficha.transiciones)}
            </span>
          ))}
        </section>
      )}

      <Administrador clave={ficha.clave} />

      {/* ---- lo que se le hizo ---- */}
      <section style={{ display: "grid", gap: "var(--esp-3)" }}>
        <div style={{ fontSize: 12, color: "var(--color-ink-2)" }}>
          Historia — lo más reciente primero
        </div>
        <div style={{
          background: "var(--color-surface)", border: "1px solid var(--color-line)",
          borderRadius: "var(--radio-tarjeta)", overflow: "hidden",
        }}>
          {historia?.length === 0 && (
            <div style={{ padding: "var(--esp-5)", color: "var(--color-ink-3)", fontSize: 13 }}>
              No se le ha hecho nada todavía.
            </div>
          )}
          {historia?.length > 0 && (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <tbody>
                {historia.map((a, i) => (
                  <tr key={i}>
                    <td style={{ ...celda, whiteSpace: "nowrap", fontWeight: 500 }}>{a.que}</td>
                    <td style={{ ...celda, whiteSpace: "nowrap", fontSize: 13,
                                 color: "var(--color-ink-2)" }} title={String(a.ocurrioEl)}>
                      {hace(a.ocurrioEl)}
                    </td>
                    <td style={{ ...celda, lineHeight: 1.45 }}>
                      {/* El motivo es el dato: por eso ocupa la columna ancha. */}
                      <Celda valor={a.motivo} />
                      <div style={{ fontSize: 11, color: "var(--color-ink-3)",
                                    fontFamily: "var(--fuente-mono)", marginTop: 2 }}>
                        {a.quien ?? "sin firma"}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}

/** Junta lo que el backend dice de una transición con cómo se cuenta aquí. */
function conSuTexto(transicion) {
  return { ...COMO_SE_CUENTA[transicion.cual], cual: transicion.cual };
}

function Dato({ rotulo, children }) {
  return (
    <div style={{ display: "grid", gap: 4, alignContent: "start" }}>
      <span style={{ fontSize: 11, color: "var(--color-ink-3)", letterSpacing: "0.05em",
                     textTransform: "uppercase" }}>{rotulo}</span>
      <span style={{ fontSize: 14 }}>{children}</span>
    </div>
  );
}

/**
 * Dejar entrar al primer administrador.
 *
 * ⚠️ LA CUENTA SE PEGA A MANO, Y NO SE PUEDE ARREGLAR TODAVÍA.
 *
 * Es el mismo agujero que tenía emitir un enlace antes de la fase 5 —un
 * identificador que no se puede buscar desde ninguna parte—, pero aquí no se
 * puede cerrar igual: el identificador es de una cuenta del proveedor de
 * identidad, y **cuál va a ser ese proveedor es una decisión sin tomar**.
 *
 * Así que la pantalla no finge. Lo dice, en vez de dejar un campo desnudo que
 * hace pensar que uno debería saber qué poner.
 */
function Administrador({ clave }) {
  const [abierto, setAbierto] = useState(false);
  const [error, setError] = useState(null);
  const [hecho, setHecho] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  async function dejarEntrar(evento) {
    evento.preventDefault();
    setOcupado(true);
    setError(null);
    setHecho(false);
    const d = Object.fromEntries(new FormData(evento.target).entries());
    try {
      await empresas.darAcceso(clave, d.cuenta?.trim() || null, d.correo?.trim() || null);
      setHecho(true);
      evento.target.reset();
    } catch (e) {
      setError(e);
    } finally {
      setOcupado(false);
    }
  }

  if (!abierto) {
    return (
      <Boton variante="fantasma" onClick={() => setAbierto(true)}
             style={{ justifySelf: "start", paddingLeft: 0 }}>
        Dar acceso a un administrador →
      </Boton>
    );
  }

  return (
    <form onSubmit={dejarEntrar} style={{
      background: "var(--color-surface-2)", border: "1px solid var(--color-line)",
      borderRadius: "var(--radio-tarjeta)", padding: "var(--esp-5)",
      display: "grid", gap: "var(--esp-4)",
    }}>
      <strong style={{ fontSize: 15 }}>Dar acceso a un administrador</strong>
      <Aviso error={error} />
      {hecho && (
        <span style={{ fontSize: 13, color: "var(--color-ok)" }}>
          Dentro. El backend no vuelve hasta comprobarlo con su rol.
        </span>
      )}

      <div style={{ display: "grid", gap: "var(--esp-4)",
                    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}>
        <Campo name="cuenta" rotulo="identificador de la cuenta" required
               style={{ fontFamily: "var(--fuente-mono)", fontSize: 13 }}
               pista="se pega a mano: no hay de dónde listarlo todavía" />
        <Campo name="correo" rotulo="correo" type="email" />
      </div>

      <p style={{ margin: 0, fontSize: 11, color: "var(--color-ink-3)", lineHeight: 1.5 }}>
        Este identificador es de una cuenta del proveedor de identidad, y cuál va
        a ser ese proveedor todavía está sin decidir. Hasta que lo esté, no hay
        ninguna lista de la que elegirlo — así que se copia de donde se creó la
        cuenta. No es un descuido de esta pantalla.
      </p>

      <div style={{ display: "flex", gap: "var(--esp-2)", justifyContent: "flex-end" }}>
        <Boton type="button" variante="fantasma" onClick={() => setAbierto(false)}>Cerrar</Boton>
        <Boton type="submit" variante="primario" disabled={ocupado}>
          {ocupado ? "Dejándole entrar…" : "Dar acceso"}
        </Boton>
      </div>
    </form>
  );
}

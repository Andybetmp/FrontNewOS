import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { abrir, responder, recordar, recordado } from "../datos/enlacePublico.js";
import { Aviso } from "../ui/piezas.jsx";

/* ============================================================================
   Fase 7 · La Caleta. La única pantalla sin cuenta y sin sesión.
   ----------------------------------------------------------------------------
   Quien abre esto llegó desde un WhatsApp, en su teléfono, y no tiene cuenta.
   Eso decide TODA la forma de la pantalla:

   · No hay cabecera de RENASER OS, ni navegación, ni nombre de empresa. Esta
     persona no está «dentro de una aplicación»: le hicieron una pregunta.
   · Una sola columna, y los campos a 16px. Por debajo de eso iOS hace zoom solo
     al enfocar un campo, y la pantalla se descoloca sin que nadie la toque.
   · No se pide nada que no sea la pregunta. Ni correo, ni nombre: el backend ya
     sabe quién es por el token, y preguntárselo sería pedirle que se
     identifique dos veces.

   ⚠️ LA RECARGA ES EL ENEMIGO, Y POR ESO EL TOKEN SE GUARDA
   --------------------------------------------------------
   El enlace se muere al abrirse —lo explica `datos/enlacePublico.js` entero—,
   así que si esta pantalla perdiera el token de sesión, una recarga dejaría
   fuera a la persona para siempre. Se guarda ANTES de pintar nada.

   ⚠️ Y EL TOKEN NO SE QUITA DE LA URL, aunque apetezca
   ----------------------------------------------------
   Lo primero que pide el cuerpo es un `history.replaceState` que limpie el
   token de la barra de direcciones. Sería un error, y de los caros: la URL es
   la ÚNICA pista durable que tiene esta pantalla para reconocer el enlace al
   recargar. Quitarla es perder la llave del cajón donde se guardó la otra.

   Y no hace falta: después de la primera apertura, lo que queda en la URL es un
   token MUERTO. Quien copie esa dirección y la abra en otro teléfono no entra —
   allí no está el de sesión. La URL sola deja de valer en cuanto se usa.
   ========================================================================= */

/** Las seis preguntas, en el orden en que una persona las contestaría. */
const PREGUNTAS = [
  {
    campo: "situacion", rotulo: "¿En qué situación?",
    ejemplo: "Un proveedor no confirma el día antes del evento",
  },
  {
    campo: "senal", rotulo: "¿En qué lo notas?",
    ejemplo: "No contesta el WhatsApp en toda la mañana",
  },
  {
    campo: "reglaPractica", rotulo: "¿Y qué haces tú?", obligatoria: true,
    ejemplo: "Llamo al fijo, y si no contesta activo al suplente de la lista",
  },
  {
    campo: "errorFrecuente", rotulo: "¿En qué se equivoca la gente aquí?",
    ejemplo: "Esperar a la tarde por no molestar",
  },
  {
    campo: "escalamiento", rotulo: "¿Cuándo dejas de resolverlo tú?",
    ejemplo: "Si a las 2 no hay nadie, aviso a coordinación",
  },
];

const VACIO = Object.fromEntries(PREGUNTAS.map((p) => [p.campo, ""]));

export default function EnlacePublico() {
  const { empresa, token } = useParams();

  const [saludo, setSaludo] = useState(null);
  const [cerrado, setCerrado] = useState(null);   // el 401: no hay vuelta atrás
  const [error, setError] = useState(null);       // lo que sí tiene arreglo
  const [valores, setValores] = useState(VACIO);
  const [documentado, setDocumentado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [guardadas, setGuardadas] = useState(0);
  const [gracias, setGracias] = useState(false);
  const [seRecuerda, setSeRecuerda] = useState(true);

  /** El token con el que se habla de verdad. Nunca el de la URL, una vez abierto. */
  const sesion = useRef(null);
  const yaAbrio = useRef(false);

  useEffect(() => {
    /* ⚠️ StrictMode monta dos veces en desarrollo, y cada apertura GASTA uno de
       los 200 usos del enlace. Sin este cerrojo, mirar la pantalla la desgasta. */
    if (yaAbrio.current) return;
    yaAbrio.current = true;

    (async () => {
      /* Si este enlace ya se abrió en este teléfono, el que vale es el guardado:
         el de la URL murió en aquella primera apertura. */
      const guardado = recordado(empresa, token);
      try {
        const a = await abrir(empresa, guardado ?? token);
        if (a.tokenDeSesion) {
          sesion.current = a.tokenDeSesion;
          /* ANTES de pintar nada. Si esto no se guarda, la siguiente recarga la
             deja fuera y no hay forma de recuperarlo. */
          setSeRecuerda(recordar(empresa, token, a.tokenDeSesion));
        } else {
          sesion.current = guardado;
        }
        setGuardadas(a.yaRespondidas);
        setSaludo(a);
      } catch (e) {
        setCerrado(e);
      }
    })();
  }, [empresa, token]);

  async function enviar(evento) {
    evento.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await responder(empresa, sesion.current, { ...valores, documentado });
      /* Se suma aquí y no volviendo a abrir: cada apertura gasta un uso, y este
         número no se está suponiendo — se acaba de escribir la fila. */
      setGuardadas((n) => n + 1);
      setValores(VACIO);
      setDocumentado(false);
      setGracias(true);
    } catch (e) {
      /* ⚠️ Un 401 aquí es distinto de un 400: el enlace dejó de valer a media
         sesión y ya no hay nada que hacer en esta pantalla. */
      if (e.estado === 401) setCerrado(e); else setError(e);
    } finally {
      setEnviando(false);
    }
  }

  if (cerrado) return <Cerrado error={cerrado} />;
  if (!saludo) return <Marco><p style={tenue}>Abriendo…</p></Marco>;

  return (
    <Marco>
      <header style={{ display: "grid", gap: 6 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0, letterSpacing: "-0.01em" }}>
          Hola{saludo.nombre ? `, ${saludo.nombre}` : ""}
        </h1>
        <p style={{ ...tenue, margin: 0 }}>
          {[saludo.puesto, saludo.area].filter(Boolean).join(" · ") || "Gracias por abrir esto"}
        </p>
      </header>

      <p style={{ margin: 0, lineHeight: 1.55, color: "var(--color-ink-2)" }}>
        Queremos guardar lo que sabes hacer y no está escrito en ningún sitio.
        No hace falta que contestes todo: con una sola cosa que hagas bien, ya sirve.
      </p>

      {guardadas > 0 && (
        /* Un número, sin meta: nadie ha dicho cuántas se esperan, y poner una
           barra de progreso sería inventarse el denominador. */
        <p style={{ ...tenue, margin: 0 }}>
          Ya has dejado {guardadas} {guardadas === 1 ? "respuesta" : "respuestas"}.
        </p>
      )}

      {!seRecuerda && (
        <p style={{ ...tenue, margin: 0, color: "var(--color-warn-txt)" }}>
          Este navegador no nos deja recordar la sesión. Puedes contestar ahora,
          pero si cierras la página tendrás que pedir otro enlace.
        </p>
      )}

      {gracias ? (
        <div style={{ ...tarjeta, display: "grid", gap: "var(--esp-3)" }}>
          <strong style={{ fontSize: 17 }}>Guardado. Gracias.</strong>
          <span style={{ ...tenue, lineHeight: 1.5 }}>
            Si se te ocurre otra cosa —otra situación, otro apaño que hagas— puedes dejarla.
          </span>
          <button type="button" onClick={() => setGracias(false)} style={botonPrimario}>
            Contar otra cosa
          </button>
        </div>
      ) : (
        <form onSubmit={enviar} style={{ display: "grid", gap: "var(--esp-5)" }}>
          <Aviso error={error} />

          {PREGUNTAS.map((p) => (
            <Pregunta
              key={p.campo} {...p} valor={valores[p.campo]}
              alCambiar={(v) => setValores((x) => ({ ...x, [p.campo]: v }))}
            />
          ))}

          <label style={{ ...tarjeta, display: "flex", gap: 12, alignItems: "flex-start",
                          cursor: "pointer" }}>
            <input
              type="checkbox" checked={documentado}
              onChange={(e) => setDocumentado(e.target.checked)}
              style={{ width: 20, height: 20, marginTop: 2, flexShrink: 0, accentColor: "var(--color-inv)" }}
            />
            <span style={{ display: "grid", gap: 4 }}>
              <span style={{ fontSize: 15 }}>Esto ya está escrito en algún sitio</span>
              <span style={{ ...tenue, lineHeight: 1.45 }}>
                Un manual, un checklist, un mensaje fijado. Lo que no está escrito
                es justo lo que se pierde cuando alguien se va.
              </span>
            </span>
          </label>

          <button type="submit" disabled={enviando} style={{
            ...botonPrimario, opacity: enviando ? 0.5 : 1,
          }}>{enviando ? "Guardando…" : "Enviar"}</button>
        </form>
      )}
    </Marco>
  );
}

/**
 * El final del camino. Se dice con las palabras del backend y no se adorna.
 *
 * ⚠️ NO hay botón de reintentar, y su ausencia es la decisión: el enlace no va a
 * empezar a funcionar porque se pulse otra vez. Un botón que no puede arreglar
 * nada solo consigue que la persona lo pulse cinco veces antes de rendirse.
 */
function Cerrado({ error }) {
  return (
    <Marco>
      <div style={{ ...tarjeta, display: "grid", gap: "var(--esp-3)" }}>
        <strong style={{ fontSize: 18 }}>{error.titulo ?? "Este enlace no sirve"}</strong>
        <span style={{ lineHeight: 1.55, color: "var(--color-ink-2)" }}>
          {error.detalle ?? "Pide uno nuevo a quien te lo envió."}
        </span>
      </div>
      {/* Ni una palabra de por qué falló: vencido, revocado o de otro sitio
          contestan lo mismo a propósito, y aquí tampoco se adivina.

          Esto SÍ se puede decir porque es como funciona, no una suposición. */}
      <p style={{ ...tenue, lineHeight: 1.5, margin: 0 }}>
        Un enlace se abre en un solo teléfono: el primero que lo abre se queda con él.
      </p>
    </Marco>
  );
}

function Pregunta({ campo, rotulo, ejemplo, obligatoria, valor, alCambiar }) {
  return (
    <label style={{ display: "grid", gap: 8 }}>
      <span style={{ display: "grid", gap: 3 }}>
        <span style={{ fontSize: 16, fontWeight: 500 }}>{rotulo}</span>
        {obligatoria && (
          /* El único obligatorio, y se dice por qué en vez de poner un asterisco
             rojo que no explica nada.

             En su propia línea: en un teléfono de 375px, colgado del rótulo,
             partía dejando una palabra suelta contra el margen. */
          <span style={tenue}>Lo único que hace falta de verdad</span>
        )}
      </span>
      <textarea
        name={campo} value={valor} required={obligatoria} rows={3}
        onChange={(e) => alCambiar(e.target.value)}
        placeholder={ejemplo}
        style={{
          background: "var(--color-surface-2)", color: "var(--color-ink)",
          border: "1px solid var(--color-line)", borderRadius: "var(--radio-control)",
          padding: "12px 14px",
          /* ⚠️ 16px o iOS hace zoom solo al enfocar. No es una preferencia. */
          fontSize: 16, lineHeight: 1.5, fontFamily: "inherit", resize: "vertical",
        }}
      />
    </label>
  );
}

/** Sin cabecera, sin navegación y sin marca: esto no es «estar en la app». */
function Marco({ children }) {
  return (
    <div style={{ minHeight: "100dvh", background: "var(--color-bg)", color: "var(--color-ink)" }}>
      <div style={{
        maxWidth: 560, margin: "0 auto", padding: "var(--esp-6, 32px) var(--esp-5)",
        display: "grid", gap: "var(--esp-5)", alignContent: "start",
      }}>{children}</div>
    </div>
  );
}

const tenue = { fontSize: 13, color: "var(--color-ink-3)" };

const tarjeta = {
  background: "var(--color-surface)", border: "1px solid var(--color-line)",
  borderRadius: "var(--radio-tarjeta)", padding: "var(--esp-5)",
};

const botonPrimario = {
  background: "var(--color-ink)", color: "var(--color-bg)",
  border: "1px solid var(--color-ink)", borderRadius: "var(--radio-control)",
  padding: "14px 18px", fontSize: 16, fontWeight: 600, fontFamily: "inherit",
  cursor: "pointer", width: "100%",
};

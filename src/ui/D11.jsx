import { Celda } from "./piezas.jsx";

/* ============================================================================
   Lo declarado y lo cobrado, uno al lado del otro.
   ----------------------------------------------------------------------------
   ⚠️ ESTE COMPONENTE EXISTE PARA QUE NADIE LOS FUNDA
   --------------------------------------------------
   El backend lo dice literal: «`ingresosDeclarados` lo escribe una persona;
   `cobradoSoles` sale de sumar los pagos. Con solo el primero no se sabe si el
   dinero entró; con solo el segundo se borra el dinero que no vino de un
   cliente —un patrocinio, una venta de material—. QUE DIFIERAN ES EL DATO».

   Así que aquí NO hay:
   · un número «de ingresos» que los promedie o los sume,
   · un porcentaje de cumplimiento que dé por buena la diferencia,
   · un semáforo que llame «mal» a una diferencia.

   Hay dos cifras, cada una con de dónde viene, y la diferencia dicha en
   palabras. Que falte por cobrar no es un error: puede ser un pago pendiente.
   Que sobre tampoco: puede ser un patrocinio.

   ⚠️ Y UN NULO NO ES UN CERO
   --------------------------
   `ingresosDeclarados: null` es «nadie lo ha declarado todavía». Pintarlo S/ 0
   afirmaría que el programa no ingresa nada, que es una afirmación que nadie
   hizo. `cobradoSoles: 0` SÍ es un cero: cero pagos suman cero de verdad. Son
   dos ausencias distintas y se pintan distinto.
   ========================================================================= */

const soles = (n) =>
  new Intl.NumberFormat("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    .format(Number(n));

function Cifra({ rotulo, valor, deDonde, sinDeclarar }) {
  const ausente = valor === null || valor === undefined;
  return (
    <div style={{ display: "grid", gap: 4, minWidth: 0 }}>
      <span style={{ fontSize: 11, color: "var(--color-ink-2)", letterSpacing: "0.02em" }}>
        {rotulo}
      </span>
      <span className="cifras" style={{
        fontSize: 26, fontWeight: 600, lineHeight: 1.1,
        color: ausente ? "var(--color-ink-3)" : "var(--color-ink)",
      }}>
        {ausente
          ? <span style={{ fontSize: 15, fontStyle: "italic", fontWeight: 400 }}>{sinDeclarar}</span>
          : <>S/ {soles(valor)}</>}
      </span>
      <span style={{ fontSize: 11, color: "var(--color-ink-3)", lineHeight: 1.4 }}>{deDonde}</span>
    </div>
  );
}

export default function D11({ ficha }) {
  const declarado = ficha.ingresosDeclarados;
  const cobrado = ficha.cobradoSoles;
  const sePuedenComparar = declarado !== null && declarado !== undefined
    && cobrado !== null && cobrado !== undefined;
  const diferencia = sePuedenComparar ? Number(declarado) - Number(cobrado) : null;

  return (
    <div style={{
      background: "var(--color-surface)", border: "1px solid var(--color-line)",
      borderRadius: "var(--radio-tarjeta)", padding: "var(--esp-5)",
      display: "grid", gap: "var(--esp-4)",
    }}>
      <div style={{
        display: "grid", gap: "var(--esp-5)",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
      }}>
        <Cifra
          rotulo="ingresos declarados"
          valor={declarado}
          sinDeclarar="nadie lo ha declarado"
          deDonde="Lo escribió una persona"
        />
        <Cifra
          rotulo="cobrado"
          valor={cobrado}
          sinDeclarar="sin dato"
          deDonde="Sale de sumar los pagos"
        />
        <Cifra
          rotulo="egresos declarados"
          valor={ficha.egresosDeclarados}
          sinDeclarar="nadie lo ha declarado"
          deDonde="Lo escribió una persona"
        />
      </div>

      {/* ⚠️ La diferencia se dice, NO se juzga. No lleva color de semáforo:
          ni sobrar ni faltar es un fallo, y pintarlo en ámbar convertiría un
          patrocinio en una alarma. */}
      <div style={{
        borderTop: "1px solid var(--color-line)", paddingTop: "var(--esp-4)",
        fontSize: 13, color: "var(--color-ink-2)", lineHeight: 1.55,
      }}>
        {!sePuedenComparar ? (
          <>No se pueden comparar todavía: falta que alguien declare los ingresos. Lo cobrado
          se sabe siempre, porque sale de los pagos.</>
        ) : diferencia > 0 ? (
          <>Faltan <b className="cifras" style={{ color: "var(--color-ink)" }}>S/ {soles(diferencia)}</b> por
          cobrar de lo declarado. <span style={{ color: "var(--color-ink-3)" }}>
          Puede ser un pago pendiente — no es un error.</span></>
        ) : diferencia < 0 ? (
          <>Se cobró <b className="cifras" style={{ color: "var(--color-ink)" }}>S/ {soles(-diferencia)}</b> más
          de lo declarado. <span style={{ color: "var(--color-ink-3)" }}>
          Suele ser dinero que no vino de un cliente: un patrocinio, una venta de material.</span></>
        ) : (
          <>Lo declarado y lo cobrado coinciden.</>
        )}
      </div>

      <div style={{
        display: "flex", gap: "var(--esp-5)", flexWrap: "wrap",
        fontSize: 12, color: "var(--color-ink-2)",
      }}>
        <span>clientes <b className="cifras" style={{ color: "var(--color-ink)" }}>{ficha.clientes}</b></span>
        <span>pagos <b className="cifras" style={{ color: "var(--color-ink)" }}>{ficha.pagos}</b></span>
        <span>último pago <b style={{ color: "var(--color-ink)" }}><Celda valor={ficha.ultimoPagoEl} /></b></span>
      </div>
    </div>
  );
}

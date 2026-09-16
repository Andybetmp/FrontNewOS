import { useEffect, useState } from "react";

/* ============================================================================
   Cuánto lleva corriendo · NO una barra de progreso.
   ----------------------------------------------------------------------------
   ⚠️ NO HAY BARRA, Y ES A PROPÓSITO
   ---------------------------------
   Una barra de progreso afirma que se sabe cuánto falta. Aquí no se sabe: el
   backend llama a un proveedor externo, en paralelo, y no informa del avance.
   Pintar una barra que se mueve sola sería inventar un dato — la misma falta
   que rellenar un nulo con un cero, en otro sitio.

   Lo que sí se sabe es cuánto lleva. Eso se dice, y se dice también cuánto
   suele tardar, que es lo que de verdad calma a quien espera.
   ========================================================================= */

export default function Cronometro({ desde, sueleTardar }) {
  const [ahora, setAhora] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  const segundos = Math.floor((ahora - desde) / 1000);
  const tarda = segundos > sueleTardar;

  return (
    <div style={{ display: "grid", gap: 4 }}>
      <span className="cifras" style={{ fontSize: 22, fontWeight: 600 }}>
        {Math.floor(segundos / 60)}:{String(segundos % 60).padStart(2, "0")}
      </span>
      <span style={{ fontSize: 12, color: "var(--color-ink-3)", lineHeight: 1.4 }}>
        {tarda
          ? "Está tardando más de lo normal. Sigue corriendo: no se cancela sola ni se reintenta."
          : `Suele tardar alrededor de ${sueleTardar} s. No cierres la pestaña.`}
      </span>
    </div>
  );
}

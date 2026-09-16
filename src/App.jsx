import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { resolverInstancia, EMPRESA } from "./nucleo/instancia.js";
import Eventos from "./vistas/Eventos.jsx";
import Evento from "./vistas/Evento.jsx";
import Logistica from "./vistas/Logistica.jsx";
import Programas from "./vistas/Programas.jsx";
import Programa from "./vistas/Programa.jsx";
import Motor from "./vistas/Motor.jsx";
import Ajustes from "./vistas/Ajustes.jsx";
import EnlacePublico from "./vistas/EnlacePublico.jsx";

/* ============================================================================
   El armazón · router incluido desde la segunda pantalla, como estaba dicho.
   ----------------------------------------------------------------------------
   Entra ahora y no antes porque decidir la forma de la navegación mirando una
   sola vista es la peor información posible para decidirla. Con dos pantallas y
   una ficha con identificador en la URL, un enlace a un evento concreto ya vale
   algo: sin router, «mándame este evento» no se puede hacer.

   ⚠️ DOS RAÍCES, Y NO COMPARTEN NADA
   ----------------------------------
   `/e/:empresa/:token` es la pantalla pública de la fase 7: sin cuenta, sin
   sesión y sin navegación. Cuelga del router al mismo nivel que la aplicación
   del cliente, NO dentro de ella, y por dos motivos que no son de gusto:

   · La cabecera del cliente enseña el nombre de la empresa y cinco enlaces a
     pantallas que esa persona no puede abrir. Sería ofrecerle puertas cerradas.
   · `resolverInstancia` corre al montar el armazón del cliente y necesita saber
     de qué empresa es la pestaña. En la pública la empresa viene del camino, y
     no hay instancia que resolver: si un fallo de esa llamada pintara «no se
     pudo resolver la empresa», tumbaría una pantalla que no la necesita.

   Es el mismo aviso que quedó escrito para la fase 6 —la consola interna—, una
   fase antes de que hiciera falta.
   ========================================================================= */

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/e/:empresa/:token" element={<EnlacePublico />} />
        <Route path="*" element={<Cliente />} />
      </Routes>
    </BrowserRouter>
  );
}

function Cliente() {
  const [instancia, setInstancia] = useState(null);
  const [fallo, setFallo] = useState(null);

  useEffect(() => { resolverInstancia(EMPRESA).then(setInstancia).catch(setFallo); }, []);

  return (
    <>
      <div style={{ minHeight: "100%", display: "grid", gridTemplateRows: "auto 1fr" }}>
        <header style={{
          background: "var(--color-inv)", color: "var(--color-inv-ink)",
          padding: "var(--esp-4) var(--esp-5)",
        }}>
          <div style={{ maxWidth: 1040, margin: "0 auto", display: "flex",
                        alignItems: "center", justifyContent: "space-between", gap: "var(--esp-5)" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "var(--esp-5)" }}>
              <div style={{ fontSize: 11, opacity: 0.75, letterSpacing: "0.06em" }}>RENASER OS</div>
              <nav style={{ display: "flex", gap: "var(--esp-4)" }}>
                {[["/", "Eventos"], ["/programas", "Programas"], ["/logistica", "Logística"], ["/motor", "Motor de IA"], ["/ajustes", "Ajustes"]].map(([a, t]) => (
                  <NavLink key={a} to={a} end style={({ isActive }) => ({
                    color: "inherit", textDecoration: "none", fontSize: 14,
                    opacity: isActive ? 1 : 0.6, fontWeight: isActive ? 600 : 400,
                  })}>{t}</NavLink>
                ))}
              </nav>
            </div>
            <div style={{ fontSize: 13, opacity: 0.8 }}>
              {/* Si no se sabe de quién es la pantalla se dice: pintar un nombre
                  inventado sería peor que no pintar ninguno. */}
              {fallo ? "no se pudo resolver la empresa"
                     : instancia ? instancia.nombre
                     : <span style={{ opacity: 0.6 }}>resolviendo…</span>}
            </div>
          </div>
        </header>

        <main style={{ padding: "var(--esp-5)", maxWidth: 1040, margin: "0 auto", width: "100%" }}>
          {fallo ? (
            <div style={{ color: "var(--color-warn-txt)", lineHeight: 1.5 }}>{fallo.message}</div>
          ) : (
            <Routes>
              <Route path="/" element={<Eventos />} />
              <Route path="/eventos/:id" element={<Evento />} />
              <Route path="/programas" element={<Programas />} />
              <Route path="/programas/:id" element={<Programa />} />
              <Route path="/logistica" element={<Logistica />} />
              <Route path="/motor" element={<Motor />} />
              <Route path="/ajustes" element={<Ajustes />} />
              <Route path="*" element={
                <div style={{ color: "var(--color-ink-2)" }}>Esa pantalla no existe.</div>
              } />
            </Routes>
          )}
        </main>
      </div>
    </>
  );
}

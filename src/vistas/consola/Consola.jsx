import { NavLink, Route, Routes } from "react-router-dom";
import Empresas from "./Empresas.jsx";
import Empresa from "./Empresa.jsx";
import Planes from "./Planes.jsx";

/* ============================================================================
   Fase 6 · El armazón de la consola. Otra aplicación, y tiene que NOTARSE.
   ----------------------------------------------------------------------------
   ⚠️ NO COMPARTE NI UN PÍXEL DE CABECERA CON LA DEL CLIENTE, A PROPÓSITO
   ---------------------------------------------------------------------
   Desde aquí se suspende y se cierra a clientes de verdad. Que las dos
   aplicaciones se parezcan sería el peor error posible de esta fase: alguien
   que crea estar en la suya acabaría suspendiendo a otro.

   Por eso la cabecera es la contraria —fondo oscuro donde la del cliente lleva
   el oro— y lleva escrito a quién se está viendo. Ese aviso no es decoración:
   es lo único que distingue las dos pantallas de un vistazo.

   ⚠️ Y AQUÍ NO SE RESUELVE NINGUNA INSTANCIA
   ------------------------------------------
   La del cliente arranca llamando a `resolverInstancia(EMPRESA)`. Ésta no tiene
   empresa: habla solo con la base de control, que es lo que le permite
   funcionar cuando todavía no hay ningún cliente dado de alta. Poner aquí esa
   llamada tumbaría la pantalla en el único momento en que hace más falta.
   ========================================================================= */

export default function Consola() {
  return (
    <div style={{ minHeight: "100%", display: "grid", gridTemplateRows: "auto 1fr" }}>
      <header style={{
        background: "var(--color-surface-3)", color: "var(--color-ink)",
        borderBottom: "2px solid var(--color-inv)",
        padding: "var(--esp-4) var(--esp-5)",
      }}>
        <div style={{
          maxWidth: 1040, margin: "0 auto", display: "flex", flexWrap: "wrap",
          alignItems: "center", justifyContent: "space-between", gap: "var(--esp-4)",
        }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "var(--esp-5)", flexWrap: "wrap" }}>
            <div style={{ fontSize: 11, letterSpacing: "0.08em", fontWeight: 600 }}>
              RENASER · CONSOLA
            </div>
            <nav style={{ display: "flex", gap: "var(--esp-4)" }}>
              {[["/", "Clientes"], ["/planes", "Planes"]].map(([a, t]) => (
                <NavLink key={a} to={a} end style={({ isActive }) => ({
                  color: "inherit", textDecoration: "none", fontSize: 14,
                  opacity: isActive ? 1 : 0.55, fontWeight: isActive ? 600 : 400,
                })}>{t}</NavLink>
              ))}
            </nav>
          </div>
          {/* Lo que nunca se puede olvidar estando aquí. */}
          <div style={{ fontSize: 12, color: "var(--color-warn-txt)" }}>
            Estás viendo a todos los clientes
          </div>
        </div>
      </header>

      <main style={{ padding: "var(--esp-5)", maxWidth: 1040, margin: "0 auto", width: "100%" }}>
        <Routes>
          <Route path="/" element={<Empresas />} />
          <Route path="/empresas/:clave" element={<Empresa />} />
          <Route path="/planes" element={<Planes />} />
          <Route path="*" element={
            <div style={{ color: "var(--color-ink-2)" }}>Esa pantalla no existe en la consola.</div>
          } />
        </Routes>
      </main>
    </div>
  );
}

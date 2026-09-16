import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

/* La identidad de RENASER OS. Va primero: todo lo demás lee sus variables. */
import "./estilo/tokens.css";
import "./estilo/base.css";

/* ============================================================================
   OBSIDIAN KINPAKU · el estándar corporativo
   ----------------------------------------------------------------------------
   `temas.js` del panel anterior lo describe así: «Negro obsidiana profundo con
   acentos en oro japonés Kinpaku y esmeralda. El estándar corporativo de
   RENASER OS».

   ⚠️ NO HAY NADA QUE IMPORTAR: ES `tokens.css` EN MODO OSCURO
   -----------------------------------------------------------
   Comparados uno a uno el 15 de septiembre de 2026, los valores del tema
   oficial y los del modo oscuro de `tokens.css` son los mismos:

       --color-bg    #08090B   =  crema
       --color-ink   #F8FAFC   =  tinta
       --color-ink-2 #94A3B8   =  gris
       --color-inv   #C5A059   =  oro Kinpaku
       --color-ok    #10B981   =  esmeralda

   Los dos que no cuadran son peldaños de superficie: `tokens.css` tiene más
   niveles que los tres del contrato viejo y los repartió distinto. La identidad
   —fondo, tinta, oro y verde— es idéntica.

   Por eso aquí no se inyecta ningún tema: se fija la clase y ya está. El día
   que hagan falta los otros cinco temas, `temas.js` vive en el repositorio
   anterior y este es el sitio donde se engancharía.
   ========================================================================= */
document.documentElement.classList.add("dark");

ReactDOM.createRoot(document.getElementById("raiz")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

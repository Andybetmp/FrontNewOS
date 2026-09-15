import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/* ============================================================================
   ⚠️ EL PROXY NO ES UNA COMODIDAD: SIN ÉL EL NAVEGADOR NO PUEDE HABLAR
   ----------------------------------------------------------------------------
   Medido el 15 de septiembre de 2026: el backend NO tiene CORS configurado.
   Ni una línea. Así que una llamada desde http://localhost:5173 a
   http://localhost:8090 la bloquea el navegador antes de salir, y lo que se ve
   en la consola es un error de CORS que no dice nada del backend.

   Con el proxy, todo sale del MISMO ORIGEN: el front pide `/api/eventos`, Vite
   lo reenvía a `localhost:8090/eventos`, y CORS no llega a existir. Es la misma
   decisión que ya tomó el repositorio anterior, por el mismo motivo.

   ⚠️ El día que esto se despliegue de verdad hay dos caminos, y hay que
   elegirlo a conciencia: o el backend detrás del mismo dominio (un Caddy o un
   nginx delante), o CORS configurado en el backend. Dejarlo para el final
   significa descubrirlo el día del despliegue.
   ========================================================================= */
export default defineConfig(() => ({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: process.env.VITE_BACKEND_ORIGEN || "http://localhost:8090",
        changeOrigin: true,
        rewrite: (ruta) => ruta.replace(/^\/api/, ""),
      },
    },
  },
}));

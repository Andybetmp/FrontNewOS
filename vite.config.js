import { defineConfig, loadEnv } from "vite";
import { createHmac } from "node:crypto";
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
/* ============================================================================
   ⚠️ LA SESIÓN DE DESARROLLO · SOLO AQUÍ, Y SOLO EN `vite dev`
   ----------------------------------------------------------------------------
   El backend no acuña tokens: valida los que le llegan. En producción los firma
   el Supabase de cada empresa —«el emisor ES la empresa»— y en desarrollo no
   hay ninguno, así que no habría forma de llamar a un endpoint autenticado.

   Es el mismo hueco que el backend resolvió con `ConfiguracionLocal`, y se
   resuelve con la misma disciplina:

     1. Vive en el servidor de Vite, NO en el navegador. `CLAVE_LOCAL` no lleva
        el prefijo VITE_, así que Vite no la expone al paquete: la clave no
        aparece en el código que se descarga, ni siquiera en desarrollo.
     2. Este middleware solo se monta en `vite dev`. Un `vite build` no lo
        incluye porque `configureServer` no corre en la compilación.
     3. Sin `CLAVE_LOCAL` no acuña nada y lo dice. No hay valor por defecto:
        una clave «por si acaso» es la que acaba en producción.

   ⚠️ Y la clave NO se escribe en este repositorio. Vive donde ya vivía, a la
   vista y con su aviso: el perfil `local` del application.yml del backend.
   Se copia una vez al `.env`, que está en el .gitignore.
   ========================================================================= */
function sesionDeDesarrollo(clave) {
  return {
    name: "sesion-de-desarrollo",
    configureServer(servidor) {
      servidor.middlewares.use("/dev/sesion", (peticion, respuesta) => {
        respuesta.setHeader("content-type", "application/json");
        if (!clave) {
          respuesta.statusCode = 503;
          respuesta.end(JSON.stringify({
            error: "No hay CLAVE_LOCAL en el .env, asi que no se acuna ningun token. " +
              "Se copia del perfil `local` del application.yml del backend, donde esta " +
              "a la vista y con su aviso. Ver .env.ejemplo.",
          }));
          return;
        }
        const url = new URL(peticion.url ?? "/", "http://local");
        const empresa = url.searchParams.get("empresa");
        const sub = url.searchParams.get("sub") || "11111111-1111-1111-1111-111111111111";
        const ahora = Math.floor(Date.now() / 1000);
        const cuerpo = url.searchParams.get("equipo")
          ? { sub, equipo: "renaser", iat: ahora, exp: ahora + 3600 }
          : { sub, empresa, iat: ahora, exp: ahora + 3600 };
        const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
        const cabecera = b64({ alg: "HS256", typ: "JWT" });
        const carga = b64(cuerpo);
        const firma = createHmac("sha256", clave)
          .update(`${cabecera}.${carga}`).digest("base64url");
        respuesta.end(JSON.stringify({ token: `${cabecera}.${carga}.${firma}`, cuerpo }));
      });
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), sesionDeDesarrollo(loadEnv(mode, process.cwd(), "").CLAVE_LOCAL)],
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

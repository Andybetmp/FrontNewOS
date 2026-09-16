/* ============================================================================
   La sesión mientras solo se prueba en localhost.
   ----------------------------------------------------------------------------
   En producción el token lo firma el Supabase de cada empresa —«el emisor ES la
   empresa»— y sale de `supabase.auth.getSession()`. Eso todavía no existe aquí.

   Mientras tanto, el servidor de Vite acuña uno. ⚠️ La clave vive en `.env` SIN
   el prefijo VITE_, así que nunca entra en el paquete del navegador: este
   módulo solo pide, no firma. Ver `vite.config.js`.

   ⚠️ Y esto se borra entero el día que entre Supabase Auth. No es un «por
   ahora» que se queda: es andamio, y el andamio se quita.
   ========================================================================= */

let enMemoria = null;
let proveedor = null;

/**
 * ⚠️ SOLO PARA `npm run comprobar`, Y POR UN MOTIVO CONCRETO.
 *
 * Las comprobaciones corren en Node, donde `/dev/sesion` no existe: esa ruta la
 * sirve el servidor de Vite. Sin esto, la única forma de validar la capa de
 * datos contra el backend sería levantar el front — y una comprobación que
 * necesita dos servidores es una que nadie corre.
 *
 * No lo llama ninguna pantalla. Si alguna lo llamara, estaría decidiendo su
 * propia sesión, que es justo lo que este módulo centraliza.
 */
export function fijarProveedorDeToken(fn) {
  proveedor = fn;
  enMemoria = null;
}

export class SinSesionDeDesarrollo extends Error {}

/** El token con el que se llama al backend. Nulo jamás: o hay, o revienta. */
export async function tokenDeAhora() {
  if (proveedor) {
    return proveedor();
  }
  if (enMemoria && enMemoria.expira > Date.now() + 30_000) {
    return enMemoria.token;
  }
  const empresa = (import.meta.env.VITE_EMPRESA ?? "acme").trim();
  const r = await fetch(`/dev/sesion?empresa=${encodeURIComponent(empresa)}`);
  const dicho = await r.json();
  if (!r.ok || !dicho.token) {
    throw new SinSesionDeDesarrollo(
      dicho.error ?? "El servidor de desarrollo no acuñó ningún token."
    );
  }
  enMemoria = { token: dicho.token, expira: dicho.cuerpo.exp * 1000 };
  return dicho.token;
}

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

/* ---------------------------------------------------------------------------
   ⚠️ CON QUÉ SESIÓN SE ENTRA · andamio, y del más provisional de todos
   ---------------------------------------------------------------------------
   En producción hay UN token y ya trae dentro quién eres: si lleva la
   reclamación `equipo: "renaser"`, `queEnsenar` pinta la consola; si no, la
   aplicación del cliente. Nadie elige nada — lo eligió el acceso.

   Aquí no hay acceso, así que hace falta decir a quién se está simulando. Esto
   NO decide qué se puede hacer: decide qué token pide el andamio, que es
   exactamente lo que en producción decide el formulario de acceso. Todo lo de
   después es el camino de verdad.

       ?sesion=equipo    entra como el equipo de RENASER
       ?sesion=cliente   entra como la empresa del .env

   Se recuerda en la pestaña, no en el navegador: dos pestañas pueden estar en
   dos aplicaciones distintas, que es justo lo que hace falta para compararlas.
   ------------------------------------------------------------------------ */

const CAJON = "renaser.sesionDeDesarrollo";

function cualSePide() {
  try {
    const dicha = new URL(globalThis.location?.href ?? "http://local")
      .searchParams.get("sesion");
    if (dicha === "equipo" || dicha === "cliente") {
      globalThis.sessionStorage?.setItem(CAJON, dicha);
      return dicha;
    }
    return globalThis.sessionStorage?.getItem(CAJON) ?? "cliente";
  } catch {
    /* Modo privado, o sin `location`. Se cae del lado del cliente, que es el
       que no ve a todo el mundo. */
    return "cliente";
  }
}

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
  const cual = cualSePide();
  /* ⚠️ La memoria se guarda CON su clase. Sin esto, cambiar de sesión en una
     pestaña seguiría hablando con el token anterior hasta que caducara — y lo
     que se vería es la consola pidiendo datos con el token de un inquilino. */
  if (enMemoria && enMemoria.cual === cual && enMemoria.expira > Date.now() + 30_000) {
    return enMemoria.token;
  }
  const empresa = (import.meta.env.VITE_EMPRESA ?? "acme").trim();
  const r = await fetch(cual === "equipo"
    ? "/dev/sesion?equipo=1"
    : `/dev/sesion?empresa=${encodeURIComponent(empresa)}`);
  const dicho = await r.json();
  if (!r.ok || !dicho.token) {
    throw new SinSesionDeDesarrollo(
      dicho.error ?? "El servidor de desarrollo no acuñó ningún token."
    );
  }
  enMemoria = { token: dicho.token, expira: dicho.cuerpo.exp * 1000, cual };
  return dicho.token;
}

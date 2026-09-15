/* ============================================================================
   v2 · Qué aplicación abre quien acaba de entrar
   ----------------------------------------------------------------------------
   Con el mismo formulario de acceso se puede entrar a DOS aplicaciones que no
   se parecen en nada:

     · la de un cliente  — ve SUS eventos, SUS programas, SU logística
     · la consola de RENASER — ve a TODOS los clientes, y puede suspenderlos

   Lo que las separa es una reclamación del token: `equipo: "renaser"`, que el
   backend convierte en la autoridad EQUIPO_RENASER y exige en todo `/control`.

   ⚠️ ESTO NO ES UNA COMPROBACIÓN DE SEGURIDAD, Y CONFUNDIRLO SERÍA GRAVE
   ---------------------------------------------------------------------
   Lo que hay aquí decide QUÉ SE PINTA, nada más. Quien manda es el backend:
   `/control/**` pide la autoridad y la rechaza si no está, mire lo que mire
   esta función. Si alguien edita el token en su navegador, verá la navegación
   de la consola y cada petición le contestará 401 o 403.

   Es decir: esto ahorra un menú inútil, no protege nada. La protección vive
   donde tiene que vivir, y ya está probada allí.

   ⚠️ Y NO SE DECODIFICA PARA CONFIAR, SE DECODIFICA PARA MIRAR
   ------------------------------------------------------------
   Leer el cuerpo de un JWT sin verificar la firma es correcto SOLO para esto.
   El día que alguien use esta función para decidir si se puede hacer algo, la
   habrá convertido en un agujero. Por eso devuelve «qué enseñar», no «qué
   puede».
   ========================================================================= */

/** Lo que se pinta. Nunca lo que se permite. */
export const QUE_ENSENAR = Object.freeze({
  consola: "consola",
  cliente: "cliente",
  nada: "nada",
});

/** El cuerpo de un JWT, sin verificar nada. Nulo si no se puede leer. */
function cuerpoDelToken(token) {
  try {
    const trozo = String(token).split(".")[1];
    if (!trozo) {
      return null;
    }
    const base64 = trozo.replace(/-/g, "+").replace(/_/g, "/");
    const relleno = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const binario = typeof atob === "function"
      ? atob(relleno)
      : Buffer.from(relleno, "base64").toString("binary");
    const bytes = Uint8Array.from(binario, (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

/**
 * Qué navegación corresponde a este token.
 *
 * ⚠️ Sin token no se enseña la del cliente «por si acaso»: se enseña NADA. Un
 * menú de cliente sin sesión es una promesa que cada pulsación incumple.
 */
export function queEnsenar(token) {
  const cuerpo = token ? cuerpoDelToken(token) : null;
  if (!cuerpo) {
    return QUE_ENSENAR.nada;
  }
  if (cuerpo.equipo === "renaser") {
    return QUE_ENSENAR.consola;
  }
  return QUE_ENSENAR.cliente;
}

/**
 * Quién firma lo que se haga en esta sesión, si es que se sabe.
 *
 * ⚠️ Devuelve nulo cuando el `sub` no es un identificador, y NO inventa uno.
 * El backend rechaza esas peticiones diciéndolo —ver `firma/Quien`—, así que
 * fabricar aquí un valor solo serviría para que el error llegara más tarde y
 * peor explicado.
 */
export function quienFirma(token) {
  const sub = cuerpoDelToken(token)?.sub;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sub ?? "")
    ? sub
    : null;
}

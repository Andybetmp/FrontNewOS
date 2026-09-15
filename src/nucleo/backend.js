/* ============================================================================
   v2 · Hablar con el backend, y no perder lo que contesta
   ----------------------------------------------------------------------------
   El backend contesta los errores en `application/problem+json`:

       { "title":  "Esta empresa no tiene IA configurada",
         "detail": "La empresa acme no tiene credenciales de IA, ni propias ni
                    del producto. Sin ellas no se puede planificar.",
         "status": 409, "instance": "/plan" }

   ⚠️ ESOS MENSAJES ESTÁN ESCRITOS PARA LEERSE, Y SE PIERDEN CON FACILIDAD
   ----------------------------------------------------------------------
   Están redactados uno a uno: dicen qué pasó, por qué importa y quién lo
   arregla. Un cliente HTTP que los sustituya por «Error 409» tira semanas de
   trabajo y deja al usuario con un número.

   Por eso aquí NO se inventa texto y NO se traduce: `title` va al titular del
   aviso y `detail` al cuerpo, tal cual. El componente `EstadoError` de la
   biblioteca recibe exactamente esa pareja.

   ⚠️ Y CUANDO NO HAY TÍTULO, NO SE FABRICA UNO
   --------------------------------------------
   Algunas respuestas no vienen del código de la casa: una ruta con un segmento
   vacío la rechaza el marco antes del despacho, y sale el cuerpo genérico del
   contenedor —{timestamp, status, error, path}— sin `title` ni `detail`.

   Rellenar el hueco con una frase amable sería fingir que la casa contestó.
   Se dice lo que se sabe: el código y la ruta. Es la misma regla que en el
   backend — donde no se sabe algo va «dato faltante», nunca un cero.
   ========================================================================= */

/** Un error del backend, con su pareja título/detalle si la trae. */
export class ErrorDelBackend extends Error {
  constructor({ titulo, detalle, estado, ruta }) {
    super(detalle || titulo || `El backend contestó ${estado}`);
    this.titulo = titulo;
    this.detalle = detalle;
    this.estado = estado;
    this.ruta = ruta;
    /** true cuando el cuerpo NO viene de un manejador de la casa. */
    this.esGenerico = !titulo && !detalle;
  }
}

/**
 * La URL del backend. UNA para todos los clientes.
 *
 * ⚠️ POR DEFECTO ES `/api`, DEL MISMO ORIGEN, Y ESO NO ES PEREZA
 * -------------------------------------------------------------
 * El backend NO tiene CORS configurado —medido el 15 de septiembre de 2026, ni
 * una línea—, así que una llamada de origen cruzado la bloquea el navegador
 * antes de salir y lo que se ve es un error de CORS que no dice nada del
 * backend. El proxy de Vite hace que todo salga del mismo origen; ver
 * `vite.config.js`.
 *
 * Y un valor por defecto del mismo origen es además el más seguro de los dos:
 * si alguien despliega sin configurar nada, lo peor que puede pasar es un 404
 * contra su propio servidor. Nunca hablarle a la instalación de otro.
 */
export function urlDelBackend() {
  const url = (import.meta?.env?.VITE_BACKEND_URL ?? globalThis.VITE_BACKEND_URL ?? "").trim();
  return url ? url.replace(/\/+$/, "") : "/api";
}

/**
 * Una llamada al backend.
 *
 * @param ruta     empieza por «/»
 * @param opciones { metodo, cuerpo, token, señal }
 *
 * ⚠️ `token` es el `access_token` de la sesión de Supabase, TAL CUAL. No hay
 * que añadirle nada: cada empresa tiene su propio proyecto, o sea su propio
 * emisor, y el backend saca de la firma de quién es la petición. Ver
 * `DirectorioDeEmisores` — «la reclamación que no existe no se puede olvidar
 * de poner».
 */
export async function pedirAlBackend(ruta, opciones = {}) {
  const { metodo = "GET", cuerpo, token, senal } = opciones;

  const cabeceras = {};
  if (token) {
    cabeceras.authorization = `Bearer ${token}`;
  }
  if (cuerpo !== undefined) {
    cabeceras["content-type"] = "application/json";
  }

  const respuesta = await fetch(`${urlDelBackend()}${ruta}`, {
    method: metodo,
    headers: cabeceras,
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    signal: senal,
  });

  if (respuesta.ok) {
    /* 204 y 200 sin cuerpo son respuestas legítimas: revocar no devuelve nada. */
    const texto = await respuesta.text();
    return texto ? JSON.parse(texto) : null;
  }

  let cuerpoDelError = null;
  try {
    cuerpoDelError = JSON.parse(await respuesta.text());
  } catch {
    /* Sin cuerpo legible: queda el código, que es lo que se sabe. */
  }

  throw new ErrorDelBackend({
    titulo: cuerpoDelError?.title ?? null,
    detalle: cuerpoDelError?.detail ?? null,
    estado: respuesta.status,
    ruta: cuerpoDelError?.instance ?? ruta,
  });
}

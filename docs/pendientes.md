# FrontNewOS · qué se está haciendo y para qué

> La memoria de este repositorio. Cada tarea lleva su **finalidad**: para qué sirve. Una tarea sin
> finalidad escrita no se empieza — es la única forma de saber si se terminó.
>
> Es el mismo papel que `docs/pendientes.md` en el backend, y se actualiza igual: al cerrar cada
> tarea, con lo que se midió y lo que se decidió.

---

## Qué es esto

El frontend nuevo de RENASER OS. Habla **con el backend** (`RenaserOSbackend`), no con Supabase
directamente — al revés que el panel anterior, que consulta 106 tablas desde el navegador.

**Hoy solo se prueba en localhost.** No hay despliegue ni se ha decidido cómo será.

```
npm run dev        el front en 5173
npm run comprobar  todas las vistas contra el backend de verdad
```

---

## El estado

| | Fase | Finalidad | Estimado | |
|---|---|---|---|---|
| 0 | **El cimiento** | Lo que todas las vistas comparten. Si se improvisa, se reescribe siete veces | 1 j | ✅ |
| 1 | **Logística** | La rebanada más simple que ejercita TODO el cimiento. Si está mal, se ve en un día y no en tres semanas | 1,5 j | ✅ |
| 2 | **Eventos** | La primera carga real: tres pantallas, 14 endpoints, y el formulario donde el contrato de reemplazo deja de ser cómodo | 3 j | ✅ |
| 3 | **Programas** | Donde el diseño puede mentir: lo declarado y lo cobrado viajan juntos y no se pueden fundir | 2,5 j | ✅ |
| 4 | **Motor de IA** | Operaciones lentas que **cuestan dinero**. Necesitan progreso de verdad y la corrida en seco a la vista | 2,5 j | ✅ |
| 5 | **Ajustes y equipo** | Conexión con Meta y emitir/revocar enlaces | 1 j | ✅ |
| 6 | **Consola interna** | Aplicación aparte, con `EQUIPO_RENASER`. No comparte navegación con la del cliente | 2 j | |
| 7 | **Enlace público** | Pantalla sin login. Las cinco formas de fallar contestan lo mismo **a propósito** | 0,5 j | ✅ |

**Quedan 2 jornadas**: solo la fase 6, la consola interna.

⚠️ **Eso no es el producto entero.** El panel anterior tiene 41 vistas sobre 106 tablas; el backend
sirve 10. Todo lo que no esté en esa lista necesita endpoints nuevos **antes** que diseño.

---

## Cómo se valida · no es opcional

**Cada vista se comprueba contra el backend de verdad**, no contra dobles. `npm run comprobar`
recorre el núcleo y la capa de datos de cada vista, hablando con el backend local.

⚠️ **Por qué sin dobles.** Lo que hay que acertar es la FORMA de lo que contesta el backend: qué
campos trae, cómo viaja un error, qué pasa cuando la respuesta no la escribió la casa. Un doble
devuelve lo que se le pide y solo comprueba que el código llama al código.

Y además se mira en el navegador. Una vista que compila no es una vista que funciona.

---

## Fase 0 · hecha · el cimiento

| Módulo | Qué resuelve |
|---|---|
| `nucleo/instancia.js` | A qué Supabase se conecta esta pestaña |
| `nucleo/backend.js` | La llamada, y la traducción de `problem+json` |
| `nucleo/sesion.js` | Qué navegación se pinta: consola o cliente |
| `nucleo/sesionLocal.js` | El token mientras no hay Supabase Auth. **Andamio** |

**Lo que se descubrió al medir:** el `access_token` de Supabase **es** el token que el backend
quiere. `DirectorioDeEmisores` ya lo decidió — *«el emisor ES la empresa, así que la firma dice de
quién es la petición»*. No hay claims que configurar.

**Dos decisiones escritas en el código:**

- **No se devuelve nada a medias.** Un destino con URL y sin llave revienta nombrando lo que falta.
- **Cuando no hay título, no se fabrica uno.** Algunas respuestas no vienen de la casa; se marca
  `esGenerico` y se dice el código. Misma regla que el backend: donde no se sabe, no se inventa.

⚠️ **El proxy de Vite no es comodidad.** El backend **no tiene CORS** —medido, ni una línea—, así
que sin proxy el navegador bloquea la llamada antes de salir. El día del despliegue hay que elegir:
backend detrás del mismo dominio, o CORS en el backend. Dejarlo para el final es descubrirlo ese día.

---

## Fase 1 · hecha · Logística

Los dos catálogos: listar, dar de alta y corregir.

**Obsidian Kinpaku no había que portarlo.** Comparados uno a uno, el tema corporativo y el modo
oscuro de `tokens.css` son los mismos valores: fondo `#08090B`, tinta `#F8FAFC`, oro Kinpaku
`#C5A059`, esmeralda `#10B981`. Solo difieren dos peldaños de superficie, porque `tokens.css` tiene
más niveles que los tres del contrato viejo.

| Lo que Logística obligó a resolver | |
|---|---|
| **Corregir reemplaza** | El PUT manda el cuerpo entero, y el formulario lo dice |
| **Tres estados** | `recontratar` tiene control propio: *sin decidir · sí · no* |
| **Vacío ≠ cero** | Un campo vacío viaja como **nulo**. En la tabla se pinta «sin dato» |
| **Un solo primario** | Por estado visible. La pestaña activa se marca con peso, no con un botón |

---

## Fase 2 · hecha · Eventos

Tres pestañas en una ficha —datos, inscritos, proveedores— más el listado. 14 endpoints.

**Entra el router.** Se dijo que llegaría con la segunda pantalla y llegó: con una ficha que tiene
identificador en la URL, «mándame este evento» ya vale algo, y sin router no se puede hacer.

### ⚠️ El formulario de datos es el sitio más peligroso de la aplicación

Once campos, y corregir **reemplaza**. Un formulario que enviara «solo lo que cambió» borraría la
fecha, la sede y el presupuesto — y devolvería la fase a «idea». Es literalmente lo que pasaba en
producción antes de P14 del backend, con un 200 y sin una palabra.

Por eso:

- Los once campos viajan **siempre**, incluida la fase, aunque nadie la toque.
- El aviso lo dice arriba y con esas palabras: *«lo que se deje vacío queda vacío, y eso incluye la
  fase. No es una edición parcial»*.
- La fase es un selector con su nota: *«Viaja siempre, aunque no se toque»*.

Y está comprobado en los dos sentidos: el caso **«EL CASO DE P14»** crea un evento en fase
`campaña`, lo corrige mandando solo el nombre, y exige que la ciudad quede vacía **y que la fase
vuelva a `idea`**. Si el backend dejara de reemplazar, ese caso caería.

### Las otras dos decisiones

| | |
|---|---|
| **Las ocho fases salen del backend** | `GET /eventos/fases`. Tenerlas escritas en el front sería una segunda verdad, y el día que discreparan nadie sabría cuál manda |
| **`validadosSinMonto` se pinta aparte y en ámbar** | Son pagos dados por buenos sin anotar cuánto entró. No es un fallo de la respuesta: es lo que hay que perseguir |

Un rechazo exige motivo, y el formulario dice por qué: *«deja a alguien fuera sin poder reclamar»*.

---

## Fase 3 · hecha · Programas

Listado, ficha con D11, inscripciones y pagos. 7 endpoints.

### ⚠️ D11 · el sitio donde el diseño puede mentir

El backend lo dice literal: *«`ingresosDeclarados` lo escribe una persona; `cobradoSoles` sale de
sumar los pagos. Con solo el primero no se sabe si el dinero entró; con solo el segundo se borra el
dinero que no vino de un cliente —un patrocinio, una venta de material—. **Que difieran es el
dato**»*.

Así que en `ui/D11.jsx` **no hay**:

- un número «de ingresos» que los sume o los promedie,
- un porcentaje de cumplimiento que dé la diferencia por buena o por mala,
- un semáforo: ni faltar ni sobrar es un error, y pintarlo en ámbar convertiría un patrocinio en
  una alarma.

Hay dos cifras, **cada una con de dónde viene** —«Lo escribió una persona» / «Sale de sumar los
pagos»— y la diferencia dicha en palabras: *«Faltan S/ 14.120 por cobrar de lo declarado. Puede ser
un pago pendiente — no es un error»*.

### Dos ausencias que no son la misma

| | |
|---|---|
| `ingresosDeclarados: null` | *nadie lo ha declarado* — en cursiva, nunca S/ 0 |
| `cobradoSoles: 0` | **S/ 0,00** — cero pagos suman cero de verdad |

Fundirlas afirmaría que un programa no ingresa nada cuando lo que pasa es que nadie lo ha dicho.

### Los campos que aparecen y desaparecen

`tasaCambio` solo con **USD** —sin ella no se sabe cuánto entró en soles— y `cuotaNumero` solo con
**cuota**. El backend rechaza las combinaciones malas; la pantalla las esconde en vez de pedir un
dato que no significa nada.

### ⚠️ Y una regla del backend que no conocíamos

Probando en el navegador, un pago con fecha de mañana salió rechazado:

> *Un pago no puede tener fecha futura (2026-09-16). Si todavía no ha entrado el dinero, no se
> registra el pago.*

Llegó entera a la pantalla sin que nadie la hubiera previsto en el front. Es exactamente para lo que
existe el contrato de errores de la fase 0.

---

## Fase 4 · hecha · Motor de IA

Las cuatro operaciones que **cuestan dinero de verdad**. Eso decide toda la forma de la pantalla.

| Decisión | Por qué |
|---|---|
| **El primario es «Ver qué haría»** | La corrida en seco. Gastar es el segundo botón, y a propósito: si el que cobra fuera el más fácil de pulsar, se pulsaría por costumbre |
| **No se reintenta solo** | Un reintento automático de algo que cobra es cobrar dos veces. Si falla, lo vuelve a pedir una persona |
| **Lo que costó se enseña** | Y si el backend no pudo calcularlo, se dice — no se pinta un cero, que afirmaría que fue gratis |
| **`seco` viaja SIEMPRE en la URL** | Gastar es explícito, nunca el valor que queda cuando nadie dice nada. Hay un caso que lo vigila |
| **La casilla «Definitivo» avisa** | El modelo bueno cuesta **veintitrés veces más**. Se pone en ámbar al marcarla |

### ⚠️ El cronómetro NO es una barra de progreso

Una barra afirma que se sabe cuánto falta, y aquí no se sabe: el backend llama a un proveedor
externo y no informa del avance. Pintar una barra que se mueve sola sería **inventar un dato** — la
misma falta que rellenar un nulo con un cero, en otro sitio.

Lo que sí se sabe es cuánto lleva, y cuánto suele tardar. Eso se dice.

### ⚠️ Ningún caso de la comprobación gasta un céntimo

Una suite que llamara de verdad costaría dinero cada vez que alguien la corre, y la correría cada
vez menos gente hasta que nadie. Se comprueba lo que se puede sin pagar: que las cuatro llevan
`seco`, que el 409 llega explicado, y que gastar es explícito. Lo que hay detrás de la llamada ya lo
prueban las 411 del backend, con servidores de mentira.

### Lo que NO se pudo ver

⚠️ **El estado «corriendo» —el cronómetro— no se vio renderizado.** Para provocarlo hace falta o
gastar dinero de verdad, o reconfigurar el backend apuntando a un proveedor falso y lento, con sus
precondiciones (material, hallazgos, sobre de presupuesto). Queda anotado como pendiente de mirar,
no como comprobado.

---

## Fase 5 · hecha · Ajustes y equipo

### ⚠️ Un secreto que solo se ve una vez

El backend lo dice en su javadoc: el token de un enlace es *«la ÚNICA vez que el token plano sale de
este sistema. No se guarda en ningún sitio: si se pierde, se emite otro»*. En la base vive solo su
resumen, así que **nadie —ni soporte— puede recuperarlo después**.

Consecuencia para la pantalla, y es lo que más forma tiene de toda la fase:

- Se enseña una vez, en el bloque más grande de la vista, y **se dice que es la única**.
- No se guarda: ni en memoria más allá del aviso, ni en `localStorage`, ni en la URL.
- Al cerrar el aviso se pierde de verdad. **Eso no es un fallo: es el diseño.**

Un front que lo guardara «por comodidad» convertiría un secreto de un solo uso en uno que vive en el
navegador de cualquiera que abra esa pestaña.

### La conexión con Meta no reescribe lo que el backend dice

El endpoint devuelve `queHacer`, una frase escrita. La pantalla la pinta tal cual: *«Esta empresa no
tiene credenciales de Meta configuradas. Hasta que las tenga, la ingesta no traerá nada — y eso no
es un fallo: es que no hay de dónde»*. Un booleano sin qué hacer manda a abrir el código.

### El endpoint que faltaba · `GET /equipo/colaboradores` · hecho

Emitir un enlace pedía un UUID que **no se podía buscar desde ninguna parte**: el backend solo sabía
leer un colaborador por id. Lo encontró esta pantalla al montarse — una pieza que nada podía
alcanzar, el mismo hueco que este proyecto lleva encontrando siete veces.

Dos decisiones, las dos con su prueba:

| | |
|---|---|
| **Cuatro columnas y el semáforo, nada más** | La tabla guarda correos personales, whatsapp, desempeño, potencial y evaluaciones 360. Esto existe para **elegir a alguien de una lista**. Devolver la fila entera sería repartir la ficha de recursos humanos del equipo a quien sepa llamar a una URL |
| ⚠️ **No se filtra por `estado`** | `Planificacion` pide `where estado = 'ok'` y hace bien: no se reparte trabajo nuevo a quien no está bien. **Aquí sería al revés** — a quien está en `crit` es a quien más falta hace escuchar |

⚠️ **Y hay una trampa de nombre**: `estado` es del tipo `semaforo` —`ok`/`warn`/`crit`—, **no un
«activo/inactivo»**. Quien lo lea como lo segundo y filtre por él dejaría fuera justo a las personas
por las que se pregunta. En la pantalla el semáforo **se enseña, no se usa para esconder a nadie**.

Contraprobado en los dos sentidos: un `select *` tumba el caso de privacidad nombrando lo que se
escapó, y copiar el filtro de `Planificacion` tumba el de los semáforos. Backend en **417 pruebas**.

### ⚠️ Y un arreglo mío del 15-sep que salió mal, cazado aquí

Al arreglar el 200 mudo de revocar, el backend pasó a lanzar `EnlaceQueNoSirve` — **cuya única
manejadora vive en el controlador público**. La ruta interna se quedó sin nadie que la cogiera y
contestaba **500 genérico**: se cambió un fallo mudo por uno ruidoso y en el idioma equivocado
(*«pide uno nuevo a quien te lo envió»* se lo dice a un colaborador, no a quien administra).

La suite del servicio seguía en verde porque comprueba que el método lanza, no lo que sale por el
cable. **Lo cazó `npm run comprobar`**, que es exactamente para lo que existe.

Corregido en el backend: excepción propia `EseEnlaceNoExiste` con su manejador y un 404, más dos
casos por HTTP. Backend en 413 pruebas.

---

## Fase 7 · hecha · Enlace público

La única pantalla sin cuenta y sin sesión. Quien la abre llegó desde un WhatsApp, en su teléfono,
y no es usuario de la aplicación: no tiene fila en `perfiles`, ni rol, ni nada que resolver.

### ⚠️⚠️ El enlace se MUERE al abrirse, y eso invierte la regla de la fase 5

`EnlacesDeEquipo.abrir` acuña un token de sesión en la primera apertura y **reemplaza el resumen
guardado por el suyo**. En ese instante el token que viajó por WhatsApp deja de existir en la base
— no cuando caduque: al abrirse. El backend lo dice literal: *«el mensaje de WhatsApp que llevó el
enlace queda inútil EN ESE MOMENTO»*.

Consecuencia, y hay que leerla despacio:

> Si la pantalla no guarda el `tokenDeSesion` que le devuelven, la persona queda fuera
> **para siempre** en cuanto recargue.

Su enlace ya no vale —lo mató su propia apertura— y el de sesión se fue con la pestaña. En la base
vive solo un SHA-256: no hay de dónde recuperarlo.

**Así que aquí SÍ se guarda, al revés que en la fase 5**, y la diferencia no es un descuido:

| | El secreto es de | Dónde vive | Por qué |
|---|---|---|---|
| **Fase 5** · el token que se emite | la EMPRESA | en ningún sitio | Guardarlo dejaría la llave de un colaborador en el navegador de una oficina compartida |
| **Fase 7** · el token de sesión | la PERSONA | su propio teléfono | Es la única copia que queda en el mundo. No guardarlo es tirarlo |

La regla de la casa no era «los secretos no se guardan»: es **«un secreto vive donde su dueño, y en
ningún otro sitio»**. Hasta esta fase las dos frases decían lo mismo.

**Comprobado en el navegador, no solo por HTTP.** Se recargó la página y volvió a abrir; se borró el
`localStorage` y la misma URL contestó *«Ese enlace no sirve»*. El guardado es lo único que sostiene
la recarga.

### ⚠️ Y el token NO se quita de la URL, aunque apetezca

Lo primero que pide el cuerpo es un `history.replaceState` que limpie la barra de direcciones. Sería
un error caro: la URL es la **única pista durable** para reconocer el enlace al recargar. Quitarla
es perder la llave del cajón donde se guardó la otra.

Y no hace falta: después de la primera apertura lo que queda en la URL es un token **muerto**. Quien
copie esa dirección y la abra en otro teléfono no entra — allí no está el de sesión. La URL sola
deja de valer en cuanto se usa.

### Lo demás que decidió esta pantalla

| | |
|---|---|
| **Dos raíces en el router** | `/e/:empresa/:token` cuelga al mismo nivel que la aplicación del cliente, no dentro. La cabecera enseñaría cinco enlaces a pantallas que esa persona no puede abrir, y `resolverInstancia` tumbaría una vista que no la necesita |
| **Sin botón de reintentar** | Un enlace muerto no revive porque se pulse otra vez. Un botón que no arregla nada solo consigue que la persona lo pulse cinco veces antes de rendirse |
| **Campos a 16px** | Por debajo, iOS hace zoom solo al enfocar y la pantalla se descoloca sin que nadie la toque |
| **El contador no tiene meta** | «Ya has dejado 3 respuestas», y nada más. Nadie ha dicho cuántas se esperan: una barra de progreso se inventaría el denominador. La misma regla que el cronómetro de la fase 4 |
| **Se abre UNA vez al montar** | Cada apertura gasta uno de los 200 usos. El contador se suma en local tras responder — no se está suponiendo: se acaba de escribir la fila |
| **Cerrojo contra StrictMode** | React monta dos veces en desarrollo. Sin él, mirar la pantalla desgasta el enlace |

### ⚠️ Una prueba mía que no probaba nada, cazada antes de darla por buena

El caso «los vacíos viajan como NULO» terminaba en `exigir(true, "se guardó")`. Y era peor que
inútil: el backend hace `recortado()`, que convierte `""` en nulo él solito, **así que habría pasado
igual si esta capa mandase la cadena vacía**. La estaba pasando el backend, no el código que decía
comprobar.

Arreglado sacando la construcción del cuerpo a `cuerpoDeRespuesta()`, que se mira sin servidor.
Contraprobado: mandar `""` lo tumba —*«los espacios son nada, y salió ""»*— y omitir `documentado`
también —*«sin marcar es false, y salió undefined»*.

### Y el enlace que Ajustes copiaba no llevaba a ninguna parte

Hasta esta fase, Ajustes copiaba **el token pelado**: quien lo emitía tenía que fabricar la
dirección a mano, o mandarlo tal cual. No se había notado porque la pantalla a la que lleva no
existía. Ahora copia el enlace entero, construido por `enlaceDe` — la misma función que lee la
pantalla pública, para que el que escribe y el que lee no puedan discrepar.

De paso, `EMPRESA` vivía escrita en `App.jsx` y la necesitaban dos sitios. Se movió a
`nucleo/instancia.js`: una constante escrita dos veces es una segunda verdad, y el día que
discrepen el enlace apunta a una empresa distinta de la que está abierta.

---

## Decisiones tomadas, para no volver a discutirlas

| | Decisión | Por qué |
|---|---|---|
| **Repositorio propio** | No dentro de `RenaserOs` | Lo pidió el negocio. Coste: el sistema de diseño está en dos sitios hasta que se retire el panel viejo |
| **Identidad** | Obsidian Kinpaku | Es lo que `temas.js` llama «el estándar corporativo de RENASER OS» |
| **Sin router todavía** | Entra con la segunda pantalla | Decidir la forma de la navegación mirando una sola vista es la peor información posible |
| **Sesión de desarrollo en Vite** | La acuña el servidor, no el navegador | `CLAVE_LOCAL` sin prefijo `VITE_` no entra en el paquete. Es andamio y se borra |

---

## Sin decidir · y conviene no olvidarlo

- **¿Conviven las vistas nuevas con las 41 viejas, o las reemplazan?** Se aplazó a la fase 3.
- **¿Cómo se despliega?** Decide si hace falta CORS en el backend o un proxy delante.
- **A1 del backend** — proyecto por empresa o base por empresa. Esperando a que las vistas digan algo.
- ⚠️ **¿Los mensajes del backend llevan tilde?** Medido: de unos 70 sitios que escriben mensajes,
  **solo 2 las llevan**. La convención es no ponerlas, y hasta ahora daba igual — los leía el equipo
  dentro de la aplicación. Desde la fase 7 uno de ellos lo lee un colaborador en su teléfono:
  *«Pide uno nuevo a quien te lo envio»*. No se ha tocado nada: cambiarlo afecta a todo el backend,
  no a esta pantalla, y es una decisión tuya.

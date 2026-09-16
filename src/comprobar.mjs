#!/usr/bin/env node
/* ============================================================================
   `npm run comprobar` · todas las vistas contra el backend de verdad.
   ----------------------------------------------------------------------------
   Añadir una vista es añadir su `*.comprobar.mjs` a esta lista. Nada más.

   ⚠️ NO HAY DOBLES EN NINGUNO. Lo que hay que acertar es la FORMA de lo que
   contesta el backend, y un doble devuelve lo que se le pide: comprobaría que
   el código llama al código.
   ========================================================================= */

import "./nucleo/nucleo.comprobar.mjs";
import "./datos/logistica.comprobar.mjs";
import "./datos/eventos.comprobar.mjs";
import "./datos/programas.comprobar.mjs";
import "./datos/motor.comprobar.mjs";
import "./datos/ajustes.comprobar.mjs";
import "./datos/enlacePublico.comprobar.mjs";

const { correr } = await import("./comprobar/arnes.mjs");
process.exit((await correr()) ? 1 : 0);

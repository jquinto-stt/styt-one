/**
 * Raíz de estado de la SPA (MobX).
 *
 * Contenedor único de todos los stores. Por ahora está vacío: los slices
 * posteriores añaden aquí sus stores como propiedades, por ejemplo:
 *
 *   session = new SessionStore(this)   // Slice 02: sesión y usuario
 *   board = new BoardStore(this)       // Slice 03+: tablero y tareas
 *
 * Pasar `this` a cada store permite que unos consulten a otros a través de la raíz.
 */
export class RootStore {}

import { HealthStore } from './HealthStore'

/**
 * Raíz de estado de la SPA.
 * Los slices posteriores añaden aquí sus stores (sesión en Slice 02, tablero en Slice 03+).
 */
export class RootStore {
  health: HealthStore

  constructor() {
    this.health = new HealthStore()
  }
}

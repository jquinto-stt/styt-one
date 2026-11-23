import { makeAutoObservable, runInAction } from 'mobx'
import { fetchHealth } from '../services/api'

export type HealthStatus = 'idle' | 'loading' | 'ok' | 'error'

/** Estado de conectividad con el microservicio (llamada de prueba del Slice 01). */
export class HealthStore {
  status: HealthStatus = 'idle'
  message = ''

  constructor() {
    makeAutoObservable(this)
  }

  async check() {
    this.status = 'loading'
    try {
      const data = await fetchHealth()
      runInAction(() => {
        this.status = 'ok'
        this.message = `${data.service} · ${data.status}`
      })
    } catch (err) {
      runInAction(() => {
        this.status = 'error'
        this.message = err instanceof Error ? err.message : 'Error desconocido'
      })
    }
  }
}

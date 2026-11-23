import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import { useStore } from '../stores/useStore'
import './HealthStatus.css'

const LABELS = {
  idle: 'Sin comprobar',
  loading: 'Comprobando…',
  ok: 'Conectado',
  error: 'Sin conexión',
} as const

export const HealthStatus = observer(function HealthStatus() {
  const { health } = useStore()

  useEffect(() => {
    void health.check()
  }, [health])

  return (
    <div className={`health health--${health.status}`} data-testid="health-status">
      <span className="health__dot" aria-hidden="true" />
      <span>Backend: {LABELS[health.status]}</span>
      {health.message && <span className="health__detail">({health.message})</span>}
    </div>
  )
})

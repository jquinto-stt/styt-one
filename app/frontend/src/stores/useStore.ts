import { useContext } from 'react'
import type { RootStore } from '@/stores/RootStore'
import { StoreContext } from '@/stores/StoreContext'

/**
 * Acceso al RootStore desde cualquier componente.
 * Los componentes que lean estado observable deben envolverse con `observer`
 * (de mobx-react-lite) para re-renderizarse cuando ese estado cambie.
 */
export function useStore(): RootStore {
  const store = useContext(StoreContext)
  if (!store) {
    throw new Error('useStore debe usarse dentro de <StoreProvider>')
  }
  return store
}

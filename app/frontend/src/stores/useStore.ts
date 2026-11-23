import { useContext } from 'react'
import { StoreContext } from './context'
import type { RootStore } from './RootStore'

export function useStore(): RootStore {
  const store = useContext(StoreContext)
  if (!store) {
    throw new Error('useStore debe usarse dentro de <StoreProvider>')
  }
  return store
}

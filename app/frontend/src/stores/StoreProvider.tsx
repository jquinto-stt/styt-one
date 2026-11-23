import type { ReactNode } from 'react'
import type { RootStore } from '@/stores/RootStore'
import { StoreContext } from '@/stores/StoreContext'

interface StoreProviderProps {
  store: RootStore
  children: ReactNode
}

/** Hace disponible el RootStore a todos los componentes que envuelve. */
export function StoreProvider({ store, children }: StoreProviderProps) {
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}

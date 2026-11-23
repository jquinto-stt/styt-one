import type { ReactNode } from 'react'
import { StoreContext } from './context'
import type { RootStore } from './RootStore'

export function StoreProvider({ store, children }: { store: RootStore; children: ReactNode }) {
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}

import { createContext } from 'react'
import type { RootStore } from '@/stores/RootStore'

/** Context de React que transporta el RootStore por el árbol de componentes. */
export const StoreContext = createContext<RootStore | null>(null)

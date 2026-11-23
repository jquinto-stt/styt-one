import type { ReactNode } from 'react'
import { Header } from './Header'
import './AppShell.css'

/** Shell de una sola pantalla: header fijo + área principal que alojará el tablero. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <Header />
      <main className="app-shell__main">{children}</main>
    </div>
  )
}

import { AppShell } from './components/AppShell'
import { HealthStatus } from './components/HealthStatus'

function App() {
  return (
    <AppShell>
      {/* El tablero se monta aquí a partir del Slice 03. */}
      <HealthStatus />
    </AppShell>
  )
}

export default App

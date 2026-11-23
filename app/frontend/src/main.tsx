import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './theme/theme.css'
import App from './App.tsx'
import { RootStore } from './stores/RootStore'
import { StoreProvider } from './stores/StoreContext'

const rootStore = new RootStore()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider store={rootStore}>
      <App />
    </StoreProvider>
  </StrictMode>,
)

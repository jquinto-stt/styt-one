# styt-one · Webi Todo

Monorepo con npm workspaces:

| Carpeta | Contenido |
|---|---|
| `app/frontend/` | SPA React + Vite + TypeScript, estado con MobX |
| `app/backend/` | Microservicio Express + TypeScript |

## Requisitos

- Node.js 22+

## Uso

```bash
npm install
npm run dev     # levanta backend (:3000) y frontend (:5173)
npm run build   # compila backend y frontend
```

Abre http://localhost:5173. El header muestra el branding "Webi Todo" y el indicador
"Backend: Conectado" confirma que la SPA llega al microservicio.

## Arquitectura

- **Proxy sin CORS:** Vite reenvía `/api/*` a `http://localhost:3000` (configurable con
  `API_TARGET`), así que el navegador siempre habla con el mismo origen.
- **Estado:** `app/frontend/src/stores/RootStore.ts` es la raíz de MobX, provista con
  `StoreProvider` y consumida con `useStore()`. Los slices posteriores añaden sus stores ahí.
- **Tema base:** tokens de diseño (colores, tipografía, espaciado) como variables CSS en
  `app/frontend/src/theme/theme.css`.
- **Shell:** `AppShell` (header + área principal de una sola pantalla) en
  `app/frontend/src/components/`.
- **API:** `app/backend/src/app.ts` monta los routers; endpoint de salud en `GET /api/health`.

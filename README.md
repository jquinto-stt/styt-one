# styt-one · ST&T One

- `iniciativa_styt_one/`: documentación de visión, alcance y referencia funcional de ST&T One.
- `app/`: monorepo de la aplicación.
  - `app/frontend/`: SPA React 18 + TypeScript + Vite + MobX + Tailwind CSS 4.
  - `app/backend/`: API REST Express 5 + TypeScript + PostgreSQL (`pgvector`) + Azure OpenAI + Azure AI Content Safety.
- `docker-compose.yml`: levanta PostgreSQL 16 con `pgvector` (`styt-one-db`) y el backend containerizado (`styt-one-backend`).

## Arquitectura del backend e IA (Azure)

- **Persistencia local en Docker:** PostgreSQL 16 con extensión `pgvector` (`styt-one-db`, puerto `127.0.0.1:5432`) almacenando usuarios con contraseñas hasheadas (`scrypt`), sesiones `HttpOnly` (TTL 8 h con revocación en logout), políticas versionadas con embeddings, fichas de proyectos y membresías, carpetas, conversaciones, preferencias y registro de auditoría.
- **Control de acceso (RBAC en backend):** toda consulta a perfil, proyectos, administración y contexto de chat se filtra en SQL antes de invocar al modelo. Las citas devueltas por el modelo se validan en backend contra los recursos autorizados del usuario.
- **Servicios de IA en Azure (`rg-styt-one-dev`, `eastus2`):**
  - **Azure OpenAI (`oai-styt-one-dev-eus2`):**
    - Chat con salida estructurada JSON y baja latencia (`gpt-5.5`, `GlobalStandard`, `reasoning_effort=none`) bajo la identidad del asistente **ST&T ATLAS**.
    - Conversación de voz en tiempo real vía WebRTC (`gpt-realtime-2.1`, voces expresivas `marin`/`cedar` a velocidad natural `1.0x` con guía de español colombiano neutro, `POST /api/voice/realtime/connect` + persistencia en `POST /api/voice/realtime/turns`).
    - Embeddings semánticos (`text-embedding-3-small`, 1536 dimensiones en `pgvector`).
    - Dictado voz a texto (`gpt-4o-mini-transcribe`, `POST /api/voice/transcribe`).
  - **Azure AI Speech (`sp-styt-one-dev-eus2`, `F0`):**
    - Voces neurales nativas de Colombia (`es-CO-SalomeNeural` y `es-CO-GonzaloNeural`) para lectura en voz alta (`POST /api/voice/speak`), con respaldo automático en `gpt-4o-mini-tts`.
  - **Azure AI Content Safety (`cs-styt-one-dev-eus2`, `F0`):**
    - Prompt Shields (`text:shieldPrompt`) para mitigar inyección de instrucciones en consultas y documentos recuperados.
- **Empaquetado y despliegue en Kubernetes (AKS):**
  - Manifiestos en `k8s/` (`Namespace`, `ConfigMap`, plantilla `02-secrets.example.yaml`, `PostgreSQL + pgvector` con PVC `managed-csi`, `styt-one-backend`, `styt-one-frontend` con Nginx, `ClusterIssuer` Let's Encrypt + `Ingress` HTTPS).
  - Imágenes publicadas en Azure Container Registry (`crstytonedev2026.azurecr.io`) y desplegadas en `aks-styt-one-dev` (`rg-styt-one-dev`).

## Configuración

Copia `app/backend/.env.example` como `app/backend/.env` (archivo ignorado por Git) y completa las variables de Azure OpenAI y Azure AI Content Safety.

## Ejecución con Docker

```bash
# Levantar PostgreSQL (pgvector) y backend en http://localhost:3001
docker compose up -d --build

# Verificar salud del servicio
curl http://localhost:3001/api/health
```

## Frontend (desarrollo local)

El servidor de Vite en `http://localhost:5173` proxea automáticamente `/api` hacia `http://localhost:3001`.

```bash
cd app/frontend
npm install
npm run dev     # http://localhost:5173
```

## Pruebas del backend

```bash
cd app/backend
npm install
npm run build
npm test
```

## Cuentas de demostración

Contraseña común para demo local: `Demo-One-2026`.

| Usuario | Nombre | Rol | Acceso |
|---|---|---|---|
| `colaborador` | Ana Torres | Colaborador | Perfil propio, políticas y proyecto Atlas |
| `lider` | Luis Vega | Líder de proyecto | Perfil propio, políticas, Atlas y Faro |
| `admin` | Sara Mora | Administrador | Acceso completo + publicación de políticas, edición de fichas y auditoría |

export interface HealthResponse {
  status: string
  service: string
  timestamp: string
}

/** Rutas relativas: el proxy de Vite las reenvía al microservicio. */
export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch('/api/health')
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`)
  }
  return (await res.json()) as HealthResponse
}

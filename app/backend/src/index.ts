import 'dotenv/config'
import { createApp } from './app.js'
import { loadConfig } from './config.js'
import { createPool } from './db/pool.js'
import { initializeSchema } from './db/schema.js'
import { seedDatabase } from './db/seed.js'
import { AzureAiProvider } from './services/azure-ai.js'
import { syncEmbeddings } from './services/retrieval.js'

async function start(): Promise<void> {
  const config = loadConfig()
  const pool = createPool(config.databaseUrl)
  const aiProvider = new AzureAiProvider(config)

  await initializeSchema(pool)
  await seedDatabase(pool)

  // Synchronize pgvector embeddings in the background when Azure OpenAI is configured.
  void syncEmbeddings(pool, aiProvider).catch((err) => {
    console.warn(
      '[backend] Initial embedding sync skipped:',
      err instanceof Error ? err.message : 'Unknown error',
    )
  })

  const app = createApp({ pool, aiProvider, config })
  const server = app.listen(config.port, () => {
    console.log(`[backend] listening on http://localhost:${config.port}`)
  })

  const shutdown = async (signal: string) => {
    console.log(`[backend] received ${signal}, shutting down...`)
    server.close(async () => {
      await pool.end()
      process.exit(0)
    })
  }

  process.on('SIGINT', () => void shutdown('SIGINT'))
  process.on('SIGTERM', () => void shutdown('SIGTERM'))
}

start().catch((err) => {
  console.error(
    '[backend] Fatal startup error:',
    err instanceof Error ? err.message : 'Unknown error',
  )
  process.exit(1)
})

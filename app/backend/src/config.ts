export type ReasoningEffort = 'none' | 'minimal' | 'low' | 'medium' | 'high'

const VALID_REASONING_EFFORTS = new Set<ReasoningEffort>([
  'none',
  'minimal',
  'low',
  'medium',
  'high',
])

export interface AppConfig {
  port: number
  databaseUrl: string
  cookieSecure: boolean
  sessionTtlHours: number
  azureOpenAi: {
    endpoint: string
    apiKey: string
    apiVersion: string
    chatDeployment: string
    embeddingDeployment: string
    sttDeployment: string
    ttsDeployment: string
    realtimeDeployment: string
    reasoningEffort: ReasoningEffort
  }
  azureSpeech: {
    apiKey: string
    region: string
  }
  azureContentSafety: {
    endpoint: string
    apiKey: string
  }
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const port = Number(env.PORT ?? 3001)
  const sessionTtlHours = Number(env.SESSION_TTL_HOURS ?? 8)
  const rawEffort = env.AZURE_OPENAI_REASONING_EFFORT?.trim().toLowerCase()
  const reasoningEffort: ReasoningEffort =
    rawEffort && VALID_REASONING_EFFORTS.has(rawEffort as ReasoningEffort)
      ? (rawEffort as ReasoningEffort)
      : 'none'

  return {
    port: Number.isFinite(port) && port > 0 ? port : 3001,
    databaseUrl:
      env.DATABASE_URL?.trim() ||
      'postgresql://styt_one:styt_one_dev@localhost:5432/styt_one',
    cookieSecure: env.COOKIE_SECURE === 'true',
    sessionTtlHours:
      Number.isFinite(sessionTtlHours) && sessionTtlHours > 0 ? sessionTtlHours : 8,
    azureOpenAi: {
      endpoint: env.AZURE_OPENAI_ENDPOINT?.trim() ?? '',
      apiKey: env.AZURE_OPENAI_API_KEY?.trim() ?? '',
      apiVersion: env.AZURE_OPENAI_API_VERSION?.trim() || '2025-03-01-preview',
      chatDeployment: env.AZURE_OPENAI_CHAT_DEPLOYMENT?.trim() || 'gpt-5.5',
      embeddingDeployment:
        env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT?.trim() || 'text-embedding-3-small',
      sttDeployment:
        env.AZURE_OPENAI_STT_DEPLOYMENT?.trim() || 'gpt-4o-mini-transcribe',
      ttsDeployment:
        env.AZURE_OPENAI_TTS_DEPLOYMENT?.trim() || 'gpt-4o-mini-tts',
      realtimeDeployment:
        env.AZURE_OPENAI_REALTIME_DEPLOYMENT?.trim() || 'gpt-realtime-2.1',
      reasoningEffort,
    },
    azureSpeech: {
      apiKey: env.AZURE_SPEECH_KEY?.trim() ?? '',
      region: env.AZURE_SPEECH_REGION?.trim() || 'eastus2',
    },
    azureContentSafety: {
      endpoint: env.AZURE_CONTENT_SAFETY_ENDPOINT?.trim() ?? '',
      apiKey: env.AZURE_CONTENT_SAFETY_KEY?.trim() ?? '',
    },
  }
}

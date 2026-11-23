export type Role = 'Colaborador' | 'Líder de proyecto' | 'Administrador'

export type EvidenceKind = 'found' | 'inference' | 'none' | 'outdated'

export type SourceScope = 'all' | 'policies' | 'projects' | 'profile'

export interface DemoUser {
  login: string
  name: string
  initials: string
  email: string
  role: Role
  area: string
}

export interface PolicySummary {
  topic: string
  title: string
  category: string
  section: string
  version: number
  current: boolean
  updated: string
  summary: string
  body: string
}

export interface PolicyVersionItem {
  id: number
  version: number
  section: string
  current: boolean
  updated: string
  summary: string
  body: string
  createdBy: string | null
  createdAt: string
}

export interface PolicyDetail extends PolicySummary {
  versions: PolicyVersionItem[]
}

export interface ProjectRecord {
  id: string
  name: string
  description: string
  owner: string
  status: string
  updated: string | null
  members: string[]
}

export interface CitationSource {
  label: string
  to: string
}

export interface ChatMessageRecord {
  id: string
  conversationId: string
  sender: 'user' | 'assistant'
  text: string
  kind: EvidenceKind | null
  source: CitationSource | null
  choices: string[]
  createdAt: string
}

export interface ConversationSummary {
  id: string
  title: string
  folderId: string | null
  folderName: string | null
  archived: boolean
  preview: string | null
  createdAt: string
  updatedAt: string
}

export interface FolderRecord {
  id: string
  name: string
  count: number
  createdAt: string
}

export interface ConnectedAppsConfig {
  policies: boolean
  projects: boolean
  profile: boolean
}

export interface UserPreferences {
  detailLevel: string
  tone: string
  alwaysShowSource: boolean
  suggestRelated: boolean
  additionalContext: string
  connectedApps: ConnectedAppsConfig
  updatedAt: string
}

export interface IntegrationItem {
  key: string
  name: string
  description: string
  category: 'Fuentes' | 'Herramientas'
  status: 'Conectada' | 'Disponible' | 'Próximamente'
  initials: string
  enabled: boolean
}

export interface AuditLogRecord {
  id: number
  eventType: string
  actorLogin: string | null
  resource: string | null
  outcome: string
  details: Record<string, unknown>
  createdAt: string
}

declare global {
  namespace Express {
    interface Request {
      user?: DemoUser
      sessionTokenHash?: string
    }
  }
}

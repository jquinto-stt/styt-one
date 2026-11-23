export type Role = "Colaborador" | "Líder de proyecto" | "Administrador";

export type EvidenceKind = "found" | "inference" | "none" | "outdated";

export type SourceScope = "all" | "policies" | "projects" | "profile";

export type VoiceName =
  | "es-CO-SalomeNeural"
  | "es-CO-GonzaloNeural"
  | "marin"
  | "cedar"
  | "coral"
  | "sage"
  | "alloy"
  | "echo"
  | "shimmer";

export interface DemoUser {
  login: string;
  name: string;
  initials: string;
  email: string;
  role: Role;
  area: string;
}

export interface PolicySummary {
  topic: string;
  title: string;
  category: string;
  section: string;
  version: number;
  current: boolean;
  updated: string;
  summary: string;
  body: string;
}

export interface PolicyVersionItem {
  id: number;
  version: number;
  section: string;
  current: boolean;
  updated: string;
  summary: string;
  body: string;
  createdBy: string | null;
  createdAt: string;
}

export interface PolicyDetail extends PolicySummary {
  versions: PolicyVersionItem[];
}

export interface ProjectRecord {
  id: string;
  name: string;
  description: string;
  owner: string;
  status: string;
  updated: string | null;
  members: string[];
}

export interface CitationSource {
  label: string;
  to: string;
}

export interface ChatMessageRecord {
  id: string;
  conversationId: string;
  sender: "user" | "assistant";
  text: string;
  kind: EvidenceKind | null;
  source: CitationSource | null;
  choices: string[];
  createdAt: string;
}

export interface ChatResponsePayload {
  conversationId: string;
  userMessage: ChatMessageRecord;
  assistantMessage: ChatMessageRecord;
}

export type SendChatResponse = ChatResponsePayload;

export interface ConversationSummary {
  id: string;
  title: string;
  folderId: string | null;
  folderName: string | null;
  archived: boolean;
  preview: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FolderRecord {
  id: string;
  name: string;
  count: number;
  createdAt: string;
}

export interface ConnectedAppsConfig {
  policies: boolean;
  projects: boolean;
  profile: boolean;
}

export interface UserPreferences {
  detailLevel: string;
  tone: string;
  alwaysShowSource: boolean;
  suggestRelated: boolean;
  additionalContext: string;
  connectedApps: ConnectedAppsConfig;
  updatedAt: string;
}

export interface IntegrationItem {
  key: string;
  name: string;
  description: string;
  category: "Fuentes" | "Herramientas";
  status: "Conectada" | "Disponible" | "Próximamente";
  initials: string;
  enabled: boolean;
}

export interface AuditLogRecord {
  id: number;
  eventType: string;
  actorLogin: string | null;
  resource: string | null;
  outcome: string;
  details: Record<string, unknown>;
  createdAt: string;
}

export interface HealthResponse {
  status: "ok" | "error";
  service: string;
  database: "connected" | "disconnected";
  aiConfigured?: boolean;
  contentSafetyConfigured?: boolean;
  voiceConfigured?: boolean;
  speechConfigured?: boolean;
  chatDeployment?: string;
  realtimeConfigured?: boolean;
  realtimeDeployment?: string | null;
  timestamp: string;
}

export interface AdminOverviewStats {
  usersCount: number;
  policiesCount: number;
  projectsCount: number;
  conversationsCount: number;
  auditCount: number;
}

export interface AdminOverviewResponse {
  policies: PolicySummary[];
  projects: ProjectRecord[];
  stats: AdminOverviewStats;
}

export interface SendChatParams {
  question: string;
  conversationId?: string;
  folderId?: string;
  sourceScope?: SourceScope;
  voiceMode?: boolean;
}

export type SendChatRequest = SendChatParams;

export interface GetConversationsParams {
  archived?: boolean | "true" | "false" | "all";
  folderId?: string;
}

export interface UpdateConversationBody {
  title?: string;
  folderId?: string | null;
  archived?: boolean;
}

export interface UpdatePreferencesBody {
  detailLevel?: string;
  tone?: string;
  alwaysShowSource?: boolean;
  suggestRelated?: boolean;
  additionalContext?: string;
  connectedApps?: Partial<ConnectedAppsConfig>;
}

export interface PublishPolicyVersionBody {
  section: string;
  summary?: string;
  body: string;
  current?: boolean;
  updated?: string;
}

export interface UpdateAdminProjectBody {
  name?: string;
  description: string;
  owner: string;
  status: string;
  updated?: string | null;
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

function defaultErrorMessage(status: number): string {
  switch (status) {
    case 401:
      return "Tu sesión ha expirado. Vuelve a iniciar sesión para continuar.";
    case 403:
      return "No tienes permiso para acceder a este recurso.";
    case 404:
      return "El recurso solicitado no fue encontrado.";
    case 503:
      return "El servicio no está disponible en este momento. Intenta nuevamente en unos segundos.";
    default:
      return "Ocurrió un error al comunicarse con el servidor. Intenta nuevamente.";
  }
}

const AUTH_EXEMPT_401_PATHS = new Set([
  "/api/auth/me",
  "/api/auth/login",
  "/api/auth/logout",
]);

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }
  if (init.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      headers,
      credentials: "include",
    });
  } catch {
    throw new ApiError(
      0,
      "No fue posible conectar con el servidor. Verifica tu conexión e intenta nuevamente.",
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  let parsed: unknown = null;
  if (contentType.includes("application/json")) {
    try {
      parsed = await response.json();
    } catch {
      parsed = null;
    }
  }

  if (!response.ok) {
    let message = defaultErrorMessage(response.status);
    if (parsed && typeof parsed === "object") {
      const record = parsed as { error?: unknown; message?: unknown };
      if (typeof record.error === "string" && record.error.trim().length > 0) {
        message = record.error;
      } else if (typeof record.message === "string" && record.message.trim().length > 0) {
        message = record.message;
      }
    }

    if (response.status === 401 && !AUTH_EXEMPT_401_PATHS.has(path.split("?")[0])) {
      unauthorizedHandler?.();
    }

    throw new ApiError(response.status, message);
  }

  return parsed as T;
}

export function getErrorMessage(err: unknown, fallback = "No se pudo completar la operación. Intenta nuevamente."): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error && err.message.trim().length > 0) return err.message;
  return fallback;
}

export function formatShortDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

// Health
export function getHealth() {
  return apiFetch<HealthResponse>("/api/health");
}

// Auth
export function getDemoAccounts() {
  return apiFetch<{ accounts: DemoUser[] }>("/api/auth/demo-accounts");
}

export function login(userLogin: string, password: string) {
  return apiFetch<{ user: DemoUser }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ login: userLogin, password }),
  });
}

export function logout() {
  return apiFetch<{ ok: boolean }>("/api/auth/logout", {
    method: "POST",
  });
}

export function getMe() {
  return apiFetch<{ user: DemoUser }>("/api/auth/me");
}

// Profile
export function getProfile() {
  return apiFetch<{ profile: DemoUser }>("/api/profile");
}

// Policies
export function getPolicies(category?: string) {
  const params = new URLSearchParams();
  if (category && category !== "Todas") {
    params.set("category", category);
  }
  const query = params.toString();
  return apiFetch<{ policies: PolicySummary[] }>(`/api/policies${query ? `?${query}` : ""}`);
}

export function getPolicy(topic: string) {
  return apiFetch<{ policy: PolicyDetail }>(`/api/policies/${encodeURIComponent(topic)}`);
}

// Projects
export function getProjects() {
  return apiFetch<{ projects: ProjectRecord[] }>("/api/projects");
}

export function getProject(id: string) {
  return apiFetch<{ project: ProjectRecord }>(`/api/projects/${encodeURIComponent(id)}`);
}

// Chat
export function sendChat(params: SendChatParams) {
  const body: {
    message: string;
    conversationId?: string;
    folderId?: string;
    sourceScope?: SourceScope;
    voiceMode?: boolean;
  } = {
    message: params.question,
  };
  if (params.conversationId) body.conversationId = params.conversationId;
  if (params.folderId) body.folderId = params.folderId;
  if (params.sourceScope) body.sourceScope = params.sourceScope;
  if (params.voiceMode !== undefined) body.voiceMode = params.voiceMode;

  return apiFetch<ChatResponsePayload>("/api/chat", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// Voice (Azure OpenAI STT / TTS)
export interface SynthesizeSpeechPayload {
  text: string;
  voice?: VoiceName;
  speed?: number;
}

export interface ConnectRealtimeVoicePayload {
  sdp: string;
  voice?: VoiceName;
  speed?: number;
  language?: string;
  sourceScope?: SourceScope;
}

export interface ConnectRealtimeVoiceResponse {
  sdp: string;
  sessionId: string | null;
  model: string;
  voice: string;
}

export interface SaveRealtimeTurnPayload {
  conversationId?: string;
  folderId?: string;
  userText: string;
  assistantText: string;
}

async function extractResponseError(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      const parsed = (await response.json()) as { error?: unknown; message?: unknown } | null;
      if (parsed && typeof parsed.error === "string" && parsed.error.trim().length > 0) {
        return parsed.error;
      }
      if (parsed && typeof parsed.message === "string" && parsed.message.trim().length > 0) {
        return parsed.message;
      }
    } catch {
      // Fall back to default message.
    }
  }
  return defaultErrorMessage(response.status);
}

export async function transcribeAudio(
  audioBlob: Blob,
  language?: string,
  signal?: AbortSignal,
): Promise<{ text: string }> {
  const params = new URLSearchParams();
  if (language && language.trim().length > 0) {
    params.set("language", language.trim());
  }
  const query = params.toString();
  const path = `/api/voice/transcribe${query ? `?${query}` : ""}`;

  let response: Response;
  try {
    response = await fetch(path, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": audioBlob.type || "audio/webm",
        Accept: "application/json",
      },
      body: audioBlob,
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw err;
    }
    throw new ApiError(
      0,
      "No fue posible conectar con el servicio de transcripción. Intenta nuevamente.",
    );
  }

  if (!response.ok) {
    const message = await extractResponseError(response);
    if (response.status === 401) {
      unauthorizedHandler?.();
    }
    throw new ApiError(response.status, message);
  }

  return (await response.json()) as { text: string };
}

export async function synthesizeSpeech(
  payload: SynthesizeSpeechPayload,
  signal?: AbortSignal,
): Promise<Blob> {
  let response: Response;
  try {
    response = await fetch("/api/voice/speak", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "audio/mpeg, application/json",
      },
      body: JSON.stringify(payload),
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw err;
    }
    throw new ApiError(
      0,
      "No fue posible conectar con el servicio de voz. Intenta nuevamente.",
    );
  }

  if (!response.ok) {
    const message = await extractResponseError(response);
    if (response.status === 401) {
      unauthorizedHandler?.();
    }
    throw new ApiError(response.status, message);
  }

  return await response.blob();
}

export async function connectRealtimeVoice(
  payload: ConnectRealtimeVoicePayload,
  signal?: AbortSignal,
): Promise<ConnectRealtimeVoiceResponse> {
  const body: ConnectRealtimeVoicePayload = {
    sdp: payload.sdp,
  };
  if (payload.voice) body.voice = payload.voice;
  if (payload.speed !== undefined) body.speed = payload.speed;
  if (payload.language) body.language = payload.language;
  if (payload.sourceScope) body.sourceScope = payload.sourceScope;

  let response: Response;
  try {
    response = await fetch("/api/voice/realtime/connect", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw err;
    }
    throw new ApiError(
      0,
      "No fue posible establecer la conexión de voz en tiempo real. Verifica tu red e intenta nuevamente.",
    );
  }

  if (!response.ok) {
    const message = await extractResponseError(response);
    if (response.status === 401) {
      unauthorizedHandler?.();
    }
    throw new ApiError(response.status, message);
  }

  return (await response.json()) as ConnectRealtimeVoiceResponse;
}

export function saveRealtimeTurn(payload: SaveRealtimeTurnPayload) {
  const body: SaveRealtimeTurnPayload = {
    userText: payload.userText,
    assistantText: payload.assistantText,
  };
  if (payload.conversationId) body.conversationId = payload.conversationId;
  if (payload.folderId) body.folderId = payload.folderId;

  return apiFetch<SendChatResponse>("/api/voice/realtime/turns", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// Conversations
export function getConversations(params?: GetConversationsParams) {
  const search = new URLSearchParams();
  if (params?.archived !== undefined) {
    search.set("archived", String(params.archived));
  }
  if (params?.folderId) {
    search.set("folderId", params.folderId);
  }
  const query = search.toString();
  return apiFetch<{ conversations: ConversationSummary[] }>(
    `/api/conversations${query ? `?${query}` : ""}`,
  );
}

export function getConversation(id: string) {
  return apiFetch<{ conversation: ConversationSummary; messages: ChatMessageRecord[] }>(
    `/api/conversations/${encodeURIComponent(id)}`,
  );
}

export function updateConversation(id: string, body: UpdateConversationBody) {
  return apiFetch<{ conversation: ConversationSummary }>(
    `/api/conversations/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
  );
}

export function deleteConversation(id: string) {
  return apiFetch<{ ok: boolean }>(`/api/conversations/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

// Folders
export function getFolders() {
  return apiFetch<{ folders: FolderRecord[] }>("/api/folders");
}

export function createFolder(name: string) {
  return apiFetch<{ folder: FolderRecord }>("/api/folders", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

// Integrations
export function getIntegrations() {
  return apiFetch<{ integrations: IntegrationItem[] }>("/api/integrations");
}

// Settings
export function getPreferences() {
  return apiFetch<{ preferences: UserPreferences }>("/api/settings/preferences");
}

export function updatePreferences(body: UpdatePreferencesBody) {
  return apiFetch<{ preferences: UserPreferences }>("/api/settings/preferences", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

// Admin
export function getAdminOverview() {
  return apiFetch<AdminOverviewResponse>("/api/admin/overview");
}

export function publishPolicyVersion(topic: string, body: PublishPolicyVersionBody) {
  return apiFetch<{ policy: PolicySummary }>(
    `/api/admin/policies/${encodeURIComponent(topic)}/versions`,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}

export function updateAdminProject(id: string, body: UpdateAdminProjectBody) {
  return apiFetch<{ project: ProjectRecord }>(
    `/api/admin/projects/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      body: JSON.stringify(body),
    },
  );
}

export function getAdminAudit(limit = 50) {
  return apiFetch<{ logs: AuditLogRecord[] }>(`/api/admin/audit?limit=${limit}`);
}

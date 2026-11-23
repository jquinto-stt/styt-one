import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatComposer, type ChatSendOptions } from "@/components/chat/ChatComposer";
import { RealtimeVoiceBar } from "@/components/chat/RealtimeVoiceBar";
import { AtlasOrb } from "@/components/brand/AtlasOrb";
import { Alert } from "@/elements/ui/alert";
import { Badge } from "@/elements/ui/badge";
import { Button } from "@/elements/ui/button";
import { AtlasThinkingBubble, PageLoadingState } from "@/components/feedback/BrandLoader";
import {
  AudioIcon,
  BoltIcon,
  DocsIcon,
  FolderIcon,
  PlusIcon,
  UserCircleIcon,
} from "@/icons";
import { ErrorPage } from "@/pages/ErrorPage";
import {
  useRealtimeVoice,
  type RealtimeTurnPayload,
} from "@/hooks/useRealtimeVoice";
import {
  getSpeechPreferences,
  speakMessage,
  stopSpeech,
  useSpeechPlayer,
} from "@/services/speech";
import {
  ApiError,
  formatShortDate,
  getConversation,
  getConversations,
  getErrorMessage,
  getFolders,
  saveRealtimeTurn,
  sendChat,
  updateConversation,
  type ChatMessageRecord,
  type CitationSource,
  type ConversationSummary,
  type FolderRecord,
  type SourceScope,
} from "@/services/api";
import { cn } from "@/utils";

interface ConversationNavState {
  initialQuestion?: string;
  folderId?: string;
  sourceScope?: SourceScope;
  sourceLabel?: string;
  viaVoice?: boolean;
  startRealtime?: boolean;
}

const SCOPE_LABELS: Record<Exclude<SourceScope, "all">, string> = {
  policies: "Políticas corporativas",
  projects: "Fichas de proyecto",
  profile: "Perfil del colaborador",
};

const SCOPE_PILLS: { value: SourceScope; label: string; sourceLabel?: string }[] = [
  { value: "all", label: "Todas" },
  { value: "policies", label: "Políticas", sourceLabel: "Políticas corporativas" },
  { value: "projects", label: "Proyectos", sourceLabel: "Fichas de proyecto" },
  { value: "profile", label: "Mi perfil", sourceLabel: "Perfil del colaborador" },
];

const EMPTY_STARTERS = [
  {
    title: "Vacaciones",
    question: "¿Cómo pido vacaciones?",
    Icon: DocsIcon,
  },
  {
    title: "Mi perfil",
    question: "¿Qué datos hay en mi perfil?",
    Icon: UserCircleIcon,
  },
  {
    title: "Mis proyectos",
    question: "¿En qué proyectos participo?",
    Icon: FolderIcon,
  },
  {
    title: "Estado de proyecto",
    question: "Resume el estado de mi proyecto",
    Icon: BoltIcon,
  },
];

function RailIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn("size-4", className)}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2.5" y="3.5" width="15" height="13" rx="2.5" />
      <path d="M12.5 3.5v13" />
    </svg>
  );
}

/**
 * Espacio de conversación de pantalla completa con ST&T ATLAS, voz en vivo
 * y panel lateral de contexto, fuentes verificadas e historial reciente.
 */
export function ConversationPage() {
  const { id: routeId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const navState = (location.state as ConversationNavState | null) ?? null;

  const speechPlayer = useSpeechPlayer();

  const [conversationId, setConversationId] = useState<string | null>(routeId ?? null);
  const [conversation, setConversation] = useState<ConversationSummary | null>(null);
  const [messages, setMessages] = useState<ChatMessageRecord[]>([]);
  const [folders, setFolders] = useState<FolderRecord[]>([]);
  const [recentConversations, setRecentConversations] = useState<ConversationSummary[]>([]);
  const [railOpen, setRailOpen] = useState(true);

  const [activeFolderId, setActiveFolderId] = useState<string | undefined>(navState?.folderId);
  const [sourceScope, setSourceScope] = useState<SourceScope | undefined>(navState?.sourceScope);
  const [sourceLabel, setSourceLabel] = useState<string | undefined>(navState?.sourceLabel);
  const [voiceReplyMode, setVoiceReplyMode] = useState<boolean>(Boolean(navState?.viaVoice));
  const [savingRealtimeTurn, setSavingRealtimeTurn] = useState(false);

  const [loadingConversation, setLoadingConversation] = useState(Boolean(routeId));
  const [sending, setSending] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [sendError, setSendError] = useState<{
    message: string;
    question: string;
    viaVoice?: boolean;
  } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [httpErrorStatus, setHttpErrorStatus] = useState<403 | 404 | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const mountedRef = useRef(true);
  const initialSentKeyRef = useRef<string | null>(null);
  const initialRealtimeKeyRef = useRef<string | null>(null);
  const skipNextLoadIdRef = useRef<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Sync refs for async realtime turn persistence queue
  const conversationIdRef = useRef<string | null>(conversationId);
  const activeFolderIdRef = useRef<string | undefined>(activeFolderId);
  const sourceScopeRef = useRef<SourceScope | undefined>(sourceScope);
  const sourceLabelRef = useRef<string | undefined>(sourceLabel);
  const foldersRef = useRef<FolderRecord[]>(folders);
  const persistQueueRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);
  useEffect(() => {
    activeFolderIdRef.current = activeFolderId;
  }, [activeFolderId]);
  useEffect(() => {
    sourceScopeRef.current = sourceScope;
  }, [sourceScope]);
  useEffect(() => {
    sourceLabelRef.current = sourceLabel;
  }, [sourceLabel]);
  useEffect(() => {
    foldersRef.current = folders;
  }, [folders]);

  const refreshRecentConversations = useCallback(async () => {
    try {
      const { conversations } = await getConversations({ archived: false });
      if (mountedRef.current) {
        setRecentConversations(conversations);
      }
    } catch {
      // Non-blocking rail refresh.
    }
  }, []);

  const handleRealtimeTurnComplete = useCallback(
    (turn: RealtimeTurnPayload) => {
      persistQueueRef.current = persistQueueRef.current.then(async () => {
        if (!mountedRef.current) return;
        setSavingRealtimeTurn(true);
        setActionError(null);
        try {
          const existingConvId = conversationIdRef.current ?? undefined;
          const folderIdForNew = existingConvId ? undefined : activeFolderIdRef.current;

          const res = await saveRealtimeTurn({
            conversationId: existingConvId,
            folderId: folderIdForNew,
            userText: turn.userText,
            assistantText: turn.assistantText,
          });

          if (!mountedRef.current) return;

          conversationIdRef.current = res.conversationId;
          setConversationId(res.conversationId);
          setMessages((prev) => [...prev, res.userMessage, res.assistantMessage]);

          if (!existingConvId) {
            const matchedFolder = folderIdForNew
              ? foldersRef.current.find((f) => f.id === folderIdForNew)
              : undefined;
            setConversation({
              id: res.conversationId,
              title:
                turn.userText.length <= 60
                  ? turn.userText
                  : `${turn.userText.slice(0, 57).trimEnd()}...`,
              folderId: folderIdForNew ?? null,
              folderName: matchedFolder?.name ?? null,
              archived: false,
              preview: res.assistantMessage.text,
              createdAt: res.userMessage.createdAt,
              updatedAt: res.assistantMessage.createdAt,
            });
            skipNextLoadIdRef.current = res.conversationId;
            navigate(`/conversacion/${res.conversationId}`, {
              replace: true,
              state: sourceScopeRef.current
                ? {
                    sourceScope: sourceScopeRef.current,
                    sourceLabel: sourceLabelRef.current,
                  }
                : null,
            });
          }

          void refreshRecentConversations();
        } catch (err) {
          if (!mountedRef.current) return;
          setActionError(
            getErrorMessage(
              err,
              "No fue posible guardar el intercambio de voz en tu historial.",
            ),
          );
        } finally {
          if (mountedRef.current) {
            setSavingRealtimeTurn(false);
          }
        }
      });
    },
    [navigate, refreshRecentConversations],
  );

  const realtime = useRealtimeVoice({
    onTurnComplete: handleRealtimeTurnComplete,
  });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopSpeech();
    };
  }, []);

  useEffect(() => {
    let active = true;
    getFolders()
      .then(({ folders: loaded }) => {
        if (active) setFolders(loaded);
      })
      .catch(() => {
        // Non-blocking: folder dropdown remains optional.
      });
    void refreshRecentConversations();
    return () => {
      active = false;
    };
  }, [refreshRecentConversations]);

  const loadExistingConversation = useCallback(async (id: string) => {
    setLoadingConversation(true);
    setLoadError(null);
    setHttpErrorStatus(null);
    setSendError(null);
    setActionMessage(null);
    setActionError(null);

    try {
      const data = await getConversation(id);
      if (!mountedRef.current) return;
      conversationIdRef.current = data.conversation.id;
      setConversationId(data.conversation.id);
      setConversation(data.conversation);
      setMessages(data.messages);
      setActiveFolderId(data.conversation.folderId ?? undefined);
    } catch (err) {
      if (!mountedRef.current) return;
      if (err instanceof ApiError && err.status === 403) {
        setHttpErrorStatus(403);
      } else if (err instanceof ApiError && (err.status === 404 || err.status === 400)) {
        setHttpErrorStatus(404);
      } else {
        setLoadError(getErrorMessage(err, "No fue posible cargar la conversación."));
      }
    } finally {
      if (mountedRef.current) {
        setLoadingConversation(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!routeId) {
      setLoadingConversation(false);
      setHttpErrorStatus(null);
      setLoadError(null);
      if (!navState?.initialQuestion && !navState?.startRealtime) {
        conversationIdRef.current = null;
        setConversationId(null);
        setConversation(null);
        setMessages([]);
      }
      return;
    }

    if (skipNextLoadIdRef.current === routeId) {
      skipNextLoadIdRef.current = null;
      return;
    }

    void loadExistingConversation(routeId);
  }, [routeId, loadExistingConversation, navState?.initialQuestion, navState?.startRealtime]);

  const executeSend = useCallback(
    async (
      question: string,
      overrides?: {
        forceNew?: boolean;
        folderId?: string;
        sourceScope?: SourceScope;
        sourceLabel?: string;
        viaVoice?: boolean;
      },
    ) => {
      const trimmed = question.trim();
      if (!trimmed) return;

      stopSpeech();

      const viaVoice = Boolean(overrides?.viaVoice);
      if (viaVoice) {
        setVoiceReplyMode(true);
      }
      const useVoiceMode = viaVoice || voiceReplyMode;

      const targetConvId = overrides?.forceNew ? undefined : conversationIdRef.current ?? undefined;
      const targetFolderId = overrides?.folderId ?? activeFolderIdRef.current;
      const targetScope = overrides?.sourceScope ?? sourceScopeRef.current;
      const targetLabel = overrides?.sourceLabel ?? sourceLabelRef.current;

      setSending(true);
      setPendingQuestion(trimmed);
      setSendError(null);
      setActionMessage(null);
      setActionError(null);

      try {
        const res = await sendChat({
          question: trimmed,
          conversationId: targetConvId,
          folderId: targetConvId ? undefined : targetFolderId,
          sourceScope: targetScope,
          voiceMode: useVoiceMode,
        });

        if (!mountedRef.current) return;

        conversationIdRef.current = res.conversationId;
        setConversationId(res.conversationId);
        setMessages((prev) => [...prev, res.userMessage, res.assistantMessage]);
        setPendingQuestion(null);

        if (!targetConvId) {
          const matchedFolder = targetFolderId
            ? foldersRef.current.find((f) => f.id === targetFolderId)
            : undefined;
          setConversation({
            id: res.conversationId,
            title: trimmed.length <= 60 ? trimmed : `${trimmed.slice(0, 57).trimEnd()}...`,
            folderId: targetFolderId ?? null,
            folderName: matchedFolder?.name ?? null,
            archived: false,
            preview: res.assistantMessage.text,
            createdAt: res.userMessage.createdAt,
            updatedAt: res.assistantMessage.createdAt,
          });
          skipNextLoadIdRef.current = res.conversationId;
          navigate(`/conversacion/${res.conversationId}`, {
            replace: true,
            state: {
              ...(targetScope ? { sourceScope: targetScope, sourceLabel: targetLabel } : {}),
              ...(useVoiceMode ? { viaVoice: true } : {}),
            },
          });
        }

        void refreshRecentConversations();

        if (
          useVoiceMode &&
          getSpeechPreferences().autoSpeak &&
          res.assistantMessage.text.trim().length > 0
        ) {
          void speakMessage(res.assistantMessage.id, res.assistantMessage.text);
        }
      } catch (err) {
        if (!mountedRef.current) return;
        setPendingQuestion(null);
        setSendError({
          message: getErrorMessage(
            err,
            "No fue posible completar la consulta en este momento. Puedes reintentar en unos segundos.",
          ),
          question: trimmed,
          viaVoice,
        });
      } finally {
        if (mountedRef.current) {
          setSending(false);
        }
      }
    },
    [voiceReplyMode, navigate, refreshRecentConversations],
  );

  // Trigger initialQuestion once when navigated from Home, Folders, Projects, or Integrations.
  useEffect(() => {
    if (routeId) return;
    const initialQuestion = navState?.initialQuestion?.trim();
    if (!initialQuestion) return;
    if (initialSentKeyRef.current === location.key) return;

    initialSentKeyRef.current = location.key;
    conversationIdRef.current = null;
    setConversationId(null);
    setConversation(null);
    setMessages([]);
    setActiveFolderId(navState?.folderId);
    setSourceScope(navState?.sourceScope);
    setSourceLabel(navState?.sourceLabel);
    if (navState?.viaVoice) {
      setVoiceReplyMode(true);
    }

    void executeSend(initialQuestion, {
      forceNew: true,
      folderId: navState?.folderId,
      sourceScope: navState?.sourceScope,
      sourceLabel: navState?.sourceLabel,
      viaVoice: Boolean(navState?.viaVoice),
    });
  }, [routeId, location.key, navState, executeSend]);

  // Auto-connect Realtime WebRTC call once when navigated with state.startRealtime === true.
  useEffect(() => {
    if (!navState?.startRealtime) return;
    if (initialRealtimeKeyRef.current === location.key) return;

    let cancelled = false;
    const scopeToUse = navState.sourceScope;
    const folderToUse = navState.folderId;
    const labelToUse = navState.sourceLabel;

    const timer = window.setTimeout(() => {
      if (cancelled || initialRealtimeKeyRef.current === location.key) return;
      initialRealtimeKeyRef.current = location.key;
      if (!routeId) {
        conversationIdRef.current = null;
        setConversationId(null);
        setConversation(null);
        setMessages([]);
      }
      if (folderToUse) {
        setActiveFolderId(folderToUse);
        activeFolderIdRef.current = folderToUse;
      }
      if (scopeToUse) {
        setSourceScope(scopeToUse);
        sourceScopeRef.current = scopeToUse;
      }
      if (labelToUse) {
        setSourceLabel(labelToUse);
        sourceLabelRef.current = labelToUse;
      }
      void realtime.connect({ sourceScope: scopeToUse });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [routeId, location.key, navState, realtime.connect]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [
    messages.length,
    pendingQuestion,
    sendError,
    realtime.liveUserTranscript,
    realtime.liveAssistantTranscript,
  ]);

  const citedSources = useMemo(() => {
    const map = new Map<string, CitationSource>();
    for (const msg of messages) {
      if (msg.source && !map.has(msg.source.to)) {
        map.set(msg.source.to, msg.source);
      }
    }
    return Array.from(map.values());
  }, [messages]);

  async function handleArchiveToggle() {
    if (!conversationId || actionBusy) return;
    const nextArchived = !(conversation?.archived ?? false);
    setActionBusy(true);
    setActionError(null);
    setActionMessage(null);
    try {
      const { conversation: updated } = await updateConversation(conversationId, {
        archived: nextArchived,
      });
      if (!mountedRef.current) return;
      setConversation(updated);
      setActionMessage(
        updated.archived
          ? "Conversación archivada. Puedes restaurarla desde Ajustes › Chats archivados."
          : "Conversación restaurada al historial activo.",
      );
      void refreshRecentConversations();
    } catch (err) {
      if (!mountedRef.current) return;
      setActionError(getErrorMessage(err, "No se pudo actualizar el estado de la conversación."));
    } finally {
      if (mountedRef.current) setActionBusy(false);
    }
  }

  async function handleFolderChange(nextFolderId: string) {
    if (!conversationId || actionBusy) return;
    setActionBusy(true);
    setActionError(null);
    setActionMessage(null);
    try {
      const { conversation: updated } = await updateConversation(conversationId, {
        folderId: nextFolderId === "" ? null : nextFolderId,
      });
      if (!mountedRef.current) return;
      setConversation(updated);
      setActiveFolderId(updated.folderId ?? undefined);
      setActionMessage(
        updated.folderName
          ? `Conversación asignada a la carpeta «${updated.folderName}».`
          : "Conversación quitada de la carpeta.",
      );
      void refreshRecentConversations();
    } catch (err) {
      if (!mountedRef.current) return;
      setActionError(getErrorMessage(err, "No se pudo asignar la carpeta."));
    } finally {
      if (mountedRef.current) setActionBusy(false);
    }
  }

  function handleVoiceReplyToggle() {
    const next = !voiceReplyMode;
    setVoiceReplyMode(next);
    if (!next) {
      stopSpeech();
    }
  }

  function handleRealtimeTopButton() {
    if (realtime.isActive) {
      realtime.disconnect();
    } else {
      void realtime.connect({ sourceScope });
    }
  }

  function handleScopeSelect(nextScope: SourceScope, nextLabel?: string) {
    if (nextScope === "all") {
      setSourceScope(undefined);
      setSourceLabel(undefined);
    } else {
      setSourceScope(nextScope);
      setSourceLabel(nextLabel);
    }
  }

  function handleNewConversation() {
    stopSpeech();
    if (realtime.isActive) {
      realtime.disconnect();
    }
    conversationIdRef.current = null;
    setConversationId(null);
    setConversation(null);
    setMessages([]);
    setPendingQuestion(null);
    setSendError(null);
    setLoadError(null);
    setActionMessage(null);
    setActionError(null);
    setActiveFolderId(undefined);
    navigate("/conversacion", { state: null });
  }

  function handleOpenRecent(id: string) {
    if (id === conversationId) return;
    stopSpeech();
    if (realtime.isActive) {
      realtime.disconnect();
    }
    navigate(`/conversacion/${id}`);
  }

  function handleComposerSend(question: string, options?: ChatSendOptions) {
    void executeSend(question, { viaVoice: Boolean(options?.viaVoice) });
  }

  if (httpErrorStatus === 403) {
    return (
      <ErrorPage
        code="403"
        title="Sin acceso a esta conversación"
        message="No tienes permiso para ver o continuar esta conversación."
      />
    );
  }

  if (httpErrorStatus === 404) {
    return (
      <ErrorPage
        code="404"
        title="Conversación no encontrada"
        message="La conversación solicitada no existe o fue eliminada."
      />
    );
  }

  const lastAssistantId = [...messages].reverse().find((m) => m.sender === "assistant")?.id ?? null;
  const activeScopeValue: SourceScope = sourceScope ?? "all";
  const activeScopeLabel =
    sourceScope && sourceScope !== "all"
      ? sourceLabel ?? SCOPE_LABELS[sourceScope]
      : null;

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* 1. Columna principal de conversación */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-gray-50/70 dark:bg-gray-950">
        {/* Franja superior limpia */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-gray-200/80 bg-white/85 px-4 py-2.5 backdrop-blur-md sm:px-6 dark:border-gray-800/80 dark:bg-gray-950/80">
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="truncate text-theme-sm font-semibold text-gray-900 dark:text-white">
              {conversation?.title ?? "Nueva conversación con ST&T ATLAS"}
            </h1>
            {conversation?.archived && (
              <Badge size="xs" color="warning">Archivada</Badge>
            )}
            {activeScopeLabel && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-0.5 text-[11px] font-medium text-brand-700 dark:border-brand-500/30 dark:bg-brand-500/15 dark:text-brand-200">
                Fuente: {activeScopeLabel}
                <button
                  type="button"
                  aria-label="Quitar filtro de fuente"
                  className="ml-0.5 hover:opacity-75"
                  onClick={() => handleScopeSelect("all")}
                >
                  ×
                </button>
              </span>
            )}
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleRealtimeTopButton}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-theme-xs font-medium transition-colors",
                realtime.isActive
                  ? "border-error-500/50 bg-error-500/10 text-error-600 hover:bg-error-500/20 dark:border-error-400/50 dark:text-error-300"
                  : "border-brand-400/60 bg-brand-500/10 text-brand-600 hover:bg-brand-500/15 dark:border-brand-400/50 dark:bg-brand-500/15 dark:text-brand-200 dark:hover:bg-brand-500/25",
              )}
            >
              {realtime.isActive ? (
                <span className="relative flex size-2" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-error-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-error-500" />
                </span>
              ) : (
                <AudioIcon className="size-3.5" />
              )}
              <span>{realtime.isActive ? "Colgar" : "Voz en vivo"}</span>
            </button>

            {!realtime.isActive && (
              <button
                type="button"
                aria-pressed={voiceReplyMode}
                onClick={handleVoiceReplyToggle}
                title="Reproducir automáticamente las respuestas por voz"
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-theme-xs transition-colors",
                  voiceReplyMode
                    ? "border-brand-400/60 bg-brand-500/10 font-medium text-brand-600 dark:border-brand-400/50 dark:text-brand-200"
                    : "border-gray-200 text-gray-500 hover:border-brand-400 hover:text-brand-600 dark:border-gray-700 dark:text-gray-400 dark:hover:text-brand-200",
                )}
              >
                <span>Voz auto</span>
              </button>
            )}

            {conversationId && folders.length > 0 && (
              <select
                aria-label="Asignar carpeta"
                value={conversation?.folderId ?? activeFolderId ?? ""}
                disabled={actionBusy}
                onChange={(e) => void handleFolderChange(e.target.value)}
                className="hidden h-7 max-w-[9rem] rounded-full border border-gray-200 bg-transparent px-2.5 text-theme-xs text-gray-600 focus:border-brand-400 focus:outline-hidden sm:inline-block dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
              >
                <option value="">Sin carpeta</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            )}

            {conversationId && (
              <button
                type="button"
                disabled={actionBusy}
                onClick={() => void handleArchiveToggle()}
                className="rounded-full border border-gray-200 px-2.5 py-1 text-theme-xs text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.06]"
              >
                {conversation?.archived ? "Restaurar" : "Archivar"}
              </button>
            )}

            <button
              type="button"
              aria-pressed={railOpen}
              onClick={() => setRailOpen((prev) => !prev)}
              title={railOpen ? "Ocultar panel lateral" : "Mostrar panel lateral"}
              className={cn(
                "hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-theme-xs transition-colors xl:inline-flex",
                railOpen
                  ? "border-brand-400/50 bg-brand-500/10 text-brand-600 dark:border-brand-400/40 dark:text-brand-200"
                  : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
              )}
            >
              <RailIcon />
              <span>Panel</span>
            </button>
          </div>
        </div>

        {/* Lienzo desplazable de mensajes */}
        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
            {actionMessage && (
              <Alert
                variant="success"
                title="Conversación actualizada"
                message={actionMessage}
                onClose={() => setActionMessage(null)}
              />
            )}

            {actionError && (
              <Alert
                variant="error"
                title="No se pudo actualizar la conversación"
                message={actionError}
                onClose={() => setActionError(null)}
              />
            )}

            {speechPlayer.error && (
              <Alert
                variant="warning"
                title="Audio de respuesta"
                message={speechPlayer.error}
                onClose={speechPlayer.clearError}
              />
            )}

            {loadingConversation && (
              <PageLoadingState
                variant="chat"
                label="Cargando conversación con ST&T ATLAS…"
              />
            )}

            {loadError && (
              <div className="space-y-3">
                <Alert variant="error" title="No se pudo cargar la conversación" message={loadError} />
                {routeId && (
                  <div>
                    <Button size="sm" variant="outline" onClick={() => void loadExistingConversation(routeId)}>
                      Reintentar
                    </Button>
                  </div>
                )}
              </div>
            )}

            {!loadingConversation &&
              !loadError &&
              messages.length === 0 &&
              !pendingQuestion &&
              realtime.status === "idle" && (
                <div className="atlas-fade-up flex flex-col items-center py-8 text-center">
                  <AtlasOrb size="md" state="idle" />
                  <h2 className="mt-5 text-xl font-semibold text-gray-900 dark:text-white">
                    ¿En qué te ayuda ST&amp;T ATLAS hoy?
                  </h2>
                  <p className="mt-1.5 max-w-lg text-theme-sm text-gray-500 dark:text-gray-400">
                    Consulta políticas corporativas vigentes, tu perfil o el estado documentado de tus proyectos.
                  </p>
                  <div className="mt-6 grid w-full max-w-2xl gap-3 text-left sm:grid-cols-2">
                    {EMPTY_STARTERS.map(({ title, question, Icon }) => (
                      <button
                        key={title}
                        type="button"
                        onClick={() => void executeSend(question)}
                        className="group flex items-start gap-3 rounded-2xl border border-gray-200/90 bg-white p-3.5 text-left shadow-2xs transition-all hover:-translate-y-0.5 hover:border-brand-400/70 hover:shadow-theme-xs dark:border-white/[0.08] dark:bg-white/[0.03] dark:hover:border-brand-400/50 dark:hover:bg-white/[0.055]"
                      >
                        <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-brand-500/10 text-brand-600 dark:bg-brand-500/15 dark:text-accent-400">
                          <Icon className="size-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-theme-sm font-medium text-gray-900 group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-200">
                            {title}
                          </span>
                          <span className="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">
                            {question}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

            {messages.map((msg) => {
              const isAssistant = msg.sender === "assistant";
              const isLatestAssistant = isAssistant && msg.id === lastAssistantId;
              const msgSpeechState =
                isAssistant && speechPlayer.activeId === msg.id ? speechPlayer.status : "idle";

              return (
                <ChatMessage
                  key={msg.id}
                  from={msg.sender}
                  copyText={msg.text}
                  kind={msg.kind}
                  source={msg.source}
                  choices={isLatestAssistant ? msg.choices : undefined}
                  onChoiceSelect={
                    isLatestAssistant
                      ? (choice) => {
                          void executeSend(choice);
                        }
                      : undefined
                  }
                  disabled={sending}
                  speechState={isAssistant ? msgSpeechState : undefined}
                  onToggleSpeak={
                    isAssistant
                      ? () => {
                          if (msgSpeechState !== "idle") {
                            speechPlayer.stop();
                          } else {
                            void speechPlayer.speak(msg.id, msg.text);
                          }
                        }
                      : undefined
                  }
                >
                  {msg.text}
                </ChatMessage>
              );
            })}

            {pendingQuestion && (
              <>
                <ChatMessage from="user">{pendingQuestion}</ChatMessage>
                <AtlasThinkingBubble voiceMode={voiceReplyMode} />
              </>
            )}

            {sendError && (
              <div className="space-y-3">
                <Alert
                  variant="error"
                  title="No se pudo completar la consulta"
                  message={sendError.message}
                  onClose={() => setSendError(null)}
                />
                <div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={sending}
                    onClick={() =>
                      void executeSend(sendError.question, { viaVoice: sendError.viaVoice })
                    }
                  >
                    Reintentar
                  </Button>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        {/* Dock inferior fijo */}
        <div className="shrink-0 border-t border-gray-200/70 bg-gray-50/90 px-4 pb-3 pt-3 backdrop-blur-md sm:px-8 dark:border-gray-800/70 dark:bg-gray-950/90">
          <div className="mx-auto w-full max-w-4xl space-y-2.5">
            {realtime.status !== "idle" && (
              <RealtimeVoiceBar
                status={realtime.status}
                muted={realtime.muted}
                audioLevel={realtime.level}
                bars={realtime.bars}
                liveUserTranscript={realtime.liveUserTranscript}
                liveAssistantTranscript={realtime.liveAssistantTranscript}
                error={realtime.error}
                savingTurn={savingRealtimeTurn}
                onToggleMute={realtime.toggleMute}
                onInterrupt={realtime.interrupt}
                onDisconnect={realtime.disconnect}
                onRetry={() => void realtime.connect({ sourceScope })}
                onClearError={realtime.clearError}
              />
            )}

            <ChatComposer
              sending={sending}
              disabled={loadingConversation}
              realtimeActive={realtime.isActive}
              placeholder={
                activeScopeLabel
                  ? `Pregunta a ST&T ATLAS sobre ${activeScopeLabel.toLowerCase()}…`
                  : "Pregunta a ST&T ATLAS…"
              }
              onSend={handleComposerSend}
              onStartRealtime={() => void realtime.connect({ sourceScope })}
            />

            <p className="text-center text-[11px] text-gray-400 dark:text-gray-500">
              ST&amp;T ATLAS responde solo con fuentes corporativas autorizadas en ST&amp;T One · Datos de demostración
            </p>
          </div>
        </div>
      </div>

      {/* 2. Panel lateral derecho colapsable (contexto, fuentes e historial reciente) */}
      {railOpen && (
        <aside
          aria-label="Contexto e historial de conversaciones"
          className="hidden w-80 shrink-0 flex-col border-l border-gray-200/80 bg-white/70 xl:flex dark:border-gray-800/80 dark:bg-gray-900/50"
        >
          <div className="border-b border-gray-200/80 p-4 dark:border-gray-800/80">
            <Button
              size="sm"
              className="w-full"
              startIcon={<PlusIcon className="size-4" />}
              onClick={handleNewConversation}
            >
              Nueva consulta
            </Button>
          </div>

          <div className="border-b border-gray-200/80 p-4 dark:border-gray-800/80">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Alcance de fuentes
            </h2>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {SCOPE_PILLS.map((pill) => {
                const isSelected = activeScopeValue === pill.value;
                return (
                  <button
                    key={pill.value}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => handleScopeSelect(pill.value, pill.sourceLabel)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-theme-xs transition-colors",
                      isSelected
                        ? "border-brand-500 bg-brand-500/12 font-medium text-brand-600 dark:border-brand-400/70 dark:bg-brand-500/20 dark:text-brand-200"
                        : "border-gray-200 text-gray-600 hover:border-brand-400/60 hover:text-brand-600 dark:border-white/10 dark:text-gray-400 dark:hover:text-gray-200",
                    )}
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-b border-gray-200/80 p-4 dark:border-gray-800/80">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Fuentes citadas en este chat
            </h2>
            {citedSources.length === 0 ? (
              <p className="mt-2 text-theme-xs text-gray-400 dark:text-gray-500">
                Las fuentes verificadas aparecerán aquí.
              </p>
            ) : (
              <ul className="mt-2.5 space-y-1.5">
                {citedSources.map((src) => (
                  <li key={src.to}>
                    <Link
                      to={src.to}
                      className="flex items-center gap-2 rounded-xl border border-gray-200/80 bg-gray-50/80 px-3 py-2 text-theme-xs font-medium text-gray-700 transition-colors hover:border-brand-400/60 hover:bg-brand-50/60 hover:text-brand-600 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-gray-200 dark:hover:border-brand-400/50 dark:hover:text-brand-200"
                    >
                      <DocsIcon className="size-3.5 shrink-0 text-brand-500 dark:text-accent-400" />
                      <span className="min-w-0 flex-1 truncate">{src.label}</span>
                      <span aria-hidden="true" className="shrink-0 text-gray-400">↗</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex min-h-0 flex-1 flex-col p-4">
            <h2 className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Conversaciones recientes
            </h2>
            {recentConversations.length === 0 ? (
              <p className="mt-2 text-theme-xs text-gray-400 dark:text-gray-500">
                Tus consultas recientes aparecerán aquí.
              </p>
            ) : (
              <ul className="mt-2.5 min-h-0 flex-1 space-y-1 overflow-y-auto pr-0.5">
                {recentConversations.map((conv) => {
                  const isCurrent = conv.id === conversationId;
                  return (
                    <li key={conv.id}>
                      <button
                        type="button"
                        onClick={() => handleOpenRecent(conv.id)}
                        className={cn(
                          "w-full rounded-xl px-3 py-2 text-left transition-colors",
                          isCurrent
                            ? "bg-brand-500/12 text-brand-700 dark:bg-brand-500/20 dark:text-brand-200"
                            : "text-gray-700 hover:bg-gray-100/80 dark:text-gray-300 dark:hover:bg-white/[0.05]",
                        )}
                      >
                        <span className="block truncate text-theme-xs font-medium">
                          {conv.title}
                        </span>
                        <span className="mt-0.5 block truncate text-[11px] text-gray-400 dark:text-gray-500">
                          {formatShortDate(conv.updatedAt)}
                          {conv.folderName ? ` · ${conv.folderName}` : ""}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}

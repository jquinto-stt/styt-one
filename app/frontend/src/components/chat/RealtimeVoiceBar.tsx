import { Alert } from "@/elements/ui/alert";
import { Badge } from "@/elements/ui/badge";
import { Button } from "@/elements/ui/button";
import { AtlasOrb, type AtlasOrbState } from "@/components/brand/AtlasOrb";
import type { RealtimeVoiceStatus } from "@/hooks/useRealtimeVoice";
import { cn } from "@/utils";

export interface RealtimeVoiceBarProps {
  status: RealtimeVoiceStatus;
  muted: boolean;
  audioLevel?: number;
  bars: number[];
  liveUserTranscript: string;
  liveAssistantTranscript: string;
  error: string | null;
  savingTurn?: boolean;
  onToggleMute: () => void;
  onInterrupt: () => void;
  onDisconnect: () => void;
  onRetry: () => void;
  onClearError: () => void;
}

function mapStatusToOrbState(status: RealtimeVoiceStatus, muted: boolean): AtlasOrbState {
  if (status === "connecting") return "connecting";
  if (status === "thinking") return "thinking";
  if (status === "speaking") return "speaking";
  if (status === "listening" && !muted) return "listening";
  return "idle";
}

function getStatusLabel(status: RealtimeVoiceStatus, muted: boolean): string {
  if (status === "connecting") return "Conectando…";
  if (status === "error") return "Conexión interrumpida";
  if (muted) return "Micrófono silenciado";
  if (status === "listening") return "Escuchándote…";
  if (status === "thinking") return "Pensando…";
  if (status === "speaking") return "ST&T ATLAS hablando…";
  return "Listo — habla cuando quieras";
}

/** Barra de estudio compacta para la conversación WebRTC en tiempo real con ST&T ATLAS. */
export function RealtimeVoiceBar({
  status,
  muted,
  audioLevel = 0,
  bars,
  liveUserTranscript,
  liveAssistantTranscript,
  error,
  savingTurn = false,
  onToggleMute,
  onInterrupt,
  onDisconnect,
  onRetry,
  onClearError,
}: RealtimeVoiceBarProps) {
  if (status === "idle") return null;

  const orbState = mapStatusToOrbState(status, muted);
  const statusLabel = getStatusLabel(status, muted);
  const canControlAudio = status !== "connecting" && status !== "error";

  return (
    <section
      aria-label="Voz en tiempo real con ST&T ATLAS"
      className="atlas-fade-up rounded-2xl border border-brand-400/40 bg-white/95 px-4 py-3 shadow-theme-sm backdrop-blur-md dark:border-brand-400/35 dark:bg-gray-900/95"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <AtlasOrb
            size="sm"
            state={orbState}
            audioLevel={muted || status === "error" ? 0 : audioLevel}
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge size="xs" color="info">ST&amp;T ATLAS · En vivo</Badge>
              {savingTurn && (
                <span className="text-[11px] text-gray-400">Guardando…</span>
              )}
            </div>
            <p
              className="mt-0.5 truncate text-theme-xs font-medium text-gray-800 dark:text-white"
              role="status"
              aria-live="polite"
            >
              {statusLabel}
            </p>
          </div>
          <div className="ml-1 hidden h-6 items-end gap-0.5 sm:flex" aria-hidden="true">
            {bars.map((height, idx) => (
              <span
                key={idx}
                className={cn(
                  "w-1 rounded-full transition-[height,background-color] duration-75",
                  muted || status === "error"
                    ? "bg-gray-300 dark:bg-gray-700"
                    : status === "speaking"
                      ? "bg-brand-500 dark:bg-brand-300"
                      : "bg-accent-500 dark:bg-accent-400",
                )}
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canControlAudio && (
            <Button size="sm" variant="outline" onClick={onToggleMute}>
              {muted ? "Activar micro" : "Silenciar"}
            </Button>
          )}

          {status === "speaking" && (
            <Button size="sm" variant="outline" onClick={onInterrupt}>
              Interrumpir
            </Button>
          )}

          {status === "error" && !error && (
            <Button size="sm" variant="outline" onClick={onRetry}>
              Reintentar
            </Button>
          )}

          <Button size="sm" variant="destructive" onClick={onDisconnect}>
            Finalizar
          </Button>
        </div>
      </div>

      {(liveUserTranscript || liveAssistantTranscript) && (
        <div className="mt-2.5 max-h-24 space-y-1 overflow-y-auto rounded-xl border border-gray-200/80 bg-gray-50 px-3 py-2 text-theme-xs leading-relaxed dark:border-white/[0.07] dark:bg-white/[0.03]">
          {liveUserTranscript && (
            <p className="text-gray-700 dark:text-gray-200">
              <span className="font-semibold text-brand-600 dark:text-brand-300">Tú: </span>
              {liveUserTranscript}
            </p>
          )}
          {liveAssistantTranscript && (
            <p className="text-gray-700 dark:text-gray-200">
              <span className="font-semibold text-gray-900 dark:text-white">ST&amp;T ATLAS: </span>
              {liveAssistantTranscript}
            </p>
          )}
        </div>
      )}

      {error && (
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <Alert
              variant="error"
              title="Error de voz en tiempo real"
              message={error}
              onClose={onClearError}
            />
          </div>
          <Button size="sm" variant="outline" onClick={onRetry}>
            Reintentar conexión
          </Button>
        </div>
      )}
    </section>
  );
}

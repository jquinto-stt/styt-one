import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router";
import { PaperPlaneIcon, AudioIcon } from "@/icons";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { stopSpeech } from "@/services/speech";
import { cn } from "@/utils";

export interface ChatSendOptions {
  viaVoice?: boolean;
}

export interface ChatComposerProps {
  placeholder?: string;
  /** Sugerencias rápidas opcionales bajo la caja de consulta. */
  suggestions?: { label: string; question: string }[];
  className?: string;
  onSend?: (question: string, options?: ChatSendOptions) => void | Promise<void>;
  /** Inicia una llamada de voz bidireccional en tiempo real (WebRTC) con ST&T ATLAS. */
  onStartRealtime?: () => void;
  /** Indica si ya existe una llamada de voz en tiempo real activa. */
  realtimeActive?: boolean;
  disabled?: boolean;
  sending?: boolean;
  initialValue?: string;
}

const MAX_TEXTAREA_HEIGHT = 180;

const chip =
  "inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50/70 px-3 py-1.5 text-theme-xs text-gray-600 transition-colors hover:border-brand-400 hover:bg-brand-50/60 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-gray-300 dark:hover:border-brand-400/60 dark:hover:bg-brand-500/10 dark:hover:text-brand-200";

function MicIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn("size-3.5", className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10v2a7 7 0 0 0 14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  );
}

function formatElapsed(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/** Caja de consulta limpia, adaptable y de alto contraste para texto, dictado y voz en vivo. */
export function ChatComposer({
  placeholder = "Pregunta a ST&T ATLAS…",
  suggestions,
  className,
  onSend,
  onStartRealtime,
  realtimeActive = false,
  disabled = false,
  sending = false,
  initialValue = "",
}: ChatComposerProps) {
  const inputId = useId();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [text, setText] = useState(initialValue);
  const recorder = useVoiceRecorder();

  useEffect(() => {
    if (initialValue) {
      setText(initialValue);
    }
  }, [initialValue]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
  }, [text]);

  const isRecording = recorder.state === "recording";
  const isTranscribing = recorder.state === "transcribing";
  const isVoiceBusy = isRecording || isTranscribing;
  const isLocked = disabled || sending || isVoiceBusy;
  const canSubmit = !isLocked && text.trim().length > 0 && Boolean(onSend);
  const canUseDictate =
    Boolean(onSend) && !disabled && !sending && !isTranscribing && !realtimeActive;
  const canStartRealtime =
    Boolean(onStartRealtime) && !disabled && !sending && !isVoiceBusy && !realtimeActive;

  function submitCurrent() {
    if (isLocked || !onSend) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    setText("");
    void onSend(trimmed, { viaVoice: false });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    submitCurrent();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submitCurrent();
    }
  }

  function handleDictateToggle() {
    if (!canUseDictate || !onSend) return;
    if (isRecording) {
      recorder.stopAndTranscribe();
      return;
    }
    stopSpeech();
    recorder.clearError();
    void recorder.startRecording((transcript) => {
      void onSend(transcript, { viaVoice: true });
    });
  }

  function handleStartRealtimeClick() {
    if (!canStartRealtime || !onStartRealtime) return;
    stopSpeech();
    recorder.clearError();
    onStartRealtime();
  }

  return (
    <div className={cn("w-full", className)}>
      <form
        onSubmit={handleSubmit}
        className="composer rounded-2xl p-3"
      >
        {isRecording ? (
          <div
            role="status"
            aria-live="polite"
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-brand-500/10 px-3 py-2 text-left dark:bg-brand-500/15"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="relative flex size-2.5 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-error-400 opacity-75" />
                <span className="relative inline-flex size-2.5 rounded-full bg-error-500" />
              </span>
              <div className="min-w-0">
                <p className="text-theme-xs font-medium text-gray-800 dark:text-white">
                  Escuchando…{" "}
                  <span className="font-mono text-gray-500 dark:text-gray-300">
                    {formatElapsed(recorder.elapsedSeconds)}
                  </span>
                </p>
                <div className="mt-1 flex h-4 items-end gap-0.5" aria-hidden="true">
                  {recorder.bars.map((height, idx) => (
                    <span
                      key={idx}
                      className="w-1 rounded-full bg-brand-500 transition-[height] duration-75 dark:bg-accent-400"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={recorder.cancelRecording}
                className="rounded-full border border-gray-300 px-3 py-1 text-theme-xs text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-white/10"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={recorder.stopAndTranscribe}
                className="bg-brand-gradient rounded-full px-3.5 py-1 text-theme-xs font-medium text-white shadow-xs transition-all hover:brightness-110"
              >
                Detener y enviar
              </button>
            </div>
          </div>
        ) : isTranscribing ? (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center justify-between gap-3 rounded-xl bg-gray-100 px-3 py-2.5 text-left dark:bg-white/5"
          >
            <div className="flex items-center gap-2.5 text-theme-sm text-gray-700 dark:text-gray-200">
              <svg
                className="size-4 animate-spin text-brand-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Transcribiendo…</span>
            </div>
            <button
              type="button"
              onClick={recorder.cancelRecording}
              className="rounded-full border border-gray-300 px-3 py-1 text-theme-xs text-gray-600 hover:bg-gray-200/60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/10"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <>
            <label htmlFor={inputId} className="sr-only">
              Pregunta al asistente
            </label>
            <textarea
              ref={textareaRef}
              id={inputId}
              rows={1}
              maxLength={2000}
              value={text}
              disabled={isLocked}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="max-h-[180px] min-h-[42px] w-full resize-none bg-transparent px-1.5 py-1.5 text-theme-sm leading-relaxed text-gray-800 placeholder:text-gray-400 focus:outline-hidden disabled:opacity-60 dark:text-white/95 dark:placeholder:text-gray-500"
            />
          </>
        )}

        <div className="mt-2 flex items-center justify-between gap-3 border-t border-gray-100 pt-2 dark:border-white/[0.06]">
          <div className="flex flex-wrap items-center gap-2">
            {onStartRealtime ? (
              <>
                <button
                  type="button"
                  disabled={!canStartRealtime}
                  onClick={handleStartRealtimeClick}
                  title="Conversación de voz en tiempo real con ST&T ATLAS"
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-theme-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                    realtimeActive
                      ? "border-brand-500/40 bg-brand-500/15 text-brand-600 dark:border-brand-400/40 dark:text-brand-200"
                      : "border-brand-400/50 bg-brand-500/10 text-brand-600 hover:border-brand-500 hover:bg-brand-500/15 dark:border-brand-400/45 dark:bg-brand-500/15 dark:text-brand-200 dark:hover:bg-brand-500/25",
                  )}
                >
                  <AudioIcon className="size-3.5" />
                  {realtimeActive ? "En vivo" : "Voz en vivo"}
                </button>
                <button
                  type="button"
                  disabled={!canUseDictate}
                  onClick={handleDictateToggle}
                  aria-pressed={isRecording}
                  title={isRecording ? "Detener dictado y enviar" : "Dictar una consulta por micrófono"}
                  className={cn(
                    chip,
                    isRecording &&
                      "border-error-500/60 bg-error-500/10 text-error-600 hover:border-error-500 hover:text-error-600 dark:border-error-400/60 dark:text-error-300",
                  )}
                >
                  <MicIcon />
                  {isRecording ? "Detener" : isTranscribing ? "Transcribiendo…" : "Dictar"}
                </button>
              </>
            ) : (
              <button
                type="button"
                disabled={!canUseDictate}
                onClick={handleDictateToggle}
                aria-pressed={isRecording}
                title={isRecording ? "Detener grabación y enviar" : "Hablar por micrófono"}
                className={cn(
                  chip,
                  isRecording &&
                    "border-error-500/60 bg-error-500/10 text-error-600 hover:border-error-500 hover:text-error-600 dark:border-error-400/60 dark:text-error-300",
                )}
              >
                <MicIcon />
                {isRecording ? "Detener" : isTranscribing ? "Transcribiendo…" : "Dictar"}
              </button>
            )}
            <span className="hidden text-[11px] text-gray-400 sm:inline dark:text-gray-500">
              Enter para enviar
            </span>
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            aria-label={sending ? "Enviando…" : "Enviar"}
            className="bg-brand-gradient grid size-9 shrink-0 place-items-center rounded-full text-white shadow-sm transition-all hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <PaperPlaneIcon className="size-4" />
          </button>
        </div>
      </form>

      {recorder.error && (
        <div
          role="alert"
          className="mt-2 flex items-center justify-between gap-2 rounded-xl border border-error-500/40 bg-error-50 px-3 py-2 text-left text-theme-xs text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300"
        >
          <span>{recorder.error}</span>
          <button
            type="button"
            aria-label="Cerrar aviso de voz"
            onClick={recorder.clearError}
            className="shrink-0 px-1 text-sm leading-none opacity-75 hover:opacity-100"
          >
            ×
          </button>
        </div>
      )}

      {suggestions && suggestions.length > 0 && (
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {suggestions.map((s) =>
            onSend ? (
              <button
                key={s.label}
                type="button"
                disabled={isLocked}
                onClick={() => void onSend(s.question, { viaVoice: false })}
                className={chip}
                title={s.question}
              >
                {s.label}
              </button>
            ) : (
              <Link key={s.label} to="/conversacion" className={chip} title={s.question}>
                {s.label}
              </Link>
            ),
          )}
        </div>
      )}
    </div>
  );
}

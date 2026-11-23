import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router";
import { Badge } from "@/elements/ui/badge";
import { AtlasOrb } from "@/components/brand/AtlasOrb";
import { DocsIcon } from "@/icons";
import { cn } from "@/utils";
import type { EvidenceKind } from "@/services/api";

export type { EvidenceKind };

const evidence: Record<EvidenceKind, { label: string; color: "success" | "info" | "light" | "warning" }> = {
  found: { label: "Encontrado en fuente", color: "success" },
  inference: { label: "Inferencia", color: "info" },
  none: { label: "Sin evidencia", color: "light" },
  outdated: { label: "Política sin vigencia", color: "warning" },
};

export interface ChatMessageProps {
  from: "user" | "assistant";
  children: ReactNode;
  /** Texto plano opcional para copiar al portapapeles (si children no es string). */
  copyText?: string;
  /** Solo asistente: diferencia información encontrada, inferencias y faltas de evidencia. */
  kind?: EvidenceKind | null;
  source?: { label: string; to: string } | null;
  choices?: string[];
  onChoiceSelect?: (choice: string) => void;
  disabled?: boolean;
  /** Estado de reproducción de audio (solo mensajes del asistente). */
  speechState?: "idle" | "loading" | "playing";
  onToggleSpeak?: () => void;
}

function SpeakerIcon({ state }: { state: "idle" | "loading" | "playing" }) {
  if (state === "loading") {
    return (
      <svg className="size-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    );
  }
  if (state === "playing") {
    return (
      <svg className="size-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <rect x="5" y="5" width="10" height="10" rx="2" />
      </svg>
    );
  }
  return (
    <svg
      className="size-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

function CopyActionIcon({ copied }: { copied: boolean }) {
  if (copied) {
    return (
      <svg
        className="size-3.5 text-success-500"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M4.5 10.5 8.2 14.2 15.8 6.5" />
      </svg>
    );
  }
  return (
    <svg
      className="size-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

/** Burbuja editorial de conversación (usuario a la derecha, ST&T ATLAS a la izquierda). */
export function ChatMessage({
  from,
  children,
  copyText,
  kind,
  source,
  choices,
  onChoiceSelect,
  disabled = false,
  speechState = "idle",
  onToggleSpeak,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  if (from === "user") {
    return (
      <div className="atlas-fade-up flex justify-end">
        <p className="max-w-[78%] whitespace-pre-line rounded-2xl rounded-br-sm bg-brand-600 px-4 py-3 text-theme-sm leading-relaxed text-white shadow-xs dark:bg-brand-500/90">
          {children}
        </p>
      </div>
    );
  }

  const textToCopy =
    copyText ?? (typeof children === "string" ? children : "");

  async function handleCopy() {
    if (!textToCopy || !navigator.clipboard?.writeText) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
      copyTimerRef.current = window.setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      // Ignore clipboard failures on restricted contexts.
    }
  }

  const speakLabel =
    speechState === "loading"
      ? "Cargando audio…"
      : speechState === "playing"
        ? "Detener"
        : "Escuchar";

  const orbState =
    speechState === "playing"
      ? "speaking"
      : speechState === "loading"
        ? "thinking"
        : "idle";

  return (
    <div className="atlas-fade-up flex items-start gap-3">
      <AtlasOrb size="xs" state={orbState} className="mt-0.5" />
      <div className="min-w-0 max-w-[92%] flex-1">
        <article className="rounded-2xl rounded-tl-sm border border-gray-200/80 bg-white px-5 py-4 shadow-theme-xs dark:border-white/[0.08] dark:bg-white/[0.035]">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <b className="text-theme-sm font-semibold text-gray-900 dark:text-white">
              ST&amp;T ATLAS
            </b>
            {kind && (
              <Badge size="sm" color={evidence[kind].color}>
                {evidence[kind].label}
              </Badge>
            )}
          </div>

          <div className="space-y-2 whitespace-pre-line text-theme-sm leading-relaxed text-gray-700 dark:text-gray-200">
            {children}
          </div>

          {source && (
            <div className="mt-3.5">
              <Link
                to={source.to}
                className="inline-flex max-w-full items-center gap-2 rounded-xl border border-brand-200/80 bg-brand-50/70 px-3 py-2 text-theme-xs font-medium text-brand-700 transition-colors hover:border-brand-400 hover:bg-brand-50 dark:border-brand-500/25 dark:bg-brand-500/10 dark:text-brand-200 dark:hover:border-brand-400/50 dark:hover:bg-brand-500/15"
              >
                <DocsIcon className="size-4 shrink-0 text-brand-500 dark:text-accent-400" />
                <span className="truncate">Fuente verificada: {source.label}</span>
                <span aria-hidden="true" className="shrink-0">↗</span>
              </Link>
            </div>
          )}

          <div className="mt-3.5 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-2.5 dark:border-white/[0.06]">
            {textToCopy && (
              <button
                type="button"
                onClick={() => void handleCopy()}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-theme-xs text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-gray-200"
              >
                <CopyActionIcon copied={copied} />
                <span>{copied ? "Copiado" : "Copiar"}</span>
              </button>
            )}

            {onToggleSpeak && (
              <button
                type="button"
                onClick={onToggleSpeak}
                aria-pressed={speechState === "playing"}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-theme-xs transition-colors",
                  speechState === "playing"
                    ? "bg-brand-500/15 font-medium text-brand-600 dark:text-brand-300"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-gray-200",
                )}
              >
                <SpeakerIcon state={speechState} />
                <span>{speakLabel}</span>
              </button>
            )}
          </div>
        </article>

        {choices && choices.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-2">
            {choices.map((c) => (
              <button
                key={c}
                type="button"
                disabled={disabled}
                onClick={() => onChoiceSelect?.(c)}
                className="rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-theme-xs font-medium text-gray-700 shadow-2xs transition-colors hover:border-brand-400 hover:bg-brand-500/10 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-gray-200 dark:hover:border-brand-400/60 dark:hover:bg-brand-500/15 dark:hover:text-brand-200"
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

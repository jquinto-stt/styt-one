import type { ReactNode } from "react";
import { Link } from "react-router";
import { Badge } from "@/elements/ui/badge";
import { LogoMark } from "@/components/brand/Logo";
import { cn } from "@/utils";

export type EvidenceKind = "found" | "inference" | "none" | "outdated";

const evidence: Record<EvidenceKind, { label: string; color: "success" | "info" | "light" | "warning" }> = {
  found: { label: "Encontrado en fuente", color: "success" },
  inference: { label: "Inferencia", color: "info" },
  none: { label: "Sin evidencia", color: "light" },
  outdated: { label: "Política sin vigencia", color: "warning" },
};

interface ChatMessageProps {
  from: "user" | "assistant";
  children: ReactNode;
  /** Solo asistente: diferencia información encontrada, inferencias y faltas de evidencia. */
  kind?: EvidenceKind;
  source?: { label: string; to: string };
  choices?: string[];
}

/** Burbuja de conversación (usuario a la derecha, asistente a la izquierda). */
export function ChatMessage({ from, children, kind, source, choices }: ChatMessageProps) {
  if (from === "user") {
    return (
      <div className="flex justify-end">
        <p className="max-w-[80%] rounded-xl rounded-tr-xs bg-brand-100 px-4 py-3 text-theme-sm text-gray-800 dark:bg-brand-500/20 dark:text-white/90">
          {children}
        </p>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <span className="mt-1 grid size-8 shrink-0 place-items-center rounded-full border border-gray-200 dark:border-gray-800">
        <LogoMark className="size-5" />
      </span>
      <article className="max-w-[80%] rounded-xl rounded-tl-xs bg-gray-100 px-4 py-3 dark:bg-white/5">
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <b className="text-theme-sm font-medium text-gray-800 dark:text-white">ST&amp;T One</b>
          {kind && (
            <Badge size="sm" color={evidence[kind].color}>
              {evidence[kind].label}
            </Badge>
          )}
        </div>
        <div className="text-theme-sm text-gray-700 dark:text-gray-300">{children}</div>
        {source && (
          <Link
            to={source.to}
            className="mt-2 inline-flex items-center gap-1 text-theme-xs font-medium text-brand-500 hover:underline dark:text-brand-300"
          >
            Fuente: {source.label} ↗
          </Link>
        )}
        {choices && (
          <div className="mt-3 flex flex-wrap gap-2">
            {choices.map((c) => (
              <button
                key={c}
                type="button"
                className={cn("rounded-full border border-gray-300 px-3 py-1 text-theme-xs text-gray-700 hover:border-brand-400 dark:border-gray-700 dark:text-gray-300")}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </article>
    </div>
  );
}

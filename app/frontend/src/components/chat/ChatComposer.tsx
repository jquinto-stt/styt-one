import { useState } from "react";
import { Link } from "react-router";
import { PaperPlaneIcon, FileIcon, BoltIcon, AudioIcon } from "@/icons";
import { cn } from "@/utils";

interface ChatComposerProps {
  placeholder?: string;
  /** Sugerencias rápidas que llevan a la vista de conversación de ejemplo. */
  suggestions?: { label: string; question: string }[];
  className?: string;
}

const chip =
  "inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-theme-xs text-gray-600 transition-colors hover:border-brand-400 hover:text-brand-500 dark:border-gray-700 dark:text-gray-300 dark:hover:border-brand-400 dark:hover:text-brand-300";

/**
 * Caja de consulta del asistente. Solo visual: no envía nada todavía
 * (el chat funcional llega en su slice). El texto es local al componente.
 */
export function ChatComposer({ placeholder = "Escribe tu pregunta…", suggestions, className }: ChatComposerProps) {
  const [text, setText] = useState("");

  return (
    <div className={cn("w-full", className)}>
      <form
        onSubmit={(e) => e.preventDefault()}
        className="composer rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-xs focus-within:border-brand-400 dark:border-gray-800 dark:bg-gray-dark dark:focus-within:border-brand-500/60"
      >
        <label htmlFor="question" className="sr-only">Pregunta al asistente</label>
        <textarea
          id="question"
          rows={2}
          maxLength={1000}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          className="w-full resize-none bg-transparent px-2 py-1 text-theme-sm text-gray-800 placeholder:text-gray-400 focus:outline-hidden dark:text-white/90"
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <button type="button" className={chip}><FileIcon className="size-4" />Adjuntar</button>
            <button type="button" className={chip}><BoltIcon className="size-4" />Herramientas</button>
            <button type="button" className={chip}><AudioIcon className="size-4" />Voz</button>
          </div>
          <button
            type="submit"
            aria-label="Enviar"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-gray-950 transition-opacity hover:opacity-90"
          >
            <PaperPlaneIcon className="size-5" />
          </button>
        </div>
      </form>

      {suggestions && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {suggestions.map((s) => (
            <Link key={s.label} to="/conversacion" className={chip} title={s.question}>
              {s.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

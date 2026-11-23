import type { ReactNode } from "react";
import { cn } from "@/utils";

interface PanelProps {
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

/** Bloque con cabecera sombreada (estilo «Personal Information» de los conceptos). */
export function Panel({ title, actions, children, className, bodyClassName }: PanelProps) {
  return (
    <section className={cn("overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-dark", className)}>
      {title && (
        <header className="flex items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 px-5 py-3 dark:border-gray-800 dark:bg-gray-700">
          <h2 className="text-base font-medium text-gray-800 dark:text-white">{title}</h2>
          {actions}
        </header>
      )}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

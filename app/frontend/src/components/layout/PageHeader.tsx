import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  /** Sección padre, se muestra como «Padre / Título» (estilo de los conceptos). */
  parent?: string;
  description?: string;
  actions?: ReactNode;
}

/** Encabezado de página: título (con sección padre opcional), descripción y acciones. */
export function PageHeader({ title, parent, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-xl font-medium tracking-tight text-gray-800 dark:text-white">
          {parent && <span className="text-gray-500 dark:text-gray-400">{parent} / </span>}
          {title}
        </h1>
        {description && <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}

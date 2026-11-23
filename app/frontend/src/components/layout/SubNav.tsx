import { NavLink } from "react-router";
import type { ReactNode } from "react";
import { cn } from "@/utils";

export interface SubNavItem {
  label: string;
  /** Ruta (NavLink) o, si se omite, un elemento seleccionable visual. */
  to?: string;
  active?: boolean;
}

interface SubNavProps {
  title: string;
  items: SubNavItem[];
  onSelect?: (label: string) => void;
}

const itemClass = (active: boolean) =>
  cn(
    "block w-full rounded-full px-3 py-1.5 text-left text-theme-sm transition-colors",
    active
      ? "bg-gray-100 font-medium text-gray-800 dark:bg-white/[0.06] dark:text-white"
      : "text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200",
  );

/** Columna de categorías (Ajustes, Biblioteca, Integraciones…), como en los conceptos. */
export function SubNav({ title, items, onSelect }: SubNavProps) {
  return (
    <nav aria-label={title} className="min-w-0 lg:w-44 lg:shrink-0 lg:border-r lg:border-gray-800 lg:pr-3">
      <p className="mb-3 px-3 text-theme-xs uppercase tracking-wide text-gray-400">{title}</p>
      <ul className="flex gap-1 overflow-x-auto lg:flex-col">
        {items.map((item) => (
          <li key={item.label} className="shrink-0">
            {item.to ? (
              <NavLink to={item.to} end className={({ isActive }) => itemClass(isActive)}>
                {item.label}
              </NavLink>
            ) : (
              <button type="button" aria-pressed={!!item.active} onClick={() => onSelect?.(item.label)} className={itemClass(!!item.active)}>
                {item.label}
              </button>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Layout de dos columnas: SubNav a la izquierda, contenido a la derecha. */
export function WithSubNav({ nav, children }: { nav: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {nav}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

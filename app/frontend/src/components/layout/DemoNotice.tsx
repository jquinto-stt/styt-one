import { cn } from "@/utils";

/** Marca visible de «Entorno de demostración» exigida por la solución. */
export function DemoNotice({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-gray-200 px-2.5 py-0.5 text-theme-xs text-gray-500 dark:border-gray-800 dark:text-gray-400",
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-accent-500" aria-hidden="true" />
      Entorno de demostración
    </span>
  );
}

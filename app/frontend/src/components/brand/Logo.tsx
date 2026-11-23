import { cn } from "@/utils";

/** Isotipo de ST&T (los dos chevrones del logo, con su degradado azul). */
export function LogoMark({ className }: { className?: string }) {
  return <img src="/brand/stt-mark.svg" alt="" aria-hidden="true" className={cn("h-8 w-8", className)} />;
}

/** Isotipo + nombre de trabajo «ST&T One». */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)} aria-label="ST&T One">
      <LogoMark />
      <span className="text-xl font-semibold tracking-tight text-gray-800 dark:text-white">
        ST&amp;T <span className="text-brand-gradient">One</span>
      </span>
    </span>
  );
}

/** Logo oficial completo (con lema), para pantallas de entrada. */
export function LogoFull({ className }: { className?: string }) {
  return <img src="/brand/stt-logo.png" alt="ST&T · Software, datos e inteligencia artificial" className={cn("h-auto w-48", className)} />;
}

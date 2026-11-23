import { AtlasOrb } from "@/components/brand/AtlasOrb";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/utils";

export interface BrandSplashScreenProps {
  title?: string;
  subtitle?: string;
  fullscreen?: boolean;
}

/**
 * Pantalla de carga corporativa con el medallón animado ST&T ATLAS, el logotipo oficial
 * y una barra de progreso vectorial indeterminada.
 */
export function BrandSplashScreen({
  title,
  subtitle = "Preparando tu espacio en ST&T One…",
  fullscreen = false,
}: BrandSplashScreenProps) {
  return (
    <main
      role="status"
      aria-live="polite"
      className={cn(
        "relative grid place-items-center overflow-hidden bg-gray-50 px-6 text-center dark:bg-gray-950",
        fullscreen ? "min-h-screen" : "min-h-[55dvh] rounded-2xl",
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 size-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500/10 blur-3xl dark:bg-brand-500/15"
      />
      <div className="atlas-fade-up relative flex w-full max-w-xs flex-col items-center">
        <AtlasOrb size="md" state="thinking" />
        <div className="mt-6">
          <Logo className="w-32" />
        </div>
        {title && (
          <h1 className="mt-4 text-base font-medium text-gray-800 dark:text-white">
            {title}
          </h1>
        )}
        <div className="atlas-progress-track mt-5 h-1 w-48 overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
          <span className="atlas-progress-beam block h-full w-2/5 rounded-full" />
        </div>
        <p className="mt-3 text-theme-xs text-gray-500 dark:text-gray-400">
          {subtitle}
        </p>
      </div>
    </main>
  );
}

export type PageLoadingVariant = "cards" | "detail" | "chat" | "table" | "form";

export interface PageLoadingStateProps {
  variant?: PageLoadingVariant;
  label?: string;
  className?: string;
}

function SkeletonLine({ className }: { className?: string }) {
  return <div className={cn("atlas-skeleton rounded-lg", className)} />;
}

/**
 * Estado de carga de página con encabezado animado ST&T ATLAS y esqueletos
 * vectoriales con brillo diagonal adaptados a la geometría de cada pantalla.
 */
export function PageLoadingState({
  variant = "cards",
  label = "Cargando información…",
  className,
}: PageLoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("atlas-fade-up space-y-6", className)}
    >
      <div className="flex items-center gap-3.5 rounded-2xl border border-gray-200/80 bg-white/80 px-4 py-3 dark:border-gray-800 dark:bg-white/[0.025]">
        <AtlasOrb size="sm" state="thinking" />
        <div className="min-w-0 flex-1">
          <p className="text-theme-sm font-medium text-gray-800 dark:text-white">
            {label}
          </p>
          <div className="mt-1 flex items-center gap-1.5" aria-hidden="true">
            <span className="atlas-dot atlas-dot-1 size-1.5 rounded-full bg-brand-400" />
            <span className="atlas-dot atlas-dot-2 size-1.5 rounded-full bg-accent-400" />
            <span className="atlas-dot atlas-dot-3 size-1.5 rounded-full bg-brand-500" />
            <span className="ml-1 text-theme-xs text-gray-400">ST&amp;T ATLAS</span>
          </div>
        </div>
      </div>

      {variant === "cards" && (
        <div className="grid gap-4 md:grid-cols-2" aria-hidden="true">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2.5">
                  <SkeletonLine className="h-4 w-3/5" />
                  <SkeletonLine className="h-3 w-full" />
                  <SkeletonLine className="h-3 w-4/5" />
                </div>
                <SkeletonLine className="size-10 shrink-0 rounded-full" />
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-800">
                <SkeletonLine className="h-5 w-20 rounded-full" />
                <SkeletonLine className="h-8 w-24 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      )}

      {variant === "detail" && (
        <div className="grid gap-6 lg:grid-cols-3" aria-hidden="true">
          <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 lg:col-span-2 dark:border-gray-800 dark:bg-white/[0.03]">
            <SkeletonLine className="h-5 w-44" />
            <SkeletonLine className="h-3.5 w-full" />
            <SkeletonLine className="h-3.5 w-11/12" />
            <SkeletonLine className="h-3.5 w-4/5" />
            <div className="grid gap-3 pt-2 sm:grid-cols-2">
              <SkeletonLine className="h-16 w-full rounded-xl" />
              <SkeletonLine className="h-16 w-full rounded-xl" />
            </div>
          </div>
          <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <SkeletonLine className="h-5 w-36" />
            {[0, 1, 2, 3].map((row) => (
              <div key={row} className="space-y-2">
                <SkeletonLine className="h-2.5 w-24" />
                <SkeletonLine className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      )}

      {variant === "chat" && (
        <div className="space-y-5" aria-hidden="true">
          <div className="flex justify-end">
            <SkeletonLine className="h-11 w-2/3 max-w-sm rounded-xl rounded-tr-xs" />
          </div>
          <div className="flex gap-3">
            <SkeletonLine className="size-9 shrink-0 rounded-full" />
            <div className="w-4/5 max-w-xl space-y-2.5 rounded-xl rounded-tl-xs border border-gray-200/70 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
              <SkeletonLine className="h-3.5 w-32" />
              <SkeletonLine className="h-3.5 w-full" />
              <SkeletonLine className="h-3.5 w-11/12" />
              <SkeletonLine className="h-3.5 w-2/3" />
            </div>
          </div>
          <div className="flex justify-end">
            <SkeletonLine className="h-10 w-1/2 max-w-xs rounded-xl rounded-tr-xs" />
          </div>
        </div>
      )}

      {variant === "table" && (
        <div
          className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
          aria-hidden="true"
        >
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3.5 dark:border-gray-800">
            <SkeletonLine className="h-3.5 w-32" />
            <SkeletonLine className="h-3.5 w-20" />
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {[0, 1, 2, 3].map((row) => (
              <div key={row} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <SkeletonLine className="size-9 shrink-0 rounded-full" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <SkeletonLine className="h-3.5 w-48 max-w-[70%]" />
                    <SkeletonLine className="h-3 w-72 max-w-[90%]" />
                  </div>
                </div>
                <SkeletonLine className="h-7 w-20 shrink-0 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      )}

      {variant === "form" && (
        <div className="space-y-5" aria-hidden="true">
          <div className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <SkeletonLine className="h-5 w-44" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <SkeletonLine className="h-3 w-28" />
                <SkeletonLine className="h-11 w-full rounded-lg" />
              </div>
              <div className="space-y-2">
                <SkeletonLine className="h-3 w-24" />
                <SkeletonLine className="h-11 w-full rounded-lg" />
              </div>
            </div>
            <div className="space-y-3 pt-1">
              <SkeletonLine className="h-5 w-64" />
              <SkeletonLine className="h-5 w-52" />
            </div>
          </div>
          <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <SkeletonLine className="h-5 w-40" />
            <SkeletonLine className="h-24 w-full rounded-lg" />
            <div className="flex justify-end">
              <SkeletonLine className="h-9 w-36 rounded-lg" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export interface AtlasThinkingBubbleProps {
  voiceMode?: boolean;
}

/**
 * Burbuja de razonamiento de ST&T ATLAS durante consultas activas a Azure OpenAI.
 */
export function AtlasThinkingBubble({ voiceMode = false }: AtlasThinkingBubbleProps) {
  return (
    <div className="atlas-fade-up flex gap-3" role="status" aria-live="polite">
      <AtlasOrb size="xs" state="thinking" className="mt-0.5" />
      <article className="w-full max-w-[80%] rounded-xl rounded-tl-xs border border-brand-500/15 bg-gray-100 px-4 py-3.5 dark:border-brand-400/15 dark:bg-white/5">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <b className="text-theme-sm font-medium text-gray-800 dark:text-white">ST&amp;T ATLAS</b>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-400/30 bg-brand-500/10 px-2.5 py-0.5 text-theme-xs font-medium text-brand-600 dark:border-brand-400/30 dark:text-brand-300">
            <span className="size-1.5 animate-pulse rounded-full bg-accent-400" aria-hidden="true" />
            {voiceMode ? "Preparando respuesta de voz" : "Analizando fuentes"}
          </span>
        </div>
        <p className="text-theme-sm text-gray-600 dark:text-gray-300">
          {voiceMode
            ? "Consultando políticas y proyectos autorizados para responder por voz…"
            : "Consultando políticas y proyectos autorizados…"}
        </p>
        <div className="mt-3 space-y-2" aria-hidden="true">
          <SkeletonLine className="h-2.5 w-11/12 rounded-full" />
          <SkeletonLine className="h-2.5 w-4/5 rounded-full" />
          <SkeletonLine className="h-2.5 w-3/5 rounded-full" />
        </div>
      </article>
    </div>
  );
}

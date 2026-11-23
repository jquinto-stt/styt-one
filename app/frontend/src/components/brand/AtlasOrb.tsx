import { useId } from "react";
import { SttBrandMarkVector, type SttBrandMarkMode } from "@/components/brand/SttBrandMarkVector";
import { cn } from "@/utils";

export type AtlasOrbSize = "xs" | "sm" | "md" | "lg";
export type AtlasOrbState = "idle" | "connecting" | "thinking" | "listening" | "speaking";

export interface AtlasOrbProps {
  size?: AtlasOrbSize;
  state?: AtlasOrbState;
  /** Nivel de audio en vivo (0–100) para modular las ondas acústicas en modo de voz. */
  audioLevel?: number;
  className?: string;
}

const SIZE_METRICS: Record<
  AtlasOrbSize,
  { wrapper: string; core: string; halo: string; showOrbitals: boolean }
> = {
  xs: {
    wrapper: "size-9",
    core: "size-9",
    halo: "-inset-1.5",
    showOrbitals: false,
  },
  sm: {
    wrapper: "size-13",
    core: "size-11",
    halo: "-inset-2",
    showOrbitals: false,
  },
  md: {
    wrapper: "size-20",
    core: "size-14",
    halo: "-inset-4",
    showOrbitals: true,
  },
  lg: {
    wrapper: "size-32 sm:size-36",
    core: "size-21 sm:size-23",
    halo: "-inset-6 sm:-inset-8",
    showOrbitals: true,
  },
};

const PARTICLES: {
  cx: number;
  cy: number;
  r: number;
  delay: string;
  duration: string;
  sparkle?: boolean;
}[] = [
  { cx: 22, cy: 36, r: 1.5, delay: "0s", duration: "3.4s", sparkle: true },
  { cx: 138, cy: 32, r: 1.3, delay: "0.9s", duration: "4.1s" },
  { cx: 147, cy: 96, r: 1.6, delay: "1.5s", duration: "3.7s", sparkle: true },
  { cx: 122, cy: 141, r: 1.2, delay: "0.4s", duration: "4.4s" },
  { cx: 36, cy: 136, r: 1.4, delay: "1.9s", duration: "3.8s" },
  { cx: 13, cy: 88, r: 1.15, delay: "2.3s", duration: "4.2s" },
  { cx: 74, cy: 14, r: 1.35, delay: "1.1s", duration: "3.5s" },
  { cx: 102, cy: 18, r: 1.0, delay: "2.7s", duration: "4.6s" },
];

/**
 * Medallón insignia de ST&T ATLAS: esfera glassmórfica con halo eléctrico,
 * anillos orbitales vectoriales, micro-partículas y el isotipo oficial `< >`.
 */
export function AtlasOrb({
  size = "lg",
  state = "idle",
  audioLevel = 0,
  className,
}: AtlasOrbProps) {
  const uid = useId().replace(/:/g, "");
  const arcOuterId = `atlas-arc-outer-${uid}`;
  const arcInnerId = `atlas-arc-inner-${uid}`;

  const metrics = SIZE_METRICS[size];
  const clampedAudio = Math.max(0, Math.min(100, audioLevel));
  const isVoiceActive = state === "listening" || state === "speaking";
  const isEnergetic = state === "thinking" || state === "connecting";

  const markMode: SttBrandMarkMode =
    state === "connecting" ? "thinking" : state;

  const haloScale = isVoiceActive
    ? 1 + (clampedAudio / 100) * 0.18 + (state === "speaking" ? 0.08 : 0.03)
    : 1;

  const coreVoiceScale = isVoiceActive
    ? 1 + (clampedAudio / 100) * 0.055
    : 1;

  return (
    <div
      aria-hidden="true"
      data-state={state}
      data-size={size}
      className={cn(
        "atlas-orb relative inline-grid shrink-0 place-items-center select-none",
        metrics.wrapper,
        className,
      )}
    >
      {/* 1. Halo atmosférico radial eléctrico */}
      <span
        className={cn(
          "atlas-orb-halo pointer-events-none absolute rounded-full transition-transform duration-150",
          metrics.halo,
        )}
        style={isVoiceActive ? { transform: `scale(${haloScale.toFixed(3)})` } : undefined}
      />

      {/* 2. Ondas acústicas concéntricas en estados de voz o conexión */}
      {(isVoiceActive || state === "connecting") && (
        <>
          <span
            className="atlas-ripple atlas-ripple-1 pointer-events-none absolute inset-1 rounded-full"
            style={
              isVoiceActive
                ? { opacity: 0.45 + (clampedAudio / 100) * 0.45 }
                : undefined
            }
          />
          <span
            className="atlas-ripple atlas-ripple-2 pointer-events-none absolute inset-1 rounded-full"
            style={
              isVoiceActive
                ? { opacity: 0.35 + (clampedAudio / 100) * 0.4 }
                : undefined
            }
          />
        </>
      )}

      {/* 3. Anillos orbitales vectoriales de precisión y micro-partículas */}
      {metrics.showOrbitals && (
        <svg
          viewBox="0 0 160 160"
          fill="none"
          focusable="false"
          className="pointer-events-none absolute inset-0 size-full overflow-visible"
        >
          <defs>
            <linearGradient id={arcOuterId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.9" />
              <stop offset="48%" stopColor="#008AFF" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#0047FF" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id={arcInnerId} x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#7CD4FD" stopOpacity="0.75" />
              <stop offset="55%" stopColor="#0066FF" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#0047FF" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Anillo orbital exterior (sentido horario) */}
          <g
            className={cn(
              "atlas-spin",
              isEnergetic && "atlas-spin-fast",
              state === "speaking" && "atlas-spin-medium",
            )}
          >
            <circle
              cx="80"
              cy="80"
              r="66"
              stroke={`url(#${arcOuterId})`}
              strokeWidth="1.25"
              strokeDasharray="135 280"
              strokeLinecap="round"
            />
            <circle cx="80" cy="14" r="2.2" fill="#38BDF8" />
          </g>

          {/* Anillo orbital interior (sentido antihorario) */}
          <g
            className={cn(
              "atlas-spin-reverse",
              isEnergetic && "atlas-spin-fast",
              state === "speaking" && "atlas-spin-medium",
            )}
          >
            <circle
              cx="80"
              cy="80"
              r="56"
              stroke={`url(#${arcInnerId})`}
              strokeWidth="1"
              strokeDasharray="88 264"
              strokeLinecap="round"
            />
            <circle cx="80" cy="136" r="1.7" fill="#60A5FA" />
          </g>

          {/* Micro-partículas destellantes alrededor del halo */}
          <g className="atlas-particles">
            {PARTICLES.map((p, index) => (
              <g
                key={index}
                className="atlas-twinkle"
                style={{
                  animationDelay: p.delay,
                  animationDuration: p.duration,
                }}
              >
                {p.sparkle ? (
                  <path
                    d={`M ${p.cx} ${p.cy - p.r * 2.1} Q ${p.cx} ${p.cy} ${p.cx + p.r * 2.1} ${p.cy} Q ${p.cx} ${p.cy} ${p.cx} ${p.cy + p.r * 2.1} Q ${p.cx} ${p.cy} ${p.cx - p.r * 2.1} ${p.cy} Q ${p.cx} ${p.cy} ${p.cx} ${p.cy - p.r * 2.1} Z`}
                    fill="#7CD4FD"
                  />
                ) : (
                  <circle cx={p.cx} cy={p.cy} r={p.r} fill="#93C5FD" />
                )}
              </g>
            ))}
          </g>
        </svg>
      )}

      {/* 4. Medallón central glassmórfico con aro eléctrico y el isotipo `< >` */}
      <span
        className={cn(
          "atlas-orb-shell relative grid place-items-center rounded-full p-[1.5px] transition-transform duration-150",
          metrics.core,
          state === "idle" && "atlas-breathe",
        )}
        style={isVoiceActive ? { transform: `scale(${coreVoiceScale.toFixed(3)})` } : undefined}
      >
        <span className="atlas-orb-ring atlas-ring-spin pointer-events-none absolute inset-0 rounded-full" />
        <span className="atlas-orb-core relative grid size-full place-items-center overflow-hidden rounded-full">
          <span className="atlas-orb-specular pointer-events-none absolute inset-0 rounded-full" />
          <SttBrandMarkVector
            mode={markMode}
            className="relative z-10 size-[54%] drop-shadow-[0_0_12px_rgba(0,138,255,0.45)]"
          />
        </span>
      </span>
    </div>
  );
}

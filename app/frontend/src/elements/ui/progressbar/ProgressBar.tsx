import { cn } from "@/utils";

/**
 * Semantic color of the progress bar fill.
 *
 * - `"primary"` — Brand blue (`bg-brand-500`) *(default)*
 * - `"success"` — Green (`bg-success-500`) — completed, healthy
 * - `"error"` — Red (`bg-error-500`) — critical, over limit
 * - `"warning"` — Orange (`bg-warning-500`) — caution, approaching limit
 * @kgId f1ca7cfd2ee4
 */
export type ProgressBarColor = "primary" | "success" | "error" | "warning";

/**
 * Available sizes for the ProgressBar track height.
 *
 * - `"sm"` — `h-2` (8px) — compact, inline indicators *(default)*
 * - `"md"` — `h-3` (12px) — standard progress bars
 * - `"lg"` — `h-4` (16px) — prominent, can fit inside label
 * - `"xl"` — `h-5` (20px) — large, always fits inside label
 * @kgId 3c3aa1cb6a8b
 */
export type ProgressBarSize = "sm" | "md" | "lg" | "xl";

/**
 * Position of the percentage label relative to the progress bar.
 *
 * - `"none"` — No label shown *(default)*
 * - `"outside"` — Label displayed to the right of the bar
 * - `"inside"` — Label centered inside the filled portion (best with `"lg"` or `"xl"` size)
 * @kgId 1b2991e2ae8b
 */
export type ProgressBarLabel = "none" | "outside" | "inside";

/**
 * Props for the **ProgressBar** component.
 * @kgId f2dbaee76bee
 */
export interface ProgressBarProps {
  /**
   * Current progress value as a percentage (0–100).
   *
   * Controls the width of the filled portion of the bar.
   *
   * @example
   * ```tsx
   * <ProgressBar progress={45} />
   * ```
   */
  progress: number;

  /**
   * Height of the progress bar track.
   *
   * @default `"sm"`
   *
   * @example
   * ```tsx
   * <ProgressBar progress={60} size="lg" />
   * ```
   */
  size?: ProgressBarSize;

  /**
   * Where to display the percentage label.
   *
   * - `"none"` — hidden
   * - `"outside"` — to the right of the bar
   * - `"inside"` — centered within the filled area (use `"lg"` or `"xl"` size)
   *
   * @default `"none"`
   *
   * @example
   * ```tsx
   * <ProgressBar progress={75} label="outside" />
   * <ProgressBar progress={75} size="xl" label="inside" />
   * ```
   */
  label?: ProgressBarLabel;

  /**
   * Additional CSS classes applied to the outer container.
   *
   * @default `""`
   */
  className?: string;

  /**
   * Semantic color of the progress bar fill.
   *
   * @default `"primary"`
   */
  color?: ProgressBarColor;

  /**
   * Whether to animate width changes with a smooth CSS transition.
   *
   * When `true`, applies `transition-[width] duration-500 ease-in-out`
   * so progress changes animate smoothly.
   *
   * @default `false`
   */
  animated?: boolean;
}

/**
 * ProgressBar — Horizontal bar that visualizes determinate progress.
 *
 * Shows how far along a process is — file uploads, step completion,
 * quota usage, or any operation where the user benefits from seeing
 * a concrete percentage rather than just a spinning indicator.
 *
 * @remarks
 * **When to use ProgressBar vs related components:**
 * - Use `ProgressBar` for **determinate** progress — when you know
 *   the percentage (e.g. *"45% uploaded"*, *"step 3 of 5"*).
 * - Use **Spinner** for **indeterminate** loading — when you don't
 *   know how long the process will take.
 * - Use **Badge** to display a static count or status label.
 *
 * **Label placement:**
 * - `"none"` — Clean bar only, useful when context provides the info.
 * - `"outside"` — Percentage to the right, works at any size.
 * - `"inside"` — Percentage inside the bar. Use `"lg"` or `"xl"` size
 *   so the text fits comfortably.
 *
 * **Limitations:**
 * - Animation requires `animated={true}` — not enabled by default for backward compatibility.
 *
 * @example Basic usage
 * ```tsx
 * <ProgressBar progress={60} />
 * ```
 *
 * @example With outside label
 * ```tsx
 * <ProgressBar progress={75} size="md" label="outside" />
 * ```
 *
 * @example With inside label
 * ```tsx
 * <ProgressBar progress={45} size="xl" label="inside" />
 * ```
 *
 * @see {@link Spinner} — For indeterminate loading state.
 * @see {@link Badge} — For static status labels.
 * @kgId 85ee9bf44ebd
 */
const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  size = "sm",
  label = "none",
  className = "",
  color = "primary",
  animated = false,
}) => {
  const sizeClasses = {
    sm: "h-2",
    md: "h-3",
    lg: "h-4",
    xl: "h-5",
  };

  const colorClasses: Record<ProgressBarColor, string> = {
    primary: "bg-brand-500",
    success: "bg-success-500",
    error: "bg-error-500",
    warning: "bg-warning-500",
  };

  const renderLabel = () => {
    if (label === "outside") {
      return (
        <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-400">
          {progress}%
        </span>
      );
    } else if (label === "inside") {
      return (
        <span className="absolute inset-0 flex items-center justify-center text-white font-medium text-[10px] leading-tight">
          {progress}%
        </span>
      );
    }
    return null;
  };

  return (
    <div className={cn("flex w-full items-center", className)}>
      <div className={cn("relative w-full bg-gray-200 rounded-full dark:bg-gray-800", sizeClasses[size])}>
        <div
          className={cn(
            "absolute left-0 h-full rounded-full",
            animated ? "transition-[width] duration-500 ease-in-out" : "",
            colorClasses[color],
            label === "inside" && "flex items-center justify-center"
          )}
          style={{ width: `${progress}%` }}
        >
          {label === "inside" && renderLabel()}
        </div>
      </div>
      {label === "outside" && renderLabel()}
    </div>
  );
};

export default ProgressBar;

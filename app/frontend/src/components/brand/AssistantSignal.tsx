/** Las líneas siguen los ángulos del isotipo. El símbolo central permanece fijo. */
export function AssistantSignal() {
  return (
    <div aria-hidden="true" className="assistant-signal">
      <svg viewBox="0 0 320 88" fill="none" focusable="false">
        <defs>
          <linearGradient id="signal-ink">
            <stop stopColor="var(--color-accent-500)" />
            <stop offset=".5" stopColor="var(--color-brand-600)" />
            <stop offset="1" stopColor="var(--color-accent-500)" />
          </linearGradient>
        </defs>
        <g strokeLinecap="round" strokeLinejoin="round">
          {["M8 58h40l32-19h24l23 13", "M312 30h-40l-32 19h-24l-23-13"].map((d) => (
            <g key={d}>
              <path d={d} stroke="currentColor" />
              <path className="signal-pulse" d={d} stroke="url(#signal-ink)" strokeWidth="2.5" pathLength="100" />
            </g>
          ))}
        </g>
      </svg>
      <span className="signal-core"><img src="/brand/stt-mark.svg" width="42" height="42" alt="" /></span>
    </div>
  );
}

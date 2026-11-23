import { ReactNode } from "react";

interface AiChatBodyProps {
  children: ReactNode;
  className?: string;
}

/**
 * AiChatBody — Scrollable content area for AI chat messages.
 *
 * Renders children inside a centered, max-width container.
 * @kgId 9d4b2e7f5a13
 */
export default function AiChatBody({ children, className }: AiChatBodyProps) {
  return (
    <div className={`relative mx-auto items-center max-w-[720px] ${className ?? ""}`}>
      {children}
    </div>
  );
}

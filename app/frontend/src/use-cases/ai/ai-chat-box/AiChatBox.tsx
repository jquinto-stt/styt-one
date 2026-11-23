import { ReactNode } from "react";
import AiChatBody from "@/use-cases/ai/ai-chat-box/AiChatBody";
import AiPromptInput from "@/use-cases/ai/ai-chat-box/AiPromptInput";

interface AiChatBoxProps {
  children: ReactNode;
}

/**
 * AiChatBox — AI chat composition with message area and prompt input.
 *
 * Orchestrates AiChatBody (scrollable content slot) and AiPromptInput
 * (fixed textarea at the bottom). Content is passed as children.
 * @kgId 3c7e1a9d5f28
 */
export default function AiChatBox({ children }: AiChatBoxProps) {
  return (
    <div className="flex-1 xl:py-10">
      <AiChatBody>{children}</AiChatBody>
      <AiPromptInput />
    </div>
  );
}

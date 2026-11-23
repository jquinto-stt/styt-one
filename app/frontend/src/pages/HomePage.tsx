import { useCurrentUser } from "@/app/DemoSession";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { AssistantSignal } from "@/components/brand/AssistantSignal";
import { chatSuggestions } from "@/data/demo";

/** Inicio: punto único de consulta (el chat es la experiencia central del MVP). */
export function HomePage() {
  const currentUser = useCurrentUser();
  return (
    <div className="relative mx-auto flex min-h-[68dvh] max-w-3xl flex-col items-center justify-center py-10 text-center">
      <div aria-hidden="true" className="pointer-events-none absolute top-[15%] h-44 w-64 rounded-full bg-brand-500/10 blur-3xl" />
      <AssistantSignal />
      <h1 className="relative mt-6 text-title-sm font-medium text-gray-800 dark:text-white">
        ¿Qué necesitas consultar, {currentUser.name.split(" ")[0]}?
      </h1>
      <p className="relative mt-2 text-xl text-gray-500 dark:text-gray-400">
        Conversa con <span className="assistant-accent font-medium">ST&amp;T One</span>.
      </p>
      <ChatComposer className="relative mt-8" suggestions={chatSuggestions} />
    </div>
  );
}

import { ChatComposer } from "@/components/chat/ChatComposer";
import { LogoMark } from "@/components/brand/Logo";
import { chatSuggestions, currentUser } from "@/data/demo";

/** Inicio: punto único de consulta (el chat es la experiencia central del MVP). */
export function HomePage() {
  return (
    <div className="relative mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center py-10 text-center">
      <div aria-hidden="true" className="pointer-events-none absolute top-0 size-72 rounded-full bg-brand-600/20 blur-3xl" />
      <span className="relative grid size-16 place-items-center rounded-full border border-white/10 bg-gray-900 shadow-[0_0_40px_-8px] shadow-brand-500/60">
        <LogoMark className="size-9" />
      </span>
      <h1 className="relative mt-6 text-title-sm font-medium text-gray-800 dark:text-white">
        Hola, {currentUser.name.split(" ")[0]}. ¿Qué necesitas consultar?
      </h1>
      <p className="relative mt-2 text-theme-sm text-gray-500 dark:text-gray-400">
        Conversa con <span className="text-brand-gradient font-medium">ST&amp;T One</span>: políticas, tu perfil y tus proyectos.
      </p>
      <ChatComposer className="relative mt-8" suggestions={chatSuggestions} />
    </div>
  );
}

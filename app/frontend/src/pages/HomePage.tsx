import { useNavigate } from "react-router";
import { useCurrentUser } from "@/app/DemoSession";
import { ChatComposer, type ChatSendOptions } from "@/components/chat/ChatComposer";
import { AtlasOrb } from "@/components/brand/AtlasOrb";
import { BoltIcon, DocsIcon, FolderIcon, UserCircleIcon } from "@/icons";

const STARTER_CARDS = [
  {
    title: "Vacaciones",
    question: "¿Cómo pido vacaciones?",
    hint: "Política vigente y pasos de aprobación",
    Icon: DocsIcon,
  },
  {
    title: "Mi perfil",
    question: "¿Qué datos hay en mi perfil?",
    hint: "Consulta tus campos corporativos autorizados",
    Icon: UserCircleIcon,
  },
  {
    title: "Mis proyectos",
    question: "¿En qué proyectos participo?",
    hint: "Catálogo de proyectos asignados a tu cuenta",
    Icon: FolderIcon,
  },
  {
    title: "Estado de proyecto",
    question: "Resume el estado de mi proyecto",
    hint: "Resumen basado únicamente en fichas documentadas",
    Icon: BoltIcon,
  },
];

/** Inicio: punto único de consulta aprovechando el ancho del espacio de trabajo. */
export function HomePage() {
  const currentUser = useCurrentUser();
  const navigate = useNavigate();

  function handleSend(question: string, options?: ChatSendOptions) {
    navigate("/conversacion", {
      state: {
        initialQuestion: question,
        viaVoice: Boolean(options?.viaVoice),
      },
    });
  }

  function handleStartRealtime() {
    navigate("/conversacion", {
      state: {
        startRealtime: true,
      },
    });
  }

  return (
    <div className="atlas-fade-up mx-auto flex min-h-[calc(100dvh-11rem)] w-full max-w-4xl flex-col items-center justify-center px-2 py-6 text-center">
      <AtlasOrb size="lg" state="idle" />
      <h1 className="mt-6 text-title-sm font-semibold tracking-tight text-gray-900 dark:text-white">
        ¿Qué necesitas consultar, {currentUser.name.split(" ")[0]}?
      </h1>
      <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">
        Conversa con <span className="assistant-accent font-medium">ST&amp;T ATLAS</span> con respuestas verificables.
      </p>

      <ChatComposer
        className="mt-7"
        placeholder="Escribe o dicta tu consulta a ST&T ATLAS…"
        onSend={handleSend}
        onStartRealtime={handleStartRealtime}
      />

      <div className="mt-6 grid w-full gap-3 text-left sm:grid-cols-2">
        {STARTER_CARDS.map(({ title, question, hint, Icon }) => (
          <button
            key={title}
            type="button"
            onClick={() => handleSend(question)}
            className="group flex items-start gap-3.5 rounded-2xl border border-gray-200/90 bg-white p-4 text-left shadow-2xs transition-all hover:-translate-y-0.5 hover:border-brand-400/70 hover:shadow-theme-sm dark:border-white/[0.08] dark:bg-white/[0.03] dark:hover:border-brand-400/50 dark:hover:bg-white/[0.055]"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-500/10 text-brand-600 transition-colors group-hover:bg-brand-500/15 dark:bg-brand-500/15 dark:text-accent-400">
              <Icon className="size-4.5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-theme-sm font-medium text-gray-900 group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-200">
                {title}
              </span>
              <span className="mt-0.5 block text-theme-xs text-gray-600 dark:text-gray-300">
                {question}
              </span>
              <span className="mt-1 block text-[11px] text-gray-400 dark:text-gray-500">
                {hint}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

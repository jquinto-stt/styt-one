import { InfoIcon, DocsIcon, LockIcon, AlertIcon } from "@/icons";
import { Button } from "@/elements/ui/button";
import { demoHelpArticles, demoHelpTopics } from "@/data/demo";

const topicIcons = [<InfoIcon />, <DocsIcon />, <LockIcon />, <AlertIcon />];

/** Ayuda: preguntas frecuentes sobre cómo funciona el asistente. */
export function HelpPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <section className="py-8 text-center">
        <h1 className="text-title-sm font-medium text-gray-800 dark:text-white">¿Cómo podemos ayudarte?</h1>
        <p className="mt-2 text-theme-sm text-gray-500 dark:text-gray-400">Respuestas sobre cómo usar ST&amp;T One y de dónde salen sus respuestas.</p>
        <input
          type="search"
          placeholder="Buscar un artículo…"
          className="mx-auto mt-6 h-11 w-full max-w-md rounded-full border border-gray-200 bg-transparent px-5 text-theme-sm placeholder:text-gray-400 focus:border-brand-400 focus:outline-hidden dark:border-gray-800 dark:text-white/90"
        />
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {["Primeros pasos", "Chat", "Fuentes", "Permisos"].map((t) => (
            <span key={t} className="rounded-full border border-gray-200 px-3 py-1 text-theme-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">{t}</span>
          ))}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {demoHelpTopics.map((t, i) => (
          <article key={t.title} className="flex flex-col items-center rounded-2xl border border-gray-200 bg-white p-5 text-center dark:border-gray-800 dark:bg-white/[0.03]">
            <span className="grid size-11 place-items-center rounded-full bg-brand-500/15 text-brand-400 [&>svg]:size-5">{topicIcons[i]}</span>
            <h2 className="mt-4 font-medium text-gray-800 dark:text-white">{t.title}</h2>
            <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">{t.description}</p>
            <Button className="mt-4" size="sm" variant="outline">Leer más</Button>
          </article>
        ))}
      </div>

      <section className="mt-8 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
        <h2 className="border-b border-gray-200 bg-gray-50 px-5 py-4 font-medium text-gray-800 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white">Usar ST&amp;T One</h2>
        <div className="grid gap-4 p-5 md:grid-cols-3">
          {demoHelpArticles.map((a) => (
            <article key={a.title} className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
              <h3 className="text-theme-sm font-medium text-gray-800 dark:text-white">{a.title}</h3>
              <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">{a.description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

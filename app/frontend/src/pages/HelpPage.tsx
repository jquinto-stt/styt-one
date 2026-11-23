import { Link, useSearchParams } from "react-router";
import { useState } from "react";
import { LogoMark } from "@/components/brand/Logo";
import { InfoIcon, DocsIcon, LockIcon, AlertIcon } from "@/icons";
import { Button } from "@/elements/ui/button";
import { demoHelpArticles, demoHelpTopics } from "@/data/demo";

const articleText: Record<string, string> = {
  "¿Qué es ST&T One?": "Desde Inicio puedes consultar políticas, tu perfil y los proyectos en los que participas. Selecciona una pregunta sugerida para explorar una conversación de ejemplo.",
  "Fuentes y referencias": "Abre la fuente que acompaña la respuesta. Comprueba el documento, la versión y la sección antes de aplicar un procedimiento.",
  "Permisos": "Tu rol y los proyectos a los que perteneces determinan qué información puedes consultar. Revisa tu cuenta en Ajustes para ver el rol de la demo.",
  "Sin evidencia": "Prueba con el nombre del procedimiento o busca el documento en la Biblioteca. Si falta una fuente vigente, confirma la información con el responsable.",
  "Privacidad y seguridad": "Esta demostración utiliza cuentas y documentos ficticios. Evita escribir contraseñas o información personal en el chat.",
  "Buenas preguntas": "Incluye el tema y la información que necesitas. Por ejemplo, pregunta qué pasos debes seguir para solicitar vacaciones.",
  "Problemas frecuentes": "Si una página no carga, vuelve a Inicio y abre la sección de nuevo. En Biblioteca puedes consultar directamente los documentos de ejemplo.",
};

const topicIcons = [<InfoIcon />, <DocsIcon />, <LockIcon />, <AlertIcon />];

/** Ayuda: preguntas frecuentes sobre cómo funciona el asistente. */
export function HelpPage() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const topics = [...demoHelpTopics, ...demoHelpArticles];
  const article = topics.find((item) => item.title === params.get("articulo"));
  const matches = (text: string) => text.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
  if (article) return (
    <article className="mx-auto max-w-3xl overflow-hidden rounded-xl bg-white dark:bg-gray-dark">
      <div className="help-cover grid h-44 place-items-center"><LogoMark className="size-14" /></div>
      <div className="p-6 sm:p-8">
        <Link className="text-sm text-brand-700 dark:text-brand-200" to="/ayuda">← Centro de ayuda</Link>
        <h1 className="mt-5 text-2xl font-medium text-gray-900 dark:text-white">{article.title}</h1>
        <p className="mt-3 text-gray-700 dark:text-gray-300">{article.description}</p>
        <p className="mt-4 leading-relaxed text-gray-600 dark:text-gray-400">{articleText[article.title]}</p>
      </div>
    </article>
  );
  return (
    <div className="mx-auto max-w-5xl">
      <section className="py-8 text-center">
        <h1 className="text-title-sm font-medium text-gray-800 dark:text-white">¿Cómo podemos ayudarte?</h1>
        <p className="mt-2 text-theme-sm text-gray-500 dark:text-gray-400">Respuestas sobre cómo usar ST&amp;T One y de dónde salen sus respuestas.</p>
        <input
          aria-label="Buscar un artículo" value={query} onChange={(event) => setQuery(event.target.value)}
          type="search"
          placeholder="Buscar un artículo…"
          className="mx-auto mt-6 h-11 w-full max-w-md rounded-full border border-gray-200 bg-transparent px-5 text-theme-sm placeholder:text-gray-400 focus:border-brand-400 focus:outline-hidden dark:border-gray-800 dark:text-white/90"
        />
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {["Asistente", "Fuentes", "Permisos"].map((t) => (
            <button type="button" onClick={() => setQuery(t)} key={t} className="rounded-full border border-gray-200 px-3 py-1 text-theme-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">{t}</button>
          ))}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {demoHelpTopics.map((t, i) => matches(t.title + " " + t.description) && (
          <article key={t.title} className="flex flex-col items-center rounded-2xl border border-gray-200 bg-white p-5 text-center dark:border-gray-800 dark:bg-white/[0.03]">
            <span className="grid size-11 place-items-center rounded-full bg-brand-500/15 text-brand-400 [&>svg]:size-5">{topicIcons[i]}</span>
            <h2 className="mt-4 font-medium text-gray-800 dark:text-white">{t.title}</h2>
            <p className="mt-1 mb-4 text-theme-xs text-gray-500 dark:text-gray-400">{t.description}</p>
            <Button onClick={() => setParams({ articulo: t.title })} className="mt-auto" size="sm" variant="outline">Leer más</Button>
          </article>
        ))}
      </div>

      {!topics.some((a) => matches(a.title + " " + a.description)) && <p role="status" className="text-center text-gray-400">No se encontraron artículos.</p>}
      {demoHelpArticles.some((a) => matches(a.title + " " + a.description)) && <section className="mt-8 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
        <h2 className="border-b border-gray-200 bg-gray-50 px-5 py-4 font-medium text-gray-800 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white">Usar ST&amp;T One</h2>
        <div className="grid gap-4 p-5 md:grid-cols-3">
          {demoHelpArticles.filter((a) => matches(a.title + " " + a.description)).map((a) => (
            <article key={a.title} className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
              <h3 className="text-theme-sm font-medium text-gray-800 dark:text-white"><Link to={{ search: new URLSearchParams({ articulo: a.title }).toString() }}>{a.title}</Link></h3>
              <p className="mt-1 mb-4 text-theme-xs text-gray-500 dark:text-gray-400">{a.description}</p>
            </article>
          ))}
        </div>
      </section>}
    </div>
  );
}

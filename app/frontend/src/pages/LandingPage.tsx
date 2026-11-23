import { Link } from "react-router";
import { Button } from "@/elements/ui/button";
import { LogoFull } from "@/components/brand/Logo";
import { DemoNotice } from "@/components/layout/DemoNotice";

const features = [
  { title: "Políticas con fuente", tagline: "Procedimientos vigentes", text: "Pregunta en lenguaje natural y abre la sección exacta del documento que respalda cada respuesta." },
  { title: "Tu información", tagline: "Solo lo autorizado", text: "Consulta los campos de tu perfil. Nadie puede ver datos ajenos preguntándole al asistente." },
  { title: "Tus proyectos", tagline: "Contexto sin inventos", text: "Responsable, estado y documentos de los proyectos en los que participas, sin cifras inventadas." },
];

/** Página de bienvenida (landing) de ST&T One. */
export function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gray-950 text-white">
      <div aria-hidden="true" className="pointer-events-none absolute -left-40 top-20 size-[40rem] rounded-full bg-brand-700/25 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-40 bottom-0 size-[32rem] rounded-full bg-accent-500/15 blur-3xl" />

      <header className="relative mx-auto flex max-w-6xl items-center justify-between border-b border-white/10 px-6 py-5">
        <LogoFull className="w-36" />
        <Link to="/acceso">
          <Button variant="outline" size="sm">Iniciar sesión</Button>
        </Link>
      </header>

      <section className="relative mx-auto max-w-4xl px-6 pt-24 text-center">
        <DemoNotice />
        <h1 className="mt-6 text-title-md font-semibold sm:text-title-lg">
          Tu asistente corporativo,
          <br />
          <span className="text-brand-gradient">con respuestas que puedes verificar</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-gray-400">
          ST&amp;T One reúne en un solo chat las políticas de la empresa, tu información y el contexto de tus proyectos.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/acceso"><Button size="lg">Entrar a la demo</Button></Link>
          <Link to="/ayuda"><Button size="lg" variant="outline">Cómo funciona</Button></Link>
        </div>
      </section>

      <section className="relative mx-auto mt-20 grid max-w-5xl gap-4 px-6 pb-20 sm:grid-cols-3">
        {features.map((f) => (
          <article key={f.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur">
            <h2 className="font-medium">{f.title}</h2>
            <p className="text-theme-xs text-gray-500">{f.tagline}</p>
            <p className="mt-3 text-theme-sm text-gray-400">{f.text}</p>
          </article>
        ))}
      </section>
    </main>
  );
}

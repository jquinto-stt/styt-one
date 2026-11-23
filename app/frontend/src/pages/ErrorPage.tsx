import { Link } from "react-router";
import { Button } from "@/elements/ui/button";
import { LogoMark } from "@/components/brand/Logo";

interface ErrorPageProps {
  code: string;
  title: string;
  message: string;
}

/** Página de error / acceso denegado. */
export function ErrorPage({ code, title, message }: ErrorPageProps) {
  return (
    <main className="grid min-h-screen place-items-center bg-gray-950 px-4 text-center">
      <div>
        <LogoMark className="mx-auto size-12" />
        <p className="mt-6 text-title-md font-semibold text-brand-gradient">{code}</p>
        <h1 className="mt-2 text-xl font-semibold text-white">{title}</h1>
        <p className="mt-2 text-theme-sm text-gray-400">{message}</p>
        <Link to="/" className="mt-6 inline-block">
          <Button variant="outline">Volver al asistente</Button>
        </Link>
      </div>
    </main>
  );
}

import { useState } from "react";
import { Link } from "react-router";
import { Button } from "@/elements/ui/button";
import { Input } from "@/elements/form/input";
import { Label } from "@/elements/form/label";
import { Select } from "@/elements/form/select";
import { Alert } from "@/elements/ui/alert";
import { LogoFull } from "@/components/brand/Logo";
import { DemoNotice } from "@/components/layout/DemoNotice";
import { demoUsers } from "@/data/demo";

/**
 * Pantalla de acceso (solo visual). Selección de cuenta ficticia + contraseña de demo.
 * El botón lleva al inicio sin validar nada: la autenticación real llega en el Slice 02.
 */
export function LoginPage() {
  const [account, setAccount] = useState(demoUsers[0].login);
  const [showError, setShowError] = useState(false);

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-gray-950 px-4 py-10">
      {/* Fondo: rejilla tenue + halo azul del logo */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,#ffffff0d_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0d_1px,transparent_1px)] [background-size:64px_64px]"
      />
      <div aria-hidden="true" className="pointer-events-none absolute -top-40 left-1/2 size-[36rem] -translate-x-1/2 rounded-full bg-brand-600/25 blur-3xl" />

      <section className="relative w-full max-w-md rounded-2xl border border-white/10 bg-gray-900/80 p-8 shadow-theme-xl backdrop-blur">
        <div className="mb-6 flex flex-col items-center text-center">
          <LogoFull className="w-44" />
          <h1 className="mt-6 text-xl font-semibold text-white">Bienvenido a ST&amp;T One</h1>
          <p className="mt-1 text-theme-sm text-gray-400">Ingresa con tu cuenta de demostración.</p>
        </div>

        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <div>
            <Label>Cuenta</Label>
            <Select
              options={demoUsers.map((u) => ({ value: u.login, label: `${u.name} · ${u.role}` }))}
              defaultValue={account}
              onChange={setAccount}
            />
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <Label htmlFor="password" className="mb-0">Contraseña</Label>
              <button type="button" onClick={() => setShowError(!showError)} className="text-theme-xs text-brand-300 hover:underline">
                Ver mensaje de error
              </button>
            </div>
            <Input id="password" type="password" placeholder="••••••••" autoComplete="current-password" />
            <p className="mt-1.5 text-theme-xs text-gray-400">
              Contraseña de demo: <code className="rounded bg-white/10 px-1">Demo-One-2026</code>
            </p>
          </div>

          {showError && <Alert variant="error" title="No pudimos iniciar sesión" message="La cuenta o la contraseña no son correctas." />}

          <Link to="/" className="block">
            <Button className="w-full">Iniciar sesión</Button>
          </Link>
        </form>

        <div className="mt-6 flex flex-col items-center gap-3 text-center text-theme-xs text-gray-400">
          <p>¿No tienes cuenta? Las cuentas las crea un administrador autorizado.</p>
          <DemoNotice />
        </div>
      </section>
    </main>
  );
}

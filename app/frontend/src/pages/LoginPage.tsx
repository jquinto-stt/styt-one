import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ThemeToggleButton } from "@/shell";
import { useDemoSession } from "@/app/DemoSession";
import { Button } from "@/elements/ui/button";
import { Input } from "@/elements/form/input";
import { Label } from "@/elements/form/label";
import { Select } from "@/elements/form/select";
import { Alert } from "@/elements/ui/alert";
import { Logo } from "@/components/brand/Logo";
import { DemoNotice } from "@/components/layout/DemoNotice";
import { demoUsers } from "@/data/demo";
import { getDemoAccounts, type DemoUser } from "@/services/api";

/** Acceso con cuentas de demostración autenticadas contra el backend. */
export function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useDemoSession();
  const [accounts, setAccounts] = useState<DemoUser[]>(demoUsers);
  const [accountsVersion, setAccountsVersion] = useState(0);
  const [account, setAccount] = useState(demoUsers[0].login);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getDemoAccounts()
      .then(({ accounts: loaded }) => {
        if (!active || loaded.length === 0) return;
        setAccounts(loaded);
        setAccount((current) =>
          loaded.some((u) => u.login === current) ? current : loaded[0].login,
        );
        setAccountsVersion((v) => v + 1);
      })
      .catch(() => {
        // Keep fallback accounts if demo-accounts endpoint is momentarily unreachable.
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setErrorMessage(null);
    setSubmitting(true);

    const password = String(new FormData(e.currentTarget).get("password") ?? "");
    const result = await signIn(account, password);
    setSubmitting(false);

    if (result.ok) {
      navigate("/", { replace: true });
    } else {
      setErrorMessage(result.error ?? "La cuenta o la contraseña no son correctas.");
    }
  }

  return (
    <main className="public-access relative grid min-h-screen place-items-center overflow-hidden bg-gray-950 px-4 py-20">
      {/* Fondo: rejilla tenue + halo azul del logo */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,#ffffff0d_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0d_1px,transparent_1px)] [background-size:64px_64px]"
      />
      <div aria-hidden="true" className="pointer-events-none absolute -top-40 left-1/2 size-[36rem] -translate-x-1/2 rounded-full bg-brand-600/15 blur-3xl" />

      <div className="absolute right-4 top-4 z-10"><ThemeToggleButton /></div>
      <section className="relative w-full max-w-[25rem] rounded-xl border border-white/10 bg-white/95 dark:bg-[#172744]/95 p-6 sm:p-8 shadow-theme-xl backdrop-blur">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo className="w-32" />
          <h1 className="mt-6 text-xl font-semibold text-gray-900 dark:text-white">Bienvenido a ST&amp;T One</h1>
          <p className="mt-1 text-theme-sm text-gray-600 dark:text-gray-400">Ingresa con tu cuenta de demostración.</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <Label>Cuenta</Label>
            <Select
              key={accountsVersion}
              options={accounts.map((u) => ({ value: u.login, label: `${u.name} · ${u.role}` }))}
              defaultValue={account}
              onChange={(val) => {
                setAccount(val);
                if (errorMessage) setErrorMessage(null);
              }}
              disabled={submitting}
            />
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <Label htmlFor="password" className="mb-0">Contraseña</Label>
            </div>
            <Input
              id="password"
              name="password"
              required
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={submitting}
            />
            <p className="mt-1.5 text-theme-xs text-gray-600 dark:text-gray-400">
              Contraseña de demo: <code className="rounded bg-white/10 px-1">Demo-One-2026</code>
            </p>
          </div>

          {errorMessage && (
            <Alert variant="error" title="No pudimos iniciar sesión" message={errorMessage} />
          )}

          <Button type="submit" className="w-full" loading={submitting}>
            {submitting ? "Iniciando sesión…" : "Iniciar sesión"}
          </Button>
        </form>

        <div className="mt-6 flex flex-col items-center gap-3 text-center text-theme-xs text-gray-600 dark:text-gray-400">
          <p>¿No tienes cuenta? Las cuentas las crea un administrador autorizado.</p>
          <DemoNotice />
        </div>
      </section>
    </main>
  );
}

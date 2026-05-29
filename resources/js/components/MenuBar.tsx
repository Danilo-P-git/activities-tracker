import { logoutWithJwt } from '@/lib/jwt-auth';
import React from 'react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

const navItems = [
  { href: '/eventi', label: 'Gestione eventi' },
  { href: '/gruppi', label: 'Gestione attivita arena' },
  { href: '/staff', label: 'Staff' },
  { href: '/metriche', label: 'Metriche' },
  { href: '/public-page', label: 'Pagina pubblica' },
  { href: '/configurazione', label: 'Configurazione' },
];

export default function MenuBar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    setIsMobileMenuOpen(false);
    await logoutWithJwt();
    window.location.href = '/login';
  };

  const handleCloseMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="sticky top-0 z-40 border-b border-border bg-background/95 px-4 py-2 shadow backdrop-blur">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <a href="/home" className="shrink-0">
              <img src="/Midichlorians-Lightsaber-Academy-400x83.png" alt="Midichlorians Logo" className="h-10 w-auto" />
            </a>
            <a href="/home" className="hidden text-xl font-extrabold tracking-wide text-primary sm:inline lg:text-2xl">
              TRACKING ACTIVITIES APP
            </a>
          </div>

          <div className="hidden items-center gap-4 lg:flex">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className="text-foreground font-semibold transition hover:text-primary">
                {item.label}
              </a>
            ))}
            <button
              type="button"
              onClick={handleLogout}
              className="ml-2 rounded bg-red-600 px-3 py-1 text-white font-semibold transition hover:bg-red-700"
            >
              Logout
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-card text-foreground transition hover:bg-accent lg:hidden"
            aria-label="Apri menu di navigazione"
            aria-expanded={isMobileMenuOpen}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/45"
            onClick={handleCloseMenu}
            aria-label="Chiudi menu"
          />

          <aside className="absolute right-0 top-0 flex h-full w-[min(22rem,85vw)] flex-col border-l border-border bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Navigazione
                </div>
                <div className="mt-1 text-lg font-bold text-primary">
                  Activities Tracker
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseMenu}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-foreground transition hover:bg-accent"
                aria-label="Chiudi menu di navigazione"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-2 px-4 py-5">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={handleCloseMenu}
                  className="rounded-xl px-4 py-3 text-base font-semibold text-foreground transition hover:bg-accent hover:text-primary"
                >
                  {item.label}
                </a>
              ))}
            </div>

            <div className="border-t border-border px-4 py-4">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full rounded-xl bg-red-600 px-4 py-3 text-base font-semibold text-white transition hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

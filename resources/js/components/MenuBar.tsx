import React from 'react';

export default function MenuBar() {
  return (
    <nav className="bg-background border-b border-border shadow flex items-center px-4 py-2 gap-6 justify-between">
      <div className="flex items-center gap-3">
        <img src="https://midichlorians.it/wp-content/uploads/2022/06/Midichlorians-Lightsaber-Academy.png" alt="Midichlorians Logo" className="h-10 w-auto" />
        <a href="/home" className="font-extrabold text-xl text-primary  tracking-wide hidden sm:inline">TRACKING ACTIVITIES APP</a>
      </div>
      <div className="flex gap-4 ml-auto items-center">
        <a href="/eventi" className="text-foreground hover:text-primary font-semibold transition">Gestione eventi</a>
        <a href="/gruppi" className="text-foreground hover:text-primary font-semibold transition">Gestione attività arena</a>
        <a href="/public-page" className="text-foreground hover:text-primary font-semibold transition">Pagina pubblica</a>
        <a href="/configurazione" className="text-foreground hover:text-primary font-semibold transition">Configurazione</a>
        <form method="POST" action="/logout">
          <input
            type="hidden"
            name="_token"
            value={
              document.querySelector('meta[name=csrf-token]')?.getAttribute('content') || ''
            }
          />
          <button type="submit" className="ml-4 px-3 py-1 rounded bg-red-600 text-white font-semibold hover:bg-red-700 transition">Logout</button>
        </form>
      </div>
    </nav>
  );
}

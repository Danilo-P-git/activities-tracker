import React from 'react';

export default function MenuBar() {
  return (
    <nav className="bg-background border-b border-border shadow flex items-center px-4 py-2 gap-6">
      <div className="flex items-center gap-3">
        <img src="https://midichlorians.it/wp-content/uploads/2022/06/Midichlorians-Lightsaber-Academy.png" alt="Midichlorians Logo" className="h-10 w-auto" />
        <a href="/home" className="font-extrabold text-xl text-primary  tracking-wide hidden sm:inline">TRACKING ACTIVITIES APP</a>
      </div>
      <div className="flex-1 flex gap-4 ml-8">
        <a href="/eventi" className="text-foreground hover:text-primary font-semibold transition">Gestione eventi</a>
        <a href="/gruppi" className="text-foreground hover:text-primary font-semibold transition">Gestione attività arena</a>
        <a href="#" className="text-foreground hover:text-primary font-semibold transition">Pagina pubblica</a>
      </div>
    </nav>
  );
}

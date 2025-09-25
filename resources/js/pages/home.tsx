import React from 'react';
import MenuBar from '../components/MenuBar';

export default function HomePage() {
  return (
    <>
      <MenuBar />
      <div className="min-h-screen bg-background p-4 md:p-8 flex flex-col items-center">
        <h1 className="text-3xl md:text-4xl font-extrabold text-primary mb-6 mt-8 text-center">Benvenuto nella piattaforma Midichlorians</h1>
  <div className="w-full flex flex-col md:flex-row md:justify-center gap-8">
          {/* Card Gestione Eventi */}
          <div className="flex-1 max-w-xl bg-card rounded-xl shadow p-6 mb-8 border border-border flex flex-col">
            <h2 className="text-xl font-bold text-secondary mb-2">Gestione Eventi</h2>
            <p className="text-base text-foreground mb-4">
              Qui puoi:
              <ul className="list-disc ml-6 mt-2 text-muted-foreground">
                <li>Vedere tutti gli eventi</li>
                <li>Aggiungere nuovi eventi</li>
                <li>Modificare eventi futuri e staff</li>
                <li>Vedere la cronologia staff</li>
                <li>Filtrare e ordinare per nome, data o luogo</li>
              </ul>
            </p>
            <div className="mt-6">
              <h3 className="font-semibold text-primary mb-2">Legenda:</h3>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center gap-2"><span className="inline-block w-4 h-4 rounded bg-primary/10 border border-primary"></span> Staff attivo</div>
                <div className="flex items-center gap-2"><span className="inline-block w-4 h-4 rounded bg-muted-foreground/10 border border-muted-foreground"></span> Staff non attivo</div>
                <div className="flex items-center gap-2"><span className="inline-block w-4 h-4 rounded bg-primary"></span> Evento in evidenza</div>
              </div>
            </div>
            <a href="/events" className="mt-8 bg-primary hover:bg-secondary text-background font-bold rounded-lg px-6 py-3 shadow transition text-lg self-center">Vai agli eventi</a>
          </div>
          {/* Card Gestione attività in arena */}
          <div className="flex-1 max-w-xl bg-card rounded-xl shadow p-6 mb-8 border border-border flex flex-col">
            <h2 className="text-xl font-bold text-secondary mb-2">Gestione attività in arena</h2>
            <p className="text-base text-foreground mb-4">
              Qui puoi:
              <ul className="list-disc ml-6 mt-2 text-muted-foreground">
                <li>Creare, modificare e chiudere gruppi</li>
                <li>Assegnare uno staff e la durata</li>
                <li>Vedere lo stato dei gruppi (attivi, in attesa, chiusi)</li>
                <li>Controllare il timer di ogni gruppo</li>
                <li>Vedere a che giorno dell'evento si riferisce ogni gruppo</li>
              </ul>
            </p>
            <div className="mt-6">
              <h3 className="font-semibold text-primary mb-2">Legenda:</h3>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center gap-2"><span className="inline-block w-4 h-4 rounded-full bg-gray-900 border-4 border-yellow-400"></span> Gruppo in corso</div>
                <div className="flex items-center gap-2"><span className="inline-block w-4 h-4 rounded-full bg-white border-4 border-white"></span> Gruppo in attesa</div>
                <div className="flex items-center gap-2"><span className="inline-block w-4 h-4 rounded-full bg-orange-50 border-4 border-orange-500"></span> Gruppo in attesa da 30+ min</div>
                <div className="flex items-center gap-2"><span className="inline-block w-4 h-4 rounded-full bg-card border-4 border-red-600"></span> Gruppo da chiamare</div>
                <div className="flex items-center gap-2"><span className="inline-block w-4 h-4 rounded bg-gray-800 border border-white"></span> Gruppo chiuso</div>
              </div>
            </div>
            <a href="/gruppi" className="mt-8 bg-primary hover:bg-secondary text-background font-bold rounded-lg px-6 py-3 shadow transition text-lg self-center">Vai alle attività</a>
          </div>
          {/* Card Visualizzazione pubblica gruppi */}
          <div className="flex-1 max-w-xl bg-card rounded-xl shadow p-6 mb-8 border border-border flex flex-col">
            <h2 className="text-xl font-bold text-secondary mb-2">Pagina pubblica gruppi</h2>
            <p className="text-base text-foreground mb-4">
              Qui puoi:
              <ul className="list-disc ml-6 mt-2 text-muted-foreground">
                <li>Vedere i gruppi in corso e in attesa per ogni evento</li>
                <li>Visualizzare la stima di attesa per ogni gruppo</li>
                <li>Filtrare per evento</li>
                <li>Vedere lo staff assegnato</li>
              </ul>
            </p>
            <div className="mt-6">
              <h3 className="font-semibold text-primary mb-2">Legenda:</h3>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center gap-2"><span className="inline-block w-4 h-4 rounded-full bg-gray-900 border-4 border-yellow-400"></span> Gruppo in corso</div>
                <div className="flex items-center gap-2"><span className="inline-block w-4 h-4 rounded-full bg-white border-4 border-white"></span> Gruppo in attesa</div>
              </div>
            </div>
            <a href="/public-page" className="mt-8 bg-primary hover:bg-secondary text-background font-bold rounded-lg px-6 py-3 shadow transition text-lg self-center">Vai alla pagina pubblica</a>
          </div>
        </div>
      </div>
    </>
  );
}

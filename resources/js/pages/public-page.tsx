import React, { useEffect, useState } from 'react';
import axios from 'axios';
import MenuBar from '../components/MenuBar';
import { Listbox } from '@headlessui/react';
import { ChevronUpDownIcon } from '@heroicons/react/24/solid';

// Tipi base
interface StaffType {
  id: number;
  full_name: string;
}
interface GroupType {
  id: number;
  group_name: string;
  number_of_people: number;
  is_waiting: boolean;
  is_closed: boolean;
  created_at: string;
  staff?: StaffType;
  // ...altre info se servono
}

// Funzione per stimare l'attesa in modo dinamico in base alle configurazioni
function getQueueWaitEstimate(
  indexInQueue: number,
  gruppiContemporanei: number,
  durataMedia: number
): { min: number; label: string } {
  const slots = Math.max(1, gruppiContemporanei);
  const turns = Math.floor(indexInQueue / slots);
  const min = (turns + 1) * durataMedia;
  let label = '';
  if (min <= durataMedia * 2) label = 'Poco';
  else if (min <= durataMedia * 3) label = 'Nella media';
  else if (min <= durataMedia * 6) label = 'Tanto';
  else label = 'Molto';
  return { min, label };
}


const PublicGroupsPage: React.FC = () => {
  const [groups, setGroups] = useState<GroupType[]>([]);
  const [loading, setLoading] = useState(true); // loading solo per primo caricamento evento
  const [events, setEvents] = useState<{id: number; event_name: string}[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null);
  // Stato per configurazione
  const [config, setConfig] = useState<{ gruppi_contemporanei_possibili: number; durata_media_gruppo: number } | null>(null);

  useEffect(() => {
    axios.get('/api/events/featured').then(res => setEvents(Array.isArray(res.data) ? res.data : []));
    // Carica configurazione
    axios.get('/api/configurazione').then(res => {
      // Si assume che la risposta sia un oggetto { chiave: valore }
      setConfig({
        gruppi_contemporanei_possibili: Number(res.data.gruppi_contemporanei_possibili) || 3,
        durata_media_gruppo: Number(res.data.durata_media_gruppo) || 10,
      });
    });
  }, []);

  // Polling automatico ogni 7 secondi
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    let firstLoad = true;
    const fetchGroups = () => {
      if (selectedEvent === null) {
        setGroups([]);
        setLoading(false);
        return;
      }
      if (firstLoad) {
        setLoading(true);
      }
      axios.get(`/api/public/groups/${selectedEvent}`).then(res => {
        setGroups(res.data);
      }).finally(() => {
        if (firstLoad) {
          setLoading(false);
          firstLoad = false;
        }
      });
    };
    fetchGroups();
    interval = setInterval(() => {
      firstLoad = false;
      fetchGroups();
    }, 7000);
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selectedEvent]);

  // Mostra solo gruppi non chiusi
  const visibleGroups = groups.filter(g => !g.is_closed);
  // Gruppi in corso (non chiusi, non in attesa)
  const inProgress = visibleGroups.filter(g => !g.is_waiting);
  // Gruppi in attesa (non chiusi)
  const waiting = visibleGroups.filter(g => g.is_waiting);
  // Ordina entrambi dal più vecchio al più recente
  inProgress.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  waiting.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  return (
    <>
      <MenuBar />
  <div className="max-w-4xl mx-auto p-4 min-h-screen" style={{ minHeight: '100vh' }}>
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-2xl font-bold text-primary">Attività in arena</h1>
          <div className="w-full md:w-80">
            <Listbox value={selectedEvent} onChange={setSelectedEvent}>
              <div className="relative mt-1">
                <Listbox.Button className="w-full cursor-pointer rounded-lg bg-background border border-border py-2 pl-3 pr-10 text-left shadow-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground transition">
                  <span className={selectedEvent === null ? 'block truncate text-muted-foreground italic' : 'block truncate'}>
                    {selectedEvent === null
                      ? 'Seleziona evento'
                      : events.find(e => e.id === selectedEvent)?.event_name}
                  </span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronUpDownIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                  </span>
                </Listbox.Button>
                <Listbox.Options className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-card py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm border border-border">
                  <Listbox.Option value={null} className={({ active }) => (active ? 'bg-primary/10 text-primary' : 'text-foreground') + ' cursor-pointer select-none py-2 pl-10 pr-4'}>
                    Tutti gli eventi
                  </Listbox.Option>
                  {events.map(ev => (
                    <Listbox.Option
                      key={ev.id}
                      value={ev.id}
                      className={({ active, selected }) =>
                        [
                          'relative cursor-pointer select-none py-2 pl-10 pr-4 transition',
                          active ? 'bg-primary/10 text-primary' : 'text-foreground',
                          selected ? 'font-bold text-primary' : '',
                        ].join(' ')
                      }
                    >
                      {ev.event_name}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </div>
            </Listbox>
          </div>
        </div>
        {selectedEvent === null ? (
          <div className="p-8 text-center text-muted-foreground italic">Seleziona l'evento</div>
        ) : loading || !config ? (
          <div className="p-8 text-center">Caricamento...</div>
        ) : (
          <>
            {/* Nessun spinner di aggiornamento dati in background */}
            <h2 className="text-xl font-bold text-center mb-6">Gruppi in corso</h2>
            <div className="flex flex-wrap gap-4 justify-center mb-10 min-h-[250px] md:min-h-[300px] lg:min-h-[350px]">
              {inProgress.length === 0 ? (
                <div className="text-muted-foreground italic">Nessun gruppo in corso</div>
              ) : (
                inProgress.map(group => (
                  <div
                    key={group.id}
                    className="bg-gray-900 border-4 border-yellow-400 rounded-xl p-2 w-[180px] md:w-[200px] shadow flex flex-col items-center justify-center text-center"
                    style={{ minHeight: '260px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
                  >
                    <img
                      src="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExeHIwZmVyMzBtOXh2dWk4dnNsbHRibzFtZHF5cTJoenhvOWFpZnpsZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/5zvSHSsC1WkiLm3aM0/giphy.gif"
                      alt="Spade laser che combattono"
                      className="w-24 h-24 object-cover rounded-full border-2 border-yellow-300 mb-3 bg-white"
                      style={{ margin: '0 auto' }}
                    />
                    <div className="font-bold text-base text-yellow-300 mt-1 w-full" title={group.group_name}>{group.group_name}</div>
                    <div className="text-xs text-yellow-200">Persone: {group.number_of_people}</div>
                    {group.staff && <div className="text-xs text-yellow-100 mt-1">Staff: {group.staff.full_name}</div>}
                  </div>
                ))
              )}
            </div>
            <h2 className="text-xl font-bold mb-4">Gruppi in attesa</h2>
            <div className="flex flex-wrap gap-4 justify-center min-h-[120px]">
              {waiting.length === 0 ? (
                <div className="text-muted-foreground italic">Nessun gruppo in attesa</div>
              ) : (
                waiting.map((group, idx) => {
                  // Calcola la posizione in coda (idx) e la stima usando i parametri da configurazione
                  const { min, label } = getQueueWaitEstimate(
                    idx,
                    config.gruppi_contemporanei_possibili,
                    config.durata_media_gruppo
                  );
                  return (
                    <div
                      key={group.id}
                      className="bg-white border-4 border-yellow-400 rounded-xl p-2 w-[180px] md:w-[200px] shadow flex flex-col items-center justify-center text-center"
                      style={{ minHeight: '260px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
                    >
                      <div className="w-24 h-24 rounded-full border-2 border-yellow-300 mb-3 bg-gray-100 flex items-center justify-center mx-auto" style={{ background: '#f3f4f6' }}>
                         <img
                            src="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExMmhwcW5wY2g4cjY1NGMyaWthc2xsanVzN3hnbjFwMTZ3aThzcmtwMyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/mP47tgdWChow8/giphy.gif"
                            alt="Spade laser che Aspettano"
                            className="w-24 h-24 object-cover rounded-full border-2 border-yellow-300 mb-3 bg-white"
                            style={{ margin: '0 auto' }}
                        />
                      </div>
                      <div className="font-bold text-base text-yellow-900 mt-1 w-full" title={group.group_name}>{group.group_name}</div>
                      <div className="text-xs text-yellow-800">Persone: {group.number_of_people}</div>
                      <div className="text-xs text-yellow-700 mt-1">
                        Attesa stimata: <span className="font-semibold">{label}</span>
                      </div>
                      {group.staff && <div className="text-xs text-yellow-700 mt-1">Staff: {group.staff.full_name}</div>}
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default PublicGroupsPage;

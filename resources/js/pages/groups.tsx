import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PlusIcon, CheckIcon, ChevronUpDownIcon } from '@heroicons/react/24/solid';
import { Listbox } from '@headlessui/react';
import MenuBar from '../components/MenuBar';

type StaffType = {
  id: number;
  full_name: string;
  is_available: boolean | string | number;
};

type GroupType = {
  id: number;
  group_name: string;
  number_of_people: number;
  is_waiting: boolean;
  is_closed: boolean;
  description?: string;
  date: string;
  activity_duration: number | null;
  is_friend: boolean;
  is_kid?: boolean;
  staff_id: number | null;
  staff?: StaffType;
  created_at?: string;
  updated_at?: string;
};

// Componente timer per gruppo con doppia modalità
const GroupTimer: React.FC<{ group: GroupType }> = ({ group }) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (group.is_waiting) {
    // Timer crescente da created_at
    const start = new Date(group.created_at!).getTime();
    const elapsed = now - start;
    const min = Math.floor(elapsed / 60000);
    const sec = Math.floor((elapsed % 60000) / 1000);
    return <span className="text-yellow-600 font-bold">Sta aspettando da {min}:{sec.toString().padStart(2, '0')}</span>;
  } else {
    // Timer countdown da updated_at
    if (!group.activity_duration || !group.updated_at) return null;
    const start = new Date(group.updated_at).getTime();
    const durationMs = group.activity_duration * 60 * 1000;
    const elapsed = now - start;
    const isExpired = elapsed > durationMs;
    const remaining = Math.max(0, durationMs - elapsed);
    const min = Math.floor(remaining / 60000);
    const sec = Math.floor((remaining % 60000) / 1000);
    return isExpired ? (
      <span className="text-red-600 font-bold">Da chiamare</span>
    ) : (
      <span className="text-primary font-semibold">{min}:{sec.toString().padStart(2, '0')}</span>
    );
  }
};

// Stato configurazione globale
const DEFAULT_DURATION = 5;


const GroupManager: React.FC<{ eventId: number }> = ({ eventId }) => {
  const [groups, setGroups] = useState<GroupType[]>([]);
  const [staffList, setStaffList] = useState<StaffType[]>([]); // Tutto lo staff (usato per selezione gruppi)
  const [eventStaffList, setEventStaffList] = useState<StaffType[]>([]); // Solo staff evento (anche non disponibili)
  const [eventStaffIds, setEventStaffIds] = useState<number[]>([]);
  const [closedGroups, setClosedGroups] = useState<GroupType[]>([]);
  const [showClosed, setShowClosed] = useState(false);
  const [eventInfo, setEventInfo] = useState<{
    event_name: string;
    event_start_date?: string;
    event_end_date?: string;
  } | null>(null);
  // Stato configurazione globale
  const [config, setConfig] = useState<{ durata_media_gruppo?: number; gruppi_contemporanei_possibili?: number } | null>(null);
  // Imposta la data di default a oggi (YYYY-MM-DD)
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const defaultDate = `${yyyy}-${mm}-${dd}`;
  // Form state, activity_duration predefinito da config
  const [form, setForm] = useState({
    group_name: '',
    number_of_people: 1,
    description: '',
    date: defaultDate,
    activity_duration: undefined as number | undefined,
    is_friend: false,
    is_kid: false,
    staff_id: null as number | null,
  });
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eventClosed, setEventClosed] = useState(false);
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    fetchGroups();
    axios.get(`/api/groups/closed`, { params: { event_id: eventId }, withCredentials: true }).then(res => setClosedGroups(res.data));
    // Recupera info evento e staff associato (solo per info evento)
    axios.get(`/api/events/${eventId}`, { withCredentials: true }).then(res => {
      const eventStaff = res.data.staff || [];
      setEventStaffIds(eventStaff.map((s: any) => s.id));
      setEventInfo({
        event_name: res.data.event_name,
        event_start_date: res.data.event_start_date,
        event_end_date: res.data.event_end_date,
      });
      // Calcola se evento è terminato
      if (res.data.event_start_date && res.data.event_end_date) {
        const today = new Date();
        today.setHours(0,0,0,0);
        const end = new Date(res.data.event_end_date);
        end.setHours(0,0,0,0);
        const start = new Date(res.data.event_start_date);
        start.setHours(0,0,0,0);
        const diff = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        const totalDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        setEventClosed(diff >= totalDays);
      } else {
        setEventClosed(false);
      }
    });
    // Recupera staff dell'evento (anche non disponibili) SOLO per la tabella staff evento
    axios.get(`/api/events/${eventId}/staff`, { withCredentials: true }).then(res => setEventStaffList(res.data));
    // Recupera tutti gli staff (per selezione gruppi)
    axios.get('/api/staff', { withCredentials: true }).then(res => setStaffList(res.data));
    // Recupera configurazione globale
    axios.get('/api/configurazione', { withCredentials: true }).then(res => {
      setConfig({
        durata_media_gruppo: Number(res.data.durata_media_gruppo) || undefined,
        gruppi_contemporanei_possibili: Number(res.data.gruppi_contemporanei_possibili) || undefined,
      });
      // Se non è stato ancora impostato un valore di durata, usalo come default
      setForm(f => ({ ...f, activity_duration: f.activity_duration ?? (Number(res.data.durata_media_gruppo) || DEFAULT_DURATION) }));
    });
  }, [eventId]);

  function fetchGroups() {
    axios.get('/api/groups', { params: { event_id: eventId }, withCredentials: true }).then(res => setGroups(res.data));
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.type === 'number' ? Number(e.target.value) : e.target.value });
  }
  function handleIsKidChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(f => ({ ...f, is_kid: e.target.checked }));
  }

  function handleStaffChange(selected: number | null) {
    setForm({ ...form, staff_id: selected });
  }

  function handleIsFriendChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(f => ({
      ...f,
      is_friend: e.target.checked,
      activity_duration: e.target.checked ? (null as unknown as number) : DEFAULT_DURATION
    }));
  }

  function handleDurationChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(f => ({ ...f, activity_duration: Number(e.target.value) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (eventClosed) {
      setError('Impossibile creare un gruppo: l\'evento è chiuso/terminato.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        activity_duration: form.is_friend ? null : form.activity_duration,
        event_id: eventId,
      };
      await axios.post('/api/groups', payload, { withCredentials: true });
      setShowForm(false);
      setForm({
        group_name: '',
        number_of_people: 1,
        description: '',
        date: defaultDate,
        activity_duration: DEFAULT_DURATION,
        is_friend: false,
        is_kid: false,
        staff_id: null,
      });
      fetchGroups();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        console.log(err.response);
        setError(err.response?.data?.messages?.join(', ') || 'Errore nella creazione');
      } else {
        setError('Errore nella creazione');
      }
    } finally {
      setLoading(false);
    }
  }

  // Separa gruppi in attesa e in corso
  const waitingGroups = groups.filter(g => g.is_waiting && !g.is_closed);
  const activeGroups = groups.filter(g => !g.is_waiting && !g.is_closed);

  return (
    <div className="bg-card p-4 md:p-8 rounded-2xl shadow-lg border border-border w-full max-w-6xl mx-auto mt-8" style={{ minWidth: '80vw' }}>
      {/* Card evento in alto */}
      {eventInfo && (
        <div className="mb-6 bg-primary/10 border border-primary rounded-xl px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="font-bold text-primary text-lg">{eventInfo.event_name}</span>
            {eventInfo.event_start_date && (
              <span className="text-sm text-primary/80">{new Date(eventInfo.event_start_date).toLocaleDateString()}</span>
            )}
            {eventInfo.event_end_date && eventInfo.event_end_date !== eventInfo.event_start_date && (
              <span className="text-sm text-primary/80">- {new Date(eventInfo.event_end_date).toLocaleDateString()}</span>
            )}
          </div>
          {/* Giorno corrente */}
          {eventInfo.event_start_date && (
            <span className="text-sm font-semibold text-primary/90 bg-primary/20 rounded px-3 py-1">
              {(() => {
                // Normalizza tutte le date a mezzanotte locale
                const today = new Date();
                today.setHours(0,0,0,0);
                const start = new Date(eventInfo.event_start_date);
                start.setHours(0,0,0,0);
                const end = eventInfo.event_end_date ? new Date(eventInfo.event_end_date) : new Date(start);
                end.setHours(0,0,0,0);
                const diff = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                const totalDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                if (diff < 0) return `Evento non iniziato`;
                if (diff >= totalDays) return `Evento terminato`;
                // Forza giorno minimo a 1
                return `Giorno ${Math.max(1, diff + 1)} di ${totalDays}`;
              })()}
            </span>
          )}
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-extrabold text-primary">Gestione Gruppi</h2>
        <button className="bg-primary hover:bg-secondary text-background px-3 py-2 rounded-lg font-bold flex items-center gap-2 shadow transition" onClick={() => setShowForm(f => !f)}>
          <PlusIcon className="w-5 h-5" />
          {showForm ? 'Annulla' : 'Aggiungi gruppo'}
        </button>
      </div>
      {/* Sezione staff evento */}
      {eventStaffList.length > 0 && (
        <div className="mb-8 bg-card border border-border rounded-xl p-4">
          <h3 className="font-bold text-primary mb-2">Staff dell'evento</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground">
                <th className="text-left p-2">Nome</th>
                <th className="text-left p-2">Disponibile</th>
                <th className="text-left p-2">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {eventStaffList.map(staff => (
                <tr key={staff.id} className="border-b border-border last:border-0">
                  <td className="p-2 font-medium">{staff.full_name}</td>
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={staff.is_available === true || staff.is_available === '1' || staff.is_available === 1}
                      onChange={async e => {
                        await axios.put(`/api/staff/${staff.id}`, { is_available: e.target.checked ? 1 : 0 }, { withCredentials: true });
                        // Aggiorna solo la lista staff evento
                        axios.get(`/api/events/${eventId}/staff`, { withCredentials: true }).then(res => setEventStaffList(res.data));
                      }}
                    />
                  </td>
                  <td className="p-2">
                    {(!staff.is_available || staff.is_available === '0' || staff.is_available === 0) &&  (
                      <span className="text-xs text-red-600 font-semibold">Non selezionabile</span>
                    )}
                    {(staff.is_available === true || staff.is_available === '1' || staff.is_available === 1) && (
                      <span className="text-xs text-green-600 font-semibold">Selezionabile</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-card rounded-xl p-6 mb-8 shadow border border-border flex flex-col gap-4">
          {error && <div className="text-red-500 mb-2">{error}</div>}
          {eventClosed && (
            <div className="text-red-600 font-bold mb-2">Attenzione: l'evento è terminato. Non è possibile aggiungere nuovi gruppi.</div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nomi</label>
              <textarea name="group_name" value={form.group_name} onChange={handleChange} required className="block w-full border border-border bg-background text-foreground rounded-lg p-2 focus:ring-2 focus:ring-secondary focus:outline-none placeholder-muted-foreground" placeholder="Nomi" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Numero persone</label>
              <input type="number" name="number_of_people" value={form.number_of_people} min={1} onChange={handleChange} required className="block w-full border border-border bg-background text-foreground rounded-lg p-2 focus:ring-2 focus:ring-secondary focus:outline-none placeholder-muted-foreground" placeholder="Numero persone" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Note</label>
              <textarea name="description" value={form.description} onChange={handleChange} className="block w-full border border-border bg-background text-foreground rounded-lg p-2 focus:ring-2 focus:ring-secondary focus:outline-none placeholder-muted-foreground" placeholder="Note" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Data</label>
              <input type="date" name="date" value={form.date} onChange={handleChange} required className="block w-full border border-border bg-background text-foreground rounded-lg p-2 focus:ring-2 focus:ring-secondary focus:outline-none placeholder-muted-foreground" />
            </div>
            <div className="flex items-center gap-6 md:col-span-2">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isFriend" checked={form.is_friend} onChange={handleIsFriendChange} />
                <label htmlFor="isFriend" className="text-sm">Amico (durata indefinita)</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isKid" checked={form.is_kid} onChange={handleIsKidChange} />
                <label htmlFor="isKid" className="text-sm">Gruppo di bambini</label>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Durata attività (minuti)
                {config?.durata_media_gruppo && (
                  <span className="ml-2 text-xs text-muted-foreground">(suggerito: {config.durata_media_gruppo} min)</span>
                )}
              </label>
              <input type="range" min={5} max={30} step={5} value={form.activity_duration ?? (config?.durata_media_gruppo ?? DEFAULT_DURATION)} onChange={handleDurationChange} disabled={form.is_friend} className="w-full" />
              <div className="text-xs text-gray-600 mt-1">
                {form.is_friend ? 'Indefinita' : `${form.activity_duration ?? (config?.durata_media_gruppo ?? DEFAULT_DURATION)} minuti`}
                {config?.durata_media_gruppo && (
                  <span className="ml-2 text-muted-foreground">(configurazione globale)</span>
                )}
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Staff associato</label>
              <Listbox value={form.staff_id} onChange={handleStaffChange} multiple={false}>
                <div className="relative mt-1">
                  <Listbox.Button className="w-full cursor-pointer rounded-lg bg-background border border-border py-2 pl-3 pr-10 text-left shadow-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground transition">
                    <span className={form.staff_id === null ? 'block truncate text-muted-foreground italic' : 'block truncate'}>
                      {form.staff_id === null
                        ? 'Seleziona staff'
                        : staffList.find(s => s.id === form.staff_id)?.full_name}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <ChevronUpDownIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                    </span>
                  </Listbox.Button>
                  <Listbox.Options className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-card py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm border border-border">
                    {staffList.filter(staff => eventStaffIds.includes(staff.id)).map((staff) => (
                      <Listbox.Option
                        key={staff.id}
                        value={staff.id}
                        disabled={!staff.is_available || staff.is_available === '0' || staff.is_available === 0}
                        className={({ active, selected, disabled }) =>
                          [
                            'relative select-none py-2 pl-10 pr-4 transition',
                            active ? 'bg-primary/10 text-primary' : 'text-foreground',
                            selected ? 'font-bold text-primary' : '',
                            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
                          ].join(' ')
                        }
                      >
                        {({ selected, disabled }) => (
                          <>
                            <span className={`block truncate ${selected ? 'font-bold' : ''}`}>{staff.full_name}</span>

                            {selected && !disabled ? (
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary">
                                <CheckIcon className="h-5 w-5" aria-hidden="true" />
                              </span>
                            ) : null}
                          </>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </div>
              </Listbox>
              <span className="text-xs text-muted-foreground mt-1">Seleziona solo un membro dello staff presente nell'evento</span>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button type="submit" className="bg-secondary hover:bg-primary text-background rounded-lg p-2 font-bold transition" disabled={loading}>{loading ? 'Salvataggio...' : 'Crea gruppo'}</button>
          </div>
        </form>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Gruppi in attesa */}
        <div>
          <h3 className="text-lg font-bold text-yellow-700 mb-4">Gruppi in attesa</h3>
          {waitingGroups.length === 0 ? (
            <div className="text-muted-foreground italic">Nessun gruppo in attesa</div>
          ) : (
            <ul className="space-y-4">
              {waitingGroups.map(group => (
                <GroupListItem
                  key={group.id}
                  group={group}
                  staffList={staffList}
                  eventStaffIds={eventStaffIds}
                  fetchGroups={fetchGroups}
                  fetchClosedGroups={() => axios.get(`/api/groups/closed`, { params: { event_id: eventId }, withCredentials: true }).then(res => setClosedGroups(res.data))}
                  eventId={eventId}
                  eventInfo={eventInfo}
                />
              ))}
            </ul>
          )}
        </div>
        {/* Gruppi in corso */}
        <div>
          <h3 className="text-lg font-bold text-green-700 mb-4">Gruppi in corso</h3>
          {activeGroups.length === 0 ? (
            <div className="text-muted-foreground italic">Nessun gruppo in corso</div>
          ) : (
            <ul className="space-y-4">
              {activeGroups.map(group => (
                <GroupListItem
                  key={group.id}
                  group={group}
                  staffList={staffList}
                  eventStaffIds={eventStaffIds}
                  fetchGroups={fetchGroups}
                  fetchClosedGroups={() => axios.get(`/api/groups/closed`, { params: { event_id: eventId }, withCredentials: true }).then(res => setClosedGroups(res.data))}
                  eventId={eventId}
                  eventInfo={eventInfo}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
      {/* Accordion gruppi chiusi */}
      <div className="mt-8">
        <button
          className="w-full flex items-center justify-between bg-gray-800 hover:bg-gray-900 border border-white rounded-lg px-4 py-3 text-lg font-semibold text-white transition shadow mb-2"
          onClick={() => setShowClosed(v => !v)}
        >
          <span>Gruppi chiusi</span>
          <span className="text-xs text-gray-300 ml-2">Totale persone: {closedGroups.reduce((sum, g) => sum + (g.number_of_people || 0), 0)}</span>
          <span className="ml-2">{showClosed ? '▲' : '▼'}</span>
        </button>
        {showClosed && (
          <ul className="space-y-4">
            {closedGroups.length === 0 ? (
              <li className="text-muted-foreground italic">Nessun gruppo chiuso</li>
            ) : (
              closedGroups.map(group => (
                <li key={group.id} className="bg-gray-800 rounded-xl p-4 shadow border border-white opacity-95">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                      <div className="font-bold text-white text-lg">{group.group_name}</div>
                      <div className="text-sm text-gray-300">{group.description}</div>
                      <div className="text-xs text-gray-400 mt-1">{new Date(group.date).toLocaleDateString()}</div>
                      <div className="text-xs text-gray-400 mt-1">Persone: {group.number_of_people}</div>
                      {/* Giorno relativo all'evento (normalizza a mezzanotte) */}
                      {eventInfo?.event_start_date && (
                        <div className="text-xs text-primary mt-1">
                          {(() => {
                            const groupDate = new Date(group.date);
                            groupDate.setHours(0,0,0,0);
                            const start = new Date(eventInfo.event_start_date!);
                            start.setHours(0,0,0,0);
                            const end = eventInfo.event_end_date ? new Date(eventInfo.event_end_date) : new Date(start);
                            end.setHours(0,0,0,0);
                            const diff = Math.floor((groupDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                            const totalDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                            if (diff < 0) return `Prima dell'evento`;
                            if (diff >= totalDays) return `Dopo l'evento`;
                            // Forza giorno minimo a 1
                            return `Giorno ${Math.max(1, diff + 1)} di ${totalDays}`;
                          })()}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 items-end min-w-[160px]">
                      <div className="text-xs font-semibold text-white">Staff associato:</div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {group.staff ? (
                          <span className="bg-primary/20 text-primary px-2 py-1 rounded text-xs font-semibold">{group.staff.full_name}</span>
                        ) : (
                          <span className="text-gray-400 italic">Nessuno</span>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  );
};


// Pagina principale: selezione evento o gestione gruppi
const GroupsPage: React.FC = () => {
  const location = typeof window !== 'undefined' ? window.location : { search: '' };
  const params = new URLSearchParams(location.search);
  const eventId = params.get('event_id');
  type EventType = { id: number; event_name: string; event_start_date: string; event_end_date: string };
  const [featuredEvents, setFeaturedEvents] = useState<EventType[]>([]);
  useEffect(() => {
    if (!eventId) {
      axios.get('/api/events/featured', { withCredentials: true }).then(res => setFeaturedEvents(Array.isArray(res.data) ? res.data : []));
    }
  }, [eventId]);

  if (!eventId) {
    return (
      <div className="min-h-screen bg-background">
        <MenuBar />
        <div className="max-w-xl mx-auto mt-16 bg-card rounded-2xl shadow-lg border border-border p-8">
          <h1 className="text-2xl font-extrabold text-primary mb-6 text-center">Seleziona un evento</h1>
          <ul className="space-y-4">
            {featuredEvents.length > 0 ? (
              featuredEvents.map(ev => (
                <li key={ev.id}>
                  <button
                    className="w-full flex items-center justify-between bg-primary/10 hover:bg-primary/20 border border-primary rounded-lg px-4 py-3 text-lg font-semibold text-primary transition shadow"
                    onClick={() => { window.location.href = `/gruppi?event_id=${ev.id}`; }}
                  >
                    <span>{ev.event_name}</span>
                    <span className="text-xs text-muted-foreground ml-2">{new Date(ev.event_start_date).toLocaleDateString()} - {new Date(ev.event_end_date).toLocaleDateString()}</span>
                    <ChevronUpDownIcon className="w-5 h-5 ml-4" />
                  </button>
                </li>
              ))
            ) : (
              <li className="text-muted-foreground italic">Nessun evento disponibile</li>
            )}
          </ul>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background">
      <MenuBar />
      <GroupManager eventId={parseInt(eventId as string, 10)} />
    </div>
  );
};

export default GroupsPage;

// Componente per la gestione di un singolo gruppo (edit, toggle, timer)
const GroupListItem: React.FC<{
  group: GroupType;
  staffList: StaffType[];
  eventStaffIds: number[];
  fetchGroups: () => void;
  fetchClosedGroups: () => void;
  eventId: number;
  eventInfo?: { event_start_date?: string; event_end_date?: string } | null;
}> = ({ group, staffList, eventStaffIds, fetchGroups, fetchClosedGroups, eventId, eventInfo }) => {
  const showTimer = !group.is_friend && group.activity_duration && group.created_at;
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    group_name: group.group_name,
    number_of_people: group.number_of_people,
    description: group.description || '',
    date: group.date,
    activity_duration: group.activity_duration || DEFAULT_DURATION,
    is_friend: group.is_friend,
    is_kid: group.is_kid ?? false,
    staff_id: group.staff_id,
  });
  function handleEditIsKidChange(e: React.ChangeEvent<HTMLInputElement>) {
    setEditForm(f => ({ ...f, is_kid: e.target.checked }));
  }
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  async function handleWaitingToggle() {
    if (group.is_waiting && !group.staff_id) {
      alert('Devi assegnare uno staff prima di attivare il gruppo!');
      return;
    }
    await axios.put(`/api/groups/${group.id}`, { is_waiting: !group.is_waiting}, { withCredentials: true });
    fetchGroups();
  }

  async function handleCloseToggle() {
    await axios.put(`/api/groups/${group.id}`, { is_closed: !group.is_closed, event_id: eventId }, { withCredentials: true });
    fetchGroups();
    fetchClosedGroups();
  }

  function handleEditChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setEditForm({ ...editForm, [e.target.name]: e.target.type === 'number' ? Number(e.target.value) : e.target.value });
  }
  function handleEditStaffChange(selected: number | null) {
    setEditForm({ ...editForm, staff_id: selected });
  }
  function handleEditIsFriendChange(e: React.ChangeEvent<HTMLInputElement>) {
    setEditForm(f => ({
      ...f,
      is_friend: e.target.checked,
      activity_duration: e.target.checked ? (null as unknown as number) : DEFAULT_DURATION
    }));
  }
  function handleEditDurationChange(e: React.ChangeEvent<HTMLInputElement>) {
    setEditForm(f => ({ ...f, activity_duration: Number(e.target.value) }));
  }
  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEditLoading(true);
    setEditError(null);
    try {
      await axios.put(`/api/groups/${group.id}`, {
        ...editForm,
        activity_duration: editForm.is_friend ? null : editForm.activity_duration,
      }, { withCredentials: true });
      setEditMode(false);
      fetchGroups();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setEditError(err.response?.data?.messages?.join(', ') || 'Errore nel salvataggio');
      } else {
        setEditError('Errore nel salvataggio');
      }
    } finally {
      setEditLoading(false);
    }
  }

  // Calcolo stato e classi bordo
  let borderClass = 'border-border';
  const bgClass = 'bg-card';
  // Gruppo "da chiamare" (scaduto)
  const isExpired = !group.is_friend && group.activity_duration && group.updated_at && (() => {
    const start = new Date(group.updated_at).getTime();
    const durationMs = group.activity_duration * 60 * 1000;
    const elapsed = Date.now() - start;
    return elapsed > durationMs;
  })();
  // Gruppo in attesa da 30+ minuti
  let isLongWaiting = false;
  if (group.is_waiting && group.created_at) {
    const start = new Date(group.created_at).getTime();
    const elapsed = Date.now() - start;
    isLongWaiting = elapsed >= 30 * 60 * 1000;
  }
  if (isExpired) {
    borderClass = 'border-red-600';
  } else if (isLongWaiting) {
    borderClass = 'border-orange-500';
  } else if (group.is_waiting) {
    borderClass = 'border-white';
  } else {
    borderClass = 'border-yellow-400';
  }
  return (
    <li className={`${bgClass} rounded-xl p-4 shadow border-4 ${borderClass}`}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div className="flex-1">
          {editMode ? (
            <form onSubmit={handleEditSubmit} className="flex flex-col gap-2">
              {editError && <div className="text-red-500 mb-2">{editError}</div>}
              <input type="text" name="group_name" value={editForm.group_name} onChange={handleEditChange} required className="block w-full border border-border bg-background text-foreground rounded-lg p-2 focus:ring-2 focus:ring-secondary focus:outline-none placeholder-muted-foreground mb-1" placeholder="Nomi " />
              <input type="number" name="number_of_people" value={editForm.number_of_people} min={1} onChange={handleEditChange} required className="block w-full border border-border bg-background text-foreground rounded-lg p-2 focus:ring-2 focus:ring-secondary focus:outline-none placeholder-muted-foreground mb-1" placeholder="Numero persone" />
              <textarea name="description" value={editForm.description} onChange={handleEditChange} className="block w-full border border-border bg-background text-foreground rounded-lg p-2 focus:ring-2 focus:ring-secondary focus:outline-none placeholder-muted-foreground mb-1" placeholder="Descrizione" />
              <input type="date" name="date" value={editForm.date} onChange={handleEditChange} required className="block w-full border border-border bg-background text-foreground rounded-lg p-2 focus:ring-2 focus:ring-secondary focus:outline-none placeholder-muted-foreground mb-1" />
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id={`isFriend-edit-${group.id}`} checked={editForm.is_friend} onChange={handleEditIsFriendChange} />
                  <label htmlFor={`isFriend-edit-${group.id}`} className="text-sm">Amico (durata indefinita)</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id={`isKid-edit-${group.id}`} checked={editForm.is_kid} onChange={handleEditIsKidChange} />
                  <label htmlFor={`isKid-edit-${group.id}`} className="text-sm">Gruppo di bambini</label>
                </div>
              </div>
              <input type="range" min={5} max={30} step={5} value={editForm.activity_duration ?? DEFAULT_DURATION} onChange={handleEditDurationChange} disabled={editForm.is_friend} className="w-full" />
              <div className="text-xs text-gray-600 mb-1">{editForm.is_friend ? 'Indefinita' : `${editForm.activity_duration} minuti`}</div>
              <Listbox value={editForm.staff_id} onChange={handleEditStaffChange} multiple={false}>
                <div className="relative mt-1">
                  <Listbox.Button className="w-full cursor-pointer rounded-lg bg-background border border-border py-2 pl-3 pr-10 text-left shadow-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground transition">
                    <span className={editForm.staff_id === null ? 'block truncate text-muted-foreground italic' : 'block truncate'}>
                      {editForm.staff_id === null
                        ? 'Seleziona staff'
                        : staffList.find(s => s.id === editForm.staff_id)?.full_name}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <ChevronUpDownIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                    </span>
                  </Listbox.Button>
                  <Listbox.Options className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-card py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm border border-border">
                    {staffList.filter(staff => eventStaffIds.includes(staff.id)).map((staff) => (
                      <Listbox.Option
                        key={staff.id}
                        value={staff.id}
                        disabled={!staff.is_available || staff.is_available === '0' || staff.is_available === 0}
                        className={({ active, selected, disabled }) =>
                          [
                            'relative select-none py-2 pl-10 pr-4 transition',
                            active ? 'bg-primary/10 text-primary' : 'text-foreground',
                            selected ? 'font-bold text-primary' : '',
                            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
                          ].join(' ')
                        }
                      >
                        {({ selected, disabled }) => (
                          <>
                            <span className={`block truncate ${selected ? 'font-bold' : ''}`}>{staff.full_name}</span>
                            {disabled && (
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-red-500 text-xs">Non selezionabile</span>
                            )}
                            {selected && !disabled ? (
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary">
                                <CheckIcon className="h-5 w-5" aria-hidden="true" />
                              </span>
                            ) : null}
                          </>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </div>
              </Listbox>
              <div className="flex gap-2 mt-2">
                <button type="submit" className="bg-secondary hover:bg-primary text-background rounded-lg p-2 font-bold transition" disabled={editLoading}>{editLoading ? 'Salvataggio...' : 'Salva'}</button>
                <button type="button" className="bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg p-2 font-bold transition" onClick={() => setEditMode(false)}>Annulla</button>
              </div>
            </form>
          ) : (
            <>
              <div className="font-bold text-foreground text-lg">{group.group_name}</div>
              <div className="text-sm text-muted-foreground">{group.description}</div>
              <div className="text-xs text-muted-foreground mt-1">{new Date(group.date).toLocaleDateString()}</div>
              <div className="text-xs text-muted-foreground mt-1">Durata: {group.is_friend ? 'Indefinita' : `${group.activity_duration} minuti`}</div>
              {/* Giorno relativo all'evento (normalizza a mezzanotte) */}
              {eventInfo?.event_start_date && (
                <div className="text-xs text-primary mt-1">
                  {(() => {
                    // Normalizza tutte le date a mezzanotte
                    const groupDate = new Date(group.date);
                    groupDate.setHours(0,0,0,0);
                    const start = new Date(eventInfo.event_start_date!);
                    start.setHours(0,0,0,0);
                    const end = eventInfo.event_end_date ? new Date(eventInfo.event_end_date) : new Date(start);
                    end.setHours(0,0,0,0);
                    const diff = Math.floor((groupDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                    const totalDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                    if (diff < 0) return `Prima dell'evento`;
                    if (diff >= totalDays) return `Dopo l'evento`;
                    // Forza giorno minimo a 1
                    return `Giorno ${Math.max(1, diff + 1)} di ${totalDays}`;
                  })()}
                </div>
              )}
              {showTimer && (
                <div className="text-xs mt-1">Timer: <GroupTimer group={group} /></div>
              )}
            </>
          )}
        </div>
        <div className="flex flex-col gap-1 items-end min-w-[160px]">
          <div className="text-xs font-semibold text-primary">Staff associato:</div>
          <div className="flex flex-wrap gap-2 mb-2">
            {group.staff ? (
              <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-semibold">{group.staff.full_name}</span>
            ) : (
              <span className="text-muted-foreground italic">Nessuno</span>
            )}
          </div>
          <button className={`rounded px-2 py-1 text-xs font-bold transition ${group.is_waiting ? 'bg-yellow-200 text-yellow-800 hover:bg-yellow-300' : 'bg-green-200 text-green-800 hover:bg-green-300'}`} onClick={handleWaitingToggle}>
            {group.is_waiting ? 'Attiva gruppo' : 'In attesa'}
          </button>
          <button className="mt-1 bg-blue-200 hover:bg-blue-300 text-blue-800 rounded px-2 py-1 text-xs font-bold transition" onClick={() => setEditMode(e => !e)}>
            {editMode ? 'Chiudi Modifica' : 'Modifica'}
          </button>
          <button className="mt-1 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded px-2 py-1 text-xs font-bold transition" onClick={handleCloseToggle}>
            {group.is_closed ? 'Riapri gruppo' : 'Chiudi gruppo'}
          </button>
        </div>
      </div>
    </li>
  );
};

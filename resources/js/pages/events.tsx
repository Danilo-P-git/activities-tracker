import React, { useState, useEffect } from 'react';
import MenuBar from '../components/MenuBar';
import axios from 'axios';
import { Dialog, Transition } from '@headlessui/react';
import { PlusIcon, CheckIcon, ChevronUpDownIcon, PencilSquareIcon } from '@heroicons/react/24/solid';
import { Listbox } from '@headlessui/react';

// AGGIUNGI: StaffType per supporto staff in modale e edit

type StaffPeriod = {
  added_at: string;
  removed_at?: string | null;
  deleted_at?: string | null;
};
type StaffType = {
  id: number;
  full_name: string;
  is_available?: string;
  is_busy?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  periods?: StaffPeriod[];
};

type EventType = {
  id: number;
  event_name: string;
  description: string;
  event_start_date: string;
  event_end_date: string;
  location: string;
  staff?: StaffType[];
};

// Card evento in evidenza
function FeaturedEventCard({ event, onClick }: { event: EventType; onClick: () => void }) {
  if (!event) return null;
  return (
    <div className="bg-primary/10 border-2 border-primary rounded-3xl shadow-2xl p-10 mb-10 flex flex-col md:flex-row items-center gap-10 cursor-pointer hover:shadow-3xl transition min-h-[220px]" onClick={onClick}>
      <div className="flex-1 min-w-0">
        <h2 className="text-3xl md:text-4xl font-extrabold text-primary mb-4 flex items-center gap-3"> In evidenza</h2>
        <h2 className="text-3xl md:text-4xl font-extrabold text-primary mb-4 flex items-center gap-3">
          <span className="inline-block w-6 h-6 bg-primary rounded-full"></span>
          {event.event_name}
        </h2>
        <div className="text-lg md:text-xl text-muted-foreground mb-4">{event.description}</div>
        <div className="flex flex-wrap gap-4 text-base md:text-lg items-center">
          <span className="bg-primary text-background px-3 py-1.5 rounded-lg font-bold text-lg">
            {new Date(event.event_start_date).toLocaleString()}<span className="mx-1">→</span>{new Date(event.event_end_date).toLocaleString()}
          </span>
          <span className="bg-card text-primary px-3 py-1.5 rounded-lg font-semibold border border-primary text-lg">{event.location}</span>
        </div>
      </div>
      <div className="flex-shrink-0 hidden md:block">
        <PencilSquareIcon className="w-16 h-16 text-primary opacity-30" />
      </div>
    </div>
  );
}

function EventInfoModal({ open, onClose, event, onEdit }: { open: boolean; onClose: () => void; event: EventType | null; onEdit: () => void }) {
  const [staff, setStaff] = useState<StaffType[]>([]);
  useEffect(() => {
    if (open && event?.id) {
      axios.get(`/api/events/${event.id}`).then(res => {
        setStaff(res.data.staff || []);
      });
    } else {
      setStaff([]);
    }
  }, [open, event]);
  if (!event) return null;
  return (
    <Transition show={open} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 bg-black/40 z-40" />
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
            leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="bg-card rounded-2xl p-8 w-full max-w-md shadow-xl relative border border-border">
              <button className="absolute top-3 right-3 text-muted-foreground hover:text-primary text-2xl" onClick={onClose}>&times;</button>
              <Dialog.Title className="text-2xl font-bold mb-4 text-primary">{event.event_name}</Dialog.Title>
              <div className="text-base text-muted-foreground mb-4">{event.description}</div>
              <div className="flex flex-col gap-2 text-sm mb-4">
                <span className="text-secondary font-semibold">Inizio: <span className="text-foreground">{new Date(event.event_start_date).toLocaleString()}</span></span>
                <span className="text-secondary font-semibold">Fine: <span className="text-foreground">{new Date(event.event_end_date).toLocaleString()}</span></span>
                <span className="text-secondary font-semibold">Luogo: <span className="text-foreground">{event.location}</span></span>
              </div>
              <div className="mb-4">
                <div className="font-bold text-primary mb-2">Staff che ha partecipato:</div>
                {staff.length === 0 ? (
                  <div className="text-muted-foreground italic">Nessuno staff assegnato</div>
                ) : (
                  <ul className="space-y-2">
                    {staff.map(s => (
                      <li key={s.id} className="">
                        <div className="font-semibold text-foreground mb-1">{s.full_name}</div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          {s.periods && s.periods.length > 0 ? (
                            s.periods.map((p, idx) => (
                              <span key={idx} className={
                                'inline-block rounded px-2 py-1 ' +
                                (p.removed_at || p.deleted_at
                                  ? 'bg-muted-foreground/10 text-muted-foreground border border-muted-foreground'
                                  : 'bg-primary/10 text-primary border border-primary')
                              }>
                                {new Date(p.added_at).toLocaleString()} - {p.removed_at ? new Date(p.removed_at).toLocaleString() : 'presente'}
                              </span>
                            ))
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {/*
                Bottone Modifica: visibile solo se la data di fine evento è futura.
                Decommenta la riga qui sotto per riattivare sempre il bottone.
                if (new Date(event.event_end_date) > new Date()) { ... }
              */}
              {new Date(event.event_end_date) > new Date() && (
                <button className="bg-primary hover:bg-secondary text-background rounded-lg p-2 font-bold transition w-full" onClick={onEdit}>Modifica</button>
              )}
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}

function EventCard({ event, onClick, isFeatured }: { event: EventType; onClick: () => void; isFeatured?: boolean }) {
  return (
    <div
      className={
        `bg-card rounded-2xl shadow-lg p-6 flex flex-col gap-3 border-2 hover:shadow-2xl transition-shadow duration-200 cursor-pointer min-h-[160px] w-full ` +
        (isFeatured ? 'border-white/90' : 'border-border')
      }
      onClick={onClick}
    >
      <h3 className="text-lg font-bold text-secondary flex items-center gap-3 truncate">
        <span className="inline-block w-3 h-3 bg-primary rounded-full"></span>
        {event.event_name}
      </h3>
      <p className="text-base text-muted-foreground italic truncate">{event.description}</p>
      <div className="flex flex-wrap gap-2 mt-2 items-center">
        <span className="bg-secondary/20 text-secondary px-2 py-1 rounded text-xs font-semibold">
          Inizio: {new Date(event.event_start_date).toLocaleString()}
        </span>
        <span className="bg-secondary/20 text-secondary px-2 py-1 rounded text-xs font-semibold">
          Fine: {new Date(event.event_end_date).toLocaleString()}
        </span>
        <span className="bg-primary/20 text-primary px-2 py-1 rounded text-xs font-semibold">{event.location}</span>
      </div>
    </div>
  );
}

type AddEventModalProps = {
  open: boolean;
  onClose: () => void;
  onAdd: (event: EventType) => void;
  event?: EventType;
  editMode?: boolean;
  staffOverride?: StaffType[];
};

function AddEventModal({ open, onClose, onAdd, event, editMode, staffOverride }: AddEventModalProps) {
  const [form, setForm] = useState({
    event_name: '',
    description: '',
    event_start_date: '',
    event_end_date: '',
    location: '',
    staff_ids: [] as number[],
  });
  const [error, setError] = useState<string | null>(null);
  const [staffList, setStaffList] = useState<StaffType[]>([]);

  // Precompila tutto il form solo su open/editMode/event
  useEffect(() => {
    if (open && editMode && event) {
      // Usa staffOverride se presente (dati freschi da GET /api/events/{id})
      const staffSource = staffOverride ?? event.staff;
      setForm({
        event_name: event.event_name || '',
        description: event.description || '',
        event_start_date: event.event_start_date ? event.event_start_date.slice(0, 16) : '',
        event_end_date: event.event_end_date ? event.event_end_date.slice(0, 16) : '',
        location: event.location || '',
        staff_ids: staffSource ? staffSource.filter(s => s.periods && s.periods.some(p => !p.removed_at && !p.deleted_at)).map(s => s.id) : [],
      });
    } else if (open && !editMode) {
      // Default: oggi alle 8 e oggi alle 20
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const today8 = `${yyyy}-${mm}-${dd}T08:00`;
      const today20 = `${yyyy}-${mm}-${dd}T20:00`;
      setForm({
        event_name: '',
        description: '',
        event_start_date: today8,
        event_end_date: today20,
        location: '',
        staff_ids: [],
      });
    }
  }, [open, editMode, event, staffOverride]);

  // Aggiorna solo staff_ids quando cambia staffList (dopo il caricamento), se già in editMode
  useEffect(() => {
    if (open && editMode && event && staffList.length > 0) {
      const staffSource = staffOverride ?? event.staff;
      const activeIds = staffSource ? staffSource.filter(s => s.periods && s.periods.some(p => !p.removed_at && !p.deleted_at)).map(s => s.id) : [];
      setForm(f => ({ ...f, staff_ids: activeIds }));
    }
  }, [staffList, open, editMode, event, staffOverride]);

  useEffect(() => {
    if (open) {
      axios.get('/api/staff').then(res => {
        setStaffList(res.data);
      });
    }
  }, [open]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleStaffChange(selected: number[]) {
    setForm({ ...form, staff_ids: selected });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    try {
      const payload = { ...form, staff_ids: form.staff_ids };
      let res;
      if (editMode && event) {
        res = await axios.put(`/api/events/${event.id}`, payload);
      } else {
        res = await axios.post('/api/events', payload);
      }
      onAdd(res.data);
      onClose();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message?.join(' ') || 'Errore generico');
      } else {
        setError('Errore generico');
      }
    }
  }

  return (
    <Transition show={open} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 pointer-events-none" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
            leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="bg-card rounded-2xl p-8 w-full max-w-md shadow-xl relative border border-border">
              <button className="absolute top-3 right-3 text-muted-foreground hover:text-primary text-2xl" onClick={onClose}>&times;</button>
              <Dialog.Title className="text-2xl font-bold mb-4 text-primary">{editMode ? 'Modifica Evento' : 'Apri evento'}</Dialog.Title>
              {error && <div className="mb-2 text-accent text-sm">{error}</div>}
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label htmlFor="event_name" className="block text-sm font-medium text-foreground mb-1">Nome evento</label>
                  <input id="event_name" name="event_name" type="text" placeholder="Es: Etnacomics 2025" value={form.event_name} onChange={handleChange} required className="block w-full border border-border bg-background text-foreground rounded-lg p-2 focus:ring-2 focus:ring-secondary focus:outline-none placeholder-muted-foreground" />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-foreground mb-1">Note</label>
                  <input id="description" name="description" type="text" placeholder="Es: Etnacomics 2025 arena cambiata" value={form.description} onChange={handleChange} className="block w-full border border-border bg-background text-foreground rounded-lg p-2 focus:ring-2 focus:ring-secondary focus:outline-none placeholder-muted-foreground" />
                </div>
                <div>
                  <label htmlFor="event_start_date" className="block text-sm font-medium text-foreground mb-1">Data e ora inizio</label>
                  <input id="event_start_date" name="event_start_date" type="datetime-local" value={form.event_start_date} onChange={handleChange} required min={(() => {
                    const now = new Date();
                    const yyyy = now.getFullYear();
                    const mm = String(now.getMonth() + 1).padStart(2, '0');
                    const dd = String(now.getDate()).padStart(2, '0');
                    return `${yyyy}-${mm}-${dd}T00:00`;
                  })()} className="block w-full border border-border bg-background text-foreground rounded-lg p-2 focus:ring-2 focus:ring-secondary focus:outline-none placeholder-muted-foreground" />
                </div>
                <div>
                  <label htmlFor="event_end_date" className="block text-sm font-medium text-foreground mb-1">Data e ora fine</label>
                  <input id="event_end_date" name="event_end_date" type="datetime-local" value={form.event_end_date} onChange={handleChange} required min={form.event_start_date || (() => {
                    const now = new Date();
                    const yyyy = now.getFullYear();
                    const mm = String(now.getMonth() + 1).padStart(2, '0');
                    const dd = String(now.getDate()).padStart(2, '0');
                    return `${yyyy}-${mm}-${dd}T00:00`;
                  })()} className="block w-full border border-border bg-background text-foreground rounded-lg p-2 focus:ring-2 focus:ring-secondary focus:outline-none placeholder-muted-foreground" />
                </div>
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-foreground mb-1">Luogo</label>
                  <input id="location" name="location" type="text" placeholder="Es: Ciminiere Catania" value={form.location} onChange={handleChange} className="block w-full border border-border bg-background text-foreground rounded-lg p-2 focus:ring-2 focus:ring-secondary focus:outline-none placeholder-muted-foreground" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Staff assegnato</label>
                  <Listbox value={form.staff_ids} onChange={handleStaffChange} multiple>
                    <div className="relative mt-1">
                      <Listbox.Button className="w-full cursor-pointer rounded-lg bg-background border border-border py-2 pl-3 pr-10 text-left shadow-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground transition">
                        <span className={form.staff_ids.length === 0 ? 'block truncate text-muted-foreground italic' : 'block truncate'}>
                          {form.staff_ids.length === 0
                            ? 'Seleziona staff'
                            : staffList.filter(s => form.staff_ids.includes(s.id)).map(s => s.full_name).join(', ')}
                        </span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                          <ChevronUpDownIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                        </span>
                      </Listbox.Button>
                      <Listbox.Options className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-card py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm border border-border">
                        {staffList.map((staff) => (
                          <Listbox.Option
                            key={staff.id}
                            value={staff.id}
                            className={({ active, selected }) =>
                              [
                                'relative cursor-pointer select-none py-2 pl-10 pr-4 transition',
                                active ? 'bg-primary/10 text-primary' : 'text-foreground',
                                selected ? 'font-bold text-primary' : '',
                              ].join(' ')
                            }
                          >
                            {({ selected }) => (
                              <>
                                <span className={`block truncate ${selected ? 'font-bold' : ''}`}>{staff.full_name}</span>
                                {selected ? (
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
                  <span className="text-xs text-muted-foreground mt-1">Seleziona uno o più membri dello staff</span>
                </div>
                <button type="submit" className="bg-secondary hover:bg-primary text-background rounded-lg p-2 font-bold transition">Salva</button>
              </form>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}

// EventListPage: aggiungi logica per editMode e modale edit
export default function EventListPage() {
  const [events, setEvents] = useState<EventType[]>([]);
  const [featuredEvents, setFeaturedEvents] = useState<EventType[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'location'>('date');
  const [filter, setFilter] = useState('');
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    axios.get('/api/events/featured').then(res => setFeaturedEvents(Array.isArray(res.data) ? res.data : []));
  }, []);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (filter) params.filter = filter;
    if (sortBy) params.sortBy = sortBy;
    axios.get('/api/events', { params }).then(res => setEvents(res.data));
  }, [filter, sortBy]);

  function refreshEventsAndFeatured() {
    const params: Record<string, string> = {};
    if (filter) params.filter = filter;
    if (sortBy) params.sortBy = sortBy;
    axios.get('/api/events', { params }).then(res => setEvents(res.data));
    axios.get('/api/events/featured').then(res => setFeaturedEvents(Array.isArray(res.data) ? res.data : []));
  }

  function handleAdd() {
    // Dopo ogni salvataggio, aggiorna lista eventi e featured mantenendo i filtri
    refreshEventsAndFeatured();
  }

  function handleCardClick(event: EventType) {
    setSelectedEvent(event);
    setInfoModalOpen(true);
    setEditMode(false);
  }

  async function handleEdit() {
    if (selectedEvent) {
      // Recupera dati freschi dell'evento (inclusi staff e periods aggiornati)
      const res = await axios.get(`/api/events/${selectedEvent.id}`);
      setSelectedEvent(res.data);
    }
    setEditMode(true);
  }

  function handleCloseModal() {
    setInfoModalOpen(false);
    setEditMode(false);
    // Aggiorna featured anche quando si chiude la modale di edit
    refreshEventsAndFeatured();
  }

  // Filtro e sorting
  const filteredEvents = events
    .filter(e =>
      e.event_name.toLowerCase().includes(filter.toLowerCase()) ||
      e.location.toLowerCase().includes(filter.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(a.event_start_date).getTime() - new Date(b.event_start_date).getTime();
      } else if (sortBy === 'name') {
        return a.event_name.localeCompare(b.event_name);
      } else if (sortBy === 'location') {
        return a.location.localeCompare(b.location);
      }
      return 0;
    });

  // Mostra tutti i featured events in evidenza
  return (
    <>
      <MenuBar />
      <div className="min-h-screen bg-background p-4 md:p-8">
      {featuredEvents.length > 0 ? (
        featuredEvents.map(ev => (
          <FeaturedEventCard key={ev.id} event={ev} onClick={() => handleCardClick(ev)} />
        ))
      ) : (
        <h2 className="mb-10 text-center text-lg text-primary font-semibold">Nessun evento in evidenza</h2>
      )}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 mb-4 md:mb-8">
        <h1 className="text-xl md:text-2xl font-extrabold text-primary tracking-tight">Eventi</h1>
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="text"
            placeholder="Filtra per nome o luogo..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="border border-border bg-background text-foreground rounded px-2 py-1 text-sm focus:ring-2 focus:ring-secondary focus:outline-none placeholder-muted-foreground"
          />
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as 'date' | 'name' | 'location')}
            className="border border-border bg-background text-foreground rounded px-2 py-1 text-sm focus:ring-2 focus:ring-secondary focus:outline-none"
          >
            <option value="date">Ordina per data</option>
            <option value="name">Ordina per nome</option>
            <option value="location">Ordina per luogo</option>
          </select>
          <button className="bg-primary hover:bg-secondary text-background px-3 py-1.5 rounded-lg font-bold flex items-center gap-2 shadow transition text-sm md:text-base" onClick={() => setModalOpen(true)}>
            <PlusIcon className="w-4 h-4 md:w-5 md:h-5" />
            Apri evento
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8 xl:gap-10 2xl:gap-12">
        {filteredEvents.map(event => (
          <EventCard
            key={event.id}
            event={event}
            onClick={() => handleCardClick(event)}
            isFeatured={!!(featuredEvents.find(fev => fev.id === event.id))}
          />
        ))}
      </div>
      <AddEventModal open={modalOpen} onClose={() => setModalOpen(false)} onAdd={handleAdd} />
      {infoModalOpen && selectedEvent && !editMode && (
        <EventInfoModal open={infoModalOpen} onClose={handleCloseModal} event={selectedEvent} onEdit={handleEdit} />
      )}
      {infoModalOpen && selectedEvent && editMode && (
        <AddEventModal
          open={infoModalOpen}
          onClose={handleCloseModal}
          onAdd={ev => {
            setEvents(events.map(e => (e.id === ev.id ? ev : e)));
            setSelectedEvent(ev);
            setEditMode(false);
          }}
          event={selectedEvent}
          editMode={true}
          staffOverride={selectedEvent.staff}
        />
      )}
      </div>
    </>
  );
}

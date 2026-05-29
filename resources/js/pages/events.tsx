import React, { useState, useEffect } from 'react';
import MenuBar from '../components/MenuBar';
import axios from 'axios';
import { Dialog, Transition } from '@headlessui/react';
import { PlusIcon, CheckIcon } from '@heroicons/react/24/solid';

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
  is_on_break?: boolean;
  break_started_at?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  periods?: StaffPeriod[];
};
type ShiftType = {
  id?: number;
  starts_at: string;
  ends_at: string;
};

type EventType = {
  id: number;
  event_name: string;
  description: string;
  event_start_date: string;
  event_end_date: string;
  location: string;
  staff?: StaffType[];
  shifts?: ShiftType[];
};

function toLocalDateTimeInput(value?: string | null): string {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

// Card evento in evidenza
function FeaturedEventCard({ event, onEdit, onDelete }: { event: EventType; onEdit: () => void; onDelete: () => void }) {
  if (!event) return null;
  return (
    <div className="bg-primary/10 border-2 border-primary rounded-3xl shadow-2xl p-10 mb-10 flex flex-col md:flex-row items-center gap-10 min-h-[220px]">
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
          {event.location && (
            <span className="bg-card text-primary px-3 py-1.5 rounded-lg font-semibold border border-primary text-lg">{event.location}</span>
          )}
        </div>
      </div>
      <div className="flex-shrink-0 flex flex-col gap-3 mt-6 md:mt-0">
        <button onClick={onEdit} className="bg-primary hover:bg-secondary text-background rounded-lg px-5 py-2.5 font-bold transition text-sm w-full">
          Modifica
        </button>
        <button onClick={onDelete} className="bg-red-500 hover:bg-red-700 text-white rounded-lg px-5 py-2.5 font-bold transition text-sm w-full">
          Elimina
        </button>
      </div>
    </div>
  );
}

function EventInfoModal({ open, onClose, event, onEdit }: { open: boolean; onClose: () => void; event: EventType | null; onEdit: () => void }) {
  const [staff, setStaff] = useState<StaffType[]>([]);
  const [shifts, setShifts] = useState<ShiftType[]>([]);
  const [shaking, setShaking] = useState(false);
  const triggerShake = () => { if (shaking) return; setShaking(true); setTimeout(() => setShaking(false), 450); };
  useEffect(() => {
    if (open && event?.id) {
      axios.get(`/api/events/${event.id}`, { withCredentials: true }).then(res => {
        setStaff(res.data.staff || []);
        setShifts(res.data.shifts || []);
      });
    } else {
      setStaff([]);
      setShifts([]);
    }
  }, [open, event]);
  if (!event) return null;
  return (
    <Transition show={open} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={triggerShake}>
        <div className="fixed inset-0 bg-black/40 z-40" />
        <div className="fixed inset-0 z-50 overflow-y-auto px-3 py-4 sm:flex sm:items-center sm:justify-center sm:p-4">
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
            leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className={`relative mx-auto w-full max-w-4xl overflow-y-auto rounded-xl border border-border bg-card p-4 shadow-xl max-h-[92vh] sm:my-auto sm:rounded-2xl sm:p-8${shaking ? ' modal-shake' : ''}`}>
              <button className="absolute top-3 right-3 text-muted-foreground hover:text-primary text-2xl" onClick={onClose}>&times;</button>
              <Dialog.Title className="text-2xl font-bold mb-4 text-primary">{event.event_name}</Dialog.Title>
              <div className="text-base text-muted-foreground mb-4">{event.description}</div>
              <div className="flex flex-col gap-2 text-sm mb-4">
                <span className="text-secondary font-semibold">Inizio: <span className="text-foreground">{new Date(event.event_start_date).toLocaleString()}</span></span>
                <span className="text-secondary font-semibold">Fine: <span className="text-foreground">{new Date(event.event_end_date).toLocaleString()}</span></span>
                <span className="text-secondary font-semibold">Luogo: <span className="text-foreground">{event.location}</span></span>
              </div>
              {shifts.length > 0 && (
                <div className="mb-4">
                  <div className="font-bold text-primary mb-2">Turni:</div>
                  {Object.entries(
                    shifts.reduce((acc, s) => {
                      const date = new Date(s.starts_at).toLocaleDateString('it-IT');
                      if (!acc[date]) acc[date] = [];
                      acc[date].push(s);
                      return acc;
                    }, {} as Record<string, ShiftType[]>)
                  ).map(([date, dayShifts]) => (
                    <div key={date} className="mb-2">
                      <div className="text-sm font-semibold text-foreground">{date}</div>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {dayShifts.map((s, i) => (
                          <span key={i} className="text-xs bg-primary/10 text-primary border border-primary rounded px-2 py-1">
                            {new Date(s.starts_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                            {' → '}
                            {new Date(s.ends_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mb-4">
                <div className="font-bold text-primary mb-2">Staff:</div>
                {staff.length === 0 ? (
                  <div className="text-muted-foreground italic text-sm">Nessuno staff assegnato</div>
                ) : (() => {
                  const fmt = (dt: string) => {
                    const d = new Date(dt);
                    return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })
                      + ' ' + d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
                  };
                  const renderRows = (slice: StaffType[]) => slice.flatMap(s => {
                    const periods = s.periods && s.periods.length > 0 ? s.periods : [];
                    const isCurrentlyPresent = periods.some(p => !p.removed_at && !p.deleted_at);
                    const isOnBreak = s.is_on_break === true;
                    const breakMins = isOnBreak && s.break_started_at
                      ? Math.floor((Date.now() - new Date(s.break_started_at).getTime()) / 60000)
                      : null;
                    if (periods.length === 0) {
                      return [(
                        <tr key={s.id} className="border-b border-border last:border-0">
                          <td className="px-3 py-2 font-semibold text-foreground">{s.full_name}</td>
                          <td className="px-3 py-2 text-muted-foreground" colSpan={2}>—</td>
                        </tr>
                      )];
                    }
                    return periods.map((p, pi) => {
                      const active = !p.removed_at && !p.deleted_at;
                      return (
                        <tr key={`${s.id}-${pi}`} className="border-b border-border last:border-0">
                          {pi === 0 && (
                            <td className="px-3 py-2 font-semibold text-foreground align-middle" rowSpan={periods.length}>
                              <span className="flex items-center gap-1.5">
                                {isCurrentlyPresent && !isOnBreak && <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />}
                                {isOnBreak && <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />}
                                {s.full_name}
                              </span>
                            </td>
                          )}
                          <td className="px-3 py-2 text-muted-foreground tabular-nums">{fmt(p.added_at)}</td>
                          <td className={`px-3 py-2 tabular-nums ${active ? (isOnBreak ? 'text-orange-400 font-medium' : 'text-primary font-medium') : 'text-muted-foreground'}`}>
                            {active
                              ? isOnBreak
                                ? `in pausa${breakMins !== null ? ' ' + breakMins + 'm' : ''}`
                                : 'presente'
                              : p.removed_at ? fmt(p.removed_at) : '—'}
                          </td>
                        </tr>
                      );
                    });
                  });
                  const thead = (
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Nome</th>
                        <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Entrata</th>
                        <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Uscita</th>
                      </tr>
                    </thead>
                  );
                  const col1 = staff.slice(0, 10);
                  const col2 = staff.slice(10);
                  return (
                    <div className={`flex flex-col gap-3 ${col2.length > 0 ? 'xl:flex-row' : ''}`}>
                      <div className="flex-1 overflow-x-auto rounded-lg border border-border">
                        <table className="w-full text-xs">{thead}<tbody>{renderRows(col1)}</tbody></table>
                      </div>
                      {col2.length > 0 && (
                        <div className="flex-1 overflow-x-auto rounded-lg border border-border">
                          <table className="w-full text-xs">{thead}<tbody>{renderRows(col2)}</tbody></table>
                        </div>
                      )}
                    </div>
                  );
                })()}
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

function EventCard({ event, onEdit, onDelete, isFeatured }: { event: EventType; onEdit: () => void; onDelete: () => void; isFeatured?: boolean }) {
  return (
    <div
      className={
        `bg-card rounded-2xl shadow-lg p-6 flex flex-col gap-3 border-2 hover:shadow-2xl transition-shadow duration-200 min-h-[160px] w-full ` +
        (isFeatured ? 'border-white/90' : 'border-border')
      }
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
      <div className="flex gap-2 mt-auto pt-2">
        <button onClick={onEdit} className="flex-1 bg-primary hover:bg-secondary text-background rounded-lg px-3 py-1.5 font-bold transition text-xs">
          Modifica
        </button>
        <button onClick={onDelete} className="flex-1 bg-red-500 hover:bg-red-700 text-white rounded-lg px-3 py-1.5 font-bold transition text-xs">
          Elimina
        </button>
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
    shifts: [] as Array<{ starts_at: string; ends_at: string }>,
  });
  const [error, setError] = useState<string | null>(null);
  const [staffList, setStaffList] = useState<StaffType[]>([]);
  const [shaking, setShaking] = useState(false);
  const triggerShake = () => { if (shaking) return; setShaking(true); setTimeout(() => setShaking(false), 450); };

  // Precompila tutto il form solo su open/editMode/event
  useEffect(() => {
    if (open && editMode && event) {
      // Usa staffOverride se presente (dati freschi da GET /api/events/{id})
      const staffSource = staffOverride ?? event.staff;
      setForm({
        event_name: event.event_name || '',
        description: event.description || '',
        event_start_date: toLocalDateTimeInput(event.event_start_date),
        event_end_date: toLocalDateTimeInput(event.event_end_date),
        location: event.location || '',
        staff_ids: staffSource ? staffSource.filter(s => s.periods && s.periods.some(p => !p.removed_at && !p.deleted_at)).map(s => s.id) : [],
        shifts: event.shifts ? event.shifts.map(s => ({
          starts_at: toLocalDateTimeInput(s.starts_at),
          ends_at: toLocalDateTimeInput(s.ends_at),
        })) : [],
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
        shifts: [],
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
      axios.get('/api/staff', { withCredentials: true }).then(res => {
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

  function addShift() {
    const baseDate = form.event_start_date?.slice(0, 10) || new Date().toISOString().slice(0, 10);
    setForm(f => ({ ...f, shifts: [...f.shifts, { starts_at: `${baseDate}T10:00`, ends_at: `${baseDate}T13:00` }] }));
  }
  function updateShiftDate(idx: number, date: string) {
    setForm(f => ({ ...f, shifts: f.shifts.map((s, i) => i !== idx ? s : {
      starts_at: `${date}T${s.starts_at.slice(11, 16)}`,
      ends_at:   `${date}T${s.ends_at.slice(11, 16)}`,
    }) }));
  }
  function updateShift(idx: number, field: 'starts_at' | 'ends_at', value: string) {
    setForm(f => ({ ...f, shifts: f.shifts.map((s, i) => i === idx ? { ...s, [field]: value } : s) }));
  }
  function removeShift(idx: number) {
    setForm(f => ({ ...f, shifts: f.shifts.filter((_, i) => i !== idx) }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    try {
      const payload = { ...form, staff_ids: form.staff_ids };
      let res;
      if (editMode && event) {
        res = await axios.put(`/api/events/${event.id}`, payload, { withCredentials: true });
      } else {
        res = await axios.post('/api/events', payload, { withCredentials: true });
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
      <Dialog as="div" className="relative z-50" onClose={triggerShake}>
        <div className="fixed inset-0 bg-black/40" />
        <div className="fixed inset-0 overflow-y-auto px-3 py-4 sm:flex sm:items-center sm:justify-center sm:p-4">
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
            leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className={`relative mx-auto w-full max-w-4xl overflow-y-auto rounded-xl border border-border bg-card p-4 shadow-xl max-h-[92vh] sm:my-auto sm:rounded-2xl sm:p-8${shaking ? ' modal-shake' : ''}`}>
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
                  <label className="block text-sm font-medium text-foreground mb-2">Staff assegnato</label>
                  {staffList.length === 0 ? (
                    <div className="text-muted-foreground italic text-sm">Nessuno staff disponibile</div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {staffList.map(staff => {
                        const selected = form.staff_ids.includes(staff.id);
                        return (
                          <button
                            key={staff.id}
                            type="button"
                            onClick={() => handleStaffChange(
                              selected
                                ? form.staff_ids.filter(id => id !== staff.id)
                                : [...form.staff_ids, staff.id]
                            )}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border-2 transition select-none ${
                              selected
                                ? 'bg-primary text-background border-primary shadow-sm'
                                : 'bg-background text-foreground border-border hover:border-primary hover:text-primary'
                            }`}
                          >
                            {selected && <CheckIcon className="w-3.5 h-3.5 shrink-0" />}
                            {staff.full_name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <span className="text-xs text-muted-foreground mt-2 block">Tocca per selezionare / deselezionare</span>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-foreground">Turni</label>
                    <button type="button" onClick={addShift} className="text-xs text-primary hover:text-secondary font-semibold border border-primary rounded-lg px-2 py-1 transition">
                      + Aggiungi turno
                    </button>
                  </div>
                  {form.shifts.length === 0 && (
                    <p className="text-muted-foreground text-xs italic">Nessun turno. Clicca per aggiungere.</p>
                  )}
                  <div className="flex flex-col gap-1.5">
                    {form.shifts.map((shift, idx) => (
                      <div key={idx} className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border px-2 py-1.5 sm:flex-nowrap">
                        <input
                          type="date"
                          value={shift.starts_at.slice(0, 10)}
                          onChange={e => updateShiftDate(idx, e.target.value)}
                          className="min-w-0 w-full rounded border border-border bg-background px-1.5 py-1 text-sm text-foreground focus:ring-1 focus:ring-secondary focus:outline-none sm:w-auto"
                        />
                        <input
                          type="time"
                          value={shift.starts_at.slice(11, 16)}
                          onChange={e => updateShift(idx, 'starts_at', `${shift.starts_at.slice(0, 10)}T${e.target.value}`)}
                          className="w-full rounded border border-border bg-background px-1.5 py-1 text-sm text-foreground focus:ring-1 focus:ring-secondary focus:outline-none sm:w-[5.5rem]"
                        />
                        <span className="text-muted-foreground text-xs shrink-0">→</span>
                        <input
                          type="time"
                          value={shift.ends_at.slice(11, 16)}
                          onChange={e => updateShift(idx, 'ends_at', `${shift.ends_at.slice(0, 10)}T${e.target.value}`)}
                          className="w-full rounded border border-border bg-background px-1.5 py-1 text-sm text-foreground focus:ring-1 focus:ring-secondary focus:outline-none sm:w-[5.5rem]"
                        />
                        <button type="button" onClick={() => removeShift(idx)} className="ml-auto text-red-500 hover:text-red-700 font-bold text-base leading-none shrink-0 pl-1">
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
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
    axios.get('/api/events/featured', { withCredentials: true }).then(res => setFeaturedEvents(Array.isArray(res.data) ? res.data : []));
  }, []);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (filter) params.filter = filter;
    if (sortBy) params.sortBy = sortBy;
    axios.get('/api/events', { params, withCredentials: true }).then(res => setEvents(res.data));
  }, [filter, sortBy]);

  function refreshEventsAndFeatured() {
    const params: Record<string, string> = {};
    if (filter) params.filter = filter;
    if (sortBy) params.sortBy = sortBy;
    axios.get('/api/events', { params, withCredentials: true }).then(res => setEvents(res.data));
    axios.get('/api/events/featured', { withCredentials: true }).then(res => setFeaturedEvents(Array.isArray(res.data) ? res.data : []));
  }

  function handleAdd() {
    // Dopo ogni salvataggio, aggiorna lista eventi e featured mantenendo i filtri
    refreshEventsAndFeatured();
  }

  async function handleEdit() {
    if (selectedEvent) {
      // Recupera dati freschi dell'evento (inclusi staff e periods aggiornati)
      const res = await axios.get(`/api/events/${selectedEvent.id}`, { withCredentials: true });
      setSelectedEvent(res.data);
    }
    setEditMode(true);
  }

  async function handleFeaturedEdit(ev: EventType) {
    const res = await axios.get(`/api/events/${ev.id}`, { withCredentials: true });
    setSelectedEvent(res.data);
    setInfoModalOpen(true);
    setEditMode(true);
  }

  async function handleFeaturedDelete(ev: EventType) {
    if (!window.confirm(`Eliminare l'evento "${ev.event_name}"?`)) return;
    await axios.delete(`/api/events/${ev.id}`, { withCredentials: true });
    refreshEventsAndFeatured();
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
          <FeaturedEventCard key={ev.id} event={ev} onEdit={() => handleFeaturedEdit(ev)} onDelete={() => handleFeaturedDelete(ev)} />
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
            onEdit={() => handleFeaturedEdit(event)}
            onDelete={() => handleFeaturedDelete(event)}
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

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import MenuBar from '../components/MenuBar';

type EventItem = {
  id: number;
  event_name: string;
  event_start_date?: string | null;
  event_end_date?: string | null;
};

type StaffMetric = {
  id: number;
  full_name: string;
  activity_count: number;
  days_present: number;
  time_in_arena_seconds: number;
  time_breaks_seconds: number;
  time_activities_seconds: number;
  time_idle_seconds: number;
};

function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0 min';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0 && m > 0) return `${h}h ${m}min`;
  if (h > 0) return `${h}h`;
  if (m > 0) return `${m}min`;
  return `${s}s`;
}

function computeEventDates(startDate: string, endDate?: string | null): string[] {
  const dates: string[] = [];
  const cur = new Date(startDate);
  cur.setHours(12, 0, 0, 0);
  const end = new Date(endDate ?? startDate);
  end.setHours(12, 0, 0, 0);
  while (cur <= end) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

export default function MetricsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [metrics, setMetrics] = useState<StaffMetric[]>([]);
  const [totalShiftSeconds, setTotalShiftSeconds] = useState<number>(0);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);

  useEffect(() => {
    axios
      .get('/api/events', { withCredentials: true })
      .then(res => {
        const list: EventItem[] = Array.isArray(res.data) ? res.data : [];
        setEvents(list);
        if (list.length > 0) {
          setSelectedEventId(list[0].id);
        }
      })
      .catch(err => {
        setEventsError(
          err?.response?.data?.message ?? err?.message ?? 'Errore nel caricamento degli eventi.'
        );
      })
      .finally(() => setLoadingEvents(false));
  }, []);

  // Calcola le date disponibili ogni volta che cambia l'evento selezionato
  useEffect(() => {
    if (!selectedEventId) {
      setAvailableDates([]);
      setSelectedDate(null);
      setMetrics([]);
      return;
    }
    const event = events.find(e => e.id === selectedEventId);
    if (!event?.event_start_date) {
      setAvailableDates([]);
      setSelectedDate(null);
      return;
    }
    const dates = computeEventDates(event.event_start_date, event.event_end_date);
    setAvailableDates(dates);
    const saved = localStorage.getItem(`metrics_sel_${selectedEventId}`);
    const initial = saved && dates.includes(saved) ? saved : (dates[0] ?? null);
    setSelectedDate(initial);
  }, [selectedEventId, events]);

  // Carica le metriche per il giorno selezionato e aggiorna ogni 5 secondi
  useEffect(() => {
    if (!selectedEventId || !selectedDate) {
      setMetrics([]);
      return;
    }

    localStorage.setItem(`metrics_sel_${selectedEventId}`, selectedDate);

    const doFetch = (showLoading: boolean) => {
      if (showLoading) setLoadingMetrics(true);
      axios
        .get(`/api/events/${selectedEventId}/metrics/staff`, {
          params: { date: selectedDate },
          withCredentials: true,
        })
        .then(res => {
          setMetrics(res.data.metrics ?? []);
          setTotalShiftSeconds(res.data.total_shift_seconds ?? 0);
          if (Array.isArray(res.data.dates) && res.data.dates.length > 0) {
            setAvailableDates(res.data.dates);
          }
        })
        .finally(() => { if (showLoading) setLoadingMetrics(false); });
    };

    doFetch(true);
    const interval = setInterval(() => doFetch(false), 30000);
    return () => clearInterval(interval);
  }, [selectedEventId, selectedDate]);

  const selectedEvent = events.find(e => e.id === selectedEventId);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MenuBar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-extrabold text-primary mb-6">Metriche staff</h1>

        {/* Selezione evento */}
        <div className="mb-6">
          <label className="block text-sm font-semibold mb-1 text-muted-foreground">Evento</label>
          {loadingEvents ? (
            <div className="text-muted-foreground italic text-sm">Caricamento eventi...</div>
          ) : eventsError ? (
            <div className="text-red-500 text-sm font-semibold">{eventsError}</div>
          ) : events.length === 0 ? (
            <div className="text-muted-foreground italic text-sm">
              Nessun evento trovato.{' '}
              <a href="/eventi" className="text-primary underline hover:no-underline font-semibold">
                Crea un evento
              </a>
            </div>
          ) : (
            <select
              value={selectedEventId ?? ''}
              onChange={e => setSelectedEventId(Number(e.target.value))}
              className="bg-card border border-border text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary w-full md:w-auto min-w-64"
            >
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>
                  {ev.event_name}
                  {ev.event_start_date ? ` — ${new Date(ev.event_start_date).toLocaleDateString('it-IT')}` : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Tabella metriche */}
        {selectedEvent && (
          <div className="bg-card border border-border rounded-xl shadow overflow-x-auto">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h2 className="font-bold text-lg text-foreground">{selectedEvent.event_name}</h2>
              <div className="flex items-center gap-4">
                {totalShiftSeconds > 0 && (
                  <span className="text-xs font-semibold text-primary bg-primary/10 border border-primary rounded px-2 py-1">
                    Turni programmati: {formatDuration(totalShiftSeconds)}
                  </span>
                )}
                {selectedEvent.event_start_date && (
                <span className="text-sm text-muted-foreground">
                  {new Date(selectedEvent.event_start_date).toLocaleDateString('it-IT')}
                  {selectedEvent.event_end_date &&
                    selectedEvent.event_end_date !== selectedEvent.event_start_date &&
                    ` → ${new Date(selectedEvent.event_end_date).toLocaleDateString('it-IT')}`}
                </span>
              )}              </div>            </div>

            {/* Tab giorni */}
            {availableDates.length > 1 && (
              <div className="px-5 pt-4 pb-3 flex gap-1.5 flex-wrap border-b border-border">
                {availableDates.map(date => (
                  <button
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition border ${
                      selectedDate === date
                        ? 'bg-primary text-background border-primary'
                        : 'bg-background text-foreground border-border hover:border-primary hover:text-primary'
                    }`}
                  >
                    {new Date(date + 'T12:00:00').toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                  </button>
                ))}
              </div>
            )}

            {loadingMetrics ? (
              <div className="px-5 py-8 text-muted-foreground italic text-sm">Caricamento metriche...</div>
            ) : metrics.length === 0 ? (
              <div className="px-5 py-8 text-muted-foreground italic text-sm">
                Nessun dato disponibile per questo evento.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground border-b border-border">
                    <th className="text-left px-5 py-3 font-semibold">Staff</th>
                    <th className="text-right px-5 py-3 font-semibold">In arena</th>
                    <th className="text-right px-5 py-3 font-semibold">In pausa</th>
                    <th className="text-right px-5 py-3 font-semibold">Idle</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.map((s) => {
                    const arenaTotal = s.time_in_arena_seconds;
                    // Riferimento per le percentuali: turni totali dell'evento.
                    // Fallback su arena+pause+idle se i turni non sono definiti.
                    const shiftRef = totalShiftSeconds > 0
                      ? totalShiftSeconds
                      : arenaTotal + s.time_breaks_seconds + s.time_idle_seconds;
                    const actPct  = shiftRef > 0 ? Math.round((arenaTotal              / shiftRef) * 100) : 0;
                    const brkPct  = shiftRef > 0 ? Math.round((s.time_breaks_seconds   / shiftRef) * 100) : 0;
                    const idlePct = shiftRef > 0 ? Math.round((s.time_idle_seconds     / shiftRef) * 100) : 0;
                    const idleClass = idlePct > 50
                      ? 'text-red-500 font-bold'
                      : idlePct > 25
                      ? 'text-orange-500 font-semibold'
                      : s.time_idle_seconds > 0
                      ? 'text-foreground'
                      : 'text-muted-foreground';
                    return (
                    <tr
                      key={s.id}
                      className="border-b border-border last:border-0 hover:bg-muted/40 transition"
                    >
                      <td className="px-5 py-3 font-semibold text-foreground">{s.full_name}</td>
                      <td className="px-5 py-3 text-right">
                        <div className="text-foreground">{formatDuration(arenaTotal)}</div>
                      </td>
                      <td className="px-5 py-3 text-right">
                        {s.time_breaks_seconds > 0 ? (
                          <span className="text-orange-500 font-medium">
                            {formatDuration(s.time_breaks_seconds)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {s.time_idle_seconds > 0 ? (
                          <span className={idleClass}>
                            {formatDuration(s.time_idle_seconds)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

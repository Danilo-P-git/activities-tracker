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
  if (h > 0 && m > 0) return `${h}h ${m}min`;
  if (h > 0) return `${h}h`;
  return `${m}min`;
}

export default function MetricsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [metrics, setMetrics] = useState<StaffMetric[]>([]);
  const [eventTotalDays, setEventTotalDays] = useState<number>(0);
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

  useEffect(() => {
    if (!selectedEventId) {
      setMetrics([]);
      return;
    }
    setLoadingMetrics(true);
    axios
      .get(`/api/events/${selectedEventId}/metrics/staff`, { withCredentials: true })
      .then(res => {
        setMetrics(res.data.metrics ?? res.data);
        setEventTotalDays(res.data.event_total_days ?? 0);
      })
      .finally(() => setLoadingMetrics(false));
  }, [selectedEventId]);

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
              {selectedEvent.event_start_date && (
                <span className="text-sm text-muted-foreground">
                  {new Date(selectedEvent.event_start_date).toLocaleDateString('it-IT')}
                  {selectedEvent.event_end_date &&
                    selectedEvent.event_end_date !== selectedEvent.event_start_date &&
                    ` → ${new Date(selectedEvent.event_end_date).toLocaleDateString('it-IT')}`}
                </span>
              )}
            </div>

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
                    <th className="text-left px-5 py-3 font-semibold">#</th>
                    <th className="text-left px-5 py-3 font-semibold">Staff</th>
                    <th className="text-right px-5 py-3 font-semibold">Giorni</th>
                    <th className="text-right px-5 py-3 font-semibold">Attività</th>
                    <th className="text-right px-5 py-3 font-semibold">In arena</th>
                    <th className="text-right px-5 py-3 font-semibold">In pausa</th>
                    <th className="text-right px-5 py-3 font-semibold">Tempo attività</th>
                    <th className="text-right px-5 py-3 font-semibold">Idle</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.map((s, index) => (
                    <tr
                      key={s.id}
                      className="border-b border-border last:border-0 hover:bg-muted/40 transition"
                    >
                      <td className="px-5 py-3 text-muted-foreground font-medium">{index + 1}</td>
                      <td className="px-5 py-3 font-semibold text-foreground">{s.full_name}</td>
                      <td className="px-5 py-3 text-right">
                        {eventTotalDays > 1 ? (
                          <span className={s.days_present < eventTotalDays ? 'text-orange-500 font-medium' : 'text-foreground'}>
                            {s.days_present}/{eventTotalDays} gg
                          </span>
                        ) : (
                          <span className="text-foreground">{s.days_present} gg</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="inline-block bg-primary/10 text-primary font-bold rounded-full px-2 py-0.5 text-xs">
                          {s.activity_count}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-foreground">
                        {formatDuration(s.time_in_arena_seconds)}
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
                      <td className="px-5 py-3 text-right text-foreground">
                        {formatDuration(s.time_activities_seconds)}
                      </td>
                      <td className="px-5 py-3 text-right text-muted-foreground">
                        {formatDuration(s.time_idle_seconds)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import MenuBar from '../components/MenuBar';
import { ChevronDownIcon } from '@heroicons/react/24/solid';
import axios from 'axios';

type EventType = {
  id: number;
  event_name: string;
  event_start_date: string;
  event_end_date: string;
};

export default function GroupsSelectPage() {
  const [events, setEvents] = useState<EventType[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('/api/events/featured').then(res => setEvents(res.data));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <MenuBar />
      <div className="max-w-xl mx-auto mt-16 bg-card rounded-2xl shadow-lg border border-border p-8">
        <h1 className="text-2xl font-extrabold text-primary mb-6 text-center">Seleziona un evento</h1>
        <ul className="space-y-4">
          {events.map(ev => (
            <li key={ev.id}>
              <button
                className="w-full flex items-center justify-between bg-primary/10 hover:bg-primary/20 border border-primary rounded-lg px-4 py-3 text-lg font-semibold text-primary transition shadow"
                onClick={() => navigate(`/gruppi?event_id=${ev.id}`)}
              >
                <span>{ev.event_name}</span>
                <span className="text-xs text-muted-foreground ml-2">{new Date(ev.event_start_date).toLocaleDateString()} - {new Date(ev.event_end_date).toLocaleDateString()}</span>
                <ChevronDownIcon className="w-5 h-5 ml-4" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

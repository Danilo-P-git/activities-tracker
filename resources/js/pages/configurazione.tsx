
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import MenuBar from '../components/MenuBar';

type ConfigRow = { chiave: string; valore: string };

const CONFIG_LABELS: Record<string, string> = {
  gruppi_contemporanei: 'Gruppi contemporanei gestibili',
  // Aggiungi qui altre label per future configurazioni
};

const ConfigurazionePage: React.FC = () => {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [success, setSuccess] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  // Placeholder: isAdmin, da implementare con auth/ruoli
  const isAdmin = false; // Cambia a true per testare la UI admin

  useEffect(() => {
    axios.get('/api/configurazione')
      .then(res => {
        setConfig(res.data || {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleChange = (key: string, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      // Salva tutte le configurazioni modificate
      const promises = Object.entries(config).map(([chiave, valore]) =>
        axios.put('/api/configurazione', { chiave, valore })
      );
      await Promise.all(promises);
      setSuccess(true);
    } catch (err) {
      setError('Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newValue.trim()) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await axios.put('/api/configurazione', { chiave: newKey, valore: newValue });
      setConfig(prev => ({ ...prev, [newKey]: newValue }));
      setNewKey('');
      setNewValue('');
      setSuccess(true);
    } catch (err) {
      setError('Errore nell\'aggiunta');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <MenuBar />
      <div className="max-w-xl mx-auto mt-12 bg-card rounded-2xl shadow-lg border border-border p-8">
        <h1 className="text-2xl font-bold text-primary mb-6">Configurazione</h1>
        {loading ? (
          <div>Caricamento...</div>
        ) : (
          <>
            <form onSubmit={handleSave} className="flex flex-col gap-6 mb-8">
              {Object.keys(config).length === 0 && <div className="text-muted-foreground italic">Nessuna configurazione presente</div>}
              {Object.entries(config).map(([chiave, valore]) => (
                <div key={chiave}>
                  <label className="block text-sm font-medium mb-1">{CONFIG_LABELS[chiave] || chiave}</label>
                  <input
                    type={/\d+/.test(valore) ? 'number' : 'text'}
                    value={valore}
                    onChange={e => handleChange(chiave, e.target.value)}
                    className="block w-full border border-border bg-background text-foreground rounded-lg p-2 focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
              ))}
              <button type="submit" className="bg-primary hover:bg-secondary text-background rounded-lg p-2 font-bold transition" disabled={saving}>{saving ? 'Salvataggio...' : 'Salva tutte'}</button>
              {error && <div className="text-red-600 font-bold">{error}</div>}
              {success && <div className="text-green-600 font-bold">Salvato!</div>}
            </form>
            {/* Solo admin può aggiungere nuove chiavi. Da implementare con auth/ruoli. */}
            <form onSubmit={handleAdd} className={`flex flex-col gap-4 border-t border-border pt-6 mt-4 ${!isAdmin ? 'opacity-60 pointer-events-none' : ''}`}>
              <div className="font-bold text-primary mb-2">Aggiungi nuova configurazione (solo admin)</div>
              <input
                type="text"
                placeholder="Chiave (es: durata_media_gruppo)"
                value={newKey}
                onChange={e => setNewKey(e.target.value)}
                className="block w-full border border-border bg-background text-foreground rounded-lg p-2 focus:ring-2 focus:ring-primary focus:outline-none"
                disabled={!isAdmin}
              />
              <input
                type="text"
                placeholder="Valore"
                value={newValue}
                onChange={e => setNewValue(e.target.value)}
                className="block w-full border border-border bg-background text-foreground rounded-lg p-2 focus:ring-2 focus:ring-primary focus:outline-none"
                disabled={!isAdmin}
              />
              <button type="submit" className="bg-secondary hover:bg-primary text-background rounded-lg p-2 font-bold transition" disabled={!isAdmin || saving}>Aggiungi</button>
            </form>
          </>
        )}
      </div>
    </>
  );
};

export default ConfigurazionePage;

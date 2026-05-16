import React, { useEffect, useState } from 'react';
import axios from 'axios';
import MenuBar from '../components/MenuBar';
import { PlusIcon, PencilSquareIcon, TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';

type StaffMember = {
  id: number;
  full_name: string;
  phone: string | null;
  is_available: boolean;
  is_master: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
};

type StaffForm = {
  full_name: string;
  phone: string;
  is_master: boolean;
};

const emptyForm: StaffForm = {
  full_name: '',
  phone: '',
  is_master: false,
};

export default function StaffPage() {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<StaffForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  function fetchStaff() {
    axios.get('/api/staff', { withCredentials: true }).then(res => {
      setStaffList(res.data);
      setLoading(false);
    });
  }

  useEffect(() => {
    fetchStaff();
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
    setShowForm(true);
  }

  function openEdit(member: StaffMember) {
    setEditingId(member.id);
    setForm({
      full_name: member.full_name,
      phone: member.phone ?? '',
      is_master: member.is_master,
    });
    setError(null);
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        full_name: form.full_name.trim(),
        phone: form.phone.trim() || null,
        is_master: form.is_master,
        is_available: true,
      };
      if (editingId !== null) {
        await axios.put(`/api/staff/${editingId}`, payload, { withCredentials: true });
      } else {
        await axios.post('/api/staff', payload, { withCredentials: true });
      }
      cancelForm();
      fetchStaff();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msgs = err.response?.data?.messages;
        setError(Array.isArray(msgs) ? msgs.join(', ') : (err.response?.data?.message ?? 'Errore nel salvataggio'));
      } else {
        setError('Errore nel salvataggio');
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await axios.delete(`/api/staff/${id}`, { withCredentials: true });
      setDeleteConfirmId(null);
      fetchStaff();
    } catch {
      setError('Errore durante l\'eliminazione');
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <MenuBar />
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-extrabold text-primary">Gestione Staff</h1>
          {!showForm && (
            <button
              onClick={openCreate}
              className="bg-primary hover:bg-secondary text-background px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow transition"
            >
              <PlusIcon className="w-5 h-5" />
              Aggiungi staff
            </button>
          )}
        </div>

        {/* Form creazione / modifica */}
        {showForm && (
          <div className="bg-card border border-border rounded-2xl shadow p-6 mb-8">
            <h2 className="text-lg font-bold text-primary mb-4">
              {editingId !== null ? 'Modifica membro staff' : 'Nuovo membro staff'}
            </h2>
            {error && <div className="text-red-500 text-sm mb-3">{error}</div>}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nome completo *</label>
                  <input
                    type="text"
                    value={form.full_name}
                    onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                    required
                    placeholder="Es: Mario Rossi"
                    className="w-full border border-border bg-background text-foreground rounded-lg p-2 focus:ring-2 focus:ring-secondary focus:outline-none placeholder-muted-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Telefono</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="Es: +39 333 1234567"
                    className="w-full border border-border bg-background text-foreground rounded-lg p-2 focus:ring-2 focus:ring-secondary focus:outline-none placeholder-muted-foreground"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  id="is_master"
                  type="checkbox"
                  checked={form.is_master}
                  onChange={e => setForm(f => ({ ...f, is_master: e.target.checked }))}
                  className="w-4 h-4 accent-primary"
                />
                <label htmlFor="is_master" className="text-sm font-medium select-none cursor-pointer">
                  Master <span className="text-xs text-muted-foreground">(ruolo avanzato — funzionalità in arrivo)</span>
                </label>
              </div>
              <div className="flex gap-3 justify-end mt-2">
                <button
                  type="button"
                  onClick={cancelForm}
                  className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted transition font-semibold"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-secondary hover:bg-primary text-background px-5 py-2 rounded-lg font-bold transition"
                >
                  {saving ? 'Salvataggio...' : editingId !== null ? 'Salva modifiche' : 'Crea'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tabella staff */}
        {loading ? (
          <div className="text-center text-muted-foreground py-12">Caricamento...</div>
        ) : staffList.length === 0 ? (
          <div className="text-center text-muted-foreground italic py-12">Nessuno staff registrato</div>
        ) : (
          <div className="bg-card border border-border rounded-2xl shadow overflow-hidden">
            {/* Desktop: tabella */}
            <table className="w-full text-sm hidden md:table">
              <thead className="bg-primary/10 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-bold text-primary">Nome</th>
                  <th className="text-left px-4 py-3 font-bold text-primary">Telefono</th>
                  <th className="text-center px-4 py-3 font-bold text-primary">Master</th>
                  <th className="text-center px-4 py-3 font-bold text-primary">Disponibile</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {staffList.map(member => (
                  <tr key={member.id} className="border-b border-border last:border-0 hover:bg-primary/5 transition">
                    <td className="px-4 py-3 font-semibold text-foreground">{member.full_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {member.phone
                        ? <a href={`tel:${member.phone}`} className="text-primary hover:underline">{member.phone}</a>
                        : <span className="italic">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {member.is_master
                        ? <span className="inline-flex items-center gap-1 bg-yellow-400/20 text-yellow-700 border border-yellow-400 rounded-full px-2 py-0.5 text-xs font-bold"><CheckIcon className="w-3 h-3" />Master</span>
                        : <span className="text-muted-foreground text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {member.is_available
                        ? <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 rounded-full px-2 py-0.5 text-xs font-semibold"><CheckIcon className="w-3 h-3" />Sì</span>
                        : <span className="inline-flex items-center gap-1 bg-red-100 text-red-600 rounded-full px-2 py-0.5 text-xs font-semibold"><XMarkIcon className="w-3 h-3" />No</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => openEdit(member)}
                          className="p-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 transition"
                          title="Modifica"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                        </button>
                        {deleteConfirmId === member.id ? (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-red-600 font-semibold">Sicuro?</span>
                            <button onClick={() => handleDelete(member.id)} className="px-2 py-1 rounded bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition">Sì</button>
                            <button onClick={() => setDeleteConfirmId(null)} className="px-2 py-1 rounded bg-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-300 transition">No</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(member.id)}
                            className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 transition"
                            title="Elimina"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile: card list */}
            <ul className="md:hidden divide-y divide-border">
              {staffList.map(member => (
                <li key={member.id} className="p-4 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-foreground text-base">{member.full_name}</div>
                      {member.phone
                        ? <a href={`tel:${member.phone}`} className="text-primary text-sm hover:underline">{member.phone}</a>
                        : <span className="text-muted-foreground text-sm italic">Nessun telefono</span>}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => openEdit(member)} className="p-2 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 transition">
                        <PencilSquareIcon className="w-4 h-4" />
                      </button>
                      {deleteConfirmId === member.id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleDelete(member.id)} className="px-2 py-1 rounded bg-red-600 text-white text-xs font-bold">Sì</button>
                          <button onClick={() => setDeleteConfirmId(null)} className="px-2 py-1 rounded bg-gray-200 text-gray-700 text-xs font-bold">No</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirmId(member.id)} className="p-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 transition">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {member.is_master && (
                      <span className="inline-flex items-center gap-1 bg-yellow-400/20 text-yellow-700 border border-yellow-400 rounded-full px-2 py-0.5 font-bold">
                        <CheckIcon className="w-3 h-3" />Master
                      </span>
                    )}
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold ${member.is_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {member.is_available ? <><CheckIcon className="w-3 h-3" />Disponibile</> : <><XMarkIcon className="w-3 h-3" />Non disponibile</>}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';
import { useState, useEffect } from 'react';
import { getSupabase } from '@/lib/supabase/client';

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '', address: '', city: '', state: '', pin: '', country: 'India', gstin: '', email: '', phone: '', is_sez: false
  });

  async function loadClients() {
    try {
      const supabase = getSupabase();
      const { data } = await supabase.from('clients').select('*').order('name');
      setClients(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadClients(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('clients').insert([{ ...form, user_id: user.id }]);
      setModalOpen(false);
      setForm({ name: '', address: '', city: '', state: '', pin: '', country: 'India', gstin: '', email: '', phone: '', is_sez: false });
      loadClients();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Client Directory</h3>
        <button onClick={() => setModalOpen(true)} className="btn btn-primary">
          + Add Client
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div className="spinner spinner-lg" />
        </div>
      ) : clients.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>👥</div>
            <h3>No Clients Saved</h3>
            <p>Save clients to auto-fill details when creating invoices.</p>
            <button onClick={() => setModalOpen(true)} className="btn btn-primary mt-4">
              + Add First Client
            </button>
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Client Name</th>
                <th>GSTIN</th>
                <th>State</th>
                <th>SEZ</th>
                <th>Phone</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {clients.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td style={{ fontFamily: 'monospace' }}>{c.gstin || '-'}</td>
                  <td>{c.state || '-'}</td>
                  <td>{c.is_sez ? <span className="badge badge-warning">SEZ</span> : 'No'}</td>
                  <td>{c.phone || '-'}</td>
                  <td>{c.email || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Add New Client</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="input-group">
                  <label>Business / Client Name *</label>
                  <input type="text" className="input" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label>GSTIN</label>
                    <input type="text" className="input" placeholder="22AAAAA0000A1Z5" value={form.gstin} onChange={e => setForm({...form, gstin: e.target.value.toUpperCase()})} />
                  </div>
                  <div className="input-group">
                    <label>State</label>
                    <input type="text" className="input" placeholder="e.g. Maharashtra" value={form.state} onChange={e => setForm({...form, state: e.target.value})} />
                  </div>
                </div>
                <div className="input-group">
                  <label>Address</label>
                  <input type="text" className="input" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label>Phone</label>
                    <input type="text" className="input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                  </div>
                  <div className="input-group">
                    <label>Email</label>
                    <input type="email" className="input" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                  </div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.is_sez} onChange={e => setForm({...form, is_sez: e.target.checked})} />
                  <span style={{ fontSize: '0.875rem' }}>This client is located in an SEZ (Special Economic Zone)</span>
                </label>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Client</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';
import { useState, useEffect } from 'react';
import { getSupabase } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '', hsn_sac: '', rate: 0, tax_percent: 18, unit: 'Nos', stock: 0
  });

  async function loadProducts() {
    try {
      const supabase = getSupabase();
      const { data } = await supabase.from('products').select('*').order('name');
      setProducts(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadProducts(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('products').insert([{ ...form, user_id: user.id }]);
      setModalOpen(false);
      setForm({ name: '', hsn_sac: '', rate: 0, tax_percent: 18, unit: 'Nos', stock: 0 });
      loadProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Product & Service Catalog</h3>
        <button onClick={() => setModalOpen(true)} className="btn btn-primary">
          + Add Item
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div className="spinner spinner-lg" />
        </div>
      ) : products.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📦</div>
            <h3>No Products or Services Saved</h3>
            <p>Save items to quickly add them to invoices.</p>
            <button onClick={() => setModalOpen(true)} className="btn btn-primary mt-4">
              + Add Item
            </button>
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>HSN / SAC</th>
                <th>Rate</th>
                <th>GST Rate</th>
                <th>Unit</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.name}</td>
                  <td style={{ fontFamily: 'monospace' }}>{p.hsn_sac || '-'}</td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(p.rate)}</td>
                  <td><span className="badge badge-info">{p.tax_percent}%</span></td>
                  <td>{p.unit}</td>
                  <td>{p.stock}</td>
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
              <h3>Add Product / Service</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="input-group">
                  <label>Item Name *</label>
                  <input type="text" className="input" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label>HSN / SAC Code</label>
                    <input type="text" className="input" placeholder="e.g. 9983" value={form.hsn_sac} onChange={e => setForm({...form, hsn_sac: e.target.value})} />
                  </div>
                  <div className="input-group">
                    <label>Unit</label>
                    <select className="select" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}>
                      <option value="Nos">Nos (Pieces)</option>
                      <option value="Hrs">Hrs (Hours)</option>
                      <option value="Kg">Kg (Kilograms)</option>
                      <option value="Ltr">Ltr (Liters)</option>
                      <option value="Mtr">Mtr (Meters)</option>
                      <option value="Box">Box</option>
                      <option value="Set">Set</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label>Rate / Price (₹) *</label>
                    <input type="number" step="0.01" className="input" required value={form.rate} onChange={e => setForm({...form, rate: Number(e.target.value)})} />
                  </div>
                  <div className="input-group">
                    <label>GST Rate (%)</label>
                    <select className="select" value={form.tax_percent} onChange={e => setForm({...form, tax_percent: Number(e.target.value)})}>
                      <option value={0}>0% (Nil Rated)</option>
                      <option value={5}>5%</option>
                      <option value={12}>12%</option>
                      <option value={18}>18% (Standard)</option>
                      <option value={28}>28%</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadInvoices() {
      try {
        const supabase = getSupabase();
        const { data } = await supabase
          .from('invoices')
          .select('*')
          .order('created_at', { ascending: false });
        setInvoices(data || []);
      } catch (err) {
        console.error('Failed to load invoices:', err);
      } finally {
        setLoading(false);
      }
    }
    loadInvoices();
  }, []);

  const filteredInvoices = invoices.filter(inv => {
    const q = search.toLowerCase();
    return (
      (inv.invoice_number || '').toLowerCase().includes(q) ||
      (inv.client_name || '').toLowerCase().includes(q) ||
      (inv.client_gstin || '').toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <input
          type="text"
          className="input"
          placeholder="Search by invoice #, client name, or GSTIN..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: '360px' }}
        />
        <Link href="/invoices/new" className="btn btn-primary">
          + Create Invoice
        </Link>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div className="spinner spinner-lg" />
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🧾</div>
            <h3>No Invoices Found</h3>
            <p>{search ? 'No invoices match your search query.' : 'Get started by creating your first GST invoice.'}</p>
            {!search && (
              <Link href="/invoices/new" className="btn btn-primary mt-4">
                + Create Invoice
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Date</th>
                <th>Client</th>
                <th>GSTIN</th>
                <th>Type</th>
                <th>Subtotal</th>
                <th>Tax</th>
                <th>Grand Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map(inv => (
                <tr key={inv.id}>
                  <td style={{ fontWeight: 600 }}>{inv.invoice_number}</td>
                  <td>{inv.invoice_date}</td>
                  <td>{inv.client_name || 'Cash Sale'}</td>
                  <td style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>{inv.client_gstin || '-'}</td>
                  <td>{inv.invoice_type}</td>
                  <td>{formatCurrency(inv.subtotal, inv.currency)}</td>
                  <td>{formatCurrency((Number(inv.cgst) || 0) + (Number(inv.sgst) || 0) + (Number(inv.igst) || 0) + (Number(inv.cess) || 0), inv.currency)}</td>
                  <td style={{ fontWeight: 700 }}>{formatCurrency(inv.grand_total, inv.currency)}</td>
                  <td>
                    <span className={`badge badge-${inv.status === 'paid' ? 'success' : inv.status === 'partial' ? 'warning' : 'danger'}`}>
                      {inv.status || 'unpaid'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

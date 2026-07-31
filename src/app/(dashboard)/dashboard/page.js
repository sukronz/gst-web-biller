'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalTax: 0,
    invoiceCount: 0,
    clientCount: 0,
  });
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const supabase = getSupabase();
        
        // Fetch invoices
        const { data: invoices } = await supabase
          .from('invoices')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);

        // Fetch stats
        const { data: allInvoices } = await supabase
          .from('invoices')
          .select('grand_total, cgst, sgst, igst, cess');

        const { count: clientCount } = await supabase
          .from('clients')
          .select('*', { count: 'exact', head: true });

        const rev = (allInvoices || []).reduce((acc, inv) => acc + (Number(inv.grand_total) || 0), 0);
        const tax = (allInvoices || []).reduce((acc, inv) => acc + (Number(inv.cgst) || 0) + (Number(inv.sgst) || 0) + (Number(inv.igst) || 0) + (Number(inv.cess) || 0), 0);

        setStats({
          totalRevenue: rev,
          totalTax: tax,
          invoiceCount: (allInvoices || []).length,
          clientCount: clientCount || 0,
        });

        setRecentInvoices(invoices || []);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Stats overview */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Sales / Revenue</div>
          <div className="stat-value">{formatCurrency(stats.totalRevenue)}</div>
          <div className="stat-change positive">From {stats.invoiceCount} invoices</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Tax Collected</div>
          <div className="stat-value">{formatCurrency(stats.totalTax)}</div>
          <div className="stat-change positive">CGST + SGST + IGST</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Invoices</div>
          <div className="stat-value">{stats.invoiceCount}</div>
          <div className="stat-change">Generated</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Clients</div>
          <div className="stat-value">{stats.clientCount}</div>
          <div className="stat-change">Saved in database</div>
        </div>
      </div>

      {/* Quick Actions & Recent Invoices */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3>Recent Invoices</h3>
          <Link href="/invoices" className="btn btn-ghost btn-sm">
            View All Invoices →
          </Link>
        </div>

        {recentInvoices.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📄</div>
            <h3>No Invoices Created Yet</h3>
            <p>Get started by creating your first GST invoice.</p>
            <Link href="/invoices/new" className="btn btn-primary mt-4">
              + Create First Invoice
            </Link>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Date</th>
                  <th>Client</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map(inv => (
                  <tr key={inv.id}>
                    <td style={{ fontWeight: 600 }}>{inv.invoice_number}</td>
                    <td>{inv.invoice_date}</td>
                    <td>{inv.client_name || 'Cash Sale'}</td>
                    <td>{inv.invoice_type}</td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(inv.grand_total, inv.currency)}</td>
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
    </div>
  );
}

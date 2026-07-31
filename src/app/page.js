import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="auth-page" style={{ flexDirection: 'column', gap: '2rem' }}>
      <div style={{ textAlign: 'center', maxWidth: '600px', animation: 'slideUp 0.5s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div className="auth-logo-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <h1 style={{ fontSize: '2rem' }}>GST Biller</h1>
        </div>
        <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', lineHeight: 1.7 }}>
          Create professional GST-compliant invoices, manage clients & products,
          track payments — all from your browser. <strong>100% free.</strong>
        </p>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
          Auto-calculates CGST / SGST / IGST · 5 invoice types · PDF download · Multi-currency · GSTR-1 / 3B ready
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/signup" className="btn btn-primary btn-lg" style={{ minWidth: '160px' }}>
            Get Started Free
          </Link>
          <Link href="/login" className="btn btn-secondary btn-lg" style={{ minWidth: '160px' }}>
            Sign In
          </Link>
        </div>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem', maxWidth: '700px', width: '100%', marginTop: '1rem',
        animation: 'fadeIn 0.7s ease 0.2s both'
      }}>
        {[
          { icon: '🧾', title: 'Tax Invoices', desc: 'CGST/SGST/IGST auto-calculated' },
          { icon: '👥', title: 'Client Ledger', desc: 'GSTIN validation & history' },
          { icon: '📦', title: 'Inventory', desc: 'HSN/SAC codes, auto-destock' },
          { icon: '📊', title: 'GST Returns', desc: 'GSTR-1/3B data & JSON export' },
        ].map(f => (
          <div key={f.title} className="card card-hover" style={{ textAlign: 'center', padding: '1.25rem' }}>
            <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{f.icon}</div>
            <h4 style={{ fontSize: '0.9375rem', marginBottom: '0.25rem' }}>{f.title}</h4>
            <p style={{ fontSize: '0.8125rem' }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

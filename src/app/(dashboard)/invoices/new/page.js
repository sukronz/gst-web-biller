'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase/client';
import { computeInvoiceTotals, formatCurrency } from '@/lib/utils';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export default function NewInvoicePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [invoiceType, setInvoiceType] = useState('Tax Invoice');
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now().toString().slice(-6)}`);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [placeOfSupply, setPlaceOfSupply] = useState('');

  const [items, setItems] = useState([
    { id: '1', name: '', hsn_sac: '', quantity: 1, unit: 'Nos', rate: 0, discount_percent: 0, tax_percent: 18, cess_percent: 0 }
  ]);

  const [notes, setNotes] = useState('Thank you for your business!');
  const [terms, setTerms] = useState('1. Payment due within 15 days.\n2. Goods once sold will not be taken back.');

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = getSupabase();
        const { data: prof } = await supabase.from('business_profiles').select('*').single();
        const { data: cli } = await supabase.from('clients').select('*').order('name');
        const { data: prod } = await supabase.from('products').select('*').order('name');

        if (prof) setProfile(prof);
        if (cli) setClients(cli);
        if (prod) setProducts(prod);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totals = computeInvoiceTotals(items, {
    businessState: profile?.state || '',
    clientState: selectedClient?.state || '',
    placeOfSupply,
    isSEZ: selectedClient?.is_sez || false,
  });

  const handleAddItem = () => {
    setItems([
      ...items,
      { id: String(Date.now()), name: '', hsn_sac: '', quantity: 1, unit: 'Nos', rate: 0, discount_percent: 0, tax_percent: 18, cess_percent: 0 }
    ]);
  };

  const handleRemoveItem = (id) => {
    if (items.length === 1) return;
    setItems(items.filter(it => it.id !== id));
  };

  const handleItemChange = (id, field, val) => {
    setItems(items.map(it => it.id === id ? { ...it, [field]: val } : it));
  };

  const handleProductSelect = (id, prodId) => {
    const p = products.find(prod => prod.id === prodId);
    if (!p) return;
    setItems(items.map(it => it.id === id ? {
      ...it,
      name: p.name,
      hsn_sac: p.hsn_sac || '',
      rate: Number(p.rate) || 0,
      tax_percent: Number(p.tax_percent) || 18,
      unit: p.unit || 'Nos'
    } : it));
  };

  const handleSaveInvoice = async () => {
    if (!profile?.business_name) {
      alert('Please fill out your Business Settings first before creating invoices.');
      router.push('/settings');
      return;
    }

    setSaving(true);
    try {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();

      const invoicePayload = {
        user_id: user.id,
        profile_id: profile?.id,
        client_id: selectedClient?.id || null,
        invoice_number: invoiceNumber,
        invoice_type: invoiceType,
        invoice_date: invoiceDate,
        status: 'unpaid',
        client_name: selectedClient?.name || 'Cash Customer',
        client_gstin: selectedClient?.gstin || '',
        client_address: selectedClient?.address || '',
        client_city: selectedClient?.city || '',
        client_state: selectedClient?.state || '',
        client_pin: selectedClient?.pin || '',
        client_country: selectedClient?.country || 'India',
        client_is_sez: selectedClient?.is_sez || false,
        subtotal: totals.subtotal,
        taxable_total: totals.taxable_total,
        cgst: totals.cgst,
        sgst: totals.sgst,
        igst: totals.igst,
        cess: totals.cess,
        round_off: totals.round_off,
        grand_total: totals.grand_total,
        amount_paid: 0,
        balance_due: totals.grand_total,
        place_of_supply: placeOfSupply || selectedClient?.state || '',
        notes,
        terms
      };

      const { data: inv, error: invErr } = await supabase
        .from('invoices')
        .insert([invoicePayload])
        .select()
        .single();

      if (invErr) throw invErr;

      const itemPayloads = totals.items.map((it, idx) => ({
        invoice_id: inv.id,
        user_id: user.id,
        sort_order: idx + 1,
        name: it.name || 'Item',
        hsn_sac: it.hsn_sac || '',
        quantity: Number(it.quantity) || 1,
        unit: it.unit || 'Nos',
        rate: Number(it.rate) || 0,
        discount_percent: Number(it.discount_percent) || 0,
        tax_percent: Number(it.tax_percent) || 18,
        cess_percent: Number(it.cess_percent) || 0,
        amount: Number(it.lineTotal) || 0
      }));

      await supabase.from('invoice_items').insert(itemPayloads);

      alert('Invoice created & saved successfully!');
      router.push('/invoices');
    } catch (err) {
      alert('Save error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    const el = document.getElementById('invoice-preview-area');
    if (!el) return;
    try {
      const canvas = await html2canvas(el, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, Math.min(imgHeight, pageHeight));
      pdf.save(`${invoiceNumber}.pdf`);
    } catch (err) {
      alert('PDF generation error: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Create New Invoice</h3>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="button" onClick={handleDownloadPDF} className="btn btn-secondary">
            📥 Preview PDF
          </button>
          <button type="button" onClick={handleSaveInvoice} disabled={saving} className="btn btn-primary">
            {saving ? <span className="spinner" /> : '✓ Save & Issue Invoice'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.5rem' }}>
        {/* Left: Invoice Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div className="input-group">
                <label>Invoice Type</label>
                <select className="select" value={invoiceType} onChange={e => setInvoiceType(e.target.value)}>
                  <option value="Tax Invoice">Tax Invoice</option>
                  <option value="Proforma Invoice">Proforma Invoice</option>
                  <option value="Bill of Supply">Bill of Supply</option>
                  <option value="Credit Note">Credit Note</option>
                  <option value="Delivery Challan">Delivery Challan</option>
                </select>
              </div>
              <div className="input-group">
                <label>Invoice #</label>
                <input type="text" className="input" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} />
              </div>
              <div className="input-group">
                <label>Date</label>
                <input type="date" className="input" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group">
                <label>Select Saved Client</label>
                <select className="select" onChange={e => {
                  const c = clients.find(cli => cli.id === e.target.value);
                  setSelectedClient(c || null);
                }}>
                  <option value="">-- Cash Sale / New Client --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name} {c.gstin ? `(${c.gstin})` : ''}</option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label>Place of Supply (State)</label>
                <input type="text" className="input" placeholder={selectedClient?.state || 'e.g. Maharashtra'} value={placeOfSupply} onChange={e => setPlaceOfSupply(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4>Line Items</h4>
              <button type="button" onClick={handleAddItem} className="btn btn-secondary btn-sm">
                + Add Item
              </button>
            </div>

            {items.map((item, idx) => (
              <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '0.75rem', alignItems: 'end' }}>
                  <div className="input-group">
                    <label>Description / Item</label>
                    {products.length > 0 && (
                      <select className="select" style={{ marginBottom: '0.375rem', fontSize: '0.8rem' }} onChange={e => handleProductSelect(item.id, e.target.value)}>
                        <option value="">-- Load from Product Catalog --</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name} (₹{p.rate})</option>)}
                      </select>
                    )}
                    <input type="text" className="input" placeholder="Item name" value={item.name} onChange={e => handleItemChange(item.id, 'name', e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>HSN/SAC</label>
                    <input type="text" className="input" placeholder="9983" value={item.hsn_sac} onChange={e => handleItemChange(item.id, 'hsn_sac', e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>Qty</label>
                    <input type="number" className="input" value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', Number(e.target.value))} />
                  </div>
                  <div className="input-group">
                    <label>Rate (₹)</label>
                    <input type="number" className="input" value={item.rate} onChange={e => handleItemChange(item.id, 'rate', Number(e.target.value))} />
                  </div>
                  <button type="button" className="btn btn-danger btn-sm btn-icon" onClick={() => handleRemoveItem(item.id)}>✕</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                  <div className="input-group">
                    <label>Tax %</label>
                    <select className="select" value={item.tax_percent} onChange={e => handleItemChange(item.id, 'tax_percent', Number(e.target.value))}>
                      <option value={0}>0%</option>
                      <option value={5}>5%</option>
                      <option value={12}>12%</option>
                      <option value={18}>18%</option>
                      <option value={28}>28%</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Discount %</label>
                    <input type="number" className="input" value={item.discount_percent} onChange={e => handleItemChange(item.id, 'discount_percent', Number(e.target.value))} />
                  </div>
                  <div className="input-group" style={{ justifyContent: 'center' }}>
                    <label>Amount</label>
                    <div style={{ fontWeight: 700, fontSize: '1rem', marginTop: '0.375rem' }}>
                      {formatCurrency(totals.items[idx]?.lineTotal || 0)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Live Summary & Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card">
            <h4 style={{ marginBottom: '1rem' }}>Calculation Summary</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal (Taxable):</span>
                <span style={{ fontWeight: 600 }}>{formatCurrency(totals.subtotal)}</span>
              </div>

              {totals.isInterstate ? (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>IGST (Integrated Tax):</span>
                  <span style={{ fontWeight: 600 }}>{formatCurrency(totals.igst)}</span>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>CGST (Central Tax):</span>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(totals.cgst)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>SGST (State Tax):</span>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(totals.sgst)}</span>
                  </div>
                </>
              )}

              {totals.round_off !== 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Round-off:</span>
                  <span>{totals.round_off}</span>
                </div>
              )}

              <div style={{ borderTop: '2px solid var(--border)', paddingTop: '0.75rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 800 }}>
                <span>Grand Total:</span>
                <span style={{ color: 'var(--primary)' }}>{formatCurrency(totals.grand_total)}</span>
              </div>
            </div>
          </div>

          {/* Printable Invoice Box */}
          <div id="invoice-preview-area" className="invoice-preview" style={{ border: '1px solid #ddd', borderRadius: '8px', background: '#fff', color: '#111' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '2px solid #333', paddingBottom: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#111' }}>{profile?.business_name || 'Your Business Name'}</h2>
                <div style={{ fontSize: '0.8rem', color: '#555' }}>{profile?.address}</div>
                <div style={{ fontSize: '0.8rem', color: '#555' }}>GSTIN: <strong>{profile?.gstin || '27AAAAA0000A1Z5'}</strong></div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h3 style={{ fontSize: '1.1rem', color: '#4f46e5', margin: 0 }}>{invoiceType.toUpperCase()}</h3>
                <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>#{invoiceNumber}</div>
                <div style={{ fontSize: '0.8rem' }}>Date: {invoiceDate}</div>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem', fontSize: '0.85rem' }}>
              <div style={{ fontWeight: 700, color: '#555' }}>BILL TO:</div>
              <div style={{ fontSize: '1rem', fontWeight: 700 }}>{selectedClient?.name || 'Cash Customer'}</div>
              <div>{selectedClient?.address}</div>
              <div>GSTIN: {selectedClient?.gstin || '-'}</div>
            </div>

            <table style={{ width: '100%', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #ccc' }}>
                  <th style={{ textAlign: 'left', padding: '6px' }}>Item</th>
                  <th style={{ textAlign: 'center', padding: '6px' }}>HSN</th>
                  <th style={{ textAlign: 'right', padding: '6px' }}>Qty</th>
                  <th style={{ textAlign: 'right', padding: '6px' }}>Rate</th>
                  <th style={{ textAlign: 'right', padding: '6px' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {totals.items.map((it, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '6px' }}>{it.name || 'Item'}</td>
                    <td style={{ textAlign: 'center', padding: '6px' }}>{it.hsn_sac || '-'}</td>
                    <td style={{ textAlign: 'right', padding: '6px' }}>{it.quantity}</td>
                    <td style={{ textAlign: 'right', padding: '6px' }}>₹{it.rate}</td>
                    <td style={{ textAlign: 'right', padding: '6px', fontWeight: 600 }}>₹{it.lineTotal?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ textAlign: 'right', fontSize: '0.9rem', fontWeight: 800, color: '#4f46e5' }}>
              Total Payable: {formatCurrency(totals.grand_total)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

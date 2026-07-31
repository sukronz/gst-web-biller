'use client';
import { useState, useEffect } from 'react';
import { getSupabase } from '@/lib/supabase/client';
import { verifyGSTINOnline } from '@/lib/gstin';

export default function SettingsPage() {
  const [profile, setProfile] = useState({
    business_name: '', gstin: '', pan: '', address: '', state: '', city: '', pin: '',
    phone: '', email: '', bank_name: '', account_number: '', ifsc: '', branch: '', upi_id: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);
  const [verifyingGstin, setVerifyingGstin] = useState(false);
  const [gstinMessage, setGstinMessage] = useState(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const supabase = getSupabase();
        const { data } = await supabase.from('business_profiles').select('*').single();
        if (data) setProfile(data);
      } catch (err) {
        console.log('No profile found yet');
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleVerifyGSTIN = async () => {
    if (!profile.gstin) {
      setGstinMessage({ type: 'error', text: 'Please enter a 15-character GSTIN to verify.' });
      return;
    }

    setVerifyingGstin(true);
    setGstinMessage(null);

    const result = await verifyGSTINOnline(profile.gstin);
    setVerifyingGstin(false);

    if (result.valid) {
      const name = result.tradeName || result.legalName;
      setGstinMessage({
        type: 'success',
        text: `✓ Verified (${result.status || 'Active'}). Details auto-filled!`
      });

      setProfile(prev => ({
        ...prev,
        business_name: name || prev.business_name,
        pan: result.pan || prev.pan,
        state: result.state || prev.state,
        city: result.city || prev.city,
        address: result.address || prev.address,
        pin: result.pincode || prev.pin
      }));
    } else {
      setGstinMessage({
        type: 'error',
        text: result.error || 'Invalid GSTIN format or checksum.'
      });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();

      if (profile.id) {
        await supabase.from('business_profiles').update(profile).eq('id', profile.id);
      } else {
        const { data } = await supabase.from('business_profiles').insert([{ ...profile, user_id: user.id }]).select().single();
        if (data) setProfile(data);
      }

      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 3000);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
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
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h3>Business Settings & Profile</h3>

      {savedMessage && (
        <div className="toast toast-success" style={{ position: 'static' }}>
          ✓ Business profile updated successfully!
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Business details */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h4>Business Identity</h4>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label>GSTIN</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="input"
                  value={profile.gstin}
                  onChange={e => setProfile({...profile, gstin: e.target.value.toUpperCase()})}
                  placeholder="27AAAAA0000A1Z5"
                  maxLength={15}
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleVerifyGSTIN}
                  disabled={verifyingGstin || !profile.gstin}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {verifyingGstin ? 'Verifying...' : 'Verify'}
                </button>
              </div>
              {gstinMessage && (
                <span style={{
                  fontSize: '0.75rem',
                  marginTop: '0.25rem',
                  color: gstinMessage.type === 'success' ? 'var(--success)' : 'var(--danger)',
                  fontWeight: 600
                }}>
                  {gstinMessage.text}
                </span>
              )}
            </div>
            <div className="input-group">
              <label>PAN Number</label>
              <input type="text" className="input" value={profile.pan} onChange={e => setProfile({...profile, pan: e.target.value.toUpperCase()})} placeholder="AAAAA0000A" />
            </div>
          </div>

          <div className="input-group">
            <label>Business Name *</label>
            <input type="text" className="input" required value={profile.business_name} onChange={e => setProfile({...profile, business_name: e.target.value})} placeholder="Acme Technologies Pvt Ltd" />
          </div>

          <div className="input-group">
            <label>Address</label>
            <input type="text" className="input" value={profile.address} onChange={e => setProfile({...profile, address: e.target.value})} placeholder="Street / Premises / Office" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label>State *</label>
              <input type="text" className="input" required value={profile.state} onChange={e => setProfile({...profile, state: e.target.value})} placeholder="e.g. Maharashtra" />
            </div>
            <div className="input-group">
              <label>City</label>
              <input type="text" className="input" value={profile.city} onChange={e => setProfile({...profile, city: e.target.value})} />
            </div>
            <div className="input-group">
              <label>Pincode</label>
              <input type="text" className="input" value={profile.pin} onChange={e => setProfile({...profile, pin: e.target.value})} />
            </div>
          </div>
        </div>

        {/* Bank & Payment Info */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h4>Bank & UPI Details (Printed on Invoices)</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label>Bank Name</label>
              <input type="text" className="input" value={profile.bank_name} onChange={e => setProfile({...profile, bank_name: e.target.value})} placeholder="HDFC Bank" />
            </div>
            <div className="input-group">
              <label>Account Number</label>
              <input type="text" className="input" value={profile.account_number} onChange={e => setProfile({...profile, account_number: e.target.value})} placeholder="5010000000000" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label>IFSC Code</label>
              <input type="text" className="input" value={profile.ifsc} onChange={e => setProfile({...profile, ifsc: e.target.value.toUpperCase()})} placeholder="HDFC0000123" />
            </div>
            <div className="input-group">
              <label>UPI ID (for Payment QR)</label>
              <input type="text" className="input" value={profile.upi_id} onChange={e => setProfile({...profile, upi_id: e.target.value})} placeholder="merchant@upi" />
            </div>
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
          {saving ? <span className="spinner" /> : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}

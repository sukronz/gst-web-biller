// GSTIN Verification and State Code mapping for Indian GST

export const STATE_CODES = {
  '01': 'Jammu and Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '25': 'Dadra and Nagar Haveli and Daman and Diu',
  '26': 'Dadra and Nagar Haveli and Daman and Diu',
  '27': 'Maharashtra',
  '28': 'Andhra Pradesh',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman and Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh',
  '38': 'Ladakh'
};

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export function validateGSTINFormat(gstin) {
  if (!gstin || typeof gstin !== 'string') return false;
  const clean = gstin.trim().toUpperCase();
  return GSTIN_REGEX.test(clean);
}

export function getStateFromGSTIN(gstin) {
  if (!gstin || gstin.length < 2) return '';
  const code = gstin.substring(0, 2);
  return STATE_CODES[code] || '';
}

export function validateGSTINChecksum(gstin) {
  if (!validateGSTINFormat(gstin)) return false;
  const clean = gstin.trim().toUpperCase();
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const charVal = chars.indexOf(clean[i]);
    if (charVal === -1) return false;
    const factor = (i % 2 === 0) ? 1 : 2;
    const prod = charVal * factor;
    sum += Math.floor(prod / 36) + (prod % 36);
  }
  
  const checkCodeIndex = (36 - (sum % 36)) % 36;
  const expectedCheckChar = chars[checkCodeIndex];
  return clean[14] === expectedCheckChar;
}

export async function verifyGSTINOnline(gstin) {
  const clean = gstin.trim().toUpperCase();

  // 1. Format check
  if (!validateGSTINFormat(clean)) {
    return {
      valid: false,
      error: 'Invalid GSTIN format. Expected 15 characters (e.g. 27AAAAA0000A1Z5).'
    };
  }

  const detectedState = getStateFromGSTIN(clean);
  const isChecksumValid = validateGSTINChecksum(clean);
  const extractedPan = clean.length >= 12 ? clean.substring(2, 12) : '';

  // 2. Fetch online details from public GST API with timeout fallback
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(`https://sheet.gstincheck.co.in/api/v1/check/${clean}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.flag && data.data) {
        const details = data.data;
        const addressObj = details.pradr?.addr || {};
        const fullAddr = [
          addressObj.bno, addressObj.st, addressObj.loc
        ].filter(Boolean).join(', ');

        return {
          valid: true,
          gstin: clean,
          pan: extractedPan,
          tradeName: details.tradeNam || details.lgnm || '',
          legalName: details.lgnm || details.tradeNam || '',
          state: detectedState || details.pradr?.addr?.stcd || '',
          city: addressObj.dst || addressObj.loc || '',
          address: fullAddr || '',
          pincode: addressObj.pn || '',
          status: details.sts || 'Active',
          taxpayerType: details.dty || 'Regular',
          isSEZ: (details.dty || '').toLowerCase().includes('sez'),
          source: 'live_api'
        };
      }
    }
  } catch (err) {
    console.warn('Online GSTIN lookup fallback to offline verification:', err);
  }

  // 3. Fallback to offline structural verification if API is unreachable
  return {
    valid: isChecksumValid,
    gstin: clean,
    pan: extractedPan,
    tradeName: '',
    legalName: '',
    state: detectedState,
    city: '',
    address: '',
    pincode: '',
    status: isChecksumValid ? 'Verified Format' : 'Invalid Checksum',
    taxpayerType: 'Regular',
    isSEZ: false,
    source: 'offline_verification'
  };
}

// HSN (Goods) and SAC (Services) Directory & Verification Utility for Indian GST

export const HSN_SAC_DIRECTORY = {
  // --- SAC CODES (Services - Chapter 99) ---
  '9983': { description: 'IT Infrastructure, Software & Consulting Services', rate: 18, type: 'Services' },
  '998311': { description: 'IT Design and Development Services', rate: 18, type: 'Services' },
  '998312': { description: 'Business Applications & Software Support', rate: 18, type: 'Services' },
  '998313': { description: 'Domain, Hosting, Cloud & Network Management', rate: 18, type: 'Services' },
  '998314': { description: 'System Integration & Technical Support Services', rate: 18, type: 'Services' },
  '998315': { description: 'Cybersecurity & Data Management Services', rate: 18, type: 'Services' },
  '9984': { description: 'Telecommunication, Broadcasting & Data Transmission', rate: 18, type: 'Services' },
  '9982': { description: 'Legal, Accounting & Auditing Services', rate: 18, type: 'Services' },
  '9985': { description: 'Advertising, Marketing & Public Relations', rate: 18, type: 'Services' },
  '9987': { description: 'Maintenance, Repair & Installation Services', rate: 18, type: 'Services' },
  '9997': { description: 'Other Miscellaneous Business & Personal Services', rate: 18, type: 'Services' },
  '9963': { description: 'Accommodation, Food & Beverage Services', rate: 5, type: 'Services' },

  // --- HSN CODES (Goods) ---
  '8471': { description: 'Computers, Laptops, Servers & Memory Units', rate: 18, type: 'Goods' },
  '84713010': { description: 'Personal Laptops & Portable Computers', rate: 18, type: 'Goods' },
  '8517': { description: 'Mobile Phones, Routers & Telecom Hardware', rate: 18, type: 'Goods' },
  '8528': { description: 'Computer Monitors, Projectors & Televisions', rate: 18, type: 'Goods' },
  '8443': { description: 'Printers, Scanners, Copiers & Ink Cartridges', rate: 18, type: 'Goods' },
  '8504': { description: 'UPS, Power Inverters & Transformers', rate: 18, type: 'Goods' },
  '9403': { description: 'Office Furniture, Desks, Chairs & Fixtures', rate: 18, type: 'Goods' },
  '4820': { description: 'Stationery, Registers, Notebooks & Office Supplies', rate: 12, type: 'Goods' },
  '3004': { description: 'Medicines & Pharmaceutical Products', rate: 12, type: 'Goods' },
  '6109': { description: 'T-Shirts, Apparel & Garments', rate: 5, type: 'Goods' },
  '2201': { description: 'Packaged Drinking Water & Mineral Water', rate: 18, type: 'Goods' },
  '0401': { description: 'Fresh Milk & Unpackaged Dairy Products', rate: 0, type: 'Goods' },
  '1006': { description: 'Rice, Grains & Pulses', rate: 5, type: 'Goods' }
};

export function verifyHSNCode(code) {
  if (!code || typeof code !== 'string') {
    return { valid: false, message: 'Please enter an HSN or SAC code.' };
  }

  const clean = code.trim().replace(/\s+/g, '');
  if (!/^\d{4,8}$/.test(clean)) {
    return {
      valid: false,
      message: 'HSN/SAC code must be 4, 6, or 8 digits (e.g. 9983 or 8471).'
    };
  }

  const isSAC = clean.startsWith('99');
  const exactMatch = HSN_SAC_DIRECTORY[clean];

  if (exactMatch) {
    return {
      valid: true,
      code: clean,
      description: exactMatch.description,
      recommendedRate: exactMatch.rate,
      type: exactMatch.type,
      isExact: true
    };
  }

  // Prefix fallback (e.g., 998311 fallback to 9983)
  const prefix4 = clean.substring(0, 4);
  const prefixMatch = HSN_SAC_DIRECTORY[prefix4];

  if (prefixMatch) {
    return {
      valid: true,
      code: clean,
      description: prefixMatch.description,
      recommendedRate: prefixMatch.rate,
      type: prefixMatch.type,
      isExact: false
    };
  }

  // Valid format fallback
  return {
    valid: true,
    code: clean,
    description: isSAC ? 'Services (Chapter 99 SAC Code)' : 'Goods (Standard HSN Code)',
    recommendedRate: 18,
    type: isSAC ? 'Services' : 'Goods',
    isExact: false
  };
}

// GST Calculation and formatting utilities for GST Biller Web

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

export const UNION_TERRITORIES = [
  'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Ladakh', 'Lakshadweep'
];

export function formatCurrency(amount, currency = 'INR') {
  const val = Number(amount) || 0;
  if (currency === 'INR') {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(val);
}

export function computeInvoiceTotals(items = [], options = {}) {
  const {
    businessState = '',
    clientState = '',
    placeOfSupply = '',
    isSEZ = false,
    invoiceDiscountValue = 0,
    invoiceDiscountType = 'fixed',
  } = options;

  const effectiveClientState = placeOfSupply || clientState;
  const isInterstate = isSEZ || (businessState && effectiveClientState && businessState.trim().toLowerCase() !== effectiveClientState.trim().toLowerCase());
  const isUTGST = !isInterstate && UNION_TERRITORIES.some(ut => ut.toLowerCase() === businessState.trim().toLowerCase());

  let subtotal = 0;
  let taxTotal = 0;
  let cessTotal = 0;

  const processedItems = items.map(item => {
    const qty = Number(item.quantity) || 0;
    const rate = Number(item.rate) || 0;
    const discPct = Number(item.discount_percent) || 0;
    const taxPct = Number(item.tax_percent) || 0;
    const cessPct = Number(item.cess_percent) || 0;

    const baseAmount = qty * rate;
    const discountAmount = baseAmount * (discPct / 100);
    const taxable = baseAmount - discountAmount;
    const taxAmount = taxable * (taxPct / 100);
    const cessAmount = taxable * (cessPct / 100);
    const lineTotal = taxable + taxAmount + cessAmount;

    subtotal += taxable;
    taxTotal += taxAmount;
    cessTotal += cessAmount;

    return {
      ...item,
      baseAmount,
      discountAmount,
      taxable,
      taxAmount,
      cessAmount,
      lineTotal
    };
  });

  let cgst = 0;
  let sgst = 0;
  let utgst = 0;
  let igst = 0;

  if (isInterstate) {
    igst = taxTotal;
  } else if (isUTGST) {
    cgst = taxTotal / 2;
    utgst = taxTotal / 2;
  } else {
    cgst = taxTotal / 2;
    sgst = taxTotal / 2;
  }

  let billDiscount = 0;
  if (invoiceDiscountType === 'percent') {
    billDiscount = (subtotal + taxTotal) * ((Number(invoiceDiscountValue) || 0) / 100);
  } else {
    billDiscount = Number(invoiceDiscountValue) || 0;
  }

  const netBeforeRound = subtotal + taxTotal + cessTotal - billDiscount;
  const roundedGrandTotal = Math.round(netBeforeRound);
  const roundOff = Number((roundedGrandTotal - netBeforeRound).toFixed(2));

  return {
    items: processedItems,
    subtotal: Number(subtotal.toFixed(2)),
    taxable_total: Number(subtotal.toFixed(2)),
    tax_total: Number(taxTotal.toFixed(2)),
    cgst: Number(cgst.toFixed(2)),
    sgst: Number(sgst.toFixed(2)),
    utgst: Number(utgst.toFixed(2)),
    igst: Number(igst.toFixed(2)),
    cess: Number(cessTotal.toFixed(2)),
    discount_total: Number(billDiscount.toFixed(2)),
    round_off: roundOff,
    grand_total: roundedGrandTotal,
    isInterstate,
    isUTGST
  };
}

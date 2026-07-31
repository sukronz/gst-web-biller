import './globals.css';

export const metadata = {
  title: 'GST Biller — Free GST Invoice & Billing Software',
  description: 'Create GST-compliant invoices, manage clients, track payments, and file GSTR-1/3B — all for free. No signup required for the desktop version. Cloud version with login for access from anywhere.',
  keywords: 'GST invoice, billing software, free GST software, GSTR-1, GSTR-3B, India, tax invoice',
  icons: {
    icon: '/icon.svg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

# GST Biller Web App — Agent Handoff & Architecture Report

**Application:** GST Biller Cloud Web App (`gst-biller-web`)  
**Repository Location:** `/Users/sxm/Desktop/gst-biller-web`  
**Tech Stack:** Next.js 16 (App Router), React 19, Supabase (Auth, Postgres DB, RLS), Vanilla CSS Design System, jsPDF, html2canvas, Lucide React.  
**Build Status:** 🟢 **PASS** (`npm run build` completed cleanly in 1.6s).

---

## 1. What Was Completed in This Session

1. **Scaffolded Next.js 16 App Router Project**:
   - Initialized at `/Users/sxm/Desktop/gst-biller-web` (sibling repository).
   - Configured `.gitignore`, `package.json`, environment variables template (`.env.local.example`).
   - Installed core dependencies: `@supabase/supabase-js`, `@supabase/ssr`, `jspdf`, `html2canvas`, `lucide-react`, `dompurify`, `qrcode`.

2. **Supabase Database Schema & RLS Policies**:
   - Created PostgreSQL migration: [`supabase/migrations/001_initial_schema.sql`](file:///Users/sxm/Desktop/gst-biller-web/supabase/migrations/001_initial_schema.sql).
   - Defined 8 core tables: `business_profiles`, `clients`, `products`, `invoices`, `invoice_items`, `payments`, `invoice_settings`, `user_preferences`.
   - Enabled Row Level Security (RLS) policies on all tables (`auth.uid() = user_id`) for strict multi-tenancy.
   - Added indexes and `updated_at` trigger functions.

3. **Design System & Styling**:
   - Built custom CSS design system: [`src/app/globals.css`](file:///Users/sxm/Desktop/gst-biller-web/src/app/globals.css) with Indigo/Slate color palette, dark mode support (`[data-theme="dark"]`), CSS grid/flex utilities, cards, buttons, modals, input groups, badges, tables, toasts, skeleton loaders, and responsive breakpoints.

4. **Authentication & Session Management**:
   - Supabase SSR integration:
     - [`src/lib/supabase/client.js`](file:///Users/sxm/Desktop/gst-biller-web/src/lib/supabase/client.js) (Browser client singleton)
     - [`src/lib/supabase/server.js`](file:///Users/sxm/Desktop/gst-biller-web/src/lib/supabase/server.js) (Server component client)
     - [`src/middleware.js`](file:///Users/sxm/Desktop/gst-biller-web/src/middleware.js) (Route protection middleware)
     - [`src/app/auth/callback/route.js`](file:///Users/sxm/Desktop/gst-biller-web/src/app/auth/callback/route.js) (OAuth / Email confirmation code exchange)
   - Created Auth Pages:
     - [`src/app/login/page.js`](file:///Users/sxm/Desktop/gst-biller-web/src/app/login/page.js) (Email/password + Google OAuth)
     - [`src/app/signup/page.js`](file:///Users/sxm/Desktop/gst-biller-web/src/app/signup/page.js) (Registration + Email verification)
     - [`src/app/forgot-password/page.js`](file:///Users/sxm/Desktop/gst-biller-web/src/app/forgot-password/page.js) (Password reset)

5. **Core Application Views & Logic**:
   - **GST Calculation Engine**: [`src/lib/utils.js`](file:///Users/sxm/Desktop/gst-biller-web/src/lib/utils.js) (Ported `computeInvoiceTotals` supporting CGST, SGST, UTGST, IGST, SEZ, place-of-supply override, and round-off math).
   - **Dashboard Shell**: [`src/app/(dashboard)/layout.js`](file:///Users/sxm/Desktop/gst-biller-web/src/app/(dashboard)/layout.js) (Sidebar, header, user avatar, logout).
   - **Dashboard Home**: [`src/app/(dashboard)/dashboard/page.js`](file:///Users/sxm/Desktop/gst-biller-web/src/app/(dashboard)/dashboard/page.js) (Revenue cards, tax total, recent invoices).
   - **Invoice Generator**: [`src/app/(dashboard)/invoices/new/page.js`](file:///Users/sxm/Desktop/gst-biller-web/src/app/(dashboard)/invoices/new/page.js) (Line items table, product load, dynamic tax calculation, Supabase database insert, HTML5/canvas A4 PDF download).
   - **Invoices Directory**: [`src/app/(dashboard)/invoices/page.js`](file:///Users/sxm/Desktop/gst-biller-web/src/app/(dashboard)/invoices/page.js) (Searchable invoice table with status badges).
   - **Clients Directory**: [`src/app/(dashboard)/clients/page.js`](file:///Users/sxm/Desktop/gst-biller-web/src/app/(dashboard)/clients/page.js) (Client management modal with GSTIN & SEZ flag).
   - **Products Directory**: [`src/app/(dashboard)/products/page.js`](file:///Users/sxm/Desktop/gst-biller-web/src/app/(dashboard)/products/page.js) (Product & HSN/SAC catalog modal).
   - **Settings View**: [`src/app/(dashboard)/settings/page.js`](file:///Users/sxm/Desktop/gst-biller-web/src/app/(dashboard)/settings/page.js) (Business GSTIN, PAN, bank accounts, UPI ID).

---

## 2. Instructions for the Next Agent

### Step 1: Connecting Supabase Backend
1. Create a project at [supabase.com](https://supabase.com).
2. Run the SQL script [`supabase/migrations/001_initial_schema.sql`](file:///Users/sxm/Desktop/gst-biller-web/supabase/migrations/001_initial_schema.sql) in the Supabase SQL Editor.
3. Copy your `SUPABASE_URL` and `SUPABASE_ANON_KEY` into `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

### Step 2: Future Roadmap Tasks to Implement (Phase 2 & 3)
- [ ] **Payment Receipt Management**: Implement payment recording modal on invoices (`payments` table) and PDF receipt voucher download.
- [ ] **GSTR-1 & GSTR-3B JSON Exports**: Port the GSTR-1 B2B / B2C / HSN summary JSON generator from desktop `GSTReturns.jsx`.
- [ ] **Multi-Currency Support**: Expand `currency` selector on invoices to support 22 foreign currencies with exchange rates.
- [ ] **Recurring Invoices**: Add background cron / Edge Function or schedule job to auto-generate recurring bills from `recurring_templates`.
- [ ] **Logo & Signature Uploads**: Add Supabase Storage bucket (`business-assets`) for uploading business logos and digital signatures.

---

## 3. How to Run & Verify

```bash
cd /Users/sxm/Desktop/gst-biller-web

# Development Server
npm run dev

# Production Build
npm run build
```

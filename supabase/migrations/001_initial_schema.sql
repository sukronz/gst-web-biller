-- =============================================
-- GST Biller Web — Supabase Database Schema
-- Run this in Supabase SQL Editor → New query
-- =============================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- =============================================
-- BUSINESS PROFILES
-- =============================================
create table public.business_profiles (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  business_name text not null default '',
  address text default '',
  city text default '',
  state text default '',
  pin text default '',
  country text default 'India',
  gstin text default '',
  pan text default '',
  phone text default '',
  email text default '',
  website text default '',
  logo_url text default '',
  signature_url text default '',
  bank_name text default '',
  account_number text default '',
  ifsc text default '',
  branch text default '',
  upi_id text default '',
  is_default boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =============================================
-- CLIENTS
-- =============================================
create table public.clients (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  profile_id uuid references public.business_profiles(id) on delete cascade,
  name text not null default '',
  address text default '',
  city text default '',
  state text default '',
  pin text default '',
  country text default 'India',
  gstin text default '',
  email text default '',
  phone text default '',
  is_sez boolean default false,
  notes text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =============================================
-- PRODUCTS / SERVICES
-- =============================================
create table public.products (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  profile_id uuid references public.business_profiles(id) on delete cascade,
  name text not null default '',
  hsn_sac text default '',
  rate numeric(12,2) default 0,
  tax_percent numeric(5,2) default 18,
  unit text default 'Nos',
  stock numeric(10,2) default 0,
  category text default '',
  description text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =============================================
-- INVOICES
-- =============================================
create table public.invoices (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  profile_id uuid references public.business_profiles(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,

  -- Invoice metadata
  invoice_number text not null default '',
  invoice_type text default 'Tax Invoice',
  invoice_date date default current_date,
  due_date date,
  status text default 'unpaid',
  
  -- Client snapshot (denormalized for PDF accuracy even if client edited later)
  client_name text default '',
  client_gstin text default '',
  client_address text default '',
  client_city text default '',
  client_state text default '',
  client_pin text default '',
  client_country text default 'India',
  client_is_sez boolean default false,

  -- Totals (computed on save)
  subtotal numeric(14,2) default 0,
  discount_total numeric(14,2) default 0,
  taxable_total numeric(14,2) default 0,
  cgst numeric(14,2) default 0,
  sgst numeric(14,2) default 0,
  igst numeric(14,2) default 0,
  cess numeric(14,2) default 0,
  round_off numeric(6,2) default 0,
  grand_total numeric(14,2) default 0,
  amount_paid numeric(14,2) default 0,
  balance_due numeric(14,2) default 0,

  -- Options
  currency text default 'INR',
  place_of_supply text default '',
  reverse_charge boolean default false,
  notes text default '',
  terms text default '',
  internal_notes text default '',

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =============================================
-- INVOICE LINE ITEMS
-- =============================================
create table public.invoice_items (
  id uuid default uuid_generate_v4() primary key,
  invoice_id uuid references public.invoices(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  sort_order integer default 0,
  name text default '',
  hsn_sac text default '',
  quantity numeric(10,3) default 1,
  unit text default 'Nos',
  rate numeric(12,2) default 0,
  discount_percent numeric(5,2) default 0,
  tax_percent numeric(5,2) default 18,
  cess_percent numeric(5,2) default 0,
  amount numeric(14,2) default 0,
  created_at timestamptz default now()
);

-- =============================================
-- PAYMENTS
-- =============================================
create table public.payments (
  id uuid default uuid_generate_v4() primary key,
  invoice_id uuid references public.invoices(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  amount numeric(14,2) not null default 0,
  payment_date date default current_date,
  mode text default 'cash',
  reference text default '',
  notes text default '',
  created_at timestamptz default now()
);

-- =============================================
-- INVOICE NUMBER SETTINGS
-- =============================================
create table public.invoice_settings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  profile_id uuid references public.business_profiles(id) on delete cascade,
  prefix text default 'INV',
  separator text default '/',
  show_fin_year boolean default true,
  pad_digits integer default 4,
  next_number integer default 1,
  unique(user_id, profile_id)
);

-- =============================================
-- USER PREFERENCES
-- =============================================
create table public.user_preferences (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  theme text default 'light',
  region_mode text default 'india',
  onboarded boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =============================================
-- INDEXES for performance
-- =============================================
create index idx_profiles_user on public.business_profiles(user_id);
create index idx_clients_user on public.clients(user_id);
create index idx_clients_profile on public.clients(profile_id);
create index idx_products_user on public.products(user_id);
create index idx_products_profile on public.products(profile_id);
create index idx_invoices_user on public.invoices(user_id);
create index idx_invoices_profile on public.invoices(profile_id);
create index idx_invoices_client on public.invoices(client_id);
create index idx_invoices_status on public.invoices(status);
create index idx_invoices_date on public.invoices(invoice_date desc);
create index idx_invoice_items_invoice on public.invoice_items(invoice_id);
create index idx_payments_invoice on public.payments(invoice_id);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Enable RLS on all tables
alter table public.business_profiles enable row level security;
alter table public.clients enable row level security;
alter table public.products enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.payments enable row level security;
alter table public.invoice_settings enable row level security;
alter table public.user_preferences enable row level security;

-- Policies: users can only access their own data
create policy "Users can view own profiles" on public.business_profiles for select using (auth.uid() = user_id);
create policy "Users can insert own profiles" on public.business_profiles for insert with check (auth.uid() = user_id);
create policy "Users can update own profiles" on public.business_profiles for update using (auth.uid() = user_id);
create policy "Users can delete own profiles" on public.business_profiles for delete using (auth.uid() = user_id);

create policy "Users can view own clients" on public.clients for select using (auth.uid() = user_id);
create policy "Users can insert own clients" on public.clients for insert with check (auth.uid() = user_id);
create policy "Users can update own clients" on public.clients for update using (auth.uid() = user_id);
create policy "Users can delete own clients" on public.clients for delete using (auth.uid() = user_id);

create policy "Users can view own products" on public.products for select using (auth.uid() = user_id);
create policy "Users can insert own products" on public.products for insert with check (auth.uid() = user_id);
create policy "Users can update own products" on public.products for update using (auth.uid() = user_id);
create policy "Users can delete own products" on public.products for delete using (auth.uid() = user_id);

create policy "Users can view own invoices" on public.invoices for select using (auth.uid() = user_id);
create policy "Users can insert own invoices" on public.invoices for insert with check (auth.uid() = user_id);
create policy "Users can update own invoices" on public.invoices for update using (auth.uid() = user_id);
create policy "Users can delete own invoices" on public.invoices for delete using (auth.uid() = user_id);

create policy "Users can view own invoice items" on public.invoice_items for select using (auth.uid() = user_id);
create policy "Users can insert own invoice items" on public.invoice_items for insert with check (auth.uid() = user_id);
create policy "Users can update own invoice items" on public.invoice_items for update using (auth.uid() = user_id);
create policy "Users can delete own invoice items" on public.invoice_items for delete using (auth.uid() = user_id);

create policy "Users can view own payments" on public.payments for select using (auth.uid() = user_id);
create policy "Users can insert own payments" on public.payments for insert with check (auth.uid() = user_id);
create policy "Users can update own payments" on public.payments for update using (auth.uid() = user_id);
create policy "Users can delete own payments" on public.payments for delete using (auth.uid() = user_id);

create policy "Users can view own settings" on public.invoice_settings for select using (auth.uid() = user_id);
create policy "Users can insert own settings" on public.invoice_settings for insert with check (auth.uid() = user_id);
create policy "Users can update own settings" on public.invoice_settings for update using (auth.uid() = user_id);

create policy "Users can view own preferences" on public.user_preferences for select using (auth.uid() = user_id);
create policy "Users can insert own preferences" on public.user_preferences for insert with check (auth.uid() = user_id);
create policy "Users can update own preferences" on public.user_preferences for update using (auth.uid() = user_id);

-- =============================================
-- UPDATED_AT trigger function
-- =============================================
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on public.business_profiles for each row execute function public.update_updated_at();
create trigger set_updated_at before update on public.clients for each row execute function public.update_updated_at();
create trigger set_updated_at before update on public.products for each row execute function public.update_updated_at();
create trigger set_updated_at before update on public.invoices for each row execute function public.update_updated_at();
create trigger set_updated_at before update on public.user_preferences for each row execute function public.update_updated_at();

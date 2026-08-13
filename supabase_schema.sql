-- ==========================================
-- SQL Schema for Birthday Quest Database
-- Execute this script in your Supabase SQL Editor
-- ==========================================

-- 1. Create Profiles Table (Linked to Supabase Auth)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  coins bigint default 50000 check (coins >= 0),
  lifetime_earned bigint default 50000 check (lifetime_earned >= 0),
  lifetime_spent bigint default 0 check (lifetime_spent >= 0),
  daily_streak integer default 0 check (daily_streak >= 0),
  last_claim_date date,
  rerolls_remaining integer default 5 check (rerolls_remaining >= 0),
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;


-- Drop existing policies to prevent "already exists" errors on rerun
drop policy if exists "Allow public read profiles" on public.profiles;
drop policy if exists "Allow profile owner update" on public.profiles;
drop policy if exists "Allow profile owner insert" on public.profiles;
drop policy if exists "Allow profile owner read" on public.profiles;

drop policy if exists "Allow public read inventory" on public.inventory;
drop policy if exists "Allow inventory owner insert" on public.inventory;
drop policy if exists "Allow public update inventory" on public.inventory;
drop policy if exists "Allow inventory owner update" on public.inventory;
drop policy if exists "Allow inventory owner read" on public.inventory;

drop policy if exists "Allow transaction owner read" on public.transactions;
drop policy if exists "Allow transaction owner insert" on public.transactions;

-- Policies for Profiles
create policy "Allow public read profiles" 
  on public.profiles for select 
  using (true);

create policy "Allow profile owner update" 
  on public.profiles for update 
  using (auth.uid() = id);

create policy "Allow profile owner insert" 
  on public.profiles for insert 
  with check (auth.uid() = id);

-- 2. Create Inventory Table
create table if not exists public.inventory (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  reward_id text not null,
  redeemed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  claim_code text not null unique,
  status text default '🎁 Ready to Claim' not null
);

-- Enable RLS
alter table public.inventory enable row level security;

-- Policies for Inventory
create policy "Allow public read inventory" 
  on public.inventory for select 
  using (true);

create policy "Allow inventory owner insert" 
  on public.inventory for insert 
  with check (auth.uid() = user_id);

create policy "Allow public update inventory" 
  on public.inventory for update 
  using (true);

-- 3. Create Transactions Table (Win/Loss logs)
create table if not exists public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null,
  type text not null check (type in ('plus', 'minus')),
  amount bigint not null check (amount >= 0),
  balance_after bigint not null check (balance_after >= 0),
  reason text not null
);

-- Enable RLS
alter table public.transactions enable row level security;

-- Policies for Transactions
create policy "Allow transaction owner read" 
  on public.transactions for select 
  using (auth.uid() = user_id);

create policy "Allow transaction owner insert" 
  on public.transactions for insert 
  with check (auth.uid() = user_id);

-- 4. Trigger to automatically create a profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, coins, lifetime_earned, lifetime_spent, daily_streak, rerolls_remaining)
  values (new.id, new.email, 50000, 50000, 0, 0, 5);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger execution
drop trigger if exists on_auth_user_created on auth.users;
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

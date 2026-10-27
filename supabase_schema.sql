-- ========================================================
-- Rainbow Skin & Hair Clinic: Supabase Database Schema
-- Project ID: ygugxkvtftqhymrxgtgo
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ygugxkvtftqhymrxgtgo/sql
-- ========================================================

-- 1. Create Appointments Table
CREATE TABLE IF NOT EXISTS public.appointments (
    id TEXT PRIMARY KEY,
    reference TEXT NOT NULL UNIQUE,
    service_id TEXT NOT NULL,
    service_name TEXT NOT NULL,
    staff_id TEXT NOT NULL,
    staff_name TEXT NOT NULL,
    date DATE NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    price_inr NUMERIC NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_notes TEXT,
    status TEXT NOT NULL DEFAULT 'confirmed',
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Contact Messages Table
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- 4. Set RLS Policies to allow inserting and viewing bookings
CREATE POLICY "Allow public insert appointments" 
ON public.appointments 
FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

CREATE POLICY "Allow public select appointments" 
ON public.appointments 
FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "Allow public update appointments" 
ON public.appointments 
FOR UPDATE 
TO anon, authenticated 
USING (true);

CREATE POLICY "Allow public insert messages" 
ON public.contact_messages 
FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

CREATE POLICY "Allow public select messages" 
ON public.contact_messages 
FOR SELECT 
TO anon, authenticated 
USING (true);

-- 5. Realtime Publication (optional, for live updates in dashboard)
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;

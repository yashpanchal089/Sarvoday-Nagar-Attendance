-- Supabase Database Table Schema Setup
-- Run these queries in the "SQL Editor" section of your Supabase Dashboard.

-- 1. Create users profile table (linked with Supabase Auth users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create yuvaks (youth members) table
CREATE TABLE IF NOT EXISTS yuvaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    photo_url TEXT,
    first_name TEXT NOT NULL,
    middle_name TEXT,
    last_name TEXT NOT NULL,
    dob DATE NOT NULL,
    age INTEGER,
    mobile TEXT NOT NULL,
    occupation TEXT CHECK (occupation IN ('Student', 'Job', 'Business', 'Other')),
    address TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create attendance logging table
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    yuvak_id UUID NOT NULL REFERENCES yuvaks(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Present', 'Absent')),
    marked_by TEXT NOT NULL, -- Stores coordinator email
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_yuvak_date UNIQUE (yuvak_id, attendance_date)
);

-- 4. Create activities audit log table (optional tracker)
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_name TEXT,
    type TEXT,
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Row-Level Security: Disable RLS for ease of integration in this setup
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE yuvaks DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE activities DISABLE ROW LEVEL SECURITY;

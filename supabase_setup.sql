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

-- MIGRATION NOTE: If your 'yuvaks' table already exists, execute this query in your Supabase SQL Editor:
-- ALTER TABLE yuvaks ADD COLUMN IF NOT EXISTS occupation_spec TEXT;

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
    occupation_spec TEXT,
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

-- 5. Row-Level Security (RLS) Setup
-- Choose ONE of the options below:

-- =========================================================================
-- OPTION A: Enable RLS and define secure policies (Recommended for Production)
-- =========================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE yuvaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Policies for "users" table (linked to Auth)
-- 1. Allow users to insert their own profile during registration/signup
CREATE POLICY "Allow insert for self registration" ON users 
    FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- 2. Allow authenticated users to view profiles
CREATE POLICY "Allow select for authenticated users" ON users 
    FOR SELECT 
    TO authenticated 
    USING (true);

-- 3. Allow users to update their own profile
CREATE POLICY "Allow update for self" ON users 
    FOR UPDATE 
    USING (auth.uid() = id);

-- Policies for "yuvaks" table
-- Allow authenticated coordinators to perform all operations
CREATE POLICY "Allow all actions on yuvaks for coordinators" ON yuvaks 
    FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

-- Policies for "attendance" table
-- Allow authenticated coordinators to mark and read attendance
CREATE POLICY "Allow all actions on attendance for coordinators" ON attendance 
    FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

-- Policies for "activities" table
-- Allow authenticated users to insert and view activities
CREATE POLICY "Allow all actions on activities for coordinators" ON activities 
    FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);


-- =========================================================================
-- OPTION B: Disable RLS entirely (Easier for local development/testing)
-- =========================================================================
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE yuvaks DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE activities DISABLE ROW LEVEL SECURITY;


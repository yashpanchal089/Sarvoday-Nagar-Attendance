# Sarvoday Nagar Attendance System (SNYM)

A modern, high-performance attendance tracking and member management web application built for the **Sarvoday Nagar Yuvak Mandal** (SNYM) coordinators and volunteers.

This app is optimized for both mobile and desktop screens to allow rapid registration of youth members (Yuvaks), quick attendance marking during sabhas, weekly attendance logs tracking, and automated birthday reminders.

---

## 🚀 Key Features

*   **📊 Live Dashboard**: Instant insights with visual charts (Present vs Absent, Weekly/Monthly Trends) and performance tracking tables (Top Attendance, Below 50% attendance warnings).
*   **🎂 Birthday Notifications**: Live birthday reminders under the header Bell icon. It includes direct WhatsApp redirect links with pre-filled greeting messages and the option to dismiss reminders persistently for the day.
*   **📝 Fast Yuvak Registration**: A responsive member registration form with automatic age calculations, image uploads, and success notifications. The form auto-resets after exactly 2 seconds so you can register multiple members sequentially without page reload.
*   **✔️ Attendance Marking**: Mobile-optimized checkboxes for fast marking. Displays a floating top-right notification toast on save that persists for 5 seconds without forcing a dashboard redirect.
*   **⚡ Performance Optimizations**: 
    *   **Optimistic Updates**: Context operations (`addUser`, `updateUser`, `deleteUser`, and `saveAttendance`) apply locally in under `5ms` before waiting for database response.
    *   **Automatic Rollbacks**: In case of a database network failure, the application rolls back states gracefully to preserve data consistency.
*   **📱 Premium Mobile UI**:
    *   **Branding & Headers**: Desktop displays the full title, while mobile viewport collapses to show a clean "SNYM" branding with the Logo and drawer toggle.
    *   **Compact List View**: Mobile directory items are packed into clean, single-row lists with side-by-side action triggers (View, Edit, Delete).
    *   **Optimized Navigation**: Mobile footer navigation swaps the reports panel for the history tab for faster on-the-go review.

---

## 🛠️ Technology Stack

*   **Frontend**: React 19 + Vite + Tailwind CSS v4
*   **Icons**: Lucide React
*   **Date Operations**: Day.js
*   **Database & Auth**: Supabase

---

## 💻 Local Setup & Development

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed.

### 2. Install Dependencies
Clone this repository and run the following command in the project directory:
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env` file in the root folder and add your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Run Development Server
Start the local server with hot reloading:
```bash
npm run dev -- --host
```
Open [http://localhost:5173/](http://localhost:5173/) in your web browser.

---

## 🗄️ Database Setup

Create the tables in your Supabase project by copying and running the SQL code in the **SQL Editor** of the Supabase dashboard:

```sql
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

-- 4. Create activities audit log table
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_name TEXT,
    type TEXT,
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🌐 Deploy to Vercel

1. Log into your [Vercel](https://vercel.com/) dashboard using GitHub.
2. Select **Add New...** -> **Project**.
3. Import this repository.
4. Under **Environment Variables**, add:
   *   `VITE_SUPABASE_URL`
   *   `VITE_SUPABASE_ANON_KEY`
5. Click **Deploy**. Vercel will automatically build and publish your app online!

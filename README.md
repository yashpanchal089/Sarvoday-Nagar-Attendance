# Sarvoday Nagar Attendance System

Sarvoday Nagar Attendance is a web application for managing Yuvak registration, attendance marking, reporting, and birthday reminders for Sarvoday Nagar Yuvak Mandal coordinators and volunteers.

The app is designed for quick use on mobile during sabhas and remains usable on desktop for administration and reporting.

## Features

- Live attendance dashboard with summary charts and trends.
- Fast Yuvak registration with photo upload support.
- Attendance marking optimized for mobile use.
- Birthday reminders and WhatsApp shortcut links.
- Supabase-backed authentication and database storage.

## Tech Stack

- React 19 + Vite
- Tailwind CSS v4
- Supabase for database and auth
- Day.js, Lucide React, Recharts

## Local Setup

### 1. Prerequisites

Install Node.js 18+ and create a Supabase project.

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root with your Supabase values:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Run the app locally

```bash
npm run dev -- --host
```

Open http://localhost:5173 in your browser.

## Supabase Setup

1. Open your Supabase dashboard.
2. Go to SQL Editor.
3. Run the schema in [supabase_setup.sql](supabase_setup.sql).
4. Make sure the required tables are created: `users`, `yuvaks`, `attendance`, and `activities`.
5. If you are using production settings, keep Row Level Security enabled and use the policies defined in the SQL file.

## Vercel Setup

1. Push the project to GitHub.
2. In Vercel, choose Add New Project and import this repository.
3. Add the same environment variables in the Vercel project settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy the project.

## Repository Notes

- The main web app lives in the root Vite project.
- The Supabase schema and setup instructions are in [supabase_setup.sql](supabase_setup.sql).
- A backup SQL export is available in [supabase_backup.sql](supabase_backup.sql).

## Build

```bash
npm run build
```

## Preview

```bash
npm run preview
```

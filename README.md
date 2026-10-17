# SpendWise - Minimalist Apple HIG Expense Tracker

A sleek, private personal expense tracking web app built with Next.js (App Router), TypeScript, Tailwind CSS, and Supabase. Designed following Apple Human Interface Guidelines with dark/light themes, fluid micro-interactions, and INR (`₹`) formatting.

![SpendWise Preview](public/spendwise-preview.png)

## ✨ Features

- **📱 Apple HIG Aesthetics**: Clean typography, glassmorphism (`backdrop-blur`), subtle spring presses, and seamless dark & light mode.
- **🔒 PIN Protection & Master Recovery**:
  - Secure 4-digit PIN lock screen on launch.
  - Master recovery password support (`momdad143`) for instant PIN resets if forgotten.
  - Dedicated Change PIN and Quick Reset in Settings.
- **⚡ Blazing Fast Input**:
  - Fullscreen iOS-inspired numeric keypad for rapid transaction logging.
  - Integrated Payee, Title, and Description fields.
  - Quick payment method tagging (`Bank / UPI`, `Cash`, `Credit Card`).
- **🎨 Custom Categories with 30+ Icons**:
  - Create and personalize categories with custom colors and a rich library of 30+ Lucide icons (Food, Coffee, Petrol, Bike, Shopping, Rent, etc.).
  - Icons and colors dynamically render across Dashboard, Ledger, Budgets, and Analytics.
- **📊 Intelligent Insights & Day Filter**:
  - Flexible time-period filters: **Day (Today)**, **Week**, **Month**, **Year**.
  - Unified account balance breakdown: **Bank / UPI** and **In Cash**.
  - Category-wise spending breakdown with visual progress meters.
- **🎯 Monthly Budgets**:
  - Set category spending limits with real-time percentage indicators.
- **☁️ Supabase Cloud & Clean Offline Storage**:
  - Direct PostgreSQL real-time sync with Supabase.
  - Offline fallback to local storage.
  - Zero mock/sample data clutter — starts clean with user-driven records.
- **📥 CSV Export & Data Reset**:
  - Download full transaction records in CSV format anytime.
  - One-tap data wipe for a completely fresh start.

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Custom Apple Design Tokens
- **Icons**: Lucide React
- **Database**: Supabase (PostgreSQL + Realtime) / LocalStorage
- **FX**: Canvas Confetti

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/BuckyBanaz/expense-tracker.git
cd expense-tracker
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup Environment Variables (Optional for Supabase Cloud)
Create `.env.local` in the project root:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Run the schema SQL in your Supabase SQL editor from [`supabase-schema.sql`](./supabase-schema.sql).

### 4. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) or [http://localhost:3001](http://localhost:3001).

Default App PIN: `1234` (Master Recovery Password: `momdad143`).

## 📄 License
MIT License. Built with ❤️ for seamless personal finance management.

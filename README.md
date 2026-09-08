# Raseed Traders Management System

A production-grade, ultra-responsive scrap material management system engineered for Raseed Traders. The system handles daily scrap purchasing, stock inventory tracking with weighted average cost valuation, sales with stock validation, party ledgers, and custom date range calculation.

**Live Production URL**: [https://raseed-traders-management.vercel.app/](https://raseed-traders-management.vercel.app/)

## Business Profile
- Business Name: Raseed Traders
- Address: Behind Masjid, Bus Stand, Lakhnadon 480886
- Contact: +91 744 061 9649
- Currency: Indian Rupee (INR / ₹)

---

## Core Capabilities

### 1. Roz Kitna Khareeda (Purchases)
- Rapid entry of multi-item purchase transactions.
- Zero preset rates: all rates start empty and are entered by the user according to real-time market spot rates.
- Instant calculation of line totals, voucher total, weight, amount paid, and remaining balance due.
- Printable / shareable purchase vouchers with official business details.

### 2. Kitna Stock Hai (Inventory)
- Real-time inventory tracking for all 25 preconfigured scrap materials plus custom items.
- Valuation powered by Weighted Average Cost (WAC) formula updated on every purchase:
  WAC = ((Current Stock * Old WAC) + (Purchased Qty * Purchase Rate)) / (Current Stock + Purchased Qty)
- Stock adjustment module with permanent audit trail logging.

### 3. Kitna Becha (Sales)
- Sales vouchers with real-time stock guard to prevent accidental negative inventory.
- Automatic COGS (Cost of Goods Sold) and gross profit computation per transaction.
- Printable / shareable sale invoices.

### 4. Date-to-Date Calculator & Analytics (Hisaab)
- Interactive date calculator defaulted to Today with one-click presets (Today, Yesterday, This Month, Last Month, Last 30 Days).
- Aggregates total purchase amount, total purchase weight, total sale amount, total sale weight, and net balance.
- Full material-by-material breakdown and full-year monthly performance table.

### 5. Pure Black & White Theme System
- High-contrast, minimal design system (#000000 and #FFFFFF) with zero layout clutter.
- Instant 3-mode theme switcher: System (default), Light, and Dark mode with zero delay.
- Hardware-accelerated 60fps CSS micro-animations causing strictly 0ms lag.

---

## Preconfigured 25 Materials (English — Hindi)

1. LOHA — लोहा (KG)
2. TEEN — टीन (KG)
3. PLASTIC — प्लास्टिक (KG)
4. KALI PLASTIC — काली प्लास्टिक (KG)
5. PADPAD — पड़पड़ (KG)
6. DABBA — डब्बा (KG)
7. RADDI — रद्दी (KG)
8. KHADDA — खड्डा (KG)
9. TAMBA — ताँबा (KG)
10. PEETAL — पीतल (KG)
11. GERMAN — जर्मन (KG)
12. ARMATURE — आर्मेचर (KG)
13. PLATE — प्लेट (KG)
14. BATTERY — बैटरी (KG)
15. REGULATOR — रेगुलेटर (PIECE)
16. STEEL — स्टील (KG)
17. PALIYA — पलिया (KG)
18. TUBE — ट्यूब (KG)
19. TYRE — टायर (PIECE)
20. 2 TYRE — 2 टायर (PIECE)
21. FOAM — फोम (KG)
22. KALA FOAM — काला फोम (KG)
23. PAUA BOTTLE — पौआ बोतल (PIECE)
24. BEER BOTTLE — बीयर बोतल (PIECE)
25. KAACH BOTTLE — काँच बोतल (PIECE)

---

## Tech Stack & Architecture

- Frontend: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, React Router v7.
- State & Data: Dual-mode architecture. Operates with an offline-first transactional engine (localStorage) out-of-the-box, with optional Supabase PostgreSQL sync when environment variables are configured.
- PWA: Web App Manifest, Apple touch icons, and standalone mobile configuration.
- Automated Testing: Playwright cross-device test suite across 14 viewports (Android, iOS, iPad, MacBooks, and desktop displays).

---

## Getting Started

### Prerequisites
- Node.js 20+
- npm

### Installation
```bash
npm install
```

### Run Locally (Development)
```bash
npm run dev
```
The application will be available at `http://localhost:5173/`.

### Production Build
```bash
npm run build
```

### Run Tests
```bash
# Multi-screen responsive test suite (Android, iOS, Tablets, MacBooks, PC)
npm run test:screens

# End-to-end functionality and workflow verification
npm run test:e2e

# Business accounting scenario and WAC verification suite
npm run test:scenario
```

---

## License
Private and proprietary. All rights reserved by Raseed Traders.

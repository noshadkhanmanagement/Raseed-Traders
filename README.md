# Raseed Traders — Scrap Management System

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Live-black?style=flat&logo=vercel)](https://raseed-traders-management.vercel.app/)
[![React 19](https://img.shields.io/badge/React-19-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-Monochrome-black?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-emerald?style=flat&logo=supabase)](https://supabase.com/)

A production-grade, ultra-responsive scrap material recycling and inventory management platform engineered specifically for **Raseed Traders** (Lakhnadon, MP). Designed with a clean high-contrast monochrome design system, the system provides rapid daily purchasing, real-time Weighted Average Cost (WAC) valuation, rate fluctuation analytics, overselling prevention, and bilingual English/Hindi labeling.

**Live Production URL**: [https://raseed-traders-management.vercel.app/](https://raseed-traders-management.vercel.app/)

---

## Business Profile
- **Business Name**: Raseed Traders (रसीद ट्रेडर्स)
- **Address**: Behind Masjid, Bus Stand, Lakhnadon 480886 (Madhya Pradesh)
- **Contact**: +91 744 061 9649
- **Currency Standard**: Indian Rupee (₹ / INR)

---

## Core Capabilities & Features

### 1. Security Gate & Password-Protected Session
- **Environment-Gated Access**: The application is protected by a login gate. The security password is read exclusively from the environment variable (`VITE_APP_PASSWORD`), ensuring zero plaintext passwords in source code or documentation.
- **Session Locking**: Instant lock button in the header and settings allows operators to quickly secure the terminal when stepping away from the counter.
- **Persistent or Session-Only State**: Supports optional "Remember Me" local persistence or session-only verification.

### 2. Interactive Rate Fluctuation & Purchase Rate History
- **Material Rate Intelligence**: Tapping or clicking any material card on the Dashboard or in the Inventory table opens an interactive Rate History Modal.
- **Full Historical Audit**: Displays all past purchases for that specific material, showing:
  - Exact purchase rate paid (₹/kg or ₹/piece)
  - Date and timestamp of each transaction
  - Supplier / Party name
  - Quantity purchased and line totals
- **Key Metrics Summary**: Highlights Lowest Purchase Rate, Highest Purchase Rate, and Weighted Average Rate to assist in negotiation and spot price decisions.

### 3. Full 25 Master Materials Catalog (+ Custom Materials)
- **Complete Catalog on Dashboard**: All 25 preconfigured scrap materials are visible directly on the Dashboard without arbitrary truncation, alongside any custom materials added by the business.
- **Bilingual Interface**: Every material features its standardized English trade name paired with its local Hindi script equivalent.
- **Dedicated Units**: Correct units of measurement per material (`KG` for bulk scrap metals/plastics, `PIECE` for batteries, bottles, and regulators).

### 4. Dynamic Spot Pricing (Strict Zero Preset Rates)
- **Zero Default Assumptions**: All rate input fields in both Purchase and Sale vouchers start completely blank (`placeholder="0.00"`).
- Operators enter the exact market spot rate negotiated on the weighing scale, eliminating errors from outdated presets.

### 5. Inventory Valuation & Weighted Average Cost (WAC)
- **Automated WAC Calculation**: Every purchase recalculates unit valuation according to standard scrap accounting principles:
  $$\text{New WAC} = \frac{(\text{Current Stock} \times \text{Current WAC}) + (\text{New Qty} \times \text{New Purchase Rate})}{\text{Current Stock} + \text{New Qty}}$$
- **Negative Stock Prevention**: Sales vouchers enforce real-time stock validation, blocking attempts to sell more material than physically available in the yard.
- **Audit Adjustments**: Stock adjustment module with mandatory reason logging for shrinkage, moisture loss, or physical counts.

### 6. Date-to-Date Financial Calculator (Hisaab & Analytics)
- **Defaulted to Today**: Date calculator automatically opens initialized to today's date for immediate daily settlement.
- **One-Click Presets**: Quick filters for Today, Yesterday, This Month, Last Month, and Custom Ranges.
- **Comprehensive Aggregations**: Total weight purchased/sold, total purchase/sale expenditures, gross margin, and net balance.

### 7. Vercel Web Analytics & Speed Insights
- Integrated `@vercel/analytics` and `@vercel/speed-insights` for real-time tracking of visitor traffic, page views, and Core Web Vitals directly inside the Vercel dashboard.

---

## Master Materials List (25 Materials)

| # | Material Name | हिंदी नाम | Unit | Category |
|---|---------------|-----------|------|----------|
| 1 | **LOHA** | लोहा | KG | Ferrous Metal |
| 2 | **TEEN** | टीन | KG | Ferrous Metal |
| 3 | **PLASTIC** | प्लास्टिक | KG | Polymers |
| 4 | **KALI PLASTIC** | काली प्लास्टिक | KG | Polymers |
| 5 | **PADPAD** | पड़पड़ | KG | Polymers |
| 6 | **DABBA** | डब्बा | KG | Packaging |
| 7 | **RADDI** | रद्दी | KG | Paper |
| 8 | **KHADDA** | खड्डा | KG | Paper / Cardboard |
| 9 | **TAMBA** | ताँबा | KG | Non-Ferrous Metal |
| 10 | **PEETAL** | पीतल | KG | Non-Ferrous Metal |
| 11 | **GERMAN** | जर्मन | KG | Non-Ferrous Metal |
| 12 | **ARMATURE** | आर्मेचर | KG | Electrical Scrap |
| 13 | **PLATE** | प्लेट | KG | Ferrous Metal |
| 14 | **BATTERY** | बैटरी | KG | Lead / Chemical |
| 15 | **REGULATOR** | रेगुलेटर | PIECE | Machinery / Parts |
| 16 | **STEEL** | स्टील | KG | Stainless Metal |
| 17 | **PALIYA** | पलिया | KG | Sheet Metal |
| 18 | **TUBE** | ट्यूब | KG | Rubber |
| 19 | **TYRE** | टायर | PIECE | Rubber |
| 20 | **2 TYRE** | 2 टायर | PIECE | Rubber |
| 21 | **FOAM** | फोम | KG | Synthetic |
| 22 | **KALA FOAM** | काला फोम | KG | Synthetic |
| 23 | **PAUA BOTTLE** | पौआ बोतल | PIECE | Glassware |
| 24 | **BEER BOTTLE** | बीयर बोतल | PIECE | Glassware |
| 25 | **KAACH BOTTLE** | काँच बोतल | PIECE | Glassware |

---

## Technology Stack

- **Frontend Core**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS (Custom monochrome palette `#000000` / `#FFFFFF`), Lucide React Icons
- **State & Sync**: Dual-layer architecture:
  - **Local Engine**: Offline-first `localStorage` transactional database.
  - **Cloud Backend**: Supabase PostgreSQL with Row Level Security (RLS) and real-time synchronization.
- **Observability**: Vercel Web Analytics & Vercel Speed Insights.
- **Testing & Quality Assurance**: Playwright E2E cross-browser & multi-device suite (14 display resolutions from mobile to 2K desktop).

---

## Environment Configuration

To configure the application for local development or Vercel deployment, provide the following environment variables:

```env
# 1. Supabase Cloud Connection
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-public-anon-key

# 2. Application Access Gate Password
# (Configure your secret password here. Never commit plain passwords to git.)
VITE_APP_PASSWORD=your-secure-app-password
```

> **Security Note**: Never commit actual `.env` or `.env.local` files containing secrets to the Git repository. Use the Vercel Dashboard (`Settings > Environment Variables`) for production deployments.

---

## Local Development & Testing

### 1. Installation
```bash
npm install
```

### 2. Start Local Development Server
```bash
npm run dev
```
The application will launch at `http://localhost:5173/`.

### 3. Production Build
```bash
npm run build
```

### 4. Run Automated Test Suites
```bash
# Run 1000/1000 strict E2E verification suite
node scripts/testEverything.cjs

# Verify rate history modal and 25-item dashboard display
node scripts/verifyRateHistoryAndDashboard.cjs

# Cross-device responsive layout suite (Android, iOS, iPad, MacBooks, PC)
npm run test:screens
```

---

## Vercel Deployment Checklist

1. **Repository Settings**: Connected to GitHub repository `noshadkhanmanagement/Raseed-Traders`.
2. **Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_APP_PASSWORD`
3. **Build Configuration**:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
4. **Vercel Hobby Features Configured**:
   - Web Analytics: Active via `@vercel/analytics`
   - Speed Insights: Active via `@vercel/speed-insights`
   - Skew Protection: Enabled in project settings
   - Region: Set closest to business location (`bom1` - Mumbai, India)

---

## License & Copyright

Proprietary Software. All rights reserved by **Raseed Traders**, Lakhnadon, MP.

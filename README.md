# 📦 Raseed Traders (रसीद ट्रेडर्स) — Scrap Management & Hisaab System

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Live-black?style=flat&logo=vercel)](https://raseed-traders-management.vercel.app/)
[![React 19](https://img.shields.io/badge/React-19-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-Monochrome-black?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-emerald?style=flat&logo=supabase)](https://supabase.com/)

A modern, fast, and easy-to-use business software designed specially for **Raseed Traders** (Behind Masjid, Bus Stand, Lakhnadon, Dist. Seoni, Madhya Pradesh). 

This system helps scrap merchants handle daily buying and selling, track custom shop expenses, calculate exact profit/loss for any date period, and print high-quality business statements wrapped in an exact **1cm border** with zero clutter.

**🌐 Live Production Web App**: [https://raseed-traders-management.vercel.app/](https://raseed-traders-management.vercel.app/)

---

## 🏢 Business Overview (दुकान की जानकारी)

- **Firm Name**: Raseed Traders (रसीद ट्रेडर्स)
- **Business Type**: Scrap Merchants & Commission Agents (कबाड़ व्यापार व कमीशन एजेंट)
- **Location**: Behind Masjid, Bus Stand, Lakhnadon 480886 (M.P.)
- **Contact**: +91 744 061 9649
- **Currency**: Indian Rupee (₹)
- **Time Standard**: Exact 12-Hour Indian Standard Time (`DD Mon YYYY · HH:MM AM/PM`)

---

## 🌟 What This Software Does (मुख्य खूबियाँ - आसान भाषा में)

### 1. 🖨️ Professional 1cm-Border Print System (प्रिंट और PDF रिपोर्ट)
When you tap the **Print** button in the Hisaab screen, it does **NOT** print an ugly screenshot or messy web buttons. Instead:
- **Print Options Dialog**: Opens an interactive popup where you choose:
  - **Date Period**: One-click buttons for *Today (आज)*, *Yesterday (कल)*, *This Month (इस महीने)*, *Last Month (पिछले)*, *30 Days*, or any custom *From/To* dates.
  - **What to Print Checklist**:
    - ✅ **Executive Hisaab Summary**: Total bought, total sold, shop expenses, and net balance.
    - ✅ **Custom Kharcha Statement**: Itemized list of shop expenses with name, reason, and amount.
    - ✅ **Detailed Transaction Bills**: Complete list of buy and sell receipts with exact 12-hour timestamps.
    - ✅ **Material-wise Breakdown Table**: Item-by-item breakdown of buying vs. selling weights and rates.
    - ✅ **Authorized Signatory Stamp Box**: Official signature lines for Munshi and Proprietor.
- **Strict 1cm Border**: The printed sheet has an exact 1cm blank margin from the paper edges and is framed inside a sharp, high-contrast black border. Zero web UI artifacts, 100% formal business grade.
- **Ready for PDF**: You can print directly to your physical printer or choose "Save as PDF" to share via WhatsApp.

---

### 2. 💸 Custom Kharcha Tracking (दुकान व अन्य खर्च)
In scrap yards, small and large daily expenses happen constantly (e.g. truck rent, labor, tea, weighing scale maintenance).
- **Clean Entry**: Accessible via the dedicated **Custom Kharcha (कस्टम खर्च)** button on the Stock page.
- **Three Simple Fields**:
  1. **Jisko Paise Diye (किसे दिया)**: e.g., `Mohan Driver`, `Chhotu Chai`, `Suresh Hamal`
  2. **Kharch Ka Kaaran (कारण)**: e.g., `Gadi Bhada (गाड़ी भाड़ा)`, `Dukaan Chai Nashta`
  3. **Rupaye (Amount ₹)**: e.g., `₹500`, `₹60`
- **Integrated Bookkeeping**: Every expense automatically reduces the net daily balance in the Hisaab section.
- **Safe Management**: You can view, audit, and delete any accidental expense with one click.

---

### 3. 🧮 Hisaab & Calculator (तारीख़ से तारीख़ हिसाब)
Know exactly how much money came in, how much went out, and what the net profit/loss is:
- **Total Khareeda (कुल खरीदी)**: Total money spent buying scrap, total kilograms/pieces, and bill count.
- **Total Becha (कुल बिक्री)**: Total money received selling scrap, total quantities, and bill count.
- **Total Custom Kharcha (कुल खर्च)**: Total operational expenses in that date range.
- **Net Balance (शुद्ध अंतर)**: 
  $$\text{Net Balance} = \text{Total Sales} - \text{Total Purchases} - \text{Custom Expenses}$$
  - If positive: displays in green as **Surplus / Profit (शुद्ध बचत)**.
  - If negative: displays in red as **Deficit / Purchases Exceed (कमी)**.
- **Item Breakdown**: Shows for every scrap item (Peetal, Loha, Tamba, etc.) how much was bought vs. sold.

---

### 4. ⚖️ Spot Market Pricing (Strict Zero Default Rate)
Scrap rates in Mandi change every single day or even hour:
- Rate input boxes start completely blank (`placeholder="0.00"`).
- The operator types the exact rate negotiated right at the weighing scale.
- No accidental entries caused by outdated preset rates.

---

### 5. 🔄 Stock Reset Without Polluting Hisaab (सुरक्षित स्टॉक रीसेट)
If a physical yard audit shows an item is sold or cleared out:
- Tapping **Reset Stock** sets the available yard count back to `0 KG` or `0 PIECE`.
- **Hisaab Protection**: Resetting stock does NOT delete or alter past financial records or purchase/sale bills. Your accounting and cash drawers stay 100% accurate.

---

### 6. 📱 Apple iOS Liquid Glass Design System
- Built to feel just like a native iPhone application.
- Fluid bottom navigation pill with tactile feedback and spring micro-animations.
- Inset grouped cards, smooth rounded corners, and native light/dark mode support.
- Fully responsive on any phone, tablet, laptop, or desktop monitor.

---

### 7. ☁️ Dual Offline & Cloud Engine (इंटरनेट न होने पर भी चलेगा)
- **Offline First**: Works instantly even if the internet drops at the counter using local browser storage (`LocalEngine`).
- **Cloud Backup**: Automatically syncs with a secure Supabase PostgreSQL database whenever online.

---

## 📋 Master Materials Catalog (25 अधिकृत सामग्री सूची)

The system is hard-locked to the 25 official materials traded by Raseed Traders:

| # | Material Name (English) | स्थानीय नाम (Hindi) | Unit (इकाई) | Trade Type |
|---|-------------------------|---------------------|-------------|------------|
| 1 | **LOHA** | लोहा | KG | वजन से (Weight) |
| 2 | **TEEN** | टीन | KG | वजन से (Weight) |
| 3 | **PLASTIC** | प्लास्टिक | KG | वजन से (Weight) |
| 4 | **KALI PLASTIC** | काली प्लास्टिक | KG | वजन से (Weight) |
| 5 | **PADPAD** | पड़पड़ | KG | वजन से (Weight) |
| 6 | **DABBA** | डब्बा | KG | वजन से (Weight) |
| 7 | **RADDI** | रद्दी | KG | वजन से (Weight) |
| 8 | **KHADDA** | खड्डा | KG | वजन से (Weight) |
| 9 | **TAMBA** | ताँबा | KG | वजन से (Weight) |
| 10 | **PEETAL** | पीतल | KG | वजन से (Weight) |
| 11 | **GERMAN** | जर्मन | KG | वजन से (Weight) |
| 12 | **ARMATURE** | आर्मेचर | KG | वजन से (Weight) |
| 13 | **PLATE** | प्लेट | KG | वजन से (Weight) |
| 14 | **BATTERY** | बैटरी | KG | वजन से (Weight) |
| 15 | **REGULATOR** | रेगुलेटर | PIECE | नग से (Piece count) |
| 16 | **STEEL** | स्टील | KG | वजन से (Weight) |
| 17 | **PALIYA** | पलिया | KG | वजन से (Weight) |
| 18 | **TUBE** | ट्यूब | KG | वजन से (Weight) |
| 19 | **TYRE** | टायर | PIECE | नग से (Piece count) |
| 20 | **2 TYRE** | 2 टायर | PIECE | नग से (Piece count) |
| 21 | **FOAM** | फोम | KG | वजन से (Weight) |
| 22 | **KALA FOAM** | काला फोम | KG | वजन से (Weight) |
| 23 | **PAUA BOTTLE** | पौआ बोतल | PIECE | नग से (Piece count) |
| 24 | **BEER BOTTLE** | बीयर बोतल | PIECE | नग से (Piece count) |
| 25 | **KAACH BOTTLE** | काँच बोतल | PIECE | नग से (Piece count) |

---

## 🚀 How to Run the Project Locally (कंप्यूटर पर कैसे चलाएं)

### Requirements
- [Node.js](https://nodejs.org/) (Version 18 or higher)
- Git

### Step 1: Clone the repository
```bash
git clone https://github.com/noshadkhanmanagement/Raseed-Traders.git
cd Raseed-Traders
```

### Step 2: Install dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Create a file named `.env.local` in the project root:
```env
VITE_SUPABASE_URL=https://your-supabase-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_APP_PASSWORD=your-secret-password
```

### Step 4: Start Development Server
```bash
npm run dev
```
Open your browser and visit: `http://localhost:5173/`

### Step 5: Test & Build
```bash
# Check code quality (0 warnings rule)
npx oxlint src/

# Test production build
npm run build
```

---

## 📁 Project Structure (फ़ोल्डर संरचना)

```text
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── BottomSheet.tsx           # iOS-style bottom sheet modal
│   │   │   ├── Icons.tsx                 # High-performance SVG icons
│   │   │   ├── Navigation.tsx            # Fluid bottom navigation pill
│   │   │   ├── PrintOptionsModal.tsx     # Date & section checklist dialog
│   │   │   └── OfficialPrintStatement.tsx# 1cm border professional print statement
│   │   ├── transactions/
│   │   │   ├── CustomExpenseModal.tsx    # Clean shop expense entry modal
│   │   │   ├── QuickPurchaseModal.tsx    # Rapid scrap buy voucher
│   │   │   ├── QuickSaleModal.tsx        # Rapid scrap sell voucher
│   │   │   └── ItemRateHistoryModal.tsx  # Interactive rate audit sheet
│   ├── context/
│   │   ├── AuthContext.tsx               # Password-protected session gate
│   │   └── ThemeContext.tsx              # Monochrome Light/Dark theme provider
│   ├── pages/
│   │   ├── Analytics.tsx                 # Hisaab & Calculator screen + Print
│   │   ├── Dashboard.tsx                 # Live stock and rapid trading hub
│   │   ├── Inventory.tsx                 # Stock management and adjustments
│   │   ├── Login.tsx                     # Password security gate
│   │   └── Settings.tsx                  # Business settings, backups, units
│   ├── services/
│   │   ├── api.ts                        # Unified cloud/local data service
│   │   └── localEngine.ts                # Offline transactional storage engine
│   ├── types/
│   │   └── index.ts                      # Strict TypeScript schemas
│   ├── utils/
│   │   └── formatters.ts                 # Currency (₹), 12hr time, date presets
│   ├── index.css                         # Tailwind CSS + @media print 1cm rules
│   └── main.tsx                          # App root and routes
├── docs/
│   ├── USER_GUIDE.md                     # Step-by-step user guide for shop staff
│   └── PRINT_SYSTEM_SPEC.md              # Technical specification of 1cm print engine
└── README.md                             # Master documentation
```

---

## 📜 Documentation Index

For detailed guides, please see:
- 📖 [**Staff & Counter User Guide (उपयोगकर्ता मार्गदर्शिका)**](file:///c:/Users/anura/Desktop/Noshad/docs/USER_GUIDE.md)
- 🖨️ [**1cm Print System Technical Spec (प्रिंट सिस्टम विवरण)**](file:///c:/Users/anura/Desktop/Noshad/docs/PRINT_SYSTEM_SPEC.md)

---

## 🛡️ License & Rights

Proprietary Software. Developed exclusively for **Raseed Traders**, Lakhnadon, Madhya Pradesh. All rights reserved.

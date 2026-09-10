# Raseed Traders — Professional 1cm Print System Specification

This document details the architecture, design principles, and technical implementation of the formal accounting print engine in Raseed Traders.

---

## 1. Core Architecture Overview

Unlike standard web applications that attempt to print whatever DOM happens to be visible on the screen (resulting in dark mode artifacts, buttons, tabs, cut-off cards, and poor readability), Raseed Traders implements a **Zero-Vibe-Coded / Formal Business Print Isolation Engine**.

### High-Level Flow:
```text
User Taps "Print" (Analytics.tsx)
          │
          ▼
Opens PrintOptionsModal.tsx
  ├─ Date Range Selector (Presets + From/To pickers)
  └─ Section Checklist (Summary, Expenses, Ledger, Breakdown, Signatures)
          │
          ▼
User Taps "Print Official Report"
          │
          ▼
1. Analytics.tsx loads date range data (if changed from screen view)
2. Injects state into OfficialPrintStatement.tsx (#official-print-statement)
3. Triggers window.print()
          │
          ▼
@media print CSS kicks in:
  ├─ body * { visibility: hidden !important; } (Hides entire web shell)
  ├─ #official-print-statement * { visibility: visible !important; }
  ├─ @page { size: A4 portrait; margin: 1cm; } (Exact 1cm physical margin)
  └─ .official-print-frame { border: 1.5pt solid #000; padding: 7mm 8mm; }
          │
          ▼
Printer / Save as PDF Output:
  Crisp, High-Contrast Black & White Accounting Statement with 1cm Border
```

---

## 2. Key Components

### A. `PrintOptionsModal.tsx`
- **Location**: [`src/components/common/PrintOptionsModal.tsx`](file:///c:/Users/anura/Desktop/Noshad/src/components/common/PrintOptionsModal.tsx)
- **Props**:
  - `isOpen: boolean`
  - `onClose: () => void`
  - `currentStartDate: string`
  - `currentEndDate: string`
  - `onExecutePrint: (config: PrintConfig) => void`
- **Configuration Contract (`PrintConfig`)**:
  ```typescript
  export interface PrintConfig {
    startDate: string;
    endDate: string;
    includeSummary: boolean;
    includeExpenses: boolean;
    includeTransactions: boolean;
    includeMaterialBreakdown: boolean;
    includeSignatures: boolean;
  }
  ```

### B. `OfficialPrintStatement.tsx`
- **Location**: [`src/components/common/OfficialPrintStatement.tsx`](file:///c:/Users/anura/Desktop/Noshad/src/components/common/OfficialPrintStatement.tsx)
- **Container**: `<div id="official-print-statement" className="print-document-root">`
- **Outer Border Frame**: `<div className="official-print-frame">`
- **Formal Content Sections**:
  1. **Official Letterhead**:
     - Firm: `RASEED TRADERS` (रसीद ट्रेडर्स)
     - Lineage: `Scrap Merchants & Commission Agents (कबाड़ व्यापार)`
     - Location: `Behind Masjid, Bus Stand, Lakhnadon, Dist. Seoni (M.P.) 480886`
     - Phone: `+91 744 061 9649`
  2. **Title & Date Range Banner**: High-contrast shaded bar displaying statement period and 12-hour print timestamp.
  3. **1. Executive Summary Table**: 4-column border-collapsed KPI grid (Total Khareeda, Total Becha, Custom Kharcha, Net Balance).
  4. **2. Custom Kharcha Statement**: Full audit table with #, Date & 12hr Time, Recipient Name, Reason, Amount in ₹.
  5. **3. Kharidi & Bikri Ledger**: Itemized chronological ledger detailing Party Name, Item Details, Weight, Rates, and Bill Amounts.
  6. **4. Material-wise Stock & Trade Summary**: Matrix of buy vs sell weight and value per scrap item with net rupee difference.
  7. **Official Declaration & Signatures**: Dual signature boxes for *मुंशी / Prepared By* and *प्रोपराइटर / Authorized Signatory*.

---

## 3. Print CSS Isolation Rules (`src/index.css`)

```css
/* 1. Screen Hiding: Zero footprint during regular app usage */
#official-print-statement {
  display: none;
}

/* 2. Page Margins: Exactly 1cm from paper edges */
@page {
  size: A4 portrait;
  margin: 1cm;
}

/* 3. Media Print Rules */
@media print {
  /* Complete screen isolation: Hide all standard web DOM */
  body * {
    visibility: hidden !important;
  }

  /* Reveal only the official print document */
  #official-print-statement,
  #official-print-statement * {
    visibility: visible !important;
  }

  #official-print-statement {
    display: block !important;
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    background: #FFFFFF !important;
    color: #000000 !important;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* 1cm border wrapper around all page content */
  .official-print-frame {
    display: block !important;
    border: 1.5pt solid #000000 !important;
    padding: 7mm 8mm !important;
    box-sizing: border-box !important;
    background: #FFFFFF !important;
    color: #000000 !important;
    width: 100% !important;
  }

  .no-print {
    display: none !important;
  }

  body {
    background: #FFFFFF !important;
    color: #000000 !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  table {
    page-break-inside: auto !important;
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
  }

  tr, td, th {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }

  thead {
    display: table-header-group !important;
  }

  tfoot {
    display: table-footer-group !important;
  }
}
```

---

## 4. Multi-Page & Table Header Preservation
- **`thead { display: table-header-group !important; }`**: When a transaction statement spans across multiple physical printed pages, browsers automatically repeat table headers at the top of each subsequent page.
- **`tr, td, th { page-break-inside: avoid !important; }`**: Prevents individual transaction rows or signature lines from being split across page boundaries.
- **`box-sizing: border-box` & `max-width: 100%`**: Ensures no text or table borders extend outside the 1.5pt outer frame boundary.

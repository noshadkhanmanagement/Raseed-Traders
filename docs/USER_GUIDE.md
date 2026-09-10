# Raseed Traders — Counter Staff & User Guide (उपयोगकर्ता मार्गदर्शिका)

Welcome to the official User Guide for **Raseed Traders** (रसीद ट्रेडर्स). This guide is written in simple, plain language with step-by-step instructions so anyone can use the system without confusion.

---

## Table of Contents (विषय सूची)
1. [लॉगिन और पासवर्ड (Login & Password Gate)](#1-लॉगिन-और-पासवर्ड-login--password-gate)
2. [कबाड़ की खरीदी दर्ज करना (Buying Scrap / Kharidi)](#2-कबाड़-की-खरीदी-दर्ज-करना-buying-scrap--kharidi)
3. [कबाड़ की बिक्री दर्ज करना (Selling Scrap / Bikri)](#3-कबाड़-की-बिक्री-दर्ज-करना-selling-scrap--bikri)
4. [दुकान व कस्टम खर्च लिखना (Custom Kharcha Entry)](#4-दुकान-व-कस्टम-खर्च-लिखना-custom-kharcha-entry)
5. [हिसाब और मुनाफा निकालना (Hisaab & Calculator)](#5-हिसाब-और-मुनाफा-निकालना-hisaab--calculator)
6. [1cm बॉर्डर वाली प्रोफेशनल रिपोर्ट प्रिंट करना (Printing & Saving PDF)](#6-1cm-बॉर्डर-वाली-प्रोफेशनल-रिपोर्ट-प्रिंट-करना-printing--saving-pdf)
7. [स्टॉक रीसेट करना (Stock Reset Safety)](#7-स्टॉक-रीसेट-करना-stock-reset-safety)
8. [अक्सर पूछे जाने वाले सवाल (FAQ)](#8-अक्सर-पूछे-जाने-वाले-सवाल-faq)
9. [डेवलपर और तकनीकी सहायता (Developer & Support)](#9-डेवलपर-और-तकनीकी-सहायता-developer--support)

---

## 1. लॉगिन और पासवर्ड (Login & Password Gate)

When you open the web application on your phone or computer, you will see the security login screen.

- **Password**: Enter the shop password provided to you.
- **Remember Me (याद रखें)**: Tick this box if this is your private shop phone or computer so you don't need to type the password every time.
- **Lock Terminal (स्क्रीन लॉक)**: When stepping away from the counter, tap the lock icon in the top navigation to instantly secure the software.

---

## 2. कबाड़ की खरीदी दर्ज करना (Buying Scrap / Kharidi)

Whenever a customer or hawker (फेरी वाला) brings scrap to the shop:

1. Go to the **Stock (स्टॉक)** tab.
2. Tap the **Buy (खरीदें)** button on the material card (e.g. `PEETAL`, `LOHA`, `TAMBA`).
3. Fill in the popup:
   - **Quantity (वजन / नग)**: Enter the weight in Kilograms (KG) or count in Pieces.
   - **Rate (भाव ₹)**: Type the agreed spot price per KG or Piece. *(Note: This field always starts blank so you never enter a wrong default rate by mistake).*
   - **Amount (कुल रुपये)**: Automatically calculates `Weight × Rate`.
   - **Party Name (पार्टी का नाम)**: Type the seller's name or leave default for `Walk-in Party (नकदी पार्टी)`.
4. Tap **Confirm Purchase (खरीदी दर्ज करें)**.
5. The stock immediately increases, and the transaction is recorded in the Hisaab feed.

---

## 3. कबाड़ की बिक्री दर्ज करना (Selling Scrap / Bikri)

Whenever you sell scrap to a factory buyer or truck transporter:

1. On the **Stock (स्टॉक)** tab, tap the **Sell (बेचें)** button.
2. Enter:
   - **Quantity (वजन / नग)**: How much you are loading into the vehicle.
   - **Rate (भाव ₹)**: Selling price per KG or Piece.
   - **Party Name**: Buyer company or contractor name.
3. Tap **Confirm Sale (बिक्री दर्ज करें)**.
4. The system updates your stock and calculates the trade balance.
5. *(Safety Feature)*: You cannot accidentally sell more scrap than what physically exists in the yard.

---

## 4. दुकान व कस्टम खर्च लिखना (Custom Kharcha Entry)

Daily operational expenses happen all day (tea, labor, truck rent, scale repair). Keeping them in a pocket diary causes missing money at the end of the day.

1. On the **Stock (स्टॉक)** page, tap the **Custom Kharcha (कस्टम खर्च)** button.
2. Enter 3 simple fields:
   - **Jisko Paise Diye (किसे दिया)**: Name of the person receiving the cash (e.g., `Mohan Driver`).
   - **Kharch Ka Kaaran (कारण)**: Why the money was paid (e.g., `Gadi Bhada Lakhnadon to Seoni`).
   - **Rupaye (Amount ₹)**: Amount paid (e.g., `500`).
3. Tap **Save Kharcha (खर्च जोड़ें)**.
4. This expense will immediately be counted in the **Hisaab & Calculator** section and subtracted from your daily profit.

---

## 5. हिसाब और मुनाफा निकालना (Hisaab & Calculator)

Tap the **Hisab (हिसाब)** icon in the bottom navigation bar.

- **Quick Date Buttons**:
  - `Today (आज)`: View today's total trade immediately.
  - `Yesterday (कल)`: View yesterday's numbers.
  - `This Month (इस महीने)`: Full month calculation.
  - `Last Month (पिछले महीने)`: Previous month total.
  - `30 Days`: Rolling last 30 days.
  - `From / To`: Pick any two dates from the calendar.
- **The 4 Key Numbers**:
  1. **Total Khareeda (कुल खरीदी)**: Total money spent buying scrap.
  2. **Total Becha (कुल बिक्री)**: Total money received selling scrap.
  3. **Custom Kharcha (कुल खर्च)**: Total shop operational expenses.
  4. **Net Balance (शुद्ध अंतर)**:
     - **Green (`+₹...`)**: Surplus / Profit (दुकान में बचत है).
     - **Red (`-₹...`)**: Purchases exceed Sales (खरीदी बिक्री से ज़्यादा हुई है).
- **Transaction Activity Feed**: Shows every single entry with exact 12-hour Indian timestamps (e.g. `10 Sept 2026 · 11:15 AM`).

---

## 6. 1cm बॉर्डर वाली प्रोफेशनल रिपोर्ट प्रिंट करना (Printing & Saving PDF)

To print a physical paper statement or save a PDF to send to partners:

1. Go to the **Hisab (हिसाब)** page.
2. In the top right corner, tap the **Print** button.
3. The **Print Options Modal (प्रिंट विकल्प)** will appear.
4. **Choose your Date Period**: Select Today, Yesterday, This Month, or enter custom dates.
5. **Tick or Untick What You Want to Print**:
   - [x] **Executive Hisaab Summary**: Big KPI totals (Khareeda, Becha, Kharcha, Net).
   - [x] **Custom Kharcha Statement**: Full list of shop expenses with names and reasons.
   - [x] **Detailed Transaction Bills**: Complete list of buy/sell bills.
   - [x] **Material-wise Breakdown Table**: Item-by-item table of quantities and amounts.
   - [x] **Authorized Signatory Stamp Box**: Signature box for Munshi and Proprietor.
6. Tap **Print Official Report (प्रिंट निकालें)**.
7. Your computer or phone's standard print window will open:
   - **Strict 1cm Border**: Notice how the printed document has an exact 1cm border surrounding the page.
   - **Zero Clutter**: No navigation buttons, dark mode colors, or web UI will print. Only the pure black-and-white formal statement.
   - To save a PDF on your device, change the printer destination to **"Save as PDF"** and click Save.

---

## 7. स्टॉक रीसेट करना (Stock Reset Safety)

What if you cleared out the yard and want to set an item's stock count back to zero?

1. Go to **Stock** or **Settings**.
2. Tap the material and select **Reset Stock (स्टॉक रीसेट)**.
3. Confirm the prompt.
4. The item's stock is set back to `0 KG` or `0 PIECE`.
5. **Hisaab Safe**: Resetting the stock count does **NOT** delete or mess up past sales or purchases. Your past Hisaab records remain 100% accurate.

---

## 8. अक्सर पूछे जाने वाले सवाल (FAQ)

### Q1: अगर इंटरनेट बंद हो जाए तो क्या दुकान का काम रुक जाएगा?
**उत्तर**: नहीं! यह सॉफ़्टवेयर "Offline-First" तकनीक पर काम करता है। इंटरनेट न होने पर भी आप खरीदी, बिक्री और खर्च लिख सकते हैं। जैसे ही इंटरनेट वापस आएगा, सारा डेटा सुरक्षित क्लाउड (Supabase) में अपने आप सेव हो जाएगा।

### Q2: क्या प्रिंट करते समय वेबसाइट के बटन दिखेंगे?
**उत्तर**: बिल्कुल नहीं! प्रिंटिंग के लिए एक विशेष आइसोलेशन सिस्टम लगाया गया है। प्रिंट या PDF में केवल औपचारिक रसीद ट्रेडर्स का लेटरहेड, हिसाब की तालिकाएँ और 1cm का बॉर्डर आएगा।

### Q3: क्या भाव (Rate) पहले से भरा हुआ आता है?
**उत्तर**: नहीं। कबाड़ के भाव रोज़ाना मंडी के अनुसार बदलते हैं। गलत एंट्री से बचने के लिए भाव का बॉक्स हमेशा खाली (`0.00`) रहता है ताकि ऑपरेटर तौल कांटे पर तय हुआ सही भाव ही दर्ज करे।

### Q4: कस्टम खर्च में क्या-क्या लिख सकते हैं?
**उत्तर**: दुकान के किसी भी प्रकार के खर्च जैसे गाड़ी भाड़ा, हम्माली / लेबर, चाय-नाश्ता, कांटा रिपेयरिंग आदि। इसमें जिसे पैसे दिए उसका नाम, कारण और रुपये लिखकर सेव कर दें।

---

## 9. डेवलपर और तकनीकी सहायता (Developer & Support)

सॉफ़्टवेयर से संबंधित किसी भी तकनीकी सहायता, नए फ़ीचर जुड़वाने या कस्टमाइज़ेशन के लिए डेवलपर से सीधे संपर्क कर सकते हैं:

- **डेवलपर (Developer)**: अनुराग मिश्रा (Anurag Mishra)
- **फ़ोन / कॉल (Phone)**: [+91 93027 86886](tel:9302786886) (`9302786886`)
- **ईमेल (Email)**: [anurag.mishra.core@gmail.com](mailto:anurag.mishra.core@gmail.com)
- **LinkedIn**: [linkedin.com/in/4nur4gmishra](https://www.linkedin.com/in/4nur4gmishra/)
- **GitHub**: [github.com/4nur4gmishr4](https://github.com/4nur4gmishr4)

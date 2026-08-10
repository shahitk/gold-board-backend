// server.js
// یک بک‌اند ساده که هر چند دقیقه قیمت‌های واقعی طلا، سکه و ارز رو از Navasan می‌گیره،
// توی حافظه کش می‌کنه، و به فرانت‌اند (سایت خودت) با فرمت تمیز تحویل می‌ده.
//
// نصب:
//   npm init -y
//   npm install express node-fetch dotenv cors
//
// اجرا:
//   NAVASAN_API_KEY=کلید_خودت node server.js

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch"); // v2 برای CommonJS

const app = express();
app.use(cors());

const PORT = process.env.PORT || 10000;
const API_KEY = process.env.BRSAPI_KEY; // هرگز این کلید رو توی فرانت‌اند/کد سمت کاربر نذار

// این نگاشت رو مستقیم از نمونه واقعی پاسخ BrsApi استخراج کردیم (نه حدسی)
const SYMBOL_MAP = {
  ounce: "XAUUSD", // انس طلا (دلار)
  gold18: "IR_GOLD_18K", // طلای ۱۸ عیار (تومان)
  azadi: "IR_COIN_BAHAR", // سکه تمام بهار آزادی
  half: "IR_COIN_HALF", // نیم سکه
  quarter: "IR_COIN_QUARTER", // ربع سکه
  usd: "USD", // دلار
  eur: "EUR", // یورو
};

const REFRESH_INTERVAL_MS = 65 * 1000; // هر ۶۵ ثانیه = ~۱۳۳۰ درخواست در روز (~۱۱٪ حاشیه امن تا سقف ۱۵۰۰ در روز)

let cache = {
  updatedAt: null,
  items: {},
  error: null,
};

async function refreshPrices() {
  if (!API_KEY) {
    cache.error = "BRSAPI_KEY تنظیم نشده";
    return;
  }
  try {
    const url = `https://Api.BrsApi.ir/Market/Gold_Currency.php?key=${API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`پاسخ نامعتبر از BrsApi: ${res.status}`);
    const data = await res.json();

    const rows = [...(data.gold || []), ...(data.currency || [])];

    const items = {};
    for (const [ourId, symbol] of Object.entries(SYMBOL_MAP)) {
      const row = rows.find((r) => r.symbol === symbol);
      if (row) {
        items[ourId] = {
          value: Number(row.price),
          change: Number(row.change_percent ?? 0),
          date: row.date,
        };
      }
    }

    cache = { updatedAt: new Date().toISOString(), items, error: null };
    console.log(`[${new Date().toLocaleTimeString("fa-IR")}] قیمت‌ها آپدیت شدن`);
  } catch (err) {
    cache.error = err.message;
    console.error("خطا در گرفتن قیمت از BrsApi:", err.message);
  }
}

// اولین بار موقع بالا اومدن سرور، و بعد طبق تایمر
refreshPrices();
setInterval(refreshPrices, REFRESH_INTERVAL_MS);

// این endpoint همونیه که فرانت‌اند (سایت/کیوسک) صداش می‌زنه
app.get("/api/prices", (req, res) => {
  res.json(cache);
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true, lastUpdate: cache.updatedAt });
});

app.listen(PORT, () => {
  console.log(`سرور قیمت روی پورت ${PORT} بالا اومد`);
});

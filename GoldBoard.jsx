import React, { useEffect, useMemo, useRef, useState } from "react";
import { Settings, Maximize2, X, ArrowUp, ArrowDown, Store, Palette, Radio } from "lucide-react";

// ---------- helpers ----------
const toFa = (n) =>
  Math.round(n).toLocaleString("fa-IR");

const ACCENTS = [
  { id: "gold", label: "طلایی", base: "#C9982F", light: "#E8C468" },
  { id: "emerald", label: "زمردی", base: "#3E8E63", light: "#6FBE93" },
  { id: "sapphire", label: "یاقوت‌کبود", base: "#3C6E9E", light: "#74A6D1" },
  { id: "ruby", label: "یاقوتی", base: "#A6394A", light: "#D97488" },
];

const ITEM_DEFS = [
  { id: "ounce", label: "انس جهانی طلا", unit: "دلار", base: 2412 },
  { id: "gold18", label: "طلای ۱۸ عیار (هر گرم)", unit: "تومان", base: 6820000 },
  { id: "azadi", label: "سکه تمام بهار آزادی", unit: "تومان", base: 68500000 },
  { id: "half", label: "نیم سکه", unit: "تومان", base: 35200000 },
  { id: "quarter", label: "ربع سکه", unit: "تومان", base: 19800000 },
  { id: "usd", label: "دلار آمریکا", unit: "تومان", base: 92300 },
  { id: "eur", label: "یورو", unit: "تومان", base: 99700 },
];

// آدرس بک‌اند خودت (همون سرور server.js). موقع دیپلوی این رو با دامنه واقعی عوض کن.
const PRICES_ENDPOINT = "/api/prices";

function useLivePrices(defs) {
  const [prices, setPrices] = useState(() => {
    const init = {};
    defs.forEach((d) => (init[d.id] = { value: d.base, dir: 0 }));
    return init;
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchOnce() {
      try {
        const res = await fetch(PRICES_ENDPOINT);
        if (!res.ok) throw new Error("پاسخ نامعتبر از سرور قیمت");
        const data = await res.json();
        if (cancelled || !data?.items) return;

        setPrices((prev) => {
          const next = { ...prev };
          defs.forEach((d) => {
            const incoming = data.items[d.id];
            if (!incoming) return; // اگه سرور برای این آیتم دیتا نداشت، مقدار قبلی می‌مونه
            const cur = prev[d.id]?.value ?? d.base;
            const val = incoming.value;
            next[d.id] = { value: val, dir: val > cur ? 1 : val < cur ? -1 : 0 };
          });
          return next;
        });
      } catch (err) {
        // اگه بک‌اند در دسترس نبود، مقادیر قبلی رو نگه می‌داریم و دوباره تلاش می‌کنیم
        console.warn("خطا در دریافت قیمت:", err.message);
      }
    }

    fetchOnce();
    // چون بک‌اند خودش قیمت رو هر ۲ ساعت (یا هر بازه‌ای که تنظیم کردی) آپدیت می‌کنه،
    // لازم نیست فرانت‌اند خیلی زیاد Poll کنه؛ هر ۱ دقیقه چک کردن کافیه.
    const t = setInterval(fetchOnce, 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [defs]);

  return prices;
}

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

// ---------- Ad placeholder (dashboard-only) ----------
function AdSlot({ variant = "banner" }) {
  const isRail = variant === "rail";
  return (
    <div
      style={{
        border: "1px dashed #8C8474",
        borderRadius: 10,
        background: "rgba(140,132,116,0.08)",
        color: "#B8AF9B",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: isRail ? "18px 10px" : "12px 16px",
        height: isRail ? "100%" : 64,
        minHeight: isRail ? 220 : 64,
        fontSize: 12,
        lineHeight: 1.6,
        letterSpacing: "0.02em",
      }}
    >
      <span>
        جای تبلیغ (نمونه یکتانت)
        <br />
        <span style={{ opacity: 0.7 }}>فقط در پنل مدیریت نمایش داده می‌شود</span>
      </span>
    </div>
  );
}

// ---------- Price row ----------
function PriceRow({ def, data, accent, dense }) {
  const dir = data?.dir ?? 0;
  const color = dir === 1 ? "#4CAF6D" : dir === -1 ? "#E0574A" : accent.light;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: dense ? "10px 14px" : "18px 26px",
        background: "rgba(255,255,255,0.02)",
        borderRight: `3px solid ${dir === 0 ? accent.base : color}`,
        borderRadius: 8,
        transition: "border-color 400ms ease",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ fontSize: dense ? 13 : 18, fontWeight: 700, color: "#F4EEDD" }}>
          {def.label}
        </span>
        <span style={{ fontSize: dense ? 10 : 12, color: "#8C8474" }}>{def.unit}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            fontSize: dense ? 18 : 34,
            fontWeight: 900,
            color: "#F4EEDD",
            letterSpacing: "0.02em",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {toFa(data?.value ?? 0)}
        </span>
        <span style={{ color }}>
          {dir === 1 ? <ArrowUp size={dense ? 14 : 20} /> : dir === -1 ? <ArrowDown size={dense ? 14 : 20} /> : null}
        </span>
      </div>
    </div>
  );
}

// ---------- TV / Kiosk view ----------
function TvMode({ shopName, accent, items, prices, onExit }) {
  const now = useClock();
  const dateStr = now.toLocaleDateString("fa-IR", { weekday: "long", day: "numeric", month: "long" });
  const timeStr = now.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div
      dir="rtl"
      style={{
        position: "fixed",
        inset: 0,
        background: "radial-gradient(circle at 50% 0%, #221C13 0%, #16130F 60%, #0F0D0B 100%)",
        color: "#F4EEDD",
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        padding: "32px 48px",
      }}
    >
      <button
        onClick={onExit}
        style={{
          position: "absolute",
          top: 18,
          left: 18,
          background: "transparent",
          border: "none",
          color: "#8C8474",
          opacity: 0.35,
          cursor: "pointer",
          padding: 8,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = 0.35)}
        aria-label="بازگشت به پنل مدیریت"
      >
        <X size={20} />
      </button>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: `linear-gradient(135deg, ${accent.base}, ${accent.light})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Store size={22} color="#16130F" />
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 900 }}>{shopName || "طلافروشی شما"}</div>
            <div style={{ fontSize: 12, color: "#8C8474" }}>نمایشگر لحظه‌ای قیمت</div>
          </div>
        </div>
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: 32, fontWeight: 900, fontVariantNumeric: "tabular-nums" }}>
            {timeStr.replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d])}
          </div>
          <div style={{ fontSize: 12, color: "#8C8474" }}>{dateStr}</div>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: items.length > 4 ? "1fr 1fr" : "1fr",
          gap: 14,
          alignContent: "center",
        }}
      >
        {items.map((def) => (
          <PriceRow key={def.id} def={def} data={prices[def.id]} accent={accent} />
        ))}
      </div>

      <div style={{ textAlign: "center", fontSize: 11, color: "#5B5548", marginTop: 18 }}>
        بروزرسانی خودکار هر چند ثانیه · قیمت‌ها نمایشی هستند
      </div>
    </div>
  );
}

// ---------- Dashboard / Setup view ----------
export default function GoldBoardApp() {
  const [mode, setMode] = useState("setup");
  const [shopName, setShopName] = useState("طلا و جواهر یاس");
  const [accentId, setAccentId] = useState("gold");
  const [selected, setSelected] = useState(
    Object.fromEntries(ITEM_DEFS.map((d) => [d.id, true]))
  );

  const accent = ACCENTS.find((a) => a.id === accentId);
  const activeDefs = useMemo(() => ITEM_DEFS.filter((d) => selected[d.id]), [selected]);
  const prices = useLivePrices(ITEM_DEFS);

  const toggle = (id) =>
    setSelected((s) => ({ ...s, [id]: !s[id] }));

  if (mode === "tv") {
    return (
      <TvMode
        shopName={shopName}
        accent={accent}
        items={activeDefs.length ? activeDefs : ITEM_DEFS}
        prices={prices}
        onExit={() => setMode("setup")}
      />
    );
  }

  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: "#16130F",
        color: "#F4EEDD",
        fontFamily: "'Vazirmatn', sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;700;900&display=swap');
        * { font-family: 'Vazirmatn', sans-serif; box-sizing: border-box; }
        input[type="text"] { font-family: 'Vazirmatn', sans-serif; }
      `}</style>

      {/* Top ad */}
      <div style={{ padding: "14px 24px 0" }}>
        <AdSlot variant="banner" />
      </div>

      {/* Header */}
      <div style={{ padding: "20px 24px 8px", display: "flex", alignItems: "center", gap: 10 }}>
        <Settings size={20} color={accent.base} />
        <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>پنل مدیریت نمایشگر قیمت</h1>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "220px 1fr 260px",
          gap: 20,
          padding: "12px 24px 32px",
          alignItems: "start",
        }}
      >
        {/* left rail ad */}
        <div>
          <AdSlot variant="rail" />
        </div>

        {/* center: settings + preview */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Shop name */}
          <div style={{ background: "#1F1B15", borderRadius: 12, padding: 18 }}>
            <label style={{ fontSize: 13, color: "#8C8474", display: "block", marginBottom: 8 }}>
              نام مغازه شما
            </label>
            <input
              type="text"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="مثلاً طلا و جواهر یاس"
              style={{
                width: "100%",
                background: "#16130F",
                border: "1px solid #3A342A",
                borderRadius: 8,
                padding: "10px 12px",
                color: "#F4EEDD",
                fontSize: 15,
                outline: "none",
              }}
            />
          </div>

          {/* Accent color */}
          <div style={{ background: "#1F1B15", borderRadius: 12, padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Palette size={16} color="#8C8474" />
              <span style={{ fontSize: 13, color: "#8C8474" }}>رنگ برند نمایشگر</span>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {ACCENTS.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setAccentId(a.id)}
                  title={a.label}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    background: a.base,
                    border: accentId === a.id ? "2px solid #F4EEDD" : "2px solid transparent",
                    cursor: "pointer",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Items to show */}
          <div style={{ background: "#1F1B15", borderRadius: 12, padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Radio size={16} color="#8C8474" />
              <span style={{ fontSize: 13, color: "#8C8474" }}>آیتم‌هایی که نمایش داده شوند</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {ITEM_DEFS.map((d) => (
                <label
                  key={d.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 13,
                    cursor: "pointer",
                    padding: "6px 8px",
                    borderRadius: 6,
                    background: selected[d.id] ? "rgba(255,255,255,0.03)" : "transparent",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={!!selected[d.id]}
                    onChange={() => toggle(d.id)}
                  />
                  {d.label}
                </label>
              ))}
            </div>
          </div>

          {/* Enter TV mode */}
          <button
            onClick={() => setMode("tv")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              background: `linear-gradient(135deg, ${accent.base}, ${accent.light})`,
              color: "#16130F",
              border: "none",
              borderRadius: 10,
              padding: "14px 20px",
              fontSize: 15,
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            <Maximize2 size={18} />
            ورود به حالت نمایش تمام‌صفحه (بدون تبلیغ)
          </button>
        </div>

        {/* right: live preview */}
        <div>
          <div style={{ fontSize: 12, color: "#8C8474", marginBottom: 8 }}>پیش‌نمایش نمایشگر</div>
          <div
            style={{
              background: "#0F0D0B",
              borderRadius: 14,
              padding: 14,
              border: "1px solid #3A342A",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  background: `linear-gradient(135deg, ${accent.base}, ${accent.light})`,
                }}
              />
              <span style={{ fontSize: 12, fontWeight: 700 }}>{shopName || "طلافروشی شما"}</span>
            </div>
            {(activeDefs.length ? activeDefs : ITEM_DEFS).slice(0, 5).map((d) => (
              <PriceRow key={d.id} def={d} data={prices[d.id]} accent={accent} dense />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

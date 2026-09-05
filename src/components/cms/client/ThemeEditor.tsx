"use client";

import { useState } from "react";
import { Check } from "lucide-react";

const HEADING_FONTS = [
  "Cormorant",
  "Cormorant Garamond",
  "Playfair Display",
  "Great Vibes",
  "Cinzel",
  "Libre Baskerville",
  "Merriweather",
];

const BODY_FONTS = [
  "IBM Plex Sans",
  "Lato",
  "Montserrat",
  "Open Sans",
  "Raleway",
  "Poppins",
  "Source Sans Pro",
];

interface Template {
  slug: string;
  name: string;
  description: string;
  tag: string;
  tagColor: string;
  preview: React.ReactNode;
  defaultColors: { primaryColor: string; secondaryColor: string; bgColor: string; textColor: string };
  defaultFonts: { fontHeading: string; fontBody: string };
}

const TEMPLATES: Template[] = [
  {
    slug: "classic-elegant",
    name: "Classic Elegant",
    description: "Klasik abadi dengan sentuhan emas — tipografi serif elegan dan tata letak berpusat yang anggun",
    tag: "Timeless",
    tagColor: "#b8860b",
    defaultColors: { primaryColor: "#b8860b", secondaryColor: "#f5f0e8", bgColor: "#fffdf7", textColor: "#3d3d3d" },
    defaultFonts: { fontHeading: "Playfair Display", fontBody: "Lato" },
    preview: (
      <div style={{ background: "#fffdf7", borderRadius: "12px", padding: "1rem", minHeight: "130px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "7px", border: "1px solid #b8860b33" }}>
        <div style={{ width: "44px", height: "1px", background: "#b8860b66" }} />
        <p style={{ color: "#b8860b", fontSize: "7px", letterSpacing: "0.3em", fontFamily: "Georgia,serif" }}>THE WEDDING OF</p>
        <p style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: "15px", fontWeight: 400, color: "#3d3d3d" }}>Jordy <span style={{ color: "#b8860b" }}>&</span> Rea</p>
        <div style={{ width: "44px", height: "1px", background: "#b8860b66" }} />
        <div style={{ display: "flex", gap: "5px", marginTop: "2px" }}>
          {["12", "08", "30"].map((n) => (
            <div key={n} style={{ width: "17px", height: "21px", background: "#f5f0e8", border: "1px solid #b8860b44", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontFamily: "Georgia,serif", color: "#b8860b" }}>{n}</div>
          ))}
        </div>
      </div>
    ),
  },
  {
    slug: "modern-minimal",
    name: "Modern Minimal",
    description: "Bersih dan modern — whitespace lega, tipografi tegas, foto full-bleed tanpa hiasan",
    tag: "Minimalis",
    tagColor: "#1c1c1c",
    defaultColors: { primaryColor: "#1c1c1c", secondaryColor: "#f1f0ec", bgColor: "#fafaf8", textColor: "#1c1c1c" },
    defaultFonts: { fontHeading: "IBM Plex Sans", fontBody: "IBM Plex Sans" },
    preview: (
      <div style={{ background: "#fafaf8", borderRadius: "12px", padding: "1rem", minHeight: "130px", display: "flex", flexDirection: "column", justifyContent: "center", gap: "6px", border: "1px solid #e5e3de" }}>
        <p style={{ color: "#a3a099", fontSize: "7px", letterSpacing: "0.35em", fontFamily: "system-ui" }}>THE WEDDING OF</p>
        <p style={{ fontSize: "16px", fontWeight: 300, color: "#1c1c1c", fontFamily: "system-ui", letterSpacing: "-0.02em" }}>Jordy <span style={{ color: "#1c1c1c99" }}>/</span> Rea</p>
        <div style={{ width: "100%", height: "1px", background: "#e5e3de" }} />
        <div style={{ display: "flex", gap: "12px" }}>
          {[["120", "Hari"], ["08", "Jam"]].map(([v, l]) => (
            <div key={l}>
              <span style={{ fontSize: "13px", fontWeight: 300, color: "#1c1c1c", fontFamily: "system-ui" }}>{v}</span>
              <span style={{ fontSize: "6px", letterSpacing: "0.2em", color: "#a3a099", marginLeft: "3px" }}>{l.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    slug: "floral-blush",
    name: "Floral Blush",
    description: "Romantis dan lembut — nuansa blush pink, kartu membulat, dan tipografi script yang manis",
    tag: "Romantis",
    tagColor: "#c98283",
    defaultColors: { primaryColor: "#c98283", secondaryColor: "#f7e4e1", bgColor: "#faf0ef", textColor: "#5c4444" },
    defaultFonts: { fontHeading: "Great Vibes", fontBody: "Lato" },
    preview: (
      <div style={{ background: "linear-gradient(150deg,#faf0ef,#f7e4e1)", borderRadius: "12px", padding: "1rem", minHeight: "130px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px", border: "1px solid #c9828333" }}>
        <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "radial-gradient(circle at 38% 35%, #d9a3a4, #c98283)", boxShadow: "0 2px 6px #c9828344" }} />
        <p style={{ fontFamily: "'Brush Script MT','Segoe Script',cursive", fontSize: "18px", color: "#c98283" }}>Jordy & Rea</p>
        <div style={{ display: "flex", gap: "4px" }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ width: "26px", height: "26px", borderRadius: "50%", background: i === 1 ? "#ffffffcc" : "#fbdcd8", border: "1px solid #c9828326" }} />
          ))}
        </div>
      </div>
    ),
  },
  {
    slug: "luxe-darkgold",
    name: "Luxe Dark Gold",
    description: "Mewah dan dramatis — hitam pekat berpadu emas, cocok untuk undangan formal bergaya gala",
    tag: "Luxury",
    tagColor: "#d4af37",
    defaultColors: { primaryColor: "#d4af37", secondaryColor: "#1a1a1e", bgColor: "#0e0e10", textColor: "#efe9dc" },
    defaultFonts: { fontHeading: "Cinzel", fontBody: "Lato" },
    preview: (
      <div style={{ background: "#0e0e10", borderRadius: "12px", padding: "1rem", minHeight: "130px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px", border: "1px solid #d4af3744" }}>
        <p style={{ color: "#d4af37", fontSize: "7px", letterSpacing: "0.45em" }}>THE WEDDING OF</p>
        <p style={{ fontFamily: "Georgia,serif", fontSize: "15px", color: "#efe9dc", letterSpacing: "0.06em" }}>Jordy</p>
        <p style={{ color: "#d4af37", fontSize: "9px" }}>✦ &amp; ✦</p>
        <p style={{ fontFamily: "Georgia,serif", fontSize: "15px", color: "#efe9dc", letterSpacing: "0.06em" }}>Rea</p>
      </div>
    ),
  },
  {
    slug: "sage-botanical",
    name: "Sage Botanical",
    description: "Alami dan menenangkan — hijau sage dengan aksen daun, foto oval, nuansa taman yang segar",
    tag: "Botanikal",
    tagColor: "#7c9070",
    defaultColors: { primaryColor: "#7c9070", secondaryColor: "#e8ebdf", bgColor: "#f4f3ec", textColor: "#37412f" },
    defaultFonts: { fontHeading: "Cormorant Garamond", fontBody: "Lato" },
    preview: (
      <div style={{ background: "#f4f3ec", borderRadius: "12px", padding: "1rem", minHeight: "130px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", border: "1px solid #7c907033" }}>
        <div style={{ width: "30px", height: "40px", borderRadius: "18px 18px 8px 8px", background: "linear-gradient(160deg,#b9c6ad,#7c9070)" }} />
        <div style={{ textAlign: "center" }}>
          <p style={{ fontFamily: "Georgia,serif", fontSize: "14px", fontWeight: 300, color: "#37412f" }}>Jordy <span style={{ color: "#7c9070", fontStyle: "italic" }}>&amp;</span> Rea</p>
          <p style={{ fontSize: "7px", letterSpacing: "0.3em", color: "#8a9382", marginTop: "4px" }}>THE WEDDING OF</p>
        </div>
        <div style={{ width: "30px", height: "40px", borderRadius: "8px 8px 18px 18px", background: "linear-gradient(200deg,#dce3d2,#9db08e)" }} />
      </div>
    ),
  },
  {
    slug: "rustic-terracotta",
    name: "Rustic Terracotta",
    description: "Hangat seperti kertas kerajinan — kartu putih dengan selotip dekoratif, garis putus-putus, nuansa countryside",
    tag: "Rustic",
    tagColor: "#b5674d",
    defaultColors: { primaryColor: "#b5674d", secondaryColor: "#f0e6d6", bgColor: "#faf6ef", textColor: "#4a3c33" },
    defaultFonts: { fontHeading: "Libre Baskerville", fontBody: "Lato" },
    preview: (
      <div style={{ background: "#faf6ef", borderRadius: "12px", padding: "1rem", minHeight: "130px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #b5674d26" }}>
        <div style={{ background: "#fffdf8", borderRadius: "10px", padding: "10px 16px", boxShadow: "0 4px 12px rgba(74,60,51,.12)", position: "relative", textAlign: "center" }}>
          <div style={{ position: "absolute", top: "-6px", left: "50%", transform: "translateX(-50%) rotate(-2deg)", width: "44px", height: "12px", background: "#f0e6d6", borderLeft: "1px dashed #b5674d55", borderRight: "1px dashed #b5674d55" }} />
          <p style={{ fontFamily: "Georgia,serif", fontSize: "13px", color: "#4a3c33" }}>Jordy &amp; Rea</p>
          <div style={{ margin: "5px auto 0", width: "28px", borderTop: "2px dashed #b5674d88" }} />
        </div>
      </div>
    ),
  },
  {
    slug: "jawa-ageng",
    name: "Jawa Ageng",
    description: "Tradisional Jawa — motif batik emas di atas indigo tua, bingkai ganda, salam krama yang luhur",
    tag: "Adat Jawa",
    tagColor: "#c9a227",
    defaultColors: { primaryColor: "#c9a227", secondaryColor: "#28345e", bgColor: "#1f2a52", textColor: "#f2ecdd" },
    defaultFonts: { fontHeading: "Cinzel", fontBody: "Lato" },
    preview: (
      <div style={{ background: "#1f2a52", backgroundImage: "radial-gradient(circle at 25% 25%, #c9a22722 2px, transparent 2.5px), radial-gradient(circle at 75% 75%, #c9a22722 2px, transparent 2.5px)", backgroundSize: "20px 20px", borderRadius: "12px", padding: "1rem", minHeight: "130px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "5px", border: "1px solid #c9a22744" }}>
        <div style={{ border: "1px solid #c9a22799", outline: "1px solid #c9a22744", outlineOffset: "2px", padding: "7px 16px", textAlign: "center" }}>
          <p style={{ fontFamily: "Georgia,serif", fontSize: "13px", color: "#c9a227" }}>Jordy</p>
          <p style={{ color: "#c9a227", fontSize: "8px", margin: "2px 0" }}>❦</p>
          <p style={{ fontFamily: "Georgia,serif", fontSize: "13px", color: "#c9a227" }}>Rea</p>
        </div>
      </div>
    ),
  },
  {
    slug: "ambon-manise",
    name: "Ambon Manise",
    description: "Nuansa laut Banda — biru tosca dengan motif ombak dan cengkeh, hangat khas Maluku",
    tag: "Ambon",
    tagColor: "#0b5563",
    defaultColors: { primaryColor: "#0b5563", secondaryColor: "#e9f2f2", bgColor: "#f8f2e4", textColor: "#123f49" },
    defaultFonts: { fontHeading: "Playfair Display", fontBody: "Lato" },
    preview: (
      <div style={{ background: "#e9f2f2", borderRadius: "12px", padding: "1rem", minHeight: "130px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "5px", border: "1px solid #0b556333" }}>
        <span style={{ width: ".7rem", height: ".7rem", background: "#0b5563", clipPath: "polygon(50% 0%, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0% 50%, 38% 38%)" }} />
        <p style={{ fontFamily: "Georgia,serif", fontSize: "14px", color: "#123f49" }}>Jordy <span style={{ color: "#0b5563" }}>&amp;</span> Rea</p>
        <p style={{ fontSize: "7px", letterSpacing: "0.3em", color: "#6e939b" }}>DARI AMBON YANG MANISE</p>
        <div style={{ width: "70%", height: "10px", backgroundImage: "radial-gradient(circle at 8px -2px, transparent 7px, #128a9733 8px)", backgroundSize: "16px 10px" }} />
      </div>
    ),
  },
  {
    slug: "islami-emerald",
    name: "Islami Emerald",
    description: "Hijau zamrud bernuansa islami — lengkung kubah, ornamen geometris, dibuka dengan salam",
    tag: "Islami",
    tagColor: "#166534",
    defaultColors: { primaryColor: "#166534", secondaryColor: "#e4efe0", bgColor: "#fbfaf2", textColor: "#1c3a26" },
    defaultFonts: { fontHeading: "Playfair Display", fontBody: "Lato" },
    preview: (
      <div style={{ background: "#fbfaf2", borderRadius: "12px", padding: "1rem", minHeight: "130px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "5px", border: "1px solid #16653433" }}>
        <div style={{ width: "44px", height: "30px", borderRadius: "999px 999px 4px 4px", background: "#166534", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: "#e8d44d", fontSize: "9px" }}>★</span>
        </div>
        <p style={{ fontFamily: "Georgia,serif", fontSize: "14px", color: "#1c3a26" }}>Jordy &amp; Rea</p>
        <p style={{ fontSize: "7px", color: "#166534" }}>Assalamu&#39;alaikum</p>
      </div>
    ),
  },
  {
    slug: "sangjit-merah",
    name: "Sangjit Merah",
    description: "Merah-emas khas Tionghoa — lampion, karakter 囍 double happiness, serasi untuk acara sangjit",
    tag: "Tionghoa",
    tagColor: "#9e1b32",
    defaultColors: { primaryColor: "#9e1b32", secondaryColor: "#fbe9dc", bgColor: "#fdf6ec", textColor: "#4a1a12" },
    defaultFonts: { fontHeading: "Playfair Display", fontBody: "Lato" },
    preview: (
      <div style={{ background: "#fdf6ec", borderRadius: "12px", padding: "1rem", minHeight: "130px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "5px", border: "1px solid #9e1b3233" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "6px" }}>
          <span style={{ width: "14px", height: "17px", borderRadius: "50%/45%", background: "radial-gradient(circle at 35% 30%, #e74c3c, #9e1b32)" }} />
          <p style={{ color: "#f5c542", fontSize: "18px", fontFamily: "serif" }}>囍</p>
          <span style={{ width: "14px", height: "17px", borderRadius: "50%/45%", background: "radial-gradient(circle at 35% 30%, #e74c3c, #9e1b32)" }} />
        </div>
        <p style={{ fontFamily: "Georgia,serif", fontSize: "13px", color: "#4a1a12" }}>Jordy &amp; Rea</p>
      </div>
    ),
  },
  {
    slug: "minang-gadang",
    name: "Minang Gadang",
    description: "Tradisi Minangkabau — merah marun bersulam songket emas, sakapua baralek gadang urang awak",
    tag: "Minang",
    tagColor: "#8c2f39",
    defaultColors: { primaryColor: "#8c2f39", secondaryColor: "#efe3cf", bgColor: "#fbf7ee", textColor: "#3d2620" },
    defaultFonts: { fontHeading: "Playfair Display", fontBody: "Lato" },
    preview: (
      <div style={{ background: "#fbf7ee", borderRadius: "12px", padding: "1rem", minHeight: "130px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "5px", border: "1px solid #8c2f3933", backgroundImage: "repeating-linear-gradient(45deg,#8c2f3910 0 2px,transparent 2px 10px)" }}>
        <span style={{ width: "0.8rem", height: "0.8rem", background: "#8c2f39", clipPath: "polygon(50% 0%, 100% 100%, 50% 78%, 0% 100%)" }} />
        <p style={{ fontFamily: "Georgia,serif", fontSize: "14px", color: "#3d2620" }}>Jordy <span style={{ color: "#e3b23c" }}>&amp;</span> Rea</p>
        <p style={{ fontSize: "7px", letterSpacing: "0.28em", color: "#8c2f39" }}>BARALEK GADANG</p>
      </div>
    ),
  },
  {
    slug: "batak-ulos",
    name: "Batak Ulos",
    description: "Tenunan ulos Batak — jalur merah-emas-hitam, sapaan Horas yang penuh doa dan tondi marnida",
    tag: "Batak",
    tagColor: "#7a1f1f",
    defaultColors: { primaryColor: "#7a1f1f", secondaryColor: "#f0e6ce", bgColor: "#faf6ef", textColor: "#2d2320" },
    defaultFonts: { fontHeading: "Libre Baskerville", fontBody: "Lato" },
    preview: (
      <div style={{ background: "#faf6ef", borderRadius: "12px", padding: "1rem", minHeight: "130px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px", border: "1px solid #7a1f1f33" }}>
        <span style={{ width: "52px", height: "9px", borderRadius: "999px", background: "repeating-linear-gradient(90deg,#7a1f1f 0 6px,#e8b931 6px 12px,#1a1a1a 12px 18px)" }} />
        <p style={{ fontFamily: "Georgia,serif", fontSize: "14px", color: "#2d2320" }}>Jordy &amp; Rea</p>
        <p style={{ fontSize: "8px", fontWeight: 700, letterSpacing: "0.2em", color: "#7a1f1f" }}>HORAS!</p>
      </div>
    ),
  },
  {
    slug: "hanoi-modern",
    name: "Hanoi Modern",
    description: "Modern editorial bernuansa Hanoi — tipografi tegas, layout majalah, dan aksen warna berani",
    tag: "Editorial",
    tagColor: "#f43f5e",
    defaultColors: { primaryColor: "#1a1a1a", secondaryColor: "#E4DEDB", bgColor: "#EEEDE8", textColor: "#1a1a1a" },
    defaultFonts: { fontHeading: "Cormorant Garamond", fontBody: "Jost" },
    preview: (
      <div style={{ background: "#EEEDE8", borderRadius: "12px", padding: "1rem", minHeight: "130px", display: "flex", flexDirection: "column", justifyContent: "center", gap: "5px", border: "1px solid #f43f5e33" }}>
        <p style={{ fontSize: "7px", letterSpacing: "0.4em", color: "#f43f5e", fontWeight: 700 }}>THE WEDDING OF</p>
        <p style={{ fontFamily: "Georgia,serif", fontSize: "17px", color: "#1a1a1a", lineHeight: 1.15 }}>Jordy<br /> &amp; Rea</p>
        <div style={{ width: "34px", height: "2px", background: "#f43f5e" }} />
      </div>
    ),
  },

];

interface Theme {
  templateSlug: string;
  primaryColor: string;
  secondaryColor: string;
  bgColor: string;
  textColor: string;
  fontHeading: string;
  fontBody: string;
  showMap: boolean;
  autoScroll?: boolean | null;
  barcodeVisibility: "ALWAYS" | "AFTER_RSVP" | "HIDDEN";
  barcodeMode: "SINGLE" | "SEPARATE";
  requireRsvpForWish?: boolean | null;
}

interface Props {
  clientId: string;
  initialTheme: Theme;
}

const labelClass = "block text-xs font-medium text-stone-600 mb-1";
const inputClass =
  "w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300";

export function ThemeEditor({ clientId, initialTheme }: Props) {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  function update<K extends keyof Theme>(key: K, value: Theme[K]) {
    setTheme((prev) => ({ ...prev, [key]: value }));
    setSuccess(false);
  }

  function selectTemplate(tpl: Template) {
    setTheme((prev) => ({
      ...prev,
      templateSlug: tpl.slug,
      ...tpl.defaultColors,
      ...tpl.defaultFonts,
    }));
    setSuccess(false);
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const res = await fetch(`/api/clients/${clientId}/theme`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(theme),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Gagal menyimpan tema"); return; }
      setSuccess(true);
    } finally {
      setSaving(false);
    }
  }

  const activeTemplate = TEMPLATES.find((t) => t.slug === theme.templateSlug) ?? TEMPLATES[0];


  return (
    <div className="space-y-6">

      {/* Template selector */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6">
        <h2 className="font-semibold text-stone-800 mb-1">Pilih Tema Undangan</h2>
        <p className="text-xs text-stone-400 mb-5">Setiap tema memiliki desain, animasi, dan nuansa yang berbeda</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {TEMPLATES.map((tpl) => {
            const isActive = theme.templateSlug === tpl.slug;
            return (
              <button
                key={tpl.slug}
                onClick={() => selectTemplate(tpl)}
                className="relative text-left rounded-2xl border-2 overflow-hidden transition-all duration-200 hover:shadow-md"
                style={{
                  borderColor: isActive ? tpl.tagColor : "#e7e5e4",
                  boxShadow: isActive ? `0 0 0 1px ${tpl.tagColor}55, 0 8px 24px ${tpl.tagColor}18` : undefined,
                }}
              >
                {/* Preview */}
                <div className="p-3">
                  {tpl.preview}
                </div>

                {/* Info */}
                <div className="px-3 pb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-stone-800 text-sm">{tpl.name}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: `${tpl.tagColor}18`, color: tpl.tagColor }}>
                      {tpl.tag}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 leading-relaxed">{tpl.description}</p>
                </div>

                {/* Active check */}
                {isActive && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: tpl.tagColor }}>
                    <Check size={12} color="#fff" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">

          {/* Colors */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6">
            <h2 className="font-semibold text-stone-800 mb-1">Warna</h2>
            <p className="text-xs text-stone-400 mb-5">Sesuaikan warna dengan tema undangan Anda</p>
            <div className="grid grid-cols-2 gap-4">
              <ColorField label="Warna Utama" hint="Tombol, aksen, dekorasi"
                value={theme.primaryColor} onChange={(v) => update("primaryColor", v)} />
              <ColorField label="Warna Sekunder" hint="Background kartu, section"
                value={theme.secondaryColor} onChange={(v) => update("secondaryColor", v)} />
              <ColorField label="Background" hint="Warna dasar halaman"
                value={theme.bgColor} onChange={(v) => update("bgColor", v)} />
              <ColorField label="Warna Teks" hint="Teks utama konten"
                value={theme.textColor} onChange={(v) => update("textColor", v)} />
            </div>
          </div>

          {/* Fonts */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6">
            <h2 className="font-semibold text-stone-800 mb-1">Font</h2>
            <p className="text-xs text-stone-400 mb-5">Font heading dipakai untuk nama pengantin dan judul section</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Font Heading</label>
                <select value={theme.fontHeading} onChange={(e) => update("fontHeading", e.target.value)} className={inputClass}>
                  {HEADING_FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
                {theme.fontHeading && (
                  <p className="text-stone-400 text-xs mt-2 italic" style={{ fontFamily: `'${theme.fontHeading}', Georgia, serif` }}>
                    Contoh: Groom &amp; Bride
                  </p>
                )}
              </div>
              <div>
                <label className={labelClass}>Font Body</label>
                <select value={theme.fontBody} onChange={(e) => update("fontBody", e.target.value)} className={inputClass}>
                  {BODY_FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
                {theme.fontBody && (
                  <p className="text-stone-400 text-xs mt-2" style={{ fontFamily: `'${theme.fontBody}', sans-serif` }}>
                    Contoh: Dengan hormat kami mengundang
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6">
            <h2 className="font-semibold text-stone-800 mb-1">Pengaturan Tampilan</h2>
            <p className="text-xs text-stone-400 mb-4">Pilih elemen yang ingin ditampilkan di undangan</p>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-stone-700">Tampilkan Peta Lokasi</p>
                  <p className="text-xs text-stone-400 mt-0.5">Tampilkan Google Maps interaktif di setiap lokasi acara</p>
                </div>
                <button
                  type="button"
                  onClick={() => update("showMap", !theme.showMap)}
                  className="relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ml-4"
                  style={{ background: theme.showMap ? "#292524" : "#d6d3d1" }}
                >
                  <span
                    className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
                    style={{ transform: theme.showMap ? "translateX(20px)" : "translateX(0)" }}
                  />
                </button>
              </label>

              <label className="flex items-center justify-between cursor-pointer border-t border-stone-100 pt-4">
                <div>
                  <p className="text-sm font-medium text-stone-700">Auto Scroll Undangan</p>
                  <p className="text-xs text-stone-400 mt-0.5">Halaman bergulir perlahan otomatis setelah undangan dibuka — berhenti saat tamu menggulir sendiri</p>
                </div>
                <button
                  type="button"
                  onClick={() => update("autoScroll", theme.autoScroll ?? true ? false : true)}
                  className="relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ml-4"
                  style={{ background: (theme.autoScroll ?? true) ? "#292524" : "#d6d3d1" }}
                >
                  <span
                    className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
                    style={{ transform: (theme.autoScroll ?? true) ? "translateX(20px)" : "translateX(0)" }}
                  />
                </button>
              </label>

              <div className="border-t border-stone-100 pt-4">
                <div className="mb-2">
                  <p className="text-sm font-medium text-stone-700">Kapan Barcode Tiket Ditampilkan</p>
                  <p className="text-xs text-stone-400 mt-0.5">Atur kapan QR code e-tiket muncul di undangan tamu</p>
                </div>
                <select
                  value={theme.barcodeVisibility}
                  onChange={(e) => update("barcodeVisibility", e.target.value as Theme["barcodeVisibility"])}
                  className={inputClass}
                >
                  <option value="AFTER_RSVP">Muncul setelah tamu konfirmasi kehadiran (RSVP)</option>
                  <option value="ALWAYS">Selalu tampil tanpa perlu RSVP terlebih dahulu</option>
                  <option value="HIDDEN">Tidak tampilkan barcode sama sekali</option>
                </select>
              </div>

              <div className="border-t border-stone-100 pt-4">
                <div className="mb-2">
                  <p className="text-sm font-medium text-stone-700">Mode Barcode Tamu</p>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Setelah diganti, pakai tombol &quot;Regenerate Semua Barcode&quot; di tab Tamu supaya tamu yang sudah ada ikut menyesuaikan.
                  </p>
                </div>
                <select
                  value={theme.barcodeMode}
                  onChange={(e) => update("barcodeMode", e.target.value as Theme["barcodeMode"])}
                  className={inputClass}
                >
                  <option value="SEPARATE">Terpisah — barcode beda untuk tamu Akad/Ibadah vs Resepsi</option>
                  <option value="SINGLE">Satu barcode — berlaku untuk semua acara yang tamu itu diundang</option>
                </select>
              </div>

              <label className="flex items-center justify-between cursor-pointer border-t border-stone-100 pt-4">
                <div>
                  <p className="text-sm font-medium text-stone-700">Wajib RSVP Sebelum Kirim Ucapan</p>
                  <p className="text-xs text-stone-400 mt-0.5">Tamu harus konfirmasi kehadiran dulu baru bisa kirim ucapan & doa</p>
                </div>
                <button
                  type="button"
                  onClick={() => update("requireRsvpForWish", !(theme.requireRsvpForWish ?? false))}
                  className="relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ml-4"
                  style={{ background: (theme.requireRsvpForWish ?? false) ? "#292524" : "#d6d3d1" }}
                >
                  <span
                    className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
                    style={{ transform: (theme.requireRsvpForWish ?? false) ? "translateX(20px)" : "translateX(0)" }}
                  />
                </button>
              </label>

            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "Menyimpan..." : success ? "✓ Tersimpan!" : "Simpan Tema"}
          </button>
        </div>

        {/* Live mini-preview sidebar */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-stone-200 overflow-hidden sticky top-6">
            <div className="px-4 py-3 bg-white border-b border-stone-100 flex items-center justify-between">
              <h3 className="font-semibold text-stone-800 text-sm">Preview</h3>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: `${activeTemplate.tagColor}18`, color: activeTemplate.tagColor }}>
                {activeTemplate.name}
              </span>
            </div>
            <div className="p-4" style={{ background: theme.bgColor }}>
              <div className="rounded-xl overflow-hidden mb-3" style={{ background: theme.bgColor }}>
                {/* Header bubble */}
                <div className="rounded-xl p-4 text-center mb-3"
                  style={{ background: theme.secondaryColor, border: `1px solid ${theme.primaryColor}33` }}>
                  <p className="text-xs italic mb-1"
                    style={{ color: theme.primaryColor, fontFamily: `'${theme.fontHeading}', Georgia, serif` }}>
                    The Wedding Of
                  </p>
                  <p className="text-lg font-light"
                    style={{ color: theme.textColor, fontFamily: `'${theme.fontHeading}', Georgia, serif` }}>
                    Groom &amp; Bride
                  </p>
                </div>
                <div className="h-px w-8 mx-auto mb-3" style={{ background: `linear-gradient(90deg,transparent,${theme.primaryColor},transparent)` }} />
                <p className="text-xs font-light text-center mb-3"
                  style={{ color: theme.textColor + "80", fontFamily: `'${theme.fontBody}', sans-serif` }}>
                  Dengan hormat kami mengundang
                </p>
                <div className="rounded-xl p-3 mb-3"
                  style={{ background: theme.secondaryColor }}>
                  <p className="text-xs font-light text-center"
                    style={{ color: theme.primaryColor, fontFamily: `'${theme.fontHeading}', Georgia, serif` }}>
                    Detail Acara
                  </p>
                  <p className="text-xs mt-1 text-center"
                    style={{ color: theme.textColor + "70", fontFamily: `'${theme.fontBody}', sans-serif` }}>
                    Sabtu, 1 Februari 2026
                  </p>
                </div>
                <div className="text-center">
                  <span className="inline-block px-4 py-1.5 rounded-full text-xs font-medium"
                    style={{ background: theme.primaryColor, color: "#fff" }}>
                    Buka Undangan
                  </span>
                </div>
              </div>
            </div>
            <div className="px-4 py-2 bg-stone-50 border-t border-stone-100">
              <p className="text-xs text-stone-400 text-center">Preview kasar — lihat undangan untuk hasil sebenarnya</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ColorField({ label, hint, value, onChange }: {
  label: string; hint: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <div className="flex items-center gap-2 border border-stone-200 rounded-lg px-3 py-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
          className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent p-0" />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
          className="flex-1 text-sm font-mono focus:outline-none bg-transparent" maxLength={7} />
      </div>
      <p className="text-xs text-stone-400 mt-1">{hint}</p>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Maximize2, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface BarcodeItem {
  code: string;
  label: string;
  sublabel: string;
}

/** Keeps the screen awake while a QR is shown fullscreen, so it doesn't dim mid-scan. Silently no-ops where unsupported. */
function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;

    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;

    navigator.wakeLock
      .request("screen")
      .then((lock) => {
        if (cancelled) {
          lock.release();
        } else {
          sentinel = lock;
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      sentinel?.release().catch(() => {});
    };
  }, [active]);
}

interface Props {
  barcodeChurch: string | null | undefined;
  barcodeReception?: string | null;
  /** Theme.barcodeVisibility: "ALWAYS" | "AFTER_RSVP" | "HIDDEN". Defaults to "AFTER_RSVP". */
  barcodeVisibility?: string | null;
  /** Guest's current RSVP status, used when barcodeVisibility is "AFTER_RSVP". */
  rsvpStatus?: string | null;
  /** Human-readable label for the first barcode, e.g. "Akad", "Pemberkatan", "Sangjit" */
  churchLabel?: string;
  /** Human-readable label for the second barcode, e.g. "Resepsi" */
  receptionLabel?: string;
  churchVenueName?: string;
  receptionVenueName?: string;
  primaryColor?: string;
  bgColor?: string;
  fontHeading?: string;
  lang?: "id" | "en";
}

const TR = {
  id: {
    eyebrow: "E-Tiket",
    heading: "Tiket Undangan",
    ticketPrefix: "Tiket Masuk",
    footer: "Tunjukkan tiket ini kepada petugas saat tiba di venue.",
  },
  en: {
    eyebrow: "E-Ticket",
    heading: "Invitation Ticket",
    ticketPrefix: "Entrance Ticket",
    footer: "Please show this ticket to the staff upon arrival at the venue.",
  },
} as const;

/** Resolve an event's venue name in the given language, falling back to the Indonesian name. */
export function getEventVenueName(
  event: { venueName?: string | null; venueNameEn?: string | null } | undefined,
  lang: "id" | "en",
  fallback: string
): string {
  if (!event) return fallback;
  return (lang === "en" && event.venueNameEn) || event.venueName || fallback;
}

export function BarcodeSection({
  barcodeChurch,
  barcodeReception,
  barcodeVisibility,
  rsvpStatus,
  churchLabel = "Acara",
  receptionLabel = "Resepsi",
  churchVenueName = "Venue",
  receptionVenueName = "Resepsi",
  primaryColor = "#b8860b",
  bgColor = "#fffdf7",
  fontHeading = "Playfair Display",
  lang = "en",
}: Props) {
  const [expanded, setExpanded] = useState<BarcodeItem | null>(null);
  useWakeLock(expanded !== null);

  useEffect(() => {
    if (!expanded) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [expanded]);

  if (!barcodeChurch) return null;

  const visibility = barcodeVisibility ?? "AFTER_RSVP";
  const shouldShow = visibility === "ALWAYS" || (visibility === "AFTER_RSVP" && rsvpStatus === "HADIR");

  if (!shouldShow) return null;

  const t = TR[lang];

  const items: BarcodeItem[] = [
    {
      code: barcodeChurch,
      label: `${t.ticketPrefix} – ${churchLabel}`,
      sublabel: churchVenueName,
    },
  ];

  if (barcodeReception) {
    items.push({
      code: barcodeReception,
      label: `${t.ticketPrefix} – ${receptionLabel}`,
      sublabel: receptionVenueName,
    });
  }

  return (
    <section className="py-16 px-4" style={{ backgroundColor: bgColor }}>
      <div className="max-w-lg mx-auto text-center">
        <p
          className="text-xs tracking-[0.28em] uppercase mb-3"
          style={{ color: primaryColor }}
        >
          {t.eyebrow}
        </p>
        <h2
          className="text-3xl mb-10"
          style={{ fontFamily: `'${fontHeading}', Georgia, serif`, color: primaryColor }}
        >
          {t.heading}
        </h2>

        <div className={`flex ${items.length > 1 ? "gap-8 justify-center flex-wrap" : "justify-center"}`}>
          {items.map((item) => (
            <div
              key={item.code}
              className="flex flex-col items-center gap-4 bg-white rounded-2xl px-6 py-8 shadow-sm border"
              style={{ borderColor: `${primaryColor}30`, width: "365px" }}
            >
              <p
                className="text-xs tracking-[0.2em] uppercase font-medium text-center"
                style={{ color: primaryColor, minHeight: "2.5em" }}
              >
                {item.label}
              </p>

              <button
                type="button"
                onClick={() => setExpanded(item)}
                className="relative p-3 rounded-xl bg-white"
                aria-label="Perbesar QR code"
              >
                <QRCodeSVG value={item.code} size={160} level="H" fgColor="#000000" bgColor="#FFFFFF" />
                <span
                  className="absolute -bottom-2 -right-2 flex items-center justify-center w-8 h-8 rounded-full shadow-sm border border-stone-100"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Maximize2 size={14} className="text-white" />
                </span>
              </button>

              <p className="text-sm font-medium text-stone-700 text-center">{item.sublabel}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-stone-400 mt-8">
          {t.footer}
        </p>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setExpanded(null);
            }}
          >
            <button
              type="button"
              onClick={() => setExpanded(null)}
              className="absolute top-6 right-6 flex items-center justify-center w-10 h-10 rounded-full bg-stone-100 hover:bg-stone-200 transition-colors"
              aria-label="Tutup"
            >
              <X size={20} className="text-stone-700" />
            </button>

            <p
              className="text-xs tracking-[0.2em] uppercase font-medium text-center mb-6 text-stone-500"
              style={{ minHeight: "2.5em" }}
            >
              {expanded.label}
            </p>

            <QRCodeSVG value={expanded.code} size={280} level="H" fgColor="#000000" bgColor="#FFFFFF" />

            <p className="text-sm font-medium text-stone-700 text-center mt-6">{expanded.sublabel}</p>
            <p className="text-xs text-stone-400 mt-8 max-w-xs text-center">{t.footer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import Image from "next/image";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  type Variants,
} from "framer-motion";
import {
  MapPin,
  Clock,
  Calendar,
  Copy,
  Check,
  Wallet,
  QrCode,
  Gift,
  Send,
  Heart,
  LockKeyhole,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { JackpotCover } from "./JackpotCover";
import { MusicPlayer } from "../../sections/MusicPlayer";
import { BarcodeSection, getEventVenueName } from "../../sections/BarcodeSection";
import { AttentionSection } from "../../sections/AttentionSection";
import { formatDate } from "@/lib/utils";
import { findMenuEvent } from "@/lib/menu";
import type { Rsvp } from "@/types/prisma.types";
import { useGuestLanguage } from "@/hooks/useGuestLanguage";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function storyToHtml(s: string | null | undefined): string {
  if (!s) return "";
  if (s.includes("<")) return s;
  return s.replace(/&/g, "&amp;").replace(/\n/g, "<br>");
}

function useCountdown(target: Date | null) {
  type T = { days: number; hours: number; minutes: number; seconds: number };
  const targetMs = target?.getTime() ?? null;
  const [t, setT] = useState<T | null>(null);
  useEffect(() => {
    if (targetMs === null) return;
    function calc() {
      const diff = targetMs! - Date.now();
      if (diff <= 0) { setT(null); return; }
      setT({ days: Math.floor(diff / 86400000), hours: Math.floor((diff / 3600000) % 24), minutes: Math.floor((diff / 60000) % 60), seconds: Math.floor((diff / 1000) % 60) });
    }
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [targetMs]);
  return targetMs !== null ? t : null;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Guest {
  id: string;
  name: string;
  maxPax: number;
  rsvp: Rsvp | null;
  invitationCategory?: string;
  barcodeChurch?: string | null;
  barcodeReception?: string | null;
}

type Profile = {
  groomName: string;
  brideName: string;
  groomNickname: string;
  brideNickname: string;
  groomParents: string;
  brideParents: string;
  groomParentsEn: string | null;
  brideParentsEn: string | null;
  openingQuote: string | null;
  openingQuoteEn: string | null;
  openingQuoteBy: string | null;
  openingQuoteByEn: string | null;
  story: string | null;
  storyEn: string | null;
  storyTitle: string | null;
  storyTitleEn: string | null;
  showStoryTitle: boolean;
  heroImage: string | null;
  groomPhoto: string | null;
  bridePhoto: string | null;
  showGroomPhoto: boolean;
  showBridePhoto: boolean;
  attentionTitle: string | null;
  attentionContent: string | null;
  attentionTitleEn: string | null;
  attentionContentEn: string | null;
} | null;

interface Props {
  guest: Guest | null;
  client: {
    id: string;
    name: string;
    slug: string;
    clientType: string;
    weddingProfile: Profile;
    events: {
      id: string;
      type: string;
      label: string;
      labelEn: string | null;
      date: Date | null;
      timeStart: string;
      timeEnd: string;
      venueName: string;
      venueNameEn: string | null;
      venueAddress: string;
      mapsUrl: string;
      isAyce: boolean;
      menuItems: { id: string; name: string }[];
    }[];
    musics: { url: string; title: string }[];
    sections: { sectionKey: string; sortOrder: number }[];
    galleries: { id: string; url: string; type: string; sortOrder: number }[];
    gifts: {
      id: string;
      bankName: string | null;
      accountNumber: string | null;
      accountName: string | null;
      ewalletType: string | null;
      ewalletNumber: string | null;
      qrisImage: string | null;
      isActive: boolean;
    }[];
    wishes: {
      id: string;
      name: string;
      message: string;
      reply: string | null;
      createdAt: Date;
    }[];
    theme: {
      primaryColor: string;
      secondaryColor: string;
      bgColor: string;
      textColor: string;
      fontHeading: string;
      fontBody: string;
      showCountdown?: boolean | null;
      showMap?: boolean | null;
      barcodeVisibility?: string | null;
    } | null;
  };
  token: string | null;
}

// ─── Translations ─────────────────────────────────────────────────────────────

const TR = {
  id: {
    kepada: "Dear.",
    scroll: "scroll",
    eyebrow_couple: "Mempelai", title_couple: "Dua Hati, Satu Tujuan",
    ourStory: "Kisah Kami",
    countdownLabel: "Menuju Hari Bahagia",
    days: "Hari", hours: "Jam", minutes: "Menit", seconds: "Detik",
    eyebrow_event: "Jadwal", title_event: "Detail Acara",
    viewLocation: "Lihat Lokasi",
    eyebrow_gallery: "Momen", title_gallery: "Galeri Kenangan",
    eyebrow_rsvp: "Konfirmasi", title_rsvp: "RSVP",
    attending: "Hadir", notAttending: "Tidak Hadir",
    guestCount: "Jumlah Tamu", max: "maks.",
    menuTitle: "Pilihan Menu", menuGuestLabel: "Tamu ke-", menuPlaceholder: "Pilih menu",
    messagePlaceholder: "Pesan atau doa (opsional)",
    confirmBtn: "Konfirmasi Kehadiran", sending: "Mengirim...",
    thankYou: "Terima kasih!", confirmed: "Konfirmasi kehadiran telah diterima",
    rsvpLocked: "RSVP tersedia melalui link undangan personal.",
    eyebrow_wishes: "Pesan", title_wishes: "Ucapan & Doa",
    yourName: "Nama Anda", wishPlaceholder: "Tulis doa dan ucapan terbaik...",
    sendWish: "Kirim Ucapan", sent: "Terkirim ✓",
    beFirst: "Jadilah yang pertama memberikan ucapan...", reply: "Balasan",
    eyebrow_gift: "Hadiah", title_gift: "Amplop Digital",
    giftNote: "Doa restu Anda adalah hadiah terbaik yang kami harapkan.",
    transferLabel: "Transfer", accountName: "Atas Nama",
    copy: "Salin", copied: "Tersalin",
    eWallet: "E-Wallet", qris: "QRIS",
    viewQr: "Lihat QR", closeQr: "Tutup", scanToTransfer: "Scan untuk transfer",
    giftThanks: "Terima kasih atas perhatian dan kasih sayang Anda",
    withLove: "With Love", forever: "Forever & Always",
    madeWith: "Made with love",
    footerThanks: "Dibuat dengan ❤️",
  },
  en: {
    kepada: "Dear",
    scroll: "scroll",
    eyebrow_couple: "The Couple", title_couple: "Two Hearts, One Journey",
    ourStory: "Our Story",
    countdownLabel: "Counting Down to Our Day",
    days: "Days", hours: "Hours", minutes: "Mins", seconds: "Secs",
    eyebrow_event: "Schedule", title_event: "Event Details",
    viewLocation: "View Location",
    eyebrow_gallery: "Moments", title_gallery: "Gallery",
    eyebrow_rsvp: "Confirmation", title_rsvp: "RSVP",
    attending: "Attending", notAttending: "Not Attending",
    guestCount: "Number of Guests", max: "max.",
    menuTitle: "Menu Choice", menuGuestLabel: "Guest ", menuPlaceholder: "Choose menu",
    messagePlaceholder: "Message or prayer (optional)",
    confirmBtn: "Confirm Attendance", sending: "Sending...",
    thankYou: "Thank you!", confirmed: "Your attendance has been confirmed",
    rsvpLocked: "RSVP is available via your personal invitation link.",
    eyebrow_wishes: "Messages", title_wishes: "Wishes & Prayers",
    yourName: "Your Name", wishPlaceholder: "Write your wishes and prayers...",
    sendWish: "Send Wishes", sent: "Sent ✓",
    beFirst: "Be the first to leave a wish...", reply: "Reply",
    eyebrow_gift: "Gift", title_gift: "Digital Gift",
    giftNote: "Your blessings are the greatest gift we could ask for.",
    transferLabel: "Transfer", accountName: "Account Name",
    copy: "Copy", copied: "Copied",
    eWallet: "E-Wallet", qris: "QRIS",
    viewQr: "View QR", closeQr: "Close", scanToTransfer: "Scan to transfer",
    giftThanks: "Thank you for your love and generosity",
    withLove: "With Love", forever: "Forever & Always",
    madeWith: "Made with love",
    footerThanks: "Made with ❤️",
  },
} as const;

type Lang = keyof typeof TR;
type Translations = (typeof TR)[Lang];

// ─── Constants ────────────────────────────────────────────────────────────────

const EVENT_LABEL: Record<string, string> = {
  AKAD: "Akad",
  PEMBERKATAN: "Church Ceremony",
  RESEPSI: "Reception",
  AFTER_PARTY: "After Party",
  SANGJIT: "Sangjit",
  LAMARAN: "Engagement Ceremony",
};

/** Prefers the client's custom event label over the generic event-type name. */
function getEventDisplayLabel(ev: { type: string; label?: string | null; labelEn?: string | null } | undefined, lang: Lang): string {
  if (!ev) return "Acara";
  return (lang === "en" && ev.labelEn) || ev.label || EVENT_LABEL[ev.type] || ev.type;
}

/**
 * Only show events (and their maps) the guest is actually invited to — e.g. a
 * guest invited to "PEMBERKATAN" only must not see the Resepsi/After Party maps.
 * No category (anonymous/preview link) falls back to showing every event.
 */
function getEventsForGuestCategory(
  events: Props["client"]["events"],
  invitationCategory: string | undefined
): Props["client"]["events"] {
  // If guest has no explicit category, do not show any events (and therefore no maps).
  if (!invitationCategory) return [];

  const includesReception = invitationCategory.includes("RESEPSI");
  const ceremonyType = invitationCategory.startsWith("AKAD")
    ? "AKAD"
    : invitationCategory.startsWith("PEMBERKATAN")
    ? "PEMBERKATAN"
    : invitationCategory === "SANGJIT"
    ? "SANGJIT"
    : invitationCategory === "LAMARAN"
    ? "LAMARAN"
    : null;

  return events.filter((ev) => {
    if (ev.type === "RESEPSI" || ev.type === "AFTER_PARTY") return includesReception;
    if (ceremonyType) return ev.type === ceremonyType;
    return true;
  });
}

const INVITATION_LABEL: Record<string, string> = {
  WEDDING: "The Wedding Of",
  SANGJIT: "Sangjit Ceremony Of",
  LAMARAN: "Lamaran",
};

const BANK_GRADIENTS: Record<string, [string, string]> = {
  BCA: ["#005bac", "#1a8fe0"],
  BNI: ["#e65c00", "#f9a825"],
  MANDIRI: ["#003087", "#0057e0"],
  BRI: ["#003087", "#1a5276"],
  CIMB: ["#b71c1c", "#e53935"],
};

// ─── Default palette ──────────────────────────────────────────────────────────

const DEF = {
  gold: "#c4954a",
  goldLight: "#ddb96e",
  ivory: "#faf8f4",
  champagne: "#f4ece0",
  blush: "#f5ebe4",
  text: "#332820",
  muted: "#7a6355",
};

// ─── Global CSS ───────────────────────────────────────────────────────────────

const GLOBAL_CSS = `
  html { scroll-behavior: smooth; }

  .lenv-root, .lenv-root *, .lenv-root *::before, .lenv-root *::after {
    box-sizing: border-box;
  }

  .lenv-root {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  @keyframes lenv-particle-float {
    0%   { transform: translateY(0) translateX(0); opacity: 0; }
    8%   { opacity: 1; }
    92%  { opacity: 0.5; }
    100% { transform: translateY(-130px) translateX(var(--pdx, 0px)); opacity: 0; }
  }

  @keyframes lenv-shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }

  .lenv-gold-shimmer {
    background: linear-gradient(90deg, #a87830 0%, #ddb96e 40%, #c4954a 50%, #ddb96e 60%, #a87830 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: lenv-shimmer 5s linear infinite;
  }

  .lenv-divider {
    height: 1px;
    background: linear-gradient(to right, transparent, var(--lenv-gold, #c4954a), transparent);
    margin: 0 auto;
  }

  .lenv-story-html ul { list-style: disc; padding-left: 1.4em; margin: 0.4em 0; }
  .lenv-story-html li { margin: 0.15em 0; }
  .lenv-story-html strong, .lenv-story-html b { font-weight: 600; }
  .lenv-story-html em, .lenv-story-html i { font-style: italic; }
  .lenv-story-html p { margin: 0.4em 0; }
  .lenv-story-html p:first-child { margin-top: 0; }
  .lenv-story-html p:last-child { margin-bottom: 0; }
`;

// ─── Animation variants ───────────────────────────────────────────────────────

type VariantName = "fadeUp" | "fadeIn" | "scaleIn" | "slideLeft" | "slideRight";

const EASE = [0.22, 1, 0.36, 1] as const;
const EXIT: Variants[string] = { transition: { duration: 0 } };

const VARIANTS: Record<VariantName, Variants> = {
  fadeUp: {
    hidden: { opacity: 0, y: 24, ...EXIT },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
  },
  fadeIn: {
    hidden: { opacity: 0, ...EXIT },
    visible: { opacity: 1, transition: { duration: 0.75, ease: "easeOut" } },
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.95, ...EXIT },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.65, ease: EASE } },
  },
  slideLeft: {
    hidden: { opacity: 0, x: -22, ...EXIT },
    visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: EASE } },
  },
  slideRight: {
    hidden: { opacity: 0, x: 22, ...EXIT },
    visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: EASE } },
  },
};

function AnimInView({
  children,
  variant = "fadeUp",
  delay = 0,
  className,
  style,
  amount = 0.12,
}: {
  children: React.ReactNode;
  variant?: VariantName;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
  amount?: number;
}) {
  const v = VARIANTS[variant];
  const patchedV = delay
    ? {
        ...v,
        visible: {
          ...(v.visible as object),
          transition: { ...((v.visible as { transition?: Record<string, unknown> }).transition ?? {}), delay },
        },
      }
    : v;

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: false, amount, margin: "0px 0px -40px 0px" }}
      variants={patchedV}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

// ─── Ambient particles ────────────────────────────────────────────────────────

function Particles() {
  const items = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        left: `${6 + ((i * 41 + 7) % 88)}%`,
        size: 2 + (i % 3),
        delay: (i * 0.43) % 7,
        dur: 4.5 + (i * 0.57) % 4,
        dx: `${-18 + ((i * 19) % 36)}px`,
        opacity: 0.18 + (i % 5) * 0.05,
        bottom: `${10 + (i * 11) % 35}%`,
      })),
    []
  );

  return (
    <div aria-hidden style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 2 }}>
      {items.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            bottom: p.bottom,
            left: p.left,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: DEF.gold,
            opacity: p.opacity,
            animation: `lenv-particle-float ${p.dur}s ${p.delay}s ease-in-out infinite`,
            "--pdx": p.dx,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

// ─── Section title ─────────────────────────────────────────────────────────────

function SectionTitle({
  eyebrow,
  title,
  gold,
  text,
  fontH,
  center = true,
}: {
  eyebrow: string;
  title: string;
  gold: string;
  text: string;
  fontH: string;
  center?: boolean;
}) {
  return (
    <div style={{ textAlign: center ? "center" : "left", marginBottom: "2.5rem" }}>
      <AnimInView variant="fadeIn">
        <p style={{ fontSize: "0.62rem", letterSpacing: "0.32em", textTransform: "uppercase", color: gold, fontFamily: "'Cinzel', serif", marginBottom: "0.6rem" }}>
          {eyebrow}
        </p>
      </AnimInView>
      <AnimInView variant="fadeUp" delay={0.08}>
        <div style={{ overflow: "hidden", display: "inline-block" }}>
          <p style={{ fontFamily: `'${fontH}', 'Cormorant Garamond', Georgia, serif`, fontSize: "clamp(1.8rem, 5vw, 2.4rem)", fontWeight: 300, color: text, lineHeight: 1.15 }}>
            {title}
          </p>
        </div>
      </AnimInView>
      <AnimInView variant="fadeIn" delay={0.2}>
        <div
          className="lenv-divider"
          style={{ width: "52px", margin: center ? "1rem auto 0" : "1rem 0 0", "--lenv-gold": gold } as React.CSSProperties}
        />
      </AnimInView>
    </div>
  );
}

// ─── Hero Section ──────────────────────────────────────────────────────────────

function HeroSection({
  heroUrl, gold, ivory, text, fontH, coupleLabel, invLabel, t,
}: {
  heroUrl?: string; gold: string; ivory: string; text: string; fontH: string;
  coupleLabel: string; invLabel: string; t: Translations;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 100]);

  return (
    <section ref={ref} style={{ position: "relative", height: "100dvh", overflow: "hidden" }}>
      <motion.div style={{ y, position: "absolute", inset: "-12%" }}>
        {heroUrl ? (
          <>
            <Image src={heroUrl} alt="" fill priority sizes="100vw" style={{ objectFit: "cover", objectPosition: "center 10%", opacity: 0.65 }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(250,248,244,0.12) 0%, rgba(51,40,32,0.5) 60%, rgba(51,40,32,0.82) 100%)" }} />
          </>
        ) : (
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(145deg, ${ivory} 0%, #e9ddd0 100%)` }} />
        )}
      </motion.div>

      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(90deg, transparent, ${gold}, transparent)`, zIndex: 10 }} />

      <div style={{ position: "relative", zIndex: 10, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 2rem" }}>
        <AnimInView variant="fadeIn">
          <div className="lenv-divider" style={{ width: "72px", marginBottom: "1.8rem", "--lenv-gold": gold } as React.CSSProperties} />
        </AnimInView>
        <AnimInView variant="fadeUp" delay={0.1}>
          <p style={{ fontFamily: "'Cinzel', serif", fontSize: "0.62rem", letterSpacing: "0.32em", textTransform: "uppercase", color: heroUrl ? "rgba(255,255,255,0.72)" : gold, marginBottom: "1rem" }}>
            {invLabel}
          </p>
        </AnimInView>
        <AnimInView variant="fadeUp" delay={0.18}>
          <h1 style={{ fontFamily: `'${fontH}', 'Cormorant Garamond', Georgia, serif`, fontSize: "clamp(3.4rem, 13vw, 6.5rem)", fontWeight: 300, lineHeight: 1.08, color: heroUrl ? "#fff" : text, marginBottom: "0.4rem", letterSpacing: "-0.01em" }}>
            {coupleLabel}
          </h1>
        </AnimInView>
        <AnimInView variant="fadeIn" delay={0.3}>
          <div className="lenv-divider" style={{ width: "56px", margin: "1.6rem auto", "--lenv-gold": gold } as React.CSSProperties} />
        </AnimInView>
      </div>

      <div style={{ position: "absolute", bottom: "2.5rem", left: 0, right: 0, textAlign: "center", zIndex: 10 }}>
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}>
          <p style={{ fontFamily: "'Cinzel', serif", fontSize: "0.55rem", letterSpacing: "0.35em", textTransform: "uppercase", color: heroUrl ? "rgba(255,255,255,0.35)" : DEF.muted }}>
            {t.scroll}
          </p>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Couple Section ────────────────────────────────────────────────────────────

function CoupleSection({
  profile, gold, ivory, champagne, text, fontH, fontB, t, lang,
}: {
  profile: NonNullable<Profile>; gold: string; ivory: string; champagne: string;
  text: string; fontH: string; fontB: string; t: Translations; lang: Lang;
}) {
  const isEn = lang === "en";
  const groomParents = (isEn && profile.groomParentsEn) || profile.groomParents;
  const brideParents = (isEn && profile.brideParentsEn) || profile.brideParents;
  const openingQuote = (isEn && profile.openingQuoteEn) || profile.openingQuote;
  const openingQuoteBy = (isEn && profile.openingQuoteByEn) || profile.openingQuoteBy;
  const story = (isEn && profile.storyEn) || profile.story;
  const storyTitle = (isEn && profile.storyTitleEn) || profile.storyTitle;

  return (
    <section style={{ padding: "4rem 1.5rem", background: `linear-gradient(180deg, ${ivory} 0%, ${champagne} 100%)` }}>
      <div style={{ maxWidth: "480px", margin: "0 auto", textAlign: "center" }}>
        <SectionTitle eyebrow={t.eyebrow_couple} title={t.title_couple} gold={gold} text={text} fontH={fontH} />

        {/* Groom */}
        <AnimInView variant="fadeUp" delay={0.05}>
          <div style={{ marginBottom: "2.5rem" }}>
            {profile.showGroomPhoto && (
              <motion.div whileHover={{ scale: 1.04 }} transition={{ duration: 0.4, ease: "easeOut" }} style={{ display: "inline-block", marginBottom: "1.4rem" }}>
                {profile.groomPhoto ? (
                  <div style={{ width: 154, height: 154, borderRadius: "50%", overflow: "hidden", border: `3px solid ${gold}55`, boxShadow: `0 0 0 7px ${champagne}, 0 8px 36px ${gold}30`, margin: "0 auto", position: "relative" }}>
                    <Image src={profile.groomPhoto} alt={profile.groomName} fill sizes="154px" style={{ objectFit: "cover" }} />
                  </div>
                ) : (
                  <div style={{ width: 154, height: 154, borderRadius: "50%", background: champagne, border: `3px solid ${gold}44`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
                    <span style={{ fontSize: "3rem" }}>👤</span>
                  </div>
                )}
              </motion.div>
            )}
            <p style={{ fontFamily: `'${fontH}', 'Cormorant Garamond', Georgia, serif`, fontSize: "1.85rem", fontWeight: 400, color: text, marginBottom: "0.25rem" }}>
              {profile.groomName}
            </p>
            {groomParents && (
              <p style={{ fontSize: "0.82rem", color: text, opacity: 0.45, lineHeight: 1.6, fontFamily: `'${fontB}', 'Jost', sans-serif` }}>
                {groomParents}
              </p>
            )}
          </div>
        </AnimInView>

        {/* Ampersand */}
        <AnimInView variant="scaleIn" delay={0.1}>
          <div style={{ margin: "0.2rem 0 1.8rem" }}>
            <p style={{ fontFamily: `'${fontH}', 'Cormorant Garamond', Georgia, serif`, fontSize: "3.2rem", fontWeight: 300, lineHeight: 1 }} className="lenv-gold-shimmer">
              &amp;
            </p>
          </div>
        </AnimInView>

        {/* Bride */}
        <AnimInView variant="fadeUp" delay={0.15}>
          <div style={{ marginBottom: "2.5rem" }}>
            {profile.showBridePhoto && (
              <motion.div whileHover={{ scale: 1.04 }} transition={{ duration: 0.4, ease: "easeOut" }} style={{ display: "inline-block", marginBottom: "1.4rem" }}>
                {profile.bridePhoto ? (
                  <div style={{ width: 154, height: 154, borderRadius: "50%", overflow: "hidden", border: `3px solid ${gold}55`, boxShadow: `0 0 0 7px ${champagne}, 0 8px 36px ${gold}30`, margin: "0 auto", position: "relative" }}>
                    <Image src={profile.bridePhoto} alt={profile.brideName} fill sizes="154px" style={{ objectFit: "cover" }} />
                  </div>
                ) : (
                  <div style={{ width: 154, height: 154, borderRadius: "50%", background: champagne, border: `3px solid ${gold}44`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
                    <span style={{ fontSize: "3rem" }}>👤</span>
                  </div>
                )}
              </motion.div>
            )}
            <p style={{ fontFamily: `'${fontH}', 'Cormorant Garamond', Georgia, serif`, fontSize: "1.85rem", fontWeight: 400, color: text, marginBottom: "0.25rem" }}>
              {profile.brideName}
            </p>
            {brideParents && (
              <p style={{ fontSize: "0.82rem", color: text, opacity: 0.45, lineHeight: 1.6, fontFamily: `'${fontB}', 'Jost', sans-serif` }}>
                {brideParents}
              </p>
            )}
          </div>
        </AnimInView>

        {/* Opening quote */}
        {openingQuote && (
          <AnimInView variant="fadeUp" delay={0.2}>
            <div style={{ borderTop: `1px solid ${gold}28`, paddingTop: "2rem", marginTop: "0.5rem" }}>
              <p style={{ fontFamily: `'${fontH}', 'Cormorant Garamond', Georgia, serif`, fontSize: "1.15rem", fontStyle: "italic", fontWeight: 300, lineHeight: 1.75, color: text, opacity: 0.68 }}>
                &ldquo;{openingQuote}&rdquo;
              </p>
              {openingQuoteBy && (
                <p style={{ fontFamily: "'Cinzel', serif", fontSize: "0.6rem", letterSpacing: "0.22em", color: gold, marginTop: "0.85rem", textTransform: "uppercase" }}>
                  — {openingQuoteBy}
                </p>
              )}
            </div>
          </AnimInView>
        )}

        {/* Story */}
        {story && (
          <AnimInView variant="fadeUp" delay={0.25}>
            <div style={{ borderTop: `1px solid ${gold}22`, paddingTop: "2rem", marginTop: "1.5rem" }}>
              {profile.showStoryTitle && (
                <p style={{ fontFamily: "'Cinzel', serif", fontSize: "0.6rem", letterSpacing: "0.28em", textTransform: "uppercase", color: gold, marginBottom: "1.2rem" }}>
                  {storyTitle?.trim() || t.ourStory}
                </p>
              )}
              <div
                className="lenv-story-html"
                style={{ fontSize: "0.9rem", lineHeight: 1.9, color: text, opacity: 0.6, fontFamily: `'${fontB}', 'Jost', sans-serif`, textAlign: "left" }}
                dangerouslySetInnerHTML={{ __html: storyToHtml(story) }}
              />
            </div>
          </AnimInView>
        )}
      </div>
    </section>
  );
}

// ─── Events Section ────────────────────────────────────────────────────────────

function getMapEmbedUrl(mapsUrl: string, venueName: string, venueAddress: string): string {
  const coordMatch = mapsUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (coordMatch) return `https://maps.google.com/maps?q=${coordMatch[1]},${coordMatch[2]}&output=embed&z=17`;
  const qMatch = mapsUrl.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qMatch) return `https://maps.google.com/maps?q=${qMatch[1]},${qMatch[2]}&output=embed&z=17`;
  return `https://maps.google.com/maps?q=${encodeURIComponent(`${venueName} ${venueAddress}`.trim())}&output=embed&z=17`;
}

function EventsSection({
  events, gold, ivory, champagne, text, fontH, fontB, t, showMap, lang,
}: {
  events: Props["client"]["events"]; gold: string; ivory: string; champagne: string;
  text: string; fontH: string; fontB: string; t: Translations; showMap: boolean; lang: Lang;
}) {
  if (!events.length) return null;
  const isEn = lang === "en";

  return (
    <section style={{ padding: "4rem 1.5rem", background: `linear-gradient(180deg, ${champagne} 0%, ${ivory} 100%)` }}>
      <div style={{ maxWidth: "480px", margin: "0 auto" }}>
        <SectionTitle eyebrow={t.eyebrow_event} title={t.title_event} gold={gold} text={text} fontH={fontH} />
        <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
          {events.map((ev, i) => (
            <AnimInView key={ev.id} variant="fadeUp" delay={i * 0.08}>
              <motion.div
                whileHover={{ y: -4, boxShadow: `0 18px 48px ${gold}18`, transition: { duration: 0.3 } }}
                style={{ background: "#fff", borderRadius: "20px", padding: "1.8rem", border: `1px solid ${gold}22`, boxShadow: `0 4px 24px rgba(51,40,32,0.07)` }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.9rem", marginBottom: "1.4rem" }}>
                  <div style={{ width: "4px", height: "30px", borderRadius: "99px", background: `linear-gradient(to bottom, ${gold}, ${gold}44)`, flexShrink: 0 }} />
                  <h3 style={{ fontFamily: `'${fontH}', 'Cormorant Garamond', Georgia, serif`, fontSize: "1.45rem", fontWeight: 400, color: text, lineHeight: 1.2 }}>
                    {(isEn && ev.labelEn) || ev.label || EVENT_LABEL[ev.type] || ev.type}
                  </h3>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                  {ev.date && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                      <Calendar size={13} color={gold} style={{ flexShrink: 0 }} />
                      <p style={{ fontSize: "0.84rem", color: text, opacity: 0.68, fontFamily: `'${fontB}', 'Jost', sans-serif` }}>{formatDate(ev.date, isEn ? "EN" : "ID")}</p>
                    </div>
                  )}
                  {(ev.timeStart || ev.timeEnd) && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                      <Clock size={13} color={gold} style={{ flexShrink: 0 }} />
                      <p style={{ fontSize: "0.84rem", color: text, opacity: 0.68, fontFamily: `'${fontB}', 'Jost', sans-serif` }}>
                        {ev.timeStart}{ev.timeEnd && ` – ${ev.timeEnd}`} WIB
                      </p>
                    </div>
                  )}
                  {ev.venueName && (
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.65rem" }}>
                      <MapPin size={13} color={gold} style={{ marginTop: "2px", flexShrink: 0 }} />
                      <div>
                        <p style={{ fontSize: "0.84rem", fontWeight: 500, color: text, opacity: 0.85, fontFamily: `'${fontB}', 'Jost', sans-serif` }}>{(isEn && ev.venueNameEn) || ev.venueName}</p>
                        {ev.venueAddress && (
                          <p style={{ fontSize: "0.75rem", color: text, opacity: 0.42, marginTop: "0.2rem", lineHeight: 1.55, fontFamily: `'${fontB}', 'Jost', sans-serif` }}>{ev.venueAddress}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {showMap && ev.mapsUrl && ev.venueName && (
                  <div style={{ marginTop: "1rem", borderRadius: "12px", overflow: "hidden", border: `1px solid ${gold}22` }}>
                    <iframe src={getMapEmbedUrl(ev.mapsUrl, (isEn && ev.venueNameEn) || ev.venueName, ev.venueAddress)} width="100%" height="200" style={{ display: "block", border: "none", pointerEvents: "none" }} loading="lazy" referrerPolicy="no-referrer-when-downgrade" title={(isEn && ev.venueNameEn) || ev.venueName} />
                  </div>
                )}
                {ev.mapsUrl && (
                  <a
                    href={ev.mapsUrl} target="_blank" rel="noopener noreferrer"
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", marginTop: "1.4rem", padding: "0.65rem", border: `1px solid ${gold}55`, borderRadius: "9999px", fontSize: "0.65rem", letterSpacing: "0.18em", textTransform: "uppercase", color: gold, textDecoration: "none", fontFamily: "'Cinzel', serif", transition: "all 0.3s ease" }}
                    onMouseEnter={(e) => { const el = e.currentTarget; el.style.background = gold; el.style.color = "#fff"; }}
                    onMouseLeave={(e) => { const el = e.currentTarget; el.style.background = "transparent"; el.style.color = gold; }}
                  >
                    <MapPin size={11} />
                    {t.viewLocation}
                  </a>
                )}
              </motion.div>
            </AnimInView>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Gallery (carousel swipe) ─────────────────────────────────────────────────

const CARD_W = 260;
const CARD_GAP = 14;
const CAROUSEL_STEP = CARD_W + CARD_GAP;

function GallerySection({
  galleries, gold, champagne, text, fontH, t,
}: {
  galleries: Props["client"]["galleries"]; gold: string; champagne: string;
  text: string; fontH: string; t: Translations;
}) {
  const photos = galleries.filter((g) => g.type === "GALLERY" || g.type === "PREWEDDING");

  const count = photos.length;
  const extended = count > 1 ? [photos[count - 1], ...photos, photos[0]] : photos;

  const [idx, setIdx] = useState(count > 1 ? 1 : 0);
  const [animated, setAnimated] = useState(true);
  const pointerStartX = useRef<number | null>(null);
  const dragging = useRef(false);

  useEffect(() => {
    if (!animated) {
      const raf = requestAnimationFrame(() => setAnimated(true));
      return () => cancelAnimationFrame(raf);
    }
  }, [animated]);

  if (!photos.length) return null;

  function onTransitionEnd(e: React.TransitionEvent) {
    if (e.propertyName !== "transform" || e.target !== e.currentTarget) return;
    if (count <= 1) return;
    if (idx === 0) { setAnimated(false); setIdx(count); }
    else if (idx === extended.length - 1) { setAnimated(false); setIdx(1); }
  }

  function goNext() { setIdx((i) => i + 1); }
  function goPrev() { setIdx((i) => i - 1); }

  function onPointerDown(e: React.PointerEvent) {
    pointerStartX.current = e.clientX;
    dragging.current = false;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (pointerStartX.current !== null && Math.abs(e.clientX - pointerStartX.current) > 5)
      dragging.current = true;
  }
  function onPointerUp(e: React.PointerEvent) {
    if (pointerStartX.current === null) return;
    const dx = e.clientX - pointerStartX.current;
    pointerStartX.current = null;
    if (!dragging.current || Math.abs(dx) < 30) return;
    dx < 0 ? goNext() : goPrev();
  }

  return (
    <section style={{ padding: "4rem 0", background: `linear-gradient(160deg, #f9f4ed 0%, ${champagne} 100%)`, overflow: "hidden" }}>
      <div style={{ padding: "0 1.5rem", maxWidth: "480px", margin: "0 auto" }}>
        <SectionTitle eyebrow={t.eyebrow_gallery} title={t.title_gallery} gold={gold} text={text} fontH={fontH} />
      </div>

      <div
        style={{ overflow: "hidden", cursor: "grab", touchAction: "pan-y", userSelect: "none" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <div
          style={{
            display: "flex",
            gap: `${CARD_GAP}px`,
            paddingLeft: `calc(50vw - ${CARD_W / 2}px)`,
            paddingRight: `calc(50vw - ${CARD_W / 2}px)`,
            transform: `translateX(-${idx * CAROUSEL_STEP}px)`,
            transition: animated ? "transform 480ms cubic-bezier(0.22, 1, 0.36, 1)" : "none",
            willChange: "transform",
          }}
          onTransitionEnd={onTransitionEnd}
        >
          {extended.map((photo, i) => {
            const isCurrent = i === idx;
            return (
              <div
                key={`${photo.id}-${i}`}
                style={{
                  flexShrink: 0,
                  width: `${CARD_W}px`,
                  borderRadius: "16px",
                  overflow: "hidden",
                  pointerEvents: "none",
                  opacity: isCurrent ? 1 : 0.38,
                  transform: isCurrent ? "scale(1)" : "scale(0.85)",
                  boxShadow: isCurrent ? `0 24px 48px ${gold}28` : "0 4px 12px rgba(51,40,32,0.05)",
                  transition: animated ? "opacity 400ms ease, transform 400ms ease, box-shadow 400ms ease" : "none",
                }}
              >
                <div style={{ aspectRatio: "3/4", overflow: "hidden", position: "relative" }}>
                  <Image
                    src={photo.url} alt="" draggable={false} fill sizes="(max-width: 480px) 70vw, 320px"
                    style={{ objectFit: "cover" }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── RSVP Section ──────────────────────────────────────────────────────────────

function RSVPSection({
  clientId, guest, token, gold, ivory, champagne, text, fontH, fontB, t, menuItems, onConfirmed,
}: {
  clientId: string; guest: Guest; token: string; gold: string; ivory: string;
  champagne: string; text: string; fontH: string; fontB: string; t: Translations;
  menuItems: { id: string; name: string }[];
  onConfirmed?: (status: "HADIR" | "TIDAK_HADIR") => void;
}) {
  const respondedRsvp = guest.rsvp && guest.rsvp.status !== "PENDING" ? guest.rsvp : undefined;
  const [status, setStatus] = useState<"HADIR" | "TIDAK_HADIR">((respondedRsvp?.status as "HADIR" | "TIDAK_HADIR") || "HADIR");
  const [pax, setPax] = useState(respondedRsvp?.paxCount ?? guest.maxPax);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(!!respondedRsvp);
  const needsMenu = status === "HADIR" && menuItems.length > 0;
  const [menuSelections, setMenuSelections] = useState<Record<number, string>>(() => {
    const existing = (respondedRsvp?.menuChoices as string[] | undefined) ?? [];
    return Object.fromEntries(existing.map((c, i) => [i, c]));
  });
  const menuChoices = Array.from({ length: pax }, (_, i) => menuSelections[i] ?? "");
  const menuIncomplete = needsMenu && menuChoices.some((s) => !s);

  async function submit() {
    setSaving(true);
    const res = await fetch("/api/rsvp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clientId, guestId: guest.id, token, name: guest.name, paxCount: pax, status, menuChoices: needsMenu ? menuChoices : undefined }) });
    if (res.ok) { setDone(true); onConfirmed?.(status); }
    setSaving(false);
  }

  return (
    <section style={{ padding: "4rem 1.5rem", background: `linear-gradient(180deg, ${ivory} 0%, ${champagne} 100%)` }}>
      <div style={{ maxWidth: "480px", margin: "0 auto" }}>
        <SectionTitle eyebrow={t.eyebrow_rsvp} title={t.title_rsvp} gold={gold} text={text} fontH={fontH} />
        <AnimInView variant="fadeUp" delay={0.1}>
          {done ? (
            <div style={{ textAlign: "center", padding: "3.5rem 1.5rem", background: "#fff", borderRadius: "24px", border: `1px solid ${gold}22`, boxShadow: `0 8px 40px ${gold}0f` }}>
              <motion.div animate={{ scale: [0.8, 1.1, 1] }} transition={{ duration: 0.6, delay: 0.1 }} style={{ width: 56, height: 56, borderRadius: "50%", background: `${gold}15`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.2rem" }}>
                <Heart size={24} color={gold} />
              </motion.div>
              <p style={{ fontFamily: `'${fontH}', 'Cormorant Garamond', Georgia, serif`, fontSize: "1.4rem", fontWeight: 400, color: text, marginBottom: "0.4rem" }}>{t.thankYou}</p>
              <p style={{ fontSize: "0.84rem", color: text, opacity: 0.45, fontFamily: `'${fontB}', 'Jost', sans-serif` }}>{t.confirmed}</p>
            </div>
          ) : (
            <div style={{ background: "#fff", borderRadius: "24px", padding: "1.85rem", border: `1px solid ${gold}22`, boxShadow: `0 6px 32px ${gold}0c` }}>
              <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.4rem" }}>
                {(["HADIR", "TIDAK_HADIR"] as const).map((s) => (
                  <motion.button key={s} onClick={() => setStatus(s)} whileTap={{ scale: 0.96 }}
                    style={{ flex: 1, padding: "0.75rem", borderRadius: "9999px", border: `1px solid ${status === s ? gold : gold + "28"}`, background: status === s ? `linear-gradient(135deg, ${gold}24, ${gold}0f)` : "transparent", color: status === s ? gold : `${text}55`, fontSize: "0.65rem", fontWeight: 500, letterSpacing: "0.16em", textTransform: "uppercase", cursor: "pointer", fontFamily: "'Cinzel', serif", transition: "all 0.3s ease" }}>
                    {s === "HADIR" ? t.attending : t.notAttending}
                  </motion.button>
                ))}
              </div>
              <AnimatePresence>
                {status === "HADIR" && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden", marginBottom: "1.2rem" }}>
                    <p style={{ fontFamily: "'Cinzel', serif", fontSize: "0.6rem", letterSpacing: "0.24em", textTransform: "uppercase", color: gold, marginBottom: "0.75rem" }}>{t.guestCount}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: "1.1rem" }}>
                      <motion.button whileTap={{ scale: 0.88 }} onClick={() => setPax((p) => Math.max(1, p - 1))} style={{ width: 36, height: 36, borderRadius: "50%", border: `1px solid ${gold}44`, background: "transparent", color: text, fontSize: "1.2rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>−</motion.button>
                      <span style={{ fontFamily: `'${fontH}', 'Cormorant Garamond', Georgia, serif`, fontSize: "1.6rem", fontWeight: 300, color: text, minWidth: "1.8rem", textAlign: "center" }}>{pax}</span>
                      <motion.button whileTap={{ scale: 0.88 }} onClick={() => setPax((p) => Math.min(guest.maxPax, p + 1))} style={{ width: 36, height: 36, borderRadius: "50%", border: `1px solid ${gold}44`, background: "transparent", color: text, fontSize: "1.2rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</motion.button>
                      <span style={{ fontSize: "0.75rem", color: text, opacity: 0.38, fontFamily: `'${fontB}', 'Jost', sans-serif` }}>{t.max} {guest.maxPax}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {needsMenu && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden", marginBottom: "1.2rem" }}>
                    <p style={{ fontFamily: "'Cinzel', serif", fontSize: "0.6rem", letterSpacing: "0.24em", textTransform: "uppercase", color: gold, marginBottom: "0.75rem" }}>{t.menuTitle}</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                      {menuChoices.map((choice, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                          <span style={{ fontSize: "0.75rem", color: text, opacity: 0.5, fontFamily: `'${fontB}', 'Jost', sans-serif`, minWidth: "3.2rem" }}>{t.menuGuestLabel}{i + 1}</span>
                          <select
                            value={choice}
                            onChange={(e) => setMenuSelections((prev) => ({ ...prev, [i]: e.target.value }))}
                            style={{ flex: 1, padding: "0.6rem 0.75rem", borderRadius: "10px", border: `1px solid ${gold}44`, background: "#fff", color: text, fontSize: "0.8rem", fontFamily: `'${fontB}', 'Jost', sans-serif`, outline: "none" }}
                          >
                            <option value="">{t.menuPlaceholder}</option>
                            {menuItems.map((item) => (
                              <option key={item.id} value={item.name}>{item.name}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <motion.button whileHover={{ scale: 1.02, boxShadow: `0 10px 28px ${gold}50`, transition: { duration: 0.25 } }} whileTap={{ scale: 0.97 }} onClick={submit} disabled={saving || menuIncomplete} style={{ width: "100%", marginTop: "1rem", padding: "0.95rem", background: `linear-gradient(135deg, ${gold} 0%, #e8c98a 50%, ${gold} 100%)`, backgroundSize: "200% 100%", color: "#2a1c14", border: "none", borderRadius: "9999px", fontSize: "0.65rem", fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", cursor: saving || menuIncomplete ? "not-allowed" : "pointer", fontFamily: "'Cinzel', serif", opacity: saving || menuIncomplete ? 0.6 : 1, transition: "opacity 0.2s" }}>
                {saving ? t.sending : t.confirmBtn}
              </motion.button>
            </div>
          )}
        </AnimInView>
      </div>
    </section>
  );
}

function RSVPPlaceholder({
  gold, ivory, champagne, text, fontH, t,
}: {
  gold: string; ivory: string; champagne: string; text: string; fontH: string; t: Translations;
}) {
  return (
    <section style={{ padding: "4rem 1.5rem", background: `linear-gradient(180deg, ${ivory} 0%, ${champagne} 100%)` }}>
      <div style={{ maxWidth: "480px", margin: "0 auto" }}>
        <SectionTitle eyebrow={t.eyebrow_rsvp} title={t.title_rsvp} gold={gold} text={text} fontH={fontH} />
        <AnimInView variant="scaleIn" delay={0.1}>
          <div style={{ textAlign: "center", padding: "3.5rem 1.5rem", background: "#fff", borderRadius: "24px", border: `1px solid ${gold}22` }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: `${gold}14`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.2rem" }}>
              <LockKeyhole size={20} color={gold} />
            </div>
            <p style={{ fontFamily: `'${fontH}', 'Cormorant Garamond', Georgia, serif`, fontSize: "1.2rem", color: text, marginBottom: "0.4rem" }}>{t.confirmBtn}</p>
            <p style={{ fontSize: "0.8rem", color: text, opacity: 0.42, lineHeight: 1.65 }}>{t.rsvpLocked}</p>
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem", pointerEvents: "none" }}>
              {[t.attending, t.notAttending].map((s) => (
                <div key={s} style={{ flex: 1, padding: "0.65rem", borderRadius: "9999px", border: `1px solid ${gold}28`, fontSize: "0.6rem", letterSpacing: "0.18em", textTransform: "uppercase", color: `${gold}50`, textAlign: "center", fontFamily: "'Cinzel', serif" }}>{s}</div>
              ))}
            </div>
          </div>
        </AnimInView>
      </div>
    </section>
  );
}

// ─── Wishes Section ────────────────────────────────────────────────────────────

function WishesSection({
  clientId, initialWishes, guestName, guestId, gold, ivory, champagne, text, fontH, fontB, t,
}: {
  clientId: string; initialWishes: Props["client"]["wishes"]; guestName?: string; guestId?: string;
  gold: string; ivory: string; champagne: string; text: string; fontH: string; fontB: string; t: Translations;
}) {
  const [wishes, setWishes] = useState(initialWishes);
  const [name, setName] = useState(guestName || "");
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/wishes?clientId=${clientId}`);
        if (!res.ok) return;
        setWishes(await res.json());
      } catch {}
    }, 6000);
    return () => clearInterval(interval);
  }, [clientId]);

  async function send() {
    if (!msg.trim()) return;
    setSending(true);
    const res = await fetch("/api/wishes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clientId, name: name || "Tamu", message: msg, guestId }) });
    if (res.ok) {
      const data = await res.json();
      setWishes((p) => [data, ...p]);
      setMsg("");
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    }
    setSending(false);
  }

  const inputBase: React.CSSProperties = { width: "100%", background: "#fff", border: `1px solid ${gold}22`, borderRadius: "14px", padding: "0.8rem 1rem", fontSize: "0.84rem", color: text, outline: "none", boxSizing: "border-box", fontFamily: `'${fontB}', 'Jost', sans-serif` };

  return (
    <section style={{ padding: "4rem 1.5rem", background: `linear-gradient(180deg, ${champagne} 0%, ${ivory} 100%)` }}>
      <div style={{ maxWidth: "520px", margin: "0 auto" }}>
        <SectionTitle eyebrow={t.eyebrow_wishes} title={t.title_wishes} gold={gold} text={text} fontH={fontH} />
        <AnimInView variant="fadeUp" delay={0.1}>
          <div style={{ background: champagne, borderRadius: "22px", padding: "1.5rem", marginBottom: "1.5rem", border: `1px solid ${gold}1a`, boxShadow: `0 4px 20px rgba(51,40,32,0.05)` }}>
            {!guestName && (
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} readOnly={!!guestName} placeholder={t.yourName} style={{ ...inputBase, marginBottom: "0.75rem" }} />
            )}
            <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={3} placeholder={t.wishPlaceholder} style={{ ...inputBase, resize: "none", marginBottom: "0.75rem", lineHeight: 1.65 }} />
            <motion.button whileHover={{ scale: 1.02, transition: { duration: 0.25 } }} whileTap={{ scale: 0.97 }} onClick={send} disabled={sending || !msg.trim()} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", padding: "0.85rem", background: `linear-gradient(135deg, ${gold} 0%, #e8c98a 50%, ${gold} 100%)`, color: "#2a1c14", border: "none", borderRadius: "9999px", fontSize: "0.65rem", fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer", fontFamily: "'Cinzel', serif", opacity: sending || !msg.trim() ? 0.5 : 1, transition: "opacity 0.2s" }}>
              <Send size={13} />
              {sent ? t.sent : sending ? t.sending : t.sendWish}
            </motion.button>
          </div>
        </AnimInView>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", maxHeight: "400px", overflowY: "auto", paddingRight: "4px" }}>
          {wishes.length === 0 && (
            <p style={{ textAlign: "center", padding: "2.5rem 0", fontFamily: `'${fontH}', 'Cormorant Garamond', Georgia, serif`, fontSize: "1rem", fontStyle: "italic", color: text, opacity: 0.35 }}>{t.beFirst}</p>
          )}
          {wishes.map((w, i) => (
            <AnimInView key={w.id} variant="fadeUp" delay={Math.min(i * 0.04, 0.2)}>
              <motion.div whileHover={{ y: -2, transition: { duration: 0.22 } }} style={{ background: "#fff", borderRadius: "16px", padding: "1.1rem 1.3rem", border: `1px solid ${gold}18`, boxShadow: `0 2px 12px rgba(51,40,32,0.05)` }}>
                <p style={{ fontFamily: "'Cinzel', serif", fontSize: "0.62rem", letterSpacing: "0.1em", color: gold, marginBottom: "0.35rem", textTransform: "uppercase" }}>{w.name}</p>
                <p style={{ fontSize: "0.86rem", lineHeight: 1.7, color: text, opacity: 0.68, fontFamily: `'${fontB}', 'Jost', sans-serif` }}>{w.message}</p>
                {w.reply && (
                  <div style={{ marginTop: "0.85rem", paddingTop: "0.85rem", borderTop: `1px solid ${gold}1a`, paddingLeft: "0.85rem", borderLeft: `2px solid ${gold}66` }}>
                    <p style={{ fontFamily: "'Cinzel', serif", fontSize: "0.55rem", letterSpacing: "0.16em", color: gold, marginBottom: "0.25rem", textTransform: "uppercase" }}>{t.reply}</p>
                    <p style={{ fontSize: "0.82rem", lineHeight: 1.65, color: text, opacity: 0.55, fontStyle: "italic", fontFamily: `'${fontH}', 'Cormorant Garamond', Georgia, serif` }}>{w.reply}</p>
                  </div>
                )}
              </motion.div>
            </AnimInView>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Gift Section ──────────────────────────────────────────────────────────────

function getBankGradient(name: string): [string, string] {
  const u = name.toUpperCase();
  for (const [k, v] of Object.entries(BANK_GRADIENTS)) {
    if (u.includes(k)) return v;
  }
  return ["#3d2e28", "#6b5248"];
}

function GiftSection({
  gifts, gold, ivory, champagne, text, fontH, fontB, t,
}: {
  gifts: Props["client"]["gifts"]; gold: string; ivory: string; champagne: string;
  text: string; fontH: string; fontB: string; t: Translations;
}) {
  const active = gifts.filter((g) => g.isActive);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [qrisOpen, setQrisOpen] = useState<string | null>(null);

  if (!active.length) return null;

  const banks = active.filter((g) => g.bankName && !g.qrisImage);
  const ewallets = active.filter((g) => g.ewalletType && !g.qrisImage);
  const qrisList = active.filter((g) => g.qrisImage);

  async function copy(key: string, val: string) {
    await navigator.clipboard.writeText(val);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 2200);
  }

  return (
    <section style={{ padding: "4rem 1.5rem", background: `linear-gradient(180deg, ${ivory} 0%, ${champagne} 100%)` }}>
      <div style={{ maxWidth: "480px", margin: "0 auto" }}>
        <SectionTitle eyebrow={t.eyebrow_gift} title={t.title_gift} gold={gold} text={text} fontH={fontH} />
        <AnimInView variant="fadeIn" delay={0.05}>
          <p style={{ textAlign: "center", fontFamily: `'${fontH}', 'Cormorant Garamond', Georgia, serif`, fontSize: "1rem", fontStyle: "italic", fontWeight: 300, color: text, opacity: 0.5, marginBottom: "2rem", lineHeight: 1.7 }}>{t.giftNote}</p>
        </AnimInView>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          {banks.map((gift, i) => {
            const [from, to] = getBankGradient(gift.bankName || "");
            const key = `bank-${gift.id}`;
            return (
              <AnimInView key={gift.id} variant="scaleIn" delay={i * 0.06}>
                <motion.div whileHover={{ y: -5, boxShadow: "0 24px 56px rgba(51,40,32,0.22)", transition: { duration: 0.3 } }} style={{ borderRadius: "20px", overflow: "hidden", position: "relative", aspectRatio: "1.586/1", minHeight: "185px", background: `linear-gradient(135deg, ${from}, ${to})` }}>
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 60%)" }} />
                  <div style={{ position: "relative", zIndex: 1, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "1.3rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <span style={{ fontWeight: 700, color: "#fff", fontSize: "1.05rem", letterSpacing: "0.04em" }}>{gift.bankName}</span>
                      <span style={{ color: "rgba(255,255,255,0.38)", fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: "'Cinzel', serif" }}>{t.transferLabel}</span>
                    </div>
                    <p style={{ fontFamily: "monospace", color: "#fff", fontSize: "1.05rem", letterSpacing: "0.22em" }}>{(gift.accountNumber || "").replace(/(.{4})/g, "$1  ").trim()}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                      <div>
                        <p style={{ color: "rgba(255,255,255,0.38)", fontSize: "0.55rem", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "2px" }}>{t.accountName}</p>
                        <p style={{ color: "#fff", fontSize: "0.82rem", fontWeight: 500, textTransform: "uppercase" }}>{gift.accountName}</p>
                      </div>
                      <button onClick={() => copy(key, gift.accountNumber || "")} style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.38rem 0.75rem", border: "1px solid rgba(255,255,255,0.28)", background: "rgba(255,255,255,0.1)", borderRadius: "6px", color: "#fff", fontSize: "0.65rem", cursor: "pointer" }}>
                        {copiedId === key ? <><Check size={11} /> {t.copied}</> : <><Copy size={11} /> {t.copy}</>}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </AnimInView>
            );
          })}
          {ewallets.map((gift, i) => {
            const key = `ew-${gift.id}`;
            return (
              <AnimInView key={gift.id} variant="fadeUp" delay={i * 0.06}>
                <motion.div whileHover={{ y: -3, transition: { duration: 0.25 } }} style={{ background: "#fff", borderRadius: "16px", padding: "1.2rem", display: "flex", alignItems: "center", gap: "1rem", border: `1px solid ${gold}22`, boxShadow: `0 3px 16px rgba(51,40,32,0.06)` }}>
                  <div style={{ padding: "0.75rem", borderRadius: "12px", background: `${gold}16`, flexShrink: 0 }}><Wallet size={18} color={gold} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: "'Cinzel', serif", fontSize: "0.56rem", color: text, opacity: 0.38, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "2px" }}>{t.eWallet}</p>
                    <p style={{ fontWeight: 600, color: text, fontSize: "0.92rem", fontFamily: `'${fontB}', 'Jost', sans-serif` }}>{gift.ewalletType}</p>
                    <p style={{ fontFamily: "monospace", fontSize: "0.82rem", color: text, opacity: 0.55, marginTop: "1px" }}>{gift.ewalletNumber}</p>
                  </div>
                  <button onClick={() => copy(key, gift.ewalletNumber || "")} style={{ background: "none", border: "none", cursor: "pointer", color: text, opacity: 0.4, padding: "4px" }}>
                    {copiedId === key ? <Check size={15} color={gold} /> : <Copy size={15} />}
                  </button>
                </motion.div>
              </AnimInView>
            );
          })}
          {qrisList.map((gift, i) => (
            <AnimInView key={gift.id} variant="fadeUp" delay={i * 0.06}>
              <div style={{ background: "#fff", borderRadius: "16px", overflow: "hidden", border: `1px solid ${gold}22` }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.2rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                    <div style={{ padding: "0.75rem", borderRadius: "12px", background: `${gold}16` }}><QrCode size={18} color={gold} /></div>
                    <div>
                      <p style={{ fontFamily: "'Cinzel', serif", fontSize: "0.56rem", color: text, opacity: 0.38, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "2px" }}>{t.qris}</p>
                      <p style={{ fontWeight: 600, color: text, fontSize: "0.9rem", fontFamily: `'${fontB}', 'Jost', sans-serif` }}>{gift.ewalletType || gift.bankName || "Scan QR"}</p>
                    </div>
                  </div>
                  <motion.button whileTap={{ scale: 0.93 }} onClick={() => setQrisOpen(qrisOpen === gift.id ? null : gift.id)} style={{ padding: "0.5rem 1.1rem", border: `1px solid ${gold}55`, borderRadius: "9999px", background: "transparent", color: gold, fontFamily: "'Cinzel', serif", fontSize: "0.6rem", letterSpacing: "0.12em", cursor: "pointer", textTransform: "uppercase" }}>
                    {qrisOpen === gift.id ? t.closeQr : t.viewQr}
                  </motion.button>
                </div>
                <AnimatePresence>
                  {qrisOpen === gift.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden", borderTop: `1px solid ${gold}18`, padding: "1.3rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <Image src={gift.qrisImage!} alt="QRIS" width={350} height={350} style={{ maxWidth: "175px", width: "100%", height: "auto", borderRadius: "12px" }} />
                      <p style={{ marginTop: "0.6rem", fontFamily: "'Jost', sans-serif", fontSize: "0.7rem", color: text, opacity: 0.38 }}>{t.scanToTransfer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </AnimInView>
          ))}
        </div>
        <AnimInView variant="fadeIn" delay={0.15}>
          <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
            <Gift size={18} color={gold} style={{ opacity: 0.35, margin: "0 auto 0.6rem", display: "block" }} />
            <p style={{ fontFamily: `'${fontH}', 'Cormorant Garamond', Georgia, serif`, fontSize: "0.88rem", fontStyle: "italic", color: text, opacity: 0.32 }}>{t.giftThanks}</p>
          </div>
        </AnimInView>
      </div>
    </section>
  );
}

// ─── Closing Section ───────────────────────────────────────────────────────────

function ClosingSection({ coupleLabel, gold, champagne, text, fontH, t }: { coupleLabel: string; gold: string; champagne: string; text: string; fontH: string; t: Translations }) {
  return (
    <footer style={{ padding: "4rem 2rem", textAlign: "center", borderTop: `1px solid ${gold}28`, background: champagne }}>
      <AnimInView variant="fadeUp">
        <p style={{ fontFamily: `'${fontH}', 'Cormorant Garamond', Georgia, serif`, fontSize: "1.5rem", fontStyle: "italic", color: gold, marginBottom: "0.5rem" }}>{coupleLabel}</p>
      </AnimInView>
      <AnimInView variant="fadeIn" delay={0.1}>
        <p style={{ fontSize: "0.65rem", letterSpacing: "0.3em", textTransform: "uppercase", color: DEF.muted }}>{t.footerThanks}</p>
      </AnimInView>
      <AnimInView variant="fadeIn" delay={0.2}>
        <div style={{ height: "1px", width: "40px", background: `${gold}44`, margin: "1.5rem auto" }} />
      </AnimInView>
      <AnimInView variant="fadeIn" delay={0.28}>
        <p style={{ fontSize: "0.6rem", color: DEF.muted, opacity: 0.4 }}>{t.madeWith}</p>
      </AnimInView>
    </footer>
  );
}

// ─── Main Template ─────────────────────────────────────────────────────────────

export function LuckyEnvelopeTemplate({ guest, client, token }: Props) {
  const [coverGone, setCoverGone] = useState(false);
  const [lang, setLang] = useGuestLanguage("en");
  const t: Translations = TR[lang];
  const [confirmedRsvpStatus, setConfirmedRsvpStatus] = useState<"HADIR" | "TIDAK_HADIR" | null>(
    (guest?.rsvp?.status as "HADIR" | "TIDAK_HADIR") ?? null
  );

  const profile = client.weddingProfile;
  const music = client.musics[0];
  const sectionKeys = client.sections.map((s) => s.sectionKey);

  const showCountdown = !!client.theme?.showCountdown;
  const showMap = client.theme?.showMap !== false;
  const barcodeVisibility = (client.theme as any)?.barcodeVisibility ?? "AFTER_RSVP";
  const autoScrollEnabled = (client.theme as any)?.autoScroll ?? true;
  const countdownTarget = showCountdown
    ? (client.events.filter((e) => e.date).map((e) => new Date(e.date!)).filter((d) => d > new Date()).sort((a, b) => a.getTime() - b.getTime())[0] ?? null)
    : null;
  const countdownTimeLeft = useCountdown(countdownTarget);

  const heroGallery = client.galleries.find((g) => g.type === "HERO");
  const coverGallery = client.galleries.find((g) => g.type === "COVER");
  const bgGallery = client.galleries.find((g) => g.type === "BACKGROUND");
  const heroUrl = heroGallery?.url || coverGallery?.url;

  const th = client.theme;
  const gold = th?.primaryColor || DEF.gold;
  const ivory = th?.bgColor || DEF.ivory;
  const champagne = th?.secondaryColor || DEF.champagne;
  const text = th?.textColor || DEF.text;
  const fontH = th?.fontHeading || "Cormorant Garamond";
  const fontB = th?.fontBody || "Jost";

  // When a background image is set, let it bleed faintly through section surfaces
  // instead of hiding behind fully opaque section backgrounds.
  const ivorySurface = bgGallery ? `${ivory}d9` : ivory;
  const champagneSurface = bgGallery ? `${champagne}d9` : champagne;

  const invLabel = INVITATION_LABEL[client.clientType] || "The Wedding Of";
  const groomNick = profile?.groomNickname || profile?.groomName || "Groom";
  const brideNick = profile?.brideNickname || profile?.brideName || "Bride";
  const coupleLabel = `${groomNick} & ${brideNick}`;

  const playMusicRef = useRef<(() => void) | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const [heroPassed, setHeroPassed] = useState(false);
  const [contentReached, setContentReached] = useState(false);

  function handleOpen() {
    setCoverGone(true);
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }

  // Auto-scroll past hero to content — fires automatically after cover opens
  useEffect(() => {
    if (!coverGone || heroPassed || !autoScrollEnabled) return;
    const timer = setTimeout(() => {
      const targetY = anchorRef.current?.offsetTop ?? 0;
      if (targetY < 50) return;
      setHeroPassed(true);
      const duration = 1400;
      const startTime = performance.now();
      function easeOutQuart(t: number) { return 1 - Math.pow(1 - t, 4); }
      function step(now: number) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        window.scrollTo({ top: targetY * easeOutQuart(progress), behavior: "instant" as ScrollBehavior });
        if (progress < 1) requestAnimationFrame(step);
        else setContentReached(true);
      }
      requestAnimationFrame(step);
    }, 2000);
    return () => clearTimeout(timer);
  }, [coverGone, heroPassed]);

  // After passing hero → block scrolling back up (cache minY once — reading offsetTop in handler causes layout thrashing)
  useEffect(() => {
    if (!heroPassed || !autoScrollEnabled) return;
    const minY = anchorRef.current?.offsetTop ?? 0;
    function lockUpScroll() {
      if (window.scrollY < minY) window.scrollTo({ top: minY, behavior: "instant" as ScrollBehavior });
    }
    window.addEventListener("scroll", lockUpScroll, { passive: true });
    return () => window.removeEventListener("scroll", lockUpScroll);
  }, [heroPassed]);

  // Cinematic auto-scroll — accumulates float position to avoid sub-pixel rounding jank
  useEffect(() => {
    if (!contentReached || !autoScrollEnabled) return;
    const SPEED = 40; // px per second — adjust freely
    let animId: number;
    let lastTime = performance.now();
    let stopped = false;
    const maxScroll = document.body.scrollHeight - window.innerHeight;
    let pos = window.scrollY; // float accumulator

    function tick(now: number) {
      if (stopped) return;
      const delta = Math.min(now - lastTime, 100); // cap: avoid big jump after tab switch
      lastTime = now;
      pos += (SPEED * delta) / 1000;
      const target = Math.min(Math.round(pos), maxScroll);
      window.scrollTo({ top: target, behavior: "instant" as ScrollBehavior });
      if (target < maxScroll) animId = requestAnimationFrame(tick);
    }

    function stop() {
      stopped = true;
      cancelAnimationFrame(animId);
      window.removeEventListener("touchstart", stop);
      window.removeEventListener("wheel", stop);
      window.removeEventListener("mousedown", stop);
      window.removeEventListener("keydown", stop);
    }

    window.addEventListener("touchstart", stop, { passive: true });
    window.addEventListener("wheel", stop, { passive: true });
    window.addEventListener("mousedown", stop);
    window.addEventListener("keydown", stop);

    animId = requestAnimationFrame(tick);
    return () => stop();
  }, [contentReached]);

  return (
    <>
      <style>{`
        body {
          background-color: ${ivory};
          color: ${text};
          margin: 0;
          -webkit-font-smoothing: antialiased;
          font-family: '${fontB}', 'Jost', sans-serif;
        }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${gold}44; border-radius: 9999px; }
      `}</style>

      {music && (
        <MusicPlayer url={music.url} title={music.title} registerPlay={(fn) => { playMusicRef.current = fn; }} />
      )}

      {/* Language toggle — visible after cover gone */}
      {coverGone && (
        <div style={{ position: "fixed", bottom: "5rem", right: "1rem", zIndex: 10000, display: "flex", borderRadius: "9999px", overflow: "hidden", border: `1px solid ${gold}44`, boxShadow: `0 4px 16px rgba(0,0,0,0.1)` }}>
          {(["id", "en"] as Lang[]).map((l) => (
            <button key={l} onClick={() => setLang(l)} style={{ padding: "0.4rem 0.75rem", fontSize: "0.65rem", fontFamily: "'Cinzel', serif", letterSpacing: "0.1em", textTransform: "uppercase", background: lang === l ? gold : ivory, color: lang === l ? "#fff" : gold, border: "none", cursor: "pointer", transition: "all 0.2s ease" }}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      {/* Jackpot Cover — opening screen */}
      <AnimatePresence>
        {!coverGone && (
          <JackpotCover
            groomNickname={groomNick}
            brideNickname={brideNick}
            guestName={guest?.name}
            invitationLabel={invLabel}
            groomPhoto={profile?.showGroomPhoto ? profile?.groomPhoto : null}
            bridePhoto={profile?.showBridePhoto ? profile?.bridePhoto : null}
            heroUrl={heroUrl}
            primaryColor={gold}
            bgColor={ivory}
            fontHeading={fontH}
            lang={lang === "en" ? "EN" : "ID"}
            onLangToggle={() => setLang((l) => l === "en" ? "id" : "en")}
            onOpen={handleOpen}
            onTap={() => playMusicRef.current?.()}
          />
        )}
      </AnimatePresence>

      {/* Main Invitation Content — envelope journey */}
      <motion.div
        className="lenv-root"
        initial={{ opacity: 0 }}
        animate={{ opacity: coverGone ? 1 : 0 }}
        transition={{ duration: 0.7 }}
        style={{
          minHeight: "100dvh",
          position: "relative",
          background: bgGallery ? undefined : ivory,
          backgroundImage: bgGallery ? `url('${bgGallery.url}')` : undefined,
          backgroundSize: bgGallery ? "cover" : undefined,
          backgroundPosition: bgGallery ? "center" : undefined,
        }}
      >
        <style>{GLOBAL_CSS}</style>

        {bgGallery && (
          <div aria-hidden style={{ position: "fixed", inset: 0, background: `${ivory}d0`, zIndex: 0, pointerEvents: "none" }} />
        )}

        {coverGone && <Particles />}

        <div style={{ position: "relative", zIndex: 1 }}>
          {coverGone && (
            <>
              <HeroSection heroUrl={heroUrl} gold={gold} ivory={ivorySurface} text={text} fontH={fontH} coupleLabel={coupleLabel} invLabel={invLabel} t={t} />

              {/* Scroll anchor */}
              <div ref={anchorRef} aria-hidden style={{ height: 0 }} />

              {showCountdown && countdownTimeLeft && (
                <section style={{ padding: "3.5rem 1.5rem", background: champagneSurface, textAlign: "center" }}>
                  <p style={{ fontFamily: "'Cinzel', serif", fontSize: "0.58rem", letterSpacing: "0.3em", textTransform: "uppercase", color: gold, marginBottom: "1.6rem" }}>{t.countdownLabel}</p>
                  <div style={{ display: "flex", justifyContent: "center", gap: "1.5rem" }}>
                    {[{ v: countdownTimeLeft.days, l: t.days }, { v: countdownTimeLeft.hours, l: t.hours }, { v: countdownTimeLeft.minutes, l: t.minutes }, { v: countdownTimeLeft.seconds, l: t.seconds }].map(({ v, l }) => (
                      <div key={l} style={{ textAlign: "center", minWidth: "3rem" }}>
                        <div style={{ fontFamily: `'${fontH}', 'Cormorant Garamond', Georgia, serif`, fontSize: "2.6rem", fontWeight: 300, color: gold, lineHeight: 1 }}>{String(v).padStart(2, "0")}</div>
                        <div style={{ fontFamily: "'Cinzel', serif", fontSize: "0.55rem", letterSpacing: "0.18em", textTransform: "uppercase", color: DEF.muted, marginTop: "0.35rem" }}>{l}</div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {sectionKeys.includes("COUPLE") && profile && (
                <CoupleSection profile={profile} gold={gold} ivory={ivorySurface} champagne={champagneSurface} text={text} fontH={fontH} fontB={fontB} t={t} lang={lang} />
              )}

              {(profile as any)?.attentionContent && (
                <AttentionSection
                  title={(profile as any).attentionTitle}
                  content={(profile as any).attentionContent}
                  titleEn={(profile as any).attentionTitleEn}
                  contentEn={(profile as any).attentionContentEn}
                  lang={lang === "en" ? "EN" : "ID"}
                  primaryColor={gold}
                  bgColor={ivorySurface}
                  textColor={text}
                  fontBody={fontB}
                />
              )}

              {sectionKeys.includes("EVENT") && (
                <EventsSection events={getEventsForGuestCategory(client.events, guest?.invitationCategory)} gold={gold} ivory={ivorySurface} champagne={champagneSurface} text={text} fontH={fontH} fontB={fontB} t={t} showMap={showMap} lang={lang} />
              )}

              {sectionKeys.includes("GALLERY") && (
                <GallerySection galleries={client.galleries} gold={gold} champagne={champagneSurface} text={text} fontH={fontH} t={t} />
              )}

              {sectionKeys.includes("RSVP") &&
                (token && guest ? (
                  <RSVPSection clientId={client.id} guest={guest} token={token} gold={gold} ivory={ivorySurface} champagne={champagneSurface} text={text} fontH={fontH} fontB={fontB} t={t} menuItems={findMenuEvent(client.events, guest.invitationCategory ?? "")?.menuItems ?? []} onConfirmed={(s) => setConfirmedRsvpStatus(s)} />
                ) : (
                  <RSVPPlaceholder gold={gold} ivory={ivorySurface} champagne={champagneSurface} text={text} fontH={fontH} t={t} />
                ))}

              {guest?.barcodeChurch && (barcodeVisibility === "ALWAYS" || (barcodeVisibility === "AFTER_RSVP" && confirmedRsvpStatus === "HADIR")) && (
                <BarcodeSection
                  barcodeChurch={guest.barcodeChurch}
                  barcodeReception={guest.barcodeReception ?? null}
                  invitationCategory={guest.invitationCategory ?? "GEREJA_RESEPSI"}
                  churchLabel={getEventDisplayLabel(client.events.find((e: any) => e.type !== "RESEPSI" && e.type !== "AFTER_PARTY") ?? client.events[0], lang)}
                  receptionLabel={getEventDisplayLabel(client.events.find((e: any) => e.type === "RESEPSI"), lang)}
                  churchVenueName={getEventVenueName(client.events.find((e: any) => e.type !== "RESEPSI" && e.type !== "AFTER_PARTY") ?? client.events[0], lang, "Venue")}
                  receptionVenueName={getEventVenueName(client.events.find((e: any) => e.type === "RESEPSI"), lang, "Resepsi")}
                  primaryColor={gold}
                  bgColor={ivorySurface}
                  fontHeading={fontH}
                  lang={lang}
                />
              )}

              {sectionKeys.includes("WISHES") && (
                <WishesSection clientId={client.id} initialWishes={client.wishes} guestName={guest?.name} guestId={guest?.id} gold={gold} ivory={ivorySurface} champagne={champagneSurface} text={text} fontH={fontH} fontB={fontB} t={t} />
              )}

              {sectionKeys.includes("GIFT") && (
                <GiftSection gifts={client.gifts} gold={gold} ivory={ivorySurface} champagne={champagneSurface} text={text} fontH={fontH} fontB={fontB} t={t} />
              )}

              <ClosingSection coupleLabel={coupleLabel} gold={gold} champagne={champagneSurface} text={text} fontH={fontH} t={t} />
            </>
          )}
        </div>
      </motion.div>
    </>
  );
}

"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Copy, Check, Wallet, QrCode, Send,
  Heart, LockKeyhole, ChevronDown, Gift as GiftIcon,
} from "lucide-react";
import { MusicPlayer } from "../../sections/MusicPlayer";
import { GiftAddressCard } from "../../sections/GiftAddressCard";
import { WishesLockedPlaceholder } from "../../sections/WishesLockedPlaceholder";
import { useAutoScroll } from "@/hooks/useAutoScroll";
import type { Rsvp } from "@/types/prisma.types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Guest {
  id: string; name: string; maxPax: number; rsvp: Rsvp | null;
}

type Profile = {
  groomName: string; brideName: string;
  groomNickname: string; brideNickname: string;
  groomParents: string; brideParents: string;
  openingQuote: string | null; openingQuoteBy: string | null;
  story: string | null; storyTitle: string | null; showStoryTitle: boolean;
  heroImage: string | null;
  groomPhoto: string | null; bridePhoto: string | null;
  showGroomPhoto: boolean; showBridePhoto: boolean;
} | null;

interface Props {
  guest: Guest | null;
  client: {
    id: string; name: string; slug: string; clientType: string;
    weddingProfile: Profile;
    events: { id: string; type: string; label: string; date: Date | null; timeStart: string; timeEnd: string; venueName: string; venueAddress: string; mapsUrl: string }[];
    musics: { url: string; title: string }[];
    sections: { sectionKey: string; sortOrder: number }[];
    galleries: { id: string; url: string; type: string; sortOrder: number }[];
    gifts: { id: string; kind: string; bankName: string | null; accountNumber: string | null; accountName: string | null; ewalletType: string | null; ewalletNumber: string | null; qrisImage: string | null; isActive: boolean; receiverName: string | null; receiverPhone: string | null; address: string | null }[];
    wishes: { id: string; name: string; message: string; reply: string | null; createdAt: Date }[];
    theme: { templateSlug?: string | null; primaryColor: string; secondaryColor: string; bgColor: string; textColor: string; fontHeading: string; fontBody: string; showCountdown?: boolean | null; showMap?: boolean | null; autoScroll?: boolean | null; requireRsvpForWish?: boolean | null } | null;
  };
  token: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEF = {
  base: "#EEEDE8",
  primary: "#1a1a1a",
  content: "#E4DEDB",
  muted: "#7a7a7a",
};

const BANK_GRADIENTS: Record<string, [string, string]> = {
  BCA: ["#005bac", "#1a8fe0"], BNI: ["#e65c00", "#f9a825"],
  MANDIRI: ["#003087", "#0057e0"], BRI: ["#003087", "#1a5276"],
  CIMB: ["#b71c1c", "#e53935"],
};

const EVENT_LABEL: Record<string, string> = {
  AKAD: "Akad Nikah", PEMBERKATAN: "Church Ceremony",
  RESEPSI: "Wedding Reception", AFTER_PARTY: "After Party",
  SANGJIT: "Sangjit Ceremony", LAMARAN: "Lamaran",
};

// Constant JSX — defined once at module scope to avoid re-allocation on every render/tick
const TIMELINE_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 256 256" fill="currentColor">
    <path d="M184 20a12 12 0 1 1 12 12a12 12 0 0 1-12-12Zm-19.88 53.23c7.26 44.25 4.35 75.76-8.66 93.66A39.94 39.94 0 0 1 128 183.42V232h16a8 8 0 0 1 0 16H96a8 8 0 0 1 0-16h16v-48.58a40 40 0 0 1-27.46-16.53c-13-17.9-15.91-49.41-8.65-93.66a451 451 0 0 1 14.21-59.7A8 8 0 0 1 97.71 8h44.59a8 8 0 0 1 7.61 5.53a451 451 0 0 1 14.21 59.7Z" />
  </svg>
);

const COUNTDOWN_KEYS = ["days", "hours", "minutes", "seconds"] as const;
const COUNTDOWN_LABELS = ["Ngày", "Giờ", "Phút", "Giây"] as const;

// ─── Global CSS ───────────────────────────────────────────────────────────────

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap');
  html { scroll-behavior: smooth; }
  .hm-root { -webkit-font-smoothing: antialiased; }
  .hm-root * { box-sizing: border-box; }
  .hm-masonry { columns: 2; column-gap: 8px; }
  @media (min-width: 640px) { .hm-masonry { columns: 3; } }
  @media (min-width: 1024px) { .hm-masonry { columns: 4; } }
  .hm-masonry-item { break-inside: avoid; margin-bottom: 8px; cursor: pointer; display: block; }
  .hm-masonry-item img { width: 100%; display: block; border-radius: 10px; transition: transform 0.3s ease; }
  .hm-masonry-item:hover img { transform: scale(1.02); }
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 9999px; }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useCountdown(target: Date | null) {
  type T = { days: number; hours: number; minutes: number; seconds: number };
  const targetMs = target?.getTime() ?? null;
  const [t, setT] = useState<T | null>(null);
  useEffect(() => {
    if (targetMs === null) return;
    function calc() {
      const diff = targetMs! - Date.now();
      if (diff <= 0) { setT(null); return; }
      setT({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff / 3600000) % 24),
        minutes: Math.floor((diff / 60000) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    }
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [targetMs]);
  return targetMs !== null ? t : null;
}

function getMapEmbedUrl(mapsUrl: string, venueName: string, venueAddress: string): string {
  const coordMatch = mapsUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (coordMatch) return `https://maps.google.com/maps?q=${coordMatch[1]},${coordMatch[2]}&output=embed&z=17`;
  const qMatch = mapsUrl.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qMatch) return `https://maps.google.com/maps?q=${qMatch[1]},${qMatch[2]}&output=embed&z=17`;
  return `https://maps.google.com/maps?q=${encodeURIComponent(`${venueName} ${venueAddress}`.trim())}&output=embed&z=17`;
}

function getBankGradient(name: string): [string, string] {
  const u = name.toUpperCase();
  for (const [k, v] of Object.entries(BANK_GRADIENTS)) if (u.includes(k)) return v;
  return ["#2d2d2d", "#555"];
}

function FadeIn({
  children, delay = 0, y = 20, style, className,
}: {
  children: React.ReactNode; delay?: number; y?: number;
  style?: React.CSSProperties; className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.1 }}
      transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1], delay }}
      style={style}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Cover ────────────────────────────────────────────────────────────────────

function HanoiModernCover({
  groomNick, brideNick, guestName, heroUrl, bgColor, primaryColor,
  eventDate, fontH,
}: {
  groomNick: string; brideNick: string; guestName?: string | null;
  heroUrl?: string; bgColor: string; primaryColor: string;
  eventDate: Date | null; fontH: string;
}) {
  const dp = eventDate ? {
    day: String(eventDate.getDate()).padStart(2, "0"),
    month: String(eventDate.getMonth() + 1).padStart(2, "0"),
    year: String(eventDate.getFullYear()).slice(-2),
  } : { day: "--", month: "--", year: "--" };

  function scrollToContent() {
    document.getElementById("hm-content")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section
      style={{
        position: "relative",
        height: "100dvh",
        background: bgColor,
        display: "flex", flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Main content */}
      <div style={{ display: "flex", flex: 1, gap: "6px", padding: "0 0 40px 10px", minHeight: 0 }}>

        {/* Left strip: date column */}
        <div style={{ width: "40px", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "0" }}>
          {/* Circular SVG "Save The Date" */}
          <div style={{ width: "80px", marginLeft: "-20px", marginTop: "-10px" }}>
            <svg viewBox="0 0 200 380" style={{ width: "100%", color: primaryColor }}>
              <defs>
                <path id="hm-arc" d="M 22,100 a 75,77 0 1,1 155,0" />
              </defs>
              <text fill="currentColor" fontSize="13" letterSpacing="1.5" fontFamily="'Cinzel', serif">
                <textPath href="#hm-arc" startOffset="0">Save The Date</textPath>
              </text>
            </svg>
          </div>

          {/* Vertical line with stacked date */}
          <div style={{ flex: 1, position: "relative", width: "1px", background: primaryColor, margin: "0 auto" }}>
            <div style={{
              position: "absolute", bottom: 0, left: "50%",
              transform: "translateX(-50%)",
              display: "flex", flexDirection: "column", alignItems: "center",
              background: bgColor, padding: "10px 8px",
              fontFamily: `'${fontH}', 'Cormorant Garamond', Georgia, serif`,
              fontSize: "1.4rem", fontWeight: 400, color: primaryColor,
              lineHeight: 1.15, textAlign: "center",
            }}>
              <span>{dp.day}</span>
              <span>{dp.month}</span>
              <span>{dp.year}</span>
            </div>
          </div>
        </div>

        {/* Right: portrait image with arch top */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden", borderRadius: "9999px 9999px 0 0" }}>
          {heroUrl ? (
            <img
              src={heroUrl} alt=""
              style={{
                width: "100%", height: "100%",
                objectFit: "cover", objectPosition: "center 20%",
                display: "block",
              }}
            />
          ) : (
            <div style={{ width: "100%", height: "100%", background: `linear-gradient(180deg, ${primaryColor}18 0%, ${primaryColor}30 100%)` }} />
          )}

          {/* Bottom gradient */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: "55%",
            background: `linear-gradient(to top, ${bgColor} 0%, transparent 100%)`,
          }} />

          {/* Names + guest at bottom */}
          <div style={{ position: "absolute", bottom: "28px", left: "16px", right: "16px" }}>
            {guestName && (
              <p style={{
                fontSize: "0.7rem", color: primaryColor, opacity: 0.55,
                fontFamily: `'${fontH}', serif`, marginBottom: "4px",
              }}>
                Dear, {guestName}
              </p>
            )}
            <p style={{
              fontFamily: "'Great Vibes', cursive",
              fontSize: "clamp(2.4rem, 9vw, 3.8rem)",
              color: primaryColor,
              lineHeight: 1.15,
            }}>
              {brideNick} &amp; {groomNick}
            </p>
          </div>
        </div>
      </div>

      {/* Bouncing scroll button */}
      <motion.div
        style={{ position: "absolute", bottom: "10px", left: "50%", transform: "translateX(-50%)", zIndex: 10 }}
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
      >
        <button
          onClick={scrollToContent}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: "42px", height: "42px", borderRadius: "50%",
            background: `${bgColor}CC`,
            backdropFilter: "blur(8px)",
            border: `1px solid ${primaryColor}33`,
            cursor: "pointer", outline: "none",
            boxShadow: `0 4px 16px ${primaryColor}18`,
          }}
        >
          <ChevronDown size={20} color={primaryColor} />
        </button>
      </motion.div>
    </section>
  );
}

// ─── About / Couple Section ────────────────────────────────────────────────────

function PersonCard({
  name, photo, parents, label, gradientSide, bgColor, primary, fontH, fontB,
}: {
  name: string; photo: string | null; parents: string;
  label: string; gradientSide: "left" | "right";
  bgColor: string; primary: string; fontH: string; fontB: string;
}) {
  return (
    <FadeIn style={{ marginBottom: "3rem" }}>
      <div style={{ position: "relative" }}>
        <div style={{ position: "relative", overflow: "hidden", borderRadius: "10px" }}>
          <div style={{ aspectRatio: "4/5" }}>
            {photo ? (
              <img
                src={photo} alt={name} loading="lazy"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            ) : (
              <div style={{ width: "100%", height: "100%", background: `${primary}12` }} />
            )}
          </div>

          <div style={{
            position: "absolute", top: 0, bottom: 0,
            [gradientSide]: 0,
            width: "52%",
            background: `linear-gradient(to ${gradientSide === "right" ? "left" : "right"}, ${bgColor} 0%, transparent 100%)`,
          }} />

          <div style={{
            position: "absolute", top: "50%",
            [gradientSide]: 0,
            transform: `translateY(-50%) translateX(${gradientSide === "right" ? "36%" : "-36%"})`,
            pointerEvents: "none", width: "100%",
          }}>
            <div style={{
              transform: "rotate(90deg)",
              fontFamily: "'Great Vibes', cursive",
              fontSize: "clamp(3.2rem, 11vw, 5rem)",
              color: primary,
              whiteSpace: "nowrap",
              letterSpacing: "0.08em",
              lineHeight: 1,
            }}>
              {label}
            </div>
          </div>
        </div>

        <div style={{ width: "80%", marginTop: "14px" }}>
          <h3 style={{
            fontFamily: `'${fontH}', 'Cormorant Garamond', Georgia, serif`,
            fontSize: "1.5rem", fontWeight: 500, color: primary, marginBottom: "6px",
          }}>
            {name}
          </h3>
          {parents && (
            <p style={{
              fontFamily: `'${fontB}', 'Jost', sans-serif`,
              fontSize: "0.82rem", lineHeight: 1.75, color: primary, opacity: 0.6,
              textAlign: "left",
            }}>
              {parents}
            </p>
          )}
        </div>
      </div>
    </FadeIn>
  );
}

function AboutSection({
  profile, bgColor, primary, fontH, fontB,
}: {
  profile: NonNullable<Profile>; bgColor: string; primary: string; fontH: string; fontB: string;
}) {
  return (
    <section style={{ padding: "3.5rem 1.25rem 1rem", background: bgColor }}>
      <div style={{ maxWidth: "480px", margin: "0 auto" }}>
        <FadeIn style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h2 style={{
            fontFamily: `'${fontH}', 'Cormorant Garamond', Georgia, serif`,
            fontSize: "clamp(1.6rem, 5vw, 2.2rem)", fontWeight: 300, color: primary,
          }}>
            The wedding of
          </h2>
        </FadeIn>

        <PersonCard
          name={profile.brideName}
          photo={profile.showBridePhoto ? profile.bridePhoto : null}
          parents={profile.brideParents}
          label="The Bride"
          gradientSide="right"
          bgColor={bgColor} primary={primary} fontH={fontH} fontB={fontB}
        />

        <PersonCard
          name={profile.groomName}
          photo={profile.showGroomPhoto ? profile.groomPhoto : null}
          parents={profile.groomParents}
          label="The Groom"
          gradientSide="left"
          bgColor={bgColor} primary={primary} fontH={fontH} fontB={fontB}
        />

        {/* Opening quote */}
        {profile.openingQuote && (
          <FadeIn delay={0.1} style={{ borderTop: `1px solid ${primary}18`, paddingTop: "2.5rem", marginTop: "0.5rem", textAlign: "center" }}>
            <p style={{
              fontFamily: `'${fontH}', 'Cormorant Garamond', Georgia, serif`,
              fontSize: "1.05rem", fontStyle: "italic", fontWeight: 300,
              color: primary, opacity: 0.65, lineHeight: 1.85,
            }}>
              &ldquo;{profile.openingQuote}&rdquo;
            </p>
            {profile.openingQuoteBy && (
              <p style={{
                fontFamily: "'Cinzel', serif",
                fontSize: "0.56rem", letterSpacing: "0.22em",
                color: primary, opacity: 0.45, marginTop: "0.8rem",
                textTransform: "uppercase",
              }}>
                — {profile.openingQuoteBy}
              </p>
            )}
          </FadeIn>
        )}
      </div>
    </section>
  );
}

// ─── Gallery Section ──────────────────────────────────────────────────────────

function GallerySection({
  galleries, bgColor, primary, fontH,
}: {
  galleries: Props["client"]["galleries"]; bgColor: string; primary: string; fontH: string;
}) {
  const photos = galleries.filter((g) => g.type === "GALLERY" || g.type === "PREWEDDING");
  const [lightbox, setLightbox] = useState<string | null>(null);

  if (!photos.length) return null;

  return (
    <section style={{ padding: "3.5rem 1rem", background: bgColor, overflow: "hidden" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        <FadeIn style={{ textAlign: "center", marginBottom: "0.75rem" }}>
          <h2 style={{
            fontFamily: `'${fontH}', 'Cormorant Garamond', Georgia, serif`,
            fontSize: "clamp(1.5rem, 5vw, 2rem)", fontWeight: 400, color: primary,
          }}>
            Memorable Moments
          </h2>
        </FadeIn>
        <FadeIn delay={0.08} style={{ textAlign: "center", marginBottom: "2rem" }}>
          <p style={{
            fontFamily: "'Jost', sans-serif", fontSize: "0.82rem",
            color: primary, opacity: 0.5, lineHeight: 1.75, maxWidth: "360px", margin: "0 auto",
          }}>
            Through storms and sunshine alike, their love has remained tender and enduring.
          </p>
        </FadeIn>

        <FadeIn delay={0.12}>
          <div className="hm-masonry">
            {photos.map((photo) => (
              <button
                key={photo.id}
                className="hm-masonry-item"
                onClick={() => setLightbox(photo.url)}
                style={{ background: "none", border: "none", padding: 0, display: "block", width: "100%" }}
              >
                <img src={photo.url} alt="" loading="lazy" />
              </button>
            ))}
          </div>
        </FadeIn>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
            style={{
              position: "fixed", inset: 0, zIndex: 200,
              background: "rgba(0,0,0,0.92)",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "1rem",
            }}
          >
            <motion.img
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={lightbox} alt=""
              style={{
                maxWidth: "100%", maxHeight: "90dvh",
                objectFit: "contain", borderRadius: "12px",
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// ─── Countdown + Events Section ───────────────────────────────────────────────

function CountdownEventsSection({
  events, galleries, bgColor, primary, content, fontH, fontB,
  countdownTarget, showMap,
}: {
  events: Props["client"]["events"];
  galleries: Props["client"]["galleries"];
  bgColor: string; primary: string; content: string;
  fontH: string; fontB: string;
  countdownTarget: Date | null;
  showMap: boolean;
}) {
  const countdown = useCountdown(countdownTarget);
  const countdownBg = galleries.find((g) => g.type === "COVER" || g.type === "HERO")?.url;
  const firstEvent = events[0];

  const eventDay = useMemo(
    () => firstEvent?.date ? String(new Date(firstEvent.date).getDate()) : "--",
    [firstEvent?.date]
  );

  if (!events.length) return null;

  return (
    <section style={{ background: bgColor }} id="hm-invitation">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: "70dvh" }}>

        {/* Left: sticky countdown */}
        <div style={{ position: "relative", minHeight: "70dvh" }}>
          <div
            style={{
              position: "sticky", top: 0,
              height: "100dvh", maxHeight: "100dvh",
              overflow: "hidden",
              display: "flex", flexDirection: "column", justifyContent: "flex-end",
              padding: "2rem 1rem 2rem 1rem",
            }}
          >
            {/* BG image */}
            {countdownBg ? (
              <img
                src={countdownBg} alt=""
                style={{
                  position: "absolute", inset: 0, width: "100%", height: "100%",
                  objectFit: "cover", objectPosition: "center",
                }}
              />
            ) : (
              <div style={{ position: "absolute", inset: 0, background: primary }} />
            )}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.35) 100%)" }} />

            {/* Countdown content */}
            <div style={{ position: "relative", zIndex: 1, color: content }}>
              <FadeIn>
                <h2 style={{
                  fontFamily: `'${fontH}', 'Cormorant Garamond', Georgia, serif`,
                  fontSize: "clamp(1.2rem, 3vw, 1.8rem)", fontWeight: 300,
                  textAlign: "center", marginBottom: "1.5rem", color: "#fff",
                }}>
                  The Countdown Begins
                </h2>
              </FadeIn>

              {countdown ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px", marginBottom: "1.25rem" }}>
                  {COUNTDOWN_LABELS.map((l, i) => (
                    <div key={l} style={{
                      background: primary, color: content,
                      borderRadius: "8px", padding: "8px 4px",
                      textAlign: "center",
                    }}>
                      <div style={{
                        fontFamily: `'${fontH}', serif`,
                        fontSize: "clamp(1.4rem, 4vw, 2.2rem)", fontWeight: 700,
                        color: content, lineHeight: 1,
                      }}>
                        {String(countdown[COUNTDOWN_KEYS[i]]).padStart(2, "0")}
                      </div>
                      <div style={{ fontFamily: `'${fontB}', sans-serif`, fontSize: "0.62rem", opacity: 0.7, marginTop: "4px" }}>
                        {l}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "1.5rem 0", marginBottom: "1.25rem" }}>
                  <p style={{
                    fontFamily: "'Great Vibes', cursive",
                    fontSize: "clamp(1.8rem, 6vw, 2.8rem)", color: "#fff",
                  }}>
                    It&apos;s time!
                  </p>
                </div>
              )}

              <FadeIn delay={0.1}>
                <p style={{
                  fontFamily: `'${fontB}', 'Jost', sans-serif`,
                  fontSize: "0.76rem", lineHeight: 1.75, color: content, opacity: 0.75,
                  textAlign: "center",
                }}>
                  We are about to begin a new chapter in our journey of love, and it would mean so much to have you there.
                </p>
              </FadeIn>
            </div>
          </div>
        </div>

        {/* Right: invitation card + wedding timeline */}
        <div style={{ minHeight: "70dvh" }}>
          {/* Invitation card — arch top */}
          {firstEvent && (
            <div style={{
              background: content, color: primary,
              borderRadius: "9999px 9999px 0 0",
              padding: "3rem 1.25rem 2rem",
              textAlign: "center",
            }}>
              <FadeIn>
                <p style={{
                  fontFamily: `'${fontH}', serif`,
                  fontSize: "1.1rem", fontWeight: 700, marginBottom: "1.5rem",
                }}>
                  {firstEvent.timeStart}
                </p>
              </FadeIn>

              <FadeIn delay={0.06}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem", marginBottom: "2rem" }}>
                  <span style={{
                    fontFamily: `'${fontH}', 'Cormorant Garamond', serif`,
                    fontSize: "clamp(3.5rem, 12vw, 5.5rem)", fontWeight: 400, lineHeight: 1,
                  }}>
                    {eventDay}
                  </span>
                  <div style={{ width: "1px", height: "80px", background: primary, opacity: 0.3 }} />
                  <div style={{ textAlign: "left" }}>
                    {firstEvent.date && (
                      <>
                        <p style={{ fontFamily: `'${fontH}', serif`, fontWeight: 700, fontSize: "0.95rem" }}>
                          {new Date(firstEvent.date).toLocaleDateString("id-ID", { weekday: "long" })}
                        </p>
                        <p style={{ fontFamily: `'${fontB}', sans-serif`, fontSize: "0.78rem" }}>
                          {new Date(firstEvent.date).toLocaleDateString("id-ID", { month: "long" })}
                        </p>
                        <p style={{ fontFamily: `'${fontB}', sans-serif`, fontSize: "0.78rem" }}>
                          {new Date(firstEvent.date).getFullYear()}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </FadeIn>

              {/* Location */}
              <FadeIn delay={0.1}>
                <div style={{ marginBottom: "1.5rem" }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 14 14" style={{ margin: "0 auto 10px", display: "block", color: primary }}>
                    <g fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.179 6.011L4.114.881l3.653 1.04l-1.062 5.38a2.362 2.362 0 1 1-4.526-1.29m1.563 3.104l-1.074 3.766m-1.484-.424l2.967.846" />
                      <path d="m3.148 3.438l4.086 1.175" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.567 8.963a2.362 2.362 0 0 0 3.255-2.952L9.885.881l-.576.163m.949 8.071l1.074 3.766m1.484-.424l-2.967.846m1.003-9.853l-1.669.48" />
                    </g>
                  </svg>
                  <p style={{ fontFamily: `'${fontH}', serif`, fontSize: "1.1rem", fontWeight: 500, marginBottom: "4px" }}>
                    {firstEvent.venueName}
                  </p>
                  {firstEvent.venueAddress && (
                    <p style={{ fontFamily: `'${fontB}', sans-serif`, fontSize: "0.75rem", opacity: 0.6, lineHeight: 1.55 }}>
                      {firstEvent.venueAddress}
                    </p>
                  )}
                  {firstEvent.mapsUrl && (
                    <a
                      href={firstEvent.mapsUrl} target="_blank" rel="noopener noreferrer"
                      style={{
                        display: "inline-flex", alignItems: "center", gap: "5px",
                        marginTop: "12px", padding: "8px 20px",
                        background: primary, color: content,
                        borderRadius: "8px", fontSize: "0.72rem",
                        fontFamily: `'${fontB}', sans-serif`,
                        textDecoration: "none", fontWeight: 500,
                      }}
                    >
                      <MapPin size={12} />
                      Lihat Peta
                    </a>
                  )}
                </div>
              </FadeIn>

              {/* Embedded map */}
              {showMap && firstEvent.mapsUrl && firstEvent.venueName && (
                <FadeIn delay={0.15}>
                  <div style={{ borderRadius: "12px", overflow: "hidden", marginTop: "1rem" }}>
                    <iframe
                      src={getMapEmbedUrl(firstEvent.mapsUrl, firstEvent.venueName, firstEvent.venueAddress)}
                      width="100%" height="160"
                      style={{ display: "block", border: "none" }}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title={firstEvent.venueName}
                    />
                  </div>
                </FadeIn>
              )}
            </div>
          )}

          {/* Wedding Timeline */}
          <div style={{ background: content, color: primary, padding: "2.5rem 1.25rem 3rem" }}>
            <FadeIn>
              <h2 style={{
                fontFamily: `'${fontH}', 'Cormorant Garamond', Georgia, serif`,
                fontSize: "clamp(1.3rem, 4vw, 1.8rem)", fontWeight: 400,
                textAlign: "center", marginBottom: "2.5rem", color: primary,
                letterSpacing: "0.05em",
              }}>
                WEDDING TIMELINE
              </h2>
            </FadeIn>

            <div style={{ display: "flex", flexDirection: "column", gap: "2rem", maxWidth: "380px", margin: "0 auto" }}>
              {events.map((ev, i) => (
                <FadeIn key={ev.id} delay={i * 0.07}>
                  <div style={{
                    display: "flex", alignItems: "flex-start", gap: "1rem",
                    flexDirection: i % 2 === 0 ? "row" : "row-reverse",
                  }}>
                    {/* Time + icon box */}
                    <div style={{
                      background: primary, color: content,
                      borderRadius: "8px", padding: "10px 12px",
                      flexShrink: 0, textAlign: "center", minWidth: "72px",
                    }}>
                      <p style={{
                        fontFamily: `'${fontH}', serif`,
                        fontSize: "0.9rem", fontWeight: 700, marginBottom: "8px",
                        whiteSpace: "nowrap",
                      }}>
                        {ev.timeStart}
                      </p>
                      <div style={{ color: content, display: "flex", justifyContent: "center" }}>
                        {TIMELINE_ICON}
                      </div>
                    </div>

                    {/* Description */}
                    <div style={{ textAlign: i % 2 === 0 ? "left" : "right" }}>
                      <p style={{
                        fontFamily: `'${fontH}', 'Cormorant Garamond', serif`,
                        fontSize: "1rem", fontWeight: 500, marginBottom: "4px",
                      }}>
                        {ev.label || EVENT_LABEL[ev.type] || ev.type}
                      </p>
                      {ev.venueName && (
                        <p style={{
                          fontFamily: `'${fontB}', 'Jost', sans-serif`,
                          fontSize: "0.75rem", opacity: 0.55, fontStyle: "italic",
                          lineHeight: 1.55,
                        }}>
                          {ev.venueName}
                          {ev.venueAddress ? ` — ${ev.venueAddress}` : ""}
                        </p>
                      )}
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── RSVP Section ─────────────────────────────────────────────────────────────

function RSVPSection({
  clientId, guest, token, primary, fontH, fontB,
}: {
  clientId: string; guest: Guest; token: string;
  primary: string; fontH: string; fontB: string;
}) {
  const [status, setStatus] = useState<"HADIR" | "TIDAK_HADIR">((guest.rsvp?.status as "HADIR" | "TIDAK_HADIR") || "HADIR");
  const [pax, setPax] = useState((guest.rsvp as any)?.paxCount ?? guest.maxPax);
  const [msg, setMsg] = useState((guest.rsvp as any)?.message || "");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(!!guest.rsvp);

  async function submit() {
    setSaving(true);
    const res = await fetch("/api/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, guestId: guest.id, token, name: guest.name, paxCount: pax, status, message: msg }),
    });
    if (res.ok) { setDone(true); }
    setSaving(false);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)",
    border: "1px solid rgba(255,255,255,0.25)", borderRadius: "8px",
    padding: "10px 14px", color: "#fff", fontSize: "0.82rem",
    fontFamily: `'${fontB}', 'Jost', sans-serif`, outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div>
      {done ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ textAlign: "center", padding: "2.5rem 1.5rem", background: "rgba(255,255,255,0.1)", borderRadius: "16px" }}
        >
          <Heart size={28} color="#fff" style={{ margin: "0 auto 12px", display: "block" }} />
          <p style={{ fontFamily: `'${fontH}', serif`, fontSize: "1.4rem", color: "#fff", marginBottom: "6px" }}>
            Thank you!
          </p>
          <p style={{ fontFamily: `'${fontB}', sans-serif`, fontSize: "0.8rem", color: "rgba(255,255,255,0.65)" }}>
            We can&apos;t wait to celebrate with you.
          </p>
        </motion.div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Name (read-only if we have it) */}
          <div>
            <label style={{ fontFamily: `'${fontB}', sans-serif`, fontSize: "0.72rem", color: "rgba(255,255,255,0.6)", display: "block", marginBottom: "6px" }}>
              What&apos;s your name?
            </label>
            <input
              type="text" readOnly value={guest.name}
              style={{ ...inputStyle, opacity: 0.7 }}
            />
          </div>

          {/* Confirm dropdown */}
          <div>
            <label style={{ fontFamily: `'${fontB}', sans-serif`, fontSize: "0.72rem", color: "rgba(255,255,255,0.6)", display: "block", marginBottom: "6px" }}>
              Confirm
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "HADIR" | "TIDAK_HADIR")}
              style={{ ...inputStyle, appearance: "none" as any }}
            >
              <option value="HADIR" style={{ background: primary }}>Yes! I will attend</option>
              <option value="TIDAK_HADIR" style={{ background: primary }}>Sorry! I won&apos;t be able to attend</option>
            </select>
          </div>

          {/* Guest count */}
          {status === "HADIR" && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} style={{ overflow: "hidden" }}>
              <label style={{ fontFamily: `'${fontB}', sans-serif`, fontSize: "0.72rem", color: "rgba(255,255,255,0.6)", display: "block", marginBottom: "6px" }}>
                Number of guests
              </label>
              <select
                value={pax}
                onChange={(e) => setPax(Number(e.target.value))}
                style={{ ...inputStyle, appearance: "none" as any }}
              >
                {Array.from({ length: guest.maxPax }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n} style={{ background: primary }}>{n}</option>
                ))}
              </select>
            </motion.div>
          )}

          {/* Message */}
          <div>
            <label style={{ fontFamily: `'${fontB}', sans-serif`, fontSize: "0.72rem", color: "rgba(255,255,255,0.6)", display: "block", marginBottom: "6px" }}>
              Send a message
            </label>
            <textarea
              value={msg} onChange={(e) => setMsg(e.target.value)} rows={4}
              placeholder="Write your wishes..."
              style={{ ...inputStyle, resize: "none", lineHeight: 1.65 }}
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={submit} disabled={saving}
            style={{
              width: "100%", padding: "12px",
              background: "rgba(255,255,255,0.95)", color: primary,
              border: "none", borderRadius: "8px",
              fontFamily: `'${fontB}', 'Jost', sans-serif`,
              fontSize: "0.8rem", fontWeight: 600, letterSpacing: "0.08em",
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.65 : 1,
            }}
          >
            {saving ? "Sending..." : "Send confirmation"}
          </motion.button>
        </div>
      )}
    </div>
  );
}

function RSVPPlaceholder({ fontH, fontB }: { fontH: string; fontB: string }) {
  return (
    <div style={{ textAlign: "center", padding: "2.5rem 1.5rem", background: "rgba(255,255,255,0.1)", borderRadius: "16px" }}>
      <LockKeyhole size={24} color="#fff" style={{ margin: "0 auto 12px", display: "block" }} />
      <p style={{ fontFamily: `'${fontH}', serif`, fontSize: "1.1rem", color: "#fff", marginBottom: "6px" }}>
        Confirm Attendance
      </p>
      <p style={{ fontFamily: `'${fontB}', sans-serif`, fontSize: "0.78rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.65 }}>
        RSVP tersedia melalui link undangan personal.
      </p>
    </div>
  );
}

// ─── Wishes Section ───────────────────────────────────────────────────────────

function WishesSection({
  clientId, initialWishes, guestName, guestId, primary, fontH, fontB,
}: {
  clientId: string; initialWishes: Props["client"]["wishes"];
  guestName?: string; guestId?: string;
  primary: string; fontH: string; fontB: string;
}) {
  const [wishes, setWishes] = useState(initialWishes);
  const [name, setName] = useState(guestName || "");
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const sentTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (sentTimer.current) clearTimeout(sentTimer.current); }, []);

  async function send() {
    if (!msg.trim()) return;
    setSending(true);
    const res = await fetch("/api/wishes", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, name: name || "Tamu", message: msg, guestId }),
    });
    if (res.ok) {
      const data = await res.json();
      setWishes((p) => [data, ...p]);
      setMsg(""); setSent(true);
      sentTimer.current = setTimeout(() => setSent(false), 3000);
    }
    setSending(false);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)",
    border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px",
    padding: "10px 14px", color: "#fff", fontSize: "0.82rem",
    fontFamily: `'${fontB}', 'Jost', sans-serif`, outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div>
      {/* Send wish form */}
      <div style={{ marginBottom: "2rem" }}>
        {!guestName && (
          <input
            type="text" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            style={{ ...inputStyle, marginBottom: "10px" }}
          />
        )}
        <textarea
          value={msg} onChange={(e) => setMsg(e.target.value)}
          rows={3} placeholder="Write your wishes and prayers..."
          style={{ ...inputStyle, resize: "none", lineHeight: 1.65, marginBottom: "10px" }}
        />
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={send} disabled={sending || !msg.trim()}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
            width: "100%", padding: "11px",
            background: "rgba(255,255,255,0.95)", color: primary,
            border: "none", borderRadius: "8px",
            fontFamily: `'${fontB}', 'Jost', sans-serif`,
            fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.06em",
            cursor: sending || !msg.trim() ? "not-allowed" : "pointer",
            opacity: sending || !msg.trim() ? 0.5 : 1,
          }}
        >
          <Send size={12} />
          {sent ? "Sent ✓" : sending ? "Sending..." : "Send Wishes"}
        </motion.button>
      </div>

      {/* Wishes list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxHeight: "400px", overflowY: "auto", paddingRight: "4px" }}>
        {wishes.length === 0 && (
          <p style={{
            textAlign: "center", padding: "2rem 0",
            fontFamily: `'${fontH}', Georgia, serif`, fontSize: "0.95rem",
            fontStyle: "italic", color: "rgba(255,255,255,0.4)",
          }}>
            Be the first to leave a wish...
          </p>
        )}
        {wishes.map((w) => (
          <div key={w.id} style={{ background: "rgba(255,255,255,0.1)", borderRadius: "12px", padding: "14px 16px" }}>
            <div style={{ display: "inline-flex", gap: "6px", alignItems: "center", marginBottom: "6px" }}>
              <p style={{ fontFamily: `'${fontH}', serif`, fontWeight: 600, color: "#fff", fontSize: "0.9rem" }}>
                {w.name}
              </p>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="rgba(255,255,255,0.5)">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
              </svg>
            </div>
            <p style={{
              fontFamily: `'${fontB}', 'Jost', sans-serif`,
              fontSize: "0.82rem", color: "rgba(255,255,255,0.7)", fontStyle: "italic", lineHeight: 1.65,
            }}>
              {w.message}
            </p>
            {w.reply && (
              <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid rgba(255,255,255,0.15)", paddingLeft: "10px", borderLeft: "2px solid rgba(255,255,255,0.3)" }}>
                <p style={{ fontFamily: `'${fontB}', sans-serif`, fontSize: "0.76rem", color: "rgba(255,255,255,0.5)", fontStyle: "italic" }}>
                  {w.reply}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── RSVP + Wishes Combined Section ───────────────────────────────────────────

function WillYouComeSection({
  clientId, guest, token, bgImage, primary, content, fontH, fontB,
  initialWishes, sectionKeys, requireRsvpForWish,
}: {
  clientId: string; guest: Guest | null; token: string | null;
  bgImage?: string; primary: string; content: string; fontH: string; fontB: string;
  initialWishes: Props["client"]["wishes"];
  sectionKeys: string[];
  requireRsvpForWish?: boolean;
}) {
  const showRSVP = sectionKeys.includes("RSVP");
  const showWishes = sectionKeys.includes("WISHES");
  if (!showRSVP && !showWishes) return null;

  return (
    <section
      id="hm-wish"
      style={{ position: "relative", zIndex: 1 }}
    >
      {/* Background */}
      {bgImage ? (
        <img src={bgImage} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }} />
      ) : (
        <div style={{ position: "absolute", inset: 0, background: primary }} />
      )}
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.72)" }} />

      <div style={{ position: "relative", zIndex: 1, padding: "5rem 1.5rem" }}>
        <div style={{ maxWidth: "480px", margin: "0 auto" }}>
          {showRSVP && (
            <FadeIn style={{ marginBottom: "3.5rem" }}>
              <h2 style={{
                fontFamily: `'${fontH}', 'Cormorant Garamond', Georgia, serif`,
                fontSize: "clamp(1.8rem, 6vw, 2.5rem)", fontWeight: 300,
                color: "#fff", textAlign: "center", marginBottom: "2rem",
              }}>
                Will you come
              </h2>
              {token && guest ? (
                <RSVPSection
                  clientId={clientId} guest={guest} token={token}
                  primary={primary} fontH={fontH} fontB={fontB}
                />
              ) : (
                <RSVPPlaceholder fontH={fontH} fontB={fontB} />
              )}
            </FadeIn>
          )}

          {showWishes && (
            <FadeIn delay={0.1}>
              <h2 style={{
                fontFamily: `'${fontH}', 'Cormorant Garamond', Georgia, serif`,
                fontSize: "clamp(1.5rem, 5vw, 2rem)", fontWeight: 300,
                color: "#fff", textAlign: "center", marginBottom: "1.5rem",
              }}>
                Wishes &amp; Prayers
              </h2>
              {!!guest && requireRsvpForWish && guest.rsvp?.status !== "HADIR" && guest.rsvp?.status !== "TIDAK_HADIR" ? (
                <WishesLockedPlaceholder primaryColor={primary} fontHeading={fontH} lang="id" />
              ) : (
                <WishesSection
                  clientId={clientId} initialWishes={initialWishes}
                  guestName={guest?.name} guestId={guest?.id}
                  primary={primary} fontH={fontH} fontB={fontB}
                />
              )}
            </FadeIn>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── Gift Section (Floating Button + Modal) ───────────────────────────────────

function GiftFloatingButton({
  gifts, primary, content, fontH, fontB,
}: {
  gifts: Props["client"]["gifts"]; primary: string; content: string; fontH: string; fontB: string;
}) {
  const active = gifts.filter((g) => g.isActive);
  const [open, setOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [qrisOpen, setQrisOpen] = useState<string | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (copyTimer.current) clearTimeout(copyTimer.current); }, []);

  if (!active.length) return null;

  async function copy(key: string, val: string) {
    await navigator.clipboard.writeText(val);
    setCopiedId(key);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopiedId(null), 2200);
  }

  const banks = active.filter((g) => g.bankName && !g.qrisImage);
  const ewallets = active.filter((g) => g.ewalletType && !g.qrisImage);
  const qrisList = active.filter((g) => g.qrisImage);

  return (
    <>
      {/* Floating button */}
      <motion.button
        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
        onClick={() => setOpen(true)}
        style={{
          position: "fixed", bottom: "5rem", right: "1rem", zIndex: 100,
          width: "52px", height: "52px", borderRadius: "50%",
          background: "linear-gradient(135deg, #f43f5e, #fb923c)",
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 20px rgba(244,63,94,0.4)",
        }}
      >
        <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}>
          <GiftIcon size={22} color="#fff" />
        </motion.div>
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 200,
              background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
              display: "flex", alignItems: "flex-end", justifyContent: "center",
            }}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%", maxWidth: "480px",
                background: content, borderRadius: "24px 24px 0 0",
                padding: "1.5rem 1.25rem 3rem", maxHeight: "80dvh",
                overflowY: "auto",
              }}
            >
              {/* Handle */}
              <div style={{ width: "36px", height: "4px", background: `${primary}30`, borderRadius: "99px", margin: "0 auto 1.25rem" }} />

              <h3 style={{
                fontFamily: `'${fontH}', 'Cormorant Garamond', Georgia, serif`,
                fontSize: "1.4rem", fontWeight: 400, color: primary,
                textAlign: "center", marginBottom: "0.25rem",
              }}>
                Digital Gift
              </h3>
              <p style={{
                fontFamily: `'${fontB}', 'Jost', sans-serif`,
                fontSize: "0.78rem", color: primary, opacity: 0.5,
                textAlign: "center", marginBottom: "1.5rem", fontStyle: "italic",
              }}>
                Your blessings are the greatest gift we could ask for.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {banks.map((gift) => {
                  const [from, to] = getBankGradient(gift.bankName || "");
                  const key = `bank-${gift.id}`;
                  return (
                    <div key={gift.id} style={{
                      borderRadius: "16px", overflow: "hidden",
                      background: `linear-gradient(135deg, ${from}, ${to})`,
                      padding: "1.1rem 1.25rem",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                        <span style={{ fontWeight: 700, color: "#fff", fontSize: "0.95rem" }}>{gift.bankName}</span>
                        <span style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.55rem", letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: "'Cinzel', serif" }}>Transfer</span>
                      </div>
                      <p style={{ fontFamily: "monospace", color: "#fff", fontSize: "0.9rem", letterSpacing: "0.18em", marginBottom: "12px" }}>
                        {(gift.accountNumber || "").replace(/(.{4})/g, "$1  ").trim()}
                      </p>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                        <div>
                          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.5rem", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "2px" }}>Account Name</p>
                          <p style={{ color: "#fff", fontSize: "0.78rem", fontWeight: 500, textTransform: "uppercase" }}>{gift.accountName}</p>
                        </div>
                        <button onClick={() => copy(key, gift.accountNumber || "")} style={{ display: "flex", alignItems: "center", gap: "4px", padding: "5px 10px", border: "1px solid rgba(255,255,255,0.28)", background: "rgba(255,255,255,0.12)", borderRadius: "6px", color: "#fff", fontSize: "0.6rem", cursor: "pointer" }}>
                          {copiedId === key ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
                        </button>
                      </div>
                    </div>
                  );
                })}

                {ewallets.map((gift) => {
                  const key = `ew-${gift.id}`;
                  return (
                    <div key={gift.id} style={{ background: "#fff", borderRadius: "14px", padding: "1rem", display: "flex", alignItems: "center", gap: "0.9rem", border: `1px solid ${primary}18` }}>
                      <div style={{ padding: "0.65rem", borderRadius: "10px", background: `${primary}10`, flexShrink: 0 }}><Wallet size={16} color={primary} /></div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontFamily: `'${fontB}', sans-serif`, fontWeight: 600, color: primary, fontSize: "0.88rem" }}>{gift.ewalletType}</p>
                        <p style={{ fontFamily: "monospace", fontSize: "0.78rem", color: primary, opacity: 0.5 }}>{gift.ewalletNumber}</p>
                      </div>
                      <button onClick={() => copy(key, gift.ewalletNumber || "")} style={{ background: "none", border: "none", cursor: "pointer", color: primary, opacity: 0.4, padding: "4px" }}>
                        {copiedId === key ? <Check size={14} color={primary} /> : <Copy size={14} />}
                      </button>
                    </div>
                  );
                })}

                {qrisList.map((gift) => (
                  <div key={gift.id} style={{ background: "#fff", borderRadius: "14px", overflow: "hidden", border: `1px solid ${primary}18` }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{ padding: "0.65rem", borderRadius: "10px", background: `${primary}10` }}><QrCode size={16} color={primary} /></div>
                        <div>
                          <p style={{ fontFamily: "'Cinzel', serif", fontSize: "0.5rem", color: primary, opacity: 0.38, letterSpacing: "0.12em", textTransform: "uppercase" }}>QRIS</p>
                          <p style={{ fontFamily: `'${fontB}', sans-serif`, fontWeight: 600, color: primary, fontSize: "0.85rem" }}>{gift.ewalletType || gift.bankName || "Scan QR"}</p>
                        </div>
                      </div>
                      <button onClick={() => setQrisOpen(qrisOpen === gift.id ? null : gift.id)} style={{ padding: "6px 14px", border: `1px solid ${primary}44`, borderRadius: "9999px", background: "transparent", color: primary, fontFamily: "'Cinzel', serif", fontSize: "0.54rem", letterSpacing: "0.1em", cursor: "pointer", textTransform: "uppercase" }}>
                        {qrisOpen === gift.id ? "Close" : "View QR"}
                      </button>
                    </div>
                    <AnimatePresence>
                      {qrisOpen === gift.id && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden", borderTop: `1px solid ${primary}12`, padding: "1rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
                          <img src={gift.qrisImage!} alt="QRIS" loading="lazy" style={{ maxWidth: "160px", width: "100%", borderRadius: "10px" }} />
                          <p style={{ marginTop: "6px", fontFamily: `'${fontB}', sans-serif`, fontSize: "0.65rem", color: primary, opacity: 0.38 }}>Scan to transfer</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
                {gifts.filter((g) => g.kind === "ADDRESS").map((g) => (
                  <GiftAddressCard key={g.id} receiverName={g.receiverName} receiverPhone={g.receiverPhone}
                    address={g.address} accent={primary} />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Thank You Section ────────────────────────────────────────────────────────

function ThankYouSection({
  coupleLabel, bgImage, primary, content, fontH, fontB,
}: {
  coupleLabel: string; bgImage?: string; primary: string; content: string; fontH: string; fontB: string;
}) {
  return (
    <section id="hm-thankyou" style={{ position: "relative", minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {bgImage ? (
        <img src={bgImage} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }} />
      ) : (
        <div style={{ position: "absolute", inset: 0, background: primary }} />
      )}
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.22)" }} />

      <div style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "5rem 2rem", maxWidth: "480px", margin: "0 auto" }}>
        <FadeIn>
          <h2 style={{
            fontFamily: `'${fontH}', 'Cormorant Garamond', Georgia, serif`,
            fontSize: "clamp(2.5rem, 9vw, 4rem)", fontWeight: 300,
            color: "#fff", marginBottom: "1rem",
          }}>
            Words of Thanks
          </h2>
        </FadeIn>
        <FadeIn delay={0.1}>
          <p style={{
            fontFamily: `'${fontB}', 'Jost', sans-serif`,
            fontSize: "0.88rem", lineHeight: 1.85, color: "rgba(255,255,255,0.8)",
          }}>
            {coupleLabel} sincerely thank our beloved family, relatives, and friends for your unwavering love, support, and blessings.
            Your presence and well wishes have made this special day even more meaningful to us.
          </p>
        </FadeIn>
        <FadeIn delay={0.2}>
          <p style={{
            fontFamily: "'Great Vibes', cursive",
            fontSize: "clamp(2.8rem, 10vw, 4.5rem)",
            color: "#fff", marginTop: "2rem",
            opacity: 0.9,
          }}>
            {coupleLabel}
          </p>
        </FadeIn>
      </div>
    </section>
  );
}

// ─── Main Template ─────────────────────────────────────────────────────────────

export function HanoiModernTemplate({ guest, client, token }: Props) {

  const profile = client.weddingProfile;
  const music = client.musics[0];
  const sectionKeys = client.sections.map((s) => s.sectionKey);
  const showMap = client.theme?.showMap !== false;

  const th = client.theme;
  useAutoScroll(th?.autoScroll ?? true, true);
  const primary = th?.primaryColor || DEF.primary;
  const base = th?.bgColor || DEF.base;
  const content = th?.secondaryColor || DEF.content;
  const fontH = th?.fontHeading || "Cormorant Garamond";
  const fontB = th?.fontBody || "Jost";
  const requireRsvpForWish = th?.requireRsvpForWish ?? false;

  const groomNick = profile?.groomNickname || profile?.groomName || "Groom";
  const brideNick = profile?.brideNickname || profile?.brideName || "Bride";
  const coupleLabel = `${groomNick} & ${brideNick}`;

  const heroUrl = client.galleries.find((g) => g.type === "HERO" || g.type === "COVER")?.url;
  const rsvpBgUrl = client.galleries.find((g) => g.type === "BACKGROUND")?.url
    || client.galleries.find((g) => g.type === "PREWEDDING")?.url;
  const thankYouBgUrl = client.galleries.find((g) => g.type === "COVER")?.url
    || heroUrl;

  const countdownTarget = useMemo(() =>
    client.events
      .filter((e) => e.date)
      .map((e) => new Date(e.date!))
      .filter((d) => d > new Date())
      .sort((a, b) => a.getTime() - b.getTime())[0] ?? null,
    [client.events]
  );

  const firstEventDate = useMemo(
    () => client.events[0]?.date ? new Date(client.events[0].date) : null,
    [client.events]
  );

  // Auto-scroll: plays through all sections automatically on load, like the Vietnamese reference.
  // User can interrupt by touching/scrolling; after reaching the bottom it stops.
  useEffect(() => {
    let raf: number;
    let active = true;

    const tick = () => {
      if (!active) return;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (window.scrollY >= maxScroll - 1) {
        active = false;
        return;
      }
      window.scrollBy(0, 2);
      raf = requestAnimationFrame(tick);
    };

    const stop = () => {
      if (!active) return;
      active = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchmove", stop);
      window.removeEventListener("keydown", stop);
    };

    window.addEventListener("wheel", stop, { passive: true });
    window.addEventListener("touchmove", stop, { passive: true });
    window.addEventListener("keydown", stop);

    const timer = setTimeout(() => {
      if (active) raf = requestAnimationFrame(tick);
    }, 1200);

    return () => {
      active = false;
      clearTimeout(timer);
      cancelAnimationFrame(raf);
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchmove", stop);
      window.removeEventListener("keydown", stop);
    };
  }, []);

  return (
    <>
      <style>{`
        body { background-color: ${base}; margin: 0; -webkit-font-smoothing: antialiased; }
      `}</style>
      <style>{GLOBAL_CSS}</style>

      {music && <MusicPlayer url={music.url} title={music.title} />}

      <div className="hm-root" style={{ background: base }}>
        {/* Hero / Cover (in-page, scrollable) */}
        <HanoiModernCover
          groomNick={groomNick}
          brideNick={brideNick}
          guestName={guest?.name}
          heroUrl={heroUrl}
          bgColor={base}
          primaryColor={primary}
          eventDate={firstEventDate}
          fontH={fontH}
        />

        {/* All sections visible on load */}
        <div id="hm-content">
          {/* About / Couple Section */}
          {sectionKeys.includes("COUPLE") && profile && (
            <AboutSection
              profile={profile} bgColor={base} primary={primary}
              fontH={fontH} fontB={fontB}
            />
          )}

            {/* Gallery */}
            {sectionKeys.includes("GALLERY") && (
              <GallerySection
                galleries={client.galleries} bgColor={base} primary={primary} fontH={fontH}
              />
            )}

            {/* Countdown + Events */}
            {sectionKeys.includes("EVENT") && (
              <CountdownEventsSection
                events={client.events}
                galleries={client.galleries}
                bgColor={base} primary={primary} content={content}
                fontH={fontH} fontB={fontB}
                countdownTarget={client.theme?.showCountdown ? countdownTarget : null}
                showMap={showMap}
              />
            )}

            {/* RSVP + Wishes combined (dark bg section) */}
            <WillYouComeSection
              clientId={client.id}
              guest={guest}
              token={token}
              bgImage={rsvpBgUrl}
              primary={primary}
              content={content}
              fontH={fontH}
              fontB={fontB}
              initialWishes={client.wishes}
              sectionKeys={sectionKeys}
              requireRsvpForWish={requireRsvpForWish}
            />

            {/* Gift floating button */}
            {sectionKeys.includes("GIFT") && (
              <GiftFloatingButton
                gifts={client.gifts}
                primary={primary} content={content}
                fontH={fontH} fontB={fontB}
              />
            )}

            {/* Thank You */}
            <ThankYouSection
              coupleLabel={coupleLabel}
              bgImage={thankYouBgUrl}
              primary={primary} content={content}
              fontH={fontH} fontB={fontB}
            />
        </div>
      </div>
    </>
  );
}

export default HanoiModernTemplate;

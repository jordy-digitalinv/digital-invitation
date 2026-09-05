"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useAutoScroll } from "@/hooks/useAutoScroll";
import { MapPin, Calendar, Clock, Copy, Check, ChevronDown } from "lucide-react";
import { MusicPlayer } from "../../sections/MusicPlayer";
import { GiftAddressCard } from "../../sections/GiftAddressCard";
import { GiftBankCard } from "../../sections/GiftBankCard";
import { BarcodeSection, getEventVenueName } from "../../sections/BarcodeSection";
import { AttentionSection } from "../../sections/AttentionSection";
import { formatDate } from "@/lib/utils";
import { getEventsForGuestCategory, EVENT_TYPE_LABELS } from "@/lib/categories";
import { findMenuEvent } from "@/lib/menu";
import type { Rsvp } from "@/types/prisma.types";

interface Guest {
  id: string;
  name: string;
  maxPax: number;
  rsvp: Rsvp | null;
  invitationCategory?: string;
  barcodeChurch?: string | null;
  barcodeReception?: string | null;
}

interface TemplateProps {
  guest: Guest | null;
  client: {
    id: string;
    name: string;
    slug: string;
    clientType: string;
    weddingProfile: {
      groomName: string; brideName: string; groomNickname: string; brideNickname: string;
      groomParents: string; brideParents: string;
      openingQuote: string | null; openingQuoteBy: string | null;
      heroImage: string | null; groomPhoto: string | null; bridePhoto: string | null;
      showGroomPhoto: boolean; showBridePhoto: boolean;
      attentionTitle: string | null; attentionContent: string | null;
    } | null;
    events: {
      id: string; type: string; label: string; date: Date | null;
      timeStart: string; timeEnd: string; venueName: string; venueAddress: string; mapsUrl: string; isAyce: boolean;
      menuItems: { id: string; name: string }[];
    }[];
    musics: { url: string; title: string }[];
    sections: { sectionKey: string; sortOrder: number }[];
    galleries: { id: string; url: string; type: string; sortOrder: number }[];
    gifts: {
      id: string; kind: string; bankName: string | null; accountNumber: string | null; accountName: string | null;
      ewalletType: string | null; ewalletNumber: string | null; qrisImage: string | null; isActive: boolean;
      receiverName: string | null; receiverPhone: string | null; address: string | null;
    }[];
    wishes: { id: string; name: string; message: string; reply: string | null; createdAt: Date }[];
    theme: {
      primaryColor: string; secondaryColor: string; bgColor: string; textColor: string;
      fontHeading: string; fontBody: string;
      showCountdown?: boolean | null; showMap?: boolean | null; autoScroll?: boolean | null;
      barcodeVisibility?: string | null;
    } | null;
  };
  token: string | null;
}

function useCountdown(target: Date | null) {
  const targetMs = target?.getTime() ?? null;
  const [t, setT] = useState<{ d: number; h: number; m: number; s: number } | null>(null);
  useEffect(() => {
    if (targetMs === null) return;
    function calc() {
      const diff = targetMs! - Date.now();
      if (diff <= 0) { setT(null); return; }
      setT({
        d: Math.floor(diff / 86400000), h: Math.floor((diff / 3600000) % 24),
        m: Math.floor((diff / 60000) % 60), s: Math.floor((diff / 1000) % 60),
      });
    }
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [targetMs]);
  return t;
}

const DEF = {
  gold: "#b8860b",
  ivory: "#fffdf7",
  champagne: "#f5f0e8",
  text: "#3d3d3d",
  muted: "#8a8377",
};

export default function ClassicElegantTemplate({ guest, client, token }: TemplateProps) {
  const profile = client.weddingProfile;
  const theme = client.theme;

  const gold = theme?.primaryColor || DEF.gold;
  const bg = theme?.bgColor || DEF.ivory;
  const surface = theme?.secondaryColor || DEF.champagne;
  const text = theme?.textColor || DEF.text;
  const fontH = theme?.fontHeading || "Playfair Display";
  const fontB = theme?.fontBody || "Lato";

  const music = client.musics[0];
  const heroImage = profile?.heroImage || client.galleries.find((g) => g.type === "HERO")?.url || null;
  const firstDate = client.events.find((e) => e.date)?.date ?? null;
  // Countdown selalu mengarah ke acara TERDEKAT yang belum lewat.
  // Kalau semua acara sudah lewat, countdown disembunyikan.
  const countdownTarget = useMemo(() => {
    const upcoming = client.events
      .filter((e) => e.date && new Date(e.date).getTime() > Date.now())
      .sort((a, b) => new Date(a.date as Date).getTime() - new Date(b.date as Date).getTime())[0];
    return upcoming ? new Date(upcoming.date as Date) : null;
  }, [client.events]);
  const countdown = useCountdown(theme?.showCountdown ? countdownTarget : null);

  const [open, setOpen] = useState(false);
  useAutoScroll(theme?.autoScroll ?? true, open);
  const playRef = useRef<(() => void) | null>(null);
  const [rsvpStatus, setRsvpStatus] = useState<string | null>(guest?.rsvp?.status ?? null);
  const barcodeVisibility = theme?.barcodeVisibility ?? "AFTER_RSVP";

  const sectionKeys = client.sections.filter((s) => s.sectionKey).map((s) => s.sectionKey);
  const visibleEvents = useMemo(
    () => getEventsForGuestCategory(client.events, guest?.invitationCategory),
    [client.events, guest?.invitationCategory]
  );

  const groomNick = profile?.groomNickname || profile?.groomName || "";
  const brideNick = profile?.brideNickname || profile?.brideName || "";
  const invLabel =
    client.clientType === "ULANG_TAHUN" ? "Celebration Of"
    : client.clientType === "KANTOR" ? "Gathering"
    : client.clientType === "SANGJIT" ? "Sangjit Ceremony Of"
    : client.clientType === "LAMARAN" ? "Lamaran"
    : "The Wedding Of";

  async function handleOpen() {
    setOpen(true);
    playRef.current?.();
  }

  return (
    <div style={{ background: bg, color: text, fontFamily: `'${fontB}', sans-serif`, minHeight: "100dvh" }}>
      <style>{`
        .ce-wrap { animation: none; }
        ::selection { background: ${gold}33; }
        body { overscroll-behavior-y: none; }
      `}</style>

      {music && (
        <MusicPlayer url={music.url} title={music.title} registerPlay={(fn) => { playRef.current = fn; }} />
      )}

      {!open && (
        <Cover
          heroImage={heroImage}
          label={invLabel}
          couple={`${groomNick} & ${brideNick}`}
          guestName={guest?.name ?? null}
          gold={gold} surface={surface} text={text} fontH={fontH} fontB={fontB}
          onOpen={handleOpen}
        />
      )}

      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
          {/* HERO */}
          <section className="relative flex flex-col items-center justify-center text-center"
            style={{ minHeight: "88dvh", padding: "4rem 1.5rem", background: surface }}>
            {heroImage && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={heroImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${surface}cc 0%, ${surface}88 45%, ${bg}ee 100%)` }} />
              </>
            )}
            <div className="relative z-10">
              <p style={{ fontFamily: `'${fontH}', serif`, letterSpacing: "0.35em", fontSize: "0.65rem", textTransform: "uppercase", color: gold }}>
                {invLabel}
              </p>
              <h1 className="mt-6 leading-tight"
                style={{ fontFamily: `'${fontH}', serif`, fontWeight: 400, fontSize: "clamp(2.2rem, 9vw, 3.6rem)", color: text }}>
                {groomNick}<span style={{ color: gold, margin: "0 0.6rem" }}>&</span>{brideNick}
              </h1>
              {firstDate && (
                <p className="mt-5 text-sm" style={{ letterSpacing: "0.25em", color: DEF.muted }}>
                  {formatDate(firstDate)}
                </p>
              )}
              {guest?.name && (
                <div className="mt-10 inline-block px-6 py-3 rounded-full border"
                  style={{ borderColor: `${gold}55`, background: `${bg}cc` }}>
                  <p className="text-[11px]" style={{ letterSpacing: "0.15em", color: DEF.muted }}>KEPADA YTH.</p>
                  <p className="text-sm mt-1 font-medium">{guest.name}</p>
                </div>
              )}
              <div className="mt-10 flex justify-center">
                <ChevronDown size={22} color={gold} className="animate-bounce" />
              </div>
            </div>
          </section>

          {/* COUNTDOWN */}
          {countdown && (
            <section className="text-center" style={{ padding: "3.5rem 1.5rem", background: bg }}>
              <SectionTitle eyebrow="Save The Date" title="Menuju Hari Bahagia" gold={gold} fontH={fontH} />
              <div className="flex justify-center gap-5">
                {[
                  { v: countdown.d, l: "Hari" }, { v: countdown.h, l: "Jam" },
                  { v: countdown.m, l: "Menit" }, { v: countdown.s, l: "Detik" },
                ].map(({ v, l }) => (
                  <div key={l} className="w-16 rounded-xl py-3 border"
                    style={{ borderColor: `${gold}33`, background: surface }}>
                    <div style={{ fontFamily: `'${fontH}', serif`, fontSize: "1.7rem", color: gold }}>{String(v).padStart(2, "0")}</div>
                    <div className="text-[10px] uppercase tracking-widest" style={{ color: DEF.muted }}>{l}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* COUPLE */}
          {(sectionKeys.length === 0 || sectionKeys.includes("COUPLE")) && profile && (
            <section style={{ padding: "4rem 1.5rem", background: surface }}>
              <SectionTitle eyebrow="Mempelai" title="Dua Hati, Satu Tujuan" gold={gold} fontH={fontH} />
              {profile.openingQuote && (
                <p className="max-w-md mx-auto text-center italic text-sm leading-relaxed mb-10" style={{ color: DEF.muted }}>
                  “{profile.openingQuote}”
                  {profile.openingQuoteBy && <span className="block not-italic mt-2 text-xs">— {profile.openingQuoteBy}</span>}
                </p>
              )}
              <div className="max-w-sm mx-auto space-y-12">
                {([
                  { name: profile.groomName, nick: profile.groomNickname, parents: profile.groomParents, photo: profile.showGroomPhoto ? profile.groomPhoto : null },
                  { name: profile.brideName, nick: profile.brideNickname, parents: profile.brideParents, photo: profile.showBridePhoto ? profile.bridePhoto : null },
                ]).map((p, i) => p.name && (
                  <motion.div key={i} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.15 }} transition={{ duration: 0.7 }}
                    className="text-center">
                    {p.photo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.photo} alt={p.name}
                        className="w-44 h-44 object-cover rounded-full mx-auto mb-5 border-4"
                        style={{ borderColor: `${gold}44` }} />
                    )}
                    <h3 style={{ fontFamily: `'${fontH}', serif`, fontSize: "1.5rem", color: text }}>{p.nick || p.name}</h3>
                    <p className="text-xs mt-1" style={{ color: DEF.muted }}>{p.name}</p>
                    {p.parents && <p className="text-xs mt-3 leading-relaxed" style={{ color: DEF.muted }}>Putra/Putri dari<br />{p.parents}</p>}
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* ATTENTION */}
          {profile?.attentionContent && (
            <AttentionSection
              title={profile.attentionTitle} content={profile.attentionContent}
              titleEn={null} contentEn={null} lang="ID"
              primaryColor={gold} bgColor={bg} textColor={text} fontBody={fontB}
            />
          )}

          {/* EVENTS */}
          {(sectionKeys.length === 0 || sectionKeys.includes("EVENT")) && visibleEvents.length > 0 && (
            <section style={{ padding: "4rem 1.5rem", background: bg }}>
              <SectionTitle eyebrow="Jadwal" title="Detail Acara" gold={gold} fontH={fontH} />
              <div className="max-w-sm mx-auto space-y-5">
                {visibleEvents.map((ev) => (
                  <motion.div key={ev.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.15 }} transition={{ duration: 0.6 }}
                    className="rounded-2xl overflow-hidden border" style={{ borderColor: `${gold}30`, background: surface }}>
                    <div className="px-5 py-3 text-center" style={{ background: gold }}>
                      <p className="text-xs font-semibold tracking-widest uppercase text-white">
                        {ev.label || EVENT_TYPE_LABELS[ev.type] || ev.type}
                      </p>
                    </div>
                    <div className="px-5 py-5 space-y-2.5 text-sm">
                      {ev.date && (
                        <p className="flex items-center gap-2"><Calendar size={14} style={{ color: gold }} />{formatDate(ev.date)}</p>
                      )}
                      {(ev.timeStart || ev.timeEnd) && (
                        <p className="flex items-center gap-2"><Clock size={14} style={{ color: gold }} />{ev.timeStart}{ev.timeEnd ? ` - ${ev.timeEnd}` : ""} WIB</p>
                      )}
                      <p className="flex items-start gap-2"><MapPin size={14} style={{ color: gold, marginTop: 2, flexShrink: 0 }} />
                        <span>{ev.venueName}<span className="block text-xs" style={{ color: DEF.muted }}>{ev.venueAddress}</span></span>
                      </p>
                      {theme?.showMap !== false && ev.mapsUrl && (
                        <a href={ev.mapsUrl} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 mt-2 text-xs px-4 py-2 rounded-full text-white"
                          style={{ background: gold }}>
                          <MapPin size={12} /> Lihat Lokasi
                        </a>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* GALLERY */}
          {(sectionKeys.length === 0 || sectionKeys.includes("GALLERY")) && client.galleries.filter((g) => g.type === "GALLERY").length > 0 && (
            <section style={{ padding: "4rem 1.5rem", background: surface }}>
              <SectionTitle eyebrow="Momen" title="Galeri Kenangan" gold={gold} fontH={fontH} />
              <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                {client.galleries.filter((g) => g.type === "GALLERY").map((g, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={g.id} src={g.url} alt={`gallery-${i}`}
                    loading="lazy"
                    className={`w-full rounded-xl object-cover ${i % 3 === 0 ? "row-span-2 aspect-[3/4]" : "aspect-square"}`} />
                ))}
              </div>
            </section>
          )}

          {/* RSVP */}
          {(sectionKeys.length === 0 || sectionKeys.includes("RSVP")) && (
            <section style={{ padding: "4rem 1.5rem", background: bg }}>
              <SectionTitle eyebrow="Konfirmasi" title="RSVP" gold={gold} fontH={fontH} />
              {token && guest ? (
                <RsvpForm clientId={client.id} guest={guest} token={token}
                  gold={gold} surface={surface} text={text} fontB={fontB}
                  menuItems={findMenuEvent(client.events, guest.invitationCategory ?? "")?.menuItems ?? []}
                  onConfirmed={setRsvpStatus} />
              ) : (
                <p className="text-center text-sm" style={{ color: DEF.muted }}>
                  RSVP tersedia melalui link undangan personal.
                </p>
              )}
            </section>
          )}

          {/* BARCODE */}
          <BarcodeSection
            barcodeChurch={guest?.barcodeChurch}
            barcodeReception={guest?.barcodeReception ?? null}
            barcodeVisibility={barcodeVisibility}
            rsvpStatus={rsvpStatus}
            churchLabel={EVENT_TYPE_LABELS[visibleEvents[0]?.type ?? ""] ?? "Upacara"}
            receptionLabel={EVENT_TYPE_LABELS["RESEPSI"]}
            churchVenueName={getEventVenueName(visibleEvents[0], "id", "Venue")}
            receptionVenueName={getEventVenueName(visibleEvents.find((e) => e.type === "RESEPSI"), "id", "Resepsi")}
            primaryColor={gold} bgColor={surface} fontHeading={fontH} lang="id"
          />

          {/* WISHES */}
          {(sectionKeys.length === 0 || sectionKeys.includes("WISHES")) && (
            <WishesSection
              clientId={client.id} initialWishes={client.wishes}
              guestName={guest?.name ?? null} guestId={guest?.id ?? null}
              gold={gold} surface={surface} bg={bg} text={text} fontH={fontH} fontB={fontB}
            />
          )}

          {/* GIFT */}
          {(sectionKeys.length === 0 || sectionKeys.includes("GIFT")) && client.gifts.length > 0 && (
            <GiftSection gifts={client.gifts} gold={gold} surface={surface} bg={bg} fontH={fontH} />
          )}

          {/* CLOSING */}
          <section className="text-center" style={{ padding: "5rem 1.5rem", background: surface }}>
            <p className="text-xs tracking-[0.3em] uppercase" style={{ color: DEF.muted }}>With Love</p>
            <h2 className="mt-4" style={{ fontFamily: `'${fontH}', serif`, fontSize: "1.8rem", color: gold }}>
              {groomNick} & {brideNick}
            </h2>
            <p className="mt-6 text-xs max-w-xs mx-auto" style={{ color: DEF.muted }}>
              Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir.
            </p>
            <p className="mt-8 text-[10px]" style={{ color: `${DEF.muted}88` }}>Made with love · Digital Invitation</p>
          </section>
        </motion.div>
      )}
    </div>
  );
}

function SectionTitle({ eyebrow, title, gold, fontH }: { eyebrow: string; title: string; gold: string; fontH: string }) {
  return (
    <div className="text-center mb-10">
      <p className="text-[10px] uppercase tracking-[0.35em]" style={{ color: gold }}>{eyebrow}</p>
      <h2 className="mt-3" style={{ fontFamily: `'${fontH}', serif`, fontSize: "1.7rem", fontWeight: 400 }}>{title}</h2>
      <div className="mx-auto mt-4 w-16 h-px" style={{ background: `${gold}66` }} />
    </div>
  );
}

function Cover({
  heroImage, label, couple, guestName, gold, surface, text, fontH, fontB, onOpen,
}: {
  heroImage: string | null; label: string; couple: string; guestName: string | null;
  gold: string; surface: string; text: string; fontH: string; fontB: string; onOpen: () => void;
}) {
  return (
    <motion.div className="fixed inset-0 z-50 flex flex-col items-center justify-center text-center px-8"
      initial={{ opacity: 1 }} animate={{ opacity: 1 }}
      exit={{ opacity: 0 }} style={{ background: surface }}>
      {heroImage && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={heroImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: `${surface}e6` }} />
        </>
      )}
      <div className="relative z-10">
        <p style={{ fontFamily: `'${fontH}', serif`, letterSpacing: "0.35em", fontSize: "0.6rem", textTransform: "uppercase", color: gold }}>
          {label}
        </p>
        <h1 className="mt-5" style={{ fontFamily: `'${fontH}', serif`, fontSize: "clamp(2rem, 8vw, 3rem)", color: text }}>
          {couple}
        </h1>
        {guestName && (
          <div className="mt-10">
            <p className="text-[11px] tracking-[0.2em]" style={{ color: DEF.muted }}>KEPADA YTH.</p>
            <p className="mt-1.5 text-base font-medium">{guestName}</p>
          </div>
        )}
        <button onClick={onOpen}
          className="mt-10 inline-flex items-center gap-2 px-8 py-3 rounded-full text-white text-sm tracking-wider"
          style={{ background: gold, fontFamily: `'${fontB}', sans-serif` }}>
          Buka Undangan
        </button>
      </div>
    </motion.div>
  );
}

function RsvpForm({
  clientId, guest, token, gold, surface, text, fontB, menuItems, onConfirmed,
}: {
  clientId: string; guest: Guest; token: string; gold: string; surface: string; text: string; fontB: string;
  menuItems: { id: string; name: string }[]; onConfirmed: (s: string) => void;
}) {
  const [status, setStatus] = useState<"HADIR" | "TIDAK_HADIR">("HADIR");
  const [pax, setPax] = useState(1);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(!!guest.rsvp);
  const [menuChoices, setMenuChoices] = useState<string[]>([]);

  async function submit() {
    setSending(true);
    await fetch("/api/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token, clientId, guestId: guest.id,
        name: guest.name, paxCount: status === "HADIR" ? pax : 0,
        status, message: message || undefined,
        menuChoices: menuItems.length > 0 && status === "HADIR" ? menuChoices.slice(0, pax) : undefined,
      }),
    });
    setDone(true);
    onConfirmed(status);
    setSending(false);
  }

  if (done) {
    return (
      <div className="text-center rounded-2xl px-6 py-10 max-w-sm mx-auto border" style={{ background: surface, borderColor: `${gold}33` }}>
        <Check size={32} className="mx-auto" style={{ color: gold }} />
        <p className="mt-4 text-sm font-medium">Terima kasih!</p>
        <p className="text-xs mt-1" style={{ color: DEF.muted }}>Konfirmasi kehadiran telah diterima.</p>
      </div>
    );
  }

  const inputCls = "w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2";
  const inputStyle = { borderColor: `${gold}40`, background: "#fff", fontFamily: `'${fontB}', sans-serif` };

  return (
    <div className="max-w-sm mx-auto space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {(["HADIR", "TIDAK_HADIR"] as const).map((s) => (
          <button key={s} onClick={() => setStatus(s)}
            className="py-3 rounded-xl text-sm font-medium border-2 transition-colors"
            style={status === s
              ? { borderColor: gold, background: gold, color: "#fff" }
              : { borderColor: `${gold}33`, background: surface, color: text }}>
            {s === "HADIR" ? "Hadir" : "Tidak Hadir"}
          </button>
        ))}
      </div>

      {status === "HADIR" && (
        <select value={pax} onChange={(e) => setPax(Number(e.target.value))} className={inputCls} style={inputStyle}>
          {Array.from({ length: guest.maxPax }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>{n} orang</option>
          ))}
        </select>
      )}

      {menuItems.length > 0 && status === "HADIR" && (
        <div className="space-y-2">
          {[...Array(pax)].map((_, i) => (
            <select key={i} value={menuChoices[i] ?? ""} onChange={(e) => {
              const next = [...menuChoices]; next[i] = e.target.value; setMenuChoices(next);
            }} className={inputCls} style={inputStyle}>
              <option value="">Pilih menu untuk tamu {i + 1}</option>
              {menuItems.map((item) => (
                <option key={item.id} value={item.name}>{item.name}</option>
              ))}
            </select>
          ))}
        </div>
      )}

      <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3}
        placeholder="Pesan atau doa (opsional)" className={inputCls} style={inputStyle} />

      <button onClick={submit} disabled={sending}
        className="w-full py-3 rounded-xl text-white text-sm font-medium disabled:opacity-60"
        style={{ background: gold }}>
        {sending ? "Mengirim..." : "Konfirmasi Kehadiran"}
      </button>
    </div>
  );
}

function WishesSection({
  clientId, initialWishes, guestName, guestId, gold, surface, bg, fontH, fontB,
}: {
  clientId: string; initialWishes: { id: string; name: string; message: string; reply: string | null; createdAt: Date }[];
  guestName: string | null; guestId: string | null;
  gold: string; surface: string; bg: string; text: string; fontH: string; fontB: string;
}) {
  const [wishes, setWishes] = useState(initialWishes);
  const [name, setName] = useState(guestName ?? "");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit() {
    if (!name.trim() || !message.trim()) return;
    setSending(true);
    const res = await fetch("/api/wishes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, guestId, name, message }),
    });
    if (res.ok) {
      const wish = await res.json();
      setWishes((prev) => [wish, ...prev]);
      setMessage("");
      setSent(true);
      setTimeout(() => setSent(false), 2000);
    }
    setSending(false);
  }

  const inputStyle = { borderColor: `${gold}40`, background: "#fff", fontFamily: `'${fontB}', sans-serif` };

  return (
    <section style={{ padding: "4rem 1.5rem", background: surface }}>
      <SectionTitle eyebrow="Pesan" title="Ucapan & Doa" gold={gold} fontH={fontH} />
      <div className="max-w-sm mx-auto">
        <div className="space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} readOnly={!!guestName} placeholder="Nama Anda"
            className="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2" style={inputStyle} />
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3}
            placeholder="Tulis doa dan ucapan terbaik..."
            className="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2" style={inputStyle} />
          <button onClick={submit} disabled={sending}
            className="w-full py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-60" style={{ background: gold }}>
            {sent ? "Terkirim ✓" : sending ? "Mengirim..." : "Kirim Ucapan"}
          </button>
        </div>

        <div className="mt-8 space-y-4 max-h-96 overflow-y-auto pr-1">
          {wishes.length === 0 && (
            <p className="text-center text-xs" style={{ color: DEF.muted }}>Jadilah yang pertama memberikan ucapan...</p>
          )}
          {wishes.map((w) => (
            <div key={w.id} className="rounded-xl px-4 py-3 border" style={{ borderColor: `${gold}26`, background: bg }}>
              <p className="text-xs font-semibold" style={{ color: gold }}>{w.name}</p>
              <p className="text-sm mt-1 leading-relaxed">{w.message}</p>
              {w.reply && (
                <div className="mt-2 pl-3 border-l-2 text-xs leading-relaxed" style={{ borderColor: gold, color: DEF.muted }}>
                  <span className="font-medium" style={{ color: gold }}>Balasan: </span>{w.reply}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function GiftSection({
  gifts, gold, surface, bg, fontH,
}: {
  gifts: TemplateProps["client"]["gifts"]; gold: string; surface: string; bg: string; fontH: string;
}) {
  const [copied, setCopied] = useState<string | null>(null);
  const [showQris, setShowQris] = useState<string | null>(null);

  function copy(value: string, key: string) {
    navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <section style={{ padding: "4rem 1.5rem", background: surface }}>
      <SectionTitle eyebrow="Hadiah" title="Amplop Digital" gold={gold} fontH={fontH} />
      <p className="text-center text-xs max-w-xs mx-auto -mt-4 mb-8" style={{ color: DEF.muted }}>
        Doa restu Anda adalah hadiah terbaik yang kami harapkan.
      </p>
      <div className="max-w-sm mx-auto space-y-4">
        {gifts.filter((g) => g.kind !== "ADDRESS").sort((a, b) => (a.kind === "BANK" ? 0 : a.kind === "EWALLET" ? 1 : 2) - (b.kind === "BANK" ? 0 : b.kind === "EWALLET" ? 1 : 2)).map((g) => (
          <GiftBankCard key={g.id} kind={g.kind} bankName={g.bankName} accountNumber={g.accountNumber}
            accountName={g.accountName} ewalletType={g.ewalletType} ewalletNumber={g.ewalletNumber}
            qrisImage={g.qrisImage} accent={gold} />
        ))}
        {gifts.filter((g) => g.kind === "ADDRESS").map((g) => (
          <GiftAddressCard key={g.id} receiverName={g.receiverName} receiverPhone={g.receiverPhone}
            address={g.address} accent={gold} />
        ))}
      </div>
    </section>
  );
}

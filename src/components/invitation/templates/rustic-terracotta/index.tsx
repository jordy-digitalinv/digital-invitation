"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Calendar, Clock, Copy, Check, Wheat } from "lucide-react";
import { MusicPlayer } from "../../sections/MusicPlayer";
import { GiftAddressCard } from "../../sections/GiftAddressCard";
import { GiftBankCard } from "../../sections/GiftBankCard";
import { BarcodeSection, getEventVenueName } from "../../sections/BarcodeSection";
import { AttentionSection } from "../../sections/AttentionSection";
import { formatDate } from "@/lib/utils";
import { getEventsForGuestCategory, EVENT_TYPE_LABELS } from "@/lib/categories";
import { useAutoScroll } from "@/hooks/useAutoScroll";
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
      timeStart: string; timeEnd: string; venueName: string; venueAddress: string; mapsUrl: string;
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

const DEF = {
  terra: "#b5674d",
  cream: "#faf6ef",
  paper: "#fffdf8",
  text: "#4a3c33",
  muted: "#a08e80",
};

export default function RusticTerracottaTemplate({ guest, client, token }: TemplateProps) {
  const profile = client.weddingProfile;
  const theme = client.theme;

  const terra = theme?.primaryColor || DEF.terra;
  const bg = theme?.bgColor || DEF.cream;
  const surface = theme?.secondaryColor || "#f0e6d6";
  const text = theme?.textColor || DEF.text;
  const fontH = theme?.fontHeading === "IBM Plex Sans" ? "Libre Baskerville" : theme?.fontHeading || "Libre Baskerville";
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

  const [open, setOpen] = useState(false);
  useAutoScroll(theme?.autoScroll ?? true, open);
  const playRef = useRef<(() => void) | null>(null);
  const [rsvpStatus, setRsvpStatus] = useState<string | null>(guest?.rsvp?.status ?? null);
  const barcodeVisibility = theme?.barcodeVisibility ?? "AFTER_RSVP";

  const sectionKeys = client.sections.map((s) => s.sectionKey);
  const has = (k: string) => sectionKeys.length === 0 || sectionKeys.includes(k);
  const visibleEvents = useMemo(
    () => getEventsForGuestCategory(client.events, guest?.invitationCategory),
    [client.events, guest?.invitationCategory]
  );

  const groomNick = profile?.groomNickname || profile?.groomName || "";
  const brideNick = profile?.brideNickname || profile?.brideName || "";
  const invLabel =
    client.clientType === "ULANG_TAHUN" ? "Harvest Celebration"
    : client.clientType === "KANTOR" ? "Company Gathering"
    : client.clientType === "SANGJIT" ? "Sangjit Ceremony"
    : client.clientType === "LAMARAN" ? "Engagement"
    : "The Wedding Of";

  function handleOpen() {
    setOpen(true);
    playRef.current?.();
  }

  return (
    <div style={{ background: bg, color: text, fontFamily: `'${fontB}', sans-serif`, minHeight: "100dvh" }}>
      <style>{`
        .rt-card { background:${DEF.paper}; border-radius:14px; box-shadow:0 10px 30px rgba(74,60,51,.08), inset 0 0 0 1px ${terra}22; }
        .rt-tape::before { content:""; position:absolute; top:-9px; left:50%; transform:translateX(-50%) rotate(-2deg); width:76px; height:20px; background:${surface}; opacity:.9; border-left:1px dashed ${terra}44; border-right:1px dashed ${terra}44; }
      `}</style>

      {music && (
        <MusicPlayer url={music.url} title={music.title} registerPlay={(fn) => { playRef.current = fn; }} />
      )}

      {!open && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center text-center px-8" style={{ background: surface }}>
          <Wheat size={26} style={{ color: terra }} className="mb-5" />
          <p className="text-[11px] uppercase" style={{ letterSpacing: "0.3em", color: DEF.muted }}>{invLabel}</p>
          <h1 className="mt-4 leading-snug" style={{ fontFamily: `'${fontH}', serif`, fontSize: "clamp(2rem,8.5vw,3.1rem)" }}>
            {groomNick}<br />&amp;<br />{brideNick}
          </h1>
          {guest?.name && <p className="mt-7 text-sm">Dear <span className="font-semibold">{guest.name}</span></p>}
          <button onClick={handleOpen}
            className="mt-9 px-9 py-3 rounded-full text-white text-sm tracking-wide shadow-md"
            style={{ background: terra }}>
            Buka Undangan
          </button>
        </div>
      )}

      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
          {/* HERO */}
          <section className="relative flex flex-col items-center justify-center text-center" style={{ minHeight: "85dvh", padding: "3rem 1.75rem" }}>
            {heroImage && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={heroImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: `${bg}cc` }} />
              </>
            )}
            <div className="relative z-10 rt-card rt-tape px-8 py-10 max-w-xs relative">
              <Wheat size={18} style={{ color: terra, margin: "0 auto .9rem" }} />
              <p className="text-[10px] uppercase" style={{ letterSpacing: "0.28em", color: DEF.muted }}>{invLabel}</p>
              <h1 className="mt-4 leading-snug" style={{ fontFamily: `'${fontH}', serif`, fontSize: "clamp(1.9rem,8vw,2.7rem)" }}>
                {groomNick} &amp; {brideNick}
              </h1>
              {firstDate && <p className="mt-3 text-xs" style={{ color: DEF.muted }}>{formatDate(firstDate)}</p>}
              {guest?.name && (
                <div className="mt-6 pt-4 border-t border-dashed" style={{ borderColor: `${terra}55` }}>
                  <p className="text-[10px] uppercase tracking-widest" style={{ color: DEF.muted }}>Dear</p>
                  <p className="mt-1 font-semibold">{guest.name}</p>
                </div>
              )}
            </div>
          </section>

          {/* COUNTDOWN */}
          {(theme?.showCountdown ?? true) && countdownTarget && (
            <section className="py-12 px-6">
              <div className="max-w-md mx-auto rt-card py-8 text-center px-5">
                <HeadInline terra={terra} fontH={fontH} label="Save The Date">Menuju Hari Bahagia</HeadInline>
                <CountdownInline target={countdownTarget} terra={terra} />
              </div>
            </section>
          )}

          {/* COUPLE */}
          {has("COUPLE") && profile && (
            <section className="py-14 px-6" style={{ background: surface }}>
              <Head eyebrow="Mempelai" terra={terra} fontH={fontH}>Kedua Mempelai</Head>
              <div className="max-w-sm mx-auto space-y-6">
                {([
                  { name: profile.groomName, nick: profile.groomNickname, parents: profile.groomParents, photo: profile.showGroomPhoto ? profile.groomPhoto : null },
                  { name: profile.brideName, nick: profile.brideNickname, parents: profile.brideParents, photo: profile.showBridePhoto ? profile.bridePhoto : null },
                ]).map((p, i) => p.name && (
                  <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.15 }} transition={{ duration: 0.6 }}
                    className="rt-card rt-tape relative px-6 py-7 flex gap-5 items-center">
                    {p.photo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.photo} alt={p.name} className="w-24 h-24 rounded-full object-cover shrink-0"
                        style={{ border: `3px solid ${surface}`, boxShadow: `inset 0 0 0 2px ${terra}66` }} />
                    )}
                    <div>
                      <h3 className="text-lg" style={{ fontFamily: `'${fontH}', serif` }}>{p.nick || p.name}</h3>
                      <p className="text-xs mt-0.5" style={{ color: DEF.muted }}>{p.name}</p>
                      {p.parents && <p className="text-[11px] mt-2 leading-relaxed" style={{ color: DEF.muted }}>{p.parents}</p>}
                    </div>
                  </motion.div>
                ))}
              </div>
              {profile.openingQuote && (
                <p className="max-w-sm mx-auto mt-10 text-center italic text-sm leading-relaxed" style={{ color: DEF.muted }}>
                  “{profile.openingQuote}”
                  {profile.openingQuoteBy && <span className="block not-italic mt-2 text-xs">— {profile.openingQuoteBy}</span>}
                </p>
              )}
            </section>
          )}

          {/* ATTENTION */}
          {profile?.attentionContent && (
            <AttentionSection
              title={profile.attentionTitle} content={profile.attentionContent}
              titleEn={null} contentEn={null} lang="ID"
              primaryColor={terra} bgColor={bg} textColor={text} fontBody={fontB}
            />
          )}

          {/* EVENTS */}
          {has("EVENT") && visibleEvents.length > 0 && (
            <section className="py-14 px-6">
              <Head eyebrow="Waktu & Tempat" terra={terra} fontH={fontH}>Jadwal Acara</Head>
              <div className="max-w-sm mx-auto space-y-5">
                {visibleEvents.map((ev) => (
                  <motion.div key={ev.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.15 }} transition={{ duration: 0.55 }}
                    className="rt-card px-6 py-6">
                    <div className="flex items-center gap-2 pb-3 mb-4 border-b border-dashed" style={{ borderColor: `${terra}44` }}>
                      <Calendar size={14} style={{ color: terra }} />
                      <p className="font-semibold" style={{ fontFamily: `'${fontH}', serif` }}>
                        {ev.label || EVENT_TYPE_LABELS[ev.type] || ev.type}
                      </p>
                    </div>
                    <div className="space-y-1.5 text-sm">
                      {ev.date && <p>{formatDate(ev.date)}</p>}
                      {(ev.timeStart || ev.timeEnd) && <p style={{ color: DEF.muted }}>{ev.timeStart}{ev.timeEnd ? ` – ${ev.timeEnd}` : ""} WIB</p>}
                      <p className="pt-1 font-medium">{ev.venueName}</p>
                      <p className="text-xs" style={{ color: DEF.muted }}>{ev.venueAddress}</p>
                    </div>
                    {theme?.showMap !== false && ev.mapsUrl && (
                      <a href={ev.mapsUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-4 text-xs px-5 py-2 rounded-full text-white"
                        style={{ background: terra }}>
                        <MapPin size={11} /> Lihat Lokasi
                      </a>
                    )}
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* GALLERY */}
          {has("GALLERY") && client.galleries.filter((g) => g.type === "GALLERY").length > 0 && (
            <section className="py-14 px-6" style={{ background: surface }}>
              <Head eyebrow="Momen" terra={terra} fontH={fontH}>Galeri</Head>
              <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                {client.galleries.filter((g) => g.type === "GALLERY").map((g) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={g.id} src={g.url} alt="" loading="lazy"
                    className="w-full aspect-square object-cover rounded-lg"
                    style={{ boxShadow: `0 6px 16px ${DEF.muted}33`, outline: `3px solid #fffdf8` }} />
                ))}
              </div>
            </section>
          )}

          {/* RSVP */}
          {has("RSVP") && (
            <section className="py-14 px-6">
              <Head eyebrow="Konfirmasi" terra={terra} fontH={fontH}>RSVP</Head>
              {token && guest ? (
                <RsvpForm clientId={client.id} guest={guest} token={token} terra={terra}
                  needsSoup={(guest.invitationCategory ?? "").includes("RESEPSI")}
                  onConfirmed={setRsvpStatus} />
              ) : (
                <p className="text-center text-sm" style={{ color: DEF.muted }}>RSVP tersedia melalui link undangan personal.</p>
              )}
            </section>
          )}

          {/* BARCODE */}
          {token && guest?.barcodeChurch &&
            (barcodeVisibility === "ALWAYS" || (barcodeVisibility === "AFTER_RSVP" && rsvpStatus === "HADIR")) && (
            <BarcodeSection
              barcodeChurch={guest.barcodeChurch}
              barcodeReception={guest.barcodeReception ?? null}
              invitationCategory={guest.invitationCategory ?? ""}
              churchLabel={EVENT_TYPE_LABELS[visibleEvents[0]?.type ?? ""] ?? "Upacara"}
              receptionLabel={EVENT_TYPE_LABELS["RESEPSI"]}
              churchVenueName={getEventVenueName(visibleEvents[0], "id", "Venue")}
              receptionVenueName={getEventVenueName(visibleEvents.find((e) => e.type === "RESEPSI"), "id", "Resepsi")}
              primaryColor={terra} bgColor={DEF.paper} fontHeading={fontH} lang="id"
            />
          )}

          {/* WISHES */}
          {has("WISHES") && (
            <WishesBlock clientId={client.id} initialWishes={client.wishes}
              guestName={guest?.name ?? null} guestId={guest?.id ?? null} terra={terra} />
          )}

          {/* GIFT */}
          {has("GIFT") && client.gifts.length > 0 && (
            <GiftBlock gifts={client.gifts} terra={terra} />
          )}

          {/* CLOSING */}
          <footer className="py-20 px-6 text-center" style={{ background: surface }}>
            <Wheat size={18} style={{ color: terra, margin: "0 auto 1rem" }} />
            <p className="text-xl" style={{ fontFamily: `'${fontH}', serif` }}>{groomNick} &amp; {brideNick}</p>
            <p className="mt-5 text-xs max-w-xs mx-auto leading-relaxed" style={{ color: DEF.muted }}>
              Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir.
            </p>
            <p className="mt-8 text-[10px]" style={{ color: `${DEF.muted}88` }}>Digital Invitation</p>
          </footer>
        </motion.div>
      )}
    </div>
  );
}

function HeadInline({ terra, fontH, label, children }: { terra: string; fontH: string; label: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <p className="text-[10px] uppercase" style={{ letterSpacing: "0.28em", color: DEF.muted }}>{label}</p>
      <h2 className="mt-1.5 text-xl" style={{ fontFamily: `'${fontH}', serif` }}>{children}</h2>
      <div className="mx-auto mt-3 w-10 border-t-2 border-dashed" style={{ borderColor: `${terra}66` }} />
    </div>
  );
}

function Head({ eyebrow, terra, fontH, children }: { eyebrow: string; terra: string; fontH: string; children: React.ReactNode }) {
  return (
    <div className="text-center mb-9">
      <p className="text-[10px] uppercase" style={{ letterSpacing: "0.28em", color: DEF.muted }}>{eyebrow}</p>
      <h2 className="mt-1.5 text-2xl" style={{ fontFamily: `'${fontH}', serif` }}>{children}</h2>
      <div className="mx-auto mt-3 w-10 border-t-2 border-dashed" style={{ borderColor: `${terra}66` }} />
    </div>
  );
}

function CountdownInline({ target, terra }: { target: Date; terra: string }) {
  const [t, setT] = useState<{ d: number; h: number; m: number; s: number } | null>(null);
  useEffect(() => {
    const id = setInterval(() => {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) { setT(null); clearInterval(id); return; }
      setT({
        d: Math.floor(diff / 86400000), h: Math.floor((diff / 3600000) % 24),
        m: Math.floor((diff / 60000) % 60), s: Math.floor((diff / 1000) % 60),
      });
    }, 1000);
    return () => clearInterval(id);
  }, [target]);
  if (!t) return null;

  return (
    <div className="flex justify-center gap-4">
      {[{ v: t.d, l: "Hari" }, { v: t.h, l: "Jam" }, { v: t.m, l: "Menit" }, { v: t.s, l: "Detik" }].map(({ v, l }) => (
        <div key={l} className="w-15 text-center">
          <div className="text-2xl" style={{ fontFamily: "'Libre Baskerville',serif", color: terra }}>{String(v).padStart(2, "0")}</div>
          <div className="text-[9px] uppercase tracking-widest mt-0.5" style={{ color: DEF.muted }}>{l}</div>
        </div>
      ))}
    </div>
  );
}

function RsvpForm({
  clientId, guest, token, terra, needsSoup, onConfirmed,
}: {
  clientId: string; guest: Guest; token: string; terra: string; needsSoup: boolean;
  onConfirmed: (s: string) => void;
}) {
  const [status, setStatus] = useState<"HADIR" | "TIDAK_HADIR">("HADIR");
  const [pax, setPax] = useState(1);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(!!guest.rsvp);
  const [soups, setSoups] = useState<string[]>([]);

  async function submit() {
    setSending(true);
    await fetch("/api/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token, clientId, guestId: guest.id,
        name: guest.name, paxCount: status === "HADIR" ? pax : 0,
        status, message: message || undefined,
        soupChoices: needsSoup && status === "HADIR" ? soups.slice(0, pax).filter(Boolean) : undefined,
      }),
    });
    setDone(true);
    onConfirmed(status);
    setSending(false);
  }

  if (done) {
    return (
      <div className="max-w-sm mx-auto rt-card text-center px-6 py-9">
        <Check size={26} className="mx-auto" style={{ color: terra }} />
        <p className="mt-3 text-sm">Terima kasih atas konfirmasinya.</p>
      </div>
    );
  }

  const inputCls = "w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none";
  const inputStyle = { borderColor: `${terra}55`, background: DEF.paper };

  return (
    <div className="max-w-sm mx-auto space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {(["HADIR", "TIDAK_HADIR"] as const).map((s) => (
          <button key={s} onClick={() => setStatus(s)}
            className="py-3 rounded-lg text-sm transition-colors"
            style={status === s
              ? { background: terra, color: "#fff" }
              : { background: DEF.paper, border: `1px solid ${terra}44` }}>
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
      {needsSoup && status === "HADIR" && (
        [...Array(pax)].map((_, i) => (
          <select key={i} value={soups[i] ?? ""} onChange={(e) => {
            const next = [...soups]; next[i] = e.target.value; setSoups(next);
          }} className={inputCls} style={inputStyle}>
            <option value="">Pilih soup untuk tamu {i + 1}</option>
            <option value="ORIGINAL_KONBU">Original Konbu</option>
            <option value="JAPANESE_BROTH">Japanese Broth</option>
            <option value="TOM_YUM">Tom Yum</option>
            <option value="COLLAGEN">Collagen</option>
          </select>
        ))
      )}
      <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3}
        placeholder="Pesan atau doa (opsional)" className={`${inputCls} resize-none`} style={inputStyle} />
      <button onClick={submit} disabled={sending}
        className="w-full py-3 rounded-lg text-white text-sm disabled:opacity-60" style={{ background: terra }}>
        {sending ? "Mengirim..." : "Konfirmasi Kehadiran"}
      </button>
    </div>
  );
}

function WishesBlock({
  clientId, initialWishes, guestName, guestId, terra,
}: {
  clientId: string; initialWishes: { id: string; name: string; message: string; reply: string | null; createdAt: Date }[];
  guestName: string | null; guestId: string | null; terra: string;
}) {
  const [wishes, setWishes] = useState(initialWishes);
  const [name, setName] = useState(guestName ?? "");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

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
    }
    setSending(false);
  }

  const inputCls = "w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none";
  const inputStyle = { borderColor: `${terra}55`, background: DEF.paper };

  return (
    <section className="py-14 px-6" style={{ background: surfaceBg() }}>
      <Head eyebrow="Pesan" terra={terra} fontH="Libre Baskerville">Ucapan &amp; Doa</Head>
      <div className="max-w-sm mx-auto space-y-3">
        <input value={name} onChange={(e) => setName(e.target.value)} readOnly={!!guestName} placeholder="Nama Anda" className={inputCls} style={inputStyle} />
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3}
          placeholder="Tulis doa dan ucapan terbaik..." className={`${inputCls} resize-none`} style={inputStyle} />
        <button onClick={submit} disabled={sending}
          className="w-full py-3 rounded-lg text-white text-sm disabled:opacity-60" style={{ background: terra }}>
          {sending ? "Mengirim..." : "Kirim Ucapan"}
        </button>
      </div>
      <div className="max-w-sm mx-auto mt-10 space-y-4 max-h-96 overflow-y-auto pr-1">
        {wishes.length === 0 && (
          <p className="text-center text-xs" style={{ color: DEF.muted }}>Jadilah yang pertama memberikan ucapan...</p>
        )}
        {wishes.map((w) => (
          <div key={w.id} className="rt-card px-4 py-3">
            <p className="text-xs font-semibold" style={{ color: terra }}>{w.name}</p>
            <p className="text-sm mt-1">{w.message}</p>
            {w.reply && (
              <div className="mt-2 pl-3 border-l-2 text-xs" style={{ borderColor: terra, color: DEF.muted }}>
                Balasan: {w.reply}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function surfaceBg() {
  return "#f0e6d6";
}

function GiftBlock({ gifts, terra }: { gifts: TemplateProps["client"]["gifts"]; terra: string }) {
  const [copied, setCopied] = useState<string | null>(null);

  function copy(value: string, key: string) {
    navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <section className="py-14 px-6">
      <Head eyebrow="Hadiah" terra={terra} fontH="Libre Baskerville">Amplop Digital</Head>
      <p className="text-center text-xs max-w-xs mx-auto -mt-4 mb-8" style={{ color: DEF.muted }}>
        Doa restu Anda adalah hadiah terbaik yang kami harapkan.
      </p>
      <div className="max-w-sm mx-auto space-y-4">
        {gifts.filter((g) => g.kind !== "ADDRESS").sort((a, b) => (a.kind === "BANK" ? 0 : a.kind === "EWALLET" ? 1 : 2) - (b.kind === "BANK" ? 0 : b.kind === "EWALLET" ? 1 : 2)).map((g) => (
          <GiftBankCard key={g.id} kind={g.kind} bankName={g.bankName} accountNumber={g.accountNumber}
            accountName={g.accountName} ewalletType={g.ewalletType} ewalletNumber={g.ewalletNumber}
            qrisImage={g.qrisImage} accent={terra} />
        ))}
        {gifts.filter((g) => g.kind === "ADDRESS").map((g) => (
          <GiftAddressCard key={g.id} receiverName={g.receiverName} receiverPhone={g.receiverPhone}
            address={g.address} accent={terra} />
        ))}
      </div>
    </section>
  );
}

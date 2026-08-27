"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Calendar, Clock, Copy, Check } from "lucide-react";
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
  gold: "#c9a227",
  indigo: "#1f2a52",
  panel: "#28345e",
  text: "#f2ecdd",
  muted: "#a8a893",
};

export default function JawaAgengTemplate({ guest, client, token }: TemplateProps) {
  const profile = client.weddingProfile;
  const theme = client.theme;

  const gold = theme?.primaryColor || DEF.gold;
  const bg = theme?.bgColor || DEF.indigo;
  const surface = theme?.secondaryColor || DEF.panel;
  const text = theme?.textColor || DEF.text;
  const fontH = theme?.fontHeading === "IBM Plex Sans" ? "Cinzel" : theme?.fontHeading || "Cinzel";
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
    client.clientType === "ULANG_TAHUN" ? "Syukuran"
    : client.clientType === "KANTOR" ? "Acara Kantor"
    : client.clientType === "SANGJIT" ? "Sangjit"
    : client.clientType === "LAMARAN" ? "Lamaran"
    : "Resepsi Pernikahan";

  function handleOpen() {
    setOpen(true);
    playRef.current?.();
  }

  return (
    <div style={{ background: bg, color: text, fontFamily: `'${fontB}', sans-serif`, minHeight: "100dvh" }}>
      <style>{`
        .ja-batik {
          background-image:
            radial-gradient(circle at 25% 25%, ${gold}14 2px, transparent 2.5px),
            radial-gradient(circle at 75% 75%, ${gold}14 2px, transparent 2.5px),
            radial-gradient(circle at 75% 25%, ${gold}0d 6px, transparent 6.5px),
            radial-gradient(circle at 25% 75%, ${gold}0d 6px, transparent 6.5px);
          background-size: 48px 48px;
        }
        .ja-frame { border: 1px solid ${gold}66; outline: 1px solid ${gold}33; outline-offset: 4px; }
        .ja-orn { display:flex; align-items:center; gap:.75rem; justify-content:center; }
        .ja-orn::before,.ja-orn::after { content:""; height:1px; flex:0 0 44px; background:linear-gradient(90deg,transparent,${gold}88); }
        .ja-orn::after { background:linear-gradient(90deg,${gold}88,transparent); }
      `}</style>

      {music && (
        <MusicPlayer url={music.url} title={music.title} registerPlay={(fn) => { playRef.current = fn; }} />
      )}

      {!open && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center text-center px-8 ja-batik" style={{ background: bg }}>
          <p className="text-[11px] uppercase" style={{ letterSpacing: "0.4em", color: gold }}>{invLabel}</p>
          <h1 className="mt-5 leading-snug ja-frame px-7 py-6" style={{ fontFamily: `'${fontH}', serif`, fontSize: "clamp(1.8rem,8vw,2.8rem)", fontWeight: 400 }}>
            {groomNick}<br /><span style={{ color: gold }}>&amp;</span><br />{brideNick}
          </h1>
          {firstDate && <p className="mt-6 text-xs" style={{ color: DEF.muted }}>{formatDate(firstDate)}</p>}
          {guest?.name && (
            <div className="mt-7">
              <p className="text-[10px] uppercase" style={{ letterSpacing: "0.3em", color: DEF.muted }}>Kepada Yth.</p>
              <p className="mt-1 text-sm">{guest.name}</p>
            </div>
          )}
          <motion.button onClick={handleOpen} whileTap={{ scale: 0.96 }}
            className="mt-9 px-10 py-3 rounded-full text-xs border-2"
            style={{ borderColor: gold, color: gold, letterSpacing: "0.25em", fontFamily: `'${fontH}', serif` }}>
            BUKA UNDANGAN
          </motion.button>
        </div>
      )}

      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
          {/* HERO */}
          <section className="relative flex flex-col items-center justify-center text-center ja-batik overflow-hidden"
            style={{ minHeight: "92dvh", padding: "4rem 1.5rem" }}>
            {heroImage && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={heroImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
                <div className="absolute inset-0" style={{ background: `${bg}b3` }} />
              </>
            )}
            <div className="relative z-10">
              <p style={{ fontSize: ".65rem", letterSpacing: "0.4em", color: gold }}>{invLabel.toUpperCase()}</p>
              <h1 className="mt-7 leading-snug ja-frame px-8 py-7" style={{ fontFamily: `'${fontH}', serif`, fontSize: "clamp(2.1rem,9vw,3.3rem)", fontWeight: 400 }}>
                {groomNick}
                <span className="block my-2" style={{ color: gold }}>❦</span>
                {brideNick}
              </h1>
              {firstDate && (
                <p className="mt-7 text-[11px]" style={{ letterSpacing: "0.35em", color: DEF.muted }}>{formatDate(firstDate).toUpperCase()}</p>
              )}
            </div>
          </section>

          {/* COUNTDOWN */}
          {(theme?.showCountdown ?? true) && countdownTarget && (
            <section className="py-14 px-6" style={{ background: surface }}>
              <Head gold={gold} fontH={fontH} label="MUNGGAHI WAKTU">Menuju Hari Bahagia</Head>
              <CountdownInline target={countdownTarget} gold={gold} />
            </section>
          )}

          {/* COUPLE */}
          {has("COUPLE") && profile && (
            <section className="py-16 px-6 ja-batik" style={{ borderBottom: `1px solid ${gold}33` }}>
              <Head gold={gold} fontH={fontH} label="MEMPELAI">Kedua Mempelai</Head>
              {profile.openingQuote && (
                <p className="max-w-md mx-auto text-center italic text-sm leading-relaxed -mt-4 mb-12" style={{ color: DEF.muted }}>
                  “{profile.openingQuote}”
                  {profile.openingQuoteBy && <span className="block not-italic mt-2 text-xs">— {profile.openingQuoteBy}</span>}
                </p>
              )}
              <div className="max-w-sm mx-auto space-y-12 text-center">
                {([
                  { name: profile.groomName, nick: profile.groomNickname, parents: profile.groomParents, photo: profile.showGroomPhoto ? profile.groomPhoto : null },
                  { name: profile.brideName, nick: profile.brideNickname, parents: profile.brideParents, photo: profile.showBridePhoto ? profile.bridePhoto : null },
                ]).map((p, i) => p.name && (
                  <motion.div key={i} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.15 }} transition={{ duration: 0.8 }}>
                    {p.photo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.photo} alt={p.name} className="w-40 h-40 object-cover mx-auto mb-5 ja-frame"
                        style={{ borderRadius: "50%", padding: "5px", background: bg }} />
                    )}
                    <h3 style={{ fontFamily: `'${fontH}', serif`, fontSize: "1.45rem", letterSpacing: "0.04em", color: gold }}>
                      {p.nick || p.name}
                    </h3>
                    <p className="text-xs mt-1.5">{p.name}</p>
                    <div className="ja-orn my-3"><span style={{ color: gold, fontSize: ".65rem" }}>❦</span></div>
                    {p.parents && <p className="text-xs leading-relaxed" style={{ color: DEF.muted }}>{p.parents}</p>}
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
          {has("EVENT") && visibleEvents.length > 0 && (
            <section className="py-16 px-6" style={{ borderBottom: `1px solid ${gold}33` }}>
              <Head gold={gold} fontH={fontH} label="WAKTU &amp; TEMPAT">Rangkaian Acara</Head>
              <div className="max-w-sm mx-auto space-y-5">
                {visibleEvents.map((ev) => (
                  <motion.div key={ev.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.15 }} transition={{ duration: 0.7 }}
                    className="ja-frame text-center px-6 py-7" style={{ background: surface }}>
                    <p style={{ fontFamily: `'${fontH}', serif`, fontSize: "1.05rem", letterSpacing: "0.15em", color: gold }}>
                      {(ev.label || EVENT_TYPE_LABELS[ev.type] || ev.type).toUpperCase()}
                    </p>
                    <div className="ja-orn my-4"><span style={{ color: gold, fontSize: ".6rem" }}>❦</span></div>
                    {ev.date && <p className="text-sm flex items-center justify-center gap-2"><Calendar size={13} style={{ color: gold }} />{formatDate(ev.date)}</p>}
                    {(ev.timeStart || ev.timeEnd) && (
                      <p className="text-sm mt-1.5 flex items-center justify-center gap-2"><Clock size={13} style={{ color: gold }} />{ev.timeStart}{ev.timeEnd ? ` - ${ev.timeEnd}` : ""} WIB</p>
                    )}
                    <p className="mt-4 text-sm font-medium">{ev.venueName}</p>
                    <p className="text-xs mt-1" style={{ color: DEF.muted }}>{ev.venueAddress}</p>
                    {theme?.showMap !== false && ev.mapsUrl && (
                      <a href={ev.mapsUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-5 text-[11px] px-6 py-2 rounded-full border-2"
                        style={{ borderColor: gold, color: gold }}>
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
            <section className="py-16 px-6 ja-batik" style={{ borderBottom: `1px solid ${gold}33` }}>
              <Head gold={gold} fontH={fontH} label="MOMEN">Galeri</Head>
              <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
                {client.galleries.filter((g) => g.type === "GALLERY").map((g) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={g.id} src={g.url} alt="" loading="lazy"
                    className="w-full aspect-square object-cover"
                    style={{ border: `2px solid ${gold}55` }} />
                ))}
              </div>
            </section>
          )}

          {/* RSVP */}
          {has("RSVP") && (
            <section className="py-16 px-6" style={{ borderBottom: `1px solid ${gold}33` }}>
              <Head gold={gold} fontH={fontH} label="KONFIRMASI">Konfirmasi Kehadiran</Head>
              {token && guest ? (
                <RsvpForm clientId={client.id} guest={guest} token={token} gold={gold} surface={surface}
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
              primaryColor={gold} bgColor={surface} fontHeading={fontH} lang="id"
            />
          )}

          {/* WISHES */}
          {has("WISHES") && (
            <WishesBlock clientId={client.id} initialWishes={client.wishes}
              guestName={guest?.name ?? null} guestId={guest?.id ?? null}
              gold={gold} surface={surface} fontH={fontH} />
          )}

          {/* GIFT */}
          {has("GIFT") && client.gifts.length > 0 && (
            <GiftBlock gifts={client.gifts} gold={gold} surface={surface} />
          )}

          {/* CLOSING */}
          <footer className="py-20 px-6 text-center ja-batik">
            <div className="ja-orn mb-5"><span style={{ color: gold, fontSize: ".7rem" }}>❦</span></div>
            <p className="text-[10px]" style={{ letterSpacing: "0.4em", color: DEF.muted }}>SUMANGGA MIRAH NGUNJUNGI</p>
            <p className="mt-4 text-2xl" style={{ fontFamily: `'${fontH}', serif`, color: gold }}>
              {groomNick} &amp; {brideNick}
            </p>
            <p className="mt-6 text-xs max-w-xs mx-auto leading-relaxed" style={{ color: DEF.muted }}>
              Sinuwun lan sumanget Bapak/Ibu/Saudara/i, kehadiran panjenengan minangka bebungah kangge kula.
            </p>
          </footer>
        </motion.div>
      )}
    </div>
  );
}

function Head({ gold, fontH, label, children }: { gold: string; fontH: string; label: string; children: React.ReactNode }) {
  return (
    <div className="text-center mb-11">
      <p className="text-[10px]" style={{ letterSpacing: "0.45em", color: DEF.muted }}>{label}</p>
      <h2 className="mt-2.5 text-2xl" style={{ fontFamily: `'${fontH}', serif`, color: gold, letterSpacing: "0.05em" }}>{children}</h2>
      <div className="ja-orn mt-4"><span style={{ color: gold, fontSize: ".6rem" }}>❦</span></div>
    </div>
  );
}

function CountdownInline({ target, gold }: { target: Date; gold: string }) {
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
    <div className="flex justify-center gap-3">
      {[{ v: t.d, l: "DINA" }, { v: t.h, l: "JAM" }, { v: t.m, l: "MENIT" }, { v: t.s, l: "DETIK" }].map(({ v, l }) => (
        <div key={l} className="w-16 py-3 text-center border" style={{ borderColor: `${gold}55` }}>
          <div className="text-xl" style={{ fontFamily: "'Cinzel',serif", color: gold }}>{String(v).padStart(2, "0")}</div>
          <div className="text-[8px] mt-1" style={{ letterSpacing: "0.25em", color: DEF.muted }}>{l}</div>
        </div>
      ))}
    </div>
  );
}

function RsvpForm({
  clientId, guest, token, gold, surface, needsSoup, onConfirmed,
}: {
  clientId: string; guest: Guest; token: string; gold: string; surface: string; needsSoup: boolean;
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
      <div className="max-w-sm mx-auto text-center ja-frame px-6 py-9" style={{ background: surface }}>
        <Check size={26} className="mx-auto" style={{ color: gold }} />
        <p className="mt-3 text-sm">Matur nuwun konfirmasinipun.</p>
      </div>
    );
  }

  const inputCls = "w-full px-4 py-2.5 text-sm focus:outline-none bg-transparent";
  const inputStyle = { border: `1px solid ${gold}55`, color: DEF.text };

  return (
    <div className="max-w-sm mx-auto space-y-3.5">
      <div className="grid grid-cols-2 gap-3">
        {(["HADIR", "TIDAK_HADIR"] as const).map((s) => (
          <button key={s} onClick={() => setStatus(s)}
            className="py-3 text-[11px] border-2 transition-colors"
            style={status === s
              ? { borderColor: gold, background: gold, color: "#1f2a52", fontFamily: "'Cinzel',serif", letterSpacing: "0.2em" }
              : { borderColor: `${gold}55`, color: DEF.text, fontFamily: "'Cinzel',serif", letterSpacing: "0.2em" }}>
            {s === "HADIR" ? "HADIR" : "TIDAK HADIR"}
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
        className="w-full py-3 text-[11px] disabled:opacity-60 border-2"
        style={{ borderColor: gold, background: gold, color: "#1f2a52", fontFamily: "'Cinzel',serif", letterSpacing: "0.25em" }}>
        {sending ? "NGINTUN..." : "KONFIRMASI KEHADIRAN"}
      </button>
    </div>
  );
}

function WishesBlock({
  clientId, initialWishes, guestName, guestId, gold, surface, fontH,
}: {
  clientId: string; initialWishes: { id: string; name: string; message: string; reply: string | null; createdAt: Date }[];
  guestName: string | null; guestId: string | null; gold: string; surface: string; fontH: string;
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

  const inputCls = "w-full px-4 py-2.5 text-sm focus:outline-none bg-transparent";
  const inputStyle = { border: `1px solid ${gold}55`, color: DEF.text };

  return (
    <section className="py-16 px-6" style={{ borderBottom: `1px solid ${gold}33` }}>
      <Head gold={gold} fontH={fontH} label="PESAN">Ucapan &amp; Doa</Head>
      <div className="max-w-sm mx-auto space-y-3">
        <input value={name} onChange={(e) => setName(e.target.value)} readOnly={!!guestName} placeholder="Nama Anda" className={inputCls} style={inputStyle} />
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3}
          placeholder="Tulis doa dan ucapan terbaik..." className={`${inputCls} resize-none`} style={inputStyle} />
        <button onClick={submit} disabled={sending}
          className="w-full py-3 text-[11px] border-2 disabled:opacity-60"
          style={{ borderColor: gold, background: gold, color: "#1f2a52", letterSpacing: "0.25em" }}>
          {sending ? "NGINTUN..." : "KIRIM UCAPAN"}
        </button>
      </div>
      <div className="max-w-sm mx-auto mt-10 space-y-4 max-h-96 overflow-y-auto pr-1">
        {wishes.length === 0 && (
          <p className="text-center text-xs" style={{ color: DEF.muted }}>Jadilah yang pertama memberikan ucapan...</p>
        )}
        {wishes.map((w) => (
          <div key={w.id} className="px-4 py-3 border" style={{ borderColor: `${gold}33`, background: surface }}>
            <p className="text-xs" style={{ color: gold }}>{w.name}</p>
            <p className="text-sm mt-1">{w.message}</p>
            {w.reply && (
              <div className="mt-2 pl-3 border-l-2 text-xs" style={{ borderColor: gold, color: DEF.muted }}>
                Balasan: {w.reply}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function GiftBlock({
  gifts, gold, surface,
}: {
  gifts: TemplateProps["client"]["gifts"]; gold: string; surface: string;
}) {
  const [copied, setCopied] = useState<string | null>(null);

  function copy(value: string, key: string) {
    navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <section className="py-16 px-6" style={{ borderBottom: `1px solid ${gold}33` }}>
      <Head gold={gold} fontH="Cinzel" label="PARINGAN">Amplop Digital</Head>
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

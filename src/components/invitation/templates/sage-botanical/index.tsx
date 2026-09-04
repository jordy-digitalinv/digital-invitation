"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Calendar, Clock, Copy, Check, Leaf } from "lucide-react";
import { MusicPlayer } from "../../sections/MusicPlayer";
import { GiftAddressCard } from "../../sections/GiftAddressCard";
import { GiftBankCard } from "../../sections/GiftBankCard";
import { BarcodeSection, getEventVenueName } from "../../sections/BarcodeSection";
import { AttentionSection } from "../../sections/AttentionSection";
import { formatDate } from "@/lib/utils";
import { getEventsForGuestCategory, EVENT_TYPE_LABELS } from "@/lib/categories";
import { findMenuEvent } from "@/lib/menu";
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

const DEF = {
  sage: "#7c9070",
  cream: "#f4f3ec",
  card: "#ffffff",
  text: "#37412f",
  muted: "#8a9382",
};

export default function SageBotanicalTemplate({ guest, client, token }: TemplateProps) {
  const profile = client.weddingProfile;
  const theme = client.theme;

  const sage = theme?.primaryColor || DEF.sage;
  const bg = theme?.bgColor || DEF.cream;
  const surface = theme?.secondaryColor || "#e8ebdf";
  const text = theme?.textColor || DEF.text;
  const fontH = theme?.fontHeading === "IBM Plex Sans" ? "Cormorant Garamond" : theme?.fontHeading || "Cormorant Garamond";
  const fontB = theme?.fontBody || "Lato";

  const music = client.musics[0];
  const heroImage = profile?.heroImage || client.galleries.find((g) => g.type === "HERO")?.url || client.galleries.find((g) => g.type === "COVER")?.url || null;
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
    client.clientType === "ULANG_TAHUN" ? "Celebration"
    : client.clientType === "KANTOR" ? "Gathering"
    : client.clientType === "SANGJIT" ? "Sangjit Ceremony"
    : client.clientType === "LAMARAN" ? "Engagement"
    : "The Wedding Of";

  function handleOpen() {
    setOpen(true);
    playRef.current?.();
  }

  return (
    <div style={{ background: bg, color: text, fontFamily: `'${fontB}', sans-serif`, minHeight: "100dvh" }}>
      {music && (
        <MusicPlayer url={music.url} title={music.title} registerPlay={(fn) => { playRef.current = fn; }} />
      )}

      {!open && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center text-center px-8" style={{ background: surface }}>
          {heroImage && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={heroImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${surface}66 0%, ${surface}d9 70%, ${surface} 100%)` }} />
            </>
          )}
          <Leaf size={26} style={{ color: sage }} className="relative z-10 mb-6" />
          <p className="relative z-10 text-[10px] uppercase" style={{ letterSpacing: "0.4em", color: DEF.muted }}>{invLabel}</p>
          <h1 className="relative z-10 mt-4 leading-tight" style={{ fontFamily: `'${fontH}', serif`, fontSize: "clamp(2.2rem,9vw,3.4rem)", fontWeight: 300 }}>
            {groomNick}<span className="italic" style={{ color: sage }}> & </span>{brideNick}
          </h1>
          {firstDate && (
            <p className="relative z-10 mt-3 text-xs" style={{ color: DEF.muted }}>{formatDate(firstDate)}</p>
          )}
          {guest?.name && (
            <p className="relative z-10 mt-8 text-xs" style={{ color: DEF.muted }}>Dear <span className="font-medium" style={{ color: text }}>{guest.name}</span></p>
          )}
          <button onClick={handleOpen}
            className="relative z-10 mt-10 px-9 py-3 rounded-full text-white text-sm tracking-wide shadow-lg"
            style={{ background: sage }}>
            Buka Undangan
          </button>
        </div>
      )}

      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
          {/* HERO */}
          <section className="relative flex items-end" style={{ minHeight: "80dvh" }}>
            {heroImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={heroImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
            )}
            {!heroImage && <div className="absolute inset-0" style={{ background: surface }} />}
            <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, transparent 40%, ${bg} 100%)` }} />
            <div className="relative z-10 w-full px-7 pb-14">
              <Leaf size={18} style={{ color: sage, marginBottom: ".8rem" }} />
              <p className="text-[10px] uppercase" style={{ letterSpacing: "0.35em", color: DEF.muted }}>{invLabel}</p>
              <h1 className="mt-2 leading-tight" style={{ fontFamily: `'${fontH}', serif`, fontWeight: 300, fontSize: "clamp(2.4rem,10vw,3.6rem)" }}>
                {groomNick}<span className="italic" style={{ color: sage }}> & </span>{brideNick}
              </h1>
              {guest?.name && (
                <div className="mt-5 inline-block bg-white/70 backdrop-blur-sm rounded-full px-5 py-2 border border-white">
                  <p className="text-xs">Dear <span className="font-semibold">{guest.name}</span></p>
                </div>
              )}
            </div>
          </section>

          {/* QUOTE + COUNTDOWN */}
          {(profile?.openingQuote || ((theme?.showCountdown ?? true) && firstDate)) && (
            <section className="px-7 py-14 text-center space-y-8">
              {profile?.openingQuote && (
                <p className="max-w-md mx-auto italic leading-relaxed" style={{ fontFamily: `'${fontH}', serif`, fontSize: "1.05rem", color: DEF.muted }}>
                  “{profile.openingQuote}”
                  {profile.openingQuoteBy && <span className="block not-italic mt-2 text-xs">{profile.openingQuoteBy}</span>}
                </p>
              )}
              {(theme?.showCountdown ?? true) && countdownTarget && (
                <CountdownInline target={countdownTarget} sage={sage} />
              )}
            </section>
          )}

          {/* COUPLE */}
          {has("COUPLE") && profile && (
            <section className="py-16 px-7" style={{ background: surface }}>
              <Head eyebrow="Mempelai" sage={sage} fontH={fontH}>Kedua Mempelai</Head>
              <div className="max-w-md mx-auto space-y-12">
                {([
                  { name: profile.groomName, nick: profile.groomNickname, parents: profile.groomParents, photo: profile.showGroomPhoto ? profile.groomPhoto : null, side: "Mempelai Pria" },
                  { name: profile.brideName, nick: profile.brideNickname, parents: profile.brideParents, photo: profile.showBridePhoto ? profile.bridePhoto : null, side: "Mempelai Wanita" },
                ]).map((p, i) => p.name && (
                  <motion.div key={i} initial={{ opacity: 0, x: i === 0 ? -24 : 24 }} whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: false, amount: 0.15 }} transition={{ duration: 0.7 }}
                    className="flex gap-5 items-center max-w-sm mx-auto">
                    <div className="shrink-0 relative">
                      {p.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.photo} alt={p.name} className="w-28 h-36 object-cover"
                          style={{ borderRadius: "56px 56px 18px 18px", border: `3px solid ${surface}`, boxShadow: `0 8px 20px ${DEF.muted}33` }} />
                      ) : (
                        <div className="w-28 h-36 flex items-center justify-center" style={{ borderRadius: "56px 56px 18px 18px", background: bg }}>
                          <Leaf size={22} style={{ color: sage }} />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-[9px] uppercase" style={{ letterSpacing: "0.3em", color: DEF.muted }}>{p.side}</p>
                      <h3 className="mt-1 text-xl" style={{ fontFamily: `'${fontH}', serif` }}>{p.nick || p.name}</h3>
                      <p className="text-xs mt-0.5" style={{ color: DEF.muted }}>{p.name}</p>
                      {p.parents && <p className="text-[11px] mt-2 leading-relaxed" style={{ color: DEF.muted }}>{p.parents}</p>}
                    </div>
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
              primaryColor={sage} bgColor={bg} textColor={text} fontBody={fontB}
            />
          )}

          {/* EVENTS */}
          {has("EVENT") && visibleEvents.length > 0 && (
            <section className="py-16 px-7">
              <Head eyebrow="Waktu & Tempat" sage={sage} fontH={fontH}>Jadwal Acara</Head>
              <div className="max-w-md mx-auto pl-6 space-y-10 relative before:absolute before:left-0 before:top-2 before:bottom-2 before:w-px" style={{}}>
                {visibleEvents.map((ev) => (
                  <motion.div key={ev.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.15 }} transition={{ duration: 0.6 }}
                    className="relative">
                    <span className="absolute -left-[27px] top-1.5 w-2.5 h-2.5 rounded-full border-2" style={{ borderColor: sage, background: bg }} />
                    <p className="text-[10px] uppercase" style={{ letterSpacing: "0.25em", color: sage }}>{ev.label || EVENT_TYPE_LABELS[ev.type] || ev.type}</p>
                    {ev.date && <p className="mt-2 flex items-center gap-2 text-sm"><Calendar size={13} style={{ color: sage }} />{formatDate(ev.date)}</p>}
                    {(ev.timeStart || ev.timeEnd) && (
                      <p className="mt-1 flex items-center gap-2 text-sm"><Clock size={13} style={{ color: sage }} />{ev.timeStart}{ev.timeEnd ? ` – ${ev.timeEnd}` : ""} WIB</p>
                    )}
                    <p className="mt-2 text-sm font-medium">{ev.venueName}</p>
                    <p className="text-xs" style={{ color: DEF.muted }}>{ev.venueAddress}</p>
                    {theme?.showMap !== false && ev.mapsUrl && (
                      <a href={ev.mapsUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-3 text-xs underline underline-offset-4" style={{ color: sage }}>
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
            <section className="py-16 px-7" style={{ background: surface }}>
              <Head eyebrow="Momen" sage={sage} fontH={fontH}>Galeri</Head>
              <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                {client.galleries.filter((g) => g.type === "GALLERY").map((g, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={g.id} src={g.url} alt="" loading="lazy"
                    className={`w-full object-cover ${i % 2 === 0 ? "rounded-tl-[3rem] aspect-square" : "rounded-br-[3rem] aspect-square mt-5"}`} />
                ))}
              </div>
            </section>
          )}

          {/* RSVP */}
          {has("RSVP") && (
            <section className="py-16 px-7">
              <Head eyebrow="Konfirmasi" sage={sage} fontH={fontH}>RSVP</Head>
              {token && guest ? (
                <RsvpForm clientId={client.id} guest={guest} token={token} sage={sage}
                  menuItems={findMenuEvent(client.events, guest.invitationCategory ?? "")?.menuItems ?? []}
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
              primaryColor={sage} bgColor={surface} fontHeading={fontH} lang="id"
            />
          )}

          {/* WISHES */}
          {has("WISHES") && (
            <WishesBlock clientId={client.id} initialWishes={client.wishes}
              guestName={guest?.name ?? null} guestId={guest?.id ?? null}
              sage={sage} surface={surface} />
          )}

          {/* GIFT */}
          {has("GIFT") && client.gifts.length > 0 && (
            <GiftBlock gifts={client.gifts} sage={sage} surface={surface} />
          )}

          {/* CLOSING */}
          <footer className="py-20 px-7 text-center" style={{ background: surface }}>
            <Leaf size={18} style={{ color: sage, margin: "0 auto 1rem" }} />
            <p className="text-2xl" style={{ fontFamily: `'${fontH}', serif` }}>
              {groomNick}<span className="italic" style={{ color: sage }}> & </span>{brideNick}
            </p>
            <p className="mt-5 text-xs max-w-xs mx-auto leading-relaxed" style={{ color: DEF.muted }}>
              Kehadiran dan doa restu Anda adalah kebahagiaan terbesar kami.
            </p>
            <p className="mt-8 text-[10px]" style={{ color: `${DEF.muted}88` }}>Digital Invitation</p>
          </footer>
        </motion.div>
      )}
    </div>
  );
}

function Head({ eyebrow, sage, fontH, children }: { eyebrow: string; sage: string; fontH: string; children: React.ReactNode }) {
  return (
    <div className="text-center mb-10">
      <p className="text-[10px] uppercase" style={{ letterSpacing: "0.35em", color: DEF.muted }}>{eyebrow}</p>
      <h2 className="mt-2 text-3xl" style={{ fontFamily: `'${fontH}', serif`, fontWeight: 300 }}>{children}</h2>
      <Leaf size={13} style={{ color: sage, margin: ".8rem auto 0" }} />
    </div>
  );
}

function CountdownInline({ target, sage }: { target: Date; sage: string }) {
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
    <div className="flex justify-center gap-6">
      {[{ v: t.d, l: "Hari" }, { v: t.h, l: "Jam" }, { v: t.m, l: "Menit" }, { v: t.s, l: "Detik" }].map(({ v, l }) => (
        <div key={l} className="text-center">
          <div className="text-3xl tabular-nums" style={{ fontFamily: "'Cormorant Garamond',serif", color: sage }}>{String(v).padStart(2, "0")}</div>
          <div className="text-[9px] uppercase tracking-widest mt-0.5" style={{ color: DEF.muted }}>{l}</div>
        </div>
      ))}
    </div>
  );
}

function RsvpForm({
  clientId, guest, token, sage, menuItems, onConfirmed,
}: {
  clientId: string; guest: Guest; token: string; sage: string; menuItems: { id: string; name: string }[];
  onConfirmed: (s: string) => void;
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
        menuChoices: menuItems.length > 0 && status === "HADIR" ? menuChoices.slice(0, pax).filter(Boolean) : undefined,
      }),
    });
    setDone(true);
    onConfirmed(status);
    setSending(false);
  }

  if (done) {
    return (
      <div className="max-w-sm mx-auto text-center bg-white rounded-2xl px-6 py-9 shadow-sm">
        <Check size={26} className="mx-auto" style={{ color: sage }} />
        <p className="mt-3 text-sm">Terima kasih atas konfirmasinya.</p>
      </div>
    );
  }

  const inputCls = "w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none bg-white";
  const inputStyle = { borderColor: `${DEF.muted}55` };

  return (
    <div className="max-w-sm mx-auto space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {(["HADIR", "TIDAK_HADIR"] as const).map((s) => (
          <button key={s} onClick={() => setStatus(s)}
            className="py-3 rounded-xl text-sm transition-colors"
            style={status === s
              ? { background: sage, color: "#fff" }
              : { background: "#fff", color: DEF.text, border: `1px solid ${DEF.muted}55` }}>
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
        [...Array(pax)].map((_, i) => (
          <select key={i} value={menuChoices[i] ?? ""} onChange={(e) => {
            const next = [...menuChoices]; next[i] = e.target.value; setMenuChoices(next);
          }} className={inputCls} style={inputStyle}>
            <option value="">Pilih menu untuk tamu {i + 1}</option>
            {menuItems.map((item) => (
              <option key={item.id} value={item.name}>{item.name}</option>
            ))}
          </select>
        ))
      )}
      <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3}
        placeholder="Pesan atau doa (opsional)" className={`${inputCls} resize-none`} style={inputStyle} />
      <button onClick={submit} disabled={sending}
        className="w-full py-3 rounded-xl text-white text-sm disabled:opacity-60" style={{ background: sage }}>
        {sending ? "Mengirim..." : "Konfirmasi Kehadiran"}
      </button>
    </div>
  );
}

function WishesBlock({
  clientId, initialWishes, guestName, guestId, sage, surface,
}: {
  clientId: string; initialWishes: { id: string; name: string; message: string; reply: string | null; createdAt: Date }[];
  guestName: string | null; guestId: string | null; sage: string; surface: string;
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

  const inputCls = "w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none bg-white";
  const inputStyle = { borderColor: `${DEF.muted}55` };

  return (
    <section className="py-16 px-7" style={{ background: surface }}>
      <Head eyebrow="Pesan" sage={sage} fontH="Cormorant Garamond">Ucapan &amp; Doa</Head>
      <div className="max-w-sm mx-auto space-y-3">
        <input value={name} onChange={(e) => setName(e.target.value)} readOnly={!!guestName} placeholder="Nama Anda" className={inputCls} style={inputStyle} />
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3}
          placeholder="Tulis doa dan ucapan terbaik..." className={`${inputCls} resize-none`} style={inputStyle} />
        <button onClick={submit} disabled={sending}
          className="w-full py-3 rounded-xl text-white text-sm disabled:opacity-60" style={{ background: sage }}>
          {sending ? "Mengirim..." : "Kirim Ucapan"}
        </button>
      </div>
      <div className="max-w-sm mx-auto mt-10 space-y-4 max-h-96 overflow-y-auto pr-1">
        {wishes.length === 0 && (
          <p className="text-center text-xs" style={{ color: DEF.muted }}>Jadilah yang pertama memberikan ucapan...</p>
        )}
        {wishes.map((w) => (
          <div key={w.id} className="bg-white rounded-2xl px-4 py-3 shadow-sm">
            <p className="text-xs font-semibold" style={{ color: sage }}>{w.name}</p>
            <p className="text-sm mt-1">{w.message}</p>
            {w.reply && (
              <div className="mt-2 pl-3 border-l-2 text-xs" style={{ borderColor: sage, color: DEF.muted }}>
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
  gifts, sage, surface,
}: {
  gifts: TemplateProps["client"]["gifts"]; sage: string; surface: string;
}) {
  const [copied, setCopied] = useState<string | null>(null);

  function copy(value: string, key: string) {
    navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <section className="py-16 px-7">
      <Head eyebrow="Hadiah" sage={sage} fontH="Cormorant Garamond">Amplop Digital</Head>
      <p className="text-center text-xs max-w-xs mx-auto -mt-4 mb-8" style={{ color: DEF.muted }}>
        Doa restu Anda adalah hadiah terbaik yang kami harapkan.
      </p>
      <div className="max-w-sm mx-auto space-y-4">
        {gifts.filter((g) => g.kind !== "ADDRESS").sort((a, b) => (a.kind === "BANK" ? 0 : a.kind === "EWALLET" ? 1 : 2) - (b.kind === "BANK" ? 0 : b.kind === "EWALLET" ? 1 : 2)).map((g) => (
          <GiftBankCard key={g.id} kind={g.kind} bankName={g.bankName} accountNumber={g.accountNumber}
            accountName={g.accountName} ewalletType={g.ewalletType} ewalletNumber={g.ewalletNumber}
            qrisImage={g.qrisImage} accent={sage} />
        ))}
        {gifts.filter((g) => g.kind === "ADDRESS").map((g) => (
          <GiftAddressCard key={g.id} receiverName={g.receiverName} receiverPhone={g.receiverPhone}
            address={g.address} accent={sage} />
        ))}
      </div>
    </section>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Calendar, Clock, Copy, Check, Waves } from "lucide-react";
import { MusicPlayer } from "../../sections/MusicPlayer";
import { GiftAddressCard } from "../../sections/GiftAddressCard";
import { GiftBankCard } from "../../sections/GiftBankCard";
import { BarcodeSection, getEventVenueName } from "../../sections/BarcodeSection";
import { AttentionSection } from "../../sections/AttentionSection";
import { formatDate } from "@/lib/utils";
import { getEventsForGuestCategory, EVENT_TYPE_LABELS } from "@/lib/categories";
import { findMenuEvent } from "@/lib/menu";
import { WishesLockedPlaceholder } from "../../sections/WishesLockedPlaceholder";
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
      requireRsvpForWish?: boolean | null;
    } | null;
  };
  token: string | null;
}

const DEF = {
  laut: "#7a1f1f",
  tosca: "#a03232",
  pasir: "#faf6ef",
  text: "#2d2320",
  muted: "#97897b",
};

const HORAS = "Horas!";

export default function BatakUlosTemplate({ guest, client, token }: TemplateProps) {
  const profile = client.weddingProfile;
  const theme = client.theme;

  const laut = theme?.primaryColor || DEF.laut;
  const bg = theme?.bgColor || DEF.pasir;
  const surface = theme?.secondaryColor || "#e9f2f2";
  const text = theme?.textColor || DEF.text;
  const fontH = theme?.fontHeading === "IBM Plex Sans" ? "Playfair Display" : theme?.fontHeading || "Playfair Display";
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
  const requireRsvpForWish = theme?.requireRsvpForWish ?? false;

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
    : client.clientType === "KANTOR" ? "Gathering"
    : client.clientType === "SANGJIT" ? "Sangjit Ceremony"
    : client.clientType === "LAMARAN" ? "Lamaran"
    : "Pesta Perkawinan";

  function handleOpen() {
    setOpen(true);
    playRef.current?.();
  }

  return (
    <div style={{ background: bg, color: text, fontFamily: `'${fontB}', sans-serif`, minHeight: "100dvh" }}>
      <style>{`
        .am-wave-top { position:relative; }
        .am-wave-top::before {
          content:""; position:absolute; top:-1px; left:0; right:0; height:22px;
          background:radial-gradient(circle at 12px -4px, transparent 14px, ${surface} 15px);
          background-size:24px 22px;
        }
        .am-cengkeh { display:inline-block; width:2.6rem; height:.55rem;
          background:repeating-linear-gradient(90deg, ${laut} 0 6px, #e8b931 6px 12px, #1a1a1a 12px 18px);
          border-radius:999px; }
        .am-orn { display:flex; align-items:center; gap:.7rem; justify-content:center; }
        .am-orn::before,.am-orn::after { content:""; height:1px; flex:0 0 40px; background:linear-gradient(90deg,transparent,#e8b931aa); }
        .am-orn::after { background:linear-gradient(90deg,#e8b931aa,transparent); }
        .bt-ulos { border-left:6px solid ${laut}; border-right:6px solid #e8b931; box-shadow:inset 0 0 0 2px #1a1a1a22; }
      `}</style>

      {music && (
        <MusicPlayer url={music.url} title={music.title} registerPlay={(fn) => { playRef.current = fn; }} />
      )}

      {!open && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center text-center px-8" style={{ background: surface }}>
          {heroImage && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={heroImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25" />
              <div className="absolute inset-0" style={{ background: `${surface}cc` }} />
            </>
          )}
          <span className="am-cengkeh relative z-10 mb-5" />
          <p className="relative z-10 text-[10px] uppercase" style={{ letterSpacing: "0.35em", color: DEF.muted }}>{invLabel}</p>
          <h1 className="relative z-10 mt-3 leading-tight" style={{ fontFamily: `'${fontH}', serif`, fontSize: "clamp(2.2rem,9vw,3.3rem)", fontWeight: 400 }}>
            {groomNick}<span style={{ color: laut }}> &amp; </span>{brideNick}
          </h1>
          <div className="am-orn relative z-10 mt-5"><span className="am-cengkeh" /></div>
          <p className="relative z-10 mt-4 text-[11px] italic" style={{ color: DEF.muted }}>Horas! Tondi Marnida</p>
          {guest?.name && <p className="relative z-10 mt-6 text-sm">Dear <span className="font-semibold">{guest.name}</span></p>}
          <motion.button onClick={handleOpen} whileTap={{ scale: 0.96 }}
            className="relative z-10 mt-9 px-9 py-3 rounded-full text-white text-sm tracking-wide shadow-lg"
            style={{ background: `linear-gradient(135deg, ${laut}, ${DEF.tosca})` }}>
            Buka Undangan
          </motion.button>
        </div>
      )}

      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
          {/* HERO */}
          <section className="relative flex flex-col items-center justify-end text-center overflow-hidden" style={{ minHeight: "88dvh", padding: "3rem 1.75rem 5rem" }}>
            {heroImage && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={heroImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${surface}44 0%, ${bg}f2 82%)` }} />
              </>
            )}
            <div className="relative z-10">
              <span className="am-cengkeh" />
              <p className="mt-3 text-[10px] uppercase" style={{ letterSpacing: "0.35em", color: laut }}>{invLabel}</p>
              <h1 className="mt-3 leading-tight" style={{ fontFamily: `'${fontH}', serif`, fontSize: "clamp(2.3rem,10vw,3.6rem)", fontWeight: 400 }}>
                {groomNick}<span style={{ color: laut }}> &amp; </span>{brideNick}
              </h1>
              {firstDate && <p className="mt-3 text-xs" style={{ letterSpacing: "0.25em", color: DEF.muted }}>{formatDate(firstDate)}</p>}
              {guest?.name && (
                <div className="mt-7 inline-block px-6 py-2.5 rounded-full border border-white/70 backdrop-blur-sm"
                  style={{ background: "#ffffffaa", borderColor: `${laut}33` }}>
                  <p className="text-xs">Dear <span className="font-semibold">{guest.name}</span></p>
                </div>
              )}
            </div>
          </section>

          {/* COUNTDOWN */}
          {(theme?.showCountdown ?? true) && countdownTarget && (
            <section className="py-13 px-6 py-14 am-wave-top" style={{ background: surface }}>
              <Head laut={laut} fontH={fontH} eyebrow="Menuju Hari Bahagia" />
              <CountdownInline target={countdownTarget} laut={laut} />
            </section>
          )}

          {/* COUPLE */}
          {has("COUPLE") && profile && (
            <section className="py-16 px-7">
              <Head laut={laut} fontH={fontH} eyebrow="Mempelai" title="Dua Hati Bersanding" />
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
                    viewport={{ once: false, amount: 0.15 }} transition={{ duration: 0.7 }}>
                    {p.photo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.photo} alt={p.name} className="w-44 h-52 object-cover mx-auto mb-5"
                        style={{ borderRadius: "14px", border: `3px solid ${surface}`, boxShadow: `0 10px 26px ${DEF.muted}33` }} />
                    )}
                    <h3 style={{ fontFamily: `'${fontH}', serif`, fontSize: "1.5rem", fontWeight: 400 }}>{p.nick || p.name}</h3>
                    <p className="text-xs mt-1" style={{ color: DEF.muted }}>{p.name}</p>
                    <div className="am-orn my-3"><span className="am-cengkeh" style={{ width: ".6rem", height: ".6rem" }} /></div>
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
              primaryColor={laut} bgColor={surface} textColor={text} fontBody={fontB}
            />
          )}

          {/* EVENTS */}
          {has("EVENT") && visibleEvents.length > 0 && (
            <section className="py-16 px-7 am-wave-top" style={{ background: surface }}>
              <Head laut={laut} fontH={fontH} eyebrow="Waktu & Tempat" title="Jadwal Acara" />
              <div className="max-w-sm mx-auto space-y-6">
                {visibleEvents.map((ev) => (
                  <motion.div key={ev.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.15 }} transition={{ duration: 0.65 }}
                    className="rounded-3xl bg-white/80 backdrop-blur-sm px-6 py-6 text-center space-y-3"
                    style={{ border: `1px solid ${laut}26`, boxShadow: `0 8px 22px ${DEF.muted}22` }}>
                    <p style={{ fontFamily: `'${fontH}', serif`, fontSize: "1.25rem", color: laut }}>
                      {ev.label || EVENT_TYPE_LABELS[ev.type] || ev.type}
                    </p>
                    {ev.date && <p className="text-sm flex items-center justify-center gap-2"><Calendar size={13} style={{ color: laut }} />{formatDate(ev.date)}</p>}
                    {(ev.timeStart || ev.timeEnd) && (
                      <p className="text-sm flex items-center justify-center gap-2"><Clock size={13} style={{ color: laut }} />{ev.timeStart}{ev.timeEnd ? ` - ${ev.timeEnd}` : ""} WIB</p>
                    )}
                    <div>
                      <p className="text-sm font-medium">{ev.venueName}</p>
                      <p className="text-xs mt-1" style={{ color: DEF.muted }}>{ev.venueAddress}</p>
                    </div>
                    {theme?.showMap !== false && ev.mapsUrl && (
                      <a href={ev.mapsUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-2 text-xs px-5 py-2 rounded-full text-white"
                        style={{ background: `linear-gradient(135deg, ${laut}, ${DEF.tosca})` }}>
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
            <section className="py-16 px-7">
              <Head laut={laut} fontH={fontH} eyebrow="Momen Bahagia" title="Galeri" />
              <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                {client.galleries.filter((g) => g.type === "GALLERY").map((g, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={g.id} src={g.url} alt="" loading="lazy"
                    className={`w-full object-cover rounded-2xl ${i % 2 === 0 ? "aspect-[4/5]" : "aspect-square mt-5"}`}
                    style={{ boxShadow: `0 8px 20px ${DEF.muted}30` }} />
                ))}
              </div>
            </section>
          )}

          {/* RSVP */}
          {has("RSVP") && (
            <section className="py-16 px-7 am-wave-top" style={{ background: surface }}>
              <Head laut={laut} fontH={fontH} eyebrow="Konfirmasi" title="RSVP" />
              {token && guest ? (
                <RsvpForm clientId={client.id} guest={guest} token={token} laut={laut}
                  menuItems={findMenuEvent(client.events, guest.invitationCategory ?? "")?.menuItems ?? []}
                  onConfirmed={setRsvpStatus} />
              ) : (
                <p className="text-center text-sm" style={{ color: DEF.muted }}>RSVP tersedia melalui link undangan personal.</p>
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
            primaryColor={laut} bgColor={surface} fontHeading={fontH} lang="id"
          />

          {/* WISHES */}
          {has("WISHES") && (
            !!guest && requireRsvpForWish && rsvpStatus !== "HADIR" && rsvpStatus !== "TIDAK_HADIR" ? (
            <WishesLockedPlaceholder primaryColor={laut} text={text} fontHeading={fontH} lang="id" />
          ) : (
            <WishesBlock clientId={client.id} initialWishes={client.wishes}
              guestName={guest?.name ?? null} guestId={guest?.id ?? null} laut={laut} />
          )
          )}

          {/* GIFT */}
          {has("GIFT") && client.gifts.length > 0 && (
            <GiftBlock gifts={client.gifts} laut={laut} />
          )}

          {/* CLOSING */}
          <footer className="py-20 px-7 text-center am-wave-top" style={{ background: surface }}>
            <span className="am-cengkeh" />
            <p className="mt-5 text-xl" style={{ fontFamily: `'${fontH}', serif`, color: laut }}>{groomNick} &amp; {brideNick}</p>
            <p className="mt-5 text-xs max-w-xs mx-auto leading-relaxed" style={{ color: DEF.muted }}>
              Saulak-sauling marhatai-hatai, doa dan restu Bapak/Ibu/Saudara/i sangat berharga bagi kami.
            </p>
            <p className="mt-8 text-[10px]" style={{ color: `${DEF.muted}88` }}>Digital Invitation</p>
          </footer>
        </motion.div>
      )}
    </div>
  );
}

function Head({ laut, fontH, eyebrow, title }: { laut: string; fontH: string; eyebrow: string; title?: string }) {
  return (
    <div className="text-center mb-10">
      <p className="text-[10px] uppercase" style={{ letterSpacing: "0.32em", color: DEF.muted }}>{eyebrow}</p>
      {title && <h2 className="mt-2 text-3xl" style={{ fontFamily: `'${fontH}', serif`, fontWeight: 400 }}>{title}</h2>}
      <div className="am-orn mt-4"><span className="am-cengkeh" style={{ width: ".6rem", height: ".6rem" }} /></div>
    </div>
  );
}

function CountdownInline({ target, laut }: { target: Date; laut: string }) {
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
    <div className="flex justify-center gap-5">
      {[{ v: t.d, l: "Hari" }, { v: t.h, l: "Jam" }, { v: t.m, l: "Menit" }, { v: t.s, l: "Detik" }].map(({ v, l }) => (
        <div key={l} className="text-center">
          <div className="text-3xl tabular-nums" style={{ fontFamily: "'Playfair Display',serif", color: laut }}>{String(v).padStart(2, "0")}</div>
          <div className="text-[9px] uppercase tracking-widest mt-1" style={{ color: DEF.muted }}>{l}</div>
        </div>
      ))}
    </div>
  );
}

function RsvpForm({
  clientId, guest, token, laut, menuItems, onConfirmed,
}: {
  clientId: string; guest: Guest; token: string; laut: string; menuItems: { id: string; name: string }[];
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
      <div className="max-w-sm mx-auto text-center bg-white/80 rounded-2xl px-6 py-9">
        <Check size={26} className="mx-auto" style={{ color: laut }} />
        <p className="mt-3 text-sm">Horas! Terima kasih atas konfirmasinya.</p>
      </div>
    );
  }

  const inputCls = "w-full rounded-full border px-5 py-2.5 text-sm focus:outline-none bg-white";
  const inputStyle = { borderColor: `${DEF.muted}66` };

  return (
    <div className="max-w-sm mx-auto space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {(["HADIR", "TIDAK_HADIR"] as const).map((s) => (
          <button key={s} onClick={() => setStatus(s)}
            className="py-3 rounded-full text-sm transition-colors"
            style={status === s
              ? { background: laut, color: "#fff" }
              : { background: "#fff", border: `1px solid ${DEF.muted}66` }}>
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
        placeholder="Pesan atau doa (opsional)" className={`${inputCls} !rounded-2xl resize-none`} style={inputStyle} />
      <button onClick={submit} disabled={sending}
        className="w-full py-3 rounded-full text-white text-sm disabled:opacity-60"
        style={{ background: `linear-gradient(135deg, ${laut}, ${DEF.tosca})` }}>
        {sending ? "Mengirim..." : "Konfirmasi Kehadiran"}
      </button>
    </div>
  );
}

function WishesBlock({
  clientId, initialWishes, guestName, guestId, laut,
}: {
  clientId: string; initialWishes: { id: string; name: string; message: string; reply: string | null; createdAt: Date }[];
  guestName: string | null; guestId: string | null; laut: string;
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

  const inputCls = "w-full rounded-full border px-5 py-2.5 text-sm focus:outline-none bg-white";
  const inputStyle = { borderColor: `${DEF.muted}66` };

  return (
    <section className="py-16 px-7">
      <Head laut={laut} fontH="Playfair Display" eyebrow="Pesan" title="Ucapan &amp; Doa" />
      <div className="max-w-sm mx-auto space-y-3">
        <input value={name} onChange={(e) => setName(e.target.value)} readOnly={!!guestName} placeholder="Nama Anda" className={inputCls} style={inputStyle} />
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3}
          placeholder="Tulis doa dan ucapan terbaik..." className={`${inputCls} !rounded-2xl resize-none`} style={inputStyle} />
        <button onClick={submit} disabled={sending}
          className="w-full py-3 rounded-full text-white text-sm disabled:opacity-60"
          style={{ background: `linear-gradient(135deg, ${laut}, ${DEF.tosca})` }}>
          {sending ? "Mengirim..." : "Kirim Ucapan"}
        </button>
      </div>
      <div className="max-w-sm mx-auto mt-10 space-y-4 max-h-96 overflow-y-auto pr-1">
        {wishes.length === 0 && (
          <p className="text-center text-xs" style={{ color: DEF.muted }}>Jadilah yang pertama memberikan ucapan...</p>
        )}
        {wishes.map((w) => (
          <div key={w.id} className="bg-white/80 rounded-2xl px-4 py-3">
            <p className="text-xs font-semibold" style={{ color: laut }}>{w.name}</p>
            <p className="text-sm mt-1">{w.message}</p>
            {w.reply && (
              <div className="mt-2 pl-3 border-l-2 text-xs" style={{ borderColor: laut, color: DEF.muted }}>
                Balasan: {w.reply}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function GiftBlock({ gifts, laut }: { gifts: TemplateProps["client"]["gifts"]; laut: string }) {
  const [copied, setCopied] = useState<string | null>(null);

  function copy(value: string, key: string) {
    navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <section className="py-16 px-7 am-wave-top" style={{ background: surfaceBg() }}>
      <Head laut={laut} fontH="Playfair Display" eyebrow="Hadiah" title="Amplop Digital" />
      <p className="text-center text-xs max-w-xs mx-auto -mt-4 mb-8" style={{ color: DEF.muted }}>
        Doa restu Anda adalah hadiah terbaik yang kami harapkan.
      </p>
      <div className="max-w-sm mx-auto space-y-4">
        {gifts.filter((g) => g.kind !== "ADDRESS").sort((a, b) => (a.kind === "BANK" ? 0 : a.kind === "EWALLET" ? 1 : 2) - (b.kind === "BANK" ? 0 : b.kind === "EWALLET" ? 1 : 2)).map((g) => (
          <GiftBankCard key={g.id} kind={g.kind} bankName={g.bankName} accountNumber={g.accountNumber}
            accountName={g.accountName} ewalletType={g.ewalletType} ewalletNumber={g.ewalletNumber}
            qrisImage={g.qrisImage} accent={laut} />
        ))}
        {gifts.filter((g) => g.kind === "ADDRESS").map((g) => (
          <GiftAddressCard key={g.id} receiverName={g.receiverName} receiverPhone={g.receiverPhone}
            address={g.address} accent={laut} />
        ))}
      </div>
    </section>
  );
}

function surfaceBg() {
  return "#e9f2f2";
}

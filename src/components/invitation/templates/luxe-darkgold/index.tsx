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
  gold: "#d4af37",
  night: "#0e0e10",
  panel: "#1a1a1e",
  text: "#efe9dc",
  muted: "#9b9483",
};

export default function LuxeDarkGoldTemplate({ guest, client, token }: TemplateProps) {
  const profile = client.weddingProfile;
  const theme = client.theme;

  const gold = theme?.primaryColor || DEF.gold;
  const bg = theme?.bgColor || DEF.night;
  const surface = theme?.secondaryColor || DEF.panel;
  const text = theme?.textColor || DEF.text;
  const fontH = theme?.fontHeading === "IBM Plex Sans" ? "Cinzel" : theme?.fontHeading || "Cinzel";
  const fontB = theme?.fontBody || "Lato";

  const music = client.musics[0];
  const heroImage = profile?.heroImage || client.galleries.find((g) => g.type === "HERO")?.url || null;
  const bgImage = heroImage || client.galleries.find((g) => g.type === "BACKGROUND")?.url || null;
  // Sections with an opaque surface color need to bleed through faintly when a background image is set.
  const surfaceBleed = bgImage ? `${surface}80` : surface;
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
    client.clientType === "ULANG_TAHUN" ? "GRAND CELEBRATION"
    : client.clientType === "KANTOR" ? "GALA NIGHT"
    : client.clientType === "SANGJIT" ? "SANGJIT CEREMONY"
    : client.clientType === "LAMARAN" ? "ENGAGEMENT"
    : "THE WEDDING OF";

  function handleOpen() {
    setOpen(true);
    playRef.current?.();
  }

  return (
    <div style={{
      background: bg, position: "relative",
      color: text, fontFamily: `'${fontB}', sans-serif`, minHeight: "100dvh",
    }}>
      <style>{`
        .lx-divider { display:flex; align-items:center; gap:.8rem; justify-content:center; }
        .lx-divider::before,.lx-divider::after { content:""; height:1px; width:52px; background:${gold}55; }
      `}</style>

      {bgImage && (
        <div className="fixed inset-0 -z-10" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={bgImage} alt="" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0" style={{ background: `${bg}99` }} />
        </div>
      )}

      {music && (
        <MusicPlayer url={music.url} title={music.title} registerPlay={(fn) => { playRef.current = fn; }} />
      )}

      {!open && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center text-center px-8" style={{ background: bg }}>
          {heroImage && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={heroImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
              <div className="absolute inset-0" style={{ background: `${bg}99` }} />
            </>
          )}
          <p className="relative z-10 text-[11px]" style={{ letterSpacing: "0.5em", color: gold, fontFamily: `'${fontH}', serif` }}>
            {invLabel}
          </p>
          <h1 className="relative z-10 mt-6 leading-tight" style={{ fontFamily: `'${fontH}', serif`, fontSize: "2.5rem", fontWeight: 700, letterSpacing: "0.08em" }}>
            {groomNick}<br /><span style={{ color: gold }}>&</span><br />{brideNick}
          </h1>
          <div className="lx-divider relative z-10 mt-6"><span style={{ color: gold, fontSize: ".7rem" }}>✦</span></div>
          {guest?.name && (
            <div className="relative z-10 mt-8">
              <p className="text-[10px]" style={{ letterSpacing: "0.35em", color: DEF.muted }}>KEPADA YTH.</p>
              <p className="mt-1.5 text-sm">{guest.name}</p>
            </div>
          )}
          <motion.button onClick={handleOpen} whileTap={{ scale: 0.96 }}
            className="relative z-10 mt-10 px-10 py-3 text-xs border"
            style={{ borderColor: gold, color: gold, letterSpacing: "0.3em", fontFamily: `'${fontH}', serif`, background: "#00000033" }}>
            BUKA UNDANGAN
          </motion.button>
        </div>
      )}

      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
          {/* HERO */}
          <section className="relative flex flex-col items-center justify-center text-center overflow-hidden"
            style={{ minHeight: "95dvh", padding: "4rem 1.5rem" }}>
            <div className="relative z-10">
              <p style={{ fontSize: ".65rem", letterSpacing: "0.5em", color: gold, fontFamily: `'${fontH}', serif` }}>{invLabel}</p>
              <h1 className="mt-8 leading-snug" style={{ fontFamily: `'${fontH}', serif`, fontWeight: 700, fontSize: "2.5rem", letterSpacing: "0.06em" }}>
                {groomNick}
                <span className="block my-2" style={{ color: gold, fontSize: ".6em" }}>✦ &amp; ✦</span>
                {brideNick}
              </h1>
            </div>
          </section>

          {/* COUNTDOWN */}
          {(theme?.showCountdown ?? true) && countdownTarget && (
            <section className="text-center py-14 px-6" style={{ background: surfaceBleed }}>
              <SectionHead gold={gold} fontH={fontH} label="SAVE THE DATE">Menuju Hari Bahagia</SectionHead>
              {firstDate && (
                <p className="text-[11px] -mt-4 mb-10" style={{ letterSpacing: "0.4em", color: DEF.muted }}>{formatDate(firstDate).toUpperCase()}</p>
              )}
              <CountdownInline target={countdownTarget} gold={gold} fontH={fontH} />
            </section>
          )}

          {/* COUPLE */}
          {has("COUPLE") && profile && (
            <section className="py-16 px-6" style={{ borderBottom: `1px solid ${gold}22` }}>
              <SectionHead gold={gold} fontH={fontH} label="MEMPELAI">Kami yang Berbahagia</SectionHead>
              {profile.openingQuote && (
                <p className="max-w-md mx-auto text-center italic text-sm leading-relaxed -mt-4 mb-12" style={{ color: text }}>
                  “{profile.openingQuote}”
                  {profile.openingQuoteBy && <span className="block not-italic mt-2 text-xs">— {profile.openingQuoteBy}</span>}
                </p>
              )}
              <div className="max-w-sm mx-auto space-y-14 text-center">
                {([
                  { name: profile.groomName, nick: profile.groomNickname, parents: profile.groomParents, photo: profile.showGroomPhoto ? profile.groomPhoto : null },
                  { name: profile.brideName, nick: profile.brideNickname, parents: profile.brideParents, photo: profile.showBridePhoto ? profile.bridePhoto : null },
                ]).map((p, i) => p.name && (
                  <motion.div key={i} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.15 }} transition={{ duration: 0.8 }}>
                    {p.photo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.photo} alt={p.name} className="w-44 h-44 object-cover mx-auto mb-6"
                        style={{ borderRadius: "50%", border: `2px solid ${gold}`, padding: "4px", boxShadow: `0 0 24px ${gold}33` }} />
                    )}
                    <h3 style={{ fontFamily: `'${fontH}', serif`, fontSize: "2.5rem", letterSpacing: "0.05em" }}>{p.nick || p.name}</h3>
                    <p className="text-xs mt-1.5" style={{ color: DEF.muted }}>{p.name}</p>
                    <div className="lx-divider my-3"><span style={{ color: gold, fontSize: ".6rem" }}>✦</span></div>
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
            <section className="py-16 px-6" style={{ borderBottom: `1px solid ${gold}22` }}>
              <SectionHead gold={gold} fontH={fontH} label="JADWAL">Waktu &amp; Tempat</SectionHead>
              <div className="max-w-sm mx-auto space-y-5">
                {visibleEvents.map((ev) => (
                  <motion.div key={ev.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.15 }} transition={{ duration: 0.7 }}
                    className="text-center px-6 py-8 border"
                    style={{ borderColor: `${gold}44`, background: `linear-gradient(180deg, ${surface}, ${bg})` }}>
                    <p style={{ fontFamily: `'${fontH}', serif`, fontSize: "1.15rem", letterSpacing: "0.12em", color: gold }}>
                      {ev.label || EVENT_TYPE_LABELS[ev.type] || ev.type}
                    </p>
                    <div className="lx-divider my-4"><span style={{ color: gold, fontSize: ".6rem" }}>✦</span></div>
                    {ev.date && <p className="text-sm flex items-center justify-center gap-2"><Calendar size={13} style={{ color: gold }} />{formatDate(ev.date)}</p>}
                    {(ev.timeStart || ev.timeEnd) && (
                      <p className="text-sm mt-1.5 flex items-center justify-center gap-2"><Clock size={13} style={{ color: gold }} />{ev.timeStart}{ev.timeEnd ? ` - ${ev.timeEnd}` : ""} WIB</p>
                    )}
                    <p className="mt-4 text-sm font-medium">{ev.venueName}</p>
                    <p className="text-xs mt-1" style={{ color: DEF.muted }}>{ev.venueAddress}</p>
                    {theme?.showMap !== false && ev.mapsUrl && (
                      <a href={ev.mapsUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-block mt-5 text-[11px] px-6 py-2 border transition-colors"
                        style={{ borderColor: gold, color: gold, letterSpacing: "0.2em", fontFamily: `'${fontH}', serif` }}>
                        LIHAT LOKASI
                      </a>
                    )}
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* RSVP */}
          {has("RSVP") && (
            <section className="py-16 px-6" style={{ borderBottom: `1px solid ${gold}22` }}>
              <SectionHead gold={gold} fontH={fontH} label="KONFIRMASI">RSVP</SectionHead>
              {token && guest ? (
                <RsvpForm clientId={client.id} guest={guest} token={token} gold={gold}
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
            primaryColor={gold} bgColor={surface} fontHeading={fontH} lang="id"
          />

          {/* GALLERY */}
          {has("GALLERY") && client.galleries.filter((g) => g.type === "GALLERY").length > 0 && (
            <section className="py-16 px-6" style={{ borderBottom: `1px solid ${gold}22` }}>
              <SectionHead gold={gold} fontH={fontH} label="MOMEN">Galeri</SectionHead>
              <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
                {client.galleries.filter((g) => g.type === "GALLERY").map((g, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={g.id} src={g.url} alt="" loading="lazy"
                    className={`w-full object-cover ${i % 3 === 0 ? "col-span-2 aspect-[16/10]" : "aspect-square"}`}
                    style={{ border: `1px solid ${gold}33` }} />
                ))}
              </div>
            </section>
          )}

          {/* WISHES */}
          {has("WISHES") && (
            !!guest && requireRsvpForWish && rsvpStatus !== "HADIR" && rsvpStatus !== "TIDAK_HADIR" ? (
            <WishesLockedPlaceholder primaryColor={gold} text={text} fontHeading={fontH} lang="id" />
          ) : (
            <WishesBlock clientId={client.id} initialWishes={client.wishes}
              guestName={guest?.name ?? null} guestId={guest?.id ?? null}
              gold={gold} surface={surface} fontH={fontH} />
          )
          )}

          {/* GIFT */}
          {has("GIFT") && client.gifts.length > 0 && (
            <GiftBlock gifts={client.gifts} gold={gold} surface={surface} fontH={fontH} />
          )}

          {/* CLOSING */}
          <footer className="py-20 px-6 text-center">
            <div className="lx-divider mb-6"><span style={{ color: gold, fontSize: ".7rem" }}>✦</span></div>
            <p className="text-[10px]" style={{ letterSpacing: "0.45em", color: DEF.muted }}>WITH LOVE</p>
            <p className="mt-4" style={{ fontFamily: `'${fontH}', serif`, color: gold, fontSize: "2.5rem", letterSpacing: "0.08em" }}>
              {groomNick} &amp; {brideNick}
            </p>
            <p className="mt-6 text-xs max-w-xs mx-auto" style={{ color: DEF.muted }}>
              Merupakan kehormatan dan kebahagiaan kami apabila Bapak/Ibu/Saudara/i berkenan hadir.
            </p>
          </footer>
        </motion.div>
      )}
    </div>
  );
}

function SectionHead({ gold, fontH, label, children }: { gold: string; fontH: string; label: string; children: React.ReactNode }) {
  return (
    <div className="text-center mb-12">
      <p className="text-[10px]" style={{ letterSpacing: "0.5em", color: DEF.muted }}>{label}</p>
      <h2 className="mt-3 text-2xl" style={{ fontFamily: `'${fontH}', serif`, color: gold, letterSpacing: "0.06em" }}>{children}</h2>
      <div className="lx-divider mt-5"><span style={{ color: gold, fontSize: ".6rem" }}>✦</span></div>
    </div>
  );
}

function CountdownInline({ target, gold, fontH }: { target: Date; gold: string; fontH: string }) {
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
      {[{ v: t.d, l: "HARI" }, { v: t.h, l: "JAM" }, { v: t.m, l: "MENIT" }, { v: t.s, l: "DETIK" }].map(({ v, l }) => (
        <div key={l} className="w-16 py-3 text-center border" style={{ borderColor: `${gold}44`, background: DEF.panel }}>
          <div style={{ fontFamily: `'${fontH}', serif`, fontSize: "1.6rem", color: gold }}>{String(v).padStart(2, "0")}</div>
          <div className="text-[8px] mt-1" style={{ letterSpacing: "0.25em", color: DEF.muted }}>{l}</div>
        </div>
      ))}
    </div>
  );
}

function RsvpForm({
  clientId, guest, token, gold, menuItems, onConfirmed,
}: {
  clientId: string; guest: Guest; token: string; gold: string; menuItems: { id: string; name: string }[];
  onConfirmed: (s: string) => void;
}) {
  const [status, setStatus] = useState<"HADIR" | "TIDAK_HADIR">("HADIR");
  const [pax, setPax] = useState(1);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(!!guest.rsvp);
  const [menuChoices, setMenuChoices] = useState<string[]>([]);

  async function submit() {
    setSending(true);
    const res = await fetch("/api/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token, clientId, guestId: guest.id,
        name: guest.name, paxCount: status === "HADIR" ? pax : 0,
        status,
        menuChoices: menuItems.length > 0 && status === "HADIR" ? menuChoices.slice(0, pax).filter(Boolean) : undefined,
      }),
    });
    if (res.ok) {
      setDone(true);
      onConfirmed(status);
    }
    setSending(false);
  }

  if (done) {
    return (
      <div className="max-w-sm mx-auto text-center px-6 py-10 border" style={{ borderColor: `${gold}44`, background: DEF.panel }}>
        <Check size={28} className="mx-auto" style={{ color: gold }} />
        <p className="mt-4 text-sm">Terima kasih atas konfirmasinya.</p>
      </div>
    );
  }

  const inputCls = "w-full px-4 py-2.5 text-sm focus:outline-none bg-transparent";
  const inputStyle = { border: `1px solid ${gold}44`, color: DEF.text };

  return (
    <div className="max-w-sm mx-auto space-y-3.5">
      <div className="grid grid-cols-2 gap-3">
        {(["HADIR", "TIDAK_HADIR"] as const).map((s) => (
          <button key={s} onClick={() => setStatus(s)}
            className="py-3 text-[11px] border transition-colors"
            style={status === s
              ? { borderColor: gold, background: gold, color: "#0e0e10", letterSpacing: "0.2em", fontFamily: "'Cinzel',serif" }
              : { borderColor: `${gold}44`, color: DEF.text, letterSpacing: "0.2em", fontFamily: "'Cinzel',serif" }}>
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
      <button onClick={submit} disabled={sending}
        className="w-full py-3 text-[11px] disabled:opacity-60"
        style={{ background: gold, color: "#0e0e10", letterSpacing: "0.3em", fontFamily: "'Cinzel',serif" }}>
        {sending ? "MENGIRIM..." : "KONFIRMASI KEHADIRAN"}
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
  const inputStyle = { border: `1px solid ${gold}44`, color: DEF.text };

  return (
    <section className="py-16 px-6" style={{ borderBottom: `1px solid ${gold}22` }}>
      <SectionHead gold={gold} fontH={fontH} label="PESAN">Ucapan &amp; Doa</SectionHead>
      <div className="max-w-sm mx-auto space-y-3">
        <input value={name} onChange={(e) => setName(e.target.value)} readOnly={!!guestName} placeholder="Nama Anda" className={inputCls} style={inputStyle} />
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3}
          placeholder="Tulis doa dan ucapan terbaik..." className={`${inputCls} resize-none`} style={inputStyle} />
        <button onClick={submit} disabled={sending}
          className="w-full py-3 text-[11px] disabled:opacity-60"
          style={{ background: gold, color: "#0e0e10", letterSpacing: "0.3em", fontFamily: "'Cinzel',serif" }}>
          {sending ? "MENGIRIM..." : "KIRIM UCAPAN"}
        </button>
      </div>
      <div className="max-w-sm mx-auto mt-10 space-y-4 max-h-96 overflow-y-auto pr-1">
        {wishes.length === 0 && (
          <p className="text-center text-xs" style={{ color: DEF.muted }}>Jadilah yang pertama memberikan ucapan...</p>
        )}
        {wishes.map((w) => (
          <div key={w.id} className="px-4 py-3 border" style={{ borderColor: `${gold}26`, background: surface }}>
            <p className="text-xs" style={{ color: gold, fontFamily: `'${fontH}',serif`, letterSpacing: "0.08em" }}>{w.name}</p>
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
  gifts, gold, surface, fontH,
}: {
  gifts: TemplateProps["client"]["gifts"]; gold: string; surface: string; fontH: string;
}) {
  const [copied, setCopied] = useState<string | null>(null);

  function copy(value: string, key: string) {
    navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <section className="py-16 px-6" style={{ borderBottom: `1px solid ${gold}22` }}>
      <SectionHead gold={gold} fontH={fontH} label="HADIAH">Amplop Digital</SectionHead>
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

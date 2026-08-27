"use client";

import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useAutoScroll } from "@/hooks/useAutoScroll";
import { MapPin, Calendar, Clock, Copy, Check, Flower2 } from "lucide-react";
import { MusicPlayer } from "../../sections/MusicPlayer";
import { GiftAddressCard } from "../../sections/GiftAddressCard";
import { GiftBankCard } from "../../sections/GiftBankCard";
import { CountdownTimer } from "../../sections/CountdownTimer";
import { BarcodeSection, getEventVenueName } from "../../sections/BarcodeSection";
import { AttentionSection } from "../../sections/AttentionSection";
import { formatDate } from "@/lib/utils";
import { getEventsForGuestCategory, EVENT_TYPE_LABELS } from "@/lib/categories";
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
  rose: "#c98283",
  blush: "#faf0ef",
  petal: "#f7e4e1",
  text: "#5c4444",
  muted: "#a08b8b",
};

export default function FloralBlushTemplate({ guest, client, token }: TemplateProps) {
  const profile = client.weddingProfile;
  const theme = client.theme;

  const rose = theme?.primaryColor || DEF.rose;
  const bg = theme?.bgColor || DEF.blush;
  const surface = theme?.secondaryColor || DEF.petal;
  const text = theme?.textColor || DEF.text;
  const fontH = theme?.fontHeading === "IBM Plex Sans" ? "Great Vibes" : theme?.fontHeading || "Great Vibes";
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
    client.clientType === "ULANG_TAHUN" ? "Birthday Celebration"
    : client.clientType === "KANTOR" ? "Gathering Invitation"
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
        .fb-flower { position: absolute; opacity: 0.14; pointer-events: none; }
      `}</style>

      {music && (
        <MusicPlayer url={music.url} title={music.title} registerPlay={(fn) => { playRef.current = fn; }} />
      )}

      {!open && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center text-center px-8 overflow-hidden" style={{ background: surface }}>
          {heroImage && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={heroImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: `${surface}d9` }} />
            </>
          )}
          <Flower2 className="relative z-10 mb-6 animate-pulse" size={30} style={{ color: rose }} />
          <p className="relative z-10 text-[11px] tracking-[0.3em] uppercase" style={{ color: rose }}>{invLabel}</p>
          <h1 className="relative z-10 mt-4 leading-snug" style={{ fontFamily: `'${fontH}', cursive`, fontSize: "clamp(2.6rem, 11vw, 4rem)", fontWeight: 400 }}>
            {groomNick} & {brideNick}
          </h1>
          {firstDate && (
            <p className="relative z-10 mt-2 text-xs tracking-[0.2em]" style={{ color: DEF.muted }}>{formatDate(firstDate)}</p>
          )}
          {guest?.name && (
            <div className="relative z-10 mt-9">
              <p className="text-[10px] tracking-[0.25em] uppercase" style={{ color: DEF.muted }}>Dear</p>
              <p className="mt-1 text-sm font-medium">{guest.name}</p>
            </div>
          )}
          <motion.button onClick={handleOpen}
            whileTap={{ scale: 0.96 }}
            className="relative z-10 mt-9 px-9 py-3 rounded-full text-white text-sm tracking-wide shadow-lg"
            style={{ background: `linear-gradient(135deg, ${rose}, ${rose}cc)` }}>
            Buka Undangan
          </motion.button>
        </div>
      )}

      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
          {/* HERO */}
          <section className="relative flex flex-col items-center justify-end text-center overflow-hidden"
            style={{ minHeight: "92dvh", padding: "3rem 1.5rem 4rem" }}>
            {heroImage && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={heroImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${surface}55 0%, ${bg}dd 75%)` }} />
              </>
            )}
            <div className="relative z-10">
              <Flower2 size={22} style={{ color: rose, margin: "0 auto 1rem" }} />
              <p className="text-[11px] tracking-[0.35em] uppercase" style={{ color: rose }}>{invLabel}</p>
              <h1 className="mt-4 leading-tight" style={{ fontFamily: `'${fontH}', cursive`, fontSize: "clamp(2.8rem, 12vw, 4.5rem)", fontWeight: 400 }}>
                {groomNick} & {brideNick}
              </h1>
              {firstDate && (
                <p className="mt-3 text-xs tracking-[0.25em] uppercase" style={{ color: DEF.muted }}>{formatDate(firstDate)}</p>
              )}
              {guest?.name && (
                <div className="mt-8 inline-block px-6 py-3 rounded-full border border-white/60 backdrop-blur-sm"
                  style={{ background: "#ffffff88", borderColor: `${rose}33` }}>
                  <p className="text-[10px] tracking-[0.2em]" style={{ color: DEF.muted }}>DEAR</p>
                  <p className="text-sm font-medium mt-0.5">{guest.name}</p>
                </div>
              )}
            </div>
          </section>

          {/* COUNTDOWN */}
          {(theme?.showCountdown ?? true) && countdownTarget && (
            <section className="text-center py-14 px-6" style={{ background: surface }}>
              <SectionHead eyebrow="Save The Date" gold={rose} fontH={fontH}>Menuju Hari Bahagia</SectionHead>
              <div className="flex justify-center">
                <CountdownTimer targetDate={countdownTarget} />
              </div>
            </section>
          )}

          {/* COUPLE */}
          {has("COUPLE") && profile && (
            <section className="py-16 px-6">
              <SectionHead eyebrow="Mempelai" gold={rose} fontH={fontH}>Kedua Mempelai</SectionHead>
              {profile.openingQuote && (
                <p className="max-w-md mx-auto text-center italic text-sm leading-relaxed -mt-4 mb-12" style={{ color: DEF.muted }}>
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
                    className="text-center relative">
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-40 rounded-[3rem] -z-0"
                      style={{ background: i === 0 ? `${surface}` : `${surface}aa`, transform: "rotate(-2deg)" }} />
                    {p.photo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.photo} alt={p.name}
                        className="relative w-48 h-56 object-cover mx-auto pt-2"
                        style={{ borderRadius: "45% 45% 38% 38% / 42% 42% 58% 58%", boxShadow: `0 12px 32px ${DEF.muted}33` }} />
                    )}
                    <p className="relative mt-6 text-3xl" style={{ fontFamily: `'${fontH}', cursive`, color: rose }}>{p.nick || p.name}</p>
                    <p className="relative text-xs mt-1" style={{ color: DEF.muted }}>{p.name}</p>
                    {p.parents && <p className="relative text-xs mt-3 leading-relaxed" style={{ color: DEF.muted }}>Putra/Putri dari<br />{p.parents}</p>}
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
              primaryColor={rose} bgColor={surface} textColor={text} fontBody={fontB}
            />
          )}

          {/* EVENTS */}
          {has("EVENT") && visibleEvents.length > 0 && (
            <section className="py-16 px-6" style={{ background: surface }}>
              <SectionHead eyebrow="Waktu & Tempat" gold={rose} fontH={fontH}>Detail Acara</SectionHead>
              <div className="max-w-sm mx-auto space-y-6">
                {visibleEvents.map((ev) => (
                  <motion.div key={ev.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.15 }} transition={{ duration: 0.6 }}
                    className="rounded-[2rem] bg-white/70 backdrop-blur-sm px-6 py-6 text-center space-y-3 border"
                    style={{ borderColor: `${rose}26` }}>
                    <p className="text-xl" style={{ fontFamily: `'${fontH}', cursive`, color: rose }}>
                      {ev.label || EVENT_TYPE_LABELS[ev.type] || ev.type}
                    </p>
                    {ev.date && <p className="text-sm flex items-center justify-center gap-2"><Calendar size={13} style={{ color: rose }} />{formatDate(ev.date)}</p>}
                    {(ev.timeStart || ev.timeEnd) && (
                      <p className="text-sm flex items-center justify-center gap-2"><Clock size={13} style={{ color: rose }} />{ev.timeStart}{ev.timeEnd ? ` - ${ev.timeEnd}` : ""} WIB</p>
                    )}
                    <div>
                      <p className="text-sm font-medium">{ev.venueName}</p>
                      <p className="text-xs mt-1" style={{ color: DEF.muted }}>{ev.venueAddress}</p>
                    </div>
                    {theme?.showMap !== false && ev.mapsUrl && (
                      <a href={ev.mapsUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs px-5 py-2 rounded-full text-white mt-1"
                        style={{ background: rose }}>
                        <MapPin size={12} /> Lihat Lokasi
                      </a>
                    )}
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* GALLERY */}
          {has("GALLERY") && client.galleries.filter((g) => g.type === "GALLERY").length > 0 && (
            <section className="py-16 px-6">
              <SectionHead eyebrow="Momen Bahagia" gold={rose} fontH={fontH}>Galeri</SectionHead>
              <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                {client.galleries.filter((g) => g.type === "GALLERY").map((g, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={g.id} src={g.url} alt="" loading="lazy"
                    className={`w-full object-cover rounded-2xl ${i % 2 === 0 ? "aspect-[3/4]" : "aspect-square mt-6"}`} />
                ))}
              </div>
            </section>
          )}

          {/* RSVP */}
          {has("RSVP") && (
            <section className="py-16 px-6" style={{ background: surface }}>
              <SectionHead eyebrow="Konfirmasi" gold={rose} fontH={fontH}>RSVP</SectionHead>
              {token && guest ? (
                <RsvpForm clientId={client.id} guest={guest} token={token} rose={rose}
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
              primaryColor={rose} bgColor={surface} fontHeading={fontH} lang="id"
            />
          )}

          {/* WISHES */}
          {has("WISHES") && (
            <WishesBlock clientId={client.id} initialWishes={client.wishes}
              guestName={guest?.name ?? null} guestId={guest?.id ?? null}
              rose={rose} surface={surface} fontH={fontH} />
          )}

          {/* GIFT */}
          {has("GIFT") && client.gifts.length > 0 && (
            <GiftBlock gifts={client.gifts} rose={rose} surface={surface} fontH={fontH} />
          )}

          {/* CLOSING */}
          <footer className="py-20 px-6 text-center" style={{ background: surface }}>
            <Flower2 size={20} style={{ color: rose, margin: "0 auto 1rem" }} />
            <p className="text-3xl" style={{ fontFamily: `'${fontH}', cursive`, color: rose }}>{groomNick} & {brideNick}</p>
            <p className="mt-5 text-xs max-w-xs mx-auto leading-relaxed" style={{ color: DEF.muted }}>
              Kehadiran dan doa restu Anda adalah kebahagiaan terbesar kami.
            </p>
            <p className="mt-8 text-[10px]" style={{ color: `${DEF.muted}88` }}>Made with love · Digital Invitation</p>
          </footer>
        </motion.div>
      )}
    </div>
  );
}

function SectionHead({ eyebrow, gold, fontH, children }: { eyebrow: string; gold: string; fontH: string; children: React.ReactNode }) {
  return (
    <div className="text-center mb-10">
      <p className="text-[10px] uppercase tracking-[0.35em]" style={{ color: DEF.muted }}>{eyebrow}</p>
      <h2 className="mt-2 text-3xl" style={{ fontFamily: `'${fontH}', cursive`, color: gold }}>{children}</h2>
    </div>
  );
}

function RsvpForm({
  clientId, guest, token, rose, needsSoup, onConfirmed,
}: {
  clientId: string; guest: Guest; token: string; rose: string; needsSoup: boolean;
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
      <div className="max-w-sm mx-auto text-center rounded-[2rem] bg-white/70 px-6 py-10">
        <Check size={28} className="mx-auto" style={{ color: rose }} />
        <p className="mt-3 text-sm font-medium">Terima kasih!</p>
        <p className="text-xs mt-1" style={{ color: DEF.muted }}>Konfirmasi kehadiran telah diterima.</p>
      </div>
    );
  }

  const inputCls = "w-full rounded-full border px-5 py-2.5 text-sm focus:outline-none";
  const inputStyle = { borderColor: `${rose}33`, background: "#ffffffcc" };

  return (
    <div className="max-w-sm mx-auto space-y-3.5">
      <div className="grid grid-cols-2 gap-3">
        {(["HADIR", "TIDAK_HADIR"] as const).map((s) => (
          <button key={s} onClick={() => setStatus(s)}
            className="py-3 rounded-full text-sm font-medium border-2 transition-colors"
            style={status === s
              ? { borderColor: rose, background: rose, color: "#fff" }
              : { borderColor: `${rose}33`, background: "#ffffffcc", color: DEF.text }}>
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
        placeholder="Pesan atau doa (opsional)" className={`${inputCls} !rounded-2xl`} style={inputStyle} />
      <button onClick={submit} disabled={sending}
        className="w-full py-3 rounded-full text-white text-sm font-medium disabled:opacity-60 shadow"
        style={{ background: `linear-gradient(135deg, ${rose}, ${rose}cc)` }}>
        {sending ? "Mengirim..." : "Konfirmasi Kehadiran"}
      </button>
    </div>
  );
}

function WishesBlock({
  clientId, initialWishes, guestName, guestId, rose, surface, fontH,
}: {
  clientId: string; initialWishes: { id: string; name: string; message: string; reply: string | null; createdAt: Date }[];
  guestName: string | null; guestId: string | null; rose: string; surface: string; fontH: string;
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

  const inputStyle = { borderColor: `${rose}33`, background: "#ffffffcc" };

  return (
    <section className="py-16 px-6">
      <SectionHead eyebrow="Pesan" gold={rose} fontH={fontH}>Ucapan & Doa</SectionHead>
      <div className="max-w-sm mx-auto space-y-3">
        <input value={name} onChange={(e) => setName(e.target.value)} readOnly={!!guestName} placeholder="Nama Anda"
          className="w-full rounded-full border px-5 py-2.5 text-sm focus:outline-none" style={inputStyle} />
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3}
          placeholder="Tulis doa dan ucapan terbaik..."
          className="w-full rounded-2xl border px-5 py-2.5 text-sm focus:outline-none" style={inputStyle} />
        <button onClick={submit} disabled={sending}
          className="w-full py-3 rounded-full text-white text-sm font-medium disabled:opacity-60"
          style={{ background: `linear-gradient(135deg, ${rose}, ${rose}cc)` }}>
          {sending ? "Mengirim..." : "Kirim Ucapan"}
        </button>
      </div>
      <div className="max-w-sm mx-auto mt-10 space-y-4 max-h-96 overflow-y-auto pr-1">
        {wishes.length === 0 && (
          <p className="text-center text-xs" style={{ color: DEF.muted }}>Jadilah yang pertama memberikan ucapan...</p>
        )}
        {wishes.map((w) => (
          <div key={w.id} className="rounded-2xl px-4 py-3" style={{ background: surface }}>
            <p className="text-xs font-semibold" style={{ color: rose }}>{w.name}</p>
            <p className="text-sm mt-1">{w.message}</p>
            {w.reply && (
              <div className="mt-2 pl-3 border-l-2 text-xs" style={{ borderColor: rose, color: DEF.muted }}>
                <span className="font-medium" style={{ color: rose }}>Balasan: </span>{w.reply}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function GiftBlock({
  gifts, rose, surface, fontH,
}: {
  gifts: TemplateProps["client"]["gifts"]; rose: string; surface: string; fontH: string;
}) {
  const [copied, setCopied] = useState<string | null>(null);

  function copy(value: string, key: string) {
    navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <section className="py-16 px-6" style={{ background: surface }}>
      <SectionHead eyebrow="Hadiah" gold={rose} fontH={fontH}>Amplop Digital</SectionHead>
      <p className="text-center text-xs max-w-xs mx-auto -mt-4 mb-8" style={{ color: DEF.muted }}>
        Doa restu Anda adalah hadiah terbaik yang kami harapkan.
      </p>
      <div className="max-w-sm mx-auto space-y-4">
        {gifts.filter((g) => g.kind !== "ADDRESS").sort((a, b) => (a.kind === "BANK" ? 0 : a.kind === "EWALLET" ? 1 : 2) - (b.kind === "BANK" ? 0 : b.kind === "EWALLET" ? 1 : 2)).map((g) => (
          <GiftBankCard key={g.id} kind={g.kind} bankName={g.bankName} accountNumber={g.accountNumber}
            accountName={g.accountName} ewalletType={g.ewalletType} ewalletNumber={g.ewalletNumber}
            qrisImage={g.qrisImage} accent={rose} />
        ))}
        {gifts.filter((g) => g.kind === "ADDRESS").map((g) => (
          <GiftAddressCard key={g.id} receiverName={g.receiverName} receiverPhone={g.receiverPhone}
            address={g.address} accent={rose} />
        ))}
      </div>
    </section>
  );
}

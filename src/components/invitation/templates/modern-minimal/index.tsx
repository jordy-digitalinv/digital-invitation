"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useAutoScroll } from "@/hooks/useAutoScroll";
import { MapPin, ArrowUpRight, Copy, Check } from "lucide-react";
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

const DEF = {
  ink: "#1c1c1c",
  paper: "#fafaf8",
  line: "#e5e3de",
  muted: "#8b8b85",
};

export default function ModernMinimalTemplate({ guest, client, token }: TemplateProps) {
  const profile = client.weddingProfile;
  const theme = client.theme;

  const accent = theme?.primaryColor || DEF.ink;
  const bg = theme?.bgColor || DEF.paper;
  const surface = theme?.secondaryColor || "#f1f0ec";
  const text = theme?.textColor || DEF.ink;
  const fontH = theme?.fontHeading === "Playfair Display" ? "IBM Plex Sans" : theme?.fontHeading || "IBM Plex Sans";
  const fontB = theme?.fontBody || "IBM Plex Sans";

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
  const showCountdown = theme?.showCountdown ?? false;

  const sectionKeys = client.sections.map((s) => s.sectionKey);
  const has = (k: string) => sectionKeys.length === 0 || sectionKeys.includes(k);
  const visibleEvents = useMemo(
    () => getEventsForGuestCategory(client.events, guest?.invitationCategory),
    [client.events, guest?.invitationCategory]
  );

  const groomNick = profile?.groomNickname || profile?.groomName || "";
  const brideNick = profile?.brideNickname || profile?.brideName || "";
  const invLabel =
    client.clientType === "ULANG_TAHUN" ? "CELEBRATION"
    : client.clientType === "KANTOR" ? "GATHERING"
    : client.clientType === "SANGJIT" ? "SANGJIT"
    : client.clientType === "LAMARAN" ? "LAMARAN"
    : "THE WEDDING OF";

  function handleOpen() {
    setOpen(true);
    playRef.current?.();
  }

  return (
    <div style={{ background: bg, color: text, fontFamily: `'${fontB}', system-ui, sans-serif`, minHeight: "100dvh" }}>
      {music && (
        <MusicPlayer url={music.url} title={music.title} registerPlay={(fn) => { playRef.current = fn; }} />
      )}

      {!open && (
        <motion.div className="fixed inset-0 z-50 flex flex-col" initial={{ opacity: 1 }} style={{ background: bg }}>
          <div className="flex-1 relative overflow-hidden">
            {heroImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={heroImage} alt="" className="w-full h-full object-cover" />
            )}
          </div>
          <div className="px-8 py-10 text-left space-y-6" style={{ borderTop: `1px solid ${DEF.line}` }}>
            <p className="text-[11px] tracking-[0.4em]" style={{ color: DEF.muted }}>{invLabel}</p>
            <h1 className="text-4xl font-light tracking-tight leading-none">{groomNick} <span style={{ color: accent }}>/</span> {brideNick}</h1>
            {firstDate && (
              <p className="text-xs tracking-[0.25em] uppercase" style={{ color: DEF.muted }}>{formatDate(firstDate)}</p>
            )}
            {guest?.name && (
              <p className="text-xs" style={{ color: DEF.muted }}>Dear. <span style={{ color: text }}>{guest.name}</span></p>
            )}
            <button onClick={handleOpen}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-full text-sm text-white"
              style={{ background: accent }}>
              Buka Undangan <ArrowUpRight size={14} />
            </button>
          </div>
        </motion.div>
      )}

      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
          {/* HERO */}
          <section className="relative" style={{ minHeight: "70dvh" }}>
            {heroImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={heroImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
            )}
            <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, transparent 30%, ${bg} 100%)` }} />
            <div className="absolute bottom-10 left-6 right-6">
              <p className="text-[11px] tracking-[0.4em]" style={{ color: DEF.muted }}>{invLabel}</p>
              <h1 className="mt-3 text-5xl font-light tracking-tight leading-none">
                {groomNick} <span style={{ color: accent }}>/</span> {brideNick}
              </h1>
            </div>
          </section>

          {/* INTRO + COUNTDOWN */}
          {(showCountdown || profile?.openingQuote) && (
            <section className="px-6 py-16 text-center space-y-8" style={{ borderBottom: `1px solid ${DEF.line}` }}>
              {profile?.openingQuote && (
                <p className="max-w-sm mx-auto text-sm leading-relaxed" style={{ color: DEF.muted }}>
                  “{profile.openingQuote}”
                  {profile.openingQuoteBy && <span className="block mt-2 text-xs">— {profile.openingQuoteBy}</span>}
                </p>
              )}
              {showCountdown && countdownTarget && (
                <SimpleCountdown target={countdownTarget} accent={accent} />
              )}
            </section>
          )}

          {/* COUPLE */}
          {has("COUPLE") && profile && (
            <section className="px-6 py-16 space-y-14" style={{ borderBottom: `1px solid ${DEF.line}` }}>
              {([
                { name: profile.groomName, nick: profile.groomNickname, parents: profile.groomParents, photo: profile.showGroomPhoto ? profile.groomPhoto : null },
                { name: profile.brideName, nick: profile.brideNickname, parents: profile.brideParents, photo: profile.showBridePhoto ? profile.bridePhoto : null },
              ]).map((p, i) => p.name && (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, amount: 0.15 }} transition={{ duration: 0.6 }}
                  className="flex items-center gap-6 max-w-md mx-auto">
                  {p.photo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.photo} alt={p.name} className="w-24 h-24 rounded-full object-cover shrink-0"
                      style={{ border: `2px solid ${accent}` }} />
                  )}
                  <div>
                    <p className="text-[10px] tracking-[0.3em] uppercase" style={{ color: DEF.muted }}>{i === 0 ? "Mempelai Pria" : "Mempelai Wanita"}</p>
                    <h3 className="mt-1 text-xl font-light">{p.nick || p.name}</h3>
                    <p className="text-xs mt-0.5" style={{ color: DEF.muted }}>{p.name}</p>
                    {p.parents && <p className="text-[11px] mt-2 leading-relaxed" style={{ color: DEF.muted }}>Anak dari {p.parents}</p>}
                  </div>
                </motion.div>
              ))}
            </section>
          )}

          {/* ATTENTION */}
          {profile?.attentionContent && (
            <AttentionSection
              title={profile.attentionTitle} content={profile.attentionContent}
              titleEn={null} contentEn={null} lang="ID"
              primaryColor={accent} bgColor={bg} textColor={text} fontBody={fontB}
            />
          )}

          {/* EVENTS */}
          {has("EVENT") && visibleEvents.length > 0 && (
            <section className="px-6 py-16" style={{ borderBottom: `1px solid ${DEF.line}` }}>
              <p className="text-[11px] tracking-[0.4em] uppercase mb-10 text-center" style={{ color: DEF.muted }}>JADWAL ACARA</p>
              <div className="max-w-md mx-auto space-y-0 divide-y" style={{ borderColor: DEF.line }}>
                {visibleEvents.map((ev) => (
                  <motion.div key={ev.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.15 }} transition={{ duration: 0.5 }}
                    className="py-8">
                    <div className="flex items-baseline justify-between gap-4">
                      <h3 className="text-lg font-medium tracking-wide">{ev.label || EVENT_TYPE_LABELS[ev.type] || ev.type}</h3>
                      {ev.date && <p className="text-xs shrink-0" style={{ color: DEF.muted }}>{formatDate(ev.date)}</p>}
                    </div>
                    <div className="mt-3 space-y-1.5 text-sm" style={{ color: DEF.muted }}>
                      {(ev.timeStart || ev.timeEnd) && <p>{ev.timeStart}{ev.timeEnd ? ` – ${ev.timeEnd}` : ""} WIB</p>}
                      <p>{ev.venueName}{ev.venueAddress ? ` · ${ev.venueAddress}` : ""}</p>
                    </div>
                    {theme?.showMap !== false && ev.mapsUrl && (
                      <a href={ev.mapsUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-4 text-xs underline underline-offset-4"
                        style={{ color: accent }}>
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
            <section className="py-16" style={{ borderBottom: `1px solid ${DEF.line}` }}>
              <p className="text-[11px] tracking-[0.4em] uppercase mb-10 px-6" style={{ color: DEF.muted }}>GALERI</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-1 px-1">
                {client.galleries.filter((g) => g.type === "GALLERY").map((g) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={g.id} src={g.url} alt="" loading="lazy" className="w-full aspect-square object-cover" />
                ))}
              </div>
            </section>
          )}

          {/* RSVP */}
          {has("RSVP") && (
            <section className="px-6 py-16" style={{ borderBottom: `1px solid ${DEF.line}` }}>
              <p className="text-[11px] tracking-[0.4em] uppercase mb-8 text-center" style={{ color: DEF.muted }}>KONFIRMASI KEHADIRAN</p>
              {token && guest ? (
                <RsvpBlock clientId={client.id} guest={guest} token={token} accent={accent}
                  menuItems={findMenuEvent(client.events, guest.invitationCategory ?? "")?.menuItems ?? []}
                  onConfirmed={setRsvpStatus} />
              ) : (
                <p className="text-center text-xs" style={{ color: DEF.muted }}>RSVP tersedia melalui link undangan personal.</p>
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
              primaryColor={accent} bgColor={surface} fontHeading={fontH} lang="id"
            />
          )}

          {/* WISHES */}
          {has("WISHES") && (
            <WishesBlock
              clientId={client.id} initialWishes={client.wishes}
              guestName={guest?.name ?? null} guestId={guest?.id ?? null}
              accent={accent}
            />
          )}

          {/* GIFT */}
          {has("GIFT") && client.gifts.length > 0 && (
            <GiftBlock gifts={client.gifts} accent={accent} bg={bg} />
          )}

          {/* CLOSING */}
          <footer className="px-6 py-20 text-center space-y-3">
            <p className="text-[10px] tracking-[0.4em] uppercase" style={{ color: DEF.muted }}>WITH LOVE</p>
            <p className="text-2xl font-light tracking-tight">{groomNick} / {brideNick}</p>
            <p className="text-[10px]" style={{ color: `${DEF.muted}99` }}>Digital Invitation</p>
          </footer>
        </motion.div>
      )}
    </div>
  );
}

function SimpleCountdown({ target, accent }: { target: Date; accent: string }) {
  const [t, setT] = useState<{ d: number; h: number; m: number; s: number } | null>(null);
  useEffect(() => {
    function calc() {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) { setT(null); return; }
      setT({
        d: Math.floor(diff / 86400000), h: Math.floor((diff / 3600000) % 24),
        m: Math.floor((diff / 60000) % 60), s: Math.floor((diff / 1000) % 60),
      });
    }
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [target]);
  if (!t) return null;

  return (
    <div className="flex justify-center gap-8">
      {[
        { v: t.d, l: "Hari" }, { v: t.h, l: "Jam" }, { v: t.m, l: "Menit" }, { v: t.s, l: "Detik" },
      ].map(({ v, l }) => (
        <div key={l} className="text-center">
          <div className="text-3xl font-light tabular-nums" style={{ color: accent }}>{String(v).padStart(2, "0")}</div>
          <div className="text-[10px] tracking-[0.25em] uppercase mt-1" style={{ color: DEF.muted }}>{l}</div>
        </div>
      ))}
    </div>
  );
}

function RsvpBlock({
  clientId, guest, token, accent, menuItems, onConfirmed,
}: {
  clientId: string; guest: Guest; token: string; accent: string; menuItems: { id: string; name: string }[];
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
    return <p className="text-center text-sm py-6">Terima kasih atas konfirmasinya.</p>;
  }

  const inputCls = "w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none";
  const inputStyle = { borderColor: DEF.line, background: "#fff" };

  return (
    <div className="max-w-md mx-auto space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {(["HADIR", "TIDAK_HADIR"] as const).map((s) => (
          <button key={s} onClick={() => setStatus(s)}
            className="py-3 rounded-lg text-sm border transition-colors"
            style={status === s
              ? { borderColor: accent, background: accent, color: "#fff" }
              : { borderColor: DEF.line, background: "#fff" }}>
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
      <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2}
        placeholder="Pesan (opsional)" className={inputCls} style={inputStyle} />
      <button onClick={submit} disabled={sending}
        className="w-full py-3 rounded-lg text-white text-sm disabled:opacity-60" style={{ background: accent }}>
        {sending ? "Mengirim..." : "Kirim Konfirmasi"}
      </button>
    </div>
  );
}

function WishesBlock({
  clientId, initialWishes, guestName, guestId, accent,
}: {
  clientId: string; initialWishes: { id: string; name: string; message: string; reply: string | null; createdAt: Date }[];
  guestName: string | null; guestId: string | null; accent: string;
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

  return (
    <section className="px-6 py-16" style={{ borderBottom: `1px solid ${DEF.line}` }}>
      <p className="text-[11px] tracking-[0.4em] uppercase mb-8 text-center" style={{ color: DEF.muted }}>UCAPAN & DOA</p>
      <div className="max-w-md mx-auto space-y-3">
        <input value={name} onChange={(e) => setName(e.target.value)} readOnly={!!guestName} placeholder="Nama Anda"
          className="w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none" style={{ borderColor: DEF.line, background: "#fff" }} />
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2}
          placeholder="Tulis ucapan terbaik..."
          className="w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none" style={{ borderColor: DEF.line, background: "#fff" }} />
        <button onClick={submit} disabled={sending}
          className="w-full py-3 rounded-lg text-white text-sm disabled:opacity-60" style={{ background: accent }}>
          {sending ? "Mengirim..." : "Kirim Ucapan"}
        </button>
      </div>
      <div className="max-w-md mx-auto mt-10 space-y-5">
        {wishes.length === 0 && (
          <p className="text-center text-xs" style={{ color: DEF.muted }}>Belum ada ucapan.</p>
        )}
        {wishes.map((w) => (
          <div key={w.id} className="border-b pb-4" style={{ borderColor: DEF.line }}>
            <p className="text-xs font-semibold" style={{ color: accent }}>{w.name}</p>
            <p className="text-sm mt-1">{w.message}</p>
            {w.reply && (
              <p className="text-xs mt-2 pl-3 border-l-2" style={{ borderColor: accent, color: DEF.muted }}>
                Balasan: {w.reply}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function GiftBlock({ gifts, accent, bg }: { gifts: TemplateProps["client"]["gifts"]; accent: string; bg: string }) {
  const [copied, setCopied] = useState<string | null>(null);

  function copy(value: string, key: string) {
    navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <section className="px-6 py-16" style={{ borderBottom: `1px solid ${DEF.line}` }}>
      <p className="text-[11px] tracking-[0.4em] uppercase mb-8 text-center" style={{ color: DEF.muted }}>AMPLOP DIGITAL</p>
      <div className="max-w-md mx-auto space-y-4">
        {gifts.filter((g) => g.kind !== "ADDRESS").sort((a, b) => (a.kind === "BANK" ? 0 : a.kind === "EWALLET" ? 1 : 2) - (b.kind === "BANK" ? 0 : b.kind === "EWALLET" ? 1 : 2)).map((g) => (
          <GiftBankCard key={g.id} kind={g.kind} bankName={g.bankName} accountNumber={g.accountNumber}
            accountName={g.accountName} ewalletType={g.ewalletType} ewalletNumber={g.ewalletNumber}
            qrisImage={g.qrisImage} accent={accent} />
        ))}
        {gifts.filter((g) => g.kind === "ADDRESS").map((g) => (
          <GiftAddressCard key={g.id} receiverName={g.receiverName} receiverPhone={g.receiverPhone}
            address={g.address} accent={accent} />
        ))}
      </div>
    </section>
  );
}

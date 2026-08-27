"use client";

import { useState } from "react";
import { Send, CheckCircle, MessageSquare, Users, Clock } from "lucide-react";
import {
  renderWhatsappMessage,
  buildWhatsappLink,
  DEFAULT_TEMPLATE,
  DEFAULT_TEMPLATE_EN,
} from "@/lib/whatsapp";
import { formatDate } from "@/lib/utils";
import { invitationCategoryLabel, invitationCategoryColor } from "@/lib/categories";

type SendStatus = "UNSENT" | "SENT";
type RsvpStatus = "PENDING" | "HADIR" | "TIDAK_HADIR";
type Filter = "all" | "unsent" | "sent";
type SideFilter = "ALL" | "GROOM" | "BRIDE";
type Lang = "id" | "en";

interface Guest {
  id: string;
  name: string;
  phone: string | null;
  maxPax: number;
  sendStatus: SendStatus;
  rsvpStatus: RsvpStatus;
  invitationUrl: string;
  side: "GROOM" | "BRIDE" | null;
  invitationCategory: string;
}

interface Profile {
  groomName: string;
  brideName: string;
}

interface Props {
  clientId: string;
  clientName: string;
  clientType: string;
  initialGuests: Guest[];
  initialTemplate: string;
  initialTemplateEn?: string;
  profile: Profile | null;
  firstEventDate: Date | null;
}

const TEMPLATE_VARS = [
  { key: "{guest_name}", desc: "Nama tamu / Guest name" },
  { key: "{groom_name}", desc: "Nama mempelai pria" },
  { key: "{bride_name}", desc: "Nama mempelai wanita" },
  { key: "{invitation_url}", desc: "Link undangan personal" },
  { key: "{event_date}", desc: "Tanggal acara pertama" },
  { key: "{max_pax}", desc: "Kuota undangan tamu" },
  { key: "{client_name}", desc: "Nama client" },
];

const RSVP_LABEL: Record<RsvpStatus, string> = {
  PENDING: "Belum",
  HADIR: "Hadir",
  TIDAK_HADIR: "Tidak Hadir",
};

const SIDE_LABEL: Record<SideFilter, string> = {
  ALL: "Semua Pihak",
  GROOM: "Pihak Pria",
  BRIDE: "Pihak Wanita",
};

export function WhatsAppBlast({
  clientId,
  clientName,
  clientType,
  initialGuests,
  initialTemplate,
  initialTemplateEn = "",
  profile,
  firstEventDate,
}: Props) {
  const [guests, setGuests] = useState<Guest[]>(initialGuests);
  const [templateId, setTemplateId] = useState(initialTemplate || DEFAULT_TEMPLATE);
  const [templateEn, setTemplateEn] = useState(initialTemplateEn || DEFAULT_TEMPLATE_EN);
  const [activeLang, setActiveLang] = useState<Lang>("id");
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateSaved, setTemplateSaved] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [sideFilter, setSideFilter] = useState<SideFilter>("ALL");
  const [search, setSearch] = useState("");
  const [sending, setSending] = useState<string | null>(null);
  const [sendLang, setSendLang] = useState<Lang>("id");
  const [previewGuestId, setPreviewGuestId] = useState<string>(
    initialGuests[0]?.id ?? ""
  );

  const filtered = guests
    .filter((g) => {
      if (filter === "unsent") return g.sendStatus === "UNSENT";
      if (filter === "sent") return g.sendStatus === "SENT";
      return true;
    })
    .filter((g) => sideFilter === "ALL" || g.side === sideFilter)
    .filter((g) => g.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const categoryDiff = a.invitationCategory.localeCompare(b.invitationCategory);
      if (categoryDiff !== 0) return categoryDiff;
      return a.name.localeCompare(b.name, "id");
    });

  const previewList = [...filtered].sort((a, b) => a.name.localeCompare(b.name, "id"));
  const previewGuest = previewList.find((g) => g.id === previewGuestId) ?? previewList[0];

  const templateVars = {
    guest_name: previewGuest?.name ?? "—",
    groom_name: profile?.groomName || "Mempelai Pria",
    bride_name: profile?.brideName || "Mempelai Wanita",
    client_name: clientName,
    event_date: formatDate(firstEventDate),
    invitation_url: previewGuest?.invitationUrl ?? "https://...",
    max_pax: previewGuest?.maxPax ?? 2,
  };

  const activeTemplate = activeLang === "id" ? templateId : templateEn;
  const setActiveTemplate = activeLang === "id" ? setTemplateId : setTemplateEn;

  async function handleSaveTemplate() {
    setSavingTemplate(true);
    setTemplateSaved(false);
    try {
      await fetch(`/api/clients/${clientId}/whatsapp-template`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bodyTemplate: templateId, bodyTemplateEn: templateEn }),
      });
      setTemplateSaved(true);
    } finally {
      setSavingTemplate(false);
    }
  }

  async function handleSend(guest: Guest) {
    if (!guest.phone) return;
    setSending(guest.id);
    try {
      const tpl = sendLang === "id" ? templateId : templateEn;
      const message = renderWhatsappMessage(tpl, {
        ...templateVars,
        guest_name: guest.name,
        invitation_url: guest.invitationUrl,
        max_pax: guest.maxPax,
      });
      const link = buildWhatsappLink(guest.phone, message);
      window.open(link, "_blank");

      await fetch(`/api/clients/${clientId}/guests/${guest.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sendStatus: "SENT" }),
      });
      setGuests((prev) =>
        prev.map((g) => (g.id === guest.id ? { ...g, sendStatus: "SENT" } : g))
      );
    } finally {
      setSending(null);
    }
  }

  async function handleMarkAllSent() {
    const unsent = guests.filter((g) => g.sendStatus === "UNSENT" && g.phone);
    if (!unsent.length) return;
    if (!confirm(`Tandai ${unsent.length} tamu sebagai terkirim?`)) return;

    await Promise.all(
      unsent.map((g) =>
        fetch(`/api/clients/${clientId}/guests/${g.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sendStatus: "SENT" }),
        })
      )
    );
    setGuests((prev) =>
      prev.map((g) =>
        g.sendStatus === "UNSENT" && g.phone ? { ...g, sendStatus: "SENT" } : g
      )
    );
  }

  const sentCount = guests.filter((g) => g.sendStatus === "SENT").length;
  const totalMaxPax = guests.reduce((sum, g) => sum + g.maxPax, 0);
  const unsentWithPhone = guests.filter((g) => g.sendStatus === "UNSENT" && g.phone).length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Tamu" value={guests.length} color="text-stone-600" />
        <StatCard icon={Users} label="Total Pax" value={totalMaxPax} color="text-blue-600" />
        <StatCard icon={CheckCircle} label="Terkirim" value={sentCount} color="text-green-600" />
        <StatCard icon={Clock} label="Belum Terkirim" value={guests.length - sentCount} color="text-amber-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Template Editor */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <h2 className="font-semibold text-stone-800 mb-1">Template Pesan</h2>
          <p className="text-xs text-stone-400 mb-4">
            Template untuk acara{" "}
            <span className="font-medium text-stone-600">
              {clientType === "SANGJIT" ? "Sangjit" : clientType === "LAMARAN" ? "Lamaran" : "Pernikahan"}
            </span>
            . Kedua bahasa disimpan bersama.
          </p>

          {/* Language tabs */}
          <div className="flex mb-3 border border-stone-200 rounded-lg overflow-hidden w-fit">
            {(["id", "en"] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setActiveLang(l)}
                className={`px-4 py-1.5 text-xs font-medium transition-colors ${
                  activeLang === l
                    ? "bg-blue-600 text-white"
                    : "text-stone-500 hover:bg-stone-50"
                }`}
              >
                {l === "id" ? "🇮🇩 Indonesia" : "🇬🇧 English"}
              </button>
            ))}
          </div>

          <textarea
            key={activeLang}
            value={activeTemplate}
            onChange={(e) => {
              setActiveTemplate(e.target.value);
              setTemplateSaved(false);
            }}
            rows={10}
            className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 font-mono resize-none"
          />

          <div className="flex flex-wrap gap-1.5 mt-3 mb-4">
            {TEMPLATE_VARS.map(({ key, desc }) => (
              <button
                key={key}
                title={desc}
                onClick={() => setActiveTemplate((prev) => prev + key)}
                className="text-xs bg-stone-100 hover:bg-stone-200 text-stone-700 px-2 py-1 rounded font-mono transition-colors"
              >
                {key}
              </button>
            ))}
          </div>

          <button
            onClick={handleSaveTemplate}
            disabled={savingTemplate}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <MessageSquare size={14} />
            {savingTemplate ? "Menyimpan..." : templateSaved ? "✓ Tersimpan!" : "Simpan Kedua Template"}
          </button>
        </div>

        {/* Preview */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-stone-800">Preview Pesan</h2>
            {previewList.length > 0 && (
              <select
                value={previewGuest?.id ?? ""}
                onChange={(e) => setPreviewGuestId(e.target.value)}
                className="text-xs border border-stone-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-stone-300 max-w-[160px] truncate"
              >
                {previewList.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Preview lang toggle */}
          <div className="flex mb-3 border border-stone-200 rounded-lg overflow-hidden w-fit">
            {(["id", "en"] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setActiveLang(l)}
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  activeLang === l
                    ? "bg-blue-600 text-white"
                    : "text-stone-500 hover:bg-stone-50"
                }`}
              >
                {l === "id" ? "🇮🇩 ID" : "🇬🇧 EN"}
              </button>
            ))}
          </div>

          <div className="bg-[#ECE5DD] rounded-xl p-4 min-h-[200px]">
            <div className="bg-white rounded-lg p-3 max-w-[85%] shadow-sm">
              <p className="text-xs text-stone-700 whitespace-pre-wrap leading-relaxed">
                {renderWhatsappMessage(activeTemplate, templateVars)}
              </p>
            </div>
          </div>
          <p className="text-xs text-stone-400 mt-2">
            Preview menggunakan data tamu yang dipilih di atas.
          </p>
        </div>
      </div>

      {/* Guest list */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="px-6 pt-4 pb-3 border-b border-stone-100">
          <input
            type="text"
            placeholder="Cari nama tamu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-2 flex-wrap">
            {(["all", "unsent", "sent"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filter === f
                    ? "bg-blue-600 text-white"
                    : "border border-stone-200 text-stone-600 hover:bg-stone-50"
                }`}
              >
                {f === "all" ? "Semua" : f === "unsent" ? "Belum Terkirim" : "Terkirim"}
              </button>
            ))}
            <span className="w-px bg-stone-200 mx-1" />
            {(["ALL", "GROOM", "BRIDE"] as SideFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => setSideFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  sideFilter === s
                    ? "bg-blue-600 text-white"
                    : "border border-stone-200 text-stone-600 hover:bg-stone-50"
                }`}
              >
                {SIDE_LABEL[s]}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* Language selector for send */}
            <div className="flex border border-stone-200 rounded-lg overflow-hidden">
              {(["id", "en"] as Lang[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setSendLang(l)}
                  title={`Kirim dalam ${l === "id" ? "Bahasa Indonesia" : "English"}`}
                  className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                    sendLang === l
                      ? "bg-blue-600 text-white"
                      : "text-stone-500 hover:bg-stone-50"
                  }`}
                >
                  {l === "id" ? "🇮🇩" : "🇬🇧"}
                </button>
              ))}
            </div>
            <p className="text-xs text-stone-400">Bahasa kirim</p>

            {unsentWithPhone > 0 && (
              <button
                onClick={handleMarkAllSent}
                className="text-xs text-stone-500 hover:text-stone-700 border border-stone-200 px-3 py-1.5 rounded-lg hover:bg-stone-50 transition-colors"
              >
                Tandai Semua Terkirim
              </button>
            )}
          </div>
        </div>

        <div className="divide-y divide-stone-100">
          {filtered.length === 0 && (
            <div className="py-10 text-center text-stone-400 text-sm">
              Tidak ada tamu di kategori ini.
            </div>
          )}
          {filtered.map((guest) => (
            <div key={guest.id} className="flex items-center gap-4 px-6 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-stone-800 truncate">{guest.name}</p>
                <p className="text-xs text-stone-400">
                  {guest.phone || <span className="text-amber-500">Tidak ada nomor HP</span>}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    invitationCategoryColor(guest.invitationCategory)
                  }`}
                >
                  {invitationCategoryLabel(guest.invitationCategory)}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    guest.rsvpStatus === "HADIR"
                      ? "bg-green-50 text-green-600"
                      : guest.rsvpStatus === "TIDAK_HADIR"
                      ? "bg-red-50 text-red-500"
                      : "bg-stone-100 text-stone-500"
                  }`}
                >
                  {RSVP_LABEL[guest.rsvpStatus]}
                </span>
                {guest.sendStatus === "SENT" ? (
                  <span className="flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle size={13} /> Terkirim
                  </span>
                ) : guest.phone ? (
                  <button
                    onClick={() => handleSend(guest)}
                    disabled={sending === guest.id}
                    className="flex items-center gap-1.5 bg-[#25D366] text-white text-xs px-3 py-1.5 rounded-lg hover:bg-[#1ebe5a] disabled:opacity-50 transition-colors"
                  >
                    <Send size={12} />
                    {sending === guest.id ? "..." : `Kirim ${sendLang === "id" ? "🇮🇩" : "🇬🇧"}`}
                  </button>
                ) : (
                  <span className="text-xs text-stone-300">—</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-stone-500">{label}</p>
        <Icon size={15} className={color} />
      </div>
      <p className="text-3xl font-bold text-stone-800">{value}</p>
    </div>
  );
}

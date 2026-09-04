"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Clock, Pencil, Trash2, X } from "lucide-react";
import { findMenuEvent } from "@/lib/menu";
import { invitationCategoryLabel } from "@/lib/categories";

type RsvpStatus = "HADIR" | "TIDAK_HADIR" | "PENDING";

interface Rsvp {
  status: RsvpStatus;
  paxCount: number;
  message: string | null;
  menuChoices: string[];
  createdAt: Date;
}

interface MenuEvent {
  id: string;
  type: string;
  isAyce: boolean;
  menuItems: { id: string; name: string }[];
}

const SIDE_LABEL: Record<string, string> = {
  GROOM: "Pihak Pria",
  BRIDE: "Pihak Wanita",
};

const SIDE_COLOR: Record<string, string> = {
  GROOM: "bg-sky-50 text-sky-700",
  BRIDE: "bg-rose-50 text-rose-700",
};

interface Guest {
  id: string;
  name: string;
  phone: string | null;
  maxPax: number;
  side: string | null;
  invitationCategory: string;
  rsvpStatus: RsvpStatus;
  rsvp: Rsvp | null;
}

interface Props {
  clientId: string;
  initialGuests: Guest[];
  events: MenuEvent[];
}

const STATUS_LABEL: Record<RsvpStatus, string> = {
  HADIR: "Hadir",
  TIDAK_HADIR: "Tidak Hadir",
  PENDING: "Belum",
};

const STATUS_STYLE: Record<RsvpStatus, string> = {
  HADIR: "bg-green-50 text-green-700",
  TIDAK_HADIR: "bg-red-50 text-red-600",
  PENDING: "bg-stone-100 text-stone-500",
};

const STATUS_ICON: Record<RsvpStatus, React.ElementType> = {
  HADIR: CheckCircle,
  TIDAK_HADIR: XCircle,
  PENDING: Clock,
};

type Filter = "all" | "HADIR" | "TIDAK_HADIR" | "PENDING";

export function RsvpManager({ clientId, initialGuests, events }: Props) {
  const [guests, setGuests] = useState<Guest[]>(initialGuests);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [sideFilter, setSideFilter] = useState<"ALL" | "GROOM" | "BRIDE">("ALL");
  const [form, setForm] = useState<{ status: RsvpStatus; paxCount: number; message: string; menuChoices: Record<number, string> }>({
    status: "HADIR",
    paxCount: 1,
    message: "",
    menuChoices: {},
  });
  const [saving, setSaving] = useState(false);

  const categoryScoped = guests
    .filter((g) => !categoryFilter || g.invitationCategory === categoryFilter)
    .filter((g) => sideFilter === "ALL" || g.side === sideFilter);

  const hadir = categoryScoped.filter((g) => g.rsvpStatus === "HADIR");
  const totalPax = hadir.reduce((sum, g) => sum + (g.rsvp?.paxCount ?? 0), 0);
  const totalMaxPax = categoryScoped.reduce((sum, g) => sum + g.maxPax, 0);
  const tidakHadir = categoryScoped.filter((g) => g.rsvpStatus === "TIDAK_HADIR").length;
  const pending = categoryScoped.filter((g) => g.rsvpStatus === "PENDING").length;
  const nasiBoxPax = hadir
    .filter((g) => g.invitationCategory === "PEMBERKATAN_NASI_BOX")
    .reduce((sum, g) => sum + (g.rsvp?.paxCount ?? 0), 0);

  function openEdit(guest: Guest) {
    const existing = guest.rsvp?.menuChoices ?? [];
    setForm({
      status: guest.rsvpStatus,
      paxCount: guest.rsvp?.paxCount ?? 1,
      message: guest.rsvp?.message ?? "",
      menuChoices: Object.fromEntries(existing.map((c, i) => [i, c])),
    });
    setEditingId(guest.id);
  }

  async function handleSave(guest: Guest) {
    const menuEvent = findMenuEvent(events, guest.invitationCategory);
    const needsMenu = form.status === "HADIR" && !!menuEvent;
    const menuChoicesArray = Array.from({ length: form.paxCount }, (_, i) => form.menuChoices[i] ?? "");

    setSaving(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestId: guest.id,
          status: form.status,
          paxCount: form.paxCount,
          message: form.message,
          menuChoices: needsMenu ? menuChoicesArray : undefined,
        }),
      });
      if (res.ok) {
        const rsvp = await res.json();
        setGuests((prev) =>
          prev.map((g) =>
            g.id === guest.id
              ? {
                  ...g,
                  rsvpStatus: form.status,
                  rsvp: {
                    status: form.status,
                    paxCount: form.paxCount,
                    message: form.message || null,
                    menuChoices: needsMenu ? menuChoicesArray : [],
                    createdAt: rsvp.createdAt,
                  },
                }
              : g
          )
        );
        setEditingId(null);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(guestId: string) {
    if (!confirm("Hapus RSVP tamu ini?")) return;
    const res = await fetch(`/api/clients/${clientId}/rsvp`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guestId }),
    });
    if (res.ok) {
      setGuests((prev) =>
        prev.map((g) =>
          g.id === guestId ? { ...g, rsvpStatus: "PENDING", rsvp: null } : g
        )
      );
    }
  }

  const categories = [...new Set(guests.map((g) => g.invitationCategory))];

  const filtered = categoryScoped.filter((g) => filter === "all" || g.rsvpStatus === filter);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="Total Tamu" value={guests.length} color="text-stone-800" />
        <StatCard label="Konfirmasi Hadir" value={hadir.length} color="text-green-700" />
        <StatCard label="Tidak Hadir" value={tidakHadir} color="text-red-600" />
        <StatCard label="Total Pax Hadir" value={totalPax} color="text-stone-800" sub="orang" />
        <StatCard label="Total Max Pax" value={totalMaxPax} color="text-blue-700" sub="slot" />
        {nasiBoxPax > 0 && <StatCard label="Nasi Box" value={nasiBoxPax} color="text-amber-700" sub="kotak" />}
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex gap-2 flex-wrap">
          {(["all", "HADIR", "TIDAK_HADIR", "PENDING"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f
                  ? "bg-blue-600 text-white"
                  : "border border-stone-200 text-stone-600 hover:bg-stone-50"
              }`}
            >
              {f === "all" ? `Semua (${categoryScoped.length})` : f === "HADIR" ? `Hadir (${hadir.length})` : f === "TIDAK_HADIR" ? `Tidak Hadir (${tidakHadir})` : `Belum (${pending})`}
            </button>
          ))}
        </div>

        {categories.length > 1 && (
          <div className="px-6 py-3 border-b border-stone-100 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-stone-400 font-medium">Kategori:</span>
            <button
              onClick={() => setCategoryFilter(null)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                categoryFilter === null
                  ? "bg-stone-800 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              Semua
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                  categoryFilter === cat
                    ? "bg-stone-800 text-white"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                {invitationCategoryLabel(cat)}
                {findMenuEvent(events, cat) && " 🍲"}
              </button>
            ))}
          </div>
        )}

        <div className="px-6 py-3 border-b border-stone-100 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-stone-400 font-medium">Pihak:</span>
          {(["ALL", "GROOM", "BRIDE"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSideFilter(s)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                sideFilter === s
                  ? "bg-stone-800 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {s === "ALL" ? "Semua" : SIDE_LABEL[s]}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="p-10 text-center text-stone-400 text-sm">
            Tidak ada tamu di kategori ini.
          </div>
        ) : (
          <div className="divide-y divide-stone-50">
            {filtered.map((guest) => {
              const Icon = STATUS_ICON[guest.rsvpStatus];
              const isEditing = editingId === guest.id;
              const menuEvent = findMenuEvent(events, guest.invitationCategory);
              const needsMenu = isEditing && form.status === "HADIR" && !!menuEvent;
              const menuChoicesArray = Array.from({ length: form.paxCount }, (_, i) => form.menuChoices[i] ?? "");
              const menuIncomplete = needsMenu && menuChoicesArray.some((s) => !s);

              return (
                <div key={guest.id} className="px-6 py-4">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-stone-800 text-sm">{guest.name}</p>
                          <span className="text-xs text-stone-400">
                            {invitationCategoryLabel(guest.invitationCategory)}
                            {menuEvent && " 🍲"}
                          </span>
                        </div>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-stone-400 hover:text-stone-600"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs text-stone-500 mb-1">Status</label>
                          <select
                            value={form.status}
                            onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as RsvpStatus }))}
                            className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
                          >
                            <option value="HADIR">Hadir</option>
                            <option value="TIDAK_HADIR">Tidak Hadir</option>
                            <option value="PENDING">Belum Konfirmasi</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-stone-500 mb-1">
                            Pax (maks. {guest.maxPax})
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={guest.maxPax}
                            value={form.paxCount}
                            onChange={(e) => setForm((p) => ({ ...p, paxCount: Number(e.target.value) }))}
                            className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-stone-500 mb-1">Pesan (opsional)</label>
                          <input
                            type="text"
                            value={form.message}
                            onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                            placeholder="Pesan dari tamu"
                            className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
                          />
                        </div>
                      </div>
                      {needsMenu && (
                        <div>
                          <label className="block text-xs text-stone-500 mb-1">Pilihan Menu per Tamu</label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {menuChoicesArray.map((choice, i) => (
                              <select
                                key={i}
                                value={choice}
                                onChange={(e) =>
                                  setForm((p) => ({ ...p, menuChoices: { ...p.menuChoices, [i]: e.target.value } }))
                                }
                                className="border border-stone-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-stone-300"
                              >
                                <option value="">Tamu {i + 1}: pilih menu</option>
                                {menuEvent!.menuItems.map((item) => (
                                  <option key={item.id} value={item.name}>{item.name}</option>
                                ))}
                              </select>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSave(guest)}
                          disabled={saving || menuIncomplete}
                          className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                          {saving ? "Menyimpan..." : "Simpan"}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="border border-stone-200 text-stone-600 px-4 py-1.5 rounded-lg text-xs hover:bg-stone-50 transition-colors"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-stone-800 truncate">{guest.name}</p>
                        <p className="text-xs text-stone-400">
                          {guest.phone || "Tidak ada no. HP"}
                          {" · "}
                          {invitationCategoryLabel(guest.invitationCategory)}
                          {menuEvent && " 🍲"}
                        </p>
                      </div>
                      {guest.side && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium hidden sm:inline-block ${SIDE_COLOR[guest.side]}`}>
                          {SIDE_LABEL[guest.side]}
                        </span>
                      )}
                      {guest.rsvp && (
                        <p className="text-xs text-stone-400 hidden sm:block">
                          {guest.rsvp.paxCount} pax
                          {guest.rsvp.menuChoices.length > 0 && ` · ${guest.rsvp.menuChoices.join(", ")}`}
                          {guest.rsvp.message && ` · "${guest.rsvp.message}"`}
                        </p>
                      )}
                      <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLE[guest.rsvpStatus]}`}>
                        <Icon size={12} />
                        {STATUS_LABEL[guest.rsvpStatus]}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(guest)}
                          className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
                          title="Edit RSVP"
                        >
                          <Pencil size={14} />
                        </button>
                        {guest.rsvp && (
                          <button
                            onClick={() => handleDelete(guest.id)}
                            className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus RSVP"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  sub,
}: {
  label: string;
  value: number;
  color: string;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4">
      <p className="text-xs text-stone-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>
        {value}
        {sub && <span className="text-sm font-normal ml-1">{sub}</span>}
      </p>
    </div>
  );
}

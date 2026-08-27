"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createGuestSchema, GUEST_SIDES, type CreateGuestInput } from "@/modules/guests/guests.schema";
import { renderWhatsappMessage, buildWhatsappLink } from "@/lib/whatsapp";
import {
  getInvitationCategories,
  invitationCategoryLabel,
  invitationCategoryColor,
} from "@/lib/categories";
import { formatDate } from "@/lib/utils";
import {
  Copy,
  MessageCircle,
  RefreshCw,
  Trash2,
  Plus,
  Upload,
  Download,
  Check,
  QrCode,
  Pencil,
  X,
} from "lucide-react";
import type { Guest, Rsvp, Attendance } from "@/types/prisma.types";

type GuestWithRsvp = Guest & { rsvp: Rsvp | null; attendances: Attendance[] };

interface ClientData {
  name: string;
  slug: string;
  clientType: string;
  weddingProfile: { groomName: string; brideName: string } | null;
  events: { date: Date | null; type: string }[];
  whatsappTemplate: { bodyTemplate: string } | null;
}

interface Props {
  clientId: string;
  initialGuests: GuestWithRsvp[];
  client: ClientData | null;
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Menunggu",
  HADIR: "Hadir",
  TIDAK_HADIR: "Tidak Hadir",
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-yellow-50 text-yellow-700",
  HADIR: "bg-green-50 text-green-700",
  TIDAK_HADIR: "bg-red-50 text-red-700",
};

const SIDE_LABEL: Record<string, string> = {
  GROOM: "Pihak Pria",
  BRIDE: "Pihak Wanita",
};

const SIDE_COLOR: Record<string, string> = {
  GROOM: "bg-sky-50 text-sky-700",
  BRIDE: "bg-rose-50 text-rose-700",
};

export function GuestsManager({ clientId, initialGuests, client }: Props) {
  const [guests, setGuests] = useState<GuestWithRsvp[]>(initialGuests);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fixingUrls, setFixingUrls] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sideFilter, setSideFilter] = useState<"ALL" | "GROOM" | "BRIDE">("ALL");
  const fileRef = useRef<HTMLInputElement>(null);
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", phone: "", invitationCategory: "", side: "", maxPax: 2 });
  const [saving, setSaving] = useState(false);

  // Kategori tamu mengikuti daftar event yang diinput di tab Detail Acara.
  const invitationCategories = getInvitationCategories(client?.events ?? []);
  const defaultCategory = invitationCategories[0]?.value ?? "";

  const filteredGuests = guests
    .filter((g) => g.name.toLowerCase().includes(search.toLowerCase()))
    .filter((g) => sideFilter === "ALL" || g.side === sideFilter)
    .sort((a, b) => {
      const order = (cat: string) => {
        const idx = invitationCategories.findIndex((c) => c.value === cat);
        return idx === -1 ? invitationCategories.length : idx;
      };
      const categoryDiff = order(a.invitationCategory) - order(b.invitationCategory);
      if (categoryDiff !== 0) return categoryDiff;
      return a.name.localeCompare(b.name, "id");
    });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateGuestInput>({
    resolver: zodResolver(createGuestSchema) as any,
    defaultValues: { maxPax: 2, invitationCategory: defaultCategory as any },
  });

  function buildMessage(guest: GuestWithRsvp): string {
    const profile = client?.weddingProfile;
    const event = client?.events[0];
    return renderWhatsappMessage(client?.whatsappTemplate?.bodyTemplate ?? null, {
      guest_name: guest.name,
      groom_name: profile?.groomName || "-",
      bride_name: profile?.brideName || "-",
      client_name: client?.name || "-",
      event_date: event?.date ? formatDate(event.date) : "-",
      invitation_url: guest.invitationUrl,
      max_pax: guest.maxPax,
    });
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  async function addGuest(data: CreateGuestInput) {
    setLoading(true);
    const res = await fetch(`/api/clients/${clientId}/guests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const guest = await res.json();
      setGuests((prev) => [{ ...guest, rsvp: null, attendances: [] }, ...prev]);
      reset();
      setShowAddForm(false);
    }
    setLoading(false);
  }

  async function removeGuest(id: string) {
    if (!confirm("Hapus tamu ini?")) return;
    const res = await fetch(`/api/clients/${clientId}/guests`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) setGuests((prev) => prev.filter((g) => g.id !== id));
  }

  async function regenerateToken(guestId: string) {
    if (!confirm("Reset link tamu ini? Link lama akan tidak berlaku.")) return;
    const res = await fetch(
      `/api/clients/${clientId}/guests/${guestId}/regenerate-token`,
      { method: "POST" }
    );
    if (res.ok) {
      const updated = await res.json();
      setGuests((prev) =>
        prev.map((g) => (g.id === guestId ? { ...g, ...updated } : g))
      );
    }
  }

  async function regenerateBarcodes(guestId: string) {
    if (!confirm("Generate ulang barcode tamu ini? Barcode lama tidak akan berlaku.")) return;
    const res = await fetch(
      `/api/clients/${clientId}/guests/${guestId}/regenerate-barcodes`,
      { method: "POST" }
    );
    if (res.ok) {
      const updated = await res.json();
      setGuests((prev) =>
        prev.map((g) => (g.id === guestId ? { ...g, ...updated } : g))
      );
    }
  }

  async function handleCSVImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const lines = text.trim().split("\n").slice(1);
    const validCategories = invitationCategories.map((c) => c.value);
    const parsed = lines.map((line) => {
      const [name, phone, category, side, maxPax] = line.split(",").map((s) => s.trim());
      const resolvedCategory = validCategories.includes(category)
        ? category
        : defaultCategory;
      const resolvedSide = (GUEST_SIDES as readonly string[]).includes(side) ? (side as "GROOM" | "BRIDE") : null;
      return {
        name,
        phone,
        invitationCategory: resolvedCategory as any,
        side: resolvedSide,
        maxPax: Number(maxPax) || 2,
      };
    }).filter((g) => g.name);

    const res = await fetch(`/api/clients/${clientId}/guests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed),
    });

    if (res.ok) {
      const { count } = await res.json();
      alert(`${count} tamu berhasil diimport. Refresh halaman.`);
      window.location.reload();
    }
  }

  async function fixUrls() {
    if (!confirm("Perbaiki semua link undangan tamu? Ini akan regenerasi URL untuk semua tamu.")) return;
    setFixingUrls(true);
    const res = await fetch(`/api/clients/${clientId}/guests`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fixUrls: true }),
    });
    setFixingUrls(false);
    if (res.ok) {
      const data = await res.json();
      alert(data.message || "URL berhasil diperbaiki. Halaman akan di-refresh.");
      window.location.reload();
    } else {
      alert("Gagal memperbaiki URL.");
    }
  }

  function startEdit(guest: GuestWithRsvp) {
    setEditingGuestId(guest.id);
    setEditForm({
      name: guest.name,
      phone: guest.phone ?? "",
      invitationCategory: guest.invitationCategory,
      side: guest.side ?? "",
      maxPax: guest.maxPax,
    });
  }

  async function saveEdit(guestId: string) {
    if (!editForm.name.trim()) return;
    setSaving(true);
    const res = await fetch(`/api/clients/${clientId}/guests/${guestId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editForm.name.trim(),
        phone: editForm.phone.trim() || null,
        invitationCategory: editForm.invitationCategory,
        side: editForm.side || null,
        maxPax: Number(editForm.maxPax),
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setGuests((prev) => prev.map((g) => (g.id === guestId ? { ...g, ...updated } : g)));
      setEditingGuestId(null);
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.error || "Gagal menyimpan perubahan");
    }
    setSaving(false);
  }

  function exportCSV() {
    const rows = [
      ["Nama", "Telepon", "Kategori", "Pihak", "Maks Tamu", "Link Undangan", "Status RSVP", "Sudah Dibuka"],
      ...guests.map((g) => [
        g.name,
        g.phone || "",
        g.invitationCategory,
        g.side ?? "",
        g.maxPax,
        g.invitationUrl,
        g.rsvpStatus,
        g.isOpened ? "Ya" : "Belum",
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tamu-${clientId}.csv`;
    a.click();
  }

  const csvCategoryValues = invitationCategories.map((c) => c.value).join("/");

  return (
    <div className="space-y-4">
      {/* Actions bar */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Cari nama tamu..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-stone-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-48 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <div className="flex items-center gap-1 border border-stone-300 rounded-lg p-1">
          {(["ALL", "GROOM", "BRIDE"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSideFilter(s)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                sideFilter === s ? "bg-stone-800 text-white" : "text-stone-500 hover:bg-stone-50"
              }`}
            >
              {s === "ALL" ? "Semua" : s === "GROOM" ? "Pihak Pria" : "Pihak Wanita"}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700"
        >
          <Plus size={14} /> Tambah Tamu
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 border border-stone-300 text-stone-600 px-3 py-2 rounded-lg text-sm hover:bg-stone-50"
        >
          <Upload size={14} /> Import CSV
        </button>
        <button
          onClick={exportCSV}
          className="flex items-center gap-1.5 border border-stone-300 text-stone-600 px-3 py-2 rounded-lg text-sm hover:bg-stone-50"
        >
          <Download size={14} /> Export CSV
        </button>
        <button
          onClick={fixUrls}
          disabled={fixingUrls}
          className="flex items-center gap-1.5 border border-amber-300 text-amber-700 px-3 py-2 rounded-lg text-sm hover:bg-amber-50 disabled:opacity-40"
          title="Perbaiki semua link undangan yang rusak"
        >
          <RefreshCw size={14} className={fixingUrls ? "animate-spin" : ""} /> Perbaiki URL
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleCSVImport}
        />
      </div>

      {/* Format CSV info */}
      <p className="text-xs text-stone-400">
        Format CSV:{" "}
        <span className="font-mono">Nama,Telepon,Kategori({csvCategoryValues}),Pihak(GROOM/BRIDE),MaksTamu</span>
      </p>

      {/* Add form */}
      {showAddForm && (
        <form
          onSubmit={handleSubmit(addGuest)}
          className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4"
        >
          <h3 className="font-medium text-stone-800 text-sm">Tambah Tamu</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Nama Tamu *</label>
              <input {...register("name")} placeholder="Ahmad Jordy" className={inputClass} />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className={labelClass}>No. WhatsApp</label>
              <input {...register("phone")} placeholder="08123456789" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Kategori Undangan *</label>
              <select {...register("invitationCategory")} className={inputClass}>
                {invitationCategories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              {errors.invitationCategory && (
                <p className="text-red-500 text-xs mt-1">{errors.invitationCategory.message}</p>
              )}
            </div>
            <div>
              <label className={labelClass}>Pihak</label>
              <select
                {...register("side", { setValueAs: (v) => (v === "" ? undefined : v) })}
                className={inputClass}
                defaultValue=""
              >
                <option value="">Belum ditentukan</option>
                <option value="GROOM">Pihak Pria</option>
                <option value="BRIDE">Pihak Wanita</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Maks Tamu</label>
              <input
                {...register("maxPax", { valueAsNumber: true })}
                type="number"
                min={1}
                max={20}
                className={inputClass}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : "Simpan"}
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="border border-stone-300 text-stone-600 px-4 py-2 rounded-lg text-sm"
            >
              Batal
            </button>
          </div>
        </form>
      )}

      {/* Stats */}
      {(() => {
        const sideScoped = sideFilter === "ALL" ? guests : guests.filter((g) => g.side === sideFilter);
        const nasiBoxTotal = sideScoped
          .filter((g) => g.invitationCategory === "PEMBERKATAN_NASI_BOX")
          .reduce((sum, g) => sum + g.maxPax, 0);
        return (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <StatCard label="Total Tamu" value={sideScoped.length} color="text-stone-800" />
              <StatCard label="Total Pax" value={sideScoped.reduce((sum, g) => sum + g.maxPax, 0)} color="text-stone-800" />
              <StatCard label="Sudah Buka" value={sideScoped.filter((g) => g.isOpened).length} color="text-blue-700" />
              <StatCard label="Konfirmasi Hadir" value={sideScoped.filter((g) => g.rsvpStatus === "HADIR").length} color="text-green-700" />
              <StatCard label="Pihak Pria" value={sideScoped.filter((g) => g.side === "GROOM").length} color="text-sky-700" />
              <StatCard label="Pihak Wanita" value={sideScoped.filter((g) => g.side === "BRIDE").length} color="text-rose-700" />
            </div>
            <div className="flex gap-3 text-xs text-stone-500 flex-wrap">
              {invitationCategories.map((cat) => (
                <span key={cat.value}>
                  {sideScoped.filter((g) => g.invitationCategory === cat.value).length} {cat.label.toLowerCase()}
                </span>
              ))}
              {nasiBoxTotal > 0 && (
                <span className="text-amber-600 font-medium">· {nasiBoxTotal} box (Est. Nasi Box)</span>
              )}
            </div>
          </>
        );
      })()}

      {/* Guest table */}
      {filteredGuests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center">
          <p className="text-stone-400 text-sm">
            {search || sideFilter !== "ALL" ? "Tidak ada tamu yang cocok." : "Belum ada tamu."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[680px]">
            <thead>
              <tr className="border-b border-stone-100 text-left">
                <th className="px-4 py-3 text-stone-500 font-medium sticky left-0 bg-white z-10 border-r border-stone-100">Nama</th>
                <th className="px-4 py-3 text-stone-500 font-medium">Kategori</th>
                <th className="px-4 py-3 text-stone-500 font-medium">Pihak</th>
                <th className="px-4 py-3 text-stone-500 font-medium">RSVP</th>
                <th className="px-4 py-3 text-stone-500 font-medium">Pax</th>
                <th className="px-4 py-3 text-stone-500 font-medium">Barcode</th>
                <th className="px-4 py-3 text-stone-500 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {filteredGuests.map((guest) => {
                const message = buildMessage(guest);
                const waLink = guest.phone
                  ? buildWhatsappLink(guest.phone, message)
                  : null;
                const isEditing = editingGuestId === guest.id;

                if (isEditing) {
                  return (
                    <tr key={guest.id} className="bg-blue-50">
                      <td className="px-4 py-3 sticky left-0 bg-blue-50 z-10 border-r border-stone-100">
                        <input
                          value={editForm.name}
                          onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                          className={inputClass}
                          placeholder="Nama tamu"
                          autoFocus
                        />
                        <input
                          value={editForm.phone}
                          onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                          className={`${inputClass} mt-1`}
                          placeholder="No. WhatsApp (opsional)"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={editForm.invitationCategory}
                          onChange={(e) => setEditForm((f) => ({ ...f, invitationCategory: e.target.value }))}
                          className={inputClass}
                        >
                          {invitationCategories.map((cat) => (
                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={editForm.side}
                          onChange={(e) => setEditForm((f) => ({ ...f, side: e.target.value }))}
                          className={inputClass}
                        >
                          <option value="">Belum ditentukan</option>
                          <option value="GROOM">Pihak Pria</option>
                          <option value="BRIDE">Pihak Wanita</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[guest.rsvpStatus]}`}>
                          {STATUS_LABEL[guest.rsvpStatus]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={editForm.maxPax}
                          onChange={(e) => setEditForm((f) => ({ ...f, maxPax: Number(e.target.value) }))}
                          className={inputClass}
                          min={1}
                          max={20}
                        />
                      </td>
                      <td className="px-4 py-3 text-stone-400 text-xs">—</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => saveEdit(guest.id)}
                            disabled={saving || !editForm.name.trim()}
                            className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-blue-700 disabled:opacity-50"
                          >
                            {saving ? "..." : "Simpan"}
                          </button>
                          <button
                            onClick={() => setEditingGuestId(null)}
                            className="text-stone-400 hover:text-stone-700"
                            title="Batal"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={guest.id} className="hover:bg-stone-50 group">
                    <td className="px-4 py-3 sticky left-0 bg-white group-hover:bg-stone-50 z-10 border-r border-stone-100">
                      <p className="font-medium text-stone-800">{guest.name}</p>
                      {guest.phone && (
                        <p className="text-xs text-stone-400">{guest.phone}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${invitationCategoryColor(
                          guest.invitationCategory
                        )}`}
                      >
                        {invitationCategoryLabel(guest.invitationCategory)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {guest.side ? (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SIDE_COLOR[guest.side]}`}>
                          {SIDE_LABEL[guest.side]}
                        </span>
                      ) : (
                        <span className="text-xs text-stone-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[guest.rsvpStatus]}`}>
                        {STATUS_LABEL[guest.rsvpStatus]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-stone-600">{guest.maxPax}</td>
                    <td className="px-4 py-3">
                      {guest.barcodeChurch ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-stone-500">
                            1: <span className="font-mono text-stone-700">{guest.barcodeChurch.slice(0, 6)}…</span>
                          </span>
                          {guest.barcodeReception && (
                            <span className="text-xs text-stone-500">
                              2: <span className="font-mono text-stone-700">{guest.barcodeReception.slice(0, 6)}…</span>
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-stone-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          title="Edit tamu"
                          onClick={() => startEdit(guest)}
                          className="text-stone-400 hover:text-blue-600"
                        >
                          <Pencil size={14} />
                        </button>

                        <button
                          title="Copy link undangan"
                          onClick={() => copyToClipboard(guest.invitationUrl, `link-${guest.id}`)}
                          className="text-stone-400 hover:text-stone-700"
                        >
                          {copied === `link-${guest.id}` ? (
                            <Check size={14} className="text-green-500" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>

                        <button
                          title="Copy pesan WhatsApp"
                          onClick={() => copyToClipboard(message, `msg-${guest.id}`)}
                          className="text-stone-400 hover:text-stone-700"
                        >
                          {copied === `msg-${guest.id}` ? (
                            <Check size={14} className="text-green-500" />
                          ) : (
                            <MessageCircle size={14} />
                          )}
                        </button>

                        {waLink && (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Buka WhatsApp"
                            className="text-green-500 hover:text-green-700"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                            </svg>
                          </a>
                        )}

                        <button
                          title="Reset token undangan"
                          onClick={() => regenerateToken(guest.id)}
                          className="text-stone-400 hover:text-stone-700"
                        >
                          <RefreshCw size={14} />
                        </button>

                        <button
                          title="Generate ulang barcode"
                          onClick={() => regenerateBarcodes(guest.id)}
                          className="text-stone-400 hover:text-indigo-600"
                        >
                          <QrCode size={14} />
                        </button>

                        <button
                          title="Hapus tamu"
                          onClick={() => removeGuest(guest.id)}
                          className="text-stone-400 hover:text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4">
      <p className="text-xs text-stone-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

const inputClass =
  "w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400";
const labelClass = "block text-sm font-medium text-stone-700 mb-1";

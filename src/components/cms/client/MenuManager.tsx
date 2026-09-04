"use client";

import { useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { EVENT_LABELS } from "./EventsManager";
import type { Event, MenuItem } from "@/types/prisma.types";

type MenuItemWithEvent = MenuItem & { event: Pick<Event, "id" | "type" | "label" | "venueName"> };

interface Props {
  clientId: string;
  events: Pick<Event, "id" | "type" | "label" | "venueName" | "isAyce">[];
  initialMenuItems: MenuItemWithEvent[];
}

export function MenuManager({ clientId, events, initialMenuItems }: Props) {
  const [menuItems, setMenuItems] = useState<MenuItemWithEvent[]>(initialMenuItems);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function addItem(event: Props["events"][number]) {
    const name = (drafts[event.id] ?? "").trim();
    if (!name) return;

    setSaving(event.id);
    setError("");
    const res = await fetch(`/api/clients/${clientId}/menu`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId: event.id, name }),
    });
    const json = await res.json();

    if (!res.ok) {
      setError(json.error || "Gagal menyimpan");
    } else {
      setMenuItems((prev) => [...prev, { ...json, event }]);
      setDrafts((prev) => ({ ...prev, [event.id]: "" }));
    }
    setSaving(null);
  }

  async function removeItem(id: string) {
    if (!confirm("Hapus menu ini?")) return;

    const res = await fetch(`/api/clients/${clientId}/menu`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setMenuItems((prev) => prev.filter((m) => m.id !== id));
    }
  }

  if (events.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-6 text-sm text-stone-500">
        Belum ada acara. Tambahkan acara terlebih dahulu di tab <strong>Acara</strong> sebelum mengatur menu makanan.
      </div>
    );
  }

  const ayceEvents = events.filter((e) => e.isAyce);

  if (ayceEvents.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-6 text-sm text-stone-500">
        Belum ada acara yang diaktifkan sebagai <strong>AYCE</strong>. Aktifkan toggle AYCE pada acara yang relevan
        (mis. Resepsi, Ulang Tahun, Acara Kantor) di tab <strong>Acara</strong> untuk mulai mengatur menu makanan.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-stone-500">
        Tamu yang diundang ke acara AYCE di bawah ini akan diminta memilih menu makanan saat mengisi RSVP.
        Acara tanpa menu tidak akan menampilkan pilihan apa pun.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {ayceEvents.map((event) => {
        const items = menuItems.filter((m) => m.eventId === event.id);

        return (
          <div key={event.id} className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-100">
              <p className="font-medium text-stone-800 text-sm">
                {event.label || EVENT_LABELS[event.type] || event.type}
              </p>
              {event.venueName && <p className="text-xs text-stone-400 mt-0.5">{event.venueName}</p>}
            </div>

            <div className="px-5 py-4 space-y-2">
              {items.length === 0 ? (
                <p className="text-xs text-stone-400">Belum ada menu untuk acara ini.</p>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-stone-700">{item.name}</span>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Hapus menu"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}

              <div className="flex gap-2 pt-2">
                <input
                  value={drafts[event.id] ?? ""}
                  onChange={(e) => setDrafts((prev) => ({ ...prev, [event.id]: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && addItem(event)}
                  placeholder="Nama menu, mis. Nasi Goreng"
                  className="flex-1 border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button
                  onClick={() => addItem(event)}
                  disabled={saving === event.id}
                  className="flex items-center gap-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  <Plus size={14} />
                  Tambah
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

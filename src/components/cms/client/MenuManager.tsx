"use client";

import { useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { EVENT_LABELS } from "./EventsManager";
import { formatDateInput } from "@/lib/utils";
import type { Event, MenuItem } from "@/types/prisma.types";

type MenuItemWithEvent = MenuItem & { event: Pick<Event, "id" | "type" | "label" | "venueName"> };

interface Props {
  clientId: string;
  initialEvents: Event[];
  initialMenuItems: MenuItemWithEvent[];
}

export function MenuManager({ clientId, initialEvents, initialMenuItems }: Props) {
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [menuItems, setMenuItems] = useState<MenuItemWithEvent[]>(initialMenuItems);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function toggleAyce(event: Event) {
    setSaving(event.id);
    setError("");
    const res = await fetch(`/api/clients/${clientId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: event.id,
        type: event.type,
        label: event.label,
        labelEn: event.labelEn,
        date: formatDateInput(event.date),
        timeStart: event.timeStart,
        timeEnd: event.timeEnd,
        venueName: event.venueName,
        venueNameEn: event.venueNameEn,
        venueAddress: event.venueAddress,
        mapsUrl: event.mapsUrl,
        mapsEmbed: event.mapsEmbed,
        sortOrder: event.sortOrder,
        isAyce: !event.isAyce,
      }),
    });
    const json = await res.json();

    if (!res.ok) {
      setError(json.error || "Gagal menyimpan");
    } else {
      setEvents((prev) => prev.map((e) => (e.id === event.id ? json : e)));
    }
    setSaving(null);
  }

  async function addItem(event: Event) {
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

  return (
    <div className="space-y-4">
      <p className="text-sm text-stone-500">
        Aktifkan menu untuk acara yang tamu-nya perlu memilih makanan sendiri (mis. all-you-can-eat). Acara yang
        tidak diaktifkan tidak akan menampilkan pilihan apa pun ke tamu.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {events.map((event) => {
        const items = menuItems.filter((m) => m.eventId === event.id);

        return (
          <div key={event.id} className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="font-medium text-stone-800 text-sm">
                  {event.label || EVENT_LABELS[event.type] || event.type}
                </p>
                {event.venueName && <p className="text-xs text-stone-400 mt-0.5">{event.venueName}</p>}
              </div>
              <button
                type="button"
                onClick={() => toggleAyce(event)}
                disabled={saving === event.id}
                className={`relative shrink-0 w-11 h-6 rounded-full transition-colors focus:outline-none disabled:opacity-50 ${event.isAyce ? "bg-amber-500" : "bg-stone-300"}`}
                title={event.isAyce ? "Nonaktifkan menu" : "Aktifkan menu"}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${event.isAyce ? "left-5" : "left-0.5"}`}
                />
              </button>
            </div>

            {event.isAyce && (
              <div className="px-5 py-4 border-t border-stone-100 space-y-2">
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
            )}
          </div>
        );
      })}
    </div>
  );
}

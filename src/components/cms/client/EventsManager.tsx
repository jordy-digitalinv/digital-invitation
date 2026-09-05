"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { eventSchema, type EventInput } from "@/modules/wedding/wedding.schema";
import { formatDate, formatDateInput } from "@/lib/utils";
import { Trash2, Plus, ChevronDown, ChevronUp } from "lucide-react";
import type { Event } from "@/types/prisma.types";

export const EVENT_LABELS: Record<string, string> = {
  AKAD: "Akad Nikah",
  PEMBERKATAN: "Pemberkatan Perkawinan",
  RESEPSI: "Resepsi",
  AFTER_PARTY: "After Party",
  SANGJIT: "Sangjit",
  LAMARAN: "Lamaran",
  ULANG_TAHUN: "Ulang Tahun",
  KANTOR: "Acara Kantor",
};

const EVENT_OPTIONS_BY_TYPE: Record<string, { value: string; label: string }[]> = {
  WEDDING: [
    { value: "AKAD", label: "Akad Nikah · Muslim" },
    { value: "PEMBERKATAN", label: "Pemberkatan Perkawinan · Kristen / Katolik / Hindu / Buddha" },
    { value: "RESEPSI", label: "Resepsi" },
    { value: "AFTER_PARTY", label: "After Party" },
  ],
  SANGJIT: [
    { value: "SANGJIT", label: "Sangjit" },
    { value: "AFTER_PARTY", label: "After Party" },
  ],
  LAMARAN: [
    { value: "LAMARAN", label: "Lamaran" },
    { value: "AFTER_PARTY", label: "After Party" },
  ],
  ULANG_TAHUN: [
    { value: "ULANG_TAHUN", label: "Ulang Tahun / Syukuran" },
    { value: "RESEPSI", label: "Resepsi (Jam Makan)" },
  ],
  KANTOR: [
    { value: "KANTOR", label: "Acara Utama" },
    { value: "RESEPSI", label: "Resepsi / Jam Makan" },
  ],
};

const VENUE_PLACEHOLDERS: Record<string, { name: string; address: string; maps: string }> = {
  AKAD: {
    name: "Masjid Al-Aqsha",
    address: "Jl. Masjid Raya No. 1, Jakarta",
    maps: "https://maps.google.com/...",
  },
  PEMBERKATAN: {
    name: "Gereja Santo Petrus",
    address: "Jl. Gereja No. 1, Jakarta",
    maps: "https://maps.google.com/...",
  },
  RESEPSI: {
    name: "Gedung Serbaguna Harmoni",
    address: "Jl. Merdeka No. 1, Jakarta Pusat",
    maps: "https://maps.google.com/...",
  },
  AFTER_PARTY: {
    name: "Resto & Lounge XYZ",
    address: "Jl. Sudirman No. 10, Jakarta",
    maps: "https://maps.google.com/...",
  },
  SANGJIT: {
    name: "Kediaman Keluarga",
    address: "Jl. Kelapa Gading No. 5, Jakarta",
    maps: "https://maps.google.com/...",
  },
  LAMARAN: {
    name: "Kediaman Keluarga",
    address: "Jl. Kelapa Gading No. 5, Jakarta",
    maps: "https://maps.google.com/...",
  },
  ULANG_TAHUN: {
    name: "Balai Kartini",
    address: "Jl. Gatot Subroto No. 37, Jakarta",
    maps: "https://maps.google.com/...",
  },
  KANTOR: {
    name: "Hotel Grand Ballroom",
    address: "Jl. Jenderal Sudirman No. 1, Jakarta",
    maps: "https://maps.google.com/...",
  },
};

interface Props {
  clientId: string;
  clientType: string;
  initialEvents: Event[];
}

export function EventsManager({ clientId, clientType, initialEvents }: Props) {
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [openForm, setOpenForm] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const eventOptions = EVENT_OPTIONS_BY_TYPE[clientType] ?? EVENT_OPTIONS_BY_TYPE.WEDDING;
  const defaultEventType = eventOptions[0]?.value ?? "AKAD";

  async function saveEvent(data: EventInput, eventId?: string) {
    setLoading(true);
    setError("");

    // isAyce nggak ada di form Acara (diatur dari tab Menu) — pertahankan nilai yang sudah ada.
    const existing = eventId ? events.find((e) => e.id === eventId) : undefined;
    const isAyce = existing?.isAyce ?? data.isAyce;

    const res = await fetch(`/api/clients/${clientId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, isAyce, id: eventId }),
    });

    const json = await res.json();

    if (!res.ok) {
      setError(json.error || "Gagal menyimpan");
    } else {
      setEvents((prev) =>
        eventId
          ? prev.map((e) => (e.id === eventId ? json : e))
          : [...prev, json]
      );
      setOpenForm(null);
    }
    setLoading(false);
  }

  async function removeEvent(id: string) {
    if (!confirm("Hapus acara ini?")) return;

    const res = await fetch(`/api/clients/${clientId}/events`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (res.ok) {
      setEvents((prev) => prev.filter((e) => e.id !== id));
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {events.map((event) => (
        <div
          key={event.id}
          className="bg-white rounded-2xl border border-stone-200 overflow-hidden"
        >
          <div
            className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-stone-50"
            onClick={() => setOpenForm(openForm === event.id ? null : event.id)}
          >
            <div>
              <p className="font-medium text-stone-800 text-sm">
                {event.label || EVENT_LABELS[event.type] || event.type}
              </p>
              <p className="text-xs text-stone-400 mt-0.5">
                {event.date ? formatDate(event.date) : "Tanggal belum diatur"}{" "}
                {event.venueName && `• ${event.venueName}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); removeEvent(event.id); }}
                className="text-stone-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={14} />
              </button>
              {openForm === event.id ? (
                <ChevronUp size={14} className="text-stone-400" />
              ) : (
                <ChevronDown size={14} className="text-stone-400" />
              )}
            </div>
          </div>

          {openForm === event.id && (
            <div className="border-t border-stone-100 px-5 py-4">
              <EventForm
                defaultValues={{ ...event, date: formatDateInput(event.date) }}
                eventOptions={eventOptions}
                onSubmit={(data) => saveEvent(data, event.id)}
                loading={loading}
              />
            </div>
          )}
        </div>
      ))}

      {openForm === "new" ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <h3 className="font-medium text-stone-800 text-sm mb-4">Tambah Acara Baru</h3>
          <EventForm
            defaultValues={{ type: defaultEventType as EventInput["type"], sortOrder: 0 }}
            eventOptions={eventOptions}
            onSubmit={(data) => saveEvent(data)}
            onCancel={() => setOpenForm(null)}
            loading={loading}
          />
        </div>
      ) : (
        <button
          onClick={() => setOpenForm("new")}
          className="flex items-center gap-2 w-full border-2 border-dashed border-stone-300 rounded-2xl px-5 py-4 text-stone-500 hover:border-stone-400 hover:text-stone-700 transition-colors text-sm"
        >
          <Plus size={16} />
          Tambah Acara
        </button>
      )}
    </div>
  );
}

function EventForm({
  defaultValues,
  eventOptions,
  onSubmit,
  onCancel,
  loading,
}: {
  defaultValues?: Partial<EventInput>;
  eventOptions: { value: string; label: string }[];
  onSubmit: (data: EventInput) => void;
  onCancel?: () => void;
  loading?: boolean;
}) {
  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm<EventInput>({
    resolver: zodResolver(eventSchema) as any,
    defaultValues: defaultValues ?? { type: (eventOptions[0]?.value ?? "AKAD") as EventInput["type"], sortOrder: 0 },
  });

  const selectedType = useWatch({ control, name: "type" }) as string;
  const timeEnd = useWatch({ control, name: "timeEnd" });
  const isOpenEnded = timeEnd === "Selesai";
  const ph = VENUE_PLACEHOLDERS[selectedType] ?? VENUE_PLACEHOLDERS.RESEPSI;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Jenis Acara</label>
          <select {...register("type")} className={inputClass}>
            {eventOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Label Kustom (ID)</label>
          <input {...register("label")} placeholder="Opsional — timpa nama acara" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Label Kustom (EN)</label>
          <input {...register("labelEn")} placeholder="Optional — English label" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Tanggal</label>
          <input type="date" {...register("date")} className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelClass}>Jam Mulai</label>
            <input type="time" {...register("timeStart")} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Jam Selesai</label>
            <input
              type="time"
              {...register("timeEnd")}
              disabled={isOpenEnded}
              className={`${inputClass} disabled:bg-stone-100 disabled:text-stone-400`}
            />
            <label className="flex items-center gap-1.5 mt-1.5 text-xs text-stone-500 cursor-pointer">
              <input
                type="checkbox"
                checked={isOpenEnded}
                onChange={(e) => setValue("timeEnd", e.target.checked ? "Selesai" : "", { shouldDirty: true })}
                className="accent-stone-700"
              />
              Sampai selesai (tanpa jam pasti)
            </label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Nama Venue (ID)</label>
          <input {...register("venueName")} placeholder={ph.name} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Nama Venue (EN)</label>
          <input {...register("venueNameEn")} placeholder="Optional — English venue name" className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Alamat Venue</label>
        <textarea {...register("venueAddress")} rows={2} placeholder={ph.address} className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>Link Google Maps</label>
        <input {...register("mapsUrl")} placeholder={ph.maps} className={inputClass} />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Menyimpan..." : "Simpan"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="border border-stone-300 text-stone-600 px-5 py-2 rounded-lg text-sm hover:bg-stone-50"
          >
            Batal
          </button>
        )}
      </div>
    </form>
  );
}

const inputClass =
  "w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400";
const labelClass = "block text-sm font-medium text-stone-700 mb-1";

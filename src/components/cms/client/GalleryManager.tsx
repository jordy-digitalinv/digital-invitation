"use client";

import { useState, useRef } from "react";
import { Trash2, Plus, Image, GripVertical } from "lucide-react";

type GalleryType = "HERO" | "COVER" | "BACKGROUND" | "PREWEDDING" | "GALLERY";

interface GalleryItem {
  id: string;
  url: string;
  type: GalleryType;
  sortOrder: number;
}

interface Props {
  clientId: string;
  initialGalleries: GalleryItem[];
}

const TYPE_LABELS: Record<GalleryType, string> = {
  HERO: "Hero (dalam undangan)",
  COVER: "Cover (halaman pembuka)",
  BACKGROUND: "Background (latar dalam undangan)",
  PREWEDDING: "Prewedding",
  GALLERY: "Galeri",
};

const inputClass =
  "w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300";
const labelClass = "block text-xs font-medium text-stone-600 mb-1";

export function GalleryManager({ clientId, initialGalleries }: Props) {
  const [galleries, setGalleries] = useState<GalleryItem[]>(initialGalleries);
  const [url, setUrl] = useState("");
  const [type, setType] = useState<GalleryType>("GALLERY");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const dragId = useRef<string | null>(null);

  async function addToGallery(photoUrl: string) {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/clients/${clientId}/gallery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: photoUrl, type }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Gagal menambahkan foto"); return; }
      setGalleries((prev) => [...prev, data]);
      setUrl("");
    } finally {
      setSaving(false);
    }
  }

  function handleAddUrl() {
    if (!url.trim()) return;
    addToGallery(url.trim());
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus foto ini?")) return;
    const res = await fetch(`/api/clients/${clientId}/gallery`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) setGalleries((prev) => prev.filter((g) => g.id !== id));
  }

  async function saveOrder(newGalleries: GalleryItem[]) {
    await fetch(`/api/clients/${clientId}/gallery`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: newGalleries.map((g) => g.id) }),
    });
  }

  function onDragStart(id: string) {
    dragId.current = id;
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function onDrop(targetId: string) {
    const srcId = dragId.current;
    dragId.current = null;
    if (!srcId || srcId === targetId) return;

    setGalleries((prev) => {
      const next = [...prev];
      const srcIdx = next.findIndex((g) => g.id === srcId);
      const tgtIdx = next.findIndex((g) => g.id === targetId);
      if (srcIdx === -1 || tgtIdx === -1) return prev;
      const [removed] = next.splice(srcIdx, 1);
      next.splice(tgtIdx, 0, removed);
      // Save async
      saveOrder(next);
      return next;
    });
  }

  const typeGroups = (Object.keys(TYPE_LABELS) as GalleryType[]).map((t) => ({
    type: t,
    label: TYPE_LABELS[t],
    items: galleries.filter((g) => g.type === t),
  }));

  const isBusy = saving;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-stone-200 p-6">
        <h2 className="font-semibold text-stone-800 mb-4">Tambah Foto</h2>

        <div className="mb-4 w-48">
          <label className={labelClass}>Tipe Foto</label>
          <select value={type} onChange={(e) => setType(e.target.value as GalleryType)} className={inputClass}>
            {(Object.entries(TYPE_LABELS) as [GalleryType, string][]).map(([val, lbl]) => (
              <option key={val} value={val}>{lbl}</option>
            ))}
          </select>
          <p className="text-xs text-stone-400 mt-1">
            Cover: halaman pembuka. Background: latar isi undangan. Hero: gambar besar dalam undangan. Prewedding/Galeri: carousel galeri.
          </p>
        </div>

        <div>
          <label className={labelClass}>URL Foto</label>
          <div className="flex gap-2">
            <input type="url" placeholder="https://... (bukan link Google Drive)" value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddUrl()}
              className={inputClass} />
            <button onClick={handleAddUrl} disabled={isBusy || !url.trim()}
              className="shrink-0 flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors">
              <Plus size={14} />
              {saving ? "..." : "Tambah"}
            </button>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            Link Google Drive belum bisa dipakai. Upload dulu fotonya ke{" "}
            <a href="https://postimages.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-stone-600">postimages.org</a>
            {" "}atau{" "}
            <a href="https://imgbb.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-stone-600">imgbb.com</a>
            {" "}(gratis, tanpa akun), lalu tempel link fotonya di sini.
          </p>
        </div>

        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      </div>

      {typeGroups.map(({ type: t, label, items }) => {
        if (items.length === 0) return null;
        return (
          <div key={t} className="bg-white rounded-2xl border border-stone-200 p-6">
            <h3 className="font-semibold text-stone-800 mb-2 flex items-center gap-2">
              <Image size={16} className="text-stone-400" />
              {label}
              <span className="text-xs font-normal text-stone-400">({items.length} foto)</span>
            </h3>
            <p className="text-xs text-stone-400 mb-4">Drag foto untuk mengubah urutan</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => onDragStart(item.id)}
                  onDragOver={onDragOver}
                  onDrop={() => onDrop(item.id)}
                  className="relative group aspect-square rounded-lg overflow-hidden border border-stone-200 bg-stone-50 cursor-grab active:cursor-grabbing active:ring-2 active:ring-blue-400 transition-all"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.url} alt="" className="w-full h-full object-cover pointer-events-none" />
                  {/* Drag handle indicator */}
                  <div className="absolute top-1.5 left-1.5 opacity-0 group-hover:opacity-100 bg-black/40 text-white p-1 rounded transition-opacity">
                    <GripVertical size={11} />
                  </div>
                  {/* Delete button */}
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 bg-red-500 text-white p-1.5 rounded-md transition-opacity"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {galleries.length === 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center">
          <Image size={32} className="text-stone-300 mx-auto mb-3" />
          <p className="text-stone-500 text-sm font-medium">Belum ada foto</p>
          <p className="text-stone-400 text-xs mt-1">Tambahkan foto dari URL.</p>
        </div>
      )}
    </div>
  );
}

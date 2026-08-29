"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Trash2, Download, RefreshCw, Camera, Users, X, Check, CloudUpload, ExternalLink, Archive } from "lucide-react";

interface Photo {
  id: string;
  url: string;
  createdAt: string;
  guest: { id: string; name: string } | null;
}

interface GroupedPhotos {
  guestId: string;
  guestName: string;
  photos: Photo[];
}

interface DriveStatus {
  connected: boolean;
  email: string | null;
}

export function GuestPhotoManager({
  clientId,
  initialDisposableCameraEnabled = true,
}: {
  clientId: string;
  initialDisposableCameraEnabled?: boolean;
}) {
  const [disposableCameraEnabled, setDisposableCameraEnabled] = useState(initialDisposableCameraEnabled);
  const [savingToggle, setSavingToggle] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [view, setView] = useState<"grid" | "by-guest">("grid");
  const [previewPhoto, setPreviewPhoto] = useState<Photo | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [driveStatus, setDriveStatus] = useState<DriveStatus | null>(null);
  const [folderInput, setFolderInput] = useState("");
  const [transferring, setTransferring] = useState(false);
  const [transferResult, setTransferResult] = useState<{ success: number; failed: number } | null>(null);
  const [gdriveNotice, setGdriveNotice] = useState<string | null>(null);
  const [zipping, setZipping] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  const loadPhotos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/guest-photos`);
      const data = await res.json();
      if (Array.isArray(data)) setPhotos(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  const loadDriveStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/google-drive/status");
      const data = await res.json();
      setDriveStatus({ connected: !!data.connected, email: data.email ?? null });
    } catch {
      setDriveStatus({ connected: false, email: null });
    }
  }, []);

  useEffect(() => { loadPhotos(); }, [loadPhotos]);
  useEffect(() => { loadDriveStatus(); }, [loadDriveStatus]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gdrive = params.get("gdrive");
    if (gdrive === "connected") setGdriveNotice("Google Drive berhasil terhubung.");
    else if (gdrive === "error") setGdriveNotice(params.get("gdrive_message") || "Gagal menghubungkan Google Drive.");
    if (gdrive) router.replace(pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggleDisposableCamera() {
    const next = !disposableCameraEnabled;
    setDisposableCameraEnabled(next);
    setSavingToggle(true);
    try {
      await fetch(`/api/clients/${clientId}/theme`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disposableCameraEnabled: next }),
      });
    } catch {
      setDisposableCameraEnabled(!next);
    } finally {
      setSavingToggle(false);
    }
  }

  async function deletePhoto(id: string) {
    if (!confirm("Hapus foto ini?")) return;
    setDeleting(id);
    try {
      await fetch(`/api/clients/${clientId}/guest-photos/${id}`, { method: "DELETE" });
      setPhotos((prev) => prev.filter((p) => p.id !== id));
      setSelected((prev) => { const next = new Set(prev); next.delete(id); return next; });
    } catch {
      alert("Gagal menghapus foto");
    } finally {
      setDeleting(null);
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(photos.map((p) => p.id)));
  }

  function clearSelection() {
    setSelected(new Set());
  }

  async function transferToDrive() {
    if (!folderInput.trim() || selected.size === 0) return;
    setTransferring(true);
    setTransferResult(null);
    try {
      const res = await fetch("/api/admin/google-drive/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, photoIds: Array.from(selected), folderId: folderInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal transfer");
      const success = data.results.filter((r: { success: boolean }) => r.success).length;
      const failed = data.results.length - success;
      setTransferResult({ success, failed });
      if (failed === 0) clearSelection();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal transfer ke Google Drive");
    } finally {
      setTransferring(false);
    }
  }

  async function downloadSelectedAsZip() {
    if (selected.size === 0) return;
    setZipping(true);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      const toDownload = photos.filter((p) => selected.has(p.id));

      await Promise.all(
        toDownload.map(async (photo, i) => {
          const res = await fetch(photo.url);
          const blob = await res.blob();
          const guestName = (photo.guest?.name || "tamu").replace(/[^a-zA-Z0-9 _-]/g, "").trim() || "tamu";
          zip.file(`${guestName}-${i + 1}.jpg`, blob);
        })
      );

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "foto-tamu.zip";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Gagal membuat file ZIP");
    } finally {
      setZipping(false);
    }
  }

  const grouped: GroupedPhotos[] = Object.values(
    photos.reduce<Record<string, GroupedPhotos>>((acc, photo) => {
      const key = photo.guest?.id ?? "unknown";
      const name = photo.guest?.name ?? "Tamu tidak dikenal";
      if (!acc[key]) acc[key] = { guestId: key, guestName: name, photos: [] };
      acc[key].photos.push(photo);
      return acc;
    }, {})
  );

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-stone-800">Foto Tamu</h2>
          <p className="text-stone-500 text-sm mt-0.5">
            {loading ? "Memuat..." : `${photos.length} foto dari ${grouped.length} tamu`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView("grid")}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
              view === "grid" ? "bg-stone-800 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setView("by-guest")}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
              view === "by-guest" ? "bg-stone-800 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            Per Tamu
          </button>
          <button
            onClick={loadPhotos}
            className="p-1.5 rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Disposable camera toggle */}
      <label className="flex items-center justify-between cursor-pointer bg-white border border-stone-200 rounded-xl px-4 py-3">
        <div>
          <p className="text-sm font-medium text-stone-700">Kamera Tamu (Disposable Camera)</p>
          <p className="text-xs text-stone-400 mt-0.5">Izinkan tamu mengambil dan mengupload foto lewat undangan</p>
        </div>
        <button
          type="button"
          onClick={toggleDisposableCamera}
          disabled={savingToggle}
          className="relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ml-4 disabled:opacity-60"
          style={{ background: disposableCameraEnabled ? "#292524" : "#d6d3d1" }}
        >
          <span
            className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
            style={{ transform: disposableCameraEnabled ? "translateX(20px)" : "translateX(0)" }}
          />
        </button>
      </label>

      {gdriveNotice && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg bg-amber-50 text-amber-800 text-sm">
          <span>{gdriveNotice}</span>
          <button onClick={() => setGdriveNotice(null)} className="text-amber-500 hover:text-amber-700">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Selection toolbar */}
      {!loading && photos.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={selected.size === photos.length ? clearSelection : selectAll}
            className="px-3 py-1.5 text-xs rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors"
          >
            {selected.size === photos.length ? "Batal Pilih" : "Pilih Semua"}
          </button>
          {selected.size > 0 && (
            <span className="text-xs text-stone-500">{selected.size} foto dipilih</span>
          )}
        </div>
      )}

      {/* Empty state */}
      {!loading && photos.length === 0 && (
        <div className="text-center py-16 text-stone-400">
          <Camera size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">Belum ada foto dari tamu</p>
          <p className="text-xs mt-1">Foto akan muncul di sini setelah tamu mengupload</p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-stone-100 animate-pulse" />
          ))}
        </div>
      )}

      {/* Grid view */}
      {!loading && view === "grid" && photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {photos.map((photo) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              onDelete={deletePhoto}
              deleting={deleting}
              onPreview={setPreviewPhoto}
              selected={selected.has(photo.id)}
              onToggleSelect={toggleSelect}
            />
          ))}
        </div>
      )}

      {/* By-guest view */}
      {!loading && view === "by-guest" && grouped.length > 0 && (
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.guestId}>
              <div className="flex items-center gap-2 mb-3">
                <Users size={14} className="text-stone-400" />
                <span className="text-sm font-medium text-stone-700">{group.guestName}</span>
                <span className="text-xs text-stone-400">{group.photos.length}/12 foto</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {group.photos.map((photo) => (
                  <PhotoCard
                    key={photo.id}
                    photo={photo}
                    onDelete={deletePhoto}
                    deleting={deleting}
                    onPreview={setPreviewPhoto}
                    selected={selected.has(photo.id)}
                    onToggleSelect={toggleSelect}
                    compact
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview modal */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewPhoto(null)}
        >
          <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewPhoto(null)}
              className="absolute -top-10 right-0 text-white/70 hover:text-white"
            >
              <X size={22} />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewPhoto.url}
              alt={`Foto dari ${previewPhoto.guest?.name ?? "tamu"}`}
              className="w-full max-h-[80vh] object-contain rounded-lg bg-black"
            />
            <div className="flex items-center justify-between mt-3">
              <span className="text-white/80 text-sm">{previewPhoto.guest?.name ?? "Tamu tidak dikenal"}</span>
              <a
                href={previewPhoto.url}
                download
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-stone-800 text-xs font-medium hover:bg-stone-100"
              >
                <Download size={13} /> Download
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Bottom action bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-stone-200 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-stone-700 shrink-0">{selected.size} foto dipilih</span>

            <button
              onClick={downloadSelectedAsZip}
              disabled={zipping}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-stone-100 text-stone-700 text-xs font-medium hover:bg-stone-200 disabled:opacity-40"
            >
              {zipping ? (
                <span className="w-3 h-3 rounded-full border border-stone-400/40 border-t-stone-600 animate-spin" />
              ) : (
                <Archive size={13} />
              )}
              {zipping ? "Menyiapkan ZIP..." : "Download ZIP"}
            </button>

            <span className="text-stone-300 hidden sm:inline">|</span>

            {driveStatus === null ? null : !driveStatus.connected ? (
              <a
                href={`/api/admin/google-drive/connect?returnTo=${encodeURIComponent(pathname)}`}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-stone-800 text-white text-xs font-medium hover:bg-stone-700"
              >
                <ExternalLink size={13} /> Hubungkan Google Drive
              </a>
            ) : (
              <>
                <input
                  type="text"
                  value={folderInput}
                  onChange={(e) => setFolderInput(e.target.value)}
                  placeholder="Link atau ID folder Google Drive tujuan"
                  className="flex-1 min-w-[220px] px-3 py-2 text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-300"
                />
                <button
                  onClick={transferToDrive}
                  disabled={transferring || !folderInput.trim()}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-stone-800 text-white text-xs font-medium hover:bg-stone-700 disabled:opacity-40"
                >
                  {transferring ? (
                    <span className="w-3 h-3 rounded-full border border-white/30 border-t-white animate-spin" />
                  ) : (
                    <CloudUpload size={13} />
                  )}
                  {transferring ? "Mentransfer..." : `Transfer ${selected.size} Foto`}
                </button>
              </>
            )}
          </div>
          {transferResult && (
            <div className="max-w-7xl mx-auto px-4 pb-3 text-xs text-stone-500">
              {transferResult.success} berhasil{transferResult.failed > 0 ? `, ${transferResult.failed} gagal` : ""}.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PhotoCard({
  photo,
  onDelete,
  deleting,
  onPreview,
  selected,
  onToggleSelect,
  compact = false,
}: {
  photo: Photo;
  onDelete: (id: string) => void;
  deleting: string | null;
  onPreview: (photo: Photo) => void;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  compact?: boolean;
}) {
  const isDeleting = deleting === photo.id;

  return (
    <div
      className={`relative group rounded-xl overflow-hidden bg-stone-100 cursor-pointer ${compact ? "aspect-square" : "aspect-square"}`}
      onClick={() => onPreview(photo)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.url}
        alt={`Foto dari ${photo.guest?.name ?? "tamu"}`}
        className="w-full h-full object-cover"
        loading="lazy"
      />

      {/* Selection checkbox */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleSelect(photo.id); }}
        className={`absolute top-2 left-2 w-6 h-6 rounded-md flex items-center justify-center border-2 transition-colors ${
          selected ? "bg-amber-500 border-amber-500" : "bg-black/30 border-white/70 hover:bg-black/50"
        }`}
      >
        {selected && <Check size={14} className="text-white" />}
      </button>

      {/* Overlay on hover */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end justify-between p-2 opacity-0 group-hover:opacity-100">
        {!compact && (
          <span className="text-white text-xs truncate max-w-[70%]">
            {photo.guest?.name ?? "?"}
          </span>
        )}
        <div className="flex gap-1 ml-auto">
          <a
            href={photo.url}
            download
            target="_blank"
            rel="noreferrer"
            className="w-7 h-7 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <Download size={13} />
          </a>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(photo.id); }}
            disabled={isDeleting}
            className="w-7 h-7 rounded-lg bg-red-500/70 hover:bg-red-500 flex items-center justify-center text-white transition-colors disabled:opacity-50"
          >
            {isDeleting ? (
              <span className="w-3 h-3 rounded-full border border-white/30 border-t-white animate-spin" />
            ) : (
              <Trash2 size={13} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

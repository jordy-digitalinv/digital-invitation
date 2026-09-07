"use client";

import { useState, useRef } from "react";
import { Trash2, Music, Plus, Play, Pause, Radio } from "lucide-react";
import { getYouTubeId, loadYouTubeApi } from "@/lib/youtube";

type YTPlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  setVolume: (v: number) => void;
  destroy: () => void;
};

interface MusicItem {
  id: string;
  title: string;
  url: string;
  isActive: boolean;
}

interface Props {
  clientId: string;
  initialMusics: MusicItem[];
}

const inputClass =
  "w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300";
const labelClass = "block text-xs font-medium text-stone-600 mb-1";

export function MusicManager({ clientId, initialMusics }: Props) {
  const [musics, setMusics] = useState<MusicItem[]>(initialMusics);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playError, setPlayError] = useState("");

  // Single audio element — src switched on demand
  const audioRef = useRef<HTMLAudioElement>(null);
  // Hidden YouTube IFrame player for previewing YouTube links
  const ytHostRef = useRef<HTMLDivElement>(null);
  const ytPlayerRef = useRef<YTPlayer | null>(null);

  const urlIsYouTube = !!getYouTubeId(url);

  function stopYouTube() {
    try {
      ytPlayerRef.current?.pauseVideo();
    } catch {}
  }

  async function previewYouTube(music: MusicItem, videoId: string) {
    // Stop any direct-audio preview first
    audioRef.current?.pause();

    if (playingId === music.id) {
      stopYouTube();
      setPlayingId(null);
      return;
    }

    try {
      const YT = await loadYouTubeApi();
      // Recreate a fresh player per preview to avoid load-before-ready races
      try {
        ytPlayerRef.current?.destroy();
      } catch {}
      if (ytHostRef.current) ytHostRef.current.innerHTML = "";
      const el = document.createElement("div");
      ytHostRef.current?.appendChild(el);
      ytPlayerRef.current = new YT.Player(el, {
        height: "0",
        width: "0",
        videoId,
        playerVars: { autoplay: 1, controls: 0, playsinline: 1 },
        events: {
          onReady: (e: { target: YTPlayer }) => {
            e.target.setVolume(60);
            e.target.playVideo();
          },
          onStateChange: (e: { data: number }) => {
            if (e.data === YT.PlayerState.ENDED) setPlayingId(null);
          },
          onError: () => {
            setPlayError("YouTube tidak bisa diputar (pemilik video mungkin menonaktifkan embed). Coba video lain.");
            setPlayingId(null);
          },
        },
      }) as YTPlayer;
      setPlayingId(music.id);
    } catch {
      setPlayError("Gagal memuat pemutar YouTube. Cek koneksi internet.");
      setPlayingId(null);
    }
  }

  async function addMusic(songTitle: string, songUrl: string) {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/clients/${clientId}/music`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: songTitle, url: songUrl }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Gagal menambahkan"); return; }
      setMusics((prev) => [...prev.map((m) => ({ ...m, isActive: false })), data]);
      setTitle("");
      setUrl("");
    } finally {
      setSaving(false);
    }
  }

  function handleAddUrl() {
    if (!title.trim() || !url.trim()) { setError("Judul dan URL harus diisi"); return; }
    addMusic(title.trim(), url.trim());
  }

  async function handleToggle(id: string, isActive: boolean) {
    const res = await fetch(`/api/clients/${clientId}/music`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive }),
    });
    if (res.ok) {
      setMusics((prev) =>
        isActive
          ? prev.map((m) => ({ ...m, isActive: m.id === id }))
          : prev.map((m) => (m.id === id ? { ...m, isActive: false } : m))
      );
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus lagu ini?")) return;
    if (playingId === id) {
      audioRef.current?.pause();
      stopYouTube();
      setPlayingId(null);
    }
    const res = await fetch(`/api/clients/${clientId}/music`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) setMusics((prev) => prev.filter((m) => m.id !== id));
  }

  async function handlePreview(music: MusicItem) {
    setPlayError("");

    const videoId = getYouTubeId(music.url);
    if (videoId) {
      await previewYouTube(music, videoId);
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;
    // Stop any YouTube preview before playing a direct file
    stopYouTube();

    if (playingId === music.id) {
      // Pause current
      audio.pause();
      setPlayingId(null);
    } else {
      // Switch source and play
      audio.pause();
      audio.src = music.url;
      audio.load();
      try {
        await audio.play();
        setPlayingId(music.id);
      } catch (e: any) {
        setPlayError(`Gagal memutar: ${e?.message || "format tidak didukung atau file tidak ditemukan"}`);
        setPlayingId(null);
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Single shared audio element */}
      <audio
        ref={audioRef}
        preload="auto"
        onEnded={() => setPlayingId(null)}
        onError={() => {
          setPlayError("File audio tidak bisa diputar. Pastikan format MP3/OGG/WAV dan URL dapat diakses.");
          setPlayingId(null);
        }}
      />

      {/* Hidden host for the YouTube preview player */}
      <div aria-hidden style={{ position: "fixed", left: -9999, top: -9999, width: 0, height: 0, overflow: "hidden" }}>
        <div ref={ytHostRef} />
      </div>

      {/* Add form */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6">
        <h2 className="font-semibold text-stone-800 mb-1">Tambah Lagu</h2>
        <p className="text-xs text-stone-400 mb-4">
          Hanya satu lagu yang aktif sekaligus. Menambah lagu baru otomatis menjadikannya aktif.
        </p>

        <div className="space-y-3">
          <div>
            <label className={labelClass}>Judul Lagu</label>
            <input type="text" placeholder="Cinta Luar Biasa - Andmesh"
              value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>URL Lagu / Link YouTube</label>
            <input type="text" placeholder="Tempel link YouTube atau URL file audio (.mp3)"
              value={url} onChange={(e) => setUrl(e.target.value)} className={inputClass} />
            {urlIsYouTube ? (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <Play size={11} /> Link YouTube terdeteksi — bisa langsung dipakai. Klik tombol play di daftar untuk tes.
              </p>
            ) : (
              <p className="text-xs text-stone-400 mt-1">
                Tempel link YouTube (mis. https://youtu.be/...) atau URL langsung ke file audio (MP3, OGG, WAV).
              </p>
            )}
          </div>
        </div>

        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}

        <button onClick={handleAddUrl} disabled={saving}
          className="mt-4 flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors">
          <Plus size={14} />
          {saving ? "Menyimpan..." : "Tambah Lagu"}
        </button>
      </div>

      {/* Music list */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100">
          <h2 className="font-semibold text-stone-800">
            Daftar Lagu
            <span className="ml-2 text-xs font-normal text-stone-400">({musics.length} lagu)</span>
          </h2>
        </div>

        {playError && (
          <div className="mx-4 mt-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg px-4 py-2">
            {playError}
          </div>
        )}

        {musics.length === 0 ? (
          <div className="p-10 text-center">
            <Music size={32} className="text-stone-300 mx-auto mb-3" />
            <p className="text-stone-400 text-sm">Belum ada lagu ditambahkan.</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {musics.map((music) => (
              <div key={music.id} className="flex items-center gap-3 px-6 py-4">
                {/* Play/pause preview button */}
                <button
                  onClick={() => handlePreview(music)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                    playingId === music.id
                      ? "bg-blue-600 text-white"
                      : "bg-stone-100 hover:bg-stone-200 text-stone-600"
                  }`}
                >
                  {playingId === music.id ? <Pause size={14} /> : <Play size={14} />}
                </button>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-800 truncate">{music.title}</p>
                  <p className="text-xs text-stone-400 truncate">{music.url}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggle(music.id, !music.isActive)}
                    title={music.isActive ? "Nonaktifkan" : "Aktifkan"}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      music.isActive
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                    }`}
                  >
                    <Radio size={10} />
                    {music.isActive ? "Aktif" : "Nonaktif"}
                  </button>

                  <button onClick={() => handleDelete(music.id)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-xs text-amber-700">
          <strong>Catatan:</strong> Lagu akan otomatis diputar saat tamu membuka undangan (setelah klik "Buka Undangan"). Link YouTube juga didukung — pemutaran berjalan di latar (audio saja).
        </p>
      </div>
    </div>
  );
}

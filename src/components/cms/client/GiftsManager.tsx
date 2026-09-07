"use client";

import { useState } from "react";
import { Trash2, Plus, Eye, EyeOff, CreditCard, Wallet, QrCode, X, Gift as GiftIcon, MapPin } from "lucide-react";

type GiftMode = "bank" | "ewallet" | "qris" | "address";

interface Gift {
  id: string;
  kind: string;
  receiverName: string | null;
  receiverPhone: string | null;
  address: string | null;
  bankName: string | null;
  accountNumber: string | null;
  accountName: string | null;
  ewalletType: string | null;
  ewalletNumber: string | null;
  qrisImage: string | null;
  isActive: boolean;
  sortOrder: number;
}

interface Props {
  clientId: string;
  initialGifts: Gift[];
}

const EWALLET_OPTIONS = ["GoPay", "OVO", "DANA", "ShopeePay", "LinkAja", "Jenius"];

const inputClass =
  "w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300";
const labelClass = "block text-xs font-medium text-stone-600 mb-1";

export function GiftsManager({ clientId, initialGifts }: Props) {
  const [gifts, setGifts] = useState<Gift[]>(initialGifts);
  const [mode, setMode] = useState<GiftMode>("bank");
  const [form, setForm] = useState({
    bankName: "",
    accountNumber: "",
    accountName: "",
    ewalletType: "GoPay",
    ewalletNumber: "",
    qrisLabel: "",
    receiverName: "",
    receiverPhone: "",
    address: "",
  });
  const [qrisImageUrl, setQrisImageUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function updateForm(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleAdd() {
    setSaving(true);
    setError("");
    try {
      let payload: Record<string, string | undefined>;

      if (mode === "bank") {
        payload = {
          kind: "BANK",
          bankName: form.bankName,
          accountNumber: form.accountNumber,
          accountName: form.accountName,
        };
      } else if (mode === "ewallet") {
        payload = {
          kind: "EWALLET",
          ewalletType: form.ewalletType,
          ewalletNumber: form.ewalletNumber,
        };
      } else if (mode === "address") {
        if (!form.address.trim()) {
          setError("Alamat pengiriman wajib diisi");
          setSaving(false);
          return;
        }
        payload = {
          kind: "ADDRESS",
          receiverName: form.receiverName,
          receiverPhone: form.receiverPhone,
          address: form.address,
        };
      } else {
        if (!qrisImageUrl) {
          setError("Upload gambar QRIS terlebih dahulu");
          setSaving(false);
          return;
        }
        payload = {
          kind: "QRIS",
          ewalletType: form.qrisLabel || "QRIS",
          qrisImage: qrisImageUrl,
        };
      }

      const res = await fetch(`/api/clients/${clientId}/gifts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal menambahkan");
        return;
      }
      setGifts((prev) => [...prev, data]);
      setForm({ bankName: "", accountNumber: "", accountName: "", ewalletType: "GoPay", ewalletNumber: "", qrisLabel: "", receiverName: "", receiverPhone: "", address: "" });
      setQrisImageUrl(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(id: string, isActive: boolean) {
    const res = await fetch(`/api/clients/${clientId}/gifts`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive }),
    });
    if (res.ok) {
      setGifts((prev) => prev.map((g) => (g.id === id ? { ...g, isActive } : g)));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus rekening ini?")) return;
    const res = await fetch(`/api/clients/${clientId}/gifts`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) setGifts((prev) => prev.filter((g) => g.id !== id));
  }

  const isBank = (g: Gift) => !!g.bankName && !g.qrisImage;
  const isQris = (g: Gift) => !!g.qrisImage;
  const isAddress = (g: Gift) => g.kind === "ADDRESS";

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-stone-200 p-6">
        <h2 className="font-semibold text-stone-800 mb-4">Tambah Rekening / E-Wallet / QRIS</h2>

        <div className="flex gap-2 mb-5 flex-wrap">
          <button
            onClick={() => setMode("bank")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === "bank" ? "bg-blue-600 text-white" : "border border-stone-200 text-stone-600 hover:bg-stone-50"
            }`}
          >
            <CreditCard size={14} /> Transfer Bank
          </button>
          <button
            onClick={() => setMode("ewallet")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === "ewallet" ? "bg-blue-600 text-white" : "border border-stone-200 text-stone-600 hover:bg-stone-50"
            }`}
          >
            <Wallet size={14} /> E-Wallet
          </button>
          <button
            onClick={() => setMode("qris")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === "qris" ? "bg-blue-600 text-white" : "border border-stone-200 text-stone-600 hover:bg-stone-50"
            }`}
          >
            <QrCode size={14} /> QRIS
          </button>
          <button
            onClick={() => setMode("address")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === "address" ? "bg-blue-600 text-white" : "border border-stone-200 text-stone-600 hover:bg-stone-50"
            }`}
          >
            <GiftIcon size={14} /> Kirim Kado
          </button>
        </div>

        {mode === "bank" && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className={labelClass}>Nama Bank</label>
              <input
                type="text"
                placeholder="BCA, BNI, Mandiri..."
                value={form.bankName}
                onChange={(e) => updateForm("bankName", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Nomor Rekening</label>
              <input
                type="text"
                placeholder="0123456789"
                value={form.accountNumber}
                onChange={(e) => updateForm("accountNumber", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Atas Nama</label>
              <input
                type="text"
                placeholder="Nama pemilik rekening"
                value={form.accountName}
                onChange={(e) => updateForm("accountName", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        )}

        {mode === "ewallet" && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Platform</label>
              <select
                value={form.ewalletType}
                onChange={(e) => updateForm("ewalletType", e.target.value)}
                className={inputClass}
              >
                {EWALLET_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Nomor</label>
              <input
                type="text"
                placeholder="08xxxxxxxxxx"
                value={form.ewalletNumber}
                onChange={(e) => updateForm("ewalletNumber", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        )}

        {mode === "qris" && (
          <div className="space-y-3">
            <div>
              <label className={labelClass}>Label (opsional)</label>
              <input
                type="text"
                placeholder="Contoh: GoPay QRIS, BCA QRIS..."
                value={form.qrisLabel}
                onChange={(e) => updateForm("qrisLabel", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>URL Gambar QRIS</label>
              <input
                type="url"
                placeholder="https://... (bukan link Google Drive)"
                value={qrisImageUrl ?? ""}
                onChange={(e) => setQrisImageUrl(e.target.value || null)}
                className={inputClass}
              />
              <p className="text-xs text-stone-400 mt-1">
                Link Google Drive belum bisa dipakai. Upload dulu gambarnya ke{" "}
                <a href="https://postimages.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-stone-600">postimages.org</a>
                {" "}atau{" "}
                <a href="https://imgbb.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-stone-600">imgbb.com</a>
                {" "}(gratis, tanpa akun), lalu tempel link-nya di sini.
              </p>
              {qrisImageUrl && (
                <div className="relative inline-block mt-3">
                  <img
                    src={qrisImageUrl}
                    alt="QRIS preview"
                    className="w-40 h-40 object-contain rounded-xl border border-stone-200"
                  />
                  <button
                    onClick={() => setQrisImageUrl(null)}
                    className="absolute -top-2 -right-2 bg-white border border-stone-200 rounded-full p-0.5 text-stone-500 hover:text-red-500"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {mode === "address" && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Nama Penerima</label>
              <input
                type="text"
                placeholder="Nama penerima kado"
                value={form.receiverName}
                onChange={(e) => updateForm("receiverName", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>No. Telepon (opsional)</label>
              <input
                type="text"
                placeholder="08xxxxxxxxxx"
                value={form.receiverPhone}
                onChange={(e) => updateForm("receiverPhone", e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Alamat Lengkap</label>
              <textarea
                rows={3}
                placeholder="Jalan, nomor rumah, RT/RW, kelurahan, kecamatan, kota, kode pos"
                value={form.address}
                onChange={(e) => updateForm("address", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        )}

        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}

        <button
          onClick={handleAdd}
          disabled={saving}
          className="mt-4 flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Plus size={14} />
          {saving ? "Menyimpan..." : "Tambah"}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100">
          <h2 className="font-semibold text-stone-800">
            Daftar Rekening
            <span className="ml-2 text-xs font-normal text-stone-400">
              ({gifts.length} rekening)
            </span>
          </h2>
        </div>
        {gifts.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-stone-400 text-sm">Belum ada rekening ditambahkan.</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {gifts.map((gift) => (
              <div key={gift.id} className="flex items-center gap-4 px-6 py-4">
                <div className={`p-2 rounded-lg ${isAddress(gift) ? "bg-amber-50" : isQris(gift) ? "bg-purple-50" : isBank(gift) ? "bg-blue-50" : "bg-green-50"}`}>
                  {isAddress(gift) ? (
                    <GiftIcon size={16} className="text-amber-500" />
                  ) : isQris(gift) ? (
                    <QrCode size={16} className="text-purple-500" />
                  ) : isBank(gift) ? (
                    <CreditCard size={16} className="text-blue-500" />
                  ) : (
                    <Wallet size={16} className="text-green-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  {isAddress(gift) ? (
                    <>
                      <p className="text-sm font-medium text-stone-800 flex items-center gap-1.5">
                        <MapPin size={12} className="text-amber-500" /> Alamat Kirim Kado
                      </p>
                      <p className="text-xs text-stone-600">{gift.receiverName}{gift.receiverPhone ? ` · ${gift.receiverPhone}` : ""}</p>
                      <p className="text-xs text-stone-400 line-clamp-2">{gift.address}</p>
                    </>
                  ) : isBank(gift) ? (
                    <>
                      <p className="text-sm font-medium text-stone-800">{gift.bankName}</p>
                      <p className="text-xs text-stone-500 font-mono">{gift.accountNumber}</p>
                      <p className="text-xs text-stone-400">{gift.accountName}</p>
                    </>
                  ) : isQris(gift) ? (
                    <>
                      <p className="text-sm font-medium text-stone-800">{gift.ewalletType || "QRIS"}</p>
                      <p className="text-xs text-stone-400">QRIS Image</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-stone-800">{gift.ewalletType}</p>
                      <p className="text-xs text-stone-500 font-mono">{gift.ewalletNumber}</p>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(gift.id, !gift.isActive)}
                    title={gift.isActive ? "Nonaktifkan" : "Aktifkan"}
                    className={`p-1.5 rounded-lg transition-colors ${
                      gift.isActive ? "text-stone-600 hover:bg-stone-100" : "text-stone-300 hover:bg-stone-100"
                    }`}
                  >
                    {gift.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <button
                    onClick={() => handleDelete(gift.id)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

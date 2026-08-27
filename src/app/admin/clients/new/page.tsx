"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClientSchema, type CreateClientInput } from "@/modules/clients/clients.schema";
import { slugify } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, Heart, Star, Gem, Cake, Building2 } from "lucide-react";

type ClientTypeOption = {
  value: "WEDDING" | "SANGJIT" | "LAMARAN" | "ULANG_TAHUN" | "KANTOR";
  label: string;
  description: string;
  icon: React.ReactNode;
  subTypes?: { value: string; label: string; description: string }[];
};

const CLIENT_TYPE_OPTIONS: ClientTypeOption[] = [
  {
    value: "WEDDING",
    label: "Pernikahan",
    description: "Akad Nikah atau Pemberkatan + Resepsi",
    icon: <Heart size={22} />,
    subTypes: [
      { value: "AKAD", label: "Akad Nikah", description: "Untuk pasangan muslim" },
      { value: "PEMBERKATAN", label: "Pemberkatan Perkawinan", description: "Untuk pasangan non-muslim" },
    ],
  },
  {
    value: "SANGJIT",
    label: "Sangjit",
    description: "Upacara seserahan adat Tionghoa",
    icon: <Gem size={22} />,
  },
  {
    value: "LAMARAN",
    label: "Lamaran",
    description: "Acara lamaran / pertunangan",
    icon: <Star size={22} />,
  },
  {
    value: "ULANG_TAHUN",
    label: "Ulang Tahun",
    description: "Celebrasi ulang tahun & syukuran",
    icon: <Cake size={22} />,
  },
  {
    value: "KANTOR",
    label: "Kantor",
    description: "Acara perusahaan & corporate event",
    icon: <Building2 size={22} />,
  },
];

export default function NewClientPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<
    "WEDDING" | "SANGJIT" | "LAMARAN" | "ULANG_TAHUN" | "KANTOR" | null
  >(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateClientInput>({
    resolver: zodResolver(createClientSchema) as any,
    defaultValues: { status: "ACTIVE", clientType: "WEDDING" },
  });

  function handleTypeSelect(
    type: "WEDDING" | "SANGJIT" | "LAMARAN" | "ULANG_TAHUN" | "KANTOR"
  ) {
    setSelectedType(type);
    setValue("clientType", type);
  }

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const name = e.target.value;
    setValue("name", name);
    setValue("slug", slugify(name));
  }

  async function onSubmit(data: CreateClientInput) {
    if (!selectedType) {
      setError("Pilih jenis acara terlebih dahulu");
      return;
    }
    setLoading(true);
    setError("");

    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const json = await res.json();

    if (!res.ok) {
      setError(json.error || "Terjadi kesalahan");
      setLoading(false);
      return;
    }

    router.push(`/admin/clients/${json.id}`);
  }

  const slug = watch("slug");

  const selectedOption = CLIENT_TYPE_OPTIONS.find((o) => o.value === selectedType);

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/clients" className="text-stone-400 hover:text-stone-600">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl font-bold text-stone-800">Buat Client Baru</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {/* Step 1: Choose event category */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <h2 className="font-semibold text-stone-800 mb-1">Jenis Acara</h2>
          <p className="text-xs text-stone-400 mb-4">Pilih kategori undangan yang akan dibuat</p>

          <div className="grid grid-cols-1 gap-3">
            {CLIENT_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleTypeSelect(opt.value)}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                  selectedType === opt.value
                    ? "border-stone-800 bg-stone-50"
                    : "border-stone-200 hover:border-stone-300"
                }`}
              >
                <div className={`p-2.5 rounded-xl shrink-0 ${
                  selectedType === opt.value ? "bg-blue-600 text-white" : "bg-stone-100 text-stone-500"
                }`}>
                  {opt.icon}
                </div>
                <div>
                  <p className="font-medium text-stone-800 text-sm">{opt.label}</p>
                  <p className="text-xs text-stone-500 mt-0.5">{opt.description}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Wedding sub-type info */}
          {selectedType === "WEDDING" && selectedOption?.subTypes && (
            <div className="mt-4 bg-stone-50 rounded-xl p-4">
              <p className="text-xs font-medium text-stone-600 mb-2">
                Tersedia jenis acara:
              </p>
              <div className="space-y-1.5">
                {selectedOption.subTypes.map((sub) => (
                  <div key={sub.value} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-400 shrink-0" />
                    <span className="text-xs text-stone-600">
                      <span className="font-medium">{sub.label}</span> — {sub.description}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-stone-400 mt-2">
                Bisa ditambahkan di menu Detail Acara setelah client dibuat.
              </p>
            </div>
          )}
        </div>

        {/* Step 2: Client details */}
        {selectedType && (
          <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-5">
            <h2 className="font-semibold text-stone-800">Detail Client</h2>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Nama Client
              </label>
              <input
                {...register("name")}
                onChange={handleNameChange}
                placeholder={
                  selectedType === "WEDDING"
                    ? "Contoh: Jordy & Rea Wedding"
                    : selectedType === "SANGJIT"
                    ? "Contoh: Sangjit Jordy & Rea"
                    : selectedType === "ULANG_TAHUN"
                    ? "Contoh: Ulang Tahun ke-70 Mama"
                    : selectedType === "KANTOR"
                    ? "Contoh: Gathering PT Exetech Indonesia"
                    : "Contoh: Lamaran Jordy & Rea"
                }
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Slug URL
              </label>
              <p className="text-xs text-stone-400 mb-2">
                Dipakai sebagai alamat undangan: nama pasangan/acara di depan domain utama
              </p>
              <input
                {...register("slug")}
                placeholder="jordy-rea"
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              {slug && (
                <p className="text-stone-400 text-xs mt-1">
                  Undangan: https://{slug}.digital-invitation.my.id
                </p>
              )}
              {errors.slug && (
                <p className="text-red-500 text-xs mt-1">{errors.slug.message}</p>
              )}
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <p className="text-xs text-green-700">
                Client langsung <span className="font-semibold">AKTIF</span> &amp; publik setelah dibuat
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? "Menyimpan..." : "Buat Client"}
              </button>
              <Link
                href="/admin/clients"
                className="border border-stone-300 text-stone-600 px-5 py-2 rounded-lg text-sm hover:bg-stone-50 transition-colors"
              >
                Batal
              </Link>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

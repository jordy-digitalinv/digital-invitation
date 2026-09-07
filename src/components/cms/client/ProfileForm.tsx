"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { RichTextEditor } from "./RichTextEditor";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import {
  weddingProfileSchema,
  type WeddingProfileInput,
} from "@/modules/wedding/wedding.schema";
import type { WeddingProfile } from "@/types/prisma.types";

interface Props {
  clientId: string;
  initialData: WeddingProfile | null;
}

export function ProfileForm({ clientId, initialData }: Props) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [attentionLang, setAttentionLang] = useState<"id" | "en">("id");
  const [contentLang, setContentLang] = useState<"id" | "en">("id");

  const { register, handleSubmit, setValue, watch, formState: { errors } } =
    useForm<WeddingProfileInput>({
      resolver: zodResolver(weddingProfileSchema) as any,
      defaultValues: {
        groomName: initialData?.groomName ?? "",
        brideName: initialData?.brideName ?? "",
        groomNickname: initialData?.groomNickname ?? "",
        brideNickname: initialData?.brideNickname ?? "",
        groomParents: initialData?.groomParents ?? "",
        brideParents: initialData?.brideParents ?? "",
        groomParentsEn: (initialData as any)?.groomParentsEn ?? "",
        brideParentsEn: (initialData as any)?.brideParentsEn ?? "",
        groomPhoto: initialData?.groomPhoto ?? "",
        bridePhoto: initialData?.bridePhoto ?? "",
        showGroomPhoto: (initialData as any)?.showGroomPhoto ?? true,
        showBridePhoto: (initialData as any)?.showBridePhoto ?? true,
        heroImage: initialData?.heroImage ?? "",
        story: initialData?.story ?? "",
        storyEn: (initialData as any)?.storyEn ?? "",
        storyTitle: (initialData as any)?.storyTitle ?? "",
        storyTitleEn: (initialData as any)?.storyTitleEn ?? "",
        showStoryTitle: (initialData as any)?.showStoryTitle ?? true,
        openingQuote: initialData?.openingQuote ?? "",
        openingQuoteEn: (initialData as any)?.openingQuoteEn ?? "",
        openingQuoteBy: initialData?.openingQuoteBy ?? "",
        openingQuoteByEn: (initialData as any)?.openingQuoteByEn ?? "",
        attentionTitle: (initialData as any)?.attentionTitle ?? "",
        attentionContent: (initialData as any)?.attentionContent ?? "",
        attentionTitleEn: (initialData as any)?.attentionTitleEn ?? "",
        attentionContentEn: (initialData as any)?.attentionContentEn ?? "",
      },
    });

  async function saveData(data: WeddingProfileInput) {
    const res = await fetch(`/api/clients/${clientId}/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const json = await res.json();
      setError(json.error || "Gagal menyimpan");
      return false;
    }
    return true;
  }

  async function onSubmit(data: WeddingProfileInput) {
    setSaving(true);
    setError("");
    setSaved(false);
    const ok = await saveData(data);
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  }

  async function autoSaveToggle(field: string, value: boolean) {
    setValue(field as any, value, { shouldDirty: true });
    const current = watch();
    await saveData({ ...current, [field]: value } as WeddingProfileInput);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}
      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">
          Profil berhasil disimpan.
        </div>
      )}

      <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
        <h3 className="font-medium text-stone-700 text-sm">Mempelai Pria</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nama Lengkap" error={errors.groomName?.message}>
            <input {...register("groomName")} placeholder="Dieudonne Jordy" className={inputClass} />
          </Field>
          <Field label="Nama Panggilan" error={errors.groomNickname?.message}>
            <input {...register("groomNickname")} placeholder="Jordy" className={inputClass} />
          </Field>
        </div>
        <Field label="Nama Orang Tua (ID)" error={errors.groomParents?.message}>
          <input
            {...register("groomParents")}
            placeholder="Putra dari Bpk. ... & Ibu ..."
            className={inputClass}
          />
        </Field>
        <Field label="Nama Orang Tua (EN)" error={undefined}>
          <input
            {...register("groomParentsEn")}
            placeholder="Son of Mr. ... & Mrs. ..."
            className={inputClass}
          />
          <p className="text-xs text-stone-400 mt-1">Kosongkan untuk memakai versi Indonesia</p>
        </Field>
        <PhotoField
          label="Foto Mempelai Pria"
          value={watch("groomPhoto") ?? ""}
          onChange={(v) => setValue("groomPhoto", v, { shouldDirty: true })}
        />
        <Toggle
          label="Tampilkan foto mempelai pria di undangan"
          value={watch("showGroomPhoto") ?? true}
          onChange={(v) => autoSaveToggle("showGroomPhoto", v)}
        />
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
        <h3 className="font-medium text-stone-700 text-sm">Mempelai Wanita</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nama Lengkap" error={errors.brideName?.message}>
            <input {...register("brideName")} placeholder="Rea Yulistria" className={inputClass} />
          </Field>
          <Field label="Nama Panggilan" error={errors.brideNickname?.message}>
            <input {...register("brideNickname")} placeholder="Rea" className={inputClass} />
          </Field>
        </div>
        <Field label="Nama Orang Tua (ID)" error={errors.brideParents?.message}>
          <input
            {...register("brideParents")}
            placeholder="Putri dari Bpk. ... & Ibu ..."
            className={inputClass}
          />
        </Field>
        <Field label="Nama Orang Tua (EN)" error={undefined}>
          <input
            {...register("brideParentsEn")}
            placeholder="Daughter of Mr. ... & Mrs. ..."
            className={inputClass}
          />
          <p className="text-xs text-stone-400 mt-1">Kosongkan untuk memakai versi Indonesia</p>
        </Field>
        <PhotoField
          label="Foto Mempelai Wanita"
          value={watch("bridePhoto") ?? ""}
          onChange={(v) => setValue("bridePhoto", v, { shouldDirty: true })}
        />
        <Toggle
          label="Tampilkan foto mempelai wanita di undangan"
          value={watch("showBridePhoto") ?? true}
          onChange={(v) => autoSaveToggle("showBridePhoto", v)}
        />
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
        <h3 className="font-medium text-stone-700 text-sm">Konten Undangan</h3>
        <div className="flex gap-1 bg-stone-100 rounded-lg p-1 w-fit">
          <button
            type="button"
            onClick={() => setContentLang("id")}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${contentLang === "id" ? "bg-white text-stone-800 shadow-sm font-medium" : "text-stone-500 hover:text-stone-700"}`}
          >
            Bahasa Indonesia
          </button>
          <button
            type="button"
            onClick={() => setContentLang("en")}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${contentLang === "en" ? "bg-white text-stone-800 shadow-sm font-medium" : "text-stone-500 hover:text-stone-700"}`}
          >
            English
          </button>
        </div>
        {contentLang === "id" ? (
          <>
            <Field label="Kata Pembuka / Quote (ID)" error={errors.openingQuote?.message}>
              <textarea
                {...register("openingQuote")}
                rows={3}
                placeholder="Dan di antara tanda-tanda kekuasaan-Nya..."
                className={inputClass}
              />
            </Field>
            <Field label="Sumber Quote (ID)" error={errors.openingQuoteBy?.message}>
              <input
                {...register("openingQuoteBy")}
                placeholder="Contoh: QS. Ar-Rum: 21 · 1 Korintus 13:4 · Bhagavad Gita · Dhammapada"
                className={inputClass}
              />
            </Field>
            <Field label="Isi Cerita / Pesan (ID)" error={errors.story?.message}>
              <RichTextEditor
                value={watch("story") ?? ""}
                onChange={(html) => setValue("story" as any, html, { shouldDirty: true })}
                placeholder="Kisah pertemuan kami dimulai dari..."
                rows={5}
              />
              <p className="text-xs text-stone-400 mt-1">Gunakan toolbar untuk teks tebal, miring, atau daftar poin.</p>
            </Field>
            {(watch("showStoryTitle") ?? true) && (
              <Field label="Judul bagian cerita (ID)" error={undefined}>
                <input
                  {...register("storyTitle")}
                  placeholder="Cerita Singkat Pasangan"
                  className={inputClass}
                />
                <p className="text-xs text-stone-400 mt-1">Kosongkan untuk menggunakan judul default</p>
              </Field>
            )}
          </>
        ) : (
          <>
            <Field label="Kata Pembuka / Quote (EN)" error={undefined}>
              <textarea
                {...register("openingQuoteEn")}
                rows={3}
                placeholder="And among His signs..."
                className={inputClass}
              />
              <p className="text-xs text-stone-400 mt-1">Leave blank to fall back to Indonesian version.</p>
            </Field>
            <Field label="Quote Source (EN)" error={undefined}>
              <input
                {...register("openingQuoteByEn")}
                placeholder="e.g. QS. Ar-Rum: 21 · 1 Corinthians 13:4"
                className={inputClass}
              />
            </Field>
            <Field label="Story / Message (EN)" error={undefined}>
              <RichTextEditor
                value={watch("storyEn") ?? ""}
                onChange={(html) => setValue("storyEn" as any, html, { shouldDirty: true })}
                placeholder="Our story began when..."
                rows={5}
              />
              <p className="text-xs text-stone-400 mt-1">Leave blank to fall back to Indonesian version.</p>
            </Field>
            {(watch("showStoryTitle") ?? true) && (
              <Field label="Story Section Title (EN)" error={undefined}>
                <input
                  {...register("storyTitleEn")}
                  placeholder="Our Story"
                  className={inputClass}
                />
                <p className="text-xs text-stone-400 mt-1">Leave blank to use default title</p>
              </Field>
            )}
          </>
        )}
        <div className="pt-1">
          <Toggle
            label="Tampilkan judul di atas cerita"
            value={watch("showStoryTitle") ?? true}
            onChange={(v) => autoSaveToggle("showStoryTitle", v)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
        <div>
          <h3 className="font-medium text-stone-700 text-sm">Rules / Perhatian</h3>
          <p className="text-xs text-stone-400 mt-0.5">Tampil sebagai section &ldquo;ATTENTION&rdquo; di undangan. Kosongkan jika tidak ingin ditampilkan.</p>
        </div>
        <div className="flex gap-1 bg-stone-100 rounded-lg p-1 w-fit">
          <button
            type="button"
            onClick={() => setAttentionLang("id")}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${attentionLang === "id" ? "bg-white text-stone-800 shadow-sm font-medium" : "text-stone-500 hover:text-stone-700"}`}
          >
            Bahasa Indonesia
          </button>
          <button
            type="button"
            onClick={() => setAttentionLang("en")}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${attentionLang === "en" ? "bg-white text-stone-800 shadow-sm font-medium" : "text-stone-500 hover:text-stone-700"}`}
          >
            English
          </button>
        </div>
        {attentionLang === "id" ? (
          <>
            <Field label="Judul Section (ID)" error={undefined}>
              <input
                {...register("attentionTitle")}
                placeholder="ATTENTION"
                className={inputClass}
              />
              <p className="text-xs text-stone-400 mt-1">Kosongkan untuk menggunakan judul default &ldquo;Attention&rdquo;</p>
            </Field>
            <Field label="Isi Rules / Perhatian (ID)" error={undefined}>
              <RichTextEditor
                value={watch("attentionContent") ?? ""}
                onChange={(html) => setValue("attentionContent" as any, html, { shouldDirty: true })}
                placeholder="✦ Dress Code: Batik Attire&#10;✦ Adults Only (No Children, Please)"
                rows={5}
              />
              <p className="text-xs text-stone-400 mt-1">Gunakan toolbar Bold untuk menebalkan teks penting.</p>
            </Field>
          </>
        ) : (
          <>
            <Field label="Section Title (EN)" error={undefined}>
              <input
                {...register("attentionTitleEn")}
                placeholder="ATTENTION"
                className={inputClass}
              />
              <p className="text-xs text-stone-400 mt-1">Leave blank to use default &ldquo;Attention&rdquo;</p>
            </Field>
            <Field label="Rules / Attention Content (EN)" error={undefined}>
              <RichTextEditor
                value={watch("attentionContentEn") ?? ""}
                onChange={(html) => setValue("attentionContentEn" as any, html, { shouldDirty: true })}
                placeholder="✦ Dress Code: Batik Attire&#10;✦ Adults Only (No Children, Please)"
                rows={5}
              />
              <p className="text-xs text-stone-400 mt-1">Use Bold toolbar to emphasize important text. Leave blank to fall back to Indonesian version.</p>
            </Field>
          </>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Menyimpan..." : "Simpan Profil"}
        </button>
      </div>
    </form>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <div className="relative shrink-0">
        <input
          type="checkbox"
          className="sr-only"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div
          className="w-9 h-5 rounded-full transition-colors"
          style={{ backgroundColor: value ? "#292524" : "#d6d3d1" }}
        />
        <div
          className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
          style={{ transform: value ? "translateX(16px)" : "translateX(0)" }}
        />
      </div>
      <span className="text-sm text-stone-700">{label}</span>
    </label>
  );
}

function PhotoField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const displayUrl = value || "";

  return (
    <div>
      <label className="block text-sm font-medium text-stone-700 mb-2">{label}</label>
      <div className="flex gap-2">
        <input
          type="url"
          value={displayUrl}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://... (bukan link Google Drive)"
          className={inputClass + " flex-1"}
        />
        {displayUrl && (
          <button
            type="button"
            onClick={() => onChange("")}
            title="Hapus foto"
            className="shrink-0 p-2 text-stone-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>
      <p className="text-xs text-stone-400 mt-1">
        Link Google Drive belum bisa dipakai. Upload dulu fotonya ke{" "}
        <a href="https://postimages.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-stone-600">postimages.org</a>
        {" "}atau{" "}
        <a href="https://imgbb.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-stone-600">imgbb.com</a>
        {" "}(gratis, tanpa akun), lalu tempel link fotonya di sini.
      </p>
      {displayUrl && (
        <div className="mt-2 w-24 h-24 rounded-lg overflow-hidden border border-stone-200 bg-stone-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={displayUrl} alt="" className="w-full h-full object-cover" />
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-stone-700 mb-1">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

const inputClass =
  "w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400";

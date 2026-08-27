"use client";

import { useState } from "react";

const CLIENT_TYPE_OPTIONS = [
  { value: "WEDDING",     label: "Pernikahan",  cls: "bg-rose-50 text-rose-700" },
  { value: "SANGJIT",     label: "Sangjit",     cls: "bg-purple-50 text-purple-700" },
  { value: "LAMARAN",     label: "Lamaran",     cls: "bg-blue-50 text-blue-700" },
  { value: "ULANG_TAHUN", label: "Ulang Tahun", cls: "bg-amber-50 text-amber-700" },
  { value: "KANTOR",      label: "Kantor",      cls: "bg-teal-50 text-teal-700" },
];

interface Props {
  clientId: string;
  initialType: string;
}

export function ClientTypeSelect({ clientId, initialType }: Props) {
  const [type, setType] = useState(initialType);
  const [saving, setSaving] = useState(false);

  const current = CLIENT_TYPE_OPTIONS.find((o) => o.value === type)
    ?? { value: type, label: type, cls: "bg-stone-100 text-stone-600" };

  async function handleChange(newType: string) {
    setSaving(true);
    const res = await fetch(`/api/clients/${clientId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientType: newType }),
    });
    if (res.ok) setType(newType);
    setSaving(false);
  }

  return (
    <div className="relative inline-block">
      <select
        value={type}
        onChange={(e) => handleChange(e.target.value)}
        disabled={saving}
        className={`appearance-none pl-2 pr-6 py-0.5 rounded-full text-xs font-medium border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-stone-300 disabled:opacity-60 ${current.cls}`}
      >
        {CLIENT_TYPE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-current opacity-50 text-[10px]">▾</span>
    </div>
  );
}

export const EVENT_TYPE_LABELS: Record<string, string> = {
  AKAD: "Akad",
  PEMBERKATAN: "Pemberkatan",
  RESEPSI: "Resepsi",
  AFTER_PARTY: "After Party",
  SANGJIT: "Sangjit",
  LAMARAN: "Lamaran",
  ULANG_TAHUN: "Ulang Tahun",
  KANTOR: "Kantor",
};

const LEGACY_CATEGORY_LABELS: Record<string, string> = {
  GEREJA_SAJA: "Gereja Saja",
  GEREJA_RESEPSI: "Gereja + Resepsi",
  AKAD_RESEPSI: "Akad & Resepsi",
  PEMBERKATAN_RESEPSI: "Pemberkatan & Resepsi",
  PEMBERKATAN_NASI_BOX: "Pemberkatan & Nasi Box",
};

export interface InvitationCategoryOption {
  value: string;
  label: string;
}

/**
 * Kategori tamu diturunkan dari daftar event client:
 * tiap event jadi 1 opsi tunggal, lalu tiap pasangan event jadi opsi gabungan
 * dengan pemisah "+". Contoh events [PEMBERKATAN, RESEPSI] ->
 * PEMBERKATAN, RESEPSI, PEMBERKATAN+RESEPSI.
 */
export function getInvitationCategories(
  events: { type: string }[]
): InvitationCategoryOption[] {
  const types = [...new Set(events.map((e) => e.type))];

  const singles: InvitationCategoryOption[] = types.map((type) => ({
    value: type,
    label: EVENT_TYPE_LABELS[type] ?? type,
  }));

  const combos: InvitationCategoryOption[] = [];
  for (let i = 0; i < types.length; i++) {
    for (let j = i + 1; j < types.length; j++) {
      const [a, b] = [types[i], types[j]].sort();
      combos.push({
        value: `${a}+${b}`,
        label: `${EVENT_TYPE_LABELS[a] ?? a} & ${EVENT_TYPE_LABELS[b] ?? b}`,
      });
    }
  }

  return [...singles, ...combos];
}

export function invitationCategoryLabel(value: string): string {
  if (!value) return "-";
  if (LEGACY_CATEGORY_LABELS[value]) return LEGACY_CATEGORY_LABELS[value];
  return value
    .split("+")
    .map((part) => EVENT_TYPE_LABELS[part] ?? part)
    .join(" & ");
}

const CATEGORY_COLORS = [
  "bg-blue-50 text-blue-700",
  "bg-purple-50 text-purple-700",
  "bg-orange-50 text-orange-700",
  "bg-pink-50 text-pink-700",
  "bg-teal-50 text-teal-700",
];

export function invitationCategoryColor(value: string): string {
  const legacy: Record<string, string> = {
    PEMBERKATAN_NASI_BOX: "bg-amber-50 text-amber-700",
    SANGJIT: "bg-orange-50 text-orange-700",
    LAMARAN: "bg-pink-50 text-pink-700",
  };
  if (legacy[value]) return legacy[value];
  let hash = 0;
  for (let i = 0; i < value.length; i++) hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  return CATEGORY_COLORS[hash % CATEGORY_COLORS.length];
}

interface EventLike {
  type: string;
}

export const RECEPTION_EVENT_TYPES = new Set(["RESEPSI", "AFTER_PARTY"]);

/** Does this guest's category string reference any reception-equivalent event (Resepsi or After Party)? */
export function categoryIncludesReception(invitationCategory: string): boolean {
  return [...RECEPTION_EVENT_TYPES].some((type) => invitationCategory.includes(type));
}

/**
 * Hanya tampilkan event yang relevan untuk kategori tamu —
 * tamu "PEMBERKATAN" saja tidak melihat lokasi Resepsi.
 * Kategori tidak dikenal (mis. ULANG_TAHUN) menampilkan semua event.
 */
export function getEventsForGuestCategory<T extends EventLike>(
  events: T[],
  invitationCategory?: string
): T[] {
  if (!invitationCategory) return events;

  const includesReception = categoryIncludesReception(invitationCategory);
  const ceremonyType = invitationCategory.startsWith("AKAD")
    ? "AKAD"
    : invitationCategory.startsWith("PEMBERKATAN")
    ? "PEMBERKATAN"
    : invitationCategory.startsWith("SANGJIT")
    ? "SANGJIT"
    : invitationCategory.startsWith("LAMARAN")
    ? "LAMARAN"
    : null;

  return events.filter((ev) => {
    if (RECEPTION_EVENT_TYPES.has(ev.type)) return includesReception;
    if (ceremonyType) return ev.type === ceremonyType;
    return true;
  });
}

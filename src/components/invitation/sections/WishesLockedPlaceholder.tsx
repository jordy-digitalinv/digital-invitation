import { LockKeyhole } from "lucide-react";

interface Props {
  primaryColor?: string;
  text?: string;
  fontHeading?: string;
  lang?: "id" | "en";
}

const TR = {
  id: {
    title: "Ucapan Terkunci",
    body: "Konfirmasi kehadiran (RSVP) dulu di atas ya, baru bisa kirim ucapan & doa.",
  },
  en: {
    title: "Wishes Locked",
    body: "Please confirm your attendance (RSVP) above first before sending a wish.",
  },
};

export function WishesLockedPlaceholder({
  primaryColor = "#b8860b",
  text = "#3d3d3d",
  fontHeading = "Playfair Display",
  lang = "id",
}: Props) {
  const t = TR[lang] ?? TR.id;

  return (
    <div
      className="max-w-md mx-auto text-center bg-white rounded-2xl px-6 py-10 shadow-sm border"
      style={{ borderColor: `${primaryColor}30` }}
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
        style={{ background: `${primaryColor}14` }}
      >
        <LockKeyhole size={20} style={{ color: primaryColor }} />
      </div>
      <p className="text-base font-medium mb-1" style={{ color: text, fontFamily: `'${fontHeading}', serif` }}>
        {t.title}
      </p>
      <p className="text-sm opacity-60" style={{ color: text }}>
        {t.body}
      </p>
    </div>
  );
}

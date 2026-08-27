"use client";

import { useState } from "react";
import { Copy, Check, Gift as GiftIcon, MapPin, Phone } from "lucide-react";

interface Props {
  receiverName?: string | null;
  receiverPhone?: string | null;
  address?: string | null;
  accent: string;
}

/** Kartu "Kirim Kado" — alamat pengiriman hadiah fisik dengan tombol salin. */
export function GiftAddressCard({ receiverName, receiverPhone, address, accent }: Props) {
  const [copied, setCopied] = useState(false);

  function copyAddress() {
    const lines = [
      receiverName ? `a.n. ${receiverName}` : "",
      receiverPhone ? `Telp: ${receiverPhone}` : "",
      address ?? "",
    ].filter(Boolean);
    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div
      style={{
        borderRadius: "1rem",
        border: `1.5px dashed ${accent}77`,
        background: "rgba(255,255,255,.55)",
        backdropFilter: "blur(4px)",
        padding: "1.1rem 1.25rem",
        textAlign: "left",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: ".5rem", marginBottom: ".55rem" }}>
        <GiftIcon size={15} style={{ color: accent }} />
        <p style={{ fontSize: ".68rem", letterSpacing: ".22em", textTransform: "uppercase", color: accent, fontWeight: 700 }}>
          Kirim Kado
        </p>
      </div>

      {receiverName && (
        <p style={{ fontSize: ".95rem", fontWeight: 600, marginTop: ".2rem" }}>{receiverName}</p>
      )}
      {receiverPhone && (
        <p style={{ fontSize: ".8rem", opacity: .75, display: "flex", alignItems: "center", gap: ".35rem", marginTop: ".15rem" }}>
          <Phone size={11} /> {receiverPhone}
        </p>
      )}
      {address && (
        <p style={{ fontSize: ".85rem", lineHeight: 1.65, marginTop: ".45rem", display: "flex", gap: ".4rem" }}>
          <MapPin size={13} style={{ color: accent, flexShrink: 0, marginTop: 2 }} />
          <span>{address}</span>
        </p>
      )}

      {address && (
        <button
          onClick={copyAddress}
          style={{
            marginTop: ".8rem",
            display: "inline-flex",
            alignItems: "center",
            gap: ".4rem",
            fontSize: ".72rem",
            padding: ".45rem 1rem",
            borderRadius: 999,
            border: `1px solid ${accent}`,
            color: accent,
            background: "transparent",
            cursor: "pointer",
          }}
        >
          {copied ? <><Check size={12} /> Tersalin</> : <><Copy size={12} /> Salin Alamat</>}
        </button>
      )}
    </div>
  );
}

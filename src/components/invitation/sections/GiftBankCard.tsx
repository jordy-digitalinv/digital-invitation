"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface Props {
  kind: string;
  bankName?: string | null;
  accountNumber?: string | null;
  accountName?: string | null;
  ewalletType?: string | null;
  ewalletNumber?: string | null;
  qrisImage?: string | null;
  accent: string;
}

/** Kartu rekening bergaya kartu debit (BANK & EWALLET) + kartu QRIS. */
export function GiftBankCard({
  kind, bankName, accountNumber, accountName, ewalletType, ewalletNumber, qrisImage, accent,
}: Props) {
  const [copied, setCopied] = useState(false);

  const isQris = kind === "QRIS";
  const label = kind === "BANK" ? bankName : ewalletType || "E-Wallet";
  const number = kind === "BANK" ? accountNumber : ewalletNumber;

  function copy() {
    navigator.clipboard.writeText(number ?? "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (isQris) {
    return (
      <div style={{ borderRadius: 18, border: `1px solid ${accent}44`, background: "#fff", padding: "1.1rem", textAlign: "center" }}>
        <p style={{ fontSize: ".7rem", letterSpacing: ".25em", textTransform: "uppercase", color: accent, fontWeight: 700, marginBottom: ".7rem" }}>
          {label}
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrisImage ?? ""} alt="QRIS" style={{ width: "11rem", margin: "0 auto", borderRadius: 12 }} />
      </div>
    );
  }

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 18,
        padding: "1.15rem 1.25rem",
        color: "#fff",
        background: `linear-gradient(135deg, ${accent} 0%, #23232b 140%)`,
        boxShadow: "0 12px 26px rgba(0,0,0,.22)",
      }}
    >
      <div style={{ position: "absolute", right: -34, top: -34, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,.13)" }} />
      <div style={{ position: "absolute", right: -14, bottom: -46, width: 96, height: 96, borderRadius: "50%", background: "rgba(255,255,255,.08)" }} />

      <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center", gap: ".5rem" }}>
        <p style={{ fontSize: ".72rem", letterSpacing: ".28em", textTransform: "uppercase", opacity: .95, fontWeight: 600 }}>
          {label}
        </p>
        <button
          onClick={copy}
          style={{
            display: "inline-flex", alignItems: "center", gap: ".35rem",
            fontSize: ".68rem", padding: ".4rem .85rem", borderRadius: 999,
            border: "1px solid rgba(255,255,255,.7)", color: "#fff",
            background: "rgba(255,255,255,.14)", cursor: "pointer",
          }}
        >
          {copied ? <><Check size={11} /> Tersalin</> : <><Copy size={11} /> Salin</>}
        </button>
      </div>

      <div style={{ position: "relative", margin: ".95rem 0 .55rem", width: 40, height: 29, borderRadius: 6, background: "linear-gradient(135deg, #f3d47a, #c9992e)", boxShadow: "inset 0 0 0 1px rgba(0,0,0,.15)" }}>
        <div style={{ position: "absolute", top: 8, left: 0, right: 0, height: 1.5, background: "rgba(0,0,0,.25)" }} />
        <div style={{ position: "absolute", top: 14, left: 0, right: 0, height: 1.5, background: "rgba(0,0,0,.25)" }} />
        <div style={{ position: "absolute", top: 20, left: 0, right: 0, height: 1.5, background: "rgba(0,0,0,.25)" }} />
        <div style={{ position: "absolute", top: 0, bottom: 0, left: 13, width: 1.5, background: "rgba(0,0,0,.25)" }} />
        <div style={{ position: "absolute", top: 0, bottom: 0, left: 26, width: 1.5, background: "rgba(0,0,0,.25)" }} />
      </div>

      <p style={{ position: "relative", fontFamily: "'Courier New', monospace", fontSize: "1.18rem", letterSpacing: ".16em", fontWeight: 700 }}>
        {number}
      </p>

      {accountName && (
        <p style={{ position: "relative", fontSize: ".74rem", opacity: .88, marginTop: ".5rem", textTransform: "uppercase", letterSpacing: ".1em" }}>
          a.n. {accountName}
        </p>
      )}
    </div>
  );
}

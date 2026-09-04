import { notFound } from "next/navigation";
import { canAccessClient } from "@/lib/auth/permissions";
import { prisma } from "@/lib/database/prisma";
import { getSeatingExport } from "@/modules/tables/tables.service";
import { formatDate } from "@/lib/utils";
import { PrintButton } from "./PrintButton";

interface Props {
  params: Promise<{ clientId: string }>;
}

export default async function SeatingPrintPage({ params }: Props) {
  const { clientId } = await params;

  const hasAccess = await canAccessClient(clientId);
  if (!hasAccess) notFound();

  const [client, exportData] = await Promise.all([
    prisma.client.findUnique({
      where: { id: clientId },
      include: {
        weddingProfile: true,
        events: { where: { type: { in: ["RESEPSI", "AFTER_PARTY"] } }, orderBy: { sortOrder: "asc" } },
      },
    }),
    getSeatingExport(clientId),
  ]);

  if (!client) notFound();

  const receptionEvent = client.events[0];
  const coupleName = client.weddingProfile
    ? `${client.weddingProfile.groomNickname || client.weddingProfile.groomName} & ${client.weddingProfile.brideNickname || client.weddingProfile.brideName}`
    : client.name;

  const sections = [...new Set(exportData.tables.map((t) => t.sectionLabel))];
  const totalPax =
    exportData.tables.reduce((sum, t) => sum + t.guests.reduce((s, g) => s + g.pax, 0), 0) +
    exportData.unassignedGuests.reduce((s, g) => s + g.pax, 0);
  const menuTotal = Object.values(exportData.menuTotals).reduce((s, n) => s + n, 0);

  return (
    <div style={{ width: "100%", padding: "4mm 6mm", color: "#1c1917" }}>
      <style>{`
        @page { size: A4 landscape; margin: 8mm; }
        .table-grid {
          display: grid;
          gap: 8px;
        }
        .table-box {
          break-inside: avoid;
          border: 1.5px solid #57534e;
          border-radius: 6px;
          padding: 6px 8px;
          background: #f7f6f3;
        }
        .table-box.vip {
          border-color: #b8892a;
          background: #fdf6e8;
        }
      `}</style>

      <PrintButton />

      <div style={{ textAlign: "center", marginBottom: "12px", borderBottom: "2px solid #1c1917", paddingBottom: "8px" }}>
        <h1 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0 }}>Seating &amp; Menu Resepsi</h1>
        <p style={{ fontSize: "0.9rem", margin: "0.2rem 0 0" }}>{coupleName}</p>
        {receptionEvent && (
          <p style={{ fontSize: "0.75rem", color: "#57534e", margin: "0.15rem 0 0" }}>
            {receptionEvent.venueName || receptionEvent.label} · {formatDate(receptionEvent.date)} · Total {totalPax} pax
          </p>
        )}
      </div>

      {sections.map((section) => {
        const sectionTables = exportData.tables.filter((t) => t.sectionLabel === section);
        const sectionPax = sectionTables.reduce((s, t) => s + t.guests.reduce((x, g) => x + g.pax, 0), 0);
        const sectionCapacity = sectionTables.reduce((s, t) => s + t.capacity, 0);
        const isVip = section.toUpperCase().includes("VIP");
        const columns = Math.min(sectionTables.length, 7) || 1;

        return (
          <div key={section} style={{ marginBottom: "14px" }}>
            <h2 style={{ fontSize: "0.95rem", fontWeight: 700, margin: "0 0 6px", color: isVip ? "#b8892a" : "#1c1917" }}>
              {section}{" "}
              <span style={{ fontWeight: 400, color: "#78716c", fontSize: "0.78rem" }}>
                ({sectionPax}/{sectionCapacity} pax)
              </span>
            </h2>
            <div className="table-grid" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {sectionTables.map((t) => {
                const tablePax = t.guests.reduce((s, g) => s + g.pax, 0);
                return (
                  <div key={t.id} className={`table-box${isVip ? " vip" : ""}`}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "3px" }}>
                      <span style={{ fontWeight: 700, fontSize: "0.8rem" }}>{t.code}</span>
                      <span style={{ fontSize: "0.65rem", color: "#78716c" }}>
                        {tablePax}/{t.capacity}
                      </span>
                    </div>
                    {t.guests.length === 0 ? (
                      <p style={{ fontSize: "0.65rem", color: "#a8a29e", fontStyle: "italic", margin: 0 }}>Kosong</p>
                    ) : (
                      t.guests.map((g) => (
                        <div key={g.id} style={{ marginBottom: "3px" }}>
                          <p style={{ fontSize: "0.68rem", fontWeight: 600, margin: "0 0 1px" }}>{g.name}</p>
                          <ul style={{ margin: 0, padding: 0, listStyle: "none", fontSize: "0.62rem", color: "#44403c" }}>
                            {Array.from({ length: g.pax }, (_, i) => (
                              <li key={i}>· {g.menuChoices[i] || "belum pilih"}</li>
                            ))}
                          </ul>
                        </div>
                      ))
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {exportData.unassignedGuests.length > 0 && (
        <div
          style={{
            marginBottom: "14px",
            background: "#fffbeb",
            border: "1px solid #fde68a",
            borderRadius: "8px",
            padding: "8px 10px",
            breakInside: "avoid",
          }}
        >
          <h2 style={{ fontSize: "0.9rem", fontWeight: 700, margin: "0 0 6px", color: "#92400e" }}>
            ⚠️ Belum Ditempatkan ({exportData.unassignedGuests.reduce((s, g) => s + g.pax, 0)} pax)
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {exportData.unassignedGuests.map((g) => (
              <div key={g.id} style={{ fontSize: "0.7rem" }}>
                <strong>{g.name}</strong> ({g.pax} pax) —{" "}
                {Array.from({ length: g.pax }, (_, i) => g.menuChoices[i] || "belum pilih").join(", ")}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ borderTop: "2px solid #1c1917", paddingTop: "8px", breakInside: "avoid" }}>
        <h2 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "4px" }}>Rekap Total Menu</h2>
        <div style={{ display: "flex", gap: "18px", flexWrap: "wrap", fontSize: "0.78rem" }}>
          {Object.entries(exportData.menuTotals).map(([name, total]) => (
            <span key={name}>
              {name}: <strong>{total}</strong>
            </span>
          ))}
          <span>
            Total: <strong>{menuTotal}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}

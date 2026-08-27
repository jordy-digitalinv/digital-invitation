import { getClientById } from "@/modules/clients/clients.service";
import { prisma } from "@/lib/database/prisma";
import { auth } from "@/lib/auth/auth";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { ClientStatusToggle } from "@/components/cms/client/ClientStatusToggle";

function getInvitationUrl(slug: string) {
  const domain =
    process.env.NEXT_PUBLIC_INVITATION_DOMAIN ?? "digital-invitation.my.id";
  return `https://${slug}.${domain}`;
}

interface Props {
  params: Promise<{ clientId: string }>;
}

export default async function ClientOverviewPage({ params }: Props) {
  const { clientId } = await params;
  const session = await auth();
  const role = (session?.user as any)?.role as string | undefined;
  const isStaff = role === "STAFF";

  const client = await getClientById(clientId);
  if (!client) return null;

  const [rsvpHadir, rsvpTidak, wishes] = await Promise.all([
    prisma.rsvp.count({ where: { clientId, status: "HADIR" } }),
    prisma.rsvp.count({ where: { clientId, status: "TIDAK_HADIR" } }),
    prisma.wish.count({ where: { clientId } }),
  ]);

  const stats = [
    { label: "Total Tamu", value: (client as any)._count?.guests ?? 0, href: "guests" },
    { label: "Konfirmasi Hadir", value: rsvpHadir, href: "rsvp" },
    { label: "Tidak Hadir", value: rsvpTidak, href: "rsvp" },
    { label: "Ucapan Masuk", value: wishes, href: "wishes" },
  ];

  const quickLinks = [
    { label: "Edit Profil Mempelai", href: "profile" },
    { label: "Atur Acara", href: "events" },
    { label: "Kelola Tamu", href: "guests" },
    { label: "Atur Tema", href: "theme" },
    { label: "Upload Galeri", href: "gallery" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {stats.map((s) => {
          const card = (
            <div className="bg-white rounded-xl border border-stone-200 p-4 hover:border-stone-300 transition-colors">
              <p className="text-xs text-stone-500 mb-1">{s.label}</p>
              <p className="text-2xl font-bold text-stone-800">{s.value}</p>
            </div>
          );
          return isStaff ? (
            <div key={s.label}>{card}</div>
          ) : (
            <Link key={s.label} href={`/admin/clients/${clientId}/${s.href}`}>
              {card}
            </Link>
          );
        })}
      </div>

      {!isStaff && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <h3 className="font-semibold text-stone-800 mb-3 text-sm">
              Menu Pengaturan
            </h3>
            <div className="space-y-2">
              {quickLinks.map((l) => (
                <Link
                  key={l.href}
                  href={`/admin/clients/${clientId}/${l.href}`}
                  className="block text-sm text-stone-600 hover:text-stone-900 hover:underline"
                >
                  → {l.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <h3 className="font-semibold text-stone-800 mb-3 text-sm">
              Info Client
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-stone-500 text-xs mb-2">Status Undangan</p>
                <ClientStatusToggle
                  clientId={client.id}
                  currentStatus={client.status}
                />
              </div>
              <div className="border-t border-stone-100 pt-3 space-y-2">
                <Row label="Dibuat" value={formatDate(client.createdAt)} />
                <Row label="Diperbarui" value={formatDate(client.updatedAt)} />
                <div className="flex justify-between items-center gap-2">
                  <span className="text-stone-500 shrink-0">Link Undangan</span>
                  <a
                    href={getInvitationUrl(client.slug)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-blue-600 hover:underline truncate"
                  >
                    {client.slug}.{process.env.NEXT_PUBLIC_INVITATION_DOMAIN ?? "digital-invitation.my.id"}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-stone-500">{label}</span>
      <span className={mono ? "font-mono text-xs text-stone-600" : "text-stone-800"}>
        {value}
      </span>
    </div>
  );
}

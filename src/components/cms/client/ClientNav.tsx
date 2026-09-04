"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ClientStatusBadge } from "./ClientStatusBadge";
import type { ClientStatus } from "@/types/prisma.types";
import { ArrowLeft, Camera } from "lucide-react";

interface Client {
  id: string;
  name: string;
  slug: string;
  status: ClientStatus;
  clientType?: string;
}

const BASE_TABS = [
  { label: "Overview", path: "" },
  { label: "Acara", path: "/events" },
  { label: "Menu", path: "/menu" },
  { label: "Profil", path: "/profile" },
  { label: "Tamu", path: "/guests" },
  { label: "RSVP", path: "/rsvp" },
  { label: "Ucapan", path: "/wishes" },
  { label: "Galeri", path: "/gallery" },
  { label: "Musik", path: "/music" },
  { label: "Tema", path: "/theme" },
  { label: "Tampilan", path: "/sections" },
  { label: "Gift", path: "/gifts" },
  { label: "WhatsApp", path: "/whatsapp" },
  { label: "Kehadiran", path: "/attendance" },
  { label: "Seating", path: "/seating" },
  { label: "Foto Tamu", path: "/guest-photos" },
];

const SUPERADMIN_TABS = [
  ...BASE_TABS,
  { label: "Pengguna", path: "/users" },
];

const STAFF_TABS = [
  { label: "Camera", path: "/attendance", icon: Camera },
];

function getTabs(role: string | undefined, seatingAllowed: boolean, guestPhotosAllowed: boolean, menuAllowed: boolean) {
  if (role === "SUPERADMIN") return SUPERADMIN_TABS;
  if (role === "STAFF") return STAFF_TABS;
  return BASE_TABS.filter((tab) => {
    if (tab.path === "/seating") return seatingAllowed;
    if (tab.path === "/guest-photos") return guestPhotosAllowed;
    if (tab.path === "/menu") return menuAllowed;
    return true;
  });
}

export function ClientNav({
  client,
  role,
  seatingAllowed = true,
  guestPhotosAllowed = true,
  menuAllowed = true,
}: {
  client: Client;
  role?: string;
  seatingAllowed?: boolean;
  guestPhotosAllowed?: boolean;
  menuAllowed?: boolean;
}) {
  const tabs = getTabs(role, seatingAllowed, guestPhotosAllowed, menuAllowed);
  const pathname = usePathname();
  const base = `/admin/clients/${client.id}`;
  const isSuperAdmin = role === "SUPERADMIN";

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          {isSuperAdmin && (
            <Link href="/admin/clients" className="text-stone-400 hover:text-stone-600 shrink-0">
              <ArrowLeft size={16} />
            </Link>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base md:text-lg font-bold text-stone-800 truncate">{client.name}</h1>
              <ClientStatusBadge status={client.status} />
            </div>
            <p className="text-stone-400 text-xs font-mono truncate">{client.slug}</p>
          </div>
        </div>

      </div>

      <div className="flex gap-1 overflow-x-auto pb-1 border-b border-stone-200">
        {tabs.map((tab) => {
          const href = `${base}${tab.path}`;
          const active =
            tab.path === ""
              ? pathname === base
              : pathname.startsWith(href);
          const Icon = (tab as any).icon;

          return (
            <Link
              key={tab.path}
              href={href}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-sm rounded-t-lg whitespace-nowrap transition-colors"
              )}
              style={
                active
                  ? { color: "#B8892A", borderBottom: "2px solid #D4A85C", fontWeight: 500, marginBottom: "-1px" }
                  : { color: "#64748b" }
              }
              onMouseEnter={(e) => {
                if (!active) (e.currentTarget as HTMLElement).style.color = "#374151";
              }}
              onMouseLeave={(e) => {
                if (!active) (e.currentTarget as HTMLElement).style.color = "#64748b";
              }}
            >
              {Icon && <Icon size={14} />}
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

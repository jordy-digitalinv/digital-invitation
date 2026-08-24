"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Users, LayoutDashboard, Heart, X } from "lucide-react";
import { cn } from "@/lib/utils";

const ALL_NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true, superAdminOnly: false },
  { href: "/admin/clients", label: "Client", icon: Heart, superAdminOnly: false },
  { href: "/admin/users", label: "Pengguna", icon: Users, superAdminOnly: true },
];

interface Props {
  role?: string;
  onClose?: () => void;
}

export function AdminSidebar({ role, onClose }: Props) {
  const pathname = usePathname();
  const navItems = ALL_NAV.filter((item) => !item.superAdminOnly || role === "SUPERADMIN");

  return (
    <aside
      className="w-64 h-full flex flex-col shrink-0"
      style={{ background: "#0f172a", fontFamily: "'IBM Plex Sans', Arial, sans-serif" }}
    >
      <div className="h-14 flex items-center justify-between px-4" style={{ borderBottom: "1px solid #1e293b" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0">
            <Image src="/logo.png" alt="Logo" width={28} height={28} className="w-full h-full object-cover" />
          </div>
          <span className="font-semibold text-sm" style={{ color: "#e2e8f0" }}>Digital Invitation</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded"
            style={{ color: "#64748b" }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors")}
              style={
                active
                  ? {
                      background: "rgba(212,168,92,0.12)",
                      color: "#D4A85C",
                      borderLeft: "2px solid #D4A85C",
                      paddingLeft: "10px",
                    }
                  : { color: "#94a3b8", borderLeft: "2px solid transparent", paddingLeft: "10px" }
              }
              onMouseEnter={(e) => {
                if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(212,168,92,0.06)";
              }}
              onMouseLeave={(e) => {
                if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3" style={{ borderTop: "1px solid #1e293b" }}>
        <p className="text-xs text-center" style={{ color: "#334155" }}>v1.0.0</p>
      </div>
    </aside>
  );
}

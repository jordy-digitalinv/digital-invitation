"use client";

import { useState } from "react";
import { Trash2, Plus, User, Shield, Search } from "lucide-react";

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  canAccessSeating?: boolean;
  canAccessGuestPhotos?: boolean;
  canAccessMenu?: boolean;
}
interface AllUser { id: string; name: string; email: string; role: string }

interface Props {
  clientId: string;
  initialUsers: UserItem[];
  allUsers: AllUser[];
}

const ROLE_LABELS: Record<string, { label: string; cls: string }> = {
  SUPERADMIN: { label: "Super Admin", cls: "bg-red-50 text-red-700" },
  ADMIN:      { label: "Admin",       cls: "bg-blue-50 text-blue-700" },
  STAFF:      { label: "Staff",       cls: "bg-stone-100 text-stone-600" },
};

export function ClientUsersManager({ clientId, initialUsers, allUsers }: Props) {
  const [users, setUsers] = useState<UserItem[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [newSeating, setNewSeating] = useState(true);
  const [newGuestPhotos, setNewGuestPhotos] = useState(true);
  const [newMenu, setNewMenu] = useState(true);

  const assignedIds = new Set(users.map((u) => u.id));
  const available = allUsers.filter(
    (u) => !assignedIds.has(u.id) &&
    (u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
  );

  async function handleAdd(userId: string) {
    setError("");
    const res = await fetch(`/api/clients/${clientId}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, canAccessSeating: newSeating, canAccessGuestPhotos: newGuestPhotos, canAccessMenu: newMenu }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Gagal menambahkan"); return; }
    setUsers((p) => [...p, data]);
    setSearch("");
  }

  async function handlePermissionChange(userId: string, field: "canAccessSeating" | "canAccessGuestPhotos" | "canAccessMenu", value: boolean) {
    setUsers((p) => p.map((u) => (u.id === userId ? { ...u, [field]: value } : u)));
    await fetch(`/api/clients/${clientId}/users`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, [field]: value }),
    });
  }

  async function handleRemove(userId: string) {
    if (!confirm("Cabut akses pengguna ini dari client?")) return;
    const res = await fetch(`/api/clients/${clientId}/users`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) setUsers((p) => p.filter((u) => u.id !== userId));
  }

  return (
    <div className="space-y-6">
      {/* Current users */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-stone-800">Pengguna yang Punya Akses</h2>
            <p className="text-xs text-stone-400 mt-0.5">{users.length} pengguna bisa mengelola client ini</p>
          </div>
          <button onClick={() => setAdding((v) => !v)}
            className="flex items-center gap-1.5 text-sm border border-stone-200 px-3 py-1.5 rounded-lg text-stone-600 hover:bg-stone-50 transition-colors">
            <Plus size={14} /> Tambah Akses
          </button>
        </div>

        {users.length === 0 ? (
          <div className="p-8 text-center">
            <User size={28} className="text-stone-300 mx-auto mb-2" />
            <p className="text-stone-400 text-sm">Belum ada pengguna yang ditetapkan.</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {users.map((user) => {
              const roleInfo = ROLE_LABELS[user.role] ?? { label: user.role, cls: "bg-stone-100 text-stone-600" };
              return (
                <div key={user.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center shrink-0">
                    {user.role === "SUPERADMIN" ? <Shield size={14} className="text-stone-500" /> : <User size={14} className="text-stone-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-800 truncate">{user.name}</p>
                    <p className="text-xs text-stone-400 truncate">{user.email}</p>
                  </div>
                  {user.role === "ADMIN" && (
                    <div className="flex items-center gap-3 text-xs text-stone-500 shrink-0">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={user.canAccessSeating ?? true}
                          onChange={(e) => handlePermissionChange(user.id, "canAccessSeating", e.target.checked)}
                          className="accent-stone-700"
                        />
                        Seating
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={user.canAccessGuestPhotos ?? true}
                          onChange={(e) => handlePermissionChange(user.id, "canAccessGuestPhotos", e.target.checked)}
                          className="accent-stone-700"
                        />
                        Foto Tamu
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={user.canAccessMenu ?? true}
                          onChange={(e) => handlePermissionChange(user.id, "canAccessMenu", e.target.checked)}
                          className="accent-stone-700"
                        />
                        Menu
                      </label>
                    </div>
                  )}
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleInfo.cls}`}>
                    {roleInfo.label}
                  </span>
                  {user.role !== "SUPERADMIN" && (
                    <button onClick={() => handleRemove(user.id)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add user panel */}
      {adding && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <h3 className="font-semibold text-stone-800 mb-3">Tambah Pengguna</h3>
          <div className="flex items-center gap-4 text-xs text-stone-500 mb-3">
            <span className="text-stone-400">Akses untuk pengguna baru (khusus role Admin):</span>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={newSeating} onChange={(e) => setNewSeating(e.target.checked)} className="accent-stone-700" />
              Seating
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={newGuestPhotos} onChange={(e) => setNewGuestPhotos(e.target.checked)} className="accent-stone-700" />
              Foto Tamu
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={newMenu} onChange={(e) => setNewMenu(e.target.checked)} className="accent-stone-700" />
              Menu
            </label>
          </div>
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau email pengguna..."
              className="w-full border border-stone-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
            />
          </div>
          {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
          {search && available.length === 0 && (
            <p className="text-stone-400 text-sm text-center py-4">Tidak ada pengguna yang cocok atau sudah memiliki akses.</p>
          )}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {(search ? available : allUsers.filter((u) => !assignedIds.has(u.id))).map((user) => {
              const roleInfo = ROLE_LABELS[user.role] ?? { label: user.role, cls: "bg-stone-100 text-stone-600" };
              return (
                <div key={user.id} className="flex items-center gap-3 p-3 rounded-xl border border-stone-100 hover:border-stone-200 hover:bg-stone-50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center shrink-0">
                    <User size={14} className="text-stone-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-800 truncate">{user.name}</p>
                    <p className="text-xs text-stone-400 truncate">{user.email}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${roleInfo.cls}`}>
                    {roleInfo.label}
                  </span>
                  <button onClick={() => handleAdd(user.id)}
                    className="shrink-0 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors">
                    Tambah
                  </button>
                </div>
              );
            })}
          </div>
          <button onClick={() => { setAdding(false); setSearch(""); setError(""); }}
            className="mt-3 text-sm text-stone-400 hover:text-stone-600">
            Tutup
          </button>
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-xs text-amber-700">
          <strong>Catatan:</strong> Super Admin selalu bisa mengakses semua client. Pengguna dengan role Admin/Staff hanya bisa mengakses client yang secara eksplisit ditetapkan di sini.
        </p>
      </div>
    </div>
  );
}

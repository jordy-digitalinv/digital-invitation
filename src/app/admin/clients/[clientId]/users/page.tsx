import { requireSuperAdmin } from "@/lib/auth/permissions";
import { prisma } from "@/lib/database/prisma";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { ClientUsersManager } from "@/components/cms/client/ClientUsersManager";

interface Props { params: Promise<{ clientId: string }> }

export default async function ClientUsersPage({ params }: Props) {
  const session = await auth();
  const user = session!.user as { id: string; role: string };
  if (user.role !== "SUPERADMIN") redirect("/admin/clients");

  const { clientId } = await params;

  const [clientUsers, allUsers] = await Promise.all([
    prisma.clientUser.findMany({
      where: { clientId },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    }),
    prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!clientUsers && !(await prisma.client.findUnique({ where: { id: clientId } }))) notFound();

  const assignedUsers = clientUsers.map((cu) => ({
    ...cu.user,
    canAccessSeating: cu.canAccessSeating,
    canAccessGuestPhotos: cu.canAccessGuestPhotos,
    canAccessMenu: cu.canAccessMenu,
  }));

  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-semibold text-stone-800 mb-4">Pengguna &amp; Akses</h2>
      <ClientUsersManager
        clientId={clientId}
        initialUsers={assignedUsers}
        allUsers={allUsers}
      />
    </div>
  );
}

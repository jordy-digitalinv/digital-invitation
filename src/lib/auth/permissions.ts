import { UserRole } from "@prisma/client";
import { auth } from "./auth";
import { prisma } from "@/lib/database/prisma";

export async function getSession() {
  return await auth();
}

export async function requireAuth() {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function requireSuperAdmin() {
  const session = await requireAuth();
  const user = session.user as { role: string };
  if (user.role !== UserRole.SUPERADMIN) {
    throw new Error("FORBIDDEN");
  }
  return session;
}

export async function canAccessClient(clientId: string): Promise<boolean> {
  const session = await getSession();
  if (!session?.user) return false;

  const user = session.user as { id: string; role: string };

  if (user.role === UserRole.SUPERADMIN) return true;

  const access = await prisma.clientUser.findUnique({
    where: {
      userId_clientId: {
        userId: user.id,
        clientId,
      },
    },
  });

  return !!access;
}

async function getClientUserFlags(clientId: string) {
  const session = await getSession();
  if (!session?.user) return null;

  const user = session.user as { id: string; role: string };
  if (user.role === UserRole.SUPERADMIN) {
    return { canAccessSeating: true, canAccessGuestPhotos: true, canAccessMenu: true };
  }

  return prisma.clientUser.findUnique({
    where: { userId_clientId: { userId: user.id, clientId } },
    select: { canAccessSeating: true, canAccessGuestPhotos: true, canAccessMenu: true },
  });
}

export async function canAccessSeating(clientId: string): Promise<boolean> {
  const flags = await getClientUserFlags(clientId);
  return flags?.canAccessSeating ?? false;
}

export async function canAccessGuestPhotos(clientId: string): Promise<boolean> {
  const flags = await getClientUserFlags(clientId);
  return flags?.canAccessGuestPhotos ?? false;
}

export async function canAccessMenu(clientId: string): Promise<boolean> {
  const flags = await getClientUserFlags(clientId);
  return flags?.canAccessMenu ?? false;
}

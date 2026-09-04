import { requireSuperAdmin } from "@/lib/auth/permissions";
import { prisma } from "@/lib/database/prisma";
import { apiError, apiSuccess } from "@/lib/utils";

interface Params { params: Promise<{ clientId: string }> }

export async function GET(_req: Request, { params }: Params) {
  try {
    await requireSuperAdmin();
    const { clientId } = await params;

    const clientUsers = await prisma.clientUser.findMany({
      where: { clientId },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    });
    return apiSuccess(
      clientUsers.map((cu) => ({
        ...cu.user,
        canAccessSeating: cu.canAccessSeating,
        canAccessGuestPhotos: cu.canAccessGuestPhotos,
        canAccessMenu: cu.canAccessMenu,
      }))
    );
  } catch {
    return apiError("Unauthorized", 401);
  }
}

export async function POST(req: Request, { params }: Params) {
  try {
    await requireSuperAdmin();
    const { clientId } = await params;
    const { userId, canAccessSeating, canAccessGuestPhotos, canAccessMenu } = await req.json();
    if (!userId) return apiError("userId diperlukan");

    // Check user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true },
    });
    if (!user) return apiError("Pengguna tidak ditemukan");

    const flags = {
      canAccessSeating: canAccessSeating ?? true,
      canAccessGuestPhotos: canAccessGuestPhotos ?? true,
      canAccessMenu: canAccessMenu ?? true,
    };

    // Upsert — prevent duplicate
    await prisma.clientUser.upsert({
      where: { userId_clientId: { userId, clientId } },
      update: flags,
      create: { userId, clientId, ...flags },
    });
    return apiSuccess({ ...user, ...flags }, 201);
  } catch (err: any) {
    if (err?.message === "FORBIDDEN") return apiError("Akses ditolak", 403);
    return apiError("Terjadi kesalahan server", 500);
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    await requireSuperAdmin();
    const { clientId } = await params;
    const { userId, canAccessSeating, canAccessGuestPhotos, canAccessMenu } = await req.json();
    if (!userId) return apiError("userId diperlukan");

    const clientUser = await prisma.clientUser.update({
      where: { userId_clientId: { userId, clientId } },
      data: {
        ...(canAccessSeating !== undefined && { canAccessSeating }),
        ...(canAccessGuestPhotos !== undefined && { canAccessGuestPhotos }),
        ...(canAccessMenu !== undefined && { canAccessMenu }),
      },
    });
    return apiSuccess(clientUser);
  } catch (err: any) {
    if (err?.message === "FORBIDDEN") return apiError("Akses ditolak", 403);
    return apiError("Terjadi kesalahan server", 500);
  }
}

export async function DELETE(req: Request, { params }: Params) {
  try {
    await requireSuperAdmin();
    const { clientId } = await params;
    const { userId } = await req.json();
    if (!userId) return apiError("userId diperlukan");

    await prisma.clientUser.delete({
      where: { userId_clientId: { userId, clientId } },
    });
    return apiSuccess({ message: "Akses dicabut" });
  } catch (err: any) {
    if (err?.message === "FORBIDDEN") return apiError("Akses ditolak", 403);
    return apiError("Terjadi kesalahan server", 500);
  }
}

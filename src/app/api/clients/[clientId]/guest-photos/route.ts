import { prisma } from "@/lib/database/prisma";
import { requireAuth, canAccessClient, canAccessGuestPhotos } from "@/lib/auth/permissions";
import { apiError, apiSuccess } from "@/lib/utils";

export async function GET(req: Request, { params }: { params: Promise<{ clientId: string }> }) {
  try {
    await requireAuth();
    const { clientId } = await params;
    const hasAccess = await canAccessClient(clientId);
    if (!hasAccess) return apiError("Akses ditolak", 403);
    if (!(await canAccessGuestPhotos(clientId))) return apiError("Akses ditolak", 403);

    const photos = await prisma.guestPhoto.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        url: true,
        createdAt: true,
        guest: { select: { id: true, name: true } },
      },
    });

    return apiSuccess(photos);
  } catch {
    return apiError("Terjadi kesalahan server", 500);
  }
}

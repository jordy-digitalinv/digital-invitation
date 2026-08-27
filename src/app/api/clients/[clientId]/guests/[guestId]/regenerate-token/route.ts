import { canAccessClient, requireAuth } from "@/lib/auth/permissions";
import { regenerateGuestToken } from "@/modules/guests/guests.service";
import { prisma } from "@/lib/database/prisma";
import { apiError, apiSuccess } from "@/lib/utils";

interface Params {
  params: Promise<{ clientId: string; guestId: string }>;
}

export async function POST(_req: Request, { params }: Params) {
  try {
    const { clientId, guestId } = await params;
    await requireAuth();
    const hasAccess = await canAccessClient(clientId);
    if (!hasAccess) return apiError("Akses ditolak", 403);

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { slug: true, clientType: true },
    });
    if (!client) return apiError("Client tidak ditemukan", 404);

    const guest = await regenerateGuestToken(guestId, client.slug);
    return apiSuccess(guest);
  } catch {
    return apiError("Terjadi kesalahan server", 500);
  }
}

import { canAccessClient, requireAuth } from "@/lib/auth/permissions";
import { regenerateAllGuestBarcodes } from "@/modules/guests/guests.service";
import { apiError, apiSuccess } from "@/lib/utils";

interface Params {
  params: Promise<{ clientId: string }>;
}

export async function POST(_req: Request, { params }: Params) {
  try {
    const { clientId } = await params;
    await requireAuth();
    const hasAccess = await canAccessClient(clientId);
    if (!hasAccess) return apiError("Akses ditolak", 403);

    const count = await regenerateAllGuestBarcodes(clientId);
    return apiSuccess({ count });
  } catch {
    return apiError("Terjadi kesalahan server", 500);
  }
}

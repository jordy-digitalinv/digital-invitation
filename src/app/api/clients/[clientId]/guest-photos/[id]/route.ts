import { prisma } from "@/lib/database/prisma";
import { requireAuth, canAccessClient, canAccessGuestPhotos } from "@/lib/auth/permissions";
import { getSupabase, GUEST_PHOTOS_BUCKET } from "@/lib/supabase";
import { apiError, apiSuccess } from "@/lib/utils";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ clientId: string; id: string }> }
) {
  try {
    await requireAuth();
    const { clientId, id } = await params;
    const hasAccess = await canAccessClient(clientId);
    if (!hasAccess) return apiError("Akses ditolak", 403);
    if (!(await canAccessGuestPhotos(clientId))) return apiError("Akses ditolak", 403);

    const photo = await prisma.guestPhoto.findFirst({
      where: { id, clientId },
    });
    if (!photo) return apiError("Foto tidak ditemukan", 404);

    await getSupabase().storage.from(GUEST_PHOTOS_BUCKET).remove([photo.storagePath]);
    await prisma.guestPhoto.delete({ where: { id } });

    return apiSuccess({ deleted: true });
  } catch {
    return apiError("Terjadi kesalahan server", 500);
  }
}

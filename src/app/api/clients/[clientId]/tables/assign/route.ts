import { canAccessClient, canAccessSeating, requireAuth } from "@/lib/auth/permissions";
import { assignGuestSchema } from "@/modules/tables/tables.schema";
import { assignGuestToTable } from "@/modules/tables/tables.service";
import { apiError, apiSuccess } from "@/lib/utils";

interface Params {
  params: Promise<{ clientId: string }>;
}

export async function POST(req: Request, { params }: Params) {
  try {
    const { clientId } = await params;
    await requireAuth();
    const hasAccess = await canAccessClient(clientId);
    if (!hasAccess) return apiError("Akses ditolak", 403);
    if (!(await canAccessSeating(clientId))) return apiError("Akses ditolak", 403);

    const body = await req.json();
    const parsed = assignGuestSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0]?.message || "Validasi gagal");

    const guest = await assignGuestToTable(clientId, parsed.data.guestId, parsed.data.tableId);
    return apiSuccess(guest);
  } catch (err) {
    if (err instanceof Error && err.message === "TABLE_FULL") {
      return apiError("Kapasitas meja tidak cukup", 400);
    }
    if (err instanceof Error && (err.message === "GUEST_NOT_FOUND" || err.message === "TABLE_NOT_FOUND")) {
      return apiError("Data tidak ditemukan", 404);
    }
    return apiError("Terjadi kesalahan server", 500);
  }
}

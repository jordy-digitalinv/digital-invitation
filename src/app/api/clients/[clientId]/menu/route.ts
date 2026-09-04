import { canAccessClient, requireAuth } from "@/lib/auth/permissions";
import { menuItemSchema } from "@/modules/menu/menu.schema";
import { getMenuItems, upsertMenuItem, deleteMenuItem } from "@/modules/menu/menu.service";
import { apiError, apiSuccess } from "@/lib/utils";

interface Params {
  params: Promise<{ clientId: string }>;
}

export async function GET(_req: Request, { params }: Params) {
  try {
    const { clientId } = await params;
    await requireAuth();
    const hasAccess = await canAccessClient(clientId);
    if (!hasAccess) return apiError("Akses ditolak", 403);

    const menuItems = await getMenuItems(clientId);
    return apiSuccess(menuItems);
  } catch {
    return apiError("Unauthorized", 401);
  }
}

export async function POST(req: Request, { params }: Params) {
  try {
    const { clientId } = await params;
    await requireAuth();
    const hasAccess = await canAccessClient(clientId);
    if (!hasAccess) return apiError("Akses ditolak", 403);

    const body = await req.json();
    const parsed = menuItemSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0]?.message || "Validasi gagal");

    const menuItem = await upsertMenuItem(clientId, parsed.data, body.id);
    return apiSuccess(menuItem);
  } catch (err) {
    if (err instanceof Error && err.message === "EVENT_NOT_FOUND") {
      return apiError("Acara tidak ditemukan", 404);
    }
    return apiError("Terjadi kesalahan server", 500);
  }
}

export async function DELETE(req: Request, { params }: Params) {
  try {
    const { clientId } = await params;
    await requireAuth();
    const hasAccess = await canAccessClient(clientId);
    if (!hasAccess) return apiError("Akses ditolak", 403);

    const { id } = await req.json();
    if (!id) return apiError("ID menu diperlukan");

    await deleteMenuItem(clientId, id);
    return apiSuccess({ message: "Menu dihapus" });
  } catch {
    return apiError("Terjadi kesalahan server", 500);
  }
}

import { canAccessClient, canAccessSeating, requireAuth } from "@/lib/auth/permissions";
import { createTableSchema, updateTableSchema } from "@/modules/tables/tables.schema";
import {
  createTable,
  deleteTable,
  getTables,
  getUnassignedReceptionGuests,
  updateTable,
} from "@/modules/tables/tables.service";
import { apiError, apiSuccess } from "@/lib/utils";
import { Prisma } from "@prisma/client";

interface Params {
  params: Promise<{ clientId: string }>;
}

export async function GET(_req: Request, { params }: Params) {
  try {
    const { clientId } = await params;
    await requireAuth();
    const hasAccess = await canAccessClient(clientId);
    if (!hasAccess) return apiError("Akses ditolak", 403);
    if (!(await canAccessSeating(clientId))) return apiError("Akses ditolak", 403);

    const [tables, unassignedGuests] = await Promise.all([
      getTables(clientId),
      getUnassignedReceptionGuests(clientId),
    ]);

    return apiSuccess({ tables, unassignedGuests });
  } catch {
    return apiError("Terjadi kesalahan server", 500);
  }
}

export async function POST(req: Request, { params }: Params) {
  try {
    const { clientId } = await params;
    await requireAuth();
    const hasAccess = await canAccessClient(clientId);
    if (!hasAccess) return apiError("Akses ditolak", 403);
    if (!(await canAccessSeating(clientId))) return apiError("Akses ditolak", 403);

    const body = await req.json();
    const parsed = createTableSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0]?.message || "Validasi gagal");

    const table = await createTable(clientId, parsed.data);
    return apiSuccess(table, 201);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return apiError("Kode meja sudah dipakai", 400);
    }
    return apiError("Terjadi kesalahan server", 500);
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { clientId } = await params;
    await requireAuth();
    const hasAccess = await canAccessClient(clientId);
    if (!hasAccess) return apiError("Akses ditolak", 403);
    if (!(await canAccessSeating(clientId))) return apiError("Akses ditolak", 403);

    const body = await req.json();
    const parsed = updateTableSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0]?.message || "Validasi gagal");

    const table = await updateTable(clientId, parsed.data);
    return apiSuccess(table);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return apiError("Kode meja sudah dipakai", 400);
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
    if (!(await canAccessSeating(clientId))) return apiError("Akses ditolak", 403);

    const { id } = await req.json();
    if (!id) return apiError("id diperlukan");

    await deleteTable(clientId, id);
    return apiSuccess({ message: "Meja dihapus" });
  } catch {
    return apiError("Terjadi kesalahan server", 500);
  }
}

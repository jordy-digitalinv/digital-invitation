import { canAccessClient, requireAuth } from "@/lib/auth/permissions";
import { prisma } from "@/lib/database/prisma";
import { apiError, apiSuccess } from "@/lib/utils";
import { z } from "zod";

const giftSchema = z.object({
  kind: z.enum(["BANK", "EWALLET", "QRIS", "ADDRESS"]).default("BANK"),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  accountName: z.string().optional(),
  ewalletType: z.string().optional(),
  ewalletNumber: z.string().optional(),
  qrisImage: z.string().optional(),
  receiverName: z.string().optional(),
  receiverPhone: z.string().optional(),
  address: z.string().optional(),
});

interface Params {
  params: Promise<{ clientId: string }>;
}

export async function GET(_req: Request, { params }: Params) {
  try {
    const { clientId } = await params;
    await requireAuth();
    const hasAccess = await canAccessClient(clientId);
    if (!hasAccess) return apiError("Akses ditolak", 403);

    const gifts = await prisma.gift.findMany({
      where: { clientId },
      orderBy: { sortOrder: "asc" },
    });
    return apiSuccess(gifts);
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
    const parsed = giftSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0]?.message || "Validasi gagal");

    const count = await prisma.gift.count({ where: { clientId } });
    const gift = await prisma.gift.create({
      data: { clientId, ...parsed.data, sortOrder: count },
    });
    return apiSuccess(gift, 201);
  } catch {
    return apiError("Terjadi kesalahan server", 500);
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { clientId } = await params;
    await requireAuth();
    const hasAccess = await canAccessClient(clientId);
    if (!hasAccess) return apiError("Akses ditolak", 403);

    const { id, isActive } = await req.json();
    if (!id) return apiError("ID gift diperlukan");

    const gift = await prisma.gift.update({
      where: { id, clientId },
      data: { isActive },
    });
    return apiSuccess(gift);
  } catch {
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
    if (!id) return apiError("ID gift diperlukan");

    await prisma.gift.delete({ where: { id, clientId } });
    return apiSuccess({ message: "Gift dihapus" });
  } catch {
    return apiError("Terjadi kesalahan server", 500);
  }
}

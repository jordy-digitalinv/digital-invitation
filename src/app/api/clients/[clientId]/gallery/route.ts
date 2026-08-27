import { canAccessClient, requireAuth } from "@/lib/auth/permissions";
import { prisma } from "@/lib/database/prisma";
import { apiError, apiSuccess } from "@/lib/utils";
import { z } from "zod";

const gallerySchema = z.object({
  url: z.string().min(1, "URL gambar diperlukan"),
  type: z.enum(["HERO", "COVER", "BACKGROUND", "PREWEDDING", "GALLERY"]).default("GALLERY"),
  sortOrder: z.number().int().default(0),
});

// URL halaman GitHub (…/blob/…) bukan file gambar — konversi ke raw agar bisa ditampilkan.
function normalizeImageUrl(url: string): string {
  return url.replace(
    /^(https?:\/\/)github\.com\/([^/]+)\/([^/]+)\/blob\//,
    "$1raw.githubusercontent.com/$2/$3/"
  );
}

interface Params {
  params: Promise<{ clientId: string }>;
}

export async function GET(_req: Request, { params }: Params) {
  try {
    const { clientId } = await params;
    await requireAuth();
    const hasAccess = await canAccessClient(clientId);
    if (!hasAccess) return apiError("Akses ditolak", 403);

    const galleries = await prisma.gallery.findMany({
      where: { clientId },
      orderBy: { sortOrder: "asc" },
    });
    return apiSuccess(galleries);
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
    const parsed = gallerySchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0]?.message || "Validasi gagal");

    const count = await prisma.gallery.count({ where: { clientId } });
    const gallery = await prisma.gallery.create({
      data: { clientId, ...parsed.data, url: normalizeImageUrl(parsed.data.url), sortOrder: count },
    });
    return apiSuccess(gallery, 201);
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

    const { ids } = await req.json() as { ids: string[] };
    if (!Array.isArray(ids)) return apiError("ids harus berupa array");

    // Update sortOrder for each id based on its position in the array
    await Promise.all(
      ids.map((id, index) =>
        prisma.gallery.update({ where: { id, clientId }, data: { sortOrder: index } })
      )
    );
    return apiSuccess({ message: "Urutan disimpan" });
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
    if (!id) return apiError("ID galeri diperlukan");

    await prisma.gallery.delete({ where: { id, clientId } });
    return apiSuccess({ message: "Foto dihapus" });
  } catch {
    return apiError("Terjadi kesalahan server", 500);
  }
}

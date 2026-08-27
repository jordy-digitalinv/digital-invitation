import { nanoid } from "nanoid";
import { prisma } from "@/lib/database/prisma";
import { getSupabase, GUEST_PHOTOS_BUCKET } from "@/lib/supabase";
import { apiError, apiSuccess } from "@/lib/utils";

export const runtime = "nodejs";

const MAX_PHOTOS = 12;
const MAX_SIZE = 8 * 1024 * 1024; // 8MB (post-compression)

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    if (!token) return apiError("token diperlukan");

    const guest = await prisma.guest.findUnique({
      where: { guestToken: token },
      select: { id: true, isActive: true },
    });
    if (!guest || !guest.isActive) return apiError("Tamu tidak ditemukan", 404);

    const photos = await prisma.guestPhoto.findMany({
      where: { guestId: guest.id },
      orderBy: { createdAt: "asc" },
      select: { id: true, url: true, createdAt: true },
    });

    return apiSuccess({ photos, count: photos.length, remaining: MAX_PHOTOS - photos.length });
  } catch {
    return apiError("Terjadi kesalahan server", 500);
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const token = formData.get("token") as string | null;
    const clientId = formData.get("clientId") as string | null;

    if (!file || !file.size) return apiError("File diperlukan");
    if (!token) return apiError("token diperlukan");
    if (!clientId) return apiError("clientId diperlukan");

    if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
      return apiError("Format tidak didukung. Gunakan JPG, PNG, atau WebP.");
    }

    if (file.size > MAX_SIZE) {
      return apiError("Ukuran file terlalu besar. Maksimal 8MB.");
    }

    const guest = await prisma.guest.findUnique({
      where: { guestToken: token },
      select: {
        id: true,
        isActive: true,
        clientId: true,
        rsvp: { select: { status: true } },
        attendances: { select: { id: true }, take: 1 },
        client: { select: { theme: { select: { barcodeVisibility: true, disposableCameraEnabled: true } } } },
      },
    });
    if (!guest || !guest.isActive) return apiError("Tamu tidak ditemukan", 404);
    if (guest.clientId !== clientId) return apiError("Akses ditolak", 403);
    if (guest.client.theme?.disposableCameraEnabled === false) {
      return apiError("Fitur kamera tamu tidak diaktifkan untuk acara ini", 403);
    }

    const requiresRsvp = (guest.client.theme?.barcodeVisibility ?? "AFTER_RSVP") === "AFTER_RSVP";
    if (requiresRsvp && guest.rsvp?.status !== "HADIR") {
      return apiError("Kamu perlu konfirmasi kehadiran (RSVP) terlebih dahulu", 403);
    }
    if (guest.attendances.length === 0) {
      return apiError("Kamu perlu check-in di lokasi acara terlebih dahulu", 403);
    }

    const existingCount = await prisma.guestPhoto.count({
      where: { guestId: guest.id },
    });
    if (existingCount >= MAX_PHOTOS) {
      return apiError(`Film sudah habis! Maksimal ${MAX_PHOTOS} foto per tamu.`, 400);
    }

    const filename = `${nanoid(12)}.jpg`;
    const storagePath = `${clientId}/${guest.id}/${filename}`;

    const bytes = await file.arrayBuffer();
    const sb = getSupabase();
    const { error: uploadError } = await sb.storage
      .from(GUEST_PHOTOS_BUCKET)
      .upload(storagePath, Buffer.from(bytes), {
        contentType: "image/jpeg",
        upsert: false,
      });

    if (uploadError) {
      console.error("[guest-photos upload]", uploadError);
      return apiError("Gagal mengupload foto", 500);
    }

    const { data: publicUrlData } = sb.storage
      .from(GUEST_PHOTOS_BUCKET)
      .getPublicUrl(storagePath);

    const photo = await prisma.guestPhoto.create({
      data: {
        clientId,
        guestId: guest.id,
        url: publicUrlData.publicUrl,
        storagePath,
      },
    });

    return apiSuccess({
      id: photo.id,
      url: photo.url,
      count: existingCount + 1,
      remaining: MAX_PHOTOS - (existingCount + 1),
    });
  } catch (err) {
    console.error("[guest-photos]", err);
    return apiError("Terjadi kesalahan server", 500);
  }
}

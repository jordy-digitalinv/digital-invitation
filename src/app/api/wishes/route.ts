import { wishSchema } from "@/modules/rsvp/rsvp.schema";
import { submitWish, getPublicWishes } from "@/modules/rsvp/rsvp.service";
import { apiError, apiSuccess } from "@/lib/utils";

export async function GET(req: Request) {
  const clientId = new URL(req.url).searchParams.get("clientId");
  if (!clientId) return apiError("clientId wajib diisi");

  const wishes = await getPublicWishes(clientId);
  return apiSuccess(wishes);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = wishSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0]?.message || "Validasi gagal");

    const wish = await submitWish(parsed.data);
    return apiSuccess(wish);
  } catch (err) {
    if (err instanceof Error && err.message === "RSVP_REQUIRED") {
      return apiError("Konfirmasi kehadiran (RSVP) dulu sebelum kirim ucapan", 400);
    }
    return apiError("Terjadi kesalahan server", 500);
  }
}

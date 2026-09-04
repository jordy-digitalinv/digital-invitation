import { rsvpSchema } from "@/modules/rsvp/rsvp.schema";
import { submitRsvp } from "@/modules/rsvp/rsvp.service";
import { apiError, apiSuccess } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = rsvpSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.issues[0]?.message || "Validasi gagal");

    const rsvp = await submitRsvp(parsed.data);
    return apiSuccess(rsvp);
  } catch (err) {
    if (err instanceof Error && err.message === "INVALID_TOKEN") {
      return apiError("Link undangan tidak valid", 400);
    }
    if (err instanceof Error && err.message === "PAX_EXCEEDS_MAX") {
      return apiError("Jumlah tamu melebihi batas maksimal", 400);
    }
    if (err instanceof Error && err.message === "MENU_CHOICES_REQUIRED") {
      return apiError("Pilihan menu wajib diisi untuk semua tamu", 400);
    }
    return apiError("Terjadi kesalahan server", 500);
  }
}

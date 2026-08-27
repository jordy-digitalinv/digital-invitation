import { z } from "zod";

export const GUEST_SIDES = ["GROOM", "BRIDE"] as const;

// Kategori tamu diturunkan dinamis dari daftar event client
// (lihat getInvitationCategories di src/lib/categories.ts),
// jadi di sini cukup validasi sebagai string non-kosong.
export const createGuestSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  phone: z.string().optional().nullable(),
  invitationCategory: z.string().min(1, "Kategori wajib dipilih"),
  side: z.enum(GUEST_SIDES).optional().nullable(),
  maxPax: z.number().int().min(1).default(2),
});

export const updateGuestSchema = createGuestSchema.partial();

export const importGuestsSchema = z.array(
  z.object({
    name: z.string().min(1),
    phone: z.string().optional(),
    invitationCategory: z.string().optional(),
    side: z.enum(GUEST_SIDES).optional().nullable(),
    maxPax: z.number().optional().default(2),
  })
);

export type CreateGuestInput = z.infer<typeof createGuestSchema>;
export type UpdateGuestInput = z.infer<typeof updateGuestSchema>;
export type GuestSideValue = typeof GUEST_SIDES[number];

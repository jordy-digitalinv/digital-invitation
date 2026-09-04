import { z } from "zod";

export const rsvpSchema = z.object({
  token: z.string().min(1),
  name: z.string().min(1, "Nama wajib diisi"),
  paxCount: z.number().int().min(1),
  status: z.enum(["HADIR", "TIDAK_HADIR"]),
  menuChoices: z.array(z.string()).optional(),
});

export const wishSchema = z.object({
  clientId: z.string().min(1),
  guestId: z.string().optional().nullable(),
  name: z.string().min(1, "Nama wajib diisi"),
  message: z.string().min(1, "Pesan wajib diisi"),
});

export type RsvpInput = z.infer<typeof rsvpSchema>;
export type WishInput = z.infer<typeof wishSchema>;

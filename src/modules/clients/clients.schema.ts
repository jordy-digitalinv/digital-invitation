import { z } from "zod";

// Subdomain sistem yang gak boleh dipakai jadi slug client — bentrok sama host CMS/redirect.
const RESERVED_SLUGS = ["cms", "www", "admin", "api"];

export const createClientSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  // Slug dipakai sebagai subdomain undangan: <slug>.digital-invitation.my.id
  slug: z
    .string()
    .min(2, "Slug minimal 2 karakter")
    .max(40, "Slug maksimal 40 karakter")
    .regex(
      /^[a-z0-9]+(-[a-z0-9]+)*$/,
      "Slug hanya boleh huruf kecil, angka, dan tanda - di tengah"
    )
    .refine((slug) => !RESERVED_SLUGS.includes(slug), "Slug ini dipakai sistem, pilih yang lain"),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).default("ACTIVE"),
  clientType: z
    .enum(["WEDDING", "SANGJIT", "LAMARAN", "ULANG_TAHUN", "KANTOR"])
    .default("WEDDING"),
});

export const updateClientSchema = createClientSchema.partial();

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;

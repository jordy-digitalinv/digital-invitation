import { z } from "zod";

export const menuItemSchema = z.object({
  eventId: z.string().min(1),
  name: z.string().min(1, "Nama menu wajib diisi"),
  sortOrder: z.number().default(0),
});

export type MenuItemInput = z.infer<typeof menuItemSchema>;

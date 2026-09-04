import { z } from "zod";

export const weddingProfileSchema = z.object({
  groomName: z.string().default(""),
  brideName: z.string().default(""),
  groomNickname: z.string().default(""),
  brideNickname: z.string().default(""),
  groomParents: z.string().default(""),
  brideParents: z.string().default(""),
  groomParentsEn: z.string().optional().nullable(),
  brideParentsEn: z.string().optional().nullable(),
  groomPhoto: z.string().optional().nullable(),
  bridePhoto: z.string().optional().nullable(),
  showGroomPhoto: z.boolean().default(true),
  showBridePhoto: z.boolean().default(true),
  heroImage: z.string().optional().nullable(),
  story: z.string().optional().nullable(),
  storyEn: z.string().optional().nullable(),
  storyTitle: z.string().optional().nullable(),
  storyTitleEn: z.string().optional().nullable(),
  showStoryTitle: z.boolean().default(true),
  openingQuote: z.string().optional().nullable(),
  openingQuoteEn: z.string().optional().nullable(),
  openingQuoteBy: z.string().optional().nullable(),
  openingQuoteByEn: z.string().optional().nullable(),
  attentionTitle: z.string().optional().nullable(),
  attentionContent: z.string().optional().nullable(),
  attentionTitleEn: z.string().optional().nullable(),
  attentionContentEn: z.string().optional().nullable(),
});

export const eventSchema = z.object({
  type: z.enum(["AKAD", "PEMBERKATAN", "RESEPSI", "AFTER_PARTY", "SANGJIT", "LAMARAN"]),
  label: z.string().default(""),
  labelEn: z.string().optional().nullable(),
  date: z.string().optional().nullable(),
  timeStart: z.string().default(""),
  timeEnd: z.string().default(""),
  venueName: z.string().default(""),
  venueNameEn: z.string().optional().nullable(),
  venueAddress: z.string().default(""),
  mapsUrl: z.string().default(""),
  mapsEmbed: z.string().default(""),
  sortOrder: z.number().default(0),
  isAyce: z.boolean().default(false),
});

export type WeddingProfileInput = z.infer<typeof weddingProfileSchema>;
export type EventInput = z.infer<typeof eventSchema>;

"use client";

import dynamic from "next/dynamic";
import type { Rsvp } from "@/types/prisma.types";

const CLASSIC_ELEGANT = "classic-elegant";
const MODERN_MINIMAL = "modern-minimal";
const FLORAL_BLUSH = "floral-blush";
const LUXE_DARKGOLD = "luxe-darkgold";
const SAGE_BOTANICAL = "sage-botanical";
const RUSTIC_TERRACOTTA = "rustic-terracotta";
const JAWA_AGENG = "jawa-ageng";
const AMBON_MANISE = "ambon-manise";
const ISLAMI_EMERALD = "islami-emerald";
const SANGJIT_MERAH = "sangjit-merah";
const MINANG_GADANG = "minang-gadang";
const BATAK_ULOS = "batak-ulos";
const HANOI_MODERN = "hanoi-modern";
const LUCKY_ENVELOPE = "lucky-envelope";

const templates: Record<string, React.ComponentType<any>> = {
  [CLASSIC_ELEGANT]: dynamic(() => import("./templates/classic-elegant").then((m) => m.default)),
  [MODERN_MINIMAL]: dynamic(() => import("./templates/modern-minimal").then((m) => m.default)),
  [FLORAL_BLUSH]: dynamic(() => import("./templates/floral-blush").then((m) => m.default)),
  [LUXE_DARKGOLD]: dynamic(() => import("./templates/luxe-darkgold").then((m) => m.default)),
  [SAGE_BOTANICAL]: dynamic(() => import("./templates/sage-botanical").then((m) => m.default)),
  [RUSTIC_TERRACOTTA]: dynamic(() => import("./templates/rustic-terracotta").then((m) => m.default)),
  [JAWA_AGENG]: dynamic(() => import("./templates/jawa-ageng").then((m) => m.default)),
  [AMBON_MANISE]: dynamic(() => import("./templates/ambon-manise").then((m) => m.default)),
  [ISLAMI_EMERALD]: dynamic(() => import("./templates/islami-emerald").then((m) => m.default)),
  [SANGJIT_MERAH]: dynamic(() => import("./templates/sangjit-merah").then((m) => m.default)),
  [MINANG_GADANG]: dynamic(() => import("./templates/minang-gadang").then((m) => m.default)),
  [BATAK_ULOS]: dynamic(() => import("./templates/batak-ulos").then((m) => m.default)),
  [HANOI_MODERN]: dynamic(() => import("./templates/hanoi-modern").then((m) => m.default)),
  [LUCKY_ENVELOPE]: dynamic(() =>
    import("./templates/lucky-envelope").then((m) => m.LuckyEnvelopeTemplate)
  ),
};

interface Guest {
  id: string;
  name: string;
  maxPax: number;
  rsvp: Rsvp | null;
  invitationCategory?: string;
  barcodeChurch?: string | null;
  barcodeReception?: string | null;
}

type InvitationClient = {
  id: string; name: string; slug: string; clientType: string;
  weddingProfile: {
    groomName: string; brideName: string; groomNickname: string; brideNickname: string;
    groomParents: string; brideParents: string;
    openingQuote: string | null; openingQuoteBy: string | null;
    story: string | null; storyTitle: string | null; showStoryTitle: boolean;
    heroImage: string | null;
    groomPhoto: string | null; bridePhoto: string | null;
    showGroomPhoto: boolean; showBridePhoto: boolean;
  } | null;
  events: { id: string; type: string; label: string; date: Date | null; timeStart: string; timeEnd: string; venueName: string; venueNameEn?: string | null; venueAddress: string; mapsUrl: string; isAyce: boolean; menuItems: { id: string; name: string }[] }[];
  musics: { url: string; title: string }[];
  sections: { sectionKey: string; sortOrder: number }[];
  galleries: { id: string; url: string; type: string; sortOrder: number }[];
  gifts: { id: string; bankName: string | null; accountNumber: string | null; accountName: string | null; ewalletType: string | null; ewalletNumber: string | null; qrisImage: string | null; isActive: boolean }[];
  wishes: { id: string; name: string; message: string; reply: string | null; createdAt: Date }[];
  theme: { templateSlug?: string | null; primaryColor: string; secondaryColor: string; bgColor: string; textColor: string; fontHeading: string; fontBody: string; showCountdown?: boolean | null; showMap?: boolean | null } | null;
};

interface Props {
  guest: Guest | null;
  client: InvitationClient;
  token: string | null;
}

export function TemplateRenderer({ guest, client, token }: Props) {
  const slug = client.theme?.templateSlug ?? CLASSIC_ELEGANT;
  const Template = templates[slug] ?? templates[CLASSIC_ELEGANT];
  return <Template guest={guest} client={client as any} token={token} />;
}

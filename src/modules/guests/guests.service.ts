import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/database/prisma";
import { generateGuestToken, generateInvitationUrl } from "@/lib/token";
import { randomBytes } from "crypto";
import type { CreateGuestInput, UpdateGuestInput, GuestSideValue } from "./guests.schema";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function generateBarcode(): string {
  return randomBytes(10).toString("base64url");
}

function needsBarcodeReception(category: string): boolean {
  return category.includes("RESEPSI");
}

export async function getGuests(clientId: string) {
  return prisma.guest.findMany({
    where: { clientId },
    include: { rsvp: true, attendances: true },
    orderBy: { createdAt: "desc" },
  });
}

// Data client (profile, event, galeri, tema, musik, section, gift, wishes) jarang berubah —
// dicache 60 detik supaya guest yang buka undangan tidak selalu hit relational query berat ini.
// Perubahan lewat CMS baru kelihatan di undangan tamu maksimal 60 detik kemudian.
const getCachedClientInvitationData = unstable_cache(
  async (clientId: string) => {
    return prisma.client.findUnique({
      where: { id: clientId },
      include: {
        weddingProfile: true,
        events: { orderBy: [{ sortOrder: "asc" }, { date: "asc" }, { timeStart: "asc" }] },
        galleries: { orderBy: { sortOrder: "asc" } },
        theme: true,
        musics: { where: { isActive: true } },
        sections: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
        gifts: { where: { isActive: true } },
        wishes: { where: { isApproved: true }, orderBy: { createdAt: "desc" }, take: 20 },
      },
    });
  },
  ["client-invitation-data"],
  { revalidate: 60, tags: ["client-invitation-data"] }
);

export const getGuestByToken = cache(async function getGuestByToken(token: string) {
  // Data guest & RSVP harus selalu fresh (status hadir/tidak bisa berubah kapan saja), jadi tidak dicache.
  const guest = await prisma.guest.findUnique({
    where: { guestToken: token },
    include: {
      rsvp: true,
      attendances: true,
      client: { select: { id: true } },
    },
  });
  if (!guest) return null;

  const client = await getCachedClientInvitationData(guest.client.id);
  if (!client) return null;

  // unstable_cache menyimpan JSON — Date kembali sebagai string.
  // Ubah kembali ke Date supaya hook countdown/template bisa memakai .getTime().
  const events = client.events.map((e) => ({
    ...e,
    date: e.date ? new Date(e.date) : null,
  }));

  return { ...guest, client: { ...client, events } };
});

export async function createGuest(
  clientId: string,
  data: CreateGuestInput,
  clientSlug: string
) {
  const token = generateGuestToken(data.name);
  const invitationUrl = generateInvitationUrl(APP_URL, clientSlug, token);
  const barcodeChurch = generateBarcode();
  const barcodeReception = needsBarcodeReception(data.invitationCategory) ? generateBarcode() : null;

  return prisma.guest.create({
    data: {
      clientId,
      name: data.name,
      phone: data.phone || null,
      invitationCategory: data.invitationCategory,
      side: data.side || null,
      barcodeChurch,
      barcodeReception,
      maxPax: data.maxPax,
      guestToken: token,
      invitationUrl,
    },
  });
}

export async function importGuests(
  clientId: string,
  guests: Array<{ name: string; phone?: string; invitationCategory?: string; side?: GuestSideValue | null; maxPax?: number }>,
  clientSlug: string
) {
  // Fallback kategori untuk baris tanpa kategori: event pertama client.
  const firstEvent = await prisma.event.findFirst({
    where: { clientId },
    orderBy: [{ sortOrder: "asc" }, { date: "asc" }],
    select: { type: true },
  });
  const fallbackCategory = firstEvent?.type ?? "";

  const rows = guests.map((g) => {
    const token = generateGuestToken(g.name);
    const invitationUrl = generateInvitationUrl(APP_URL, clientSlug, token);
    const category = g.invitationCategory ?? fallbackCategory;
    return {
      clientId,
      name: g.name,
      phone: g.phone || null,
      invitationCategory: category,
      side: g.side || null,
      barcodeChurch: generateBarcode(),
      barcodeReception: needsBarcodeReception(category) ? generateBarcode() : null,
      maxPax: g.maxPax ?? 2,
      guestToken: token,
      invitationUrl,
    };
  });

  return prisma.guest.createMany({ data: rows });
}

export async function updateGuest(id: string, data: UpdateGuestInput) {
  return prisma.guest.update({ where: { id }, data });
}

export async function deleteGuest(id: string) {
  return prisma.guest.delete({ where: { id } });
}

export async function regenerateGuestToken(id: string, clientSlug: string) {
  const existing = await prisma.guest.findUnique({ where: { id }, select: { name: true } });
  const token = generateGuestToken(existing?.name);
  const invitationUrl = generateInvitationUrl(APP_URL, clientSlug, token);
  return prisma.guest.update({
    where: { id },
    data: { guestToken: token, invitationUrl, isOpened: false, openedAt: null },
  });
}

export async function regenerateGuestBarcodes(id: string) {
  const guest = await prisma.guest.findUnique({ where: { id } });
  if (!guest) throw new Error("Guest not found");

  return prisma.guest.update({
    where: { id },
    data: {
      barcodeChurch: generateBarcode(),
      barcodeReception: needsBarcodeReception(guest.invitationCategory) ? generateBarcode() : null,
    },
  });
}

export async function markGuestOpened(
  guestId: string,
  clientId: string,
  ip?: string,
  userAgent?: string,
  device?: string
) {
  await Promise.all([
    prisma.guest.update({
      where: { id: guestId },
      data: { isOpened: true, openedAt: new Date() },
    }),
    prisma.guestVisit.create({
      data: { guestId, clientId, ipAddress: ip, userAgent, device },
    }),
  ]);
}

export async function updateGuestSendStatus(id: string) {
  return prisma.guest.update({
    where: { id },
    data: { sendStatus: "SENT" },
  });
}

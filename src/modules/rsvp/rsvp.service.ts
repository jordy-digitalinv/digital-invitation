import { prisma } from "@/lib/database/prisma";
import { getGuestMenuEvent } from "@/modules/menu/menu.service";
import type { RsvpInput, WishInput } from "./rsvp.schema";

export async function submitRsvp(data: RsvpInput) {
  const guest = await prisma.guest.findUnique({
    where: { guestToken: data.token },
    select: { id: true, clientId: true, isActive: true, maxPax: true, invitationCategory: true },
  });

  if (!guest || !guest.isActive) {
    throw new Error("INVALID_TOKEN");
  }

  if (data.paxCount > guest.maxPax) {
    throw new Error("PAX_EXCEEDS_MAX");
  }

  const menuEvent = await getGuestMenuEvent(guest.clientId, guest.invitationCategory);
  const needsMenuChoice = data.status === "HADIR" && !!menuEvent;
  if (needsMenuChoice) {
    const validNames = new Set(menuEvent!.menuItems.map((i) => i.name));
    if (data.menuChoices?.length !== data.paxCount || data.menuChoices.some((c) => !validNames.has(c))) {
      throw new Error("MENU_CHOICES_REQUIRED");
    }
  }
  const menuChoices = needsMenuChoice ? data.menuChoices! : [];

  const rsvp = await prisma.rsvp.upsert({
    where: { guestId: guest.id },
    update: {
      name: data.name,
      paxCount: data.paxCount,
      status: data.status,
      menuChoices,
    },
    create: {
      guestId: guest.id,
      clientId: guest.clientId,
      name: data.name,
      paxCount: data.paxCount,
      status: data.status,
      menuChoices,
    },
  });

  await prisma.guest.update({
    where: { id: guest.id },
    data: { rsvpStatus: data.status },
  });

  return rsvp;
}

export async function getRsvps(clientId: string) {
  return prisma.rsvp.findMany({
    where: { clientId },
    include: { guest: { select: { name: true, phone: true, maxPax: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function submitWish(data: WishInput) {
  const theme = await prisma.theme.findUnique({
    where: { clientId: data.clientId },
    select: { requireRsvpForWish: true },
  });

  if (theme?.requireRsvpForWish) {
    const guest = data.guestId
      ? await prisma.guest.findUnique({
          where: { id: data.guestId },
          select: { clientId: true, rsvpStatus: true },
        })
      : null;

    const hasRsvped = guest?.clientId === data.clientId && guest.rsvpStatus !== "PENDING";
    if (!hasRsvped) {
      throw new Error("RSVP_REQUIRED");
    }
  }

  return prisma.wish.create({
    data: {
      clientId: data.clientId,
      guestId: data.guestId || null,
      name: data.name,
      message: data.message,
      isApproved: true,
    },
  });
}

export async function getWishes(clientId: string) {
  return prisma.wish.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPublicWishes(clientId: string) {
  return prisma.wish.findMany({
    where: { clientId, isApproved: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateWish(id: string, data: { isApproved?: boolean; reply?: string | null }) {
  return prisma.wish.update({ where: { id }, data });
}

export async function deleteWish(id: string) {
  return prisma.wish.delete({ where: { id } });
}

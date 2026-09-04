import { prisma } from "@/lib/database/prisma";
import { findMenuEvent } from "@/lib/menu";
import type { MenuItemInput } from "./menu.schema";

export async function getMenuItems(clientId: string) {
  return prisma.menuItem.findMany({
    where: { clientId },
    include: { event: { select: { id: true, type: true, label: true, venueName: true } } },
    orderBy: [{ eventId: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export async function upsertMenuItem(clientId: string, data: MenuItemInput, id?: string) {
  const event = await prisma.event.findUnique({ where: { id: data.eventId }, select: { clientId: true } });
  if (!event || event.clientId !== clientId) throw new Error("EVENT_NOT_FOUND");

  if (id) {
    return prisma.menuItem.update({ where: { id, clientId }, data });
  }

  const count = await prisma.menuItem.count({ where: { clientId, eventId: data.eventId } });
  return prisma.menuItem.create({ data: { ...data, clientId, sortOrder: count } });
}

export async function deleteMenuItem(clientId: string, id: string) {
  return prisma.menuItem.delete({ where: { id, clientId } });
}

export async function getGuestMenuEvent(clientId: string, invitationCategory: string) {
  const events = await prisma.event.findMany({
    where: { clientId },
    include: { menuItems: { orderBy: { sortOrder: "asc" } } },
  });
  return findMenuEvent(events, invitationCategory);
}

export async function hasAyceEvents(clientId: string) {
  const count = await prisma.event.count({ where: { clientId, isAyce: true } });
  return count > 0;
}

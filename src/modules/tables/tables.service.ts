import { prisma } from "@/lib/database/prisma";
import type { CreateTableInput, UpdateTableInput } from "./tables.schema";

function guestPax(guest: { maxPax: number; rsvp: { paxCount: number } | null }): number {
  return guest.rsvp?.paxCount ?? guest.maxPax;
}

export async function getTables(clientId: string) {
  const tables = await prisma.table.findMany({
    where: { clientId },
    include: {
      guests: { select: { id: true, name: true, maxPax: true, rsvp: { select: { paxCount: true } } } },
    },
    orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
  });

  return tables.map((t) => ({
    ...t,
    guests: t.guests.map((g) => ({ id: g.id, name: g.name, pax: guestPax(g) })),
  }));
}

export async function getUnassignedReceptionGuests(clientId: string) {
  const guests = await prisma.guest.findMany({
    where: { clientId, isActive: true, tableId: null, rsvpStatus: "HADIR" },
    select: {
      id: true,
      name: true,
      maxPax: true,
      invitationCategory: true,
      rsvp: { select: { paxCount: true } },
    },
    orderBy: { name: "asc" },
  });

  return guests
    .filter((g) => g.invitationCategory.includes("RESEPSI"))
    .map((g) => ({ id: g.id, name: g.name, pax: guestPax(g) }));
}

export async function createTable(clientId: string, data: CreateTableInput) {
  return prisma.table.create({ data: { clientId, ...data } });
}

export async function updateTable(clientId: string, data: UpdateTableInput) {
  const { id, ...rest } = data;
  return prisma.table.update({ where: { id, clientId }, data: rest });
}

export async function deleteTable(clientId: string, id: string) {
  return prisma.table.delete({ where: { id, clientId } });
}

export async function getSeatingExport(clientId: string) {
  const [tables, unassigned] = await Promise.all([
    prisma.table.findMany({
      where: { clientId },
      include: {
        guests: {
          select: { id: true, name: true, maxPax: true, rsvp: { select: { paxCount: true, menuChoices: true } } },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
    }),
    prisma.guest.findMany({
      where: { clientId, isActive: true, tableId: null, rsvpStatus: "HADIR" },
      select: {
        id: true,
        name: true,
        maxPax: true,
        invitationCategory: true,
        rsvp: { select: { paxCount: true, menuChoices: true } },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  function mapGuest(g: { id: string; name: string; maxPax: number; rsvp: { paxCount: number; menuChoices: string[] } | null }) {
    return {
      id: g.id,
      name: g.name,
      pax: g.rsvp?.paxCount ?? g.maxPax,
      menuChoices: g.rsvp?.menuChoices ?? [],
    };
  }

  const mappedTables = tables.map((t) => ({
    id: t.id,
    sectionLabel: t.sectionLabel,
    code: t.code,
    capacity: t.capacity,
    guests: t.guests.map(mapGuest),
  }));

  const unassignedGuests = unassigned
    .filter((g) => g.invitationCategory.includes("RESEPSI"))
    .map(mapGuest);

  const menuTotals: Record<string, number> = {};
  for (const g of [...mappedTables.flatMap((t) => t.guests), ...unassignedGuests]) {
    for (const m of g.menuChoices) menuTotals[m] = (menuTotals[m] ?? 0) + 1;
  }

  return { tables: mappedTables, unassignedGuests, menuTotals };
}

export async function assignGuestToTable(clientId: string, guestId: string, tableId: string | null) {
  const guest = await prisma.guest.findUnique({
    where: { id: guestId, clientId },
    select: { maxPax: true, rsvp: { select: { paxCount: true } } },
  });
  if (!guest) throw new Error("GUEST_NOT_FOUND");
  const pax = guestPax(guest);

  if (tableId) {
    const table = await prisma.table.findUnique({
      where: { id: tableId, clientId },
      include: { guests: { select: { id: true, maxPax: true, rsvp: { select: { paxCount: true } } } } },
    });
    if (!table) throw new Error("TABLE_NOT_FOUND");

    const filled = table.guests
      .filter((g) => g.id !== guestId)
      .reduce((sum, g) => sum + guestPax(g), 0);
    if (filled + pax > table.capacity) throw new Error("TABLE_FULL");
  }

  return prisma.guest.update({ where: { id: guestId, clientId }, data: { tableId } });
}

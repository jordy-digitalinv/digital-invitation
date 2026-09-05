import { prisma } from "@/lib/database/prisma";
import { RECEPTION_EVENT_TYPES } from "@/lib/categories";
import type { AttendanceType, Event } from "@prisma/client";

const SCAN_OPEN_BEFORE_MS = 4 * 60 * 60 * 1000; // boleh scan mulai 4 jam sebelum acara — tanpa cut off
const WIB_OFFSET_MINUTES = 7 * 60; // UTC+7

function getEventStartUTC(date: Date | null, timeStart: string): Date | null {
  if (!date) return null;
  const match = timeStart.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (isNaN(hours) || isNaN(minutes)) return null;
  const dateOnlyUTC = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const minutesFromMidnightUTC = hours * 60 + minutes - WIB_OFFSET_MINUTES;
  return new Date(dateOnlyUTC + minutesFromMidnightUTC * 60 * 1000);
}

function formatWIBTime(dt: Date): string {
  const wib = new Date(dt.getTime() + WIB_OFFSET_MINUTES * 60 * 1000);
  const hh = String(wib.getUTCHours()).padStart(2, "0");
  const mm = String(wib.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm} WIB`;
}

// Acara paling awal (tanggal, lalu jam mulai) di antara yang lolos filter — dipakai
// sebagai acuan jendela waktu scan, menggantikan asumsi lama yang hardcode 1 tipe acara.
function pickEarliestEvent(events: Event[], predicate: (e: Event) => boolean): Event | undefined {
  return events
    .filter(predicate)
    .sort((a, b) => {
      if (a.date && b.date) {
        const diff = a.date.getTime() - b.date.getTime();
        if (diff !== 0) return diff;
      } else if (a.date || b.date) {
        return a.date ? -1 : 1;
      }
      return a.timeStart.localeCompare(b.timeStart);
    })[0];
}

export async function getAttendances(clientId: string) {
  return prisma.attendance.findMany({
    where: { clientId },
    include: {
      guest: true,
    },
    orderBy: { arrivedAt: "desc" },
  });
}

export async function getAttendanceStats(clientId: string) {
  const [guests, attendances] = await Promise.all([
    prisma.guest.findMany({
      where: { clientId, isActive: true },
      select: { id: true, maxPax: true, invitationCategory: true },
    }),
    prisma.attendance.findMany({
      where: { clientId },
      include: { guest: { select: { maxPax: true, invitationCategory: true } } },
    }),
  ]);

  const totalGuests = guests.length;
  const totalPaxUndangan = guests.reduce((sum, g) => sum + g.maxPax, 0);

  const checkedInGuestIds = new Set(attendances.map((a) => a.guestId));
  const totalHadir = checkedInGuestIds.size;

  const churchActualPax = attendances
    .filter((a) => a.barcodeType === "CHURCH")
    .reduce((sum, a) => sum + a.actualPax, 0);
  const receptionActualPax = attendances
    .filter((a) => a.barcodeType === "RECEPTION")
    .reduce((sum, a) => sum + a.actualPax, 0);
  const nasiBoxAttendances = attendances.filter(
    (a) => a.barcodeType === "CHURCH" && a.guest.invitationCategory === "PEMBERKATAN_NASI_BOX"
  );
  const nasiBoxPax = nasiBoxAttendances.reduce((sum, a) => sum + a.actualPax, 0);
  const nasiBoxCount = nasiBoxAttendances.length;

  const categoryCount: Record<string, number> = {};
  for (const g of guests) {
    categoryCount[g.invitationCategory] = (categoryCount[g.invitationCategory] ?? 0) + 1;
  }
  const perCategory = Object.entries(categoryCount).map(([category, count]) => ({ category, count }));

  return {
    totalGuests,
    totalHadir,
    totalPaxUndangan,
    churchActualPax,
    receptionActualPax,
    nasiBoxPax,
    nasiBoxCount,
    perCategory,
  };
}

async function createAttendanceWithSequence(
  clientId: string,
  guestId: string,
  barcodeType: AttendanceType,
  actualPax: number
) {
  // Prisma's `increment` compiles to a single atomic `UPDATE ... SET x = x + 1 RETURNING x`,
  // so concurrent scans can't land on the same sequence number (no read-then-write race).
  const client = await prisma.client.update({
    where: { id: clientId },
    data: { lastAttendanceSequence: { increment: 1 } },
    select: { lastAttendanceSequence: true },
  });

  return prisma.attendance.create({
    data: {
      guestId,
      clientId,
      barcodeType,
      arrivedAt: new Date(),
      actualPax,
      sequenceNumber: client.lastAttendanceSequence,
    },
    include: { guest: { include: { table: true } } },
  });
}

export async function scanBarcode(clientId: string, barcode: string) {
  const guest = await prisma.guest.findFirst({
    where: {
      clientId,
      OR: [{ barcodeChurch: barcode }, { barcodeReception: barcode }],
    },
    include: { table: true },
  });

  if (!guest) {
    return { success: false, error: "Barcode tidak ditemukan" } as const;
  }

  const barcodeType: AttendanceType =
    guest.barcodeChurch === barcode ? "CHURCH" : "RECEPTION";

  // Validasi jendela waktu scan — acuannya acara paling awal dari sisi yang relevan,
  // bukan 1 tipe acara yang di-hardcode, supaya kerja buat semua ClientType/EventType.
  const [theme, events] = await Promise.all([
    prisma.theme.findUnique({ where: { clientId }, select: { barcodeMode: true } }),
    prisma.event.findMany({ where: { clientId } }),
  ]);
  const barcodeMode = theme?.barcodeMode ?? "SEPARATE";

  const event =
    barcodeMode === "SINGLE"
      ? pickEarliestEvent(events, () => true)
      : barcodeType === "CHURCH"
      ? pickEarliestEvent(events, (e) => !RECEPTION_EVENT_TYPES.has(e.type))
      : pickEarliestEvent(events, (e) => RECEPTION_EVENT_TYPES.has(e.type));

  if (event && event.date) {
    const eventStart = getEventStartUTC(event.date, event.timeStart);
    if (eventStart) {
      const now = new Date();
      const windowStart = new Date(eventStart.getTime() - SCAN_OPEN_BEFORE_MS);

      if (now < windowStart) {
        const label = barcodeMode === "SINGLE" ? "Presensi" : barcodeType === "CHURCH" ? "Gereja" : "Resepsi";
        return {
          success: false,
          outsideWindow: true,
          barcodeType,
          error: `Scan ${label} baru dibuka ${formatWIBTime(windowStart)} (4 jam sebelum acara)`,
        } as const;
      }
    }
  }

  const existing = await prisma.attendance.findUnique({
    where: { guestId_barcodeType: { guestId: guest.id, barcodeType } },
  });

  if (existing) {
    return {
      success: false,
      alreadyCheckedIn: true,
      arrivedAt: existing.arrivedAt,
      sequenceNumber: existing.sequenceNumber,
      actualPax: existing.actualPax,
      guest,
      barcodeType,
    } as const;
  }

  const attendance = await createAttendanceWithSequence(clientId, guest.id, barcodeType, guest.maxPax);

  return { success: true, attendance, barcodeType } as const;
}

export async function updateAttendanceActualPax(
  attendanceId: string,
  actualPax: number
) {
  return prisma.attendance.update({
    where: { id: attendanceId },
    data: { actualPax },
  });
}

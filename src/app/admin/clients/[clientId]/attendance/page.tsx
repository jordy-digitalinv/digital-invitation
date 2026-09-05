import { getAttendances, getAttendanceStats } from "@/modules/attendance/attendance.service";
import { AttendanceManager } from "@/components/cms/client/AttendanceManager";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/database/prisma";

interface Props {
  params: Promise<{ clientId: string }>;
}

export default async function AttendancePage({ params }: Props) {
  const { clientId } = await params;
  const session = await auth();
  const role = (session?.user as any)?.role as string | undefined;
  const isStaff = role === "STAFF";

  const [attendances, stats, events, theme] = await Promise.all([
    getAttendances(clientId),
    getAttendanceStats(clientId),
    prisma.event.findMany({ where: { clientId }, select: { type: true, label: true, venueName: true } }),
    prisma.theme.findUnique({ where: { clientId }, select: { barcodeMode: true } }),
  ]);
  const barcodeMode = (theme?.barcodeMode ?? "SEPARATE") as "SINGLE" | "SEPARATE";

  const serialized = attendances.map((a) => ({
    ...a,
    arrivedAt: a.arrivedAt.toISOString(),
    guest: {
      id: a.guest.id,
      name: a.guest.name,
      phone: a.guest.phone,
      maxPax: a.guest.maxPax,
      invitationCategory: a.guest.invitationCategory,
    },
  }));

  return (
    <div>
      {!isStaff && <h2 className="text-lg font-semibold text-stone-800 mb-4">Kehadiran Tamu</h2>}
      <AttendanceManager
        clientId={clientId}
        initialAttendances={serialized as any}
        initialStats={stats}
        staffMode={isStaff}
        events={events}
        barcodeMode={barcodeMode}
      />
    </div>
  );
}

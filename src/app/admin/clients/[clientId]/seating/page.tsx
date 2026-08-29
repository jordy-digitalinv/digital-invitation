import { redirect } from "next/navigation";
import { canAccessSeating } from "@/lib/auth/permissions";
import { getTables, getUnassignedReceptionGuests } from "@/modules/tables/tables.service";
import { SeatingManager } from "@/components/cms/client/SeatingManager";

interface Props {
  params: Promise<{ clientId: string }>;
}

export default async function SeatingPage({ params }: Props) {
  const { clientId } = await params;

  const allowed = await canAccessSeating(clientId);
  if (!allowed) redirect(`/admin/clients/${clientId}`);

  const [tables, unassignedGuests] = await Promise.all([
    getTables(clientId),
    getUnassignedReceptionGuests(clientId),
  ]);

  return (
    <div>
      <h2 className="text-lg font-semibold text-stone-800 mb-4">Seating Resepsi</h2>
      <SeatingManager clientId={clientId} initialTables={tables} initialUnassignedGuests={unassignedGuests} />
    </div>
  );
}

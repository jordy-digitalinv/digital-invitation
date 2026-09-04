import { notFound, redirect } from "next/navigation";
import { canAccessClient, canAccessMenu } from "@/lib/auth/permissions";
import { getEvents } from "@/modules/wedding/wedding.service";
import { getMenuItems } from "@/modules/menu/menu.service";
import { MenuManager } from "@/components/cms/client/MenuManager";

interface Props {
  params: Promise<{ clientId: string }>;
}

export default async function MenuPage({ params }: Props) {
  const { clientId } = await params;

  const hasAccess = await canAccessClient(clientId);
  if (!hasAccess) notFound();

  const allowed = await canAccessMenu(clientId);
  if (!allowed) redirect(`/admin/clients/${clientId}`);

  const [events, menuItems] = await Promise.all([
    getEvents(clientId),
    getMenuItems(clientId),
  ]);

  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-semibold text-stone-800 mb-4">Menu Makanan</h2>
      <MenuManager clientId={clientId} events={events} initialMenuItems={menuItems} />
    </div>
  );
}

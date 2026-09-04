import { auth } from "@/lib/auth/auth";
import { canAccessClient, canAccessSeating, canAccessGuestPhotos, canAccessMenu } from "@/lib/auth/permissions";
import { getClientNavInfo } from "@/modules/clients/clients.service";
import { notFound, redirect } from "next/navigation";
import { ClientNav } from "@/components/cms/client/ClientNav";

interface Props {
  children: React.ReactNode;
  params: Promise<{ clientId: string }>;
}

export default async function ClientLayout({ children, params }: Props) {
  const { clientId } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [hasAccess, client, seatingAllowed, guestPhotosAllowed, menuAllowed] = await Promise.all([
    canAccessClient(clientId),
    getClientNavInfo(clientId),
    canAccessSeating(clientId),
    canAccessGuestPhotos(clientId),
    canAccessMenu(clientId),
  ]);
  if (!hasAccess) redirect("/admin/clients");
  if (!client) notFound();

  const user = session.user as { role?: string };
  const isSuperAdmin = user.role === "SUPERADMIN";

  return (
    <div className={`w-full mx-auto ${isSuperAdmin ? "max-w-5xl" : "max-w-7xl"}`}>
      <ClientNav
        client={client}
        role={user.role}
        seatingAllowed={seatingAllowed}
        guestPhotosAllowed={guestPhotosAllowed}
        menuAllowed={menuAllowed}
      />
      <div className="mt-4 md:mt-6">{children}</div>
    </div>
  );
}

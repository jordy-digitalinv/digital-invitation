import { redirect } from "next/navigation";
import { canAccessGuestPhotos } from "@/lib/auth/permissions";
import { prisma } from "@/lib/database/prisma";
import { GuestPhotoManager } from "@/components/cms/client/GuestPhotoManager";

interface Props {
  params: Promise<{ clientId: string }>;
}

export default async function GuestPhotosPage({ params }: Props) {
  const { clientId } = await params;

  const allowed = await canAccessGuestPhotos(clientId);
  if (!allowed) redirect(`/admin/clients/${clientId}`);

  const theme = await prisma.theme.findUnique({
    where: { clientId },
    select: { disposableCameraEnabled: true },
  });

  return (
    <GuestPhotoManager
      clientId={clientId}
      initialDisposableCameraEnabled={theme?.disposableCameraEnabled ?? true}
    />
  );
}

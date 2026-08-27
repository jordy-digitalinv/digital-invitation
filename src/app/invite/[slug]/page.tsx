import { getClientBySlug } from "@/modules/clients/clients.service";
import { notFound } from "next/navigation";
import { TemplateRenderer } from "@/components/invitation/TemplateRenderer";
import { ClientErrorLogger, InvitationErrorBoundary } from "@/components/invitation/debug/ClientErrorLogger";
import { getSession } from "@/lib/auth/permissions";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}

export default async function PublicInvitationPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { preview } = await searchParams;

  const client = await getClientBySlug(slug);
  if (!client) notFound();

  if (client.status !== "ACTIVE") {
    if (preview === "1") {
      const session = await getSession();
      if (!session?.user) notFound();
    } else {
      notFound();
    }
  }

  return (<ClientErrorLogger><InvitationErrorBoundary><TemplateRenderer guest={null} client={client as any} token={null} /></InvitationErrorBoundary></ClientErrorLogger>);
}

function getEventLabel(clientType: string): string {
  if (clientType === "SANGJIT") return "Sangjit";
  if (clientType === "LAMARAN") return "Lamaran";
  return "Pernikahan";
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const client = await getClientBySlug(slug);
  if (!client) return {};

  const profile = client.weddingProfile;
  const coupleNames = profile
    ? `${profile.groomName} & ${profile.brideName}`
    : client.name;

  return {
    title: coupleNames,
    description: null,
    openGraph: {
      title: coupleNames,
      description: "",
    },
  };
}

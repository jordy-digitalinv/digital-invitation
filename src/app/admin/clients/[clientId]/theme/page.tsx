import { prisma } from "@/lib/database/prisma";
import { notFound } from "next/navigation";
import { canAccessClient } from "@/lib/auth/permissions";
import { ThemeEditor } from "@/components/cms/client/ThemeEditor";

interface Props {
  params: Promise<{ clientId: string }>;
}

const DEFAULT_THEME = {
  templateSlug: "classic-elegant",
  primaryColor: "#c4954a",
  secondaryColor: "#f4ece0",
  bgColor: "#faf8f4",
  textColor: "#332820",
  fontHeading: "Cormorant Garamond",
  fontBody: "Jost",
  showMap: true,
  barcodeVisibility: "AFTER_RSVP" as const,
  barcodeMode: "SEPARATE" as const,
};

export default async function ThemePage({ params }: Props) {
  const { clientId } = await params;

  const hasAccess = await canAccessClient(clientId);
  if (!hasAccess) notFound();

  const theme = await prisma.theme.findUnique({ where: { clientId } });

  const initialTheme = theme
    ? {
        templateSlug: theme.templateSlug || "lucky-envelope",
        primaryColor: theme.primaryColor,
        secondaryColor: theme.secondaryColor,
        bgColor: theme.bgColor,
        textColor: theme.textColor,
        fontHeading: theme.fontHeading,
        fontBody: theme.fontBody,
        showMap: theme.showMap ?? true,
        autoScroll: theme.autoScroll ?? true,
        barcodeVisibility: (theme.barcodeVisibility ?? "AFTER_RSVP") as "ALWAYS" | "AFTER_RSVP" | "HIDDEN",
        barcodeMode: (theme.barcodeMode ?? "SEPARATE") as "SINGLE" | "SEPARATE",
      }
    : DEFAULT_THEME;

  return <ThemeEditor clientId={clientId} initialTheme={initialTheme} />;
}

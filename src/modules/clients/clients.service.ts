import { cache } from "react";
import { prisma } from "@/lib/database/prisma";
import { DEFAULT_SECTIONS } from "@/constants/sections";
import { DEFAULT_TEMPLATE } from "@/lib/whatsapp";
import { addClientDomain, removeClientDomain } from "@/lib/vercel";
import type { CreateClientInput, UpdateClientInput } from "./clients.schema";

export async function getAllClients(userId: string, role: string) {
  if (role === "SUPERADMIN") {
    return prisma.client.findMany({
      include: { weddingProfile: true, _count: { select: { guests: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  return prisma.client.findMany({
    where: { clientUsers: { some: { userId } } },
    include: { weddingProfile: true, _count: { select: { guests: true } } },
    orderBy: { createdAt: "desc" },
  });
}

// Data ringan buat ClientNav (header + tab bar) — dipanggil di layout tiap kali pindah tab,
// jadi sengaja tidak include relasi berat (events/theme/sections/musics/gifts/dll) yang tidak dipakai di situ.
export async function getClientNavInfo(id: string) {
  return prisma.client.findUnique({
    where: { id },
    select: { id: true, name: true, slug: true, status: true, clientType: true },
  });
}

export async function getClientById(id: string) {
  return prisma.client.findUnique({
    where: { id },
    include: {
      weddingProfile: true,
      events: { orderBy: [{ sortOrder: "asc" }, { date: "asc" }, { timeStart: "asc" }] },
      theme: true,
      sections: { orderBy: { sortOrder: "asc" } },
      musics: true,
      gifts: true,
      whatsappTemplate: true,
      _count: {
        select: {
          guests: true,
          wishes: true,
        },
      },
    },
  });
}

export const getClientBySlug = cache(async function getClientBySlug(slug: string) {
  return prisma.client.findUnique({
    where: { slug },
    include: {
      weddingProfile: true,
      events: {
        orderBy: [{ sortOrder: "asc" }, { date: "asc" }, { timeStart: "asc" }],
        include: { menuItems: { orderBy: { sortOrder: "asc" } } },
      },
      galleries: { orderBy: { sortOrder: "asc" } },
      theme: true,
      musics: { where: { isActive: true } },
      sections: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
      gifts: { where: { isActive: true } },
      loveStories: { orderBy: { sortOrder: "asc" } },
      wishes: { where: { isApproved: true }, orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
});

export async function createClient(data: CreateClientInput, userId: string) {
  const client = await prisma.client.create({
    data: {
      name: data.name,
      slug: data.slug,
      status: data.status,
      clientType: data.clientType ?? "WEDDING",
      createdById: userId,
      weddingProfile: { create: {} },
      theme: {
        create: {
          templateSlug: "lucky-envelope",
          primaryColor: "#c4954a",
          secondaryColor: "#f4ece0",
          bgColor: "#faf8f4",
          textColor: "#332820",
          fontHeading: "Cormorant Garamond",
          fontBody: "Jost",
        },
      },
      sections: { create: DEFAULT_SECTIONS },
      whatsappTemplate: { create: { bodyTemplate: DEFAULT_TEMPLATE } },
    },
  });

  await prisma.clientUser.create({
    data: { userId, clientId: client.id },
  });

  await addClientDomain(client.slug);

  return client;
}

export async function updateClient(id: string, data: UpdateClientInput) {
  const existing = await prisma.client.findUnique({ where: { id }, select: { slug: true } });
  const client = await prisma.client.update({ where: { id }, data });

  if (data.slug && existing && data.slug !== existing.slug) {
    await removeClientDomain(existing.slug);
    await addClientDomain(client.slug);
  }

  return client;
}

export async function deleteClient(id: string) {
  const client = await prisma.client.delete({ where: { id } });
  await removeClientDomain(client.slug);
  return client;
}

export async function isSlugTaken(slug: string, excludeId?: string) {
  const client = await prisma.client.findUnique({ where: { slug } });
  if (!client) return false;
  if (excludeId && client.id === excludeId) return false;
  return true;
}

import prisma from "@/lib/prisma";

/**
 * Read layer for delivery / pickup locations. Public getters return only
 * active rows; admin getters return everything for management.
 */

/** Public-facing delivery location (used on the site + booking tarifario). */
export interface DeliveryLocationItem {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  hasFee: boolean;
  deliveryFee: number;
  mapUrl: string | null;
  highlighted: boolean;
  isAirport: boolean;
}

/** Admin row (all states) for the management screen. */
export interface AdminDeliveryLocation {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  hasFee: boolean;
  deliveryFee: number;
  mapUrl: string | null;
  highlighted: boolean;
  isAirport: boolean;
  sortOrder: number;
  isActive: boolean;
}

/** Active locations for the public site, highlighted first. */
export async function getDeliveryLocations(): Promise<DeliveryLocationItem[]> {
  const rows = await prisma.deliveryLocation.findMany({
    where: { isActive: true },
    orderBy: [{ highlighted: "desc" }, { sortOrder: "asc" }],
  });
  return rows.map((d) => ({
    id: d.id,
    name: d.name,
    description: d.description,
    imageUrl: d.imageUrl,
    hasFee: d.hasFee,
    deliveryFee: d.deliveryFee,
    mapUrl: d.mapUrl,
    highlighted: d.highlighted,
    isAirport: d.isAirport,
  }));
}

/** All locations (active + inactive) for the backoffice. */
export async function listDeliveryLocationsAdmin(): Promise<AdminDeliveryLocation[]> {
  const rows = await prisma.deliveryLocation.findMany({ orderBy: { sortOrder: "asc" } });
  return rows.map((d) => ({
    id: d.id,
    name: d.name,
    description: d.description,
    imageUrl: d.imageUrl,
    hasFee: d.hasFee,
    deliveryFee: d.deliveryFee,
    mapUrl: d.mapUrl,
    highlighted: d.highlighted,
    isAirport: d.isAirport,
    sortOrder: d.sortOrder,
    isActive: d.isActive,
  }));
}

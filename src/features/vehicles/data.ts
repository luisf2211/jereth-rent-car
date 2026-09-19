import prisma from "@/lib/prisma";
import type { Vehicle } from "@/types/vehicle";
import type { Vehicle as PrismaVehicle } from "@/generated/prisma/client";

/**
 * Vehicle data access.
 *
 * Reads from PostgreSQL via Prisma. Same function signatures the mock used,
 * now async, so consumers only needed to add `await`.
 */
function toVehicle(row: PrismaVehicle): Vehicle {
  return {
    id: row.id,
    brand: row.brand,
    model: row.model,
    year: row.year,
    category: row.category,
    orSimilar: row.orSimilar,
    transmission: row.transmission,
    fuelType: row.fuelType,
    passengers: row.passengers,
    doors: row.doors,
    dailyPrice: row.dailyPrice,
    imageUrl: row.imageUrl,
    carouselImageUrl: row.carouselImageUrl,
    images: row.images,
    description: row.description,
    features: row.features,
    whatsappMessage: row.whatsappMessage,
    isActive: row.isActive,
  };
}

/**
 * Ordering for the public fleet: most-viewed first, with the newest as a
 * stable tiebreaker so vehicles with no views yet keep a sensible order.
 */
const POPULAR_ORDER = [{ viewCount: "desc" as const }, { createdAt: "asc" as const }];

export async function getVehicles(): Promise<Vehicle[]> {
  const rows = await prisma.vehicle.findMany({
    where: { isActive: true },
    orderBy: POPULAR_ORDER,
  });
  return rows.map(toVehicle);
}

export async function getFeaturedVehicles(limit = 4): Promise<Vehicle[]> {
  const rows = await prisma.vehicle.findMany({
    where: { isActive: true },
    orderBy: POPULAR_ORDER,
    take: limit,
  });
  return rows.map(toVehicle);
}

export async function getVehicleById(id: string): Promise<Vehicle | null> {
  const row = await prisma.vehicle.findUnique({ where: { id } });
  return row ? toVehicle(row) : null;
}

/**
 * Increments a vehicle's detail-page view counter. Best-effort: failures are
 * swallowed so a counter hiccup never breaks the page. Only counts active
 * vehicles.
 */
export async function incrementVehicleViews(id: string): Promise<void> {
  try {
    await prisma.vehicle.updateMany({
      where: { id, isActive: true },
      data: { viewCount: { increment: 1 } },
    });
  } catch (error) {
    console.error("incrementVehicleViews failed:", error);
  }
}

/** Active vehicles similar to the given one (same category first, excludes it). */
export async function getSimilarVehicles(vehicle: Vehicle, limit = 3): Promise<Vehicle[]> {
  const sameCategory = await prisma.vehicle.findMany({
    where: { isActive: true, id: { not: vehicle.id }, category: vehicle.category },
    orderBy: { createdAt: "asc" },
    take: limit,
  });
  let rows = sameCategory;
  if (rows.length < limit) {
    const fill = await prisma.vehicle.findMany({
      where: { isActive: true, id: { not: vehicle.id }, category: { not: vehicle.category } },
      orderBy: { createdAt: "asc" },
      take: limit - rows.length,
    });
    rows = [...rows, ...fill];
  }
  return rows.map(toVehicle);
}

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
    transmission: row.transmission,
    passengers: row.passengers,
    dailyPrice: row.dailyPrice,
    imageUrl: row.imageUrl,
    isActive: row.isActive,
  };
}

export async function getVehicles(): Promise<Vehicle[]> {
  const rows = await prisma.vehicle.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });
  return rows.map(toVehicle);
}

export async function getFeaturedVehicles(limit = 4): Promise<Vehicle[]> {
  const rows = await prisma.vehicle.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    take: limit,
  });
  return rows.map(toVehicle);
}

export async function getVehicleById(id: string): Promise<Vehicle | null> {
  const row = await prisma.vehicle.findUnique({ where: { id } });
  return row ? toVehicle(row) : null;
}

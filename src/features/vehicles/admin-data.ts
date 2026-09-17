import prisma from "@/lib/prisma";
import type { Transmission } from "@/types/vehicle";

/**
 * Admin view model for a vehicle row (includes inactive ones).
 */
export interface VehicleAdminItem {
  id: string;
  brand: string;
  model: string;
  year: number;
  transmission: Transmission;
  passengers: number;
  dailyPrice: number;
  imageUrl: string;
  isActive: boolean;
}

/** All vehicles, active and inactive, newest first. */
export async function listAllVehicles(): Promise<VehicleAdminItem[]> {
  const rows = await prisma.vehicle.findMany({ orderBy: { createdAt: "desc" } });
  return rows.map((v) => ({
    id: v.id,
    brand: v.brand,
    model: v.model,
    year: v.year,
    transmission: v.transmission,
    passengers: v.passengers,
    dailyPrice: v.dailyPrice,
    imageUrl: v.imageUrl,
    isActive: v.isActive,
  }));
}

/** Single vehicle for the edit form (any status). */
export async function getVehicleForAdmin(id: string): Promise<VehicleAdminItem | null> {
  const v = await prisma.vehicle.findUnique({ where: { id } });
  if (!v) return null;
  return {
    id: v.id,
    brand: v.brand,
    model: v.model,
    year: v.year,
    transmission: v.transmission,
    passengers: v.passengers,
    dailyPrice: v.dailyPrice,
    imageUrl: v.imageUrl,
    isActive: v.isActive,
  };
}

export async function countVehicles(): Promise<number> {
  return prisma.vehicle.count();
}

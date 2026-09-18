import prisma from "@/lib/prisma";
import type { Transmission, VehicleCategory } from "@/types/vehicle";

/**
 * Admin view model for a vehicle row (includes inactive ones).
 */
export interface VehicleAdminItem {
  id: string;
  brand: string;
  model: string;
  year: number;
  category: VehicleCategory;
  orSimilar: boolean;
  transmission: Transmission;
  passengers: number;
  dailyPrice: number;
  imageUrl: string;
  images: string[];
  description: string | null;
  features: string[];
  whatsappMessage: string | null;
  isActive: boolean;
}

type VehicleRow = {
  id: string;
  brand: string;
  model: string;
  year: number;
  category: VehicleCategory;
  orSimilar: boolean;
  transmission: Transmission;
  passengers: number;
  dailyPrice: number;
  imageUrl: string;
  images: string[];
  description: string | null;
  features: string[];
  whatsappMessage: string | null;
  isActive: boolean;
};

function toItem(v: VehicleRow): VehicleAdminItem {
  return {
    id: v.id,
    brand: v.brand,
    model: v.model,
    year: v.year,
    category: v.category,
    orSimilar: v.orSimilar,
    transmission: v.transmission,
    passengers: v.passengers,
    dailyPrice: v.dailyPrice,
    imageUrl: v.imageUrl,
    images: v.images,
    description: v.description,
    features: v.features,
    whatsappMessage: v.whatsappMessage,
    isActive: v.isActive,
  };
}

/** All vehicles, active and inactive, newest first. */
export async function listAllVehicles(): Promise<VehicleAdminItem[]> {
  const rows = await prisma.vehicle.findMany({ orderBy: { createdAt: "desc" } });
  return rows.map(toItem);
}

/** Single vehicle for the edit form (any status). */
export async function getVehicleForAdmin(id: string): Promise<VehicleAdminItem | null> {
  const v = await prisma.vehicle.findUnique({ where: { id } });
  if (!v) return null;
  return toItem(v);
}

export async function countVehicles(): Promise<number> {
  return prisma.vehicle.count();
}

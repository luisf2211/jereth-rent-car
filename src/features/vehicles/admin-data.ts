import prisma from "@/lib/prisma";
import type { Transmission, FuelType, VehicleCategory } from "@/types/vehicle";

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
  fuelType: FuelType;
  passengers: number;
  doors: number;
  dailyPrice: number;
  imageUrl: string;
  carouselImageUrl: string | null;
  images: string[];
  documentImageUrl: string | null;
  /** Per-photo framing data. Prisma returns Json as `unknown`. */
  imageFits: unknown;
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
  fuelType: FuelType;
  passengers: number;
  doors: number;
  dailyPrice: number;
  imageUrl: string;
  carouselImageUrl: string | null;
  images: string[];
  documentImageUrl: string | null;
  imageFits: unknown;
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
    fuelType: v.fuelType,
    passengers: v.passengers,
    doors: v.doors,
    dailyPrice: v.dailyPrice,
    imageUrl: v.imageUrl,
    carouselImageUrl: v.carouselImageUrl,
    images: v.images,
    documentImageUrl: v.documentImageUrl,
    imageFits: v.imageFits,
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

/** Distinct amenities used across all vehicles (for the searchable picker). */
export async function listUsedFeatures(): Promise<string[]> {
  const rows = await prisma.vehicle.findMany({ select: { features: true } });
  const seen = new Set<string>();
  const out: string[] = [];
  for (const r of rows) {
    for (const f of r.features) {
      const key = f.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(f.trim());
    }
  }
  return out;
}

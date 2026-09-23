import { cache } from "react";
import prisma from "@/lib/prisma";
import { transmissionLabel, categoryLabel } from "@/features/vehicles/format";

/**
 * Lightweight vehicle list used ONLY by the template builder preview, so the
 * admin can preview the layout with real data from any vehicle. The
 * "Foto del vehículo" element uses documentImageUrl and falls back to imageUrl
 * — the same rule the confirmation PDF will use. This does not touch the
 * reservation flow.
 */
export interface PreviewVehicle {
  id: string;
  title: string; // "Marca Modelo Año"
  /** documentImageUrl || imageUrl (the image documents should use). */
  imageUrl: string;
  specs: string[];
  dailyPrice: number;
}

export const listPreviewVehicles = cache(async (): Promise<PreviewVehicle[]> => {
  const rows = await prisma.vehicle.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      brand: true,
      model: true,
      year: true,
      category: true,
      transmission: true,
      passengers: true,
      features: true,
      imageUrl: true,
      documentImageUrl: true,
      dailyPrice: true,
    },
  });
  return rows.map((v) => {
    const specs: string[] = [
      transmissionLabel(v.transmission as "automatic" | "manual"),
      `${v.passengers} Pasajeros`,
      categoryLabel(v.category as "economico" | "compacto" | "sedan" | "suv" | "suv_grande" | "premium"),
    ];
    const ac = v.features.find((f) => /aire/i.test(f));
    if (ac) specs.push(ac);
    return {
      id: v.id,
      title: `${v.brand} ${v.model} ${v.year}`,
      // Prefer the dedicated documents image; fall back to the catalog cover.
      imageUrl: v.documentImageUrl || v.imageUrl,
      specs,
      dailyPrice: v.dailyPrice,
    };
  });
});

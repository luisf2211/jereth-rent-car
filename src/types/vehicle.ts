/**
 * Vehicle domain type.
 *
 * Mirrors the future `Vehicle` table. The public catalog currently reads
 * from a mock source (features/vehicles/mock.ts) but consumers only depend
 * on this type, so swapping to Prisma later is transparent.
 */
export type Transmission = "automatic" | "manual";

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  transmission: Transmission;
  passengers: number;
  dailyPrice: number; // in USD
  imageUrl: string;
  isActive: boolean;
}

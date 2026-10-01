/**
 * Vehicle domain type.
 *
 * Mirrors the future `Vehicle` table. The public catalog currently reads
 * from a mock source (features/vehicles/mock.ts) but consumers only depend
 * on this type, so swapping to Prisma later is transparent.
 */
export type Transmission = "automatic" | "manual";

export type FuelType = "gasolina" | "diesel" | "hibrido" | "electrico";

export type VehicleCategory =
  | "economico"
  | "compacto"
  | "sedan"
  | "suv"
  | "suv_grande"
  | "premium";

/**
 * Framing data for a single photo.
 * x/y = focal-point as percentages (0–100). zoom = scale multiplier (1 = no zoom).
 * Default when absent: x:50, y:50, zoom:1 (centered, no zoom).
 */
export interface ImageFit {
  x: number;
  y: number;
  zoom: number;
}

/**
 * Per-photo framing map. Keys: "cover", "carousel", or a photo URL.
 */
export type ImageFits = Record<string, ImageFit>;

export interface Vehicle {
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
  dailyPrice: number; // in USD
  imageUrl: string; // cover
  carouselImageUrl: string | null; // hero carousel (falls back to cover)
  images: string[]; // gallery
  /** Dedicated image for documents (confirmation PDF). Falls back to imageUrl. */
  documentImageUrl: string | null;
  /** Per-photo framing. null/undefined means no custom framing has been saved. */
  imageFits: ImageFits | null;
  /** SOURCE (Spanish) description. */
  description: string | null;
  /** SOURCE (Spanish) amenities/features list. */
  features: string[];
  /**
   * English description. null/empty = not translated yet; public rendering
   * falls back to the Spanish `description` (see resolveLocalizedVehicle).
   */
  descriptionEn: string | null;
  /** English amenities/features list. Empty = not translated yet (fallback to `features`). */
  featuresEn: string[];
  whatsappMessage: string | null;
  isActive: boolean;
}

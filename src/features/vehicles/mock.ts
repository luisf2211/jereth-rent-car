import type { Vehicle } from "@/types/vehicle";

/**
 * Mock vehicle catalog for Phase 1.
 *
 * Kept separate from any component so the UI depends only on the `Vehicle`
 * type. In Phase 2 these accessors are replaced by Prisma queries with the
 * same signatures.
 *
 * Images use Unsplash source URLs (no key required).
 */
const VEHICLES: Vehicle[] = [
  {
    id: "toyota-corolla-2023",
    brand: "Toyota",
    model: "Corolla",
    year: 2023,
    transmission: "automatic",
    passengers: 5,
    dailyPrice: 35,
    imageUrl:
      "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1200&q=80",
    isActive: true,
  },
  {
    id: "honda-crv-2022",
    brand: "Honda",
    model: "CR-V",
    year: 2022,
    transmission: "automatic",
    passengers: 5,
    dailyPrice: 52,
    imageUrl:
      "https://images.unsplash.com/photo-1568844293986-8d0400bd4745?auto=format&fit=crop&w=1200&q=80",
    isActive: true,
  },
  {
    id: "hyundai-tucson-2023",
    brand: "Hyundai",
    model: "Tucson",
    year: 2023,
    transmission: "automatic",
    passengers: 5,
    dailyPrice: 48,
    imageUrl:
      "https://images.unsplash.com/photo-1633867751309-1e2e57b9c26f?auto=format&fit=crop&w=1200&q=80",
    isActive: true,
  },
  {
    id: "kia-rio-2022",
    brand: "Kia",
    model: "Rio",
    year: 2022,
    transmission: "manual",
    passengers: 5,
    dailyPrice: 28,
    imageUrl:
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
    isActive: true,
  },
  {
    id: "toyota-rav4-2023",
    brand: "Toyota",
    model: "RAV4",
    year: 2023,
    transmission: "automatic",
    passengers: 5,
    dailyPrice: 58,
    imageUrl:
      "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80",
    isActive: true,
  },
  {
    id: "nissan-versa-2022",
    brand: "Nissan",
    model: "Versa",
    year: 2022,
    transmission: "automatic",
    passengers: 5,
    dailyPrice: 30,
    imageUrl:
      "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1200&q=80",
    isActive: true,
  },
];

export function getVehicles(): Vehicle[] {
  return VEHICLES.filter((v) => v.isActive);
}

export function getFeaturedVehicles(limit = 4): Vehicle[] {
  return getVehicles().slice(0, limit);
}

export function getVehicleById(id: string): Vehicle | undefined {
  return VEHICLES.find((v) => v.id === id);
}

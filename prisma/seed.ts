import "dotenv/config";
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const PERMISSION_KEYS = [
  "users.view",
  "users.create",
  "users.edit",
  "users.disable",
  "roles.view",
  "roles.manage",
  "branding.view",
  "branding.edit",
  "vehicles.view",
  "vehicles.create",
  "vehicles.edit",
  "vehicles.disable",
  "content.view",
  "content.edit",
] as const;

const VEHICLES = [
  { id: "toyota-corolla-2023", brand: "Toyota", model: "Corolla", year: 2023, category: "sedan" as const, transmission: "automatic" as const, passengers: 5, dailyPrice: 35, imageUrl: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1200&q=80" },
  { id: "honda-crv-2022", brand: "Honda", model: "CR-V", year: 2022, category: "suv" as const, transmission: "automatic" as const, passengers: 5, dailyPrice: 52, imageUrl: "https://images.unsplash.com/photo-1568844293986-8d0400bd4745?auto=format&fit=crop&w=1200&q=80" },
  { id: "hyundai-tucson-2023", brand: "Hyundai", model: "Tucson", year: 2023, category: "suv" as const, transmission: "automatic" as const, passengers: 5, dailyPrice: 48, imageUrl: "https://images.unsplash.com/photo-1633867751309-1e2e57b9c26f?auto=format&fit=crop&w=1200&q=80" },
  { id: "kia-rio-2022", brand: "Kia", model: "Rio", year: 2022, category: "economico" as const, transmission: "manual" as const, passengers: 5, dailyPrice: 28, imageUrl: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80" },
  { id: "toyota-rav4-2023", brand: "Toyota", model: "RAV4", year: 2023, category: "suv" as const, transmission: "automatic" as const, passengers: 5, dailyPrice: 58, imageUrl: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80" },
  { id: "nissan-versa-2022", brand: "Nissan", model: "Versa", year: 2022, category: "compacto" as const, transmission: "automatic" as const, passengers: 5, dailyPrice: 30, imageUrl: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1200&q=80" },
];

async function main() {
  console.log("🌱 Seeding database...");

  // Permissions
  await Promise.all(
    PERMISSION_KEYS.map((key) =>
      prisma.permission.upsert({ where: { key }, update: {}, create: { key } })
    )
  );
  const permissions = await prisma.permission.findMany();
  console.log(`✅ ${permissions.length} permissions`);

  // Admin role with all permissions
  const adminRole = await prisma.role.upsert({
    where: { name: "Administrator" },
    update: {},
    create: { name: "Administrator", description: "Acceso total al backoffice" },
  });

  await Promise.all(
    permissions.map((permission) =>
      prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: adminRole.id, permissionId: permission.id } },
        update: {},
        create: { roleId: adminRole.id, permissionId: permission.id },
      })
    )
  );
  console.log(`✅ Role "${adminRole.name}" with all permissions`);

  // Administrator user
  const passwordHash = await bcrypt.hash("Admin123!", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@drivenow.com" },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@drivenow.com",
      passwordHash,
      roleId: adminRole.id,
      isActive: true,
    },
  });
  console.log(`✅ Admin user: ${admin.email} (password: Admin123!)`);

  // Company settings (single row). Placeholders only — real contact info is
  // filled in by the owner from the backoffice (we never invent it).
  const existingSettings = await prisma.companySettings.findFirst();
  if (!existingSettings) {
    await prisma.companySettings.create({
      data: {
        companyName: "Jereth Rent Car",
        logoUrl: null,
        whatsappNumber: "",
        primaryColor: null,
        contactEmail: "",
      },
    });
    console.log("✅ CompanySettings created");
  } else if (existingSettings.companyName === "DriveNow Rent Car") {
    // Migrate the old placeholder name to Jereth without touching other fields.
    await prisma.companySettings.update({
      where: { id: existingSettings.id },
      data: { companyName: "Jereth Rent Car" },
    });
    console.log("✅ CompanySettings renamed to Jereth Rent Car");
  } else {
    console.log("• CompanySettings already present, skipping");
  }

  // Vehicles
  await Promise.all(
    VEHICLES.map((v) =>
      prisma.vehicle.upsert({ where: { id: v.id }, update: v, create: v })
    )
  );
  console.log(`✅ ${VEHICLES.length} vehicles`);

  console.log("🎉 Seed complete.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

/**
 * DEMO content seed — sample data so every public section renders while you
 * evaluate the design. Reviews here are EXAMPLES; replace them with real
 * Google reviews before going live. Run: npx tsx prisma/seed-demo-content.ts
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const REQUIREMENTS = [
  "Licencia de conducir vigente",
  "Cédula o pasaporte válido",
  "Edad mínima de 21 años",
  "Tarjeta de crédito o método de pago acordado",
  "Depósito o garantía según el vehículo",
];

const DELIVERY_LOCATIONS = [
  {
    name: "Aeropuerto Internacional Las Américas (SDQ)",
    description:
      "Coordinamos la entrega y recogida de tu vehículo directamente en el aeropuerto al llegar tu vuelo. Escríbenos tu número de vuelo y hora estimada.",
    highlighted: true,
    sortOrder: 0,
  },
  {
    name: "Santo Domingo",
    description:
      "Entrega en tu hotel, residencia o punto acordado dentro de Santo Domingo y alrededores.",
    highlighted: false,
    sortOrder: 1,
  },
];

const FAQS = [
  {
    question: "¿Puedo recibir el vehículo en el Aeropuerto Las Américas (SDQ)?",
    answer:
      "Sí. Coordinamos la entrega y devolución en el aeropuerto. Compártenos tu número de vuelo y hora de llegada por WhatsApp para tenerlo listo.",
  },
  {
    question: "¿Cuál es la edad mínima para rentar?",
    answer: "La edad mínima es de 21 años, presentando licencia de conducir vigente.",
  },
  {
    question: "¿Qué documentos necesito?",
    answer: "Licencia de conducir vigente y cédula o pasaporte. Para turistas, el pasaporte y la licencia de tu país.",
  },
  {
    question: "¿Se requiere depósito?",
    answer:
      "Sí, se solicita un depósito o garantía que varía según el vehículo. Te confirmamos el monto exacto al momento de la reserva.",
  },
  {
    question: "¿Qué pasa si mi vuelo se retrasa?",
    answer:
      "No te preocupes. Damos seguimiento a tu vuelo y ajustamos la hora de entrega sin costo adicional por retrasos razonables.",
  },
  {
    question: "¿Cómo reservo?",
    answer:
      "Escríbenos por WhatsApp con las fechas y el vehículo que te interesa. Confirmamos disponibilidad y coordinamos la entrega.",
  },
];

// EXAMPLE reviews — replace with real ones before publishing.
const REVIEWS = [
  {
    authorName: "María Fernández",
    rating: 5,
    comment: "Excelente servicio, el carro estaba impecable y me lo entregaron en el aeropuerto sin problemas. Muy recomendados.",
    source: "google",
    sortOrder: 0,
  },
  {
    authorName: "John Carter",
    rating: 5,
    comment: "Great experience renting for my trip to Santo Domingo. Easy WhatsApp booking and airport pickup. Will use again.",
    source: "google",
    sortOrder: 1,
  },
  {
    authorName: "Luis Peguero",
    rating: 4,
    comment: "Buen precio y atención rápida por WhatsApp. El proceso fue sencillo y sin sorpresas.",
    source: "google",
    sortOrder: 2,
  },
];

async function main() {
  console.log("🌱 Seeding DEMO content...");

  // Reset the content tables so re-runs stay clean (demo only).
  await prisma.requirement.deleteMany();
  await prisma.deliveryLocation.deleteMany();
  await prisma.faqItem.deleteMany();
  await prisma.review.deleteMany();

  await prisma.requirement.createMany({
    data: REQUIREMENTS.map((text, i) => ({ text, sortOrder: i, isActive: true })),
  });
  await prisma.deliveryLocation.createMany({ data: DELIVERY_LOCATIONS });
  await prisma.faqItem.createMany({
    data: FAQS.map((f, i) => ({ ...f, sortOrder: i, isActive: true })),
  });
  await prisma.review.createMany({
    data: REVIEWS.map((r) => ({ ...r, reviewDate: new Date(), isActive: true })),
  });

  // Fill in branding placeholders with demo contact info + about text.
  const settings = await prisma.companySettings.findFirst({ orderBy: { createdAt: "asc" } });
  if (settings) {
    await prisma.companySettings.update({
      where: { id: settings.id },
      data: {
        contactEmail: settings.contactEmail || "info@jerethrentcar.com",
        phone: settings.phone || "+1 829 240 3672",
        instagramUrl: settings.instagramUrl || "https://instagram.com/jerethrentcar",
        facebookUrl: settings.facebookUrl || "https://facebook.com/jerethrentcar",
        aboutText:
          settings.aboutText ||
          "En Jereth Rent Car ayudamos a locales y turistas a moverse por Santo Domingo con vehículos confiables y una atención cercana. Reservas simples por WhatsApp, entrega en el Aeropuerto Las Américas (SDQ) y precios claros, sin letra pequeña.",
      },
    });
  }

  const counts = {
    requirements: await prisma.requirement.count(),
    deliveryLocations: await prisma.deliveryLocation.count(),
    faqs: await prisma.faqItem.count(),
    reviews: await prisma.review.count(),
  };
  console.log("✅ Demo content:", counts);
  console.log("⚠️  Las reseñas son de EJEMPLO — reemplázalas por reales antes de publicar.");
}

main()
  .catch((e) => {
    console.error("❌", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

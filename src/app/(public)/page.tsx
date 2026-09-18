import HeroSection from "@/components/public/HeroSection";
import FeaturedVehiclesSection from "@/components/public/FeaturedVehiclesSection";
import HowItWorksSection from "@/components/public/HowItWorksSection";
import DeliveryLocationsSection from "@/components/public/DeliveryLocationsSection";
import RequirementsSection from "@/components/public/RequirementsSection";
import ReviewsSection from "@/components/public/ReviewsSection";
import AboutSection from "@/components/public/AboutSection";
import FaqSection from "@/components/public/FaqSection";
import ContactSection from "@/components/public/ContactSection";

// Reads live data from the DB (vehicles, content), so render per request
// instead of prerendering at build time.
export const dynamic = "force-dynamic";

/**
 * Home. Leaner, Turo-like flow: vehicle carousel hero → flota → cómo funciona
 * → entrega → requisitos → reseñas → nosotros → FAQ → contacto. WhatsApp lives
 * in the hero carousel, the vehicle cards and the floating button — not
 * repeated as standalone CTA bands.
 */
export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturedVehiclesSection />
      <HowItWorksSection />
      <DeliveryLocationsSection />
      <RequirementsSection />
      <ReviewsSection />
      <AboutSection />
      <FaqSection />
      <ContactSection />
    </>
  );
}

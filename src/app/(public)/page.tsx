import HeroSection from "@/components/public/HeroSection";
import BenefitsSection from "@/components/public/BenefitsSection";
import FeaturedVehiclesSection from "@/components/public/FeaturedVehiclesSection";
import HowItWorksSection from "@/components/public/HowItWorksSection";
import RequirementsSection from "@/components/public/RequirementsSection";
import DeliveryLocationsSection from "@/components/public/DeliveryLocationsSection";
import ReviewsSection from "@/components/public/ReviewsSection";
import FaqSection from "@/components/public/FaqSection";
import AboutSection from "@/components/public/AboutSection";
import ContactSection from "@/components/public/ContactSection";
import FinalCtaSection from "@/components/public/FinalCtaSection";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <BenefitsSection />
      <FeaturedVehiclesSection />
      <HowItWorksSection />
      <DeliveryLocationsSection />
      <RequirementsSection />
      <ReviewsSection />
      <AboutSection />
      <FaqSection />
      <ContactSection />
      <FinalCtaSection />
    </>
  );
}

import Navigation from "@/components/navigation";
import HeroSection from "@/components/hero-section";
import DiscoverySection from "@/components/discovery-section";
import HowItWorksSection from "@/components/how-it-works-section";
import SuccessStoriesSection from "@/components/success-stories-section";
import CommunitySection from "@/components/community-section";
import Footer from "@/components/footer";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <HeroSection />
      <DiscoverySection />
      <HowItWorksSection />
      <SuccessStoriesSection />
      <CommunitySection />
      <Footer />
    </div>
  );
}

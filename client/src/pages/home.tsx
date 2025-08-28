import { useState, useEffect } from "react";
import Navigation from "@/components/navigation";
import HeroSection from "@/components/hero-section";
import DiscoverySection from "@/components/discovery-section";
import HowItWorksSection from "@/components/how-it-works-section";
import SuccessStoriesSection from "@/components/success-stories-section";
import CommunitySection from "@/components/community-section";
import Footer from "@/components/footer";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const checkAuthStatus = () => {
      const authStatus = localStorage.getItem('isAuthenticated') === 'true';
      const email = localStorage.getItem('userEmail') || '';
      setIsAuthenticated(authStatus);
      setUserEmail(email);
      
      if (authStatus) {
        console.log('🏠 Home page loaded for authenticated user:', email);
      }
    };

    checkAuthStatus();
    const interval = setInterval(checkAuthStatus, 500);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen">
      <Navigation />
      
      {/* Welcome message for authenticated users */}
      {isAuthenticated && (
        <div className="bg-green-50 border border-green-200 p-4 text-center">
          <p className="text-green-800">
            🎉 Welcome back, <strong>{userEmail}</strong>! You are successfully logged in.
          </p>
        </div>
      )}
      
      <HeroSection />
      <DiscoverySection />
      <HowItWorksSection />
      <SuccessStoriesSection />
      <CommunitySection />
      <Footer />
    </div>
  );
}

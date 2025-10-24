import { useState, useEffect } from "react";
import Navigation from "@/components/navigation";
import HeroSection from "@/components/hero-section";
import DiscoverySection from "@/components/discovery-section";
import HowItWorksSection from "@/components/how-it-works-section";
import SuccessStoriesSection from "@/components/success-stories-section";
import CommunitySection from "@/components/community-section";
import Footer from "@/components/footer";
import StudentDashboard from "@/components/dashboard/student-dashboard";
import TeacherDashboard from "@/components/dashboard/teacher-dashboard";
import AdminDashboard from "@/components/dashboard/admin-dashboard";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const checkAuthStatus = () => {
      const authStatus = localStorage.getItem('isAuthenticated') === 'true';
      const email = localStorage.getItem('userEmail') || '';
      const role = localStorage.getItem('userRole') || 'student';
      setIsAuthenticated(authStatus);
      setUserEmail(email);
      setUserRole(role);
    };

    // Only check once on component mount
    checkAuthStatus();
    
    // Listen for storage changes instead of polling
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'isAuthenticated' || e.key === 'userEmail' || e.key === 'userRole') {
        checkAuthStatus();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // If user is authenticated, show role-based dashboard
  // Note: Each dashboard component has its own Navigation, so we don't render it here
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Role-based Dashboard */}
        {userRole === 'student' && <StudentDashboard />}
        {userRole === 'mentor' && <TeacherDashboard />}
        {userRole === 'admin' && <AdminDashboard />}
        
        {/* Fallback for unknown roles */}
        {!['student', 'mentor', 'admin'].includes(userRole) && (
          <>
            <Navigation />
            <div className="p-6 text-center">
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <p className="text-yellow-800">
                  Unknown user role: <strong>{userRole}</strong>
                </p>
                <p className="text-sm text-yellow-600 mt-2">
                  Please contact support or try logging in again.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // If user is not authenticated, show landing page
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

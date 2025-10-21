import { GraduationCap } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

interface UiConfigResponse {
  footerLinks: {
    studentCommunity: boolean;
    mentorCommunity: boolean;
    successStories: boolean;
    achievementBadges: boolean;
    discussionForums: boolean;
    projectShowcase: boolean;
    communityEvents: boolean;
    teacherResources: boolean;
    contactUs: boolean;
  };
  showHelpCenter: boolean;
  abusiveLanguageMonitoring: boolean;
  studentDashboardLinks: {
    browseCourses: boolean;
  };
  teacherDashboardLinks: {
    createCourse: boolean;
    courseDetails: boolean;
  };
}

export default function Footer() {
  const { data: uiConfig } = useQuery<UiConfigResponse>({
    queryKey: ['/api/admin/ui-config'],
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const footerLinks = uiConfig?.footerLinks || {
    studentCommunity: true,
    mentorCommunity: true,
    successStories: true,
    achievementBadges: true,
    discussionForums: true,
    projectShowcase: true,
    communityEvents: true,
    teacherResources: true,
    contactUs: true,
  };

  return (
    <footer className="bg-foreground text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="mb-4 flex items-center space-x-2" data-testid="text-footer-logo">
              <GraduationCap className="h-8 w-8 text-white" />
              <span className="text-xl font-bold text-white">
                TechLearnOrbit
              </span>
            </div>
            <p className="text-white/80 mb-6" data-testid="text-footer-description">
              Connecting you with passionate mentors across world.
            </p>
            <div className="flex space-x-4">
              <a 
                href="https://facebook.com" 
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                data-testid="link-facebook"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fab fa-facebook-f"></i>
              </a>
              <a 
                href="https://twitter.com" 
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                data-testid="link-twitter"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fab fa-twitter"></i>
              </a>
              <a 
                href="https://instagram.com" 
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                data-testid="link-instagram"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fab fa-instagram"></i>
              </a>
              <a 
                href="https://linkedin.com" 
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                data-testid="link-linkedin"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fab fa-linkedin-in"></i>
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-4" data-testid="text-students-section">For Students</h3>
            <ul className="space-y-2 text-white/80">
              <li>
                <Link href="/#discover" className="hover:text-white transition-colors" data-testid="link-find-mentor">
                  Find a Mentor
                </Link>
              </li>
              <li>
                <Link href="/courses" className="hover:text-white transition-colors" data-testid="link-browse-courses">
                  Browse Courses
                </Link>
              </li>
              {footerLinks.studentCommunity && (
                <li>
                  <Link href="/student-community" className="hover:text-white transition-colors" data-testid="link-student-community">
                    Student Community
                  </Link>
                </li>
              )}
              {footerLinks.achievementBadges && (
                <li>
                  <Link href="/achievement-badges" className="hover:text-white transition-colors" data-testid="link-achievement-badges">
                    Achievement Badges
                  </Link>
                </li>
              )}
              {footerLinks.discussionForums && (
                <li>
                  <Link href="/forums" className="hover:text-white transition-colors" data-testid="link-forums">
                    Discussion Forums
                  </Link>
                </li>
              )}
              {footerLinks.projectShowcase && (
                <li>
                  <Link href="/projects" className="hover:text-white transition-colors" data-testid="link-projects">
                    Project Showcase
                  </Link>
                </li>
              )}
              {footerLinks.communityEvents && (
                <li>
                  <Link href="/events" className="hover:text-white transition-colors" data-testid="link-events">
                    Community Events
                  </Link>
                </li>
              )}
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-4" data-testid="text-mentors-section">For Mentors</h3>
            <ul className="space-y-2 text-white/80">
              <li>
                <Link href="/become-mentor" className="hover:text-white transition-colors" data-testid="link-become-mentor">
                  Become a Mentor
                </Link>
              </li>
              {footerLinks.teacherResources && (
                <li>
                  <Link href="/teacher-resources" className="hover:text-white transition-colors" data-testid="link-teacher-resources">
                    Teacher Resources
                  </Link>
                </li>
              )}
              {footerLinks.mentorCommunity && (
                <li>
                  <Link href="/mentor-community" className="hover:text-white transition-colors" data-testid="link-mentor-community">
                    Mentor Community
                  </Link>
                </li>
              )}
              {footerLinks.successStories && (
                <li>
                  <Link href="/success-stories" className="hover:text-white transition-colors" data-testid="link-success-stories">
                    Success Stories
                  </Link>
                </li>
              )}
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-4" data-testid="text-support-section">Support</h3>
            <ul className="space-y-2 text-white/80">
              <li>
                <Link href="/safety-guidelines" className="hover:text-white transition-colors" data-testid="link-safety-guidelines">
                  Safety Guidelines
                </Link>
              </li>
              {footerLinks.contactUs && (
                <li>
                  <Link href="/help" className="hover:text-white transition-colors" data-testid="link-contact-us">
                    Contact Us
                  </Link>
                </li>
              )}
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors" data-testid="link-privacy-policy">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/cancellation-policy" className="hover:text-white transition-colors" data-testid="link-cancellation-policy">
                  Cancellation & Refund
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/20 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-white/60 mb-4 md:mb-0" data-testid="text-copyright">
            © 2024 Techlearnorbit. All rights reserved.
          </p>
          <div className="flex space-x-6 text-white/60 text-sm items-center">
            <Link href="/terms" className="hover:text-white transition-colors" data-testid="link-terms">
              Terms of Service
            </Link>
            <Link href="/privacy" className="hover:text-white transition-colors" data-testid="link-privacy">
              Privacy Policy
            </Link>
            <Link href="/cancellation-policy" className="hover:text-white transition-colors" data-testid="link-cancellation">
              Cancellation & Refund
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

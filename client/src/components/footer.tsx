import { Code } from "lucide-react";
import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-foreground text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center text-2xl font-bold text-accent mb-4" data-testid="text-footer-logo">
              <Code className="mr-2" size={28} />
              CodeConnect
            </div>
            <p className="text-white/80 mb-6" data-testid="text-footer-description">
              Connecting young minds with passionate coding mentors to build the future, one line of code at a time.
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
              <li>
                <Link href="/#community" className="hover:text-white transition-colors" data-testid="link-student-community">
                  Student Community
                </Link>
              </li>
              <li>
                <button 
                  onClick={() => {
                    console.log('Achievement Badges clicked');
                    alert('Achievement system coming soon! Earn badges as you learn.');
                  }}
                  className="hover:text-white transition-colors text-left" 
                  data-testid="link-achievement-badges"
                >
                  Achievement Badges
                </button>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-4" data-testid="text-mentors-section">For Mentors</h3>
            <ul className="space-y-2 text-white/80">
              <li>
                <button 
                  onClick={() => {
                    console.log('Become a Mentor clicked');
                    alert('Mentor registration coming soon! Share your coding passion.');
                  }}
                  className="hover:text-white transition-colors text-left" 
                  data-testid="link-become-mentor"
                >
                  Become a Mentor
                </button>
              </li>
              <li>
                <button 
                  onClick={() => {
                    console.log('Teacher Resources clicked');
                    alert('Teacher resources coming soon! Helpful materials for educators.');
                  }}
                  className="hover:text-white transition-colors text-left" 
                  data-testid="link-teacher-resources"
                >
                  Teacher Resources
                </button>
              </li>
              <li>
                <Link href="/#community" className="hover:text-white transition-colors" data-testid="link-mentor-community">
                  Mentor Community
                </Link>
              </li>
              <li>
                <Link href="/#success-stories" className="hover:text-white transition-colors" data-testid="link-success-stories">
                  Success Stories
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-4" data-testid="text-support-section">Support</h3>
            <ul className="space-y-2 text-white/80">
              <li>
                <Link href="/help" className="hover:text-white transition-colors" data-testid="link-help-center">
                  Help Center
                </Link>
              </li>
              <li>
                <button 
                  onClick={() => {
                    console.log('Safety Guidelines clicked');
                    alert('Safety guidelines coming soon! Child safety is our top priority.');
                  }}
                  className="hover:text-white transition-colors text-left" 
                  data-testid="link-safety-guidelines"
                >
                  Safety Guidelines
                </button>
              </li>
              <li>
                <Link href="/help" className="hover:text-white transition-colors" data-testid="link-contact-us">
                  Contact Us
                </Link>
              </li>
              <li>
                <button 
                  onClick={() => {
                    console.log('Privacy Policy clicked');
                    alert('Privacy policy coming soon! We protect your data.');
                  }}
                  className="hover:text-white transition-colors text-left" 
                  data-testid="link-privacy-policy"
                >
                  Privacy Policy
                </button>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/20 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-white/60 mb-4 md:mb-0" data-testid="text-copyright">
            © 2024 CodeConnect. All rights reserved.
          </p>
          <div className="flex space-x-6 text-white/60 text-sm">
            <button 
              onClick={() => {
                console.log('Terms of Service clicked');
                alert('Terms of service coming soon!');
              }}
              className="hover:text-white transition-colors" 
              data-testid="link-terms"
            >
              Terms of Service
            </button>
            <button 
              onClick={() => {
                console.log('Privacy Policy clicked');
                alert('Privacy policy coming soon!');
              }}
              className="hover:text-white transition-colors" 
              data-testid="link-privacy"
            >
              Privacy Policy
            </button>
            <button 
              onClick={() => {
                console.log('Cookie Policy clicked');
                alert('Cookie policy coming soon!');
              }}
              className="hover:text-white transition-colors" 
              data-testid="link-cookies"
            >
              Cookie Policy
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

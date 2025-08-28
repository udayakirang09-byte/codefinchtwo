import { Users, Presentation } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CommunitySection() {
  return (
    <section id="community" className="py-20 gradient-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6" data-testid="text-community-title">
          Join Our Growing <span className="text-accent">Community</span>
        </h2>
        <p className="text-xl text-white/90 mb-12 max-w-3xl mx-auto" data-testid="text-community-description">
          Connect with other young coders, share projects, and celebrate achievements together.
        </p>
        
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="glassmorphism rounded-2xl p-8 text-white" data-testid="card-students">
            <Users className="mx-auto text-4xl text-accent mb-4" size={48} />
            <h3 className="text-2xl font-bold mb-4">For Students</h3>
            <p className="mb-6">
              Join thousands of young coders, share your projects, and make new friends who love programming as much as you do.
            </p>
            <Button 
              className="bg-white text-primary hover:bg-white/90 transition-colors"
              data-testid="button-join-student-community"
              onClick={() => {
                console.log('Join Student Community button clicked');
                alert('Student Community platform coming soon! Connect with fellow young coders.');
              }}
            >
              Join Student Community
            </Button>
          </div>
          
          <div className="glassmorphism rounded-2xl p-8 text-white" data-testid="card-mentors">
            <Presentation className="mx-auto text-4xl text-accent mb-4" size={48} />
            <h3 className="text-2xl font-bold mb-4">For Mentors</h3>
            <p className="mb-6">
              Share your passion for coding, inspire the next generation, and build a rewarding teaching career with flexible scheduling.
            </p>
            <Button 
              className="bg-accent text-accent-foreground hover:bg-accent/90 transition-colors"
              data-testid="button-become-mentor"
              onClick={() => {
                console.log('Become a Mentor button clicked');
                alert('Mentor registration coming soon! Share your passion for coding with the next generation.');
              }}
            >
              Become a Mentor
            </Button>
          </div>
        </div>
        
        <div className="flex items-center justify-center space-x-12 text-white/80">
          <div className="text-center" data-testid="stat-community-members">
            <div className="text-3xl font-bold">50K+</div>
            <div>Community Members</div>
          </div>
          <div className="text-center" data-testid="stat-projects-created">
            <div className="text-3xl font-bold">1M+</div>
            <div>Projects Created</div>
          </div>
          <div className="text-center" data-testid="stat-parent-satisfaction">
            <div className="text-3xl font-bold">99%</div>
            <div>Parent Satisfaction</div>
          </div>
        </div>
      </div>
    </section>
  );
}

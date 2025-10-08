import { GraduationCap, Presentation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function HeroSection() {
  const [, navigate] = useLocation();
  
  return (
    <section className="relative min-h-screen gradient-bg overflow-hidden">
      <div className="absolute inset-0 bg-black/10"></div>
      
      {/* Floating decorative elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full floating-animation"></div>
      <div className="absolute top-40 right-20 w-20 h-20 bg-white/15 rounded-full floating-animation" style={{ animationDelay: "-2s" }}></div>
      <div className="absolute bottom-40 left-20 w-24 h-24 bg-white/10 rounded-full floating-animation" style={{ animationDelay: "-4s" }}></div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight" data-testid="text-hero-title">
              Where You
              <span className="block">can find</span>
              <span className="block text-accent">Mentors For CS, IGCSE, IB, AP Subjects</span>
            </h1>
            <p className="text-xl text-white/90 mb-8 max-w-2xl" data-testid="text-hero-description">
              Connect students with expert mentors for CS, IGCSE, IB, and AP subjects. 
              Personalized learning experiences to excel in your academic journey.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button 
                size="lg" 
                className="bg-white text-primary px-8 py-4 hover:bg-white/90 hover-lift font-semibold text-lg"
                data-testid="button-learn"
                onClick={() => {
                  console.log('📚 I Want to Learn button clicked - scrolling to mentor discovery');
                  const discoverSection = document.getElementById('discover');
                  if (discoverSection) {
                    discoverSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
              >
                <GraduationCap className="mr-2" size={20} />
                I Want to Learn
              </Button>
              <Button 
                size="lg" 
                className="bg-accent text-accent-foreground px-8 py-4 hover:bg-accent/90 hover-lift font-semibold text-lg"
                data-testid="button-teach"
                onClick={() => {
                  console.log('👨‍🏫 I Want to Teach button clicked - navigating to signup');
                  navigate('/signup');
                }}
              >
                <Presentation className="mr-2" size={20} />
                I Want to Teach
              </Button>
            </div>
            
            <div className="flex items-center justify-center lg:justify-start space-x-8 mt-12 text-white/80">
              <div className="text-center" data-testid="stat-students">
                <div className="text-2xl font-bold">10K+</div>
                <div className="text-sm">Happy Students</div>
              </div>
              <div className="text-center" data-testid="stat-mentors">
                <div className="text-2xl font-bold">500+</div>
                <div className="text-sm">Expert Mentors</div>
              </div>
              <div className="text-center" data-testid="stat-success-rate">
                <div className="text-2xl font-bold">95%</div>
                <div className="text-sm">Success Rate</div>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <img 
              src="https://images.unsplash.com/photo-1596496050755-c923e73e42e1?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600" 
              alt="Kids learning programming together" 
              className="rounded-2xl shadow-2xl hover-lift"
              data-testid="img-hero-kids-coding"
            />
            
            {/* Floating achievement cards */}
            <div className="absolute -top-6 -right-6 glassmorphism rounded-xl p-4 text-white" data-testid="card-achievement">
              <div className="flex items-center space-x-2">
                <span className="text-accent">🏆</span>
                <span className="font-semibold">Achievement Unlocked!</span>
              </div>
            </div>
            
            <div className="absolute -bottom-6 -left-6 glassmorphism rounded-xl p-4 text-white" data-testid="card-live-session">
              <div className="flex items-center space-x-2">
                <span className="text-secondary">🎥</span>
                <span className="font-semibold">Live Session Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

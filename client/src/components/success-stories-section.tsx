import { Star } from "lucide-react";

export default function SuccessStoriesSection() {
  const stories = [
    {
      id: 1,
      name: "Alex (12 years old)",
      project: "Built a Weather App",
      quote: "I learned Python with Sarah and built my first weather app! Now I want to become a software engineer.",
      timeAgo: "3 months ago",
      initials: "AB",
      bgColor: "bg-primary",
    },
    {
      id: 2,
      name: "Maya (10 years old)", 
      project: "Created Interactive Games",
      quote: "Emma taught me Scratch and I made 5 games! My friends love playing them at school.",
      timeAgo: "1 month ago",
      initials: "MJ",
      bgColor: "bg-secondary",
    },
    {
      id: 3,
      name: "Liam (14 years old)",
      project: "Built Personal Website", 
      quote: "Jake helped me build my own website! I'm now helping other kids in my class learn to code.",
      timeAgo: "2 weeks ago",
      initials: "LS",
      bgColor: "bg-accent",
    },
  ];

  return (
    <section id="success-stories" className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6" data-testid="text-success-stories-title">
            Amazing <span className="text-gradient">Success Stories</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="text-success-stories-description">
            See how our young learners are building incredible projects and developing valuable skills.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {stories.map((story) => (
            <div key={story.id} className="bg-card rounded-2xl p-6 shadow-lg hover-lift" data-testid={`story-${story.id}`}>
              <div className="flex items-center space-x-3 mb-4">
                <div className={`w-12 h-12 ${story.bgColor} rounded-full flex items-center justify-center text-white font-bold`} data-testid={`avatar-student-${story.id}`}>
                  {story.initials}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground" data-testid={`text-student-name-${story.id}`}>
                    {story.name}
                  </h3>
                  <p className="text-muted-foreground text-sm" data-testid={`text-student-project-${story.id}`}>
                    {story.project}
                  </p>
                </div>
              </div>
              
              <p className="text-muted-foreground mb-4" data-testid={`text-student-quote-${story.id}`}>
                "{story.quote}"
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1" data-testid={`rating-student-${story.id}`}>
                  {[...Array(5)].map((_, i) => {
                    // Default to 5 stars for success stories
                    const rating = 5;
                    const isFilled = i < Math.floor(rating);
                    const isPartial = i === Math.floor(rating) && rating % 1 !== 0;
                    
                    return (
                      <Star 
                        key={i} 
                        size={16} 
                        className={`${isFilled || isPartial ? 'text-accent' : 'text-muted-foreground'}`}
                        fill={isFilled || isPartial ? "currentColor" : "none"}
                      />
                    );
                  })}
                </div>
                <span className="text-sm text-muted-foreground" data-testid={`text-time-ago-${story.id}`}>
                  {story.timeAgo}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

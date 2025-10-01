import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import MentorCard from "./mentor-card";
import type { MentorWithUser } from "@shared/schema";

export default function DiscoverySection() {
  const [activeFilter, setActiveFilter] = useState("all");
  
  const { data: mentors = [], isLoading, error } = useQuery<MentorWithUser[]>({
    queryKey: ["/api/mentors"],
  });


  const filters = [
    { id: "all", label: "All Mentors" },
    { id: "CS", label: "Computer Science" },
    { id: "IGCSE", label: "IGCSE" },
    { id: "AS-A-Levels", label: "AS-A-Levels" },
    { id: "IB", label: "IB" },
    { id: "AP", label: "AP" },
  ];

  const filteredMentors = mentors.filter(mentor => {
    if (activeFilter === "all") return true;
    return mentor.specialties?.includes(activeFilter);
  });

  return (
    <section id="discover" className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6" data-testid="text-discovery-title">
            Discover Amazing <span className="text-gradient">Mentors</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="text-discovery-description">
            Browse through our curated community of expert educators specializing in CS, IGCSE, IB, and AP subjects.
          </p>
        </div>
        
        {/* Filter tabs */}
        <div className="flex justify-center mb-12 px-4">
          <div className="bg-card rounded-xl p-2 shadow-lg max-w-full">
            <div className="flex flex-wrap gap-2 justify-center">
              {filters.map((filter) => (
                <Button
                  key={filter.id}
                  variant={activeFilter === filter.id ? "default" : "ghost"}
                  onClick={() => setActiveFilter(filter.id)}
                  className="text-xs sm:text-sm"
                  data-testid={`button-filter-${filter.id}`}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Mentors grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card rounded-2xl p-6 shadow-lg animate-pulse" data-testid={`skeleton-mentor-${i}`}>
                <div className="w-full h-48 bg-muted rounded-xl mb-4"></div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-muted rounded-full"></div>
                  <div>
                    <div className="h-4 bg-muted rounded w-24 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-32"></div>
                  </div>
                </div>
                <div className="h-3 bg-muted rounded w-full mb-2"></div>
                <div className="h-3 bg-muted rounded w-3/4 mb-4"></div>
                <div className="h-10 bg-muted rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16" data-testid="text-error">
            <p className="text-red-500 text-lg mb-4">Error loading mentors: {error.message}</p>
            <Button onClick={() => window.location.reload()} data-testid="button-retry">
              Try Again
            </Button>
          </div>
        ) : !mentors || mentors.length === 0 ? (
          <div className="text-center py-16" data-testid="text-no-mentors-available">
            <p className="text-muted-foreground text-lg mb-4">No mentors available yet.</p>
            <p className="text-sm text-muted-foreground">Please check back later or contact support.</p>
          </div>
        ) : filteredMentors.length === 0 ? (
          <div className="text-center py-16" data-testid="text-no-mentors">
            <p className="text-muted-foreground text-lg mb-4">No mentors found for the selected filter.</p>
            <Button onClick={() => setActiveFilter("all")} data-testid="button-show-all">
              Show All Mentors
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredMentors.map((mentor) => (
              <MentorCard key={mentor.id} mentor={mentor} />
            ))}
          </div>
        )}
        
        <div className="text-center mt-12">
          <Button 
            size="lg" 
            variant="secondary" 
            data-testid="button-explore-all"
            onClick={() => {
              console.log('Explore All Mentors button clicked');
              // Reset filter to show all mentors
              setActiveFilter('all');
              // Scroll to top of mentor grid
              const mentorGrid = document.querySelector('[data-testid="text-discovery-title"]');
              if (mentorGrid) {
                mentorGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
          >
            <Search className="mr-2" size={20} />
            Explore All Mentors
          </Button>
        </div>
      </div>
    </section>
  );
}

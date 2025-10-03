import { Star, Users, Clock } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { MentorWithUser } from "@shared/schema";

interface MentorCardProps {
  mentor: MentorWithUser;
}

export default function MentorCard({ mentor }: MentorCardProps) {
  const getInitials = (firstName: string | null, lastName: string | null) => {
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  const stockImages = [
    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=300",
    "https://images.unsplash.com/photo-1531482615713-2afd69097998?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=300",
    "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=300",
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=300",
  ];

  const imageIndex = parseInt(mentor.id.slice(-1), 16) % stockImages.length;

  return (
    <div className="bg-card rounded-2xl p-6 shadow-lg hover-lift" data-testid={`card-mentor-${mentor.id}`}>
      <img 
        src={stockImages[imageIndex]} 
        alt={`${mentor.user.firstName} ${mentor.user.lastName} teaching`} 
        className="w-full h-48 object-cover rounded-xl mb-4" 
        data-testid={`img-mentor-${mentor.id}`}
      />
      
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold" data-testid={`avatar-mentor-${mentor.id}`}>
          {mentor.user.profileImageUrl ? (
            <img 
              src={mentor.user.profileImageUrl} 
              alt={`${mentor.user.firstName} ${mentor.user.lastName}`} 
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            getInitials(mentor.user.firstName, mentor.user.lastName)
          )}
        </div>
        <div>
          <h3 className="font-semibold text-foreground" data-testid={`text-mentor-name-${mentor.id}`}>
            {mentor.user.firstName} {mentor.user.lastName}
          </h3>
          <p className="text-muted-foreground text-sm" data-testid={`text-mentor-title-${mentor.id}`}>
            {mentor.title}
          </p>
        </div>
      </div>
      
      <div className="flex items-center space-x-4 mb-4 text-sm text-muted-foreground">
        <div className="flex items-center" data-testid={`stat-rating-${mentor.id}`}>
          <div className="flex items-center mr-2">
            {[...Array(5)].map((_, i) => {
              const rating = parseFloat(mentor.rating || "0");
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
          <span>{parseFloat(mentor.rating || "0").toFixed(1)}</span>
        </div>
        <div className="flex items-center" data-testid={`stat-students-${mentor.id}`}>
          <Users className="mr-1" size={16} />
          <span>{mentor.totalStudents} students</span>
        </div>
        <div className="flex items-center" data-testid={`stat-experience-${mentor.id}`}>
          <Clock className="mr-1" size={16} />
          <span>{mentor.experience} years</span>
        </div>
      </div>
      
      <div className="flex items-center mb-4 text-sm text-muted-foreground" data-testid={`stat-country-${mentor.id}`}>
        <span className="font-medium">Country: </span>
        <span className="ml-1">{mentor.country}</span>
      </div>
      
      <p className="text-muted-foreground mb-4" data-testid={`text-mentor-description-${mentor.id}`}>
        {mentor.description}
      </p>
      
      <div className="flex flex-wrap gap-2 mb-4">
        {mentor.specialties?.map((specialty, index) => (
          <Badge 
            key={index} 
            variant="secondary" 
            className="text-xs"
            data-testid={`badge-specialty-${mentor.id}-${index}`}
          >
            {specialty}
          </Badge>
        ))}
      </div>
      
      <Link href={`/mentors/${mentor.id}`}>
        <Button className="w-full" data-testid={`button-view-profile-${mentor.id}`}>
          View Profile & Book
        </Button>
      </Link>
    </div>
  );
}

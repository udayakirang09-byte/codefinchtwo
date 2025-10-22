import { Star, Users, Clock, GraduationCap } from "lucide-react";
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

  // Use teacher's actual photo from approved media, fallback to user profileImageUrl, then initials
  const profileImage = mentor.media?.photoBlobUrl || mentor.user.profileImageUrl || null;

  return (
    <div className="group relative bg-white dark:from-gray-900 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200 dark:border-gray-800" data-testid={`card-mentor-${mentor.id}`}>
      {/* Circular Profile Photo at Top */}
      <div className="relative pt-8 pb-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
        {/* Rating badge in top right */}
        <div className="absolute top-3 right-3 bg-white dark:bg-gray-800 px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md" data-testid={`badge-rating-${mentor.id}`}>
          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{parseFloat(mentor.rating || "0").toFixed(2)}</span>
        </div>

        {/* Circular Profile Photo */}
        <div className="flex justify-center">
          {profileImage ? (
            <img 
              src={profileImage} 
              alt={`${mentor.user.firstName} ${mentor.user.lastName}`} 
              className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-xl" 
              data-testid={`img-mentor-photo-${mentor.id}`}
            />
          ) : (
            <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-4xl border-4 border-white dark:border-gray-700 shadow-xl">
              {getInitials(mentor.user.firstName, mentor.user.lastName)}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Name and Title - Centered */}
        <div className="mb-4 text-center">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1" data-testid={`text-mentor-name-${mentor.id}`}>
            {mentor.user.firstName} {mentor.user.lastName}
          </h3>
          <p className="text-sm text-blue-600 dark:text-blue-400 font-medium" data-testid={`text-mentor-title-${mentor.id}`}>
            {mentor.title}
          </p>
        </div>

        {/* Stats Row - Centered Icons with Text */}
        <div className="flex items-center justify-center gap-6 mb-5">
          <div className="flex items-center gap-1.5" data-testid={`stat-experience-${mentor.id}`}>
            <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{mentor.experience} years total</span>
          </div>
          
          <div className="flex items-center gap-1.5" data-testid={`stat-students-${mentor.id}`}>
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{mentor.totalStudents} students</span>
          </div>
        </div>

        {/* Specialties */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Specialities</h4>
          <div className="flex flex-wrap gap-2">
            {((mentor as any).signupSubjects || mentor.specialties || []).slice(0, 4).map((item: any, index: number) => {
              const specialty = typeof item === 'string' ? item : item.subject;
              return (
                <Badge 
                  key={index} 
                  className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full"
                  data-testid={`badge-specialty-${mentor.id}-${index}`}
                >
                  {specialty}
                </Badge>
              );
            })}
          </div>
        </div>

        {/* Subjects & Courses */}
        <div className="mb-5">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Subjects & Courses</h4>
          {((mentor as any).subjects && (mentor as any).subjects.length > 0) ? (
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {(mentor as any).subjects.slice(0, 2).map((s: any, i: number) => s.subject).join(', ')}
              {(mentor as any).subjects.length > 2 && ` +${(mentor as any).subjects.length - 2} more`}
            </div>
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400">No subjects listed</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Link href={`/booking/${mentor.id}`} className="flex-1">
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg" 
              data-testid={`button-book-session-${mentor.id}`}
            >
              Book Session
            </Button>
          </Link>
          <Link href={`/mentors/${mentor.id}`} className="flex-1">
            <Button 
              variant="outline"
              className="w-full border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 font-semibold rounded-lg" 
              data-testid={`button-view-profile-${mentor.id}`}
            >
              View Profile
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

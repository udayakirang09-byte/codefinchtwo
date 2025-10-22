import { Star, Users, Clock, Play, GraduationCap, Award } from "lucide-react";
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
  const getProfileImage = () => {
    if ((mentor as any).media?.photoBlobUrl) {
      return (mentor as any).media.photoBlobUrl;
    }
    return mentor.user.profileImageUrl || null;
  };

  const profileImage = getProfileImage();
  
  // Check if teacher has an approved video
  const hasVideo = (mentor as any).media?.videoBlobUrl;

  return (
    <div className="group relative bg-gradient-to-br from-white to-blue-50/30 dark:from-gray-900 dark:to-blue-950/20 rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-800" data-testid={`card-mentor-${mentor.id}`}>
      {/* Header with Photo/Avatar */}
      <div className="relative h-44 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 overflow-hidden">
        {profileImage ? (
          <img 
            src={profileImage} 
            alt={`${mentor.user.firstName} ${mentor.user.lastName}`} 
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
            data-testid={`img-mentor-photo-${mentor.id}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-bold text-3xl">
              {getInitials(mentor.user.firstName, mentor.user.lastName)}
            </div>
          </div>
        )}
        
        {/* Video indicator badge */}
        {hasVideo && (
          <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg backdrop-blur-sm" data-testid={`badge-video-${mentor.id}`}>
            <Play className="w-3 h-3 fill-white" />
            <span className="text-xs font-semibold">Video</span>
          </div>
        )}
        
        {/* Rating badge */}
        <div className="absolute top-3 left-3 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg" data-testid={`badge-rating-${mentor.id}`}>
          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{parseFloat(mentor.rating || "0").toFixed(1)}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Name and Title */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1" data-testid={`text-mentor-name-${mentor.id}`}>
            {mentor.user.firstName} {mentor.user.lastName}
          </h3>
          <p className="text-sm text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1" data-testid={`text-mentor-title-${mentor.id}`}>
            <GraduationCap className="w-4 h-4" />
            {mentor.title}
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2 text-sm" data-testid={`stat-students-${mentor.id}`}>
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="font-bold text-gray-900 dark:text-gray-100">{mentor.totalStudents}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Students</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm" data-testid={`stat-experience-${mentor.id}`}>
            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <div className="font-bold text-gray-900 dark:text-gray-100">{mentor.experience}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Years Exp</div>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2" data-testid={`text-mentor-description-${mentor.id}`}>
          {mentor.description}
        </p>

        {/* Specialties */}
        <div className="mb-4">
          <div className="flex items-center gap-1 mb-2">
            <Award className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Specialties</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {((mentor as any).signupSubjects || mentor.specialties || []).slice(0, 3).map((item: any, index: number) => {
              const specialty = typeof item === 'string' ? item : item.subject;
              return (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="text-xs px-2.5 py-0.5 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
                  data-testid={`badge-specialty-${mentor.id}-${index}`}
                >
                  {specialty}
                </Badge>
              );
            })}
            {((mentor as any).signupSubjects || mentor.specialties || []).length > 3 && (
              <Badge 
                variant="outline" 
                className="text-xs px-2.5 py-0.5 text-gray-500 dark:text-gray-400"
              >
                +{((mentor as any).signupSubjects || mentor.specialties || []).length - 3} more
              </Badge>
            )}
          </div>
        </div>

        {/* Subjects & Courses Label */}
        {((mentor as any).subjects && (mentor as any).subjects.length > 0) && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-green-700 dark:text-green-300 font-medium">
                📚 Subjects & Courses:
              </span>
              <span className="text-green-600 dark:text-green-400 font-bold">{(mentor as any).subjects.length}</span>
            </div>
            <div className="mt-1 text-xs text-green-600 dark:text-green-400">
              {(mentor as any).subjects.slice(0, 2).map((s: any, i: number) => s.subject).join(', ')}
              {(mentor as any).subjects.length > 2 && ' ...'}
            </div>
          </div>
        )}

        {/* View Profile Button */}
        <Link href={`/mentors/${mentor.id}`}>
          <Button 
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-semibold" 
            data-testid={`button-view-profile-${mentor.id}`}
          >
            View Profile & Book Session
          </Button>
        </Link>
      </div>

      {/* Hover effect glow */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-br from-blue-400/5 via-purple-400/5 to-pink-400/5"></div>
    </div>
  );
}

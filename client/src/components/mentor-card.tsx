import { Star, Users, GraduationCap } from "lucide-react";
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

  // Calculate total experience from subjectsWithExperience
  const totalExperience = mentor.subjectsWithExperience?.reduce(
    (sum, s) => sum + (parseInt(s.experience) || 0),
    0
  ) || mentor.experience || 0;

  // Use teacher's actual photo from approved media, fallback to user profileImageUrl, then initials
  const profileImage = mentor.media?.photoBlobUrl || mentor.user.profileImageUrl || null;

  // 🔍 DEBUG: Log photo data for troubleshooting
  if (mentor.user.firstName === 'UDAYA' && mentor.user.lastName === 'prm') {
    console.log('🖼️ [MENTOR CARD] UDAYA prm photo debug:', {
      hasMedia: !!mentor.media,
      photoBlobUrl: mentor.media?.photoBlobUrl,
      photoStatus: mentor.media?.photoValidationStatus,
      profileImageUrl: mentor.user.profileImageUrl,
      finalProfileImage: profileImage,
      mentorId: mentor.id
    });
  }

  return (
    <div className="group relative bg-gradient-to-br from-blue-50/80 via-purple-50/60 to-blue-50/80 dark:from-gray-800 dark:to-gray-900 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700" data-testid={`card-mentor-${mentor.id}`}>
      {/* Content */}
      <div className="p-6">
        {/* Circular Profile Photo at Top */}
        <div className="flex justify-center mb-4">
          {profileImage ? (
            <img 
              src={profileImage} 
              alt={`${mentor.user.firstName} ${mentor.user.lastName}`} 
              className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-lg" 
              data-testid={`img-mentor-photo-${mentor.id}`}
            />
          ) : (
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-3xl border-4 border-white dark:border-gray-700 shadow-lg">
              {getInitials(mentor.user.firstName, mentor.user.lastName)}
            </div>
          )}
        </div>

        {/* Name, Title and Rating */}
        <div className="mb-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100" data-testid={`text-mentor-name-${mentor.id}`}>
              {mentor.user.firstName} {mentor.user.lastName}
            </h3>
            <div className="flex items-center gap-0.5" data-testid={`badge-rating-${mentor.id}`}>
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{parseFloat(mentor.rating || "0").toFixed(2)}</span>
            </div>
          </div>
          <p className="text-sm text-cyan-600 dark:text-cyan-400 font-medium" data-testid={`text-mentor-title-${mentor.id}`}>
            {mentor.title}
          </p>
        </div>

        {/* Stats Section with Light Background */}
        <div className="mb-4 bg-white/60 dark:bg-gray-800/40 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2" data-testid={`stat-experience-${mentor.id}`}>
            <GraduationCap className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span className="text-sm text-gray-700 dark:text-gray-300">{totalExperience} years total</span>
          </div>
          
          <div className="flex items-center gap-2" data-testid={`stat-students-${mentor.id}`}>
            <Users className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span className="text-sm text-gray-700 dark:text-gray-300">{mentor.totalStudents || 0} students</span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-300 dark:border-gray-600 my-4"></div>

        {/* Specialties */}
        <div className="mb-4">
          <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">Specialties</h4>
          <div className="flex flex-wrap gap-2">
            {mentor.subjectsWithExperience && mentor.subjectsWithExperience.length > 0 ? (
              mentor.subjectsWithExperience.slice(0, 3).map((item, index) => (
                <Badge 
                  key={index} 
                  className="text-xs px-3 py-1 bg-cyan-100 hover:bg-cyan-200 dark:bg-cyan-900 dark:hover:bg-cyan-800 text-cyan-700 dark:text-cyan-300 rounded-full border-0"
                  data-testid={`badge-specialty-${mentor.id}-${index}`}
                >
                  {item.subject} ({item.experience})
                </Badge>
              ))
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400">No specialties listed</p>
            )}
          </div>
        </div>

        {/* Subjects & Courses */}
        <div className="mb-5">
          <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">Subjects & Courses</h4>
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
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-lg shadow-md" 
              data-testid={`button-book-session-${mentor.id}`}
            >
              Book Session
            </Button>
          </Link>
          <Link href={`/mentors/${mentor.id}`} className="flex-1">
            <Button 
              variant="outline"
              className="w-full border-2 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950 font-semibold rounded-lg" 
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

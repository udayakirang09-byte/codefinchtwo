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
  // Video byte: If video cannot be placed in card, display photo (as per user requirement)
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
    <div className="group relative bg-gradient-to-br from-purple-50/50 via-blue-50/40 to-purple-50/50 rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-purple-200/30" data-testid={`card-mentor-${mentor.id}`}>
      {/* Content */}
      <div className="p-6">
        {/* Star Rating - Top Right Corner */}
        <div className="absolute top-4 right-4 flex items-center gap-1 bg-white/80 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm">
          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          <span className="text-sm font-semibold text-gray-900" data-testid={`badge-rating-${mentor.id}`}>
            {parseFloat(mentor.rating || "0").toFixed(2)}
          </span>
        </div>

        {/* Circular Profile Photo at Top */}
        <div className="flex justify-center mb-4">
          {profileImage ? (
            <img 
              src={profileImage} 
              alt={`${mentor.user.firstName} ${mentor.user.lastName}`} 
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg" 
              data-testid={`img-mentor-photo-${mentor.id}`}
            />
          ) : (
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-3xl border-4 border-white shadow-lg">
              {getInitials(mentor.user.firstName, mentor.user.lastName)}
            </div>
          )}
        </div>

        {/* Name and Title */}
        <div className="mb-4 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-1" data-testid={`text-mentor-name-${mentor.id}`}>
            {mentor.user.firstName} {mentor.user.lastName}
          </h3>
          <p className="text-sm text-cyan-600 font-medium" data-testid={`text-mentor-title-${mentor.id}`}>
            {mentor.title}
          </p>
        </div>

        {/* Stats Section */}
        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-2" data-testid={`stat-experience-${mentor.id}`}>
            <GraduationCap className="w-4 h-4 text-cyan-600" />
            <span className="text-sm text-gray-700">{totalExperience} years total</span>
          </div>
          
          <div className="flex items-center gap-2" data-testid={`stat-students-${mentor.id}`}>
            <Users className="w-4 h-4 text-cyan-600" />
            <span className="text-sm text-gray-700">{mentor.totalStudents || 0} students</span>
          </div>
        </div>

        {/* Specialties Section */}
        {(mentor as any).signupSubjects && (mentor as any).signupSubjects.length > 0 && (
          <div className="mb-4">
            <h4 className="text-base font-bold text-gray-900 mb-2">Specialties</h4>
            <div className="flex flex-wrap gap-2">
              {(mentor as any).signupSubjects.slice(0, 3).map((subject: any, index: number) => (
                <Badge 
                  key={index} 
                  className="text-xs px-3 py-1.5 bg-cyan-100 hover:bg-cyan-200 text-cyan-700 rounded-full border-0"
                  data-testid={`badge-signup-specialty-${mentor.id}-${index}`}
                >
                  {subject.subject} ({subject.experience})
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Subjects & Courses */}
        <div className="mb-4">
          <h4 className="text-base font-bold text-gray-900 mb-2">Subjects & Courses</h4>
          {((mentor as any).subjects && (mentor as any).subjects.length > 0) ? (
            <div className="text-sm text-gray-600">
              {(mentor as any).subjects.slice(0, 2).map((s: any, i: number) => s.subject).join(', ')}
              {(mentor as any).subjects.length > 2 && ` +${(mentor as any).subjects.length - 2} more`}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No subjects listed</p>
          )}
        </div>

        {/* About Teacher Section */}
        {mentor.description && (
          <div className="mb-5">
            <h4 className="text-base font-bold text-gray-900 mb-2">About Teacher</h4>
            <p className="text-sm text-gray-600 line-clamp-3" data-testid={`text-about-${mentor.id}`}>
              {mentor.description}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Link href={`/booking/${mentor.id}`} className="flex-1">
            <Button 
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-xl shadow-md" 
              data-testid={`button-book-session-${mentor.id}`}
            >
              Book Session
            </Button>
          </Link>
          <Link href={`/mentors/${mentor.id}`} className="flex-1">
            <Button 
              variant="outline"
              className="w-full border-2 border-purple-300 text-purple-700 hover:bg-purple-50 font-semibold rounded-xl" 
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

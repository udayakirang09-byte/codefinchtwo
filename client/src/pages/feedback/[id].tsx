import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, CheckCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

export default function FeedbackForm() {
  const [, params] = useRoute("/feedback/:id");
  
  if (!params) {
    return <div>Invalid class ID</div>;
  }
  
  const classId = (params as { id: string }).id;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [whatWorked, setWhatWorked] = useState("");
  const [improvements, setImprovements] = useState("");
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [studentId, setStudentId] = useState<string>("");

  const [classInfo, setClassInfo] = useState({
    subject: "Loading...",
    mentor: "Loading...",
    completedAt: new Date(),
    expiresAt: new Date()
  });

  useEffect(() => {
    console.log(`⭐ Loading feedback form for class ${classId}`);
    
    // Fetch actual booking data and student ID
    const fetchBookingData = async () => {
      try {
        const response = await fetch(`/api/bookings/${classId}`);
        if (!response.ok) throw new Error('Failed to fetch booking data');
        
        const booking = await response.json();
        const completedAt = new Date(booking.scheduledAt);
        const expiresAt = new Date(completedAt.getTime() + 12 * 60 * 60 * 1000); // 12 hours after class
        
        setClassInfo({
          subject: booking.notes || booking.mentor?.title || 'Coding Session',
          mentor: `${booking.mentor.user.firstName} ${booking.mentor.user.lastName}`,
          completedAt,
          expiresAt
        });
        
        setStudentId(booking.studentId);
      } catch (error) {
        console.error('Error fetching booking data:', error);
        toast({
          title: "Error Loading Class",
          description: "Could not load class information. Please try again.",
          variant: "destructive",
        });
      }
    };
    
    fetchBookingData();
  }, [classId, toast]);

  const feedbackMutation = useMutation({
    mutationFn: async (feedbackData: {
      bookingId: string;
      studentId: string;
      mentorId: string;
      rating: number;
      feedback: string;
      whatWorked: string;
      improvements: string;
      wouldRecommend: boolean;
    }) => {
      return await apiRequest('POST', '/api/class-feedback', feedbackData);
    },
    onSuccess: async () => {
      // Invalidate all student-related caches to force refetch
      await queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      
      toast({
        title: "Feedback Submitted!",
        description: "Thank you for your feedback. It helps us improve our teaching.",
        variant: "default",
      });

      // Redirect back to dashboard after submission
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    },
    onError: (error) => {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Submission Failed",
        description: "Please try submitting your feedback again.",
        variant: "destructive",
      });
    }
  });

  const handleSubmitFeedback = async () => {
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please provide a rating before submitting feedback.",
        variant: "destructive",
      });
      return;
    }

    console.log(`📤 Submitting feedback for class ${classId}:`, {
      rating,
      feedback,
      whatWorked,
      improvements,
      wouldRecommend
    });

    // First fetch the booking to get mentorId
    try {
      const response = await fetch(`/api/bookings/${classId}`);
      if (!response.ok) throw new Error('Failed to fetch booking');
      const booking = await response.json();

      feedbackMutation.mutate({
        bookingId: classId,
        studentId: studentId,
        mentorId: booking.mentorId,
        rating,
        feedback: `${feedback}\n\nWhat worked: ${whatWorked}\n\nImprovements: ${improvements}`,
        whatWorked,
        improvements,
        wouldRecommend: wouldRecommend ?? false
      });
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "Could not load class information. Please try again.",
        variant: "destructive",
      });
    }
  };

  const timeRemaining = classInfo.expiresAt.getTime() - Date.now();
  const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Share Your Feedback ⭐</h1>
          <p className="text-xl text-gray-600">Help us improve by sharing your learning experience</p>
        </div>

        {/* Class Info & Time Warning */}
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">{classInfo.subject}</h2>
                <p className="text-gray-600">with {classInfo.mentor}</p>
                <p className="text-sm text-gray-500">
                  Completed: {classInfo.completedAt.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center text-orange-600 mb-1">
                  <Clock className="h-4 w-4 mr-1" />
                  <span className="font-medium">Time Remaining</span>
                </div>
                <div className="text-lg font-bold text-orange-700">
                  {hoursRemaining}h {minutesRemaining}m
                </div>
                <p className="text-xs text-orange-600">Feedback expires soon</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feedback Form */}
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-yellow-600 text-white rounded-t-lg">
            <CardTitle className="text-2xl">Your Learning Experience</CardTitle>
          </CardHeader>
          
          <CardContent className="p-8 space-y-8">
            {/* Rating */}
            <div>
              <label className="block text-lg font-semibold text-gray-800 mb-4">
                How would you rate this class overall? *
              </label>
              <div className="flex items-center gap-2 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`p-2 rounded-full transition-all duration-200 hover:scale-110 ${
                      star <= rating ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'
                    }`}
                    data-testid={`button-rating-${star}`}
                  >
                    <Star className={`h-8 w-8 ${star <= rating ? 'fill-current' : ''}`} />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-gray-600">
                  {rating === 1 && "We're sorry to hear that. We'll work to improve."}
                  {rating === 2 && "Thanks for the feedback. We'll make it better."}
                  {rating === 3 && "Good to know. We appreciate your honest feedback."}
                  {rating === 4 && "Great! We're glad you had a positive experience."}
                  {rating === 5 && "Wonderful! Thank you for the excellent rating."}
                </p>
              )}
            </div>

            {/* General Feedback */}
            <div>
              <label className="block text-lg font-semibold text-gray-800 mb-3">
                Share your overall thoughts about the class
              </label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Tell us about your learning experience, the teaching style, pace, or any general comments..."
                className="min-h-[100px] resize-none border-gray-300 focus:border-orange-500"
                data-testid="textarea-general-feedback"
              />
            </div>

            {/* What Worked Well */}
            <div>
              <label className="block text-lg font-semibold text-gray-800 mb-3">
                What worked well in this class?
              </label>
              <Textarea
                value={whatWorked}
                onChange={(e) => setWhatWorked(e.target.value)}
                placeholder="What did you enjoy most? What helped you learn effectively?"
                className="min-h-[80px] resize-none border-gray-300 focus:border-green-500"
                data-testid="textarea-what-worked"
              />
            </div>

            {/* Improvements */}
            <div>
              <label className="block text-lg font-semibold text-gray-800 mb-3">
                What could be improved?
              </label>
              <Textarea
                value={improvements}
                onChange={(e) => setImprovements(e.target.value)}
                placeholder="Any suggestions for making the class even better?"
                className="min-h-[80px] resize-none border-gray-300 focus:border-blue-500"
                data-testid="textarea-improvements"
              />
            </div>

            {/* Recommendation */}
            <div>
              <label className="block text-lg font-semibold text-gray-800 mb-4">
                Would you recommend this mentor to other students?
              </label>
              <div className="flex gap-4">
                <Button
                  variant={wouldRecommend === true ? "default" : "outline"}
                  onClick={() => setWouldRecommend(true)}
                  className={`flex-1 py-3 ${
                    wouldRecommend === true 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'hover:bg-green-50 hover:border-green-300'
                  }`}
                  data-testid="button-recommend-yes"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Yes, I would recommend
                </Button>
                <Button
                  variant={wouldRecommend === false ? "default" : "outline"}
                  onClick={() => setWouldRecommend(false)}
                  className={`flex-1 py-3 ${
                    wouldRecommend === false 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'hover:bg-red-50 hover:border-red-300'
                  }`}
                  data-testid="button-recommend-no"
                >
                  No, not at this time
                </Button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t border-gray-200">
              <Button
                onClick={handleSubmitFeedback}
                disabled={rating === 0 || feedbackMutation.isPending}
                className="w-full py-4 text-lg bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700 disabled:opacity-50"
                data-testid="button-submit-feedback"
              >
                {feedbackMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Submitting Feedback...
                  </>
                ) : (
                  <>
                    <Star className="h-5 w-5 mr-2" />
                    Submit Feedback
                  </>
                )}
              </Button>
              <p className="text-center text-sm text-gray-500 mt-3">
                Your feedback helps improve the learning experience for everyone
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
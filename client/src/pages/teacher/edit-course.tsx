import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Save, Users, AlertCircle } from 'lucide-react';
import { Link, useParams, useLocation } from 'wouter';
import Navigation from '@/components/navigation';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function EditCourse() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const courseId = params.id;
  
  // Fetch course data
  const { data: course, isLoading } = useQuery<any>({
    queryKey: [`/api/courses/${courseId}`],
    enabled: !!courseId,
  });

  // Fetch enrolled students
  const { data: enrollments = [] } = useQuery<any[]>({
    queryKey: [`/api/courses/${courseId}/enrollments`],
    enabled: !!courseId,
  });

  const hasEnrolledStudents = enrollments.length > 0;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    duration: '',
    price: '',
    difficulty: '',
    maxStudents: '',
    maxClasses: '',
    prerequisites: '',
    status: 'active'
  });

  // Populate form when course data loads
  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title || '',
        description: course.description || '',
        category: course.category || '',
        duration: course.duration || '',
        price: course.price?.toString() || '',
        difficulty: course.difficulty || '',
        maxStudents: course.maxStudents?.toString() || '',
        maxClasses: course.maxClasses?.toString() || '',
        prerequisites: course.prerequisites || '',
        status: course.status || 'active'
      });
    }
  }, [course]);

  const updateCourseMutation = useMutation({
    mutationFn: async (courseData: any) => {
      return apiRequest('PATCH', `/api/courses/${courseId}`, courseData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Course updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/teacher/courses`] });
      navigate('/teacher');
    },
    onError: (error) => {
      console.error('❌ Course update failed:', error);
      toast({
        title: "Error",
        description: "Failed to update course. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (hasEnrolledStudents) {
      toast({
        title: "Cannot Edit",
        description: "Cannot edit course with enrolled students",
        variant: "destructive",
      });
      return;
    }

    if (!formData.title || !formData.category || !formData.difficulty || !formData.price) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    updateCourseMutation.mutate({
      ...formData,
      price: parseFloat(formData.price),
      maxStudents: parseInt(formData.maxStudents),
      maxClasses: parseInt(formData.maxClasses)
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading course...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6">
          <Link href="/teacher">
            <Button variant="outline" size="sm" data-testid="button-back">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Course Edit Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <CardTitle className="text-2xl">Edit Course</CardTitle>
                <CardDescription className="text-blue-100">
                  Update your course information
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {hasEnrolledStudents && (
                  <Alert className="mb-6 border-orange-500 bg-orange-50">
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                    <AlertDescription className="text-orange-700">
                      This course has enrolled students. Course details cannot be edited or deleted.
                    </AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="title">Course Title *</Label>
                      <Input
                        id="title"
                        placeholder="e.g., Python for Beginners"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        disabled={hasEnrolledStudents}
                        data-testid="input-course-title"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select 
                        value={formData.category} 
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                        disabled={hasEnrolledStudents}
                      >
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="web-development">Web Development</SelectItem>
                          <SelectItem value="mobile-development">Mobile Development</SelectItem>
                          <SelectItem value="data-science">Data Science</SelectItem>
                          <SelectItem value="ai-ml">AI & Machine Learning</SelectItem>
                          <SelectItem value="game-development">Game Development</SelectItem>
                          <SelectItem value="cybersecurity">Cybersecurity</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="difficulty">Difficulty Level *</Label>
                      <Select 
                        value={formData.difficulty} 
                        onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
                        disabled={hasEnrolledStudents}
                      >
                        <SelectTrigger data-testid="select-difficulty">
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration</Label>
                      <Input
                        id="duration"
                        placeholder="e.g., 8 weeks, 20 hours"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                        disabled={hasEnrolledStudents}
                        data-testid="input-duration"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="price">Price (₹) *</Label>
                      <Input
                        id="price"
                        type="number"
                        placeholder="2999"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        disabled={hasEnrolledStudents}
                        data-testid="input-price"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxStudents">Max Students</Label>
                      <Input
                        id="maxStudents"
                        type="number"
                        placeholder="8"
                        value={formData.maxStudents}
                        onChange={(e) => setFormData({ ...formData, maxStudents: e.target.value })}
                        disabled={hasEnrolledStudents}
                        data-testid="input-max-students"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxClasses">Max Classes</Label>
                      <Input
                        id="maxClasses"
                        type="number"
                        placeholder="12"
                        value={formData.maxClasses}
                        onChange={(e) => setFormData({ ...formData, maxClasses: e.target.value })}
                        disabled={hasEnrolledStudents}
                        data-testid="input-max-classes"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select 
                        value={formData.status} 
                        onValueChange={(value) => setFormData({ ...formData, status: value })}
                        disabled={hasEnrolledStudents}
                      >
                        <SelectTrigger data-testid="select-status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Course Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe what students will learn in this course..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                      disabled={hasEnrolledStudents}
                      data-testid="textarea-description"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prerequisites">Prerequisites</Label>
                    <Textarea
                      id="prerequisites"
                      placeholder="List any requirements or prior knowledge needed..."
                      value={formData.prerequisites}
                      onChange={(e) => setFormData({ ...formData, prerequisites: e.target.value })}
                      rows={3}
                      disabled={hasEnrolledStudents}
                      data-testid="textarea-prerequisites"
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      disabled={updateCourseMutation.isPending || hasEnrolledStudents}
                      data-testid="button-save-course"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {updateCourseMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Link href="/teacher">
                      <Button type="button" variant="outline" data-testid="button-cancel">
                        Cancel
                      </Button>
                    </Link>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Enrolled Students Sidebar */}
          <div>
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Enrolled Students
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-6 bg-blue-50 rounded-lg">
                    <div className="text-4xl font-bold text-blue-600" data-testid="text-enrollment-count">{enrollments.length}</div>
                    <div className="text-sm text-gray-600 mt-1">of {course?.maxStudents} max students</div>
                  </div>

                  {enrollments.length > 0 ? (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {enrollments.map((enrollment: any, index: number) => (
                        <div key={enrollment.id} className="p-3 bg-white border rounded-lg" data-testid={`student-card-${index}`}>
                          <div className="font-medium" data-testid={`student-name-${index}`}>{enrollment.studentName || 'Student'}</div>
                          <div className="text-sm text-gray-500">
                            Enrolled: {new Date(enrollment.enrolledAt).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No students enrolled yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

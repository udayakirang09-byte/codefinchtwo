import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Edit2, Users, Clock, DollarSign, BookOpen, Award, AlertCircle } from 'lucide-react';
import { Link, useParams } from 'wouter';
import Navigation from '@/components/navigation';

export default function ViewCourse() {
  const params = useParams<{ id: string }>();
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading course details...</div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Course not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6 flex justify-between items-center">
          <Link href="/teacher/home">
            <Button variant="outline" size="sm" data-testid="button-back">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <Link href={`/teacher/courses/${courseId}/edit`}>
            <Button size="sm" data-testid="button-edit-course">
              <Edit2 className="w-4 h-4 mr-2" />
              Edit Course
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Course Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-xl">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-3xl mb-2" data-testid="text-course-title">{course.title}</CardTitle>
                    <CardDescription className="text-blue-100">
                      {course.category}
                    </CardDescription>
                  </div>
                  <Badge className={course.status === 'active' ? 'bg-green-500' : 'bg-gray-500'} data-testid="badge-status">
                    {course.status === 'active' ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {hasEnrolledStudents && (
                  <Alert className="border-orange-500 bg-orange-50">
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                    <AlertDescription className="text-orange-700">
                      This course has enrolled students. Course details cannot be edited or deleted.
                    </AlertDescription>
                  </Alert>
                )}

                <div>
                  <h3 className="font-semibold text-lg mb-3">Course Description</h3>
                  <p className="text-gray-700 whitespace-pre-wrap" data-testid="text-description">{course.description}</p>
                </div>

                {course.prerequisites && (
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Prerequisites</h3>
                    <p className="text-gray-700 whitespace-pre-wrap" data-testid="text-prerequisites">{course.prerequisites}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Award className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                    <div className="text-sm text-gray-600">Level</div>
                    <div className="font-semibold capitalize" data-testid="text-difficulty">{course.difficulty}</div>
                  </div>
                  
                  {course.duration && (
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <Clock className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                      <div className="text-sm text-gray-600">Duration</div>
                      <div className="font-semibold" data-testid="text-duration">{course.duration}</div>
                    </div>
                  )}
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <DollarSign className="w-8 h-8 mx-auto mb-2 text-green-600" />
                    <div className="text-sm text-gray-600">Price</div>
                    <div className="font-semibold" data-testid="text-price">₹{course.price}</div>
                  </div>
                  
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                    <div className="text-sm text-gray-600">Classes</div>
                    <div className="font-semibold" data-testid="text-max-classes">{course.maxClasses}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
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
                    <div className="text-sm text-gray-600 mt-1">of {course.maxStudents} max students</div>
                  </div>

                  {enrollments.length > 0 ? (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {enrollments.map((enrollment: any, index: number) => (
                        <div key={enrollment.id} className="p-3 bg-white border rounded-lg" data-testid={`student-card-${index}`}>
                          <div className="font-medium" data-testid={`student-name-${index}`}>{enrollment.studentName || 'Student'}</div>
                          <div className="text-sm text-gray-500">
                            Enrolled: {new Date(enrollment.enrolledAt).toLocaleDateString()}
                          </div>
                          <Badge variant="outline" className="mt-1">
                            {enrollment.status || 'active'}
                          </Badge>
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

            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle>Course Capacity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Students</span>
                    <span className="font-semibold">{enrollments.length} / {course.maxStudents}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min((enrollments.length / course.maxStudents) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-gray-600">Total Classes</span>
                    <span className="font-semibold">{course.maxClasses}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

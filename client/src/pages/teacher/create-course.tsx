import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Home, Plus, BookOpen } from 'lucide-react';
import { Link } from 'wouter';
import Navigation from '@/components/navigation';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function CreateCourse() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(true);
  
  // Fetch existing courses
  const { data: existingCourses = [], isLoading } = useQuery<any[]>({
    queryKey: [`/api/teacher/courses?teacherId=teacher@codeconnect.com`],
  });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    duration: '',
    price: '',
    difficulty: '',
    maxStudents: '',
    prerequisites: ''
  });

  const createCourseMutation = useMutation({
    mutationFn: async (courseData: any) => {
      // For now, using a demo teacher ID. In production, this would come from authentication
      const teacherId = 'teacher@codeconnect.com';
      return apiRequest('POST', `/api/teacher/courses?teacherId=${teacherId}`, courseData);
    },
    onSuccess: (data) => {
      console.log('✅ Course creation successful:', data);
      toast({
        title: "Success",
        description: "Course created successfully!",
      });
      // Fix: Use the correct query key that matches the existing query
      queryClient.invalidateQueries({ queryKey: [`/api/teacher/courses?teacherId=teacher@codeconnect.com`] });
      // Reset form
      setFormData({
        title: '', description: '', category: '', duration: '', 
        price: '', difficulty: '', maxStudents: '', prerequisites: ''
      });
      console.log('✅ Toast triggered and form reset');
    },
    onError: (error) => {
      console.error('❌ Course creation failed:', error);
      toast({
        title: "Error",
        description: "Failed to create course. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.category) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createCourseMutation.mutate({
      ...formData,
      price: formData.price || "0", // Keep price as string for decimal field
      maxStudents: parseInt(formData.maxStudents) || 10
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Course Management</h1>
            <p className="text-gray-600 mt-2">Create and manage your teaching courses</p>
          </div>
          <Link href="/">
            <Button variant="outline" data-testid="button-home">
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </Link>
        </div>

        {/* Existing Courses Section */}
        {!isLoading && existingCourses.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Your Created Courses ({existingCourses.length})
              </CardTitle>
              <CardDescription>
                Manage your existing courses and create new ones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {existingCourses.map((course: any, index: number) => (
                  <div key={course.id || index} className="flex items-center justify-between p-4 border rounded-lg bg-white" data-testid={`course-row-${index}`}>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg" data-testid={`course-title-${index}`}>
                        {course.title || `Course ${index + 1}`}
                      </h3>
                      <p className="text-gray-600 text-sm" data-testid={`course-description-${index}`}>
                        {course.description || 'No description available'}
                      </p>
                      <div className="flex gap-4 mt-2 text-sm text-gray-500">
                        <span data-testid={`course-category-${index}`}>Category: {course.category || 'General'}</span>
                        <span data-testid={`course-price-${index}`}>Price: ₹{course.price || 0}</span>
                        <span data-testid={`course-duration-${index}`}>Duration: {course.duration || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => alert(`Edit Course: ${course.title || 'Untitled'}`)}
                        data-testid={`button-edit-course-${index}`}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => alert(`View Students: ${course.title || 'Untitled'}`)}
                        data-testid={`button-view-students-${index}`}
                      >
                        Students
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-center pt-4">
                  <Button 
                    onClick={() => setShowCreateForm(true)}
                    className="flex items-center gap-2"
                    data-testid="button-create-another-course"
                  >
                    <Plus className="w-4 h-4" />
                    Create Another Course
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create Course Form */}
        {(showCreateForm || existingCourses.length === 0) && (

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="w-5 h-5 mr-2" />
              Course Details
            </CardTitle>
            <CardDescription>
              Provide comprehensive information about your course
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Course Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Python for Beginners"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    data-testid="input-course-title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger data-testid="select-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="programming">Programming</SelectItem>
                      <SelectItem value="web-development">Web Development</SelectItem>
                      <SelectItem value="mobile-development">Mobile Development</SelectItem>
                      <SelectItem value="data-science">Data Science</SelectItem>
                      <SelectItem value="ai-ml">AI & Machine Learning</SelectItem>
                      <SelectItem value="cybersecurity">Cybersecurity</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty Level</Label>
                  <Select value={formData.difficulty} onValueChange={(value) => setFormData({ ...formData, difficulty: value })}>
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
                    data-testid="input-duration"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Price (₹)</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="2999"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    data-testid="input-price"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxStudents">Max Students</Label>
                  <Input
                    id="maxStudents"
                    type="number"
                    placeholder="10"
                    value={formData.maxStudents}
                    onChange={(e) => setFormData({ ...formData, maxStudents: e.target.value })}
                    data-testid="input-max-students"
                  />
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
                  data-testid="textarea-description"
                  required
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
                  data-testid="textarea-prerequisites"
                />
              </div>

              <div className="flex gap-4">
                <Button 
                  type="submit" 
                  disabled={createCourseMutation.isPending}
                  data-testid="button-create-course"
                  className="flex-1"
                >
                  {createCourseMutation.isPending ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Course
                    </>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setFormData({
                    title: '', description: '', category: '', duration: '', 
                    price: '', difficulty: '', maxStudents: '', prerequisites: ''
                  })}
                  data-testid="button-clear-form"
                >
                  Clear Form
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        )}
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Home, Plus, BookOpen, Edit2, Users } from 'lucide-react';
import { Link } from 'wouter';
import Navigation from '@/components/navigation';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

interface TimeSlot {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  isBlocked: boolean;
}

export default function CreateCourse() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(true);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [viewingStudents, setViewingStudents] = useState<any>(null);
  
  // Fetch existing courses
  const { data: existingCourses = [], isLoading } = useQuery<any[]>({
    queryKey: [`/api/teacher/courses?teacherId=${user?.id}`],
    enabled: !!user?.id,
  });

  // Fetch teacher's mentor ID
  const { data: mentorData } = useQuery<{id: string}>({
    queryKey: [`/api/mentors/by-user/${user?.id}`],
    enabled: !!user?.id
  });

  // Fetch teacher's availability schedule with real-time sync
  const { data: teacherSchedule = [] } = useQuery<TimeSlot[]>({
    queryKey: [`/api/teacher/schedule`],
    enabled: !!user?.id,
    refetchInterval: 5000, // Real-time sync every 5 seconds
  });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    feePerClass: '',
    maxClasses: '',
    prerequisites: '',
    track: '',
    startTime: '',
    startDate: '',
    sessionDuration: '55'
  });

  // Filter available time slots based on track selection
  const getAvailableTimeSlots = () => {
    if (!formData.track || !teacherSchedule.length) return [];
    
    const trackDays = formData.track === 'weekday' 
      ? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      : ['Saturday', 'Sunday'];
    
    return teacherSchedule
      .filter(slot => 
        trackDays.includes(slot.dayOfWeek) && 
        slot.isAvailable && 
        !slot.isBlocked
      )
      .map(slot => slot.startTime)
      .filter((time, index, self) => self.indexOf(time) === index) // Unique times
      .sort();
  };

  // Get minimum future date (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const availableTimes = getAvailableTimeSlots();

  const createCourseMutation = useMutation({
    mutationFn: async (courseData: any) => {
      const response = await apiRequest('POST', `/api/teacher/courses?teacherId=${user?.id}`, courseData);
      return await response.json();
    },
    onSuccess: async (data) => {
      console.log('✅ Course creation successful:', data);
      toast({
        title: "Success",
        description: "Course created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/teacher/courses?teacherId=${user?.id}`] });
      
      // Reset form
      setFormData({
        title: '', 
        description: '', 
        category: '', 
        feePerClass: '',
        maxClasses: '', 
        prerequisites: '',
        track: '', 
        startTime: '', 
        startDate: '', 
        sessionDuration: '55'
      });
    },
    onError: (error: any) => {
      console.error('❌ Course creation failed:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create course. Please try again.",
        variant: "destructive",
      });
    }
  });

  const updateCourseMutation = useMutation({
    mutationFn: async ({ courseId, courseData }: { courseId: string; courseData: any }) => {
      const response = await apiRequest('PATCH', `/api/courses/${courseId}`, courseData);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Course updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/teacher/courses?teacherId=${user?.id}`] });
      setEditingCourse(null);
    },
    onError: (error: any) => {
      console.error('❌ Course update failed:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update course. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Title validation
    const trimmedTitle = formData.title.trim();
    if (!trimmedTitle) {
      toast({
        title: "Title Required",
        description: "Please enter a course title.",
        variant: "destructive",
      });
      return;
    }

    if (trimmedTitle.length < 5) {
      toast({
        title: "Title Too Short",
        description: "Course title must be at least 5 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (trimmedTitle.length > 100) {
      toast({
        title: "Title Too Long",
        description: "Course title must be less than 100 characters.",
        variant: "destructive",
      });
      return;
    }

    // Description validation
    const trimmedDescription = formData.description.trim();
    if (!trimmedDescription) {
      toast({
        title: "Description Required",
        description: "Please provide a course description.",
        variant: "destructive",
      });
      return;
    }

    if (trimmedDescription.length < 20) {
      toast({
        title: "Description Too Short",
        description: "Course description must be at least 20 characters long.",
        variant: "destructive",
      });
      return;
    }

    // Category validation
    if (!formData.category) {
      toast({
        title: "Category Required",
        description: "Please select a category for your course.",
        variant: "destructive",
      });
      return;
    }

    // Fee per class validation
    if (!formData.feePerClass || !formData.feePerClass.trim()) {
      toast({
        title: "Fee Required",
        description: "Please enter a fee per class.",
        variant: "destructive",
      });
      return;
    }

    const feeValue = parseFloat(formData.feePerClass);
    if (isNaN(feeValue) || feeValue <= 0) {
      toast({
        title: "Invalid Fee",
        description: "Please enter a valid fee amount greater than 0.",
        variant: "destructive",
      });
      return;
    }

    if (feeValue > 999999) {
      toast({
        title: "Fee Too High",
        description: "Fee must be less than ₹999,999.",
        variant: "destructive",
      });
      return;
    }

    // Track validation
    if (!formData.track) {
      toast({
        title: "Track Required",
        description: "Please select when classes will be held (Weekday or Weekend).",
        variant: "destructive",
      });
      return;
    }

    // Start time validation
    if (!formData.startTime) {
      toast({
        title: "Start Time Required",
        description: "Please select a start time from your available schedule.",
        variant: "destructive",
      });
      return;
    }

    // Verify start time is in teacher's availability
    if (!availableTimes.includes(formData.startTime)) {
      toast({
        title: "Invalid Start Time",
        description: "Selected time is not in your available schedule. Please update your availability first.",
        variant: "destructive",
      });
      return;
    }

    // Start date validation
    if (!formData.startDate) {
      toast({
        title: "Start Date Required",
        description: "Please select a future start date for the first class.",
        variant: "destructive",
      });
      return;
    }

    const selectedDate = new Date(formData.startDate);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    if (selectedDate < tomorrow) {
      toast({
        title: "Invalid Start Date",
        description: "Start date must be at least tomorrow or later.",
        variant: "destructive",
      });
      return;
    }

    // Number of classes validation
    if (!formData.maxClasses || !formData.maxClasses.trim()) {
      toast({
        title: "Number of Classes Required",
        description: "Please enter the number of classes.",
        variant: "destructive",
      });
      return;
    }

    const maxClassesValue = parseInt(formData.maxClasses);
    if (isNaN(maxClassesValue)) {
      toast({
        title: "Invalid Number of Classes",
        description: "Please enter a valid number for classes.",
        variant: "destructive",
      });
      return;
    }

    if (maxClassesValue < 1) {
      toast({
        title: "Invalid Number of Classes",
        description: "Number of classes must be at least 1.",
        variant: "destructive",
      });
      return;
    }

    if (maxClassesValue > 8) {
      toast({
        title: "Too Many Classes",
        description: "Maximum number of classes cannot exceed 8.",
        variant: "destructive",
      });
      return;
    }

    // Start Time validation - must be on the hour (HH:00)
    const [hours, minutes] = formData.startTime.split(':');
    if (minutes !== '00') {
      toast({
        title: "Invalid Start Time",
        description: "Start time must be on the hour (e.g., 09:00, 10:00). Minutes must be :00.",
        variant: "destructive",
      });
      return;
    }

    createCourseMutation.mutate({
      title: trimmedTitle,
      description: trimmedDescription,
      category: formData.category,
      price: feeValue,
      maxStudents: 8, // Fixed at 8
      maxClasses: maxClassesValue,
      sessionDuration: parseInt(formData.sessionDuration) || 55,
      prerequisites: formData.prerequisites || '',
      track: formData.track,
      startTime: formData.startTime,
      startDate: formData.startDate,
    });
  };

  // Handle number of classes input with max 8 validation
  const handleMaxClassesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = parseInt(value);
    
    if (value === '' || (numValue >= 1 && numValue <= 8)) {
      setFormData({ ...formData, maxClasses: value });
    } else if (numValue > 8) {
      toast({
        title: "Maximum Limit",
        description: "Maximum number of classes is 8.",
        variant: "destructive",
      });
      setFormData({ ...formData, maxClasses: '8' });
    }
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
                        <span data-testid={`course-price-${index}`}>Fee: ₹{course.price || 0}/class</span>
                        <span data-testid={`course-classes-${index}`}>Classes: {course.maxClasses || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setEditingCourse(course)}
                        data-testid={`button-edit-course-${index}`}
                      >
                        <Edit2 className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setViewingStudents(course)}
                        data-testid={`button-view-students-${index}`}
                      >
                        <Users className="w-4 h-4 mr-1" />
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
                    placeholder="e.g., JavaScript Fundamentals"
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
                  <Label htmlFor="feePerClass">Fee per class (₹) *</Label>
                  <Input
                    id="feePerClass"
                    type="number"
                    placeholder="500"
                    min="1"
                    step="0.01"
                    value={formData.feePerClass}
                    onChange={(e) => setFormData({ ...formData, feePerClass: e.target.value })}
                    data-testid="input-fee-per-class"
                    required
                  />
                  <p className="text-sm text-gray-500">Amount charged per session</p>
                </div>
              </div>

              {/* Track Definition Section */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Course Schedule (Track Definition)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="track">Track *</Label>
                    <Select value={formData.track} onValueChange={(value) => setFormData({ ...formData, track: value, startTime: '' })}>
                      <SelectTrigger data-testid="select-track">
                        <SelectValue placeholder="Select track" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekday">Weekday (Mon-Fri)</SelectItem>
                        <SelectItem value="weekend">Weekend (Sat/Sun)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-500">Choose when classes will be held</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time (HH:00) *</Label>
                    <Select 
                      value={formData.startTime} 
                      onValueChange={(value) => setFormData({ ...formData, startTime: value })}
                      disabled={!formData.track}
                    >
                      <SelectTrigger data-testid="select-start-time">
                        <SelectValue placeholder={formData.track ? "Select time" : "Select track first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTimes.length === 0 ? (
                          <div className="p-2 text-sm text-gray-500">
                            {formData.track 
                              ? "No available slots. Update your schedule." 
                              : "Select a track first"}
                          </div>
                        ) : (
                          availableTimes.map(time => (
                            <SelectItem key={time} value={time}>{time}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-500">Must exist in your availability</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      min={getMinDate()}
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      data-testid="input-start-date"
                      required
                    />
                    <p className="text-sm text-gray-500">First class date (must be future)</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sessionDuration">Session Duration (minutes)</Label>
                    <Input
                      id="sessionDuration"
                      type="number"
                      placeholder="55"
                      min="15"
                      max="120"
                      value={formData.sessionDuration}
                      onChange={(e) => setFormData({ ...formData, sessionDuration: e.target.value })}
                      data-testid="input-session-duration"
                    />
                    <p className="text-sm text-gray-500">Default: 55 minutes per class</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxClasses">Number of Classes *</Label>
                    <Input
                      id="maxClasses"
                      type="number"
                      placeholder="8"
                      min="1"
                      max="8"
                      value={formData.maxClasses}
                      onChange={handleMaxClassesChange}
                      data-testid="input-max-classes"
                      required
                    />
                    <p className="text-sm text-gray-500">Total sessions in this course (max 8)</p>
                  </div>
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
                    title: '', description: '', category: '', feePerClass: '',
                    maxClasses: '', prerequisites: '',
                    track: '', startTime: '', startDate: '', sessionDuration: '55'
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

        {/* Edit Course Dialog */}
        <Dialog open={!!editingCourse} onOpenChange={(open) => !open && setEditingCourse(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Course</DialogTitle>
              <DialogDescription>Update course details</DialogDescription>
            </DialogHeader>
            {editingCourse && (
              <form onSubmit={(e) => {
                e.preventDefault();
                updateCourseMutation.mutate({
                  courseId: editingCourse.id,
                  courseData: {
                    title: editingCourse.title,
                    description: editingCourse.description,
                    category: editingCourse.category,
                    price: editingCourse.price,
                    maxClasses: editingCourse.maxClasses,
                    prerequisites: editingCourse.prerequisites
                  }
                });
              }} className="space-y-4">
                <div>
                  <Label htmlFor="edit-title">Course Title</Label>
                  <Input
                    id="edit-title"
                    value={editingCourse.title || ''}
                    onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editingCourse.description || ''}
                    onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })}
                    rows={4}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-category">Category</Label>
                    <Select value={editingCourse.category || ''} onValueChange={(value) => setEditingCourse({ ...editingCourse, category: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="programming">Programming</SelectItem>
                        <SelectItem value="web-development">Web Development</SelectItem>
                        <SelectItem value="mobile-development">Mobile Development</SelectItem>
                        <SelectItem value="data-science">Data Science</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-price">Fee per Class (₹)</Label>
                    <Input
                      id="edit-price"
                      type="number"
                      value={editingCourse.price || ''}
                      onChange={(e) => setEditingCourse({ ...editingCourse, price: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setEditingCourse(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateCourseMutation.isPending}>
                    {updateCourseMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* View Students Dialog */}
        <Dialog open={!!viewingStudents} onOpenChange={(open) => !open && setViewingStudents(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Enrolled Students</DialogTitle>
              <DialogDescription>
                Students enrolled in {viewingStudents?.title}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>No students enrolled yet</p>
                <p className="text-sm mt-2">Students will appear here after enrolling in your course</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

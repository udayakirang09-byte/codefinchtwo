import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Settings,
  Save,
  Home,
  CheckCircle,
  Link as LinkIcon,
  Eye,
  EyeOff
} from 'lucide-react';
import { Link } from 'wouter';
import Navigation from '@/components/navigation';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface FooterLinks {
  studentCommunity: boolean;
  mentorCommunity: boolean;
  successStories: boolean;
  achievementBadges: boolean;
  discussionForums: boolean;
  projectShowcase: boolean;
  communityEvents: boolean;
  teacherResources: boolean;
  contactUs: boolean;
}

interface StudentDashboardLinks {
  browseCourses: boolean;
}

interface TeacherDashboardLinks {
  createCourse: boolean;
  courseDetails: boolean;
}

interface UiConfig {
  footerLinks: FooterLinks;
  showHelpCenter: boolean;
  abusiveLanguageMonitoring: boolean;
  studentDashboardLinks: StudentDashboardLinks;
  teacherDashboardLinks: TeacherDashboardLinks;
}

export default function AdminUiConfig() {
  const { toast } = useToast();
  const [hasChanges, setHasChanges] = useState(false);

  // Form state
  const [footerLinks, setFooterLinks] = useState<FooterLinks>({
    studentCommunity: true,
    mentorCommunity: true,
    successStories: true,
    achievementBadges: true,
    discussionForums: true,
    projectShowcase: true,
    communityEvents: true,
    teacherResources: true,
    contactUs: true,
  });

  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [abusiveLanguageMonitoring, setAbusiveLanguageMonitoring] = useState(false);
  
  const [studentDashboardLinks, setStudentDashboardLinks] = useState<StudentDashboardLinks>({
    browseCourses: true,
  });
  
  const [teacherDashboardLinks, setTeacherDashboardLinks] = useState<TeacherDashboardLinks>({
    createCourse: true,
    courseDetails: true,
  });

  // Fetch current UI configuration
  const { data: uiConfig, isLoading, error } = useQuery<UiConfig>({
    queryKey: ['/api/admin/ui-config'],
    queryFn: async () => {
      const result = await apiRequest('GET', '/api/admin/ui-config');
      return result as unknown as UiConfig;
    },
    staleTime: 1000 * 60 * 5,
  });

  // Sync state when config loads
  useEffect(() => {
    if (uiConfig) {
      setFooterLinks(uiConfig.footerLinks);
      setShowHelpCenter(uiConfig.showHelpCenter);
      setAbusiveLanguageMonitoring(uiConfig.abusiveLanguageMonitoring || false);
      setStudentDashboardLinks(uiConfig.studentDashboardLinks || { browseCourses: true });
      setTeacherDashboardLinks(uiConfig.teacherDashboardLinks || { createCourse: true, courseDetails: true });
      setHasChanges(false);
    }
  }, [uiConfig]);

  // Update UI config mutation
  const updateConfigMutation = useMutation({
    mutationFn: async (config: { 
      footerLinks: FooterLinks; 
      showHelpCenter: boolean; 
      abusiveLanguageMonitoring: boolean;
      studentDashboardLinks: StudentDashboardLinks;
      teacherDashboardLinks: TeacherDashboardLinks;
    }) => {
      const response = await apiRequest('PUT', '/api/admin/ui-config', config);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Configuration Updated",
        description: "UI settings have been saved successfully!",
      });
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ui-config'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Update Configuration",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const handleFooterLinkToggle = (key: keyof FooterLinks) => {
    setFooterLinks(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    setHasChanges(true);
  };

  const handleHelpCenterToggle = () => {
    setShowHelpCenter(prev => !prev);
    setHasChanges(true);
  };

  const handleAbusiveLanguageMonitoringToggle = () => {
    setAbusiveLanguageMonitoring(prev => !prev);
    setHasChanges(true);
  };

  const handleStudentDashboardLinkToggle = (key: keyof StudentDashboardLinks) => {
    setStudentDashboardLinks(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    setHasChanges(true);
  };

  const handleTeacherDashboardLinkToggle = (key: keyof TeacherDashboardLinks) => {
    setTeacherDashboardLinks(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateConfigMutation.mutate({ 
      footerLinks, 
      showHelpCenter, 
      abusiveLanguageMonitoring,
      studentDashboardLinks,
      teacherDashboardLinks,
    });
  };

  const handleReset = () => {
    if (uiConfig) {
      setFooterLinks(uiConfig.footerLinks);
      setShowHelpCenter(uiConfig.showHelpCenter);
      setAbusiveLanguageMonitoring(uiConfig.abusiveLanguageMonitoring || false);
      setStudentDashboardLinks(uiConfig.studentDashboardLinks || { browseCourses: true });
      setTeacherDashboardLinks(uiConfig.teacherDashboardLinks || { createCourse: true, courseDetails: true });
      setHasChanges(false);
    }
  };

  const footerLinkItems = [
    { key: 'studentCommunity' as const, label: 'Student Community', section: 'For Students' },
    { key: 'achievementBadges' as const, label: 'Achievement Badges', section: 'For Students' },
    { key: 'discussionForums' as const, label: 'Discussion Forums', section: 'For Students' },
    { key: 'projectShowcase' as const, label: 'Project Showcase', section: 'For Students' },
    { key: 'communityEvents' as const, label: 'Community Events', section: 'For Students' },
    { key: 'mentorCommunity' as const, label: 'Mentor Community', section: 'For Mentors' },
    { key: 'teacherResources' as const, label: 'Teacher Resources', section: 'For Mentors' },
    { key: 'successStories' as const, label: 'Success Stories', section: 'For Mentors' },
    { key: 'contactUs' as const, label: 'Contact Us', section: 'Support' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 mt-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
              <Link href="/" data-testid="link-home">
                <Home className="h-4 w-4 hover:text-primary cursor-pointer" />
              </Link>
              <span>/</span>
              <Link href="/admin/home" data-testid="link-admin">Admin</Link>
              <span>/</span>
              <span>UI Configuration</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground" data-testid="text-page-title">
              UI Configuration
            </h1>
            <p className="text-muted-foreground">
              Control visibility of footer links and Quick Actions elements
            </p>
          </div>
          {hasChanges && (
            <Alert className="w-auto">
              <AlertDescription className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                You have unsaved changes
              </AlertDescription>
            </Alert>
          )}
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load UI configuration. Please refresh the page or contact support if the issue persists.
            </AlertDescription>
          </Alert>
        ) : isLoading ? (
          <div className="flex items-center justify-center p-16">
            <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Footer Links Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="h-5 w-5" />
                  Footer Links Visibility
                </CardTitle>
                <CardDescription>
                  Toggle visibility of individual links in the footer section. 
                  Links like "Find a Mentor", "Browse Courses", and "Privacy Policy" are always visible.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Group by section */}
                <div className="space-y-6">
                  {/* For Students Section */}
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                      For Students Section
                    </h3>
                    <div className="space-y-3">
                      {footerLinkItems
                        .filter(item => item.section === 'For Students')
                        .map(item => (
                          <div
                            key={item.key}
                            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                          >
                            <Label htmlFor={item.key} className="cursor-pointer flex-1">
                              {item.label}
                            </Label>
                            <Switch
                              id={item.key}
                              checked={footerLinks?.[item.key] || false}
                              onCheckedChange={() => handleFooterLinkToggle(item.key)}
                              data-testid={`switch-footer-${item.key}`}
                            />
                          </div>
                        ))}
                    </div>
                  </div>

                  <Separator />

                  {/* For Mentors Section */}
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                      For Mentors Section
                    </h3>
                    <div className="space-y-3">
                      {footerLinkItems
                        .filter(item => item.section === 'For Mentors')
                        .map(item => (
                          <div
                            key={item.key}
                            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                          >
                            <Label htmlFor={item.key} className="cursor-pointer flex-1">
                              {item.label}
                            </Label>
                            <Switch
                              id={item.key}
                              checked={footerLinks?.[item.key] || false}
                              onCheckedChange={() => handleFooterLinkToggle(item.key)}
                              data-testid={`switch-footer-${item.key}`}
                            />
                          </div>
                        ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Support Section */}
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                      Support Section
                    </h3>
                    <div className="space-y-3">
                      {footerLinkItems
                        .filter(item => item.section === 'Support')
                        .map(item => (
                          <div
                            key={item.key}
                            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                          >
                            <Label htmlFor={item.key} className="cursor-pointer flex-1">
                              {item.label}
                            </Label>
                            <Switch
                              id={item.key}
                              checked={footerLinks?.[item.key] || false}
                              onCheckedChange={() => handleFooterLinkToggle(item.key)}
                              data-testid={`switch-footer-${item.key}`}
                            />
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {showHelpCenter ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                  Quick Actions Visibility
                </CardTitle>
                <CardDescription>
                  Control which elements appear in the Quick Actions section on Teacher and Student dashboards
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                  <div className="flex-1">
                    <Label htmlFor="help-center" className="cursor-pointer text-base font-medium">
                      Help Center Button
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Show or hide the Help Center button in the Quick Actions section
                    </p>
                  </div>
                  <Switch
                    id="help-center"
                    checked={showHelpCenter}
                    onCheckedChange={handleHelpCenterToggle}
                    data-testid="switch-help-center"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Security & Monitoring Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-red-500" />
                  Security & Monitoring
                </CardTitle>
                <CardDescription>
                  Configure security and monitoring features for video sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                  <div className="flex-1">
                    <Label htmlFor="abusive-language" className="cursor-pointer text-base font-medium">
                      Abusive Language Monitoring
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Enable real-time detection of abusive language in video session chats. 
                      When enabled, admins will receive immediate notifications via red blinking alert and email when offensive words are detected.
                    </p>
                  </div>
                  <Switch
                    id="abusive-language"
                    checked={abusiveLanguageMonitoring}
                    onCheckedChange={handleAbusiveLanguageMonitoringToggle}
                    data-testid="switch-abusive-language-monitoring"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Student Dashboard Links Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="h-5 w-5 text-purple-600" />
                  Student Dashboard Links
                </CardTitle>
                <CardDescription>
                  Control which action buttons appear on the Student Dashboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                    <div className="flex-1">
                      <Label htmlFor="student-browse-courses" className="cursor-pointer text-base font-medium">
                        Browse Courses
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Show or hide the "Browse Courses" button in Student Dashboard Quick Actions
                      </p>
                    </div>
                    <Switch
                      id="student-browse-courses"
                      checked={studentDashboardLinks.browseCourses}
                      onCheckedChange={() => handleStudentDashboardLinkToggle('browseCourses')}
                      data-testid="switch-student-browse-courses"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Teacher Dashboard Links Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="h-5 w-5 text-green-600" />
                  Teacher Dashboard Links
                </CardTitle>
                <CardDescription>
                  Control which action buttons appear on the Teacher Dashboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                    <div className="flex-1">
                      <Label htmlFor="teacher-create-course" className="cursor-pointer text-base font-medium">
                        Create Course
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Show or hide the "Create Course" button in Teacher Dashboard Quick Actions
                      </p>
                    </div>
                    <Switch
                      id="teacher-create-course"
                      checked={teacherDashboardLinks.createCourse}
                      onCheckedChange={() => handleTeacherDashboardLinkToggle('createCourse')}
                      data-testid="switch-teacher-create-course"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                    <div className="flex-1">
                      <Label htmlFor="teacher-course-details" className="cursor-pointer text-base font-medium">
                        Course Details
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Show or hide the "Course Details" button in Teacher Dashboard Quick Actions
                      </p>
                    </div>
                    <Switch
                      id="teacher-course-details"
                      checked={teacherDashboardLinks.courseDetails}
                      onCheckedChange={() => handleTeacherDashboardLinkToggle('courseDetails')}
                      data-testid="switch-teacher-course-details"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-4">
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={!hasChanges || updateConfigMutation.isPending}
                data-testid="button-reset"
              >
                Reset
              </Button>
              <Button
                onClick={handleSave}
                disabled={!hasChanges || updateConfigMutation.isPending}
                data-testid="button-save"
              >
                {updateConfigMutation.isPending ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

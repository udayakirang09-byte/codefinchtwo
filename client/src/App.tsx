import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
// import { DebugPanel } from "@/components/debug-panel";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import MentorProfile from "@/pages/mentor-profile";
import Booking from "@/pages/booking";
import BookingCheckout from "@/pages/booking-checkout";
import BookingSuccess from "@/pages/booking-success";
import Courses from "@/pages/courses";
import Help from "@/pages/help";
import SystemTest from "@/pages/system-test";
import SimpleTest from "@/pages/simple-test";
import ComprehensiveSystemTest from "@/pages/comprehensive-system-test";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import ForgotPassword from "@/pages/forgot-password";
import Setup2FA from "@/pages/setup-2fa";
import Mentors from "@/pages/mentors";
import StudentProgress from "@/pages/student/progress";
import VideoClass from "@/pages/video-class/[id]";
import ChatClass from "@/pages/chat/[id]";
import FeedbackForm from "@/pages/feedback/[id]";
import Checkout from "@/pages/checkout";
import Payment from "@/pages/payment";
import PaymentSuccess from "@/pages/payment-success";
import StudentCommunity from "@/pages/student-community";
import AchievementBadges from "@/pages/achievement-badges";
import UserManagement from "./pages/admin/user-management";
import MentorApproval from "./pages/admin/mentor-approval";
import TeacherMediaApproval from "./pages/admin/teacher-media-approval";
import ActiveClasses from "./pages/student/active-classes";
import AllActiveClasses from "./pages/student/all-active-classes";
import LearningHours from "./pages/student/learning-hours";
import CompletedClasses from "./pages/student/completed-classes";
import MyPackages from "./pages/student/my-packages";
import SchedulePackage from "./pages/student/schedule-package";
import CreateCourse from "./pages/teacher/create-course";
import EditCourse from "./pages/teacher/edit-course";
import ViewCourse from "./pages/teacher/view-course";
import TeacherAllActiveClasses from "./pages/teacher/all-active-classes";
import TeacherCompletedClasses from "./pages/teacher/completed-classes";
import ManageSchedule from "./pages/teacher/manage-schedule";
import EditPersonalInfo from "./pages/teacher/edit-personal-info";
import Manage2FA from "./pages/teacher/manage-2fa";
import Terms from "./pages/terms";
import Privacy from "./pages/privacy";
import CancellationPolicy from "./pages/cancellation-policy";
import Shipping from "./pages/shipping";
import ContactUs from "./pages/contact-us";
import AutomatedTest from "./pages/automated-test";
import TeacherResources from "./pages/teacher-resources";
import MentorCommunity from "./pages/mentor-community";
import SuccessStories from "./pages/success-stories";
import SafetyGuidelines from "./pages/safety-guidelines";
import AdminAnalytics from "./pages/admin/analytics";
import CloudDeployments from "./pages/admin/cloud-deployments";
import TeacherDashboard from "./components/dashboard/teacher-dashboard";
import AdminDashboard from "./components/dashboard/admin-dashboard";
import StudentDashboard from "./components/dashboard/student-dashboard";
import CodeMapping from "./pages/admin/code-mapping";
import TestManagement from "./pages/admin/test-management";
import LoadTestingGuide from "./pages/admin/load-testing-guide";
import PaymentConfig from "./pages/admin/payment-config";
import UiConfig from "./pages/admin/ui-config";
import BookingLimitsConfig from "./pages/admin/booking-limits-config";
import FinanceDashboard from "./pages/admin/finance-dashboard";
import StorageConfig from "./pages/admin/storage-config";
import AbusiveIncidentsPage from "./pages/admin/abusive-incidents";
import AzureMetrics from "./pages/admin/azure-metrics";
import AzureMetricsDetail from "./pages/admin/azure-metrics-detail";
import ModerationReview from "./pages/admin/moderation-review";
import ReviewAppeals from "./pages/admin/review-appeals";
import WhitelistManagement from "./pages/admin/whitelist-management";
import TeacherPaymentConfig from "./pages/teacher/payment-config";
import TeacherModerationStatus from "./pages/teacher/moderation-status";
import TeacherAppealRestriction from "./pages/teacher/appeal-restriction";
import Forums from "./pages/forums";
import Projects from "./pages/projects";
import Events from "./pages/events";
import Recordings from "./pages/recordings";
import CourseEnrollment from "./pages/course-enrollment";
import CourseCheckout from "./pages/course-checkout";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/home" component={Home} />
      <Route path="/mentors" component={Mentors} />
      <Route path="/mentors/:id" component={MentorProfile} />
      <Route path="/booking/:mentorId" component={Booking} />
      <Route path="/booking-checkout" component={BookingCheckout} />
      <Route path="/booking-success" component={BookingSuccess} />
      <Route path="/courses" component={Courses} />
      <Route path="/course-enrollment/:courseId" component={CourseEnrollment} />
      <Route path="/course-checkout" component={CourseCheckout} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/payment" component={Payment} />
      <Route path="/payment-success" component={PaymentSuccess} />
      <Route path="/student-community" component={StudentCommunity} />
      <Route path="/forums" component={Forums} />
      <Route path="/projects" component={Projects} />
      <Route path="/events" component={Events} />
      <Route path="/achievement-badges" component={AchievementBadges} />
      <Route path="/help" component={Help} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/teacher" component={TeacherDashboard} />
      <Route path="/student" component={StudentDashboard} />
      <Route path="/admin/user-management" component={UserManagement} />
      <Route path="/admin/mentor-approval" component={MentorApproval} />
      <Route path="/admin/teacher-media-approval" component={TeacherMediaApproval} />
      <Route path="/admin/analytics" component={AdminAnalytics} />
      <Route path="/admin/payment-config" component={PaymentConfig} />
      <Route path="/admin/ui-config" component={UiConfig} />
      <Route path="/admin/booking-limits-config" component={BookingLimitsConfig} />
      <Route path="/admin/finance-dashboard" component={FinanceDashboard} />
      <Route path="/admin/storage-config" component={StorageConfig} />
      <Route path="/admin/cloud-deployments" component={CloudDeployments} />
      <Route path="/admin/code-mapping" component={CodeMapping} />
      <Route path="/admin/test-management" component={TestManagement} />
      <Route path="/admin/load-testing" component={LoadTestingGuide} />
      <Route path="/admin/abusive-incidents" component={AbusiveIncidentsPage} />
      <Route path="/admin/moderation-review" component={ModerationReview} />
      <Route path="/admin/review-appeals" component={ReviewAppeals} />
      <Route path="/admin/whitelist-management" component={WhitelistManagement} />
      <Route path="/admin/azure-metrics" component={AzureMetrics} />
      <Route path="/admin/azure-metrics/:severity" component={AzureMetricsDetail} />
      <Route path="/teacher/payment-config" component={TeacherPaymentConfig} />
      <Route path="/teacher/moderation-status" component={TeacherModerationStatus} />
      <Route path="/teacher/appeal-restriction" component={TeacherAppealRestriction} />
      <Route path="/student/active-classes" component={ActiveClasses} />
      <Route path="/student/all-active-classes" component={AllActiveClasses} />
      <Route path="/student/learning-hours" component={LearningHours} />
      <Route path="/student/completed-classes" component={CompletedClasses} />
      <Route path="/student/my-packages" component={MyPackages} />
      <Route path="/schedule-package/:packageId" component={SchedulePackage} />
      <Route path="/recordings" component={Recordings} />
      <Route path="/teacher/create-course" component={CreateCourse} />
      <Route path="/teacher/courses/:id/edit" component={EditCourse} />
      <Route path="/teacher/courses/:id" component={ViewCourse} />
      <Route path="/teacher/all-active-classes" component={TeacherAllActiveClasses} />
      <Route path="/teacher/completed-classes" component={TeacherCompletedClasses} />
      <Route path="/teacher/manage-schedule" component={ManageSchedule} />
      <Route path="/teacher/edit-personal-info" component={EditPersonalInfo} />
      <Route path="/teacher/manage-2fa" component={Manage2FA} />
      <Route path="/student/progress" component={StudentProgress} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/cancellation-policy" component={CancellationPolicy} />
      <Route path="/shipping" component={Shipping} />
      <Route path="/contact-us" component={ContactUs} />
      <Route path="/video-class/:id" component={VideoClass} />
      <Route path="/chat/:id" component={ChatClass} />
      <Route path="/feedback/:id" component={FeedbackForm} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/setup-2fa" component={Setup2FA} />
      <Route path="/system-test" component={SystemTest} />
      <Route path="/comprehensive-test" component={ComprehensiveSystemTest} />
      <Route path="/simple-test" component={SimpleTest} />
      <Route path="/automated-test" component={AutomatedTest} />
      <Route path="/teacher-resources" component={TeacherResources} />
      <Route path="/mentor-community" component={MentorCommunity} />
      <Route path="/success-stories" component={SuccessStories} />
      <Route path="/safety-guidelines" component={SafetyGuidelines} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
        {/* <DebugPanel /> */}
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

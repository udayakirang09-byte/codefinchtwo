import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DebugPanel } from "@/components/debug-panel";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import MentorProfile from "@/pages/mentor-profile";
import Booking from "@/pages/booking";
import Courses from "@/pages/courses";
import Help from "@/pages/help";
import SystemTest from "@/pages/system-test";
import SimpleTest from "@/pages/simple-test";
import ComprehensiveSystemTest from "@/pages/comprehensive-system-test";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import ForgotPassword from "@/pages/forgot-password";
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
import ActiveClasses from "./pages/student/active-classes";
import LearningHours from "./pages/student/learning-hours";
import CreateCourse from "./pages/teacher/create-course";
import ManageSchedule from "./pages/teacher/manage-schedule";
import Terms from "./pages/terms";
import Privacy from "./pages/privacy";
import AutomatedTest from "./pages/automated-test";
import TeacherResources from "./pages/teacher-resources";
import MentorCommunity from "./pages/mentor-community";
import SuccessStories from "./pages/success-stories";
import SafetyGuidelines from "./pages/safety-guidelines";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/mentors" component={Mentors} />
      <Route path="/mentors/:id" component={MentorProfile} />
      <Route path="/booking/:mentorId" component={Booking} />
      <Route path="/courses" component={Courses} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/payment" component={Payment} />
      <Route path="/payment-success" component={PaymentSuccess} />
      <Route path="/student-community" component={StudentCommunity} />
      <Route path="/achievement-badges" component={AchievementBadges} />
      <Route path="/help" component={Help} />
      <Route path="/admin/user-management" component={UserManagement} />
      <Route path="/admin/mentor-approval" component={MentorApproval} />
      <Route path="/student/active-classes" component={ActiveClasses} />
      <Route path="/student/learning-hours" component={LearningHours} />
      <Route path="/teacher/create-course" component={CreateCourse} />
      <Route path="/teacher/manage-schedule" component={ManageSchedule} />
      <Route path="/student/progress" component={StudentProgress} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/video-class/:id" component={VideoClass} />
      <Route path="/chat/:id" component={ChatClass} />
      <Route path="/feedback/:id" component={FeedbackForm} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/forgot-password" component={ForgotPassword} />
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
        <DebugPanel />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

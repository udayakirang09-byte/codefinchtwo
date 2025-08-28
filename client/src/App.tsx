import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
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

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/mentors" component={Mentors} />
      <Route path="/mentors/:id" component={MentorProfile} />
      <Route path="/booking/:mentorId" component={Booking} />
      <Route path="/courses" component={Courses} />
      <Route path="/help" component={Help} />
      <Route path="/student/progress" component={StudentProgress} />
      <Route path="/video-class/:id" component={VideoClass} />
      <Route path="/chat/:id" component={ChatClass} />
      <Route path="/feedback/:id" component={FeedbackForm} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/system-test" component={SystemTest} />
      <Route path="/comprehensive-test" component={ComprehensiveSystemTest} />
      <Route path="/simple-test" component={SimpleTest} />
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
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

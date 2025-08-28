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

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/mentors/:id" component={MentorProfile} />
      <Route path="/booking/:mentorId" component={Booking} />
      <Route path="/courses" component={Courses} />
      <Route path="/help" component={Help} />
      <Route path="/system-test" component={SystemTest} />
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

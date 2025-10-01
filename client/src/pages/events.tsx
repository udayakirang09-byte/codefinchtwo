import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Plus, Clock, User, MapPin, Users, DollarSign, Tag } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface EventCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
}

interface Event {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  organizerId: string;
  startDate: string;
  endDate: string;
  location: string;
  capacity?: number;
  price?: string;
  difficulty: string;
  tags?: string[];
  isPublished: boolean;
  isFeatured: boolean;
  isLive: boolean;
  createdAt: string;
  updatedAt: string;
  registeredCount: number;
  category?: EventCategory;
}

export default function Events() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    categoryId: "",
    startDate: "",
    endDate: "",
    location: "Online",
    difficulty: "beginner",
    tags: "",
    price: ""
  });
  const { toast } = useToast();

  // Fetch event categories
  const { data: categories = [] } = useQuery<EventCategory[]>({
    queryKey: ['/api/events/categories']
  });

  // Fetch events
  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ['/api/events', selectedCategory, selectedDifficulty],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory !== "all") params.append("category", selectedCategory);
      if (selectedDifficulty !== "all") params.append("difficulty", selectedDifficulty);
      params.append("published", "true");
      
      const response = await fetch(`/api/events?${params}`);
      return response.json();
    }
  });

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: (eventData: any) => apiRequest('POST', '/api/events', {
      ...eventData,
      tags: eventData.tags ? eventData.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) : []
      // Server will determine organizerId from session
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      setIsCreateEventOpen(false);
      setNewEvent({
        title: "",
        description: "",
        categoryId: "",
        startDate: "",
        endDate: "",
        location: "Online",
        difficulty: "beginner",
        tags: "",
        price: ""
      });
      toast({
        title: "Event created!",
        description: "Your event has been created successfully."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleCreateEvent = () => {
    // Comprehensive validation
    // Title validation
    const trimmedTitle = newEvent.title.trim();
    if (!trimmedTitle) {
      toast({
        title: "Title Required",
        description: "Please enter an event title.",
        variant: "destructive"
      });
      return;
    }

    if (trimmedTitle.length < 5) {
      toast({
        title: "Title Too Short",
        description: "Event title must be at least 5 characters long.",
        variant: "destructive"
      });
      return;
    }

    if (trimmedTitle.length > 100) {
      toast({
        title: "Title Too Long",
        description: "Event title must be less than 100 characters.",
        variant: "destructive"
      });
      return;
    }

    // Description validation
    const trimmedDescription = newEvent.description.trim();
    if (!trimmedDescription) {
      toast({
        title: "Description Required",
        description: "Please provide an event description.",
        variant: "destructive"
      });
      return;
    }

    if (trimmedDescription.length < 20) {
      toast({
        title: "Description Too Short",
        description: "Event description must be at least 20 characters long.",
        variant: "destructive"
      });
      return;
    }

    // Category validation
    if (!newEvent.categoryId) {
      toast({
        title: "Category Required",
        description: "Please select an event category.",
        variant: "destructive"
      });
      return;
    }

    // Date validation
    if (!newEvent.startDate) {
      toast({
        title: "Start Date Required",
        description: "Please select a start date and time.",
        variant: "destructive"
      });
      return;
    }

    if (!newEvent.endDate) {
      toast({
        title: "End Date Required",
        description: "Please select an end date and time.",
        variant: "destructive"
      });
      return;
    }

    const startDate = new Date(newEvent.startDate);
    const endDate = new Date(newEvent.endDate);
    const now = new Date();

    if (startDate < now) {
      toast({
        title: "Invalid Start Date",
        description: "Event start date must be in the future.",
        variant: "destructive"
      });
      return;
    }

    if (endDate <= startDate) {
      toast({
        title: "Invalid End Date",
        description: "Event end date must be after the start date.",
        variant: "destructive"
      });
      return;
    }

    // Location validation
    if (!newEvent.location.trim()) {
      toast({
        title: "Location Required",
        description: "Please specify the event location.",
        variant: "destructive"
      });
      return;
    }

    // Price validation (optional but if provided must be valid)
    if (newEvent.price && newEvent.price.trim()) {
      const priceValue = newEvent.price.trim();
      if (priceValue.toLowerCase() !== 'free' && !/^\$?\d+(\.\d{1,2})?$/.test(priceValue)) {
        toast({
          title: "Invalid Price",
          description: "Price must be 'Free' or a valid amount (e.g., $10, 50, 25.99).",
          variant: "destructive"
        });
        return;
      }
    }

    createEventMutation.mutate(newEvent);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      case 'all': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isEventUpcoming = (startDate: string) => {
    return new Date(startDate) > new Date();
  };

  const isEventLive = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    return now >= start && now <= end;
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6" data-testid="text-events-title">
            Community <span className="text-gradient">Events</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="text-events-description">
            Join coding challenges, workshops, hackathons, and meetups to learn and connect with the community.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={selectedCategory === "all" ? "default" : "outline"}
              onClick={() => setSelectedCategory("all")}
              data-testid="filter-all-categories"
            >
              All Events
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.id)}
                data-testid={`filter-${category.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {category.name}
              </Button>
            ))}
          </div>

          <div className="flex gap-2">
            <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <SelectTrigger className="w-[150px]" data-testid="select-difficulty">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>

            <Dialog open={isCreateEventOpen} onOpenChange={setIsCreateEventOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-event">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Event
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl" data-testid="dialog-create-event">
                <DialogHeader>
                  <DialogTitle>Create New Event</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Event title"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                    data-testid="input-event-title"
                  />
                  
                  <Select 
                    value={newEvent.categoryId} 
                    onValueChange={(value) => setNewEvent({...newEvent, categoryId: value})}
                  >
                    <SelectTrigger data-testid="select-event-category">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Textarea
                    placeholder="Describe the event and what participants will learn"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                    rows={4}
                    data-testid="textarea-event-description"
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Start Date & Time</label>
                      <Input
                        type="datetime-local"
                        value={newEvent.startDate}
                        onChange={(e) => setNewEvent({...newEvent, startDate: e.target.value})}
                        data-testid="input-event-start-date"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">End Date & Time</label>
                      <Input
                        type="datetime-local"
                        value={newEvent.endDate}
                        onChange={(e) => setNewEvent({...newEvent, endDate: e.target.value})}
                        data-testid="input-event-end-date"
                      />
                    </div>
                  </div>

                  <Input
                    placeholder="Location (e.g., Online, New York, etc.)"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                    data-testid="input-event-location"
                  />

                  <Select 
                    value={newEvent.difficulty} 
                    onValueChange={(value) => setNewEvent({...newEvent, difficulty: value})}
                  >
                    <SelectTrigger data-testid="select-event-difficulty">
                      <SelectValue placeholder="Target audience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder="Price (optional, e.g., Free, $10, $50)"
                    value={newEvent.price}
                    onChange={(e) => setNewEvent({...newEvent, price: e.target.value})}
                    data-testid="input-event-price"
                  />
                  
                  <Input
                    placeholder="Tags (comma separated)"
                    value={newEvent.tags}
                    onChange={(e) => setNewEvent({...newEvent, tags: e.target.value})}
                    data-testid="input-event-tags"
                  />
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreateEventOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreateEvent}
                      disabled={createEventMutation.isPending}
                      data-testid="button-submit-event"
                    >
                      {createEventMutation.isPending ? "Creating..." : "Create Event"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-gray-200 rounded mb-4"></div>
                  <div className="flex gap-2 mb-4">
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : events.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No events yet</h3>
              <p className="text-muted-foreground">Be the first to create an amazing event!</p>
            </div>
          ) : (
            events.map((event) => (
              <Card key={event.id} className="hover:shadow-lg transition-shadow" data-testid={`event-${event.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {event.isFeatured && <Badge variant="secondary">Featured</Badge>}
                        {isEventLive(event.startDate, event.endDate) && (
                          <Badge className="bg-red-500 text-white animate-pulse">Live</Badge>
                        )}
                        {event.category && (
                          <Badge variant="outline" style={{ backgroundColor: event.category.color }}>
                            {event.category.name}
                          </Badge>
                        )}
                        <Badge className={getDifficultyColor(event.difficulty)}>
                          {event.difficulty}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg" data-testid={`event-title-${event.id}`}>
                        {event.title}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4 line-clamp-3" data-testid={`event-description-${event.id}`}>
                    {event.description}
                  </p>
                  
                  <div className="space-y-2 mb-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{formatDate(event.startDate)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{event.location}</span>
                    </div>
                    {event.price && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        <span>{event.price}</span>
                      </div>
                    )}
                  </div>
                  
                  {event.tags && event.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {event.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          <Tag className="mr-1 h-3 w-3" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>Host {event.organizerId.slice(-1)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{event.registeredCount || 0} registered</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="flex-1"
                      disabled={!isEventUpcoming(event.startDate)}
                      data-testid={`event-register-${event.id}`}
                    >
                      {isEventUpcoming(event.startDate) ? "Register" : "Past Event"}
                    </Button>
                    {isEventLive(event.startDate, event.endDate) && (
                      <Button size="sm" variant="secondary" data-testid={`event-join-${event.id}`}>
                        Join Now
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
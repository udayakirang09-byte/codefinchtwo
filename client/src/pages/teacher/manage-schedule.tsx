import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, Home, Plus, Edit, Trash2 } from 'lucide-react';
import { Link } from 'wouter';
import Navigation from '@/components/navigation';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { apiRequest } from '@/lib/queryClient';

interface TimeSlot {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  isRecurring: boolean;
}

export default function ManageSchedule() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newSlot, setNewSlot] = useState({
    dayOfWeek: '',
    startTime: '',
    endTime: '',
    isRecurring: true
  });
  
  // Get authenticated user email from localStorage
  const userEmail = localStorage.getItem('userEmail') || 'teacher@codeconnect.com';

  const { data: schedule = [], isLoading } = useQuery({
    queryKey: ['teacher-schedule'],
    queryFn: async () => {
      const response = await fetch('/api/teacher/schedule');
      if (!response.ok) throw new Error('Failed to fetch schedule');
      return response.json();
    }
  });

  const updateSlotMutation = useMutation({
    mutationFn: async ({ slotId, updates }: { slotId: string; updates: any }) => {
      const response = await fetch(`/api/teacher/schedule/${slotId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Failed to update slot');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-schedule'] });
      toast({
        title: "Success",
        description: "Schedule updated successfully",
      });
    }
  });


  const toggleAvailability = (slotId: string, currentStatus: boolean) => {
    updateSlotMutation.mutate({ 
      slotId, 
      updates: { isAvailable: !currentStatus } 
    });
  };

  const deleteSlotMutation = useMutation({
    mutationFn: async (slotId: string) => {
      const response = await fetch(`/api/teacher/schedule/${slotId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete slot');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-schedule'] });
      toast({
        title: "Success",
        description: "Time slot deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete time slot",
        variant: "destructive",
      });
    }
  });

  const deleteTimeSlot = (slotId: string) => {
    if (confirm('Are you sure you want to delete this time slot?')) {
      deleteSlotMutation.mutate(slotId);
    }
  };

  const createSlotMutation = useMutation({
    mutationFn: async (slotData: typeof newSlot) => {
      return await apiRequest('POST', '/api/teacher/schedule', {
        ...slotData,
        teacherId: userEmail
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-schedule'] });
      setIsAddDialogOpen(false);
      setNewSlot({
        dayOfWeek: '',
        startTime: '',
        endTime: '',
        isRecurring: true
      });
      toast({
        title: "Success",
        description: "Time slot created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create time slot",
        variant: "destructive",
      });
    }
  });

  const addNewTimeSlot = () => {
    setIsAddDialogOpen(true);
  };

  const handleCreateSlot = () => {
    // Validate required fields
    if (!newSlot.dayOfWeek || !newSlot.startTime || !newSlot.endTime) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    // Validate time range
    if (newSlot.startTime >= newSlot.endTime) {
      toast({
        title: "Invalid Time Range",
        description: "End time must be after start time",
        variant: "destructive",
      });
      return;
    }
    
    createSlotMutation.mutate(newSlot);
  };

  const groupedByDay = schedule.reduce((acc: any, slot: TimeSlot) => {
    if (!acc[slot.dayOfWeek]) {
      acc[slot.dayOfWeek] = [];
    }
    acc[slot.dayOfWeek].push(slot);
    return acc;
  }, {});

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Manage Schedule</h1>
            <p className="text-gray-600 mt-2">Set your availability and manage time slots</p>
          </div>
          <div className="flex gap-3">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="flex items-center gap-2"
                  data-testid="button-add-time-slot"
                >
                  <Plus className="w-4 h-4" />
                  Add Time Slot
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Time Slot</DialogTitle>
                  <DialogDescription>
                    Create a new time slot for your teaching schedule.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="dayOfWeek">Day of Week</Label>
                    <Select
                      value={newSlot.dayOfWeek}
                      onValueChange={(value) => setNewSlot({ ...newSlot, dayOfWeek: value })}
                    >
                      <SelectTrigger data-testid="select-day">
                        <SelectValue placeholder="Select a day" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Monday">Monday</SelectItem>
                        <SelectItem value="Tuesday">Tuesday</SelectItem>
                        <SelectItem value="Wednesday">Wednesday</SelectItem>
                        <SelectItem value="Thursday">Thursday</SelectItem>
                        <SelectItem value="Friday">Friday</SelectItem>
                        <SelectItem value="Saturday">Saturday</SelectItem>
                        <SelectItem value="Sunday">Sunday</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="startTime">Start Time</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={newSlot.startTime}
                        onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                        data-testid="input-start-time"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="endTime">End Time</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={newSlot.endTime}
                        onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                        data-testid="input-end-time"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isRecurring"
                      checked={newSlot.isRecurring}
                      onCheckedChange={(checked) => setNewSlot({ ...newSlot, isRecurring: checked })}
                      data-testid="switch-recurring"
                    />
                    <Label htmlFor="isRecurring">Recurring weekly</Label>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateSlot}
                    disabled={createSlotMutation.isPending}
                    data-testid="button-create-slot"
                  >
                    {createSlotMutation.isPending ? 'Creating...' : 'Create Slot'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Link href="/">
              <Button variant="outline" data-testid="button-home">
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="mt-4 text-gray-600">Loading your schedule...</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {daysOfWeek.map((day) => (
              <Card key={day}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    {day}
                  </CardTitle>
                  <CardDescription>
                    {groupedByDay[day] ? `${groupedByDay[day].length} time slots` : 'No slots scheduled'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {groupedByDay[day] ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {groupedByDay[day].map((slot: TimeSlot) => (
                        <div
                          key={slot.id}
                          className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                            slot.isAvailable 
                              ? 'border-green-200 bg-green-50 hover:border-green-300' 
                              : 'border-red-200 bg-red-50 hover:border-red-300'
                          }`}
                          data-testid={`slot-${slot.id}`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center text-gray-700">
                              <Clock className="w-4 h-4 mr-2" />
                              <span className="font-medium">
                                {slot.startTime} - {slot.endTime}
                              </span>
                            </div>
                            <Badge variant={slot.isAvailable ? "default" : "secondary"}>
                              {slot.isAvailable ? 'Available' : 'Booked'}
                            </Badge>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={slot.isAvailable ? "outline" : "default"}
                              onClick={() => toggleAvailability(slot.id, slot.isAvailable)}
                              disabled={updateSlotMutation.isPending}
                              data-testid={`button-toggle-${slot.id}`}
                            >
                              {slot.isAvailable ? 'Block' : 'Unblock'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              data-testid={`button-edit-${slot.id}`}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => deleteTimeSlot(slot.id)}
                              data-testid={`button-delete-${slot.id}`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                          
                          {slot.isRecurring && (
                            <div className="mt-2 text-xs text-gray-500">
                              📅 Recurring weekly
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No time slots for {day}</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-3" 
                        onClick={addNewTimeSlot}
                        data-testid={`button-add-${day.toLowerCase()}`}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Slot
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
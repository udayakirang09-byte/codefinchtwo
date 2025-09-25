import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CheckCircle, XCircle, Clock, Eye, Star, Languages } from 'lucide-react';
import Navigation from '@/components/navigation';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface MentorApplication {
  id: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    profileImage?: string;
  };
  bio: string;
  expertise: string[];
  experience: string;
  pricing: number;
  languages: string[];
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: string;
  resumeUrl?: string;
  portfolioUrl?: string;
}

export default function MentorApproval() {
  const [statusFilter, setStatusFilter] = useState('pending');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['mentor-applications', statusFilter],
    queryFn: async () => {
      const response = await fetch(`/api/admin/mentor-applications?status=${statusFilter}`);
      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }
      return response.json();
    }
  });

  const updateApplicationMutation = useMutation({
    mutationFn: async ({ applicationId, status, feedback }: { 
      applicationId: string; 
      status: 'approved' | 'rejected'; 
      feedback?: string 
    }) => {
      return apiRequest('PATCH', `/api/admin/mentor-applications/${applicationId}`, {
        status,
        feedback
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentor-applications'] });
      toast({
        title: "Success",
        description: "Application status updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update application status",
        variant: "destructive",
      });
    }
  });

  const handleApprove = (applicationId: string) => {
    updateApplicationMutation.mutate({ 
      applicationId, 
      status: 'approved',
      feedback: 'Congratulations! Your mentor application has been approved.' 
    });
  };

  const handleReject = (applicationId: string) => {
    const feedback = prompt('Please provide feedback for rejection:');
    if (feedback) {
      updateApplicationMutation.mutate({ 
        applicationId, 
        status: 'rejected',
        feedback 
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Mentor Applications</h1>
          <p className="text-gray-600 mt-2">Review and approve mentor applications</p>
        </div>

        <div className="flex gap-4 mb-6">
          {['pending', 'approved', 'rejected'].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              onClick={() => setStatusFilter(status)}
              data-testid={`button-filter-${status}`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Applications 
              ({applications.length})
            </CardTitle>
            <CardDescription>
              Review mentor applications and make approval decisions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                <p className="mt-2 text-gray-600">Loading applications...</p>
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No {statusFilter} applications found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Expertise</TableHead>
                    <TableHead>Experience</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Pricing</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((application: MentorApplication) => (
                    <TableRow key={application.id} data-testid={`row-application-${application.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={application.user.profileImage} />
                            <AvatarFallback>
                              {application.user.firstName[0]}{application.user.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {application.user.firstName} {application.user.lastName}
                            </div>
                            <div className="text-sm text-gray-600">
                              {application.user.email}
                            </div>
                            {application.languages && (
                              <div className="flex items-center gap-1 mt-1">
                                <Languages className="w-3 h-3 text-gray-400" />
                                <span className="text-xs text-gray-500">
                                  {application.languages.join(', ')}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {application.expertise.slice(0, 3).map((skill, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {application.expertise.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{application.expertise.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {application.experience.substring(0, 50)}...
                        </div>
                      </TableCell>
                      <TableCell data-testid={`cell-country-${application.id}`}>
                        <div className="text-sm">
                          {application.country || 'NA-Country'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          ₹{application.pricing}/hr
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(application.status)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {new Date(application.appliedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            data-testid={`button-view-${application.id}`}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {application.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleApprove(application.id)}
                                className="bg-green-600 hover:bg-green-700"
                                data-testid={`button-approve-${application.id}`}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReject(application.id)}
                                className="text-red-600 hover:text-red-700"
                                data-testid={`button-reject-${application.id}`}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
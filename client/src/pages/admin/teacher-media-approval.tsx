import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, XCircle, Image as ImageIcon, Video } from 'lucide-react';
import Navigation from '@/components/navigation';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface TeacherMedia {
  id: string;
  mentorId: string;
  photoBlobUrl: string | null;
  videoBlobUrl: string | null;
  photoValidationStatus: string | null;
  videoValidationStatus: string | null;
  uploadedAt: string;
  mentor: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

export default function TeacherMediaApproval() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: config, isLoading: configLoading } = useQuery<{ approvalRequired: boolean }>({
    queryKey: ['/api/admin/teacher-media-config']
  });

  const { data: pendingMedia = [], isLoading } = useQuery<TeacherMedia[]>({
    queryKey: ['/api/admin/teacher-media/pending']
  });

  // Helper function to convert Azure Blob URL to proxied URL
  const getProxiedUrl = (blobUrl: string | null): string | null => {
    if (!blobUrl) return null;
    return `/api/media/proxy?url=${encodeURIComponent(blobUrl)}`;
  };

  const updateConfigMutation = useMutation({
    mutationFn: async (approvalRequired: boolean) => {
      return apiRequest('POST', '/api/admin/teacher-media-config', { approvalRequired });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/teacher-media-config'] });
      toast({
        title: "Success",
        description: "Configuration updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update configuration",
        variant: "destructive",
      });
    }
  });

  const approveMutation = useMutation({
    mutationFn: async ({ mentorId, photoApproved, videoApproved }: {
      mentorId: string;
      photoApproved?: boolean;
      videoApproved?: boolean;
    }) => {
      return apiRequest('POST', `/api/admin/teacher-media/${mentorId}/approve`, {
        photoApproved,
        videoApproved
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/teacher-media/pending'] });
      toast({
        title: "Success",
        description: "Teacher media approved and welcome email sent",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve teacher media",
        variant: "destructive",
      });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ mentorId, photoRejected, videoRejected, reason }: {
      mentorId: string;
      photoRejected?: boolean;
      videoRejected?: boolean;
      reason?: string;
    }) => {
      return apiRequest('POST', `/api/admin/teacher-media/${mentorId}/reject`, {
        photoRejected,
        videoRejected,
        reason
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/teacher-media/pending'] });
      toast({
        title: "Success",
        description: "Teacher media rejected",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject teacher media",
        variant: "destructive",
      });
    }
  });

  const handleApprovePhoto = (media: TeacherMedia) => {
    approveMutation.mutate({ 
      mentorId: media.mentorId, 
      photoApproved: true
    });
  };

  const handleApproveVideo = (media: TeacherMedia) => {
    approveMutation.mutate({ 
      mentorId: media.mentorId, 
      videoApproved: true
    });
  };

  const handleRejectPhoto = (media: TeacherMedia) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason) {
      rejectMutation.mutate({ 
        mentorId: media.mentorId, 
        photoRejected: true,
        reason
      });
    }
  };

  const handleRejectVideo = (media: TeacherMedia) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason) {
      rejectMutation.mutate({ 
        mentorId: media.mentorId, 
        videoRejected: true,
        reason
      });
    }
  };

  const handleConfigChange = (checked: boolean) => {
    updateConfigMutation.mutate(checked);
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return null;
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending Review</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-600">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Teacher Media Approval</h1>
          <p className="text-gray-600 mt-2">Review and approve teacher profile photos and videos</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Approval Settings</CardTitle>
            <CardDescription>Configure whether teacher media requires admin approval before being displayed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Switch
                id="approval-required"
                checked={config?.approvalRequired ?? true}
                onCheckedChange={handleConfigChange}
                disabled={configLoading || updateConfigMutation.isPending}
                data-testid="switch-approval-required"
              />
              <Label htmlFor="approval-required">
                Require admin approval for teacher photos and videos
              </Label>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {config?.approvalRequired 
                ? "Teacher media will be hidden until approved by an admin" 
                : "Teacher media will be displayed immediately after upload"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Media ({pendingMedia.length})</CardTitle>
            <CardDescription>Review teacher profile media awaiting approval</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Loading...</p>
            ) : pendingMedia.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No pending media to review</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Photo</TableHead>
                    <TableHead>Video</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingMedia.map((media: TeacherMedia) => (
                    <TableRow key={media.id}>
                      <TableCell className="font-medium">
                        {media.mentor.user.firstName} {media.mentor.user.lastName}
                      </TableCell>
                      <TableCell>{media.mentor.user.email}</TableCell>
                      <TableCell>
                        {media.photoBlobUrl ? (
                          <div className="space-y-2">
                            <img 
                              src={getProxiedUrl(media.photoBlobUrl) || ''} 
                              alt="Teacher" 
                              className="w-20 h-20 object-cover rounded"
                              data-testid={`img-teacher-photo-${media.id}`}
                            />
                            <div className="flex items-center gap-2">
                              {getStatusBadge(media.photoValidationStatus)}
                              {media.photoValidationStatus === 'pending' && (
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleApprovePhoto(media)}
                                    disabled={approveMutation.isPending}
                                    data-testid={`button-approve-photo-${media.mentorId}`}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleRejectPhoto(media)}
                                    disabled={rejectMutation.isPending}
                                    data-testid={`button-reject-photo-${media.mentorId}`}
                                  >
                                    <XCircle className="w-4 h-4 mr-1" />
                                    Reject
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">No photo</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {media.videoBlobUrl ? (
                          <div className="space-y-2">
                            <video 
                              src={getProxiedUrl(media.videoBlobUrl) || ''} 
                              className="w-40 h-24 rounded"
                              controls
                              data-testid={`video-teacher-intro-${media.id}`}
                            />
                            <div className="flex items-center gap-2">
                              {getStatusBadge(media.videoValidationStatus)}
                              {media.videoValidationStatus === 'pending' && (
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleApproveVideo(media)}
                                    disabled={approveMutation.isPending}
                                    data-testid={`button-approve-video-${media.mentorId}`}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleRejectVideo(media)}
                                    disabled={rejectMutation.isPending}
                                    data-testid={`button-reject-video-${media.mentorId}`}
                                  >
                                    <XCircle className="w-4 h-4 mr-1" />
                                    Reject
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">No video</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(media.uploadedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {media.photoValidationStatus === 'pending' && media.videoValidationStatus === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => approveMutation.mutate({ 
                              mentorId: media.mentorId, 
                              photoApproved: true,
                              videoApproved: true
                            })}
                            disabled={approveMutation.isPending}
                            data-testid={`button-approve-both-${media.mentorId}`}
                          >
                            Approve All
                          </Button>
                        )}
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

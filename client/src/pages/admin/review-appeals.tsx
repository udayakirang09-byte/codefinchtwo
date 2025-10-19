import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Clock, FileText, AlertTriangle } from 'lucide-react';
import Navigation from '@/components/navigation';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface TeacherRestrictionAppeal {
  id: string;
  teacherId: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  adminReviewNotes: string | null;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  teacherName?: string;
  teacherEmail?: string;
  restrictionType?: 'warned' | 'suspended' | 'banned';
  restrictionReason?: string;
}

export default function ReviewAppeals() {
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [selectedAppeal, setSelectedAppeal] = useState<TeacherRestrictionAppeal | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewDecision, setReviewDecision] = useState<'approved' | 'rejected'>('approved');
  const [reviewNotes, setReviewNotes] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: appeals = [], isLoading } = useQuery<TeacherRestrictionAppeal[]>({
    queryKey: ['admin-appeals'],
    queryFn: async () => {
      const response = await fetch('/api/admin/appeals');
      if (!response.ok) {
        throw new Error('Failed to fetch appeals');
      }
      return response.json();
    }
  });

  const reviewAppealMutation = useMutation({
    mutationFn: async ({ appealId, decision, notes }: { 
      appealId: string; 
      decision: 'approved' | 'rejected'; 
      notes: string 
    }) => {
      return apiRequest('POST', `/api/admin/appeals/${appealId}/review`, {
        decision,
        notes
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-appeals'] });
      toast({
        title: "Success",
        description: "Appeal review submitted successfully",
      });
      setReviewDialogOpen(false);
      setSelectedAppeal(null);
      setReviewNotes('');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit appeal review",
        variant: "destructive",
      });
    }
  });

  const openReviewDialog = (appeal: TeacherRestrictionAppeal, decision: 'approved' | 'rejected') => {
    setSelectedAppeal(appeal);
    setReviewDecision(decision);
    setReviewNotes('');
    setReviewDialogOpen(true);
  };

  const handleSubmitReview = () => {
    if (!selectedAppeal) return;
    
    if (!reviewNotes.trim()) {
      toast({
        title: "Error",
        description: "Please provide review notes",
        variant: "destructive",
      });
      return;
    }

    if (reviewNotes.trim().length > 2000) {
      toast({
        title: "Error",
        description: "Review notes must not exceed 2000 characters",
        variant: "destructive",
      });
      return;
    }

    reviewAppealMutation.mutate({
      appealId: selectedAppeal.id,
      decision: reviewDecision,
      notes: reviewNotes.trim()
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" data-testid={`badge-status-pending`}><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-600" data-testid={`badge-status-approved`}><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive" data-testid={`badge-status-rejected`}><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRestrictionBadge = (type?: string) => {
    if (!type) return null;
    
    switch (type) {
      case 'warned':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">⚠️ Warned</Badge>;
      case 'suspended':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">🚫 Suspended</Badge>;
      case 'banned':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">❌ Banned</Badge>;
      default:
        return null;
    }
  };

  const filteredAppeals = statusFilter === 'all' 
    ? appeals 
    : appeals.filter(appeal => appeal.status === statusFilter);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" data-testid="heading-review-appeals">
            Teacher Restriction Appeals
          </h1>
          <p className="text-gray-600 mt-1">
            Review and manage teacher appeals for restriction removals
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Appeals Management</CardTitle>
                <CardDescription>Review teacher appeals and make decisions</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === 'pending' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('pending')}
                  data-testid="button-filter-pending"
                >
                  <Clock className="w-4 h-4 mr-1" />
                  Pending ({appeals.filter(a => a.status === 'pending').length})
                </Button>
                <Button
                  variant={statusFilter === 'approved' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('approved')}
                  data-testid="button-filter-approved"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Approved ({appeals.filter(a => a.status === 'approved').length})
                </Button>
                <Button
                  variant={statusFilter === 'rejected' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('rejected')}
                  data-testid="button-filter-rejected"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Rejected ({appeals.filter(a => a.status === 'rejected').length})
                </Button>
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                  data-testid="button-filter-all"
                >
                  All ({appeals.length})
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-gray-500" data-testid="text-loading">
                Loading appeals...
              </div>
            ) : filteredAppeals.length === 0 ? (
              <div className="text-center py-8 text-gray-500" data-testid="text-no-appeals">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No {statusFilter !== 'all' ? statusFilter : ''} appeals found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Restriction</TableHead>
                    <TableHead>Appeal Reason</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAppeals.map((appeal) => (
                    <TableRow key={appeal.id} data-testid={`row-appeal-${appeal.id}`}>
                      <TableCell>
                        <div>
                          <div className="font-medium" data-testid={`text-teacher-name-${appeal.id}`}>
                            {appeal.teacherName || 'Unknown Teacher'}
                          </div>
                          <div className="text-sm text-gray-500" data-testid={`text-teacher-email-${appeal.id}`}>
                            {appeal.teacherEmail || 'No email'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {getRestrictionBadge(appeal.restrictionType)}
                          {appeal.restrictionReason && (
                            <p className="text-xs text-gray-500 max-w-xs truncate" title={appeal.restrictionReason}>
                              {appeal.restrictionReason}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm max-w-md truncate" title={appeal.reason} data-testid={`text-reason-${appeal.id}`}>
                          {appeal.reason}
                        </p>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600" data-testid={`text-submitted-${appeal.id}`}>
                          {format(new Date(appeal.createdAt), 'MMM dd, yyyy')}
                        </span>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(appeal.status)}
                      </TableCell>
                      <TableCell>
                        {appeal.status === 'pending' ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => openReviewDialog(appeal, 'approved')}
                              data-testid={`button-approve-${appeal.id}`}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => openReviewDialog(appeal, 'rejected')}
                              data-testid={`button-reject-${appeal.id}`}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <p className="text-xs text-gray-500">
                              Reviewed {appeal.reviewedAt ? format(new Date(appeal.reviewedAt), 'MMM dd, yyyy') : 'N/A'}
                            </p>
                            {appeal.adminReviewNotes && (
                              <p className="text-xs text-gray-600 max-w-xs truncate" title={appeal.adminReviewNotes}>
                                {appeal.adminReviewNotes}
                              </p>
                            )}
                          </div>
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

      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent data-testid="dialog-review-appeal">
          <DialogHeader>
            <DialogTitle>
              {reviewDecision === 'approved' ? (
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  Approve Appeal
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-700">
                  <XCircle className="w-5 h-5" />
                  Reject Appeal
                </div>
              )}
            </DialogTitle>
            <DialogDescription>
              {reviewDecision === 'approved' 
                ? 'Approving this appeal will remove the teacher\'s restriction and reset their violation count.' 
                : 'Rejecting this appeal will keep the teacher\'s restriction in place.'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedAppeal && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Teacher:</span>
                  <span className="text-sm">{selectedAppeal.teacherName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Current Restriction:</span>
                  {getRestrictionBadge(selectedAppeal.restrictionType)}
                </div>
                <div className="pt-2 border-t">
                  <span className="text-sm font-medium text-gray-700">Appeal Reason:</span>
                  <p className="text-sm text-gray-600 mt-1">{selectedAppeal.reason}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reviewNotes">
                  Review Notes <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="reviewNotes"
                  placeholder="Enter your review notes (required, max 2000 characters)..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={4}
                  maxLength={2000}
                  data-testid="textarea-review-notes"
                />
                <p className="text-xs text-gray-500">
                  {reviewNotes.length} / 2000 characters
                </p>
              </div>

              {reviewDecision === 'approved' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2">
                  <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">This action will:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Remove the teacher's current restriction</li>
                      <li>Reset their violation count to zero</li>
                      <li>Reactivate their account</li>
                      <li>Send an email notification to the teacher</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReviewDialogOpen(false)}
              disabled={reviewAppealMutation.isPending}
              data-testid="button-cancel-review"
            >
              Cancel
            </Button>
            <Button
              variant={reviewDecision === 'approved' ? 'default' : 'destructive'}
              onClick={handleSubmitReview}
              disabled={reviewAppealMutation.isPending || !reviewNotes.trim()}
              data-testid="button-submit-review"
            >
              {reviewAppealMutation.isPending ? 'Submitting...' : `Confirm ${reviewDecision === 'approved' ? 'Approval' : 'Rejection'}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

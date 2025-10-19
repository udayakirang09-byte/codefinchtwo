import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { AlertCircle, CheckCircle, Clock, XCircle, Send, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface Appeal {
  id: string;
  teacherId: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  adminReviewNotes: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function AppealRestriction() {
  const { toast } = useToast();
  const [reason, setReason] = useState('');

  // Fetch existing appeals
  const { data: appeals, isLoading: appealsLoading } = useQuery<Appeal[]>({
    queryKey: ['/api/teachers/appeals'],
  });

  // Submit appeal mutation
  const submitAppeal = useMutation({
    mutationFn: async (appealReason: string) => {
      return await apiRequest('POST', '/api/teachers/appeals', { reason: appealReason });
    },
    onSuccess: () => {
      toast({
        title: 'Appeal Submitted',
        description: 'Your appeal has been submitted successfully. An admin will review it shortly.',
      });
      setReason('');
      queryClient.invalidateQueries({ queryKey: ['/api/teachers/appeals'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Submission Failed',
        description: error.message || 'Failed to submit appeal. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedReason = reason.trim();
    
    if (trimmedReason.length < 20) {
      toast({
        title: 'Invalid Input',
        description: 'Appeal reason must be at least 20 characters.',
        variant: 'destructive',
      });
      return;
    }
    
    if (trimmedReason.length > 2000) {
      toast({
        title: 'Invalid Input',
        description: 'Appeal reason must not exceed 2000 characters.',
        variant: 'destructive',
      });
      return;
    }
    
    submitAppeal.mutate(trimmedReason);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const hasPendingAppeal = appeals?.some(appeal => appeal.status === 'pending');
  const characterCount = reason.length;
  const isValidLength = characterCount >= 20 && characterCount <= 2000;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Appeal Restriction</h1>
        <p className="text-muted-foreground">
          If you believe your restriction was issued in error, you can submit an appeal for admin review.
        </p>
      </div>

      {/* Submit Appeal Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Submit New Appeal
          </CardTitle>
          <CardDescription>
            Explain why you believe your restriction should be reviewed. Be clear and professional.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasPendingAppeal && (
            <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-300 dark:border-yellow-700 rounded-md">
              <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                <AlertCircle className="w-5 h-5" />
                <p className="font-medium">You already have a pending appeal.</p>
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Please wait for admin review before submitting another appeal.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Appeal Reason *</Label>
              <Textarea
                id="reason"
                data-testid="textarea-appeal-reason"
                placeholder="Explain why you believe this restriction should be reviewed. Include any relevant context or evidence."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={6}
                disabled={hasPendingAppeal || submitAppeal.isPending}
                className="resize-none"
              />
              <div className="flex items-center justify-between text-sm">
                <span className={`text-muted-foreground ${!isValidLength && characterCount > 0 ? 'text-red-600 dark:text-red-400' : ''}`}>
                  {characterCount}/2000 characters (minimum 20)
                </span>
                {characterCount > 0 && characterCount < 20 && (
                  <span className="text-red-600 dark:text-red-400 text-xs">
                    {20 - characterCount} more characters needed
                  </span>
                )}
              </div>
            </div>

            <Button
              type="submit"
              data-testid="button-submit-appeal"
              disabled={!isValidLength || hasPendingAppeal || submitAppeal.isPending}
              className="w-full"
            >
              {submitAppeal.isPending ? 'Submitting...' : 'Submit Appeal'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Appeal History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Appeal History
          </CardTitle>
          <CardDescription>
            View the status of your previous appeals.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {appealsLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading appeals...</div>
          ) : appeals && appeals.length > 0 ? (
            <div className="space-y-4">
              {appeals.map((appeal) => (
                <div
                  key={appeal.id}
                  data-testid={`card-appeal-${appeal.id}`}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(appeal.status)}
                      <span className="text-sm text-muted-foreground">
                        Submitted {format(new Date(appeal.createdAt), 'PPP')}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Your Appeal:</Label>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                      {appeal.reason}
                    </p>
                  </div>

                  {appeal.status !== 'pending' && appeal.adminReviewNotes && (
                    <div className="space-y-2 border-t pt-3">
                      <Label className="text-sm font-medium">Admin Response:</Label>
                      <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                        {appeal.adminReviewNotes}
                      </p>
                      {appeal.reviewedAt && (
                        <p className="text-xs text-muted-foreground">
                          Reviewed on {format(new Date(appeal.reviewedAt), 'PPP')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>You haven't submitted any appeals yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

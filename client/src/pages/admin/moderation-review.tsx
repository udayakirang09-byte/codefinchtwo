import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, CheckCircle, XCircle, AlertCircle, MessageSquare, Monitor, Mic, Film, Volume2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface RedactedMediaClip {
  clipId: string;
  sessionId: string;
  modality: 'video' | 'audio' | 'screen' | 'chat';
  startTime: number;
  duration: number;
  blobPath: string;
  redactedUrl?: string;
  redactionLevel: 'blur' | 'bleep' | 'mask';
  createdAt: Date;
}

interface SessionDossier {
  id: string;
  bookingId: string;
  sessionId: string;
  cumulativeRiskScore: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  totalIncidents: number;
  incidentsByModality: {
    chat: number;
    screen: number;
    audio: number;
  };
  crsJson: {
    totalIncidents: number;
    chatIncidents: number;
    screenIncidents: number;
    audioIncidents: number;
    maxTai: number;
    avgTai: number;
    hardViolations: number;
  };
  requiresReview: boolean;
  reviewedAt: string | null;
  reviewedBy: string | null;
  reviewNotes: string | null;
  actionTaken: string | null;
  createdAt: string;
}

const priorityConfig = {
  low: { color: 'bg-green-500', icon: CheckCircle, label: 'Low Risk' },
  medium: { color: 'bg-yellow-500', icon: AlertCircle, label: 'Medium Risk' },
  high: { color: 'bg-orange-500', icon: AlertTriangle, label: 'High Risk' },
  critical: { color: 'bg-red-500', icon: XCircle, label: 'Critical Risk' }
};

export default function ModerationReview() {
  const { toast } = useToast();
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedDossier, setSelectedDossier] = useState<SessionDossier | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionTaken, setActionTaken] = useState('');

  const { data: reviewQueue = [], isLoading } = useQuery<SessionDossier[]>({
    queryKey: ['/api/admin/moderation/review-queue', selectedPriority],
    queryFn: async () => {
      const url = selectedPriority !== 'all' 
        ? `/api/admin/moderation/review-queue?priority=${selectedPriority}`
        : '/api/admin/moderation/review-queue';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch review queue');
      return response.json();
    },
    enabled: true,
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ dossierId, notes, action }: { dossierId: string; notes: string; action: string }) => {
      return apiRequest(`/api/admin/moderation/review/${dossierId}`, 'POST', {
        reviewNotes: notes,
        actionTaken: action
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/moderation/review-queue'] });
      toast({
        title: "Review Submitted",
        description: "Session has been marked as reviewed successfully."
      });
      setSelectedDossier(null);
      setReviewNotes('');
      setActionTaken('');
    },
    onError: (error: any) => {
      toast({
        title: "Review Failed",
        description: error.message || "Failed to submit review. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleReview = () => {
    if (!selectedDossier) return;
    if (!reviewNotes.trim()) {
      toast({
        title: "Notes Required",
        description: "Please provide review notes before submitting.",
        variant: "destructive"
      });
      return;
    }

    reviewMutation.mutate({
      dossierId: selectedDossier.id,
      notes: reviewNotes,
      action: actionTaken
    });
  };

  const pendingQueue = reviewQueue.filter(d => !d.reviewedAt);
  const reviewedQueue = reviewQueue.filter(d => d.reviewedAt);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2" data-testid="text-page-title">
            AI Moderation Review Queue
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Review flagged sessions and take appropriate actions
          </p>
        </div>

        <div className="mb-6">
          <Label htmlFor="priority-filter" className="text-sm font-medium mb-2 block">
            Filter by Priority
          </Label>
          <Select value={selectedPriority} onValueChange={setSelectedPriority}>
            <SelectTrigger id="priority-filter" className="w-[200px]" data-testid="select-priority-filter">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="pending" data-testid="tab-pending">
              Pending Review ({pendingQueue.length})
            </TabsTrigger>
            <TabsTrigger value="reviewed" data-testid="tab-reviewed">
              Reviewed ({reviewedQueue.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {isLoading ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-gray-500">Loading review queue...</p>
                </CardContent>
              </Card>
            ) : pendingQueue.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                  <p className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    All Clear!
                  </p>
                  <p className="text-gray-500">
                    No sessions pending review at this time.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {pendingQueue.map((dossier) => (
                  <DossierCard
                    key={dossier.id}
                    dossier={dossier}
                    onSelect={() => setSelectedDossier(dossier)}
                    isSelected={selectedDossier?.id === dossier.id}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reviewed">
            {reviewedQueue.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-gray-500">No reviewed sessions yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {reviewedQueue.map((dossier) => (
                  <DossierCard
                    key={dossier.id}
                    dossier={dossier}
                    onSelect={() => setSelectedDossier(dossier)}
                    isSelected={selectedDossier?.id === dossier.id}
                    reviewed
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {selectedDossier && (
          <Card className="mt-8 border-2 border-blue-500">
            <CardHeader>
              <CardTitle>Review Session</CardTitle>
              <CardDescription>
                Provide your review notes and actions taken for this session
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Session Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Booking ID:</span>
                    <span className="ml-2 font-mono">{selectedDossier.bookingId}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">CRS:</span>
                    <span className="ml-2 font-semibold">{selectedDossier.cumulativeRiskScore.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Total Incidents:</span>
                    <span className="ml-2">{selectedDossier.totalIncidents}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Hard Violations:</span>
                    <span className="ml-2 text-red-600 font-semibold">{selectedDossier.crsJson.hardViolations}</span>
                  </div>
                </div>
              </div>

              <MediaClipsSection dossierId={selectedDossier.id} />

              {!selectedDossier.reviewedAt && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="action-taken">Action Taken</Label>
                    <Select value={actionTaken} onValueChange={setActionTaken}>
                      <SelectTrigger id="action-taken" data-testid="select-action-taken">
                        <SelectValue placeholder="Select action" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no_action">No Action Required</SelectItem>
                        <SelectItem value="warning_sent">Warning Sent to Teacher</SelectItem>
                        <SelectItem value="account_suspended">Account Suspended</SelectItem>
                        <SelectItem value="escalated">Escalated to Legal Team</SelectItem>
                        <SelectItem value="false_positive">False Positive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="review-notes">Review Notes *</Label>
                    <Textarea
                      id="review-notes"
                      data-testid="textarea-review-notes"
                      placeholder="Enter your detailed review notes here..."
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      rows={6}
                      className="resize-none"
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button
                      onClick={handleReview}
                      disabled={reviewMutation.isPending}
                      data-testid="button-submit-review"
                    >
                      {reviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedDossier(null)}
                      data-testid="button-cancel-review"
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              )}

              {selectedDossier.reviewedAt && (
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 dark:text-green-300 mb-2">
                    Reviewed
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Reviewed At:</span>
                      <span className="ml-2">{format(new Date(selectedDossier.reviewedAt), 'PPpp')}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Action Taken:</span>
                      <span className="ml-2 font-semibold">{selectedDossier.actionTaken || 'None specified'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Notes:</span>
                      <p className="mt-1 text-gray-900 dark:text-white">{selectedDossier.reviewNotes}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function MediaClipsSection({ dossierId }: { dossierId: string }) {
  const { data: mediaClips, isLoading: isLoadingClips, isError, error, refetch } = useQuery<RedactedMediaClip[]>({
    queryKey: ['/api/admin/moderation/dossiers', dossierId, 'media-clips'],
    queryFn: async () => {
      const response = await fetch(`/api/admin/moderation/dossiers/${dossierId}/media-clips`);
      if (!response.ok) throw new Error('Failed to fetch media clips');
      return response.json();
    },
    enabled: !!dossierId,
    retry: 1,
  });

  if (isLoadingClips) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Redacted Media Clips</h3>
        <p className="text-sm text-gray-500">Loading media clips...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
        <h3 className="font-semibold text-red-800 dark:text-red-300 mb-2">
          Error Loading Media Clips
        </h3>
        <p className="text-sm text-red-700 dark:text-red-400 mb-3">
          {error instanceof Error ? error.message : 'Failed to retrieve media clips. This could be due to a network issue or server error.'}
        </p>
        <Button 
          onClick={() => refetch()} 
          variant="outline" 
          size="sm"
          className="bg-white dark:bg-gray-800"
          data-testid="button-retry-media-clips"
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!mediaClips || mediaClips.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Redacted Media Clips</h3>
        <p className="text-sm text-gray-500">No flagged media clips for this session</p>
      </div>
    );
  }

  const videoClips = mediaClips.filter(c => c.modality === 'video' || c.modality === 'screen');
  const audioClips = mediaClips.filter(c => c.modality === 'audio');
  const chatClips = mediaClips.filter(c => c.modality === 'chat');

  return (
    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-4">
      <h3 className="font-semibold mb-2">Redacted Media Clips ({mediaClips.length})</h3>
      <p className="text-xs text-gray-500 mb-4">
        Video and audio clips are automatically redacted (blurred/beeped). Max 30 seconds per clip.
      </p>

      {videoClips.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Film className="w-4 h-4 text-purple-500" />
            <span>Video/Screen Clips ({videoClips.length})</span>
          </div>
          <div className="grid gap-3">
            {videoClips.map((clip) => (
              <div 
                key={clip.clipId} 
                className="bg-white dark:bg-gray-700 p-3 rounded border border-gray-200 dark:border-gray-600"
                data-testid={`media-clip-${clip.clipId}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="text-xs">
                    {clip.modality} • {clip.duration}s • {clip.redactionLevel}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {format(new Date(clip.startTime * 1000), 'mm:ss')}
                  </span>
                </div>
                {clip.redactedUrl ? (
                  <video 
                    controls 
                    className="w-full max-w-md rounded"
                    data-testid={`video-player-${clip.clipId}`}
                  >
                    <source src={clip.redactedUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="bg-gray-100 dark:bg-gray-600 p-8 rounded text-center text-sm text-gray-500">
                    Media clip processing...
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {audioClips.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Volume2 className="w-4 h-4 text-orange-500" />
            <span>Audio Clips ({audioClips.length})</span>
          </div>
          <div className="grid gap-3">
            {audioClips.map((clip) => (
              <div 
                key={clip.clipId} 
                className="bg-white dark:bg-gray-700 p-3 rounded border border-gray-200 dark:border-gray-600"
                data-testid={`media-clip-${clip.clipId}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="text-xs">
                    {clip.modality} • {clip.duration}s • {clip.redactionLevel}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {format(new Date(clip.startTime * 1000), 'mm:ss')}
                  </span>
                </div>
                {clip.redactedUrl ? (
                  <audio 
                    controls 
                    className="w-full"
                    data-testid={`audio-player-${clip.clipId}`}
                  >
                    <source src={clip.redactedUrl} type="audio/mp3" />
                    Your browser does not support the audio element.
                  </audio>
                ) : (
                  <div className="bg-gray-100 dark:bg-gray-600 p-4 rounded text-center text-sm text-gray-500">
                    Audio clip processing...
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {chatClips.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <MessageSquare className="w-4 h-4 text-blue-500" />
            <span>Chat Clips ({chatClips.length})</span>
          </div>
          <div className="grid gap-3">
            {chatClips.map((clip) => (
              <div 
                key={clip.clipId} 
                className="bg-white dark:bg-gray-700 p-3 rounded border border-gray-200 dark:border-gray-600"
                data-testid={`media-clip-${clip.clipId}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="text-xs">
                    {clip.modality} • {clip.redactionLevel}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {format(new Date(clip.startTime * 1000), 'mm:ss')}
                  </span>
                </div>
                <div className="bg-gray-100 dark:bg-gray-600 p-4 rounded text-sm font-mono">
                  {clip.blobPath || '[Redacted text content]'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DossierCard({ 
  dossier, 
  onSelect, 
  isSelected,
  reviewed = false
}: { 
  dossier: SessionDossier; 
  onSelect: () => void; 
  isSelected: boolean;
  reviewed?: boolean;
}) {
  const config = priorityConfig[dossier.priority];
  const Icon = config.icon;

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-lg ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      }`}
      onClick={onSelect}
      data-testid={`card-dossier-${dossier.id}`}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Badge className={`${config.color} text-white`}>
                <Icon className="w-3 h-3 mr-1" />
                {config.label}
              </Badge>
              <span className="text-sm text-gray-500">
                {format(new Date(dossier.createdAt), 'PPp')}
              </span>
            </div>
            <CardTitle className="text-lg">
              Session #{dossier.bookingId.substring(0, 8)}
            </CardTitle>
            <CardDescription>
              CRS: {dossier.cumulativeRiskScore.toFixed(2)} • {dossier.totalIncidents} incidents
            </CardDescription>
          </div>
          
          {reviewed && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
              <CheckCircle className="w-3 h-3 mr-1" />
              Reviewed
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-500" />
            <div>
              <p className="text-xs text-gray-500">Chat</p>
              <p className="text-sm font-semibold">{dossier.crsJson.chatIncidents} incidents</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4 text-purple-500" />
            <div>
              <p className="text-xs text-gray-500">Screen</p>
              <p className="text-sm font-semibold">{dossier.crsJson.screenIncidents} incidents</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-orange-500" />
            <div>
              <p className="text-xs text-gray-500">Audio</p>
              <p className="text-sm font-semibold">{dossier.crsJson.audioIncidents} incidents</p>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Max TAI:</span>
            <span className="ml-2 font-semibold">{dossier.crsJson.maxTai.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Hard Violations:</span>
            <span className="ml-2 font-semibold text-red-600">{dossier.crsJson.hardViolations}</span>
          </div>
        </div>

        {reviewed && dossier.actionTaken && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-gray-500 mb-1">Action Taken:</p>
            <p className="text-sm font-medium">{dossier.actionTaken}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

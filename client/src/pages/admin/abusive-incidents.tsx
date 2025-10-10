import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, User } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

interface AbusiveIncident {
  id: string;
  bookingId: string;
  userId: string;
  userName: string;
  userRole: string;
  messageText: string;
  detectedWords: string[];
  severity: 'low' | 'medium' | 'high';
  detectedAt: string;
}

export default function AbusiveIncidentsPage() {
  const { data: incidents, isLoading } = useQuery<AbusiveIncident[]>({
    queryKey: ['/api/admin/abusive-incidents'],
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-orange-500';
      case 'low': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-page-title">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              Abusive Language Incidents
            </h1>
            <p className="text-muted-foreground mt-2">
              Monitoring video session chats for inappropriate language
            </p>
          </div>
          <Link href="/admin">
            <Button variant="outline" data-testid="button-back-admin">
              Back to Admin Dashboard
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="p-8">
              <div className="text-center text-muted-foreground">
                Loading incidents...
              </div>
            </CardContent>
          </Card>
        ) : incidents && incidents.length > 0 ? (
          <div className="grid gap-4">
            {incidents.map((incident) => (
              <Card key={incident.id} className="border-l-4" style={{ borderLeftColor: incident.severity === 'high' ? '#ef4444' : incident.severity === 'medium' ? '#f97316' : '#eab308' }}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <User className="h-5 w-5" />
                        {incident.userName}
                        <Badge variant="outline" className="ml-2">
                          {incident.userRole}
                        </Badge>
                        <Badge className={`${getSeverityColor(incident.severity)} text-white ml-2`}>
                          {incident.severity.toUpperCase()}
                        </Badge>
                      </CardTitle>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {format(new Date(incident.detectedAt), 'PPpp')}
                        </div>
                        <div>
                          Booking: {incident.bookingId.substring(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium mb-1">Message:</div>
                      <div className="p-3 bg-muted rounded-md text-sm">
                        {incident.messageText}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">Detected Words:</div>
                      <div className="flex flex-wrap gap-2">
                        {incident.detectedWords.map((word, idx) => (
                          <Badge 
                            key={idx} 
                            variant="destructive"
                            className="font-mono"
                            data-testid={`badge-word-${idx}`}
                          >
                            {word}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12">
              <div className="text-center">
                <AlertTriangle className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-20" />
                <h3 className="text-xl font-semibold mb-2" data-testid="text-no-incidents">
                  No Incidents Detected
                </h3>
                <p className="text-muted-foreground">
                  All video session chats are clean. Incidents will appear here when abusive language is detected.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

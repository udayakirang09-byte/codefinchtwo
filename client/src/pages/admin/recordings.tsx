import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Database, Download, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function AdminRecordings() {
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);

  const { data: recordings, refetch } = useQuery({
    queryKey: ['/api/recordings/merged/all'],
  });

  const handleSync = async () => {
    try {
      setSyncing(true);
      setSyncResult(null);
      
      const result: any = await apiRequest('POST', '/api/admin/recordings/sync-azure');
      setSyncResult(result);
      
      // Refresh recordings list after sync
      await refetch();
    } catch (error: any) {
      console.error('Sync failed:', error);
      setSyncResult({
        success: false,
        error: error.message || 'Failed to sync recordings'
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Recording Management</h1>
        <p className="text-gray-600 mt-2">
          Sync recordings from Azure Blob Storage to database
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Azure Storage Sync
          </CardTitle>
          <CardDescription>
            Import merged recordings from Azure Blob Storage into the database.
            This will make recordings visible to students and available for AI analysis.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button 
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2"
              data-testid="button-sync-azure"
            >
              {syncing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Sync Azure Recordings
                </>
              )}
            </Button>
          </div>

          {syncResult && (
            <Alert variant={syncResult.success ? "default" : "destructive"}>
              {syncResult.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                {syncResult.success ? (
                  <div className="space-y-2">
                    <p className="font-semibold">Sync completed successfully!</p>
                    <ul className="text-sm space-y-1">
                      <li>Total blobs in storage: {syncResult.totalBlobs}</li>
                      <li>Merged recordings found: {syncResult.mergedBlobs}</li>
                      <li className="text-green-600 font-medium">✓ Synced: {syncResult.synced}</li>
                      <li className="text-gray-600">⏭ Skipped (already exists): {syncResult.skipped}</li>
                      {syncResult.failed > 0 && (
                        <li className="text-red-600">✗ Failed: {syncResult.failed}</li>
                      )}
                    </ul>
                    {syncResult.errors && syncResult.errors.length > 0 && (
                      <div className="mt-3">
                        <p className="font-semibold text-sm">Errors:</p>
                        <ul className="text-sm text-red-600 space-y-1 mt-1">
                          {syncResult.errors.map((err: string, idx: number) => (
                            <li key={idx}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <p>{syncResult.error || 'Sync failed'}</p>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="border-t pt-4 mt-4">
            <h3 className="font-semibold mb-2">How it works:</h3>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>Scans Azure Blob Storage for all merged recording files (-Final.webm, _merged.webm)</li>
              <li>Extracts booking information from filenames where possible</li>
              <li>Creates database records in the merged_recordings table</li>
              <li>Skips recordings that are already synced</li>
              <li>Recordings will then be visible in student "My Class Recordings" page</li>
              <li>Recordings will be available for AI quality analysis</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {recordings && (
        <Card>
          <CardHeader>
            <CardTitle>Synced Recordings</CardTitle>
            <CardDescription>Total recordings in database: {Array.isArray(recordings) ? recordings.length : 0}</CardDescription>
          </CardHeader>
          <CardContent>
            {Array.isArray(recordings) && recordings.length > 0 ? (
              <div className="text-sm text-gray-600">
                {recordings.length} recording(s) synced and available
              </div>
            ) : (
              <p className="text-sm text-gray-500">No recordings synced yet. Click "Sync Azure Recordings" to import from storage.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

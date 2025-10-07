import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {  
  Database,
  Save,
  AlertTriangle,
  CheckCircle,
  Home,
  HardDrive
} from 'lucide-react';
import { Link } from 'wouter';
import Navigation from '@/components/navigation';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface AzureStorageConfig {
  id: string;
  storageAccountName: string;
  containerName: string;
  retentionMonths: number;
  isActive: boolean;
  updatedAt: string;
}

export default function AdminStorageConfig() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [storageAccountName, setStorageAccountName] = useState('kidzaimathstore31320');
  const [containerName, setContainerName] = useState('replayknowledge');
  const [retentionMonths, setRetentionMonths] = useState(6);

  // Fetch current storage config
  const { data: config, isLoading, error, isError } = useQuery({
    queryKey: ['azure-storage-config'],
    queryFn: async () => {
      const result = await apiRequest('GET', '/api/admin/azure-storage-config');
      if (result) {
        const cfg = result as unknown as AzureStorageConfig;
        setStorageAccountName(cfg.storageAccountName);
        setContainerName(cfg.containerName);
        setRetentionMonths(cfg.retentionMonths);
        return cfg;
      }
      return null;
    },
  });

  // Update storage config mutation
  const updateConfigMutation = useMutation({
    mutationFn: async (data: { storageAccountName: string; containerName: string; retentionMonths: number }) => {
      return await apiRequest('POST', '/api/admin/azure-storage-config', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['azure-storage-config'] });
      toast({
        title: 'Success',
        description: 'Azure Storage configuration updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to update storage config: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const handleSave = () => {
    if (!storageAccountName || !containerName || retentionMonths < 1) {
      toast({
        title: 'Validation Error',
        description: 'All fields are required and retention must be at least 1 month',
        variant: 'destructive',
      });
      return;
    }

    updateConfigMutation.mutate({
      storageAccountName,
      containerName,
      retentionMonths,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <HardDrive className="h-8 w-8 text-blue-600" />
              Azure Storage Configuration
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Configure Azure Blob Storage settings for video recordings
            </p>
          </div>
          <Link href="/admin">
            <Button variant="outline" data-testid="button-back-admin">
              <Home className="h-4 w-4 mr-2" />
              Back to Admin
            </Button>
          </Link>
        </div>

        {/* Info Alert */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Changes to storage configuration will affect video recording retention and storage location.
            Make sure the storage account and container exist before saving.
          </AlertDescription>
        </Alert>

        {/* Configuration Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Storage Settings
            </CardTitle>
            <CardDescription>
              Configure Azure Storage account and video retention policy
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="storageAccount">Storage Account Name</Label>
                <Input
                  id="storageAccount"
                  value={storageAccountName}
                  onChange={(e) => setStorageAccountName(e.target.value)}
                  placeholder="kidzaimathstore31320"
                  data-testid="input-storage-account"
                />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  The name of your Azure Storage Account
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="containerName">Container Name</Label>
                <Input
                  id="containerName"
                  value={containerName}
                  onChange={(e) => setContainerName(e.target.value)}
                  placeholder="replayknowledge"
                  data-testid="input-container-name"
                />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  The container where video recordings will be stored
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="retentionMonths">Retention Period (Months)</Label>
                <Input
                  id="retentionMonths"
                  type="number"
                  min="1"
                  max="120"
                  value={retentionMonths}
                  onChange={(e) => setRetentionMonths(parseInt(e.target.value) || 6)}
                  data-testid="input-retention-months"
                />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Videos will be automatically deleted after this many months (default: 6)
                </p>
              </div>
            </div>

            <div className="pt-4">
              <Button
                onClick={handleSave}
                disabled={updateConfigMutation.isPending || isLoading || isError}
                className="w-full sm:w-auto"
                data-testid="button-save-config"
              >
                <Save className="h-4 w-4 mr-2" />
                {updateConfigMutation.isPending ? 'Saving...' : 'Save Configuration'}
              </Button>
            </div>

            {isError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Failed to load storage configuration. Please refresh the page. 
                  Do not save until the config loads successfully to avoid overwriting settings.
                </AlertDescription>
              </Alert>
            )}

            {config && !isError && (
              <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  Current configuration: {config.storageAccountName}/{config.containerName} 
                  with {config.retentionMonths} month retention
                </AlertDescription>
              </Alert>
            )}
            
            {isLoading && (
              <Alert>
                <AlertDescription>
                  Loading configuration...
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

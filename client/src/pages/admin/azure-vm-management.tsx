import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Cloud, 
  Server, 
  Play, 
  Square, 
  RotateCcw, 
  Plus, 
  Settings, 
  Trash2, 
  HardDrive, 
  Activity,
  BarChart3,
  Upload,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Monitor
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface AzureVm {
  id: string;
  name: string;
  status: string;
  location: string;
  size: string;
  isHealthy: boolean;
  recordings?: {
    count: number;
    totalSize: number;
  };
  publicIpAddress?: string;
  privateIpAddress?: string;
}

interface VmStatus {
  vmName: string;
  powerState: string;
  provisioningState: string;
  isHealthy: boolean;
  diskUsage?: {
    total: number;
    used: number;
    available: number;
  };
  recordings?: {
    count: number;
    totalSize: number;
    lastUploaded?: Date;
  };
}

interface StorageStats {
  totalRecordings: number;
  totalStorageUsed: number;
  averageRecordingSize: number;
  storageQuota: number;
  storageUsagePercent: number;
  monthlyUploadCount: number;
  monthlyDownloadCount: number;
}

export default function AzureVmManagement() {
  const [selectedVm, setSelectedVm] = useState<AzureVm | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newVmName, setNewVmName] = useState("");
  const { toast } = useToast();

  // Fetch Azure VMs
  const { data: vms, isLoading: vmsLoading, refetch: refetchVms } = useQuery({
    queryKey: ['/api/admin/azure-vms'],
    queryFn: async () => {
      const response = await fetch('/api/admin/azure-vms');
      if (!response.ok) throw new Error('Failed to fetch VMs');
      return response.json() as Promise<AzureVm[]>;
    },
  });

  // Fetch storage statistics
  const { data: storageStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/recordings/storage-stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/recordings/storage-stats');
      if (!response.ok) throw new Error('Failed to fetch storage stats');
      return response.json() as Promise<StorageStats>;
    },
  });

  // Fetch VM status
  const { data: vmStatus, refetch: refetchVmStatus } = useQuery({
    queryKey: ['/api/admin/azure-vms', selectedVm?.name, 'status'],
    queryFn: async () => {
      if (!selectedVm?.name) return null;
      const response = await fetch(`/api/admin/azure-vms/${selectedVm.name}/status`);
      if (!response.ok) throw new Error('Failed to fetch VM status');
      return response.json() as Promise<VmStatus>;
    },
    enabled: !!selectedVm?.name,
  });

  // VM Management Mutations
  const createVmMutation = useMutation({
    mutationFn: async (vmName: string) => {
      const response = await fetch('/api/admin/azure-vms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vmName,
          location: 'eastus',
          vmSize: 'Standard_D2s_v3',
          adminUsername: 'codeconnect',
          adminPassword: 'CodeConnect2024!',
          storageAccountName: 'codeconnectrecordings',
          containerName: 'recordings'
        })
      });
      if (!response.ok) throw new Error('Failed to create VM');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "VM Creation Started",
        description: "Azure VM creation has been initiated. This may take several minutes.",
      });
      refetchVms();
      setIsCreateDialogOpen(false);
      setNewVmName("");
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create Azure VM",
        variant: "destructive",
      });
    },
  });

  const startVmMutation = useMutation({
    mutationFn: async (vmName: string) => {
      const response = await fetch(`/api/admin/azure-vms/${vmName}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to start VM');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "VM Start Initiated",
        description: "VM start command sent successfully.",
      });
      refetchVms();
      refetchVmStatus();
    },
    onError: (error: any) => {
      toast({
        title: "Start Failed",
        description: error.message || "Failed to start VM",
        variant: "destructive",
      });
    },
  });

  const stopVmMutation = useMutation({
    mutationFn: async (vmName: string) => {
      const response = await fetch(`/api/admin/azure-vms/${vmName}/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to stop VM');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "VM Stop Initiated",
        description: "VM stop command sent successfully.",
      });
      refetchVms();
      refetchVmStatus();
    },
    onError: (error: any) => {
      toast({
        title: "Stop Failed",
        description: error.message || "Failed to stop VM",
        variant: "destructive",
      });
    },
  });

  const restartVmMutation = useMutation({
    mutationFn: async (vmName: string) => {
      const response = await fetch(`/api/admin/azure-vms/${vmName}/restart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to restart VM');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "VM Restart Initiated",
        description: "VM restart command sent successfully.",
      });
      refetchVms();
      refetchVmStatus();
    },
    onError: (error: any) => {
      toast({
        title: "Restart Failed",
        description: error.message || "Failed to restart VM",
        variant: "destructive",
      });
    },
  });

  const deleteVmMutation = useMutation({
    mutationFn: async (vmName: string) => {
      const response = await fetch(`/api/admin/azure-vms/${vmName}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to delete VM');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "VM Deletion Initiated",
        description: "VM deletion has been started.",
      });
      refetchVms();
      setSelectedVm(null);
    },
    onError: (error: any) => {
      toast({
        title: "Deletion Failed",
        description: error.message || "Failed to delete VM",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running': return 'bg-green-100 text-green-800';
      case 'stopped': return 'bg-red-100 text-red-800';
      case 'starting': return 'bg-blue-100 text-blue-800';
      case 'stopping': return 'bg-orange-100 text-orange-800';
      case 'creating': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="space-y-8 p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 rounded-3xl shadow-2xl border border-white/20">
          <div className="relative z-10">
            <h1 className="text-4xl font-bold text-white mb-3 tracking-tight flex items-center gap-3">
              <Cloud className="h-10 w-10" />
              Azure VM Management
            </h1>
            <p className="text-blue-100 text-xl font-medium">
              Manage Azure Virtual Machines for recording storage and processing
            </p>
          </div>
        </div>

        {/* Storage Statistics */}
        {storageStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Recordings</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-recordings">{storageStats.totalRecordings}</div>
                <p className="text-xs text-muted-foreground">
                  {storageStats.monthlyUploadCount} this month
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-storage-used">
                  {formatBytes(storageStats.totalStorageUsed)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {storageStats.storageUsagePercent.toFixed(1)}% of quota
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Recording Size</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-avg-size">
                  {formatBytes(storageStats.averageRecordingSize)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {storageStats.monthlyDownloadCount} downloads this month
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Storage Quota</CardTitle>
                <Monitor className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-storage-quota">
                  {formatBytes(storageStats.storageQuota)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(storageStats.storageQuota - storageStats.totalStorageUsed)} available
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* VM Management Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Virtual Machines ({vms?.length || 0})
              </span>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700" data-testid="button-create-vm">
                    <Plus className="h-4 w-4 mr-2" />
                    Create VM
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Azure VM</DialogTitle>
                    <DialogDescription>
                      Create a new Azure Virtual Machine for recording storage and processing.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <Input
                      placeholder="VM Name (e.g., codeconnect-vm-2)"
                      value={newVmName}
                      onChange={(e) => setNewVmName(e.target.value)}
                      data-testid="input-vm-name"
                    />
                  </div>
                  <Button 
                    onClick={() => createVmMutation.mutate(newVmName)}
                    disabled={!newVmName || createVmMutation.isPending}
                    className="w-full"
                    data-testid="button-confirm-create-vm"
                  >
                    {createVmMutation.isPending ? "Creating..." : "Create VM"}
                  </Button>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {vmsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-20 bg-gray-200 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : vms && vms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vms.map((vm) => (
                  <Card key={vm.id} className="hover:shadow-lg transition-shadow duration-200">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Server className="h-5 w-5" />
                          {vm.name}
                        </span>
                        <Badge 
                          className={getStatusColor(vm.status)}
                          data-testid={`badge-vm-status-${vm.name}`}
                        >
                          {vm.status}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">Location:</span>
                          <span data-testid={`text-vm-location-${vm.name}`}>{vm.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">Size:</span>
                          <span data-testid={`text-vm-size-${vm.name}`}>{vm.size}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">Health:</span>
                          <span className={`flex items-center gap-1 ${vm.isHealthy ? 'text-green-600' : 'text-red-600'}`}>
                            {vm.isHealthy ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                            {vm.isHealthy ? 'Healthy' : 'Unhealthy'}
                          </span>
                        </div>
                        {vm.recordings && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium">Recordings:</span>
                            <span data-testid={`text-vm-recordings-${vm.name}`}>
                              {vm.recordings.count} ({formatBytes(vm.recordings.totalSize)})
                            </span>
                          </div>
                        )}
                        
                        {/* VM Control Buttons */}
                        <div className="flex gap-2 mt-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startVmMutation.mutate(vm.name)}
                            disabled={vm.status === 'Running' || startVmMutation.isPending}
                            data-testid={`button-start-vm-${vm.name}`}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => stopVmMutation.mutate(vm.name)}
                            disabled={vm.status === 'Stopped' || stopVmMutation.isPending}
                            data-testid={`button-stop-vm-${vm.name}`}
                          >
                            <Square className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => restartVmMutation.mutate(vm.name)}
                            disabled={restartVmMutation.isPending}
                            data-testid={`button-restart-vm-${vm.name}`}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => setSelectedVm(vm)}
                            data-testid={`button-details-vm-${vm.name}`}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteVmMutation.mutate(vm.name)}
                            disabled={deleteVmMutation.isPending}
                            data-testid={`button-delete-vm-${vm.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Cloud className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Virtual Machines</h3>
                <p className="text-gray-500 mb-4">Create your first Azure VM to get started with recording storage.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* VM Details Dialog */}
        {selectedVm && (
          <Dialog open={!!selectedVm} onOpenChange={() => setSelectedVm(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  {selectedVm.name} Details
                </DialogTitle>
                <DialogDescription>
                  Detailed information and statistics for {selectedVm.name}
                </DialogDescription>
              </DialogHeader>
              
              {vmStatus && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">VM Status</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Power State:</span>
                          <Badge className={getStatusColor(vmStatus.powerState)}>
                            {vmStatus.powerState}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Health:</span>
                          <span className={vmStatus.isHealthy ? 'text-green-600' : 'text-red-600'}>
                            {vmStatus.isHealthy ? 'Healthy' : 'Unhealthy'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {vmStatus.diskUsage && (
                      <div>
                        <h4 className="font-semibold mb-2">Disk Usage</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Total:</span>
                            <span>{formatBytes(vmStatus.diskUsage.total)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Used:</span>
                            <span>{formatBytes(vmStatus.diskUsage.used)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Available:</span>
                            <span>{formatBytes(vmStatus.diskUsage.available)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {vmStatus.recordings && (
                    <div>
                      <h4 className="font-semibold mb-2">Recording Storage</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex justify-between">
                          <span>Total Recordings:</span>
                          <span>{vmStatus.recordings.count}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Size:</span>
                          <span>{formatBytes(vmStatus.recordings.totalSize)}</span>
                        </div>
                        {vmStatus.recordings.lastUploaded && (
                          <div className="flex justify-between col-span-2">
                            <span>Last Upload:</span>
                            <span>{formatDistanceToNow(new Date(vmStatus.recordings.lastUploaded), { addSuffix: true })}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
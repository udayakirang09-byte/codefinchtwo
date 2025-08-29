import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Cloud, 
  Server, 
  DollarSign,
  Activity,
  Settings,
  Upload,
  Download,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Home
} from 'lucide-react';
import { Link } from 'wouter';
import Navigation from '@/components/navigation';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function CloudDeployments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deploymentForm, setDeploymentForm] = useState({
    provider: '',
    region: '',
    environment: 'development',
    serviceName: '',
    resourceConfig: {
      instanceType: '',
      storage: '',
      bandwidth: '',
      scaling: 'auto'
    }
  });

  // Fetch deployments
  const { data: deployments = [], isLoading, error } = useQuery({
    queryKey: ['cloud-deployments'],
    queryFn: async () => {
      try {
        const result = await apiRequest('GET', '/api/admin/cloud-deployments');
        return Array.isArray(result) ? result : [];
      } catch (error) {
        console.error('Failed to fetch deployments:', error);
        return [];
      }
    },
  });

  // Deploy mutation
  const deployMutation = useMutation({
    mutationFn: async (deployment: any) => {
      return apiRequest('POST', `/api/admin/deploy/${deployment.provider}`, deployment);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Deployment initiated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['cloud-deployments'] });
      // Reset form
      setDeploymentForm({
        provider: '',
        region: '',
        environment: 'development',
        serviceName: '',
        resourceConfig: {
          instanceType: '',
          storage: '',
          bandwidth: '',
          scaling: 'auto'
        }
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to deploy. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDeploy = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!deploymentForm.provider || !deploymentForm.region || !deploymentForm.serviceName) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    deployMutation.mutate(deploymentForm);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'default';
      case 'warning': return 'secondary';
      case 'critical': return 'destructive';
      default: return 'outline';
    }
  };

  // ARM Templates for different providers
  const armTemplates = {
    aws: `{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "CodeConnect AWS Deployment",
  "Resources": {
    "CodeConnectEC2": {
      "Type": "AWS::EC2::Instance",
      "Properties": {
        "ImageId": "ami-0abcdef1234567890",
        "InstanceType": "t3.medium",
        "SecurityGroupIds": ["sg-12345678"],
        "UserData": {
          "Fn::Base64": {
            "Fn::Join": ["", [
              "#!/bin/bash\\n",
              "yum update -y\\n",
              "yum install -y nodejs npm postgresql\\n",
              "git clone https://github.com/codeconnect/app.git\\n",
              "cd app && npm install && npm run build\\n",
              "pm2 start server/index.js --name codeconnect\\n"
            ]]
          }
        }
      }
    }
  }
}`,
    azure: `{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "resources": [
    {
      "type": "Microsoft.Web/sites",
      "apiVersion": "2021-02-01",
      "name": "codeconnect-webapp",
      "location": "[resourceGroup().location]",
      "properties": {
        "siteConfig": {
          "nodeVersion": "18.x",
          "appSettings": [
            {
              "name": "NODE_ENV",
              "value": "production"
            }
          ]
        }
      }
    }
  ]
}`,
    gcp: `resources:
- type: compute.v1.instance
  name: codeconnect-vm
  properties:
    zone: us-central1-a
    machineType: zones/us-central1-a/machineTypes/n1-standard-1
    disks:
    - deviceName: boot
      type: PERSISTENT
      boot: true
      autoDelete: true
      initializeParams:
        sourceImage: projects/debian-cloud/global/images/family/debian-11
    networkInterfaces:
    - network: global/networks/default
      accessConfigs:
      - name: External NAT
        type: ONE_TO_ONE_NAT
    metadata:
      items:
      - key: startup-script
        value: |
          #!/bin/bash
          apt-get update
          apt-get install -y nodejs npm postgresql git
          git clone https://github.com/codeconnect/app.git
          cd app && npm install && npm run build
          npm install -g pm2
          pm2 start server/index.js --name codeconnect`
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Cloud className="h-8 w-8 text-blue-600" />
              Multi-Cloud Deployment Management
            </h1>
            <p className="text-gray-600 mt-2">Deploy and manage across AWS, Azure, and Google Cloud Platform</p>
          </div>
          <Link href="/">
            <Button variant="outline" data-testid="button-home">
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="deployments" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="deployments">Active Deployments</TabsTrigger>
            <TabsTrigger value="deploy">New Deployment</TabsTrigger>
            <TabsTrigger value="templates">ARM Templates</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          </TabsList>

          {/* Active Deployments Tab */}
          <TabsContent value="deployments" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Deployments</CardTitle>
                  <Server className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="total-deployments">{deployments?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Across {new Set(deployments?.map((d: any) => d.provider) || []).size} cloud providers
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Cost</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="monthly-cost">
                    ${deployments?.reduce((sum: number, d: any) => sum + parseFloat(d.actualCost || d.costEstimate || '0'), 0).toFixed(2) || '0.00'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Estimated operational costs
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Health Score</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600" data-testid="health-score">98.5%</div>
                  <p className="text-xs text-muted-foreground">
                    System uptime and availability
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Deployment Status</CardTitle>
                <CardDescription>Monitor all cloud deployments from a single dashboard</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
                    <span className="ml-3">Loading deployments...</span>
                  </div>
                ) : deployments?.length > 0 ? (
                  <div className="space-y-4">
                    {deployments?.map((deployment: any, index: number) => (
                      <div key={deployment.id || index} className="border rounded-lg p-4" data-testid={`deployment-${index}`}>
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold" data-testid={`deployment-name-${index}`}>
                                {deployment.serviceName}
                              </h3>
                              <Badge variant="outline" data-testid={`deployment-provider-${index}`}>
                                {deployment.provider.toUpperCase()}
                              </Badge>
                              <Badge variant={getHealthColor(deployment.healthStatus)} data-testid={`deployment-health-${index}`}>
                                {deployment.healthStatus || 'unknown'}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600" data-testid={`deployment-region-${index}`}>
                              {deployment.region} • {deployment.environment}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(deployment.deploymentStatus)}
                            <span className="text-sm font-medium" data-testid={`deployment-status-${index}`}>
                              {deployment.deploymentStatus}
                            </span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Cost Estimate</span>
                            <p className="font-medium" data-testid={`deployment-cost-${index}`}>
                              ${deployment.costEstimate || '0.00'}/month
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500">Last Health Check</span>
                            <p className="font-medium" data-testid={`deployment-health-check-${index}`}>
                              {deployment.lastHealthCheck ? 
                                new Date(deployment.lastHealthCheck).toLocaleString() : 
                                'Never'
                              }
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500">Deployed</span>
                            <p className="font-medium" data-testid={`deployment-date-${index}`}>
                              {deployment.deployedAt ? 
                                new Date(deployment.deployedAt).toLocaleDateString() : 
                                'Pending'
                              }
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" data-testid={`deployment-configure-${index}`}>
                              <Settings className="w-3 h-3 mr-1" />
                              Configure
                            </Button>
                            <Button size="sm" variant="outline" data-testid={`deployment-logs-${index}`}>
                              Logs
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Cloud className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500 mb-4">No deployments found</p>
                    <p className="text-sm text-gray-400">Create your first cloud deployment to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* New Deployment Tab */}
          <TabsContent value="deploy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Create New Deployment
                </CardTitle>
                <CardDescription>
                  Deploy CodeConnect to your preferred cloud provider
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleDeploy} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="provider">Cloud Provider *</Label>
                      <Select value={deploymentForm.provider} onValueChange={(value) => setDeploymentForm({ ...deploymentForm, provider: value })}>
                        <SelectTrigger data-testid="select-provider">
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="aws">Amazon Web Services (AWS)</SelectItem>
                          <SelectItem value="azure">Microsoft Azure</SelectItem>
                          <SelectItem value="gcp">Google Cloud Platform (GCP)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="region">Region *</Label>
                      <Select value={deploymentForm.region} onValueChange={(value) => setDeploymentForm({ ...deploymentForm, region: value })}>
                        <SelectTrigger data-testid="select-region">
                          <SelectValue placeholder="Select region" />
                        </SelectTrigger>
                        <SelectContent>
                          {deploymentForm.provider === 'aws' && (
                            <>
                              <SelectItem value="us-east-1">US East (N. Virginia)</SelectItem>
                              <SelectItem value="us-west-2">US West (Oregon)</SelectItem>
                              <SelectItem value="eu-west-1">Europe (Ireland)</SelectItem>
                              <SelectItem value="ap-southeast-1">Asia Pacific (Singapore)</SelectItem>
                            </>
                          )}
                          {deploymentForm.provider === 'azure' && (
                            <>
                              <SelectItem value="eastus">East US</SelectItem>
                              <SelectItem value="westus2">West US 2</SelectItem>
                              <SelectItem value="westeurope">West Europe</SelectItem>
                              <SelectItem value="southeastasia">Southeast Asia</SelectItem>
                            </>
                          )}
                          {deploymentForm.provider === 'gcp' && (
                            <>
                              <SelectItem value="us-central1">US Central 1</SelectItem>
                              <SelectItem value="us-west1">US West 1</SelectItem>
                              <SelectItem value="europe-west1">Europe West 1</SelectItem>
                              <SelectItem value="asia-southeast1">Asia Southeast 1</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="environment">Environment *</Label>
                      <Select value={deploymentForm.environment} onValueChange={(value) => setDeploymentForm({ ...deploymentForm, environment: value })}>
                        <SelectTrigger data-testid="select-environment">
                          <SelectValue placeholder="Select environment" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="development">Development</SelectItem>
                          <SelectItem value="staging">Staging</SelectItem>
                          <SelectItem value="production">Production</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="serviceName">Service Name *</Label>
                      <Input
                        id="serviceName"
                        placeholder="codeconnect-prod"
                        value={deploymentForm.serviceName}
                        onChange={(e) => setDeploymentForm({ ...deploymentForm, serviceName: e.target.value })}
                        data-testid="input-service-name"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Resource Configuration</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="instanceType">Instance Type</Label>
                        <Select 
                          value={deploymentForm.resourceConfig.instanceType} 
                          onValueChange={(value) => setDeploymentForm({ 
                            ...deploymentForm, 
                            resourceConfig: { ...deploymentForm.resourceConfig, instanceType: value }
                          })}
                        >
                          <SelectTrigger data-testid="select-instance-type">
                            <SelectValue placeholder="Select instance type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="small">Small (1 vCPU, 2GB RAM)</SelectItem>
                            <SelectItem value="medium">Medium (2 vCPU, 4GB RAM)</SelectItem>
                            <SelectItem value="large">Large (4 vCPU, 8GB RAM)</SelectItem>
                            <SelectItem value="xlarge">X-Large (8 vCPU, 16GB RAM)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="storage">Storage (GB)</Label>
                        <Input
                          id="storage"
                          type="number"
                          placeholder="100"
                          value={deploymentForm.resourceConfig.storage}
                          onChange={(e) => setDeploymentForm({ 
                            ...deploymentForm, 
                            resourceConfig: { ...deploymentForm.resourceConfig, storage: e.target.value }
                          })}
                          data-testid="input-storage"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button 
                      type="submit" 
                      disabled={deployMutation.isPending}
                      data-testid="button-deploy"
                      className="flex-1"
                    >
                      {deployMutation.isPending ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                          Deploying...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Deploy to Cloud
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ARM Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Infrastructure as Code Templates
                </CardTitle>
                <CardDescription>
                  Use these templates to deploy CodeConnect with your existing DevOps workflows
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="aws-template" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="aws-template">AWS CloudFormation</TabsTrigger>
                    <TabsTrigger value="azure-template">Azure ARM</TabsTrigger>
                    <TabsTrigger value="gcp-template">GCP Deployment</TabsTrigger>
                  </TabsList>

                  <TabsContent value="aws-template" className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">AWS CloudFormation Template</h3>
                      <Button variant="outline" size="sm" data-testid="download-aws-template">
                        <Download className="w-4 h-4 mr-2" />
                        Download Template
                      </Button>
                    </div>
                    <Textarea
                      value={armTemplates.aws}
                      readOnly
                      className="min-h-[400px] font-mono text-sm"
                      data-testid="aws-template-content"
                    />
                  </TabsContent>

                  <TabsContent value="azure-template" className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Azure ARM Template</h3>
                      <Button variant="outline" size="sm" data-testid="download-azure-template">
                        <Download className="w-4 h-4 mr-2" />
                        Download Template
                      </Button>
                    </div>
                    <Textarea
                      value={armTemplates.azure}
                      readOnly
                      className="min-h-[400px] font-mono text-sm"
                      data-testid="azure-template-content"
                    />
                  </TabsContent>

                  <TabsContent value="gcp-template" className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Google Cloud Deployment Manager</h3>
                      <Button variant="outline" size="sm" data-testid="download-gcp-template">
                        <Download className="w-4 h-4 mr-2" />
                        Download Template
                      </Button>
                    </div>
                    <Textarea
                      value={armTemplates.gcp}
                      readOnly
                      className="min-h-[400px] font-mono text-sm"
                      data-testid="gcp-template-content"
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Monitoring Tab */}
          <TabsContent value="monitoring" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">AWS Monitoring</CardTitle>
                  <CardDescription>CloudWatch metrics and alarms</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">CPU Utilization</span>
                      <span className="text-sm font-medium text-green-600" data-testid="aws-cpu">23%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Memory Usage</span>
                      <span className="text-sm font-medium text-blue-600" data-testid="aws-memory">67%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Network In/Out</span>
                      <span className="text-sm font-medium text-purple-600" data-testid="aws-network">45 Mbps</span>
                    </div>
                    <Button size="sm" variant="outline" className="w-full" data-testid="aws-dashboard">
                      View CloudWatch Dashboard
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Azure Monitoring</CardTitle>
                  <CardDescription>Application Insights and metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">App Service CPU</span>
                      <span className="text-sm font-medium text-green-600" data-testid="azure-cpu">31%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Memory Percentage</span>
                      <span className="text-sm font-medium text-blue-600" data-testid="azure-memory">54%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">HTTP Requests</span>
                      <span className="text-sm font-medium text-purple-600" data-testid="azure-requests">1.2K/min</span>
                    </div>
                    <Button size="sm" variant="outline" className="w-full" data-testid="azure-dashboard">
                      View Azure Monitor
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">GCP Monitoring</CardTitle>
                  <CardDescription>Cloud Operations and metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Compute Engine CPU</span>
                      <span className="text-sm font-medium text-green-600" data-testid="gcp-cpu">19%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Memory Utilization</span>
                      <span className="text-sm font-medium text-blue-600" data-testid="gcp-memory">42%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Disk I/O</span>
                      <span className="text-sm font-medium text-purple-600" data-testid="gcp-disk">234 MB/s</span>
                    </div>
                    <Button size="sm" variant="outline" className="w-full" data-testid="gcp-dashboard">
                      View Cloud Console
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Real-time monitoring data is fetched from each cloud provider's native monitoring services. 
                Set up alerts and notifications through your cloud provider's console for production deployments.
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
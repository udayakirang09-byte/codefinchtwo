import { z } from "zod";

// Azure VM Configuration Schema
export const azureVmConfigSchema = z.object({
  subscriptionId: z.string().uuid(),
  resourceGroupName: z.string().min(1),
  vmName: z.string().min(1),
  location: z.string().min(1),
  vmSize: z.string().min(1),
  adminUsername: z.string().min(1),
  adminPassword: z.string().min(8),
  storageAccountName: z.string().min(1),
  containerName: z.string().min(1),
  networkSecurityGroupName: z.string().min(1),
  publicIpName: z.string().min(1),
  virtualNetworkName: z.string().min(1),
  subnetName: z.string().min(1),
  networkInterfaceName: z.string().min(1),
});

export type AzureVmConfig = z.infer<typeof azureVmConfigSchema>;

// Azure VM Recording Storage Configuration
export const azureRecordingStorageSchema = z.object({
  storageConnectionString: z.string().min(1),
  containerName: z.string().min(1),
  blobPrefix: z.string().default("recordings/"),
  maxFileSize: z.number().default(500 * 1024 * 1024), // 500MB default
  allowedExtensions: z.array(z.string()).default([".mp4", ".webm", ".avi"]),
  retentionDays: z.number().default(365), // 1 year retention
});

export type AzureRecordingStorage = z.infer<typeof azureRecordingStorageSchema>;

// VM Status and Health Schema
export const vmStatusSchema = z.object({
  vmName: z.string(),
  powerState: z.enum(["VM running", "VM stopped", "VM deallocated", "VM starting", "VM stopping"]),
  provisioningState: z.enum(["Creating", "Updating", "Failed", "Succeeded", "Deleting"]),
  publicIpAddress: z.string().optional(),
  privateIpAddress: z.string().optional(),
  diskUsage: z.object({
    total: z.number(),
    used: z.number(),
    available: z.number(),
  }).optional(),
  lastHealthCheck: z.date(),
  isHealthy: z.boolean(),
  recordings: z.object({
    count: z.number(),
    totalSize: z.number(),
    lastUploaded: z.date().optional(),
  }).optional(),
});

export type VmStatus = z.infer<typeof vmStatusSchema>;

// Startup Script Configuration
export const vmStartupScriptSchema = z.object({
  scriptName: z.string().min(1),
  scriptContent: z.string().min(1),
  scriptPath: z.string().default("/opt/codeconnect/"),
  executeOnBoot: z.boolean().default(true),
  logPath: z.string().default("/var/log/codeconnect-startup.log"),
  dependencies: z.array(z.string()).default([]),
  environmentVariables: z.record(z.string()).default({}),
});

export type VmStartupScript = z.infer<typeof vmStartupScriptSchema>;

// Recording Upload Configuration
export const recordingUploadSchema = z.object({
  sessionId: z.string().uuid(),
  fileName: z.string().min(1),
  fileSize: z.number().min(1),
  mimeType: z.string().min(1),
  checksum: z.string().min(1),
  metadata: z.object({
    duration: z.number().optional(),
    resolution: z.string().optional(),
    codec: z.string().optional(),
    studentId: z.string().uuid(),
    mentorId: z.string().uuid(),
    recordedAt: z.date(),
  }),
});

export type RecordingUpload = z.infer<typeof recordingUploadSchema>;

// Default Azure VM Configuration for CodeConnect
export const defaultAzureVmConfig: Partial<AzureVmConfig> = {
  location: "eastus",
  vmSize: "Standard_D2s_v3", // 2 vCPUs, 8GB RAM - good for recording processing
  containerName: "codeconnect-recordings",
  networkSecurityGroupName: "codeconnect-nsg",
  publicIpName: "codeconnect-vm-ip",
  virtualNetworkName: "codeconnect-vnet",
  subnetName: "codeconnect-subnet",
  networkInterfaceName: "codeconnect-vm-nic",
};

// Recording Storage Configuration
export const defaultRecordingStorageConfig: AzureRecordingStorage = {
  storageConnectionString: "", // To be set from environment
  containerName: "codeconnect-recordings",
  blobPrefix: "sessions/",
  maxFileSize: 500 * 1024 * 1024, // 500MB
  allowedExtensions: [".mp4", ".webm", ".avi", ".mov"],
  retentionDays: 365, // 1 year
};

// VM Startup Script Template
export const defaultStartupScript: VmStartupScript = {
  scriptName: "codeconnect-recording-setup.sh",
  scriptContent: `#!/bin/bash
set -e

# CodeConnect Recording VM Startup Script
echo "$(date): Starting CodeConnect Recording VM setup..." >> /var/log/codeconnect-startup.log

# Update system packages
apt-get update
apt-get upgrade -y

# Install required packages for video processing
apt-get install -y ffmpeg docker.io nodejs npm python3 python3-pip curl

# Enable Docker service
systemctl enable docker
systemctl start docker

# Create application directory
mkdir -p /opt/codeconnect
cd /opt/codeconnect

# Set up video processing environment
python3 -m pip install azure-storage-blob azure-identity

# Create recording processor script
cat > /opt/codeconnect/recording-processor.py << 'EOF'
import os
import sys
from azure.storage.blob import BlobServiceClient
from azure.identity import DefaultAzureCredential
import subprocess
import json
from datetime import datetime

def process_and_upload_recording(local_file, session_id, metadata):
    """Process video file and upload to Azure Storage"""
    try:
        # Get storage connection from environment
        connection_string = os.environ.get('AZURE_STORAGE_CONNECTION_STRING')
        if not connection_string:
            raise Exception("Azure Storage connection string not found")
        
        blob_service_client = BlobServiceClient.from_connection_string(connection_string)
        container_name = "codeconnect-recordings"
        
        # Generate blob name with session ID and timestamp
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        blob_name = f"sessions/{session_id}_{timestamp}.mp4"
        
        # Process video with ffmpeg (compress and standardize format)
        processed_file = f"/tmp/processed_{session_id}.mp4"
        subprocess.run([
            'ffmpeg', '-i', local_file,
            '-c:v', 'libx264', '-preset', 'medium', '-crf', '23',
            '-c:a', 'aac', '-b:a', '128k',
            '-movflags', '+faststart',
            processed_file
        ], check=True)
        
        # Upload to Azure Storage
        blob_client = blob_service_client.get_blob_client(
            container=container_name, 
            blob=blob_name
        )
        
        with open(processed_file, 'rb') as data:
            blob_client.upload_blob(data, overwrite=True, metadata=metadata)
        
        # Clean up temporary files
        os.remove(processed_file)
        os.remove(local_file)
        
        return blob_client.url
        
    except Exception as e:
        print(f"Error processing recording: {str(e)}")
        return None

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python3 recording-processor.py <file_path> <session_id> <metadata_json>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    session_id = sys.argv[2]
    metadata = json.loads(sys.argv[3])
    
    url = process_and_upload_recording(file_path, session_id, metadata)
    if url:
        print(f"SUCCESS:{url}")
    else:
        print("ERROR:Failed to process recording")
EOF

chmod +x /opt/codeconnect/recording-processor.py

# Create health check script
cat > /opt/codeconnect/health-check.py << 'EOF'
import os
import json
import shutil
from datetime import datetime
from azure.storage.blob import BlobServiceClient

def check_vm_health():
    """Check VM health and recording storage status"""
    try:
        # Check disk usage
        total, used, free = shutil.disk_usage("/")
        disk_usage = {
            "total": total,
            "used": used,
            "available": free
        }
        
        # Check Azure Storage connectivity
        connection_string = os.environ.get('AZURE_STORAGE_CONNECTION_STRING')
        recordings_count = 0
        total_size = 0
        
        if connection_string:
            try:
                blob_service_client = BlobServiceClient.from_connection_string(connection_string)
                container_client = blob_service_client.get_container_client("codeconnect-recordings")
                
                for blob in container_client.list_blobs():
                    recordings_count += 1
                    total_size += blob.size
                    
            except Exception as storage_error:
                print(f"Storage check failed: {storage_error}")
        
        health_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "disk_usage": disk_usage,
            "recordings": {
                "count": recordings_count,
                "total_size": total_size
            },
            "is_healthy": free > (10 * 1024 * 1024 * 1024)  # At least 10GB free
        }
        
        with open('/tmp/vm-health.json', 'w') as f:
            json.dump(health_data, f)
            
        return health_data
        
    except Exception as e:
        error_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "error": str(e),
            "is_healthy": False
        }
        
        with open('/tmp/vm-health.json', 'w') as f:
            json.dump(error_data, f)
            
        return error_data

if __name__ == "__main__":
    health = check_vm_health()
    print(json.dumps(health))
EOF

chmod +x /opt/codeconnect/health-check.py

# Set up cron job for health checks every 5 minutes
echo "*/5 * * * * root /usr/bin/python3 /opt/codeconnect/health-check.py >> /var/log/codeconnect-health.log 2>&1" >> /etc/crontab

# Create recording upload directory with proper permissions
mkdir -p /opt/codeconnect/uploads
chmod 755 /opt/codeconnect/uploads

# Set up log rotation for CodeConnect logs
cat > /etc/logrotate.d/codeconnect << 'EOF'
/var/log/codeconnect-*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 root root
}
EOF

echo "$(date): CodeConnect Recording VM setup completed successfully!" >> /var/log/codeconnect-startup.log

# Signal setup completion
touch /opt/codeconnect/.setup-complete
`,
  scriptPath: "/opt/codeconnect/",
  executeOnBoot: true,
  logPath: "/var/log/codeconnect-startup.log",
  dependencies: ["ffmpeg", "docker.io", "nodejs", "python3"],
  environmentVariables: {
    "CODECONNECT_ENV": "production",
    "NODE_ENV": "production",
    "RECORDING_STORAGE_PATH": "/opt/codeconnect/uploads"
  },
};

// All schemas and configurations are already exported above
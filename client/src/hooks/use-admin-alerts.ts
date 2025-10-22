import { useQuery } from '@tanstack/react-query';

export interface AdminAlert {
  id: string | number;
  type: 'warning' | 'error' | 'info';
  title?: string;
  message: string;
  timestamp: Date | string;
  time?: string;
  status?: string;
}

export function useAdminAlerts() {
  return useQuery<AdminAlert[]>({
    queryKey: ['admin-alerts'],
    queryFn: async () => {
      const response = await fetch('/api/admin/alerts');
      if (!response.ok) throw new Error('Failed to fetch alerts');
      const data = await response.json();
      return data.map((alert: any) => ({
        ...alert,
        timestamp: alert.timestamp || alert.time || new Date(),
        type: alert.type || 'info'
      }));
    }
  });
}

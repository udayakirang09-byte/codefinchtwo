import { useEffect } from 'react';
import { queryClient } from '@/lib/queryClient';

/**
 * C16: Real-time schedule sync hook
 * Listens for WebSocket schedule update events and invalidates relevant queries
 */
export function useScheduleSync(mentorId?: string) {
  useEffect(() => {
    if (!mentorId) return;

    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      try {
        // Connect to the WebSocket server at the video-signaling path
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/video-signaling`;
        
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('📡 [Schedule Sync] WebSocket connected for real-time updates');
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            
            // Handle schedule update events
            if (message.type === 'schedule-update') {
              console.log(`📡 [Schedule Sync] Received ${message.event} for mentor ${message.mentorId}`);
              
              // Only invalidate if the update is for the mentor we're watching
              if (message.mentorId === mentorId) {
                // Invalidate relevant queries to trigger refetch
                switch (message.event) {
                  case 'booking-created':
                  case 'booking-cancelled':
                    // Refresh bookings and availability
                    queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
                    queryClient.invalidateQueries({ queryKey: ['/api/teacher/classes'] });
                    queryClient.invalidateQueries({ queryKey: ['/api/student/classes'] });
                    queryClient.invalidateQueries({ queryKey: [`/api/mentors/${mentorId}/available-times`] });
                    console.log('✅ [Schedule Sync] Refreshed bookings and availability');
                    break;
                    
                  case 'availability-changed':
                  case 'availability-deleted':
                    // Refresh availability slots
                    queryClient.invalidateQueries({ queryKey: [`/api/mentors/${mentorId}/available-times`] });
                    queryClient.invalidateQueries({ queryKey: ['/api/teacher/schedule'] });
                    console.log('✅ [Schedule Sync] Refreshed availability slots');
                    break;
                }
              }
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('📡 [Schedule Sync] WebSocket error:', error);
        };

        ws.onclose = () => {
          console.log('📡 [Schedule Sync] WebSocket disconnected. Reconnecting in 3s...');
          // Attempt to reconnect after 3 seconds
          reconnectTimeout = setTimeout(connect, 3000);
        };
      } catch (error) {
        console.error('Error connecting to WebSocket:', error);
        // Retry connection after 3 seconds
        reconnectTimeout = setTimeout(connect, 3000);
      }
    };

    // Initial connection
    connect();

    // Cleanup on unmount
    return () => {
      if (ws) {
        ws.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [mentorId]);
}

// Global type declarations for server

declare global {
  var broadcastScheduleChange: (event: {
    type: 'booking-created' | 'booking-cancelled' | 'availability-changed' | 'availability-deleted';
    mentorId: string;
    data?: any;
  }) => void;
}

export {};

// Test script to see what the recording endpoint receives
const params = new URLSearchParams({
  bookingId: 'bfab5f06-7bde-4065-9b03-22b7413aa44b',
  partNumber: '1'
});

console.log('Test URL:', `/api/recordings/upload-part?${params.toString()}`);
console.log('Params:', Object.fromEntries(params));

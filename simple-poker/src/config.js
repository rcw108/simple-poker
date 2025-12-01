// Backend API configuration
// Update this with your ngrok URL when running locally
// Example: 'https://your-ngrok-url.ngrok-free.app'
// You can also set REACT_APP_API_URL environment variable
// IMPORTANT: Use HTTPS ngrok URL for backend, not http://127.0.0.1:4040 (that's ngrok web interface)
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://electrometric-troy-unscowlingly.ngrok-free.dev';

// For socket.io connections, use the same URL
// Socket.io will automatically handle http/https based on the URL protocol
export const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || API_BASE_URL;


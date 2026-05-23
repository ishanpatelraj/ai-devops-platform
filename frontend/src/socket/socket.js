import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
  withCredentials: true,
  autoConnect: false, // Only connect after the user logs in
  reconnectionDelay: 2000,
  reconnectionAttempts: 5,
});

export default socket;
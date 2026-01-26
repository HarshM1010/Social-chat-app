import { io } from 'socket.io-client';

export const socket = io('http://localhost:3001', {
  withCredentials: true,
  transports: ["websocket"],
  autoConnect: true,
});

socket.on('connect', () => {
  console.log('Socket connected:', socket.id);
});

socket.on('disconnect', () => {
  console.log('Socket disconnected');
});

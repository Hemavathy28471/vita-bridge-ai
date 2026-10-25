import { io } from 'socket.io-client';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io('/', {
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      console.log('[Socket.IO] Connected to VitaBridge telemetry stream:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket.IO] Telemetry disconnected:', reason);
    });
  }

  return socket;
};

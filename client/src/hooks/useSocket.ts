'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, []);

  const joinMarket = (marketId: number) => {
    socketRef.current?.emit('join-market', marketId);
  };

  const leaveMarket = (marketId: number) => {
    socketRef.current?.emit('leave-market', marketId);
  };

  const joinUser = (userId: number) => {
    socketRef.current?.emit('join-user', userId);
  };

  return {
    socket: socketRef.current,
    isConnected,
    joinMarket,
    leaveMarket,
    joinUser,
  };
}

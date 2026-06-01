import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import prisma from '../utils/prisma';

let io: SocketIOServer;

// Map: userId -> Set of socketIds
const userSockets = new Map<string, Set<string>>();
// Map: neighborhoodId -> Set of socketIds
const neighborhoodRooms = new Map<string, Set<string>>();

export function initializeSocket(server: HttpServer): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Auth middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const payload = verifyAccessToken(token);
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, role: true, phone: true, neighborhoodId: true, isActive: true },
      });

      if (!user || !user.isActive) {
        return next(new Error('User not found or inactive'));
      }

      (socket as Socket & { userId: string; neighborhoodId: string | null }).userId = user.id;
      (socket as Socket & { userId: string; neighborhoodId: string | null }).neighborhoodId = user.neighborhoodId;

      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = (socket as Socket & { userId: string; neighborhoodId: string | null }).userId;
    const neighborhoodId = (socket as Socket & { userId: string; neighborhoodId: string | null }).neighborhoodId;

    console.log(`[Socket] User ${userId} connected`);

    // Track user socket
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId)!.add(socket.id);

    // Auto-join user's neighborhood room
    if (neighborhoodId) {
      socket.join(`neighborhood:${neighborhoodId}`);
      if (!neighborhoodRooms.has(neighborhoodId)) {
        neighborhoodRooms.set(neighborhoodId, new Set());
      }
      neighborhoodRooms.get(neighborhoodId)!.add(socket.id);
    }

    // Join personal room for direct notifications
    socket.join(`user:${userId}`);

    // Handle explicit neighborhood join
    socket.on('join_neighborhood', (data: { neighborhoodId: string }) => {
      const { neighborhoodId: nId } = data;
      if (!nId) return;

      socket.join(`neighborhood:${nId}`);
      if (!neighborhoodRooms.has(nId)) {
        neighborhoodRooms.set(nId, new Set());
      }
      neighborhoodRooms.get(nId)!.add(socket.id);

      socket.emit('joined_neighborhood', { neighborhoodId: nId });
    });

    // Handle leaving neighborhood
    socket.on('leave_neighborhood', (data: { neighborhoodId: string }) => {
      const { neighborhoodId: nId } = data;
      if (!nId) return;

      socket.leave(`neighborhood:${nId}`);
      neighborhoodRooms.get(nId)?.delete(socket.id);
    });

    // Handle mark messages as read
    socket.on('mark_messages_read', async (data: { senderId: string }) => {
      try {
        const { senderId } = data;
        await prisma.message.updateMany({
          where: {
            senderId,
            receiverId: userId,
            isRead: false,
          },
          data: {
            isRead: true,
            readAt: new Date(),
          },
        });

        // Notify sender that messages were read
        notifyUser(senderId, 'messages_read', { byUserId: userId });
      } catch (error) {
        console.error('[Socket] Error marking messages as read:', error);
      }
    });

    // Handle typing indicator
    socket.on('typing', (data: { receiverId: string; isTyping: boolean }) => {
      const { receiverId, isTyping } = data;
      notifyUser(receiverId, 'user_typing', {
        userId,
        isTyping,
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`[Socket] User ${userId} disconnected`);

      // Clean up user socket tracking
      userSockets.get(userId)?.delete(socket.id);
      if (userSockets.get(userId)?.size === 0) {
        userSockets.delete(userId);
      }

      // Clean up neighborhood room tracking
      if (neighborhoodId) {
        neighborhoodRooms.get(neighborhoodId)?.delete(socket.id);
      }
    });
  });

  return io;
}

export function broadcastToNeighborhood(
  neighborhoodId: string,
  event: string,
  data: unknown
): void {
  if (!io) return;
  io.to(`neighborhood:${neighborhoodId}`).emit(event, data);
}

export function notifyUser(userId: string, event: string, data: unknown): void {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
}

export function getOnlineUsersInNeighborhood(neighborhoodId: string): number {
  if (!io) return 0;
  return io.sockets.adapter.rooms.get(`neighborhood:${neighborhoodId}`)?.size || 0;
}

export function isUserOnline(userId: string): boolean {
  return userSockets.has(userId) && (userSockets.get(userId)?.size || 0) > 0;
}

export function getIO(): SocketIOServer {
  return io;
}

import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import prisma from '../utils/prisma';

export async function getConversations(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;

    const messages = await prisma.message.findMany({
      where: {
        isActive: true,
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, displayName: true, avatarUrl: true } },
        receiver: { select: { id: true, firstName: true, lastName: true, displayName: true, avatarUrl: true } },
      },
    });

    // Group by conversation partner
    const conversationMap = new Map<string, { partner: Record<string, unknown>; lastMessage: Record<string, unknown>; unreadCount: number }>();

    for (const msg of messages) {
      const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      const partner = msg.senderId === userId ? msg.receiver : msg.sender;

      if (!conversationMap.has(partnerId)) {
        const unreadCount = await prisma.message.count({
          where: { senderId: partnerId, receiverId: userId, isRead: false, isActive: true },
        });
        conversationMap.set(partnerId, {
          partner: partner as unknown as Record<string, unknown>,
          lastMessage: msg as unknown as Record<string, unknown>,
          unreadCount,
        });
      }
    }

    res.json({
      success: true,
      data: Array.from(conversationMap.values()),
    });
  } catch (err) {
    console.error('[Messages] getConversations error:', err);
    res.status(500).json({ success: false, message: 'Failed to load conversations' });
  }
}

export async function getThread(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const partnerId = req.params.userId;
    const cursor = req.query.cursor as string | undefined;

    const messages = await prisma.message.findMany({
      where: {
        isActive: true,
        OR: [
          { senderId: userId, receiverId: partnerId },
          { senderId: partnerId, receiverId: userId },
        ],
        ...(cursor && { id: { lt: cursor } }),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        sender: { select: { id: true, firstName: true, displayName: true, avatarUrl: true } },
      },
    });

    res.json({ success: true, data: { messages: messages.reverse(), hasMore: messages.length === 50 } });
  } catch (err) {
    console.error('[Messages] getThread error:', err);
    res.status(500).json({ success: false, message: 'Failed to load messages' });
  }
}

export async function sendMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const senderId = req.user!.userId;
    const receiverId = req.params.userId;
    const { contentAr, contentEn, images } = req.body;

    if (!contentAr && !contentEn) {
      res.status(400).json({ success: false, message: 'Message content is required' });
      return;
    }

    const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver || !receiver.isActive) {
      res.status(404).json({ success: false, message: 'Recipient not found' });
      return;
    }

    const message = await prisma.message.create({
      data: { senderId, receiverId, contentAr, contentEn, images: images || [] },
      include: {
        sender: { select: { id: true, firstName: true, displayName: true, avatarUrl: true } },
      },
    });

    // Emit via socket
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${receiverId}`).emit('new_message', message);
    }

    // Create notification
    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: 'NEW_MESSAGE',
        titleEn: 'New message',
        titleAr: 'رسالة جديدة',
        bodyEn: `${message.sender.displayName || message.sender.firstName} sent you a message`,
        bodyAr: `أرسل لك ${message.sender.displayName || message.sender.firstName} رسالة`,
        data: { senderId, messageId: message.id },
      },
    });

    res.status(201).json({ success: true, data: message });
  } catch (err) {
    console.error('[Messages] sendMessage error:', err);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
}

export async function markThreadRead(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const partnerId = req.params.userId;

    await prisma.message.updateMany({
      where: { senderId: partnerId, receiverId: userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    res.json({ success: true });
  } catch (err) {
    console.error('[Messages] markThreadRead error:', err);
    res.status(500).json({ success: false, message: 'Failed to mark as read' });
  }
}

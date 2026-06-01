import { Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { encryptIfPresent, decryptIfPresent } from '../utils/encryption';

// GET /users/:id
export async function getUserById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const requesterId = req.user?.userId;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        neighborhood: { include: { governorate: true } },
      },
    });

    if (!user || !user.isActive) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Check connection status if requester is authenticated
    let connectionStatus = null;
    if (requesterId && requesterId !== id) {
      const connection = await prisma.userConnection.findFirst({
        where: {
          OR: [
            { fromUserId: requesterId, toUserId: id },
            { fromUserId: id, toUserId: requesterId },
          ],
        },
      });
      connectionStatus = connection?.status || null;

      // Hide profile if blocked
      if (connection?.status === 'BLOCKED') {
        res.status(403).json({ success: false, message: 'Unable to view this profile' });
        return;
      }
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        role: user.role,
        neighborhood: user.neighborhood,
        connectionStatus,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('[Users] getUserById error:', error);
    res.status(500).json({ success: false, message: 'Failed to get user' });
  }
}

// PATCH /users/me
export async function updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { firstName, lastName, displayName, bio, email, preferredLanguage, address, neighborhoodId } =
      req.body as {
        firstName?: string;
        lastName?: string;
        displayName?: string;
        bio?: string;
        email?: string;
        preferredLanguage?: string;
        address?: string;
        neighborhoodId?: string;
      };

    // Check email uniqueness
    if (email) {
      const existingEmail = await prisma.user.findFirst({
        where: { email, id: { not: userId } },
      });
      if (existingEmail) {
        res.status(409).json({ success: false, message: 'Email already in use' });
        return;
      }
    }

    // Validate neighborhood
    if (neighborhoodId) {
      const neighborhood = await prisma.neighborhood.findUnique({ where: { id: neighborhoodId } });
      if (!neighborhood) {
        res.status(400).json({ success: false, message: 'Invalid neighborhood ID' });
        return;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(displayName !== undefined && { displayName }),
        ...(bio !== undefined && { bio }),
        ...(email !== undefined && { email }),
        ...(preferredLanguage && { preferredLanguage: preferredLanguage as 'AR' | 'EN' }),
        ...(neighborhoodId !== undefined && { neighborhoodId }),
        ...(address !== undefined && { addressEncrypted: encryptIfPresent(address) }),
      },
      include: {
        neighborhood: { include: { governorate: true } },
      },
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: updatedUser.id,
        phone: updatedUser.phone,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        displayName: updatedUser.displayName,
        avatarUrl: updatedUser.avatarUrl,
        bio: updatedUser.bio,
        role: updatedUser.role,
        preferredLanguage: updatedUser.preferredLanguage,
        neighborhoodId: updatedUser.neighborhoodId,
        neighborhood: updatedUser.neighborhood,
        address: decryptIfPresent(updatedUser.addressEncrypted),
      },
    });
  } catch (error) {
    console.error('[Users] updateProfile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
}

// PATCH /users/me/password
export async function changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { currentPassword, newPassword } = req.body as {
      currentPassword?: string;
      newPassword: string;
    };

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (user.passwordHash) {
      if (!currentPassword) {
        res.status(400).json({ success: false, message: 'Current password is required' });
        return;
      }
      const valid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!valid) {
        res.status(401).json({ success: false, message: 'Current password is incorrect' });
        return;
      }
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('[Users] changePassword error:', error);
    res.status(500).json({ success: false, message: 'Failed to change password' });
  }
}

// PATCH /users/me/avatar
export async function updateAvatar(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { avatarUrl } = req.body as { avatarUrl: string };

    const user = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });

    res.json({
      success: true,
      message: 'Avatar updated successfully',
      data: { avatarUrl: user.avatarUrl },
    });
  } catch (error) {
    console.error('[Users] updateAvatar error:', error);
    res.status(500).json({ success: false, message: 'Failed to update avatar' });
  }
}

// POST /users/:id/connect
export async function sendConnectionRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const fromUserId = req.user!.userId;
    const toUserId = req.params.id;

    if (fromUserId === toUserId) {
      res.status(400).json({ success: false, message: 'Cannot connect with yourself' });
      return;
    }

    const toUser = await prisma.user.findUnique({ where: { id: toUserId } });
    if (!toUser || !toUser.isActive) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const existing = await prisma.userConnection.findFirst({
      where: {
        OR: [
          { fromUserId, toUserId },
          { fromUserId: toUserId, toUserId: fromUserId },
        ],
      },
    });

    if (existing) {
      res.status(409).json({
        success: false,
        message: `Connection already exists with status: ${existing.status}`,
      });
      return;
    }

    const connection = await prisma.userConnection.create({
      data: { fromUserId, toUserId },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: toUserId,
        type: 'CONNECTION_REQUEST',
        titleEn: 'New Connection Request',
        titleAr: 'طلب تواصل جديد',
        bodyEn: 'sent you a connection request',
        bodyAr: 'أرسل لك طلب تواصل',
        data: { fromUserId, connectionId: connection.id },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Connection request sent',
      data: connection,
    });
  } catch (error) {
    console.error('[Users] sendConnectionRequest error:', error);
    res.status(500).json({ success: false, message: 'Failed to send connection request' });
  }
}

// PATCH /users/connections/:connectionId
export async function respondToConnection(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { connectionId } = req.params;
    const { action } = req.body as { action: 'accept' | 'reject' | 'block' };

    const connection = await prisma.userConnection.findUnique({ where: { id: connectionId } });
    if (!connection) {
      res.status(404).json({ success: false, message: 'Connection not found' });
      return;
    }

    if (connection.toUserId !== userId) {
      res.status(403).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (action === 'accept') {
      await prisma.userConnection.update({
        where: { id: connectionId },
        data: { status: 'ACCEPTED' },
      });

      await prisma.notification.create({
        data: {
          userId: connection.fromUserId,
          type: 'CONNECTION_ACCEPTED',
          titleEn: 'Connection Accepted',
          titleAr: 'تم قبول طلب التواصل',
          bodyEn: 'accepted your connection request',
          bodyAr: 'قبل طلب تواصلك',
          data: { userId, connectionId },
        },
      });

      res.json({ success: true, message: 'Connection accepted' });
    } else if (action === 'reject') {
      await prisma.userConnection.delete({ where: { id: connectionId } });
      res.json({ success: true, message: 'Connection rejected' });
    } else if (action === 'block') {
      await prisma.userConnection.update({
        where: { id: connectionId },
        data: { status: 'BLOCKED' },
      });
      res.json({ success: true, message: 'User blocked' });
    } else {
      res.status(400).json({ success: false, message: 'Invalid action' });
    }
  } catch (error) {
    console.error('[Users] respondToConnection error:', error);
    res.status(500).json({ success: false, message: 'Failed to update connection' });
  }
}

// GET /users/me/connections
export async function getMyConnections(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { status = 'ACCEPTED' } = req.query as { status?: string };

    const connections = await prisma.userConnection.findMany({
      where: {
        OR: [
          { fromUserId: userId, status: status as 'PENDING' | 'ACCEPTED' | 'BLOCKED' },
          { toUserId: userId, status: status as 'PENDING' | 'ACCEPTED' | 'BLOCKED' },
        ],
      },
      include: {
        fromUser: {
          select: { id: true, firstName: true, lastName: true, displayName: true, avatarUrl: true, neighborhoodId: true },
        },
        toUser: {
          select: { id: true, firstName: true, lastName: true, displayName: true, avatarUrl: true, neighborhoodId: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const result = connections.map((conn) => ({
      id: conn.id,
      status: conn.status,
      createdAt: conn.createdAt,
      user: conn.fromUserId === userId ? conn.toUser : conn.fromUser,
      direction: conn.fromUserId === userId ? 'sent' : 'received',
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[Users] getMyConnections error:', error);
    res.status(500).json({ success: false, message: 'Failed to get connections' });
  }
}

// GET /users/me/notifications
export async function getNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { page = '1', limit = '20', unreadOnly = 'false' } = req.query as Record<string, string>;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const where = {
      userId,
      ...(unreadOnly === 'true' && { isRead: false }),
    };

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.notification.count({ where }),
    ]);

    res.json({
      success: true,
      data: notifications,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('[Users] getNotifications error:', error);
    res.status(500).json({ success: false, message: 'Failed to get notifications' });
  }
}

// PATCH /users/me/notifications/read
export async function markNotificationsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { notificationIds } = req.body as { notificationIds?: string[] };

    if (notificationIds && notificationIds.length > 0) {
      await prisma.notification.updateMany({
        where: { id: { in: notificationIds }, userId },
        data: { isRead: true, readAt: new Date() },
      });
    } else {
      // Mark all as read
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true, readAt: new Date() },
      });
    }

    res.json({ success: true, message: 'Notifications marked as read' });
  } catch (error) {
    console.error('[Users] markNotificationsRead error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark notifications as read' });
  }
}

// DELETE /users/me
export async function deleteMyAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;

    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    res.json({ success: true, message: 'Account deactivated successfully' });
  } catch (error) {
    console.error('[Users] deleteMyAccount error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete account' });
  }
}

// Aliases and additional exports to match route expectations
export const getMyProfile = getUserById;
export const updateMyProfile = updateProfile;
export const getMyNotifications = getNotifications;
export const markAllNotificationsRead = markNotificationsRead;

export async function getNeighborhoodChampions(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user?.neighborhoodId) {
      res.json({ success: true, data: [] });
      return;
    }

    const champions = await prisma.user.findMany({
      where: { neighborhoodId: user.neighborhoodId, role: 'NEIGHBORHOOD_CHAMPION', isActive: true },
      select: { id: true, firstName: true, lastName: true, displayName: true, avatarUrl: true, bio: true, role: true },
    });

    res.json({ success: true, data: champions });
  } catch (error) {
    console.error('[Users] getNeighborhoodChampions error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch champions' });
  }
}

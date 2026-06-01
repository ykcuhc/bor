import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { broadcastToNeighborhood } from '../socket';

// GET /alerts
export async function listAlerts(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { page = '1', limit = '20', type, severity, neighborhoodId: qNeighborhoodId } = req.query as Record<string, string>;

    const pageNum = parseInt(page, 10);
    const limitNum = Math.min(parseInt(limit, 10), 50);
    const skip = (pageNum - 1) * limitNum;

    let neighborhoodId = qNeighborhoodId;
    if (!neighborhoodId) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { neighborhoodId: true } });
      neighborhoodId = user?.neighborhoodId ?? undefined;
    }

    if (!neighborhoodId) {
      res.status(400).json({ success: false, message: 'Neighborhood not set' });
      return;
    }

    const where: Record<string, unknown> = {
      neighborhoodId,
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    };
    if (type) where.type = type;
    if (severity) where.severity = severity;

    const [alerts, total] = await Promise.all([
      prisma.alert.findMany({
        where,
        include: {
          author: { select: { id: true, firstName: true, lastName: true, displayName: true, avatarUrl: true } },
          neighborhood: { select: { id: true, nameEn: true, nameAr: true } },
          _count: { select: { comments: true, reactions: true } },
        },
        orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limitNum,
      }),
      prisma.alert.count({ where }),
    ]);

    res.json({
      success: true,
      data: alerts,
      meta: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    console.error('[Alerts] listAlerts error:', error);
    res.status(500).json({ success: false, message: 'Failed to list alerts' });
  }
}

// GET /alerts/:id
export async function getAlertById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const alert = await prisma.alert.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, displayName: true, avatarUrl: true } },
        neighborhood: { include: { governorate: true } },
        _count: { select: { comments: true, reactions: true } },
      },
    });

    if (!alert || !alert.isActive) {
      res.status(404).json({ success: false, message: 'Alert not found' });
      return;
    }

    res.json({ success: true, data: alert });
  } catch (error) {
    console.error('[Alerts] getAlertById error:', error);
    res.status(500).json({ success: false, message: 'Failed to get alert' });
  }
}

// POST /alerts
export async function createAlert(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const {
      type,
      severity,
      titleEn,
      titleAr,
      descriptionEn,
      descriptionAr,
      images,
      latitude,
      longitude,
      expiresAt,
    } = req.body as {
      type: string;
      severity?: string;
      titleEn?: string;
      titleAr?: string;
      descriptionEn?: string;
      descriptionAr?: string;
      images?: string[];
      latitude?: number;
      longitude?: number;
      expiresAt?: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { neighborhoodId: true },
    });

    if (!user?.neighborhoodId) {
      res.status(400).json({ success: false, message: 'You must be assigned to a neighborhood to create alerts' });
      return;
    }

    const alert = await prisma.alert.create({
      data: {
        authorId: userId,
        neighborhoodId: user.neighborhoodId,
        type: type as 'FIRE',
        severity: (severity as 'MEDIUM') || 'MEDIUM',
        titleEn,
        titleAr,
        descriptionEn,
        descriptionAr,
        images: images || [],
        latitude,
        longitude,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, displayName: true, avatarUrl: true } },
        neighborhood: { select: { id: true, nameEn: true, nameAr: true } },
      },
    });

    // Broadcast alert to all neighborhood members via socket
    broadcastToNeighborhood(user.neighborhoodId, 'new_alert', alert);

    // Create notifications for all neighborhood users
    const neighborhoodUsers = await prisma.user.findMany({
      where: { neighborhoodId: user.neighborhoodId, isActive: true, id: { not: userId } },
      select: { id: true },
    });

    if (neighborhoodUsers.length > 0) {
      await prisma.notification.createMany({
        data: neighborhoodUsers.map((u) => ({
          userId: u.id,
          type: 'NEW_ALERT' as const,
          titleEn: titleEn || 'New Alert',
          titleAr: titleAr || 'تنبيه جديد',
          bodyEn: descriptionEn || 'New alert in your neighborhood',
          bodyAr: descriptionAr || 'تنبيه جديد في حيك',
          data: { alertId: alert.id, type, severity },
        })),
      });
    }

    res.status(201).json({ success: true, message: 'Alert created', data: alert });
  } catch (error) {
    console.error('[Alerts] createAlert error:', error);
    res.status(500).json({ success: false, message: 'Failed to create alert' });
  }
}

// PATCH /alerts/:id
export async function updateAlert(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const updates = req.body as Record<string, unknown>;

    const alert = await prisma.alert.findUnique({ where: { id } });
    if (!alert || !alert.isActive) {
      res.status(404).json({ success: false, message: 'Alert not found' });
      return;
    }

    const userRole = req.user!.role;
    if (alert.authorId !== userId && !['ADMIN', 'SUPER_ADMIN', 'NEIGHBORHOOD_CHAMPION'].includes(userRole)) {
      res.status(403).json({ success: false, message: 'Not authorized to update this alert' });
      return;
    }

    const updated = await prisma.alert.update({
      where: { id },
      data: {
        ...(updates.severity && { severity: updates.severity as 'MEDIUM' }),
        ...(updates.titleEn !== undefined && { titleEn: updates.titleEn as string }),
        ...(updates.titleAr !== undefined && { titleAr: updates.titleAr as string }),
        ...(updates.descriptionEn !== undefined && { descriptionEn: updates.descriptionEn as string }),
        ...(updates.descriptionAr !== undefined && { descriptionAr: updates.descriptionAr as string }),
        ...(updates.isVerified !== undefined && { isVerified: updates.isVerified as boolean }),
        ...(updates.expiresAt && { expiresAt: new Date(updates.expiresAt as string) }),
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, displayName: true, avatarUrl: true } },
      },
    });

    res.json({ success: true, message: 'Alert updated', data: updated });
  } catch (error) {
    console.error('[Alerts] updateAlert error:', error);
    res.status(500).json({ success: false, message: 'Failed to update alert' });
  }
}

// DELETE /alerts/:id
export async function deleteAlert(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const alert = await prisma.alert.findUnique({ where: { id } });
    if (!alert) {
      res.status(404).json({ success: false, message: 'Alert not found' });
      return;
    }

    const userRole = req.user!.role;
    if (alert.authorId !== userId && !['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      res.status(403).json({ success: false, message: 'Not authorized to delete this alert' });
      return;
    }

    await prisma.alert.update({ where: { id }, data: { isActive: false } });

    res.json({ success: true, message: 'Alert deleted' });
  } catch (error) {
    console.error('[Alerts] deleteAlert error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete alert' });
  }
}

// PATCH /alerts/:id/verify (Admin/Champion only)
export async function verifyAlert(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const alert = await prisma.alert.findUnique({ where: { id } });
    if (!alert) {
      res.status(404).json({ success: false, message: 'Alert not found' });
      return;
    }

    await prisma.alert.update({ where: { id }, data: { isVerified: true } });

    res.json({ success: true, message: 'Alert verified' });
  } catch (error) {
    console.error('[Alerts] verifyAlert error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify alert' });
  }
}

import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import prisma from '../utils/prisma';

export async function getReports(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { status = 'PENDING', page = '1' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const take = 20;
    const skip = (pageNum - 1) * take;

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where: { status: status as 'PENDING' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED' },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          reportedBy: { select: { id: true, firstName: true, displayName: true, avatarUrl: true } },
          post: { select: { id: true, contentAr: true, contentEn: true } },
          comment: { select: { id: true, contentAr: true, contentEn: true } },
          reportedUser: { select: { id: true, firstName: true, displayName: true } },
        },
      }),
      prisma.report.count({ where: { status: status as 'PENDING' } }),
    ]);

    res.json({ success: true, data: { reports, total, page: pageNum } });
  } catch (err) {
    console.error('[Admin] getReports error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch reports' });
  }
}

export async function resolveReport(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { action, note } = req.body as { action: 'warn' | 'delete' | 'ban' | 'dismiss'; note?: string };

    const report = await prisma.report.findUnique({
      where: { id: req.params.id },
      include: { post: true, comment: true, reportedUser: true },
    });

    if (!report) {
      res.status(404).json({ success: false, message: 'Report not found' });
      return;
    }

    if (action === 'delete') {
      if (report.postId) await prisma.post.update({ where: { id: report.postId }, data: { isActive: false } });
      if (report.commentId) await prisma.comment.update({ where: { id: report.commentId }, data: { isActive: false } });
    } else if (action === 'ban' && report.reportedUserId) {
      await prisma.user.update({ where: { id: report.reportedUserId }, data: { isActive: false } });
    }

    const updated = await prisma.report.update({
      where: { id: req.params.id },
      data: {
        status: action === 'dismiss' ? 'DISMISSED' : 'RESOLVED',
        reviewedAt: new Date(),
        reviewNote: note,
      },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('[Admin] resolveReport error:', err);
    res.status(500).json({ success: false, message: 'Failed to resolve report' });
  }
}

export async function getUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { search, neighborhoodId, governorateId, page = '1' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const take = 20;
    const skip = (pageNum - 1) * take;

    const where: Record<string, unknown> = {
      ...(search && {
        OR: [
          { firstName: { contains: search as string, mode: 'insensitive' } },
          { lastName: { contains: search as string, mode: 'insensitive' } },
          { phone: { contains: search as string } },
          { email: { contains: search as string, mode: 'insensitive' } },
        ],
      }),
      ...(neighborhoodId && { neighborhoodId }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          phone: true,
          email: true,
          firstName: true,
          lastName: true,
          displayName: true,
          avatarUrl: true,
          role: true,
          isActive: true,
          isVerified: true,
          neighborhoodId: true,
          neighborhood: { select: { id: true, nameAr: true, nameEn: true } },
          createdAt: true,
          lastLoginAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ success: true, data: { users, total, page: pageNum } });
  } catch (err) {
    console.error('[Admin] getUsers error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
}

export async function banUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { banned, reason } = req.body as { banned: boolean; reason?: string };

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: !banned },
      select: { id: true, isActive: true, role: true },
    });

    res.json({ success: true, data: user });
  } catch (err) {
    console.error('[Admin] banUser error:', err);
    res.status(500).json({ success: false, message: 'Failed to update user status' });
  }
}

export async function promoteUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { role } = req.body as { role: 'USER' | 'NEIGHBORHOOD_CHAMPION' | 'ADMIN' };

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: { id: true, role: true, firstName: true, displayName: true },
    });

    res.json({ success: true, data: user });
  } catch (err) {
    console.error('[Admin] promoteUser error:', err);
    res.status(500).json({ success: false, message: 'Failed to update user role' });
  }
}

export async function getStats(_req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalUsers, activeToday, totalPosts, pendingReports, totalAlerts, totalBusinesses, newUsersThisWeek] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { lastLoginAt: { gte: today } } }),
        prisma.post.count({ where: { isActive: true } }),
        prisma.report.count({ where: { status: 'PENDING' } }),
        prisma.alert.count({ where: { isActive: true } }),
        prisma.business.count({ where: { isActive: true } }),
        prisma.user.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
      ]);

    res.json({
      success: true,
      data: { totalUsers, activeToday, totalPosts, pendingReports, totalAlerts, totalBusinesses, newUsersThisWeek },
    });
  } catch (err) {
    console.error('[Admin] getStats error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
}

export async function broadcastAlert(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { titleAr, titleEn, descriptionAr, descriptionEn, type, severity, neighborhoodIds, governorateIds } = req.body;

    const io = req.app.get('io');

    // Create alerts for specified neighborhoods
    const neighborhoods = neighborhoodIds?.length
      ? await prisma.neighborhood.findMany({ where: { id: { in: neighborhoodIds } } })
      : await prisma.neighborhood.findMany({
          where: governorateIds?.length ? { governorateId: { in: governorateIds } } : {},
        });

    const alerts = await Promise.all(
      neighborhoods.map((n: { id: string }) =>
        prisma.alert.create({
          data: {
            authorId: req.user!.userId,
            neighborhoodId: n.id,
            type: type || 'OTHER',
            severity: severity || 'HIGH',
            titleAr,
            titleEn,
            descriptionAr,
            descriptionEn,
          },
        })
      )
    );

    // Broadcast via socket
    if (io) {
      neighborhoods.forEach((n: { id: string }) => {
        io.to(`neighborhood:${n.id}`).emit('new_alert', { neighborhoodId: n.id, alert: alerts });
      });
    }

    res.json({ success: true, data: { alertsCreated: alerts.length } });
  } catch (err) {
    console.error('[Admin] broadcastAlert error:', err);
    res.status(500).json({ success: false, message: 'Failed to broadcast alert' });
  }
}

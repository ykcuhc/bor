import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { AuthenticatedRequest } from '../middleware/auth';

// GET /neighborhoods
export async function listNeighborhoods(req: Request, res: Response): Promise<void> {
  try {
    const { governorateId, search, page = '1', limit = '50' } = req.query as Record<string, string>;

    const pageNum = parseInt(page, 10);
    const limitNum = Math.min(parseInt(limit, 10), 100);
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = {};
    if (governorateId) where.governorateId = governorateId;
    if (search) {
      where.OR = [
        { nameEn: { contains: search, mode: 'insensitive' } },
        { nameAr: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [neighborhoods, total] = await Promise.all([
      prisma.neighborhood.findMany({
        where,
        include: { governorate: true },
        orderBy: { nameEn: 'asc' },
        skip,
        take: limitNum,
      }),
      prisma.neighborhood.count({ where }),
    ]);

    res.json({
      success: true,
      data: neighborhoods,
      meta: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    console.error('[Neighborhoods] listNeighborhoods error:', error);
    res.status(500).json({ success: false, message: 'Failed to list neighborhoods' });
  }
}

// GET /neighborhoods/:id
export async function getNeighborhoodById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const neighborhood = await prisma.neighborhood.findUnique({
      where: { id },
      include: {
        governorate: true,
        _count: {
          select: { users: true, posts: true, alerts: true, events: true, businesses: true },
        },
      },
    });

    if (!neighborhood) {
      res.status(404).json({ success: false, message: 'Neighborhood not found' });
      return;
    }

    res.json({ success: true, data: neighborhood });
  } catch (error) {
    console.error('[Neighborhoods] getNeighborhoodById error:', error);
    res.status(500).json({ success: false, message: 'Failed to get neighborhood' });
  }
}

// GET /neighborhoods/governorates
export async function listGovernorates(_req: Request, res: Response): Promise<void> {
  try {
    const governorates = await prisma.governorate.findMany({
      include: {
        _count: { select: { neighborhoods: true } },
      },
      orderBy: { nameEn: 'asc' },
    });

    res.json({ success: true, data: governorates });
  } catch (error) {
    console.error('[Neighborhoods] listGovernorates error:', error);
    res.status(500).json({ success: false, message: 'Failed to list governorates' });
  }
}

// GET /neighborhoods/:id/stats
export async function getNeighborhoodStats(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const neighborhood = await prisma.neighborhood.findUnique({ where: { id } });
    if (!neighborhood) {
      res.status(404).json({ success: false, message: 'Neighborhood not found' });
      return;
    }

    const [userCount, postCount, alertCount, eventCount, businessCount, recentPosts, recentAlerts] =
      await Promise.all([
        prisma.user.count({ where: { neighborhoodId: id, isActive: true } }),
        prisma.post.count({ where: { neighborhoodId: id, isActive: true } }),
        prisma.alert.count({ where: { neighborhoodId: id, isActive: true } }),
        prisma.event.count({ where: { neighborhoodId: id, isActive: true } }),
        prisma.business.count({ where: { neighborhoodId: id, isActive: true } }),
        prisma.post.findMany({
          where: { neighborhoodId: id, isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: { author: { select: { id: true, displayName: true, avatarUrl: true } } },
        }),
        prisma.alert.findMany({
          where: { neighborhoodId: id, isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 3,
        }),
      ]);

    res.json({
      success: true,
      data: {
        neighborhood,
        stats: { userCount, postCount, alertCount, eventCount, businessCount },
        recentPosts,
        recentAlerts,
      },
    });
  } catch (error) {
    console.error('[Neighborhoods] getNeighborhoodStats error:', error);
    res.status(500).json({ success: false, message: 'Failed to get neighborhood stats' });
  }
}

// GET /neighborhoods/:id/members
export async function getNeighborhoodMembers(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { page = '1', limit = '20', role } = req.query as Record<string, string>;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = { neighborhoodId: id, isActive: true };
    if (role) where.role = role;

    const [members, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          displayName: true,
          avatarUrl: true,
          role: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: members,
      meta: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    console.error('[Neighborhoods] getNeighborhoodMembers error:', error);
    res.status(500).json({ success: false, message: 'Failed to get neighborhood members' });
  }
}

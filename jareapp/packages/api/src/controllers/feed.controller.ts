import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import prisma from '../utils/prisma';

const PAGE_SIZE = 20;

export async function getFeed(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user?.neighborhoodId) {
      res.status(400).json({ success: false, message: 'Please set your neighborhood first' });
      return;
    }

    const cursor = req.query.cursor as string | undefined;
    const category = req.query.category as string | undefined;

    const where: Record<string, unknown> = {
      neighborhoodId: user.neighborhoodId,
      isActive: true,
      ...(category && { category }),
      ...(cursor && { id: { lt: cursor } }),
    };

    const posts = await prisma.post.findMany({
      where,
      take: PAGE_SIZE + 1,
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            displayName: true,
            avatarUrl: true,
            role: true,
            neighborhoodId: true,
          },
        },
        neighborhood: { select: { id: true, nameAr: true, nameEn: true } },
        _count: { select: { comments: true, reactions: true } },
        reactions: {
          where: { userId: req.user!.userId },
          select: { type: true },
        },
      },
    });

    const hasMore = posts.length > PAGE_SIZE;
    const items = hasMore ? posts.slice(0, PAGE_SIZE) : posts;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    // Inject sponsored post every 8 items (monetization placeholder)
    const enriched = items.map((p) => ({
      ...p,
      myReaction: p.reactions[0]?.type || null,
      reactions: undefined,
    }));

    res.json({
      success: true,
      data: { posts: enriched, nextCursor, hasMore },
    });
  } catch (err) {
    console.error('[Feed] getFeed error:', err);
    res.status(500).json({ success: false, message: 'Failed to load feed' });
  }
}

export async function getNearbyFeed(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: { neighborhood: { include: { governorate: true } } },
    });

    if (!user?.neighborhoodId || !user.neighborhood) {
      res.status(400).json({ success: false, message: 'Neighborhood not set' });
      return;
    }

    const cursor = req.query.cursor as string | undefined;

    // Get all neighborhoods in same governorate (adjacent)
    const sameGovernorateNeighborhoods = await prisma.neighborhood.findMany({
      where: {
        governorateId: user.neighborhood.governorateId,
        id: { not: user.neighborhoodId },
      },
      select: { id: true },
    });

    const neighborhoodIds = sameGovernorateNeighborhoods.map((n) => n.id);

    const posts = await prisma.post.findMany({
      where: {
        neighborhoodId: { in: neighborhoodIds },
        isActive: true,
        ...(cursor && { id: { lt: cursor } }),
      },
      take: PAGE_SIZE + 1,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            displayName: true,
            avatarUrl: true,
            role: true,
          },
        },
        neighborhood: { select: { id: true, nameAr: true, nameEn: true } },
        _count: { select: { comments: true, reactions: true } },
        reactions: {
          where: { userId: req.user!.userId },
          select: { type: true },
        },
      },
    });

    const hasMore = posts.length > PAGE_SIZE;
    const items = (hasMore ? posts.slice(0, PAGE_SIZE) : posts).map((p) => ({
      ...p,
      myReaction: p.reactions[0]?.type || null,
      reactions: undefined,
    }));

    res.json({
      success: true,
      data: { posts: items, nextCursor: hasMore ? items[items.length - 1].id : null, hasMore },
    });
  } catch (err) {
    console.error('[Feed] getNearbyFeed error:', err);
    res.status(500).json({ success: false, message: 'Failed to load nearby feed' });
  }
}

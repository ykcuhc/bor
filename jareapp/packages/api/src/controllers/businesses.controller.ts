import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import prisma from '../utils/prisma';

export async function createBusiness(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { nameEn, nameAr, descriptionEn, descriptionAr, category, phone, email, website, address, neighborhoodId } = req.body;

    const targetNeighborhood = neighborhoodId || (
      await prisma.user.findUnique({ where: { id: req.user!.userId } })
    )?.neighborhoodId;

    if (!targetNeighborhood) {
      res.status(400).json({ success: false, message: 'Neighborhood is required' });
      return;
    }

    const business = await prisma.business.create({
      data: {
        ownerId: req.user!.userId,
        neighborhoodId: targetNeighborhood,
        nameEn,
        nameAr,
        descriptionEn,
        descriptionAr,
        category,
        phone,
        email,
        website,
        address,
      },
    });

    res.status(201).json({ success: true, data: business });
  } catch (err) {
    console.error('[Business] createBusiness error:', err);
    res.status(500).json({ success: false, message: 'Failed to create business' });
  }
}

export async function getBusinesses(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    const { category, search, page = '1' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const take = 20;
    const skip = (pageNum - 1) * take;

    const where: Record<string, unknown> = {
      isActive: true,
      ...(user?.neighborhoodId && { neighborhoodId: user.neighborhoodId }),
      ...(category && { category }),
      ...(search && {
        OR: [
          { nameEn: { contains: search as string, mode: 'insensitive' } },
          { nameAr: { contains: search as string, mode: 'insensitive' } },
        ],
      }),
    };

    const [businesses, total] = await Promise.all([
      prisma.business.findMany({
        where,
        skip,
        take,
        orderBy: [{ averageRating: 'desc' }, { createdAt: 'desc' }],
        include: {
          neighborhood: { select: { id: true, nameAr: true, nameEn: true } },
          _count: { select: { reviews: true } },
        },
      }),
      prisma.business.count({ where }),
    ]);

    res.json({ success: true, data: { businesses, total, page: pageNum, hasMore: skip + take < total } });
  } catch (err) {
    console.error('[Business] getBusinesses error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch businesses' });
  }
}

export async function getBusinessById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const business = await prisma.business.findUnique({
      where: { id: req.params.id },
      include: {
        neighborhood: { include: { governorate: true } },
        reviews: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            user: { select: { id: true, firstName: true, lastName: true, displayName: true, avatarUrl: true } },
          },
        },
        _count: { select: { reviews: true } },
      },
    });

    if (!business || !business.isActive) {
      res.status(404).json({ success: false, message: 'Business not found' });
      return;
    }

    res.json({ success: true, data: business });
  } catch (err) {
    console.error('[Business] getBusinessById error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch business' });
  }
}

export async function updateBusiness(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const business = await prisma.business.findUnique({ where: { id: req.params.id } });

    if (!business) {
      res.status(404).json({ success: false, message: 'Business not found' });
      return;
    }

    if (business.ownerId !== req.user!.userId && !['ADMIN', 'SUPER_ADMIN'].includes(req.user!.role)) {
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }

    const { nameEn, nameAr, descriptionEn, descriptionAr, phone, email, website, address, images, openingHours } = req.body;

    const updated = await prisma.business.update({
      where: { id: req.params.id },
      data: { nameEn, nameAr, descriptionEn, descriptionAr, phone, email, website, address, images, openingHours },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('[Business] updateBusiness error:', err);
    res.status(500).json({ success: false, message: 'Failed to update business' });
  }
}

export async function addReview(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { rating, reviewEn, reviewAr } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
      return;
    }

    const business = await prisma.business.findUnique({ where: { id: req.params.id } });
    if (!business || !business.isActive) {
      res.status(404).json({ success: false, message: 'Business not found' });
      return;
    }

    const review = await prisma.businessReview.upsert({
      where: { businessId_userId: { businessId: req.params.id, userId: req.user!.userId } },
      create: { businessId: req.params.id, userId: req.user!.userId, rating, reviewEn, reviewAr },
      update: { rating, reviewEn, reviewAr },
    });

    // Recalculate average rating
    const agg = await prisma.businessReview.aggregate({
      where: { businessId: req.params.id, isActive: true },
      _avg: { rating: true },
      _count: true,
    });

    await prisma.business.update({
      where: { id: req.params.id },
      data: {
        averageRating: agg._avg.rating || 0,
        reviewCount: agg._count,
      },
    });

    res.json({ success: true, data: review });
  } catch (err) {
    console.error('[Business] addReview error:', err);
    res.status(500).json({ success: false, message: 'Failed to add review' });
  }
}

export async function getFeaturedBusinesses(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });

    const businesses = await prisma.business.findMany({
      where: {
        isActive: true,
        isVerified: true,
        ...(user?.neighborhoodId && { neighborhoodId: user.neighborhoodId }),
      },
      orderBy: { averageRating: 'desc' },
      take: 5,
      include: {
        neighborhood: { select: { id: true, nameAr: true, nameEn: true } },
      },
    });

    res.json({ success: true, data: businesses });
  } catch (err) {
    console.error('[Business] getFeaturedBusinesses error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch featured businesses' });
  }
}

import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { broadcastToNeighborhood } from '../socket';

// GET /posts  (neighborhood-scoped)
export async function listPosts(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { page = '1', limit = '20', category, neighborhoodId: qNeighborhoodId } = req.query as Record<string, string>;

    const pageNum = parseInt(page, 10);
    const limitNum = Math.min(parseInt(limit, 10), 50);
    const skip = (pageNum - 1) * limitNum;

    // Determine which neighborhood to show
    let neighborhoodId = qNeighborhoodId;
    if (!neighborhoodId) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { neighborhoodId: true } });
      neighborhoodId = user?.neighborhoodId ?? undefined;
    }

    if (!neighborhoodId) {
      res.status(400).json({ success: false, message: 'Neighborhood not set. Please update your profile.' });
      return;
    }

    const where: Record<string, unknown> = { neighborhoodId, isActive: true };
    if (category) where.category = category;

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          author: { select: { id: true, firstName: true, lastName: true, displayName: true, avatarUrl: true } },
          neighborhood: { select: { id: true, nameEn: true, nameAr: true } },
          _count: { select: { comments: true, reactions: true } },
        },
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limitNum,
      }),
      prisma.post.count({ where }),
    ]);

    // Mask author for anonymous posts
    const result = posts.map((post) => ({
      ...post,
      author: post.isAnonymous ? null : post.author,
    }));

    res.json({
      success: true,
      data: result,
      meta: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    console.error('[Posts] listPosts error:', error);
    res.status(500).json({ success: false, message: 'Failed to list posts' });
  }
}

// GET /posts/:id
export async function getPostById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, displayName: true, avatarUrl: true } },
        neighborhood: { include: { governorate: true } },
        _count: { select: { comments: true, reactions: true } },
      },
    });

    if (!post || !post.isActive) {
      res.status(404).json({ success: false, message: 'Post not found' });
      return;
    }

    // Increment view count
    await prisma.post.update({ where: { id }, data: { viewCount: { increment: 1 } } });

    res.json({
      success: true,
      data: {
        ...post,
        author: post.isAnonymous ? null : post.author,
        viewCount: post.viewCount + 1,
      },
    });
  } catch (error) {
    console.error('[Posts] getPostById error:', error);
    res.status(500).json({ success: false, message: 'Failed to get post' });
  }
}

// POST /posts
export async function createPost(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { category, titleEn, titleAr, contentEn, contentAr, images, isAnonymous } = req.body as {
      category?: string;
      titleEn?: string;
      titleAr?: string;
      contentEn?: string;
      contentAr?: string;
      images?: string[];
      isAnonymous?: boolean;
    };

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { neighborhoodId: true },
    });

    if (!user?.neighborhoodId) {
      res.status(400).json({ success: false, message: 'You must be assigned to a neighborhood to create posts' });
      return;
    }

    const post = await prisma.post.create({
      data: {
        authorId: userId,
        neighborhoodId: user.neighborhoodId,
        category: (category as 'GENERAL') || 'GENERAL',
        titleEn,
        titleAr,
        contentEn,
        contentAr,
        images: images || [],
        isAnonymous: isAnonymous || false,
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, displayName: true, avatarUrl: true } },
        neighborhood: { select: { id: true, nameEn: true, nameAr: true } },
      },
    });

    // Broadcast to neighborhood via socket
    broadcastToNeighborhood(user.neighborhoodId, 'new_post', {
      ...post,
      author: post.isAnonymous ? null : post.author,
    });

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: { ...post, author: post.isAnonymous ? null : post.author },
    });
  } catch (error) {
    console.error('[Posts] createPost error:', error);
    res.status(500).json({ success: false, message: 'Failed to create post' });
  }
}

// PATCH /posts/:id
export async function updatePost(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { titleEn, titleAr, contentEn, contentAr, images, category } = req.body as {
      titleEn?: string;
      titleAr?: string;
      contentEn?: string;
      contentAr?: string;
      images?: string[];
      category?: string;
    };

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post || !post.isActive) {
      res.status(404).json({ success: false, message: 'Post not found' });
      return;
    }

    const userRole = req.user!.role;
    if (post.authorId !== userId && !['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      res.status(403).json({ success: false, message: 'Not authorized to update this post' });
      return;
    }

    const updated = await prisma.post.update({
      where: { id },
      data: {
        ...(titleEn !== undefined && { titleEn }),
        ...(titleAr !== undefined && { titleAr }),
        ...(contentEn !== undefined && { contentEn }),
        ...(contentAr !== undefined && { contentAr }),
        ...(images !== undefined && { images }),
        ...(category && { category: category as 'GENERAL' }),
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, displayName: true, avatarUrl: true } },
        neighborhood: { select: { id: true, nameEn: true, nameAr: true } },
      },
    });

    res.json({ success: true, message: 'Post updated', data: updated });
  } catch (error) {
    console.error('[Posts] updatePost error:', error);
    res.status(500).json({ success: false, message: 'Failed to update post' });
  }
}

// DELETE /posts/:id
export async function deletePost(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      res.status(404).json({ success: false, message: 'Post not found' });
      return;
    }

    const userRole = req.user!.role;
    if (post.authorId !== userId && !['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      res.status(403).json({ success: false, message: 'Not authorized to delete this post' });
      return;
    }

    await prisma.post.update({ where: { id }, data: { isActive: false } });

    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    console.error('[Posts] deletePost error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete post' });
  }
}

// POST /posts/:id/pin
export async function pinPost(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      res.status(404).json({ success: false, message: 'Post not found' });
      return;
    }

    await prisma.post.update({ where: { id }, data: { isPinned: !post.isPinned } });

    res.json({ success: true, message: post.isPinned ? 'Post unpinned' : 'Post pinned' });
  } catch (error) {
    console.error('[Posts] pinPost error:', error);
    res.status(500).json({ success: false, message: 'Failed to pin/unpin post' });
  }
}

// POST /posts/:id/react
export async function reactToPost(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id: postId } = req.params;
    const { type } = req.body as { type: string };

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post || !post.isActive) {
      res.status(404).json({ success: false, message: 'Post not found' });
      return;
    }

    const existingReaction = await prisma.reaction.findFirst({
      where: { userId, postId },
    });

    if (existingReaction) {
      if (existingReaction.type === type) {
        // Remove reaction
        await prisma.reaction.delete({ where: { id: existingReaction.id } });
        res.json({ success: true, message: 'Reaction removed' });
      } else {
        // Update reaction type
        const updated = await prisma.reaction.update({
          where: { id: existingReaction.id },
          data: { type: type as 'LIKE' },
        });
        res.json({ success: true, message: 'Reaction updated', data: updated });
      }
    } else {
      const reaction = await prisma.reaction.create({
        data: { userId, postId, type: type as 'LIKE' },
      });

      // Create notification for post author (not for self-reactions)
      if (post.authorId !== userId) {
        await prisma.notification.create({
          data: {
            userId: post.authorId,
            type: 'NEW_REACTION',
            titleEn: 'New Reaction',
            titleAr: 'تفاعل جديد',
            bodyEn: `reacted to your post`,
            bodyAr: `تفاعل مع منشورك`,
            data: { postId, userId, reactionType: type },
          },
        });
      }

      res.status(201).json({ success: true, message: 'Reaction added', data: reaction });
    }
  } catch (error) {
    console.error('[Posts] reactToPost error:', error);
    res.status(500).json({ success: false, message: 'Failed to react to post' });
  }
}

// POST /posts/:id/report
export async function reportPost(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id: postId } = req.params;
    const { reason, descriptionEn, descriptionAr } = req.body as {
      reason: string;
      descriptionEn?: string;
      descriptionAr?: string;
    };

    const report = await prisma.report.create({
      data: {
        reportedById: userId,
        postId,
        reason: reason as 'SPAM',
        descriptionEn,
        descriptionAr,
      },
    });

    res.status(201).json({ success: true, message: 'Report submitted', data: report });
  } catch (error) {
    console.error('[Posts] reportPost error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit report' });
  }
}

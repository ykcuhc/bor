import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthenticatedRequest } from '../middleware/auth';

// GET /comments?postId=|alertId=|eventId=
export async function listComments(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { postId, alertId, eventId, page = '1', limit = '20' } = req.query as Record<string, string>;

    if (!postId && !alertId && !eventId) {
      res.status(400).json({ success: false, message: 'postId, alertId, or eventId is required' });
      return;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = Math.min(parseInt(limit, 10), 50);
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = {
      isActive: true,
      parentId: null, // Only top-level comments; replies fetched separately
      ...(postId && { postId }),
      ...(alertId && { alertId }),
      ...(eventId && { eventId }),
    };

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        include: {
          author: { select: { id: true, firstName: true, lastName: true, displayName: true, avatarUrl: true } },
          replies: {
            where: { isActive: true },
            include: {
              author: { select: { id: true, firstName: true, lastName: true, displayName: true, avatarUrl: true } },
              _count: { select: { reactions: true } },
            },
            orderBy: { createdAt: 'asc' },
          },
          _count: { select: { reactions: true, replies: true } },
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limitNum,
      }),
      prisma.comment.count({ where }),
    ]);

    res.json({
      success: true,
      data: comments,
      meta: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    console.error('[Comments] listComments error:', error);
    res.status(500).json({ success: false, message: 'Failed to list comments' });
  }
}

// POST /comments
export async function createComment(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { postId, alertId, eventId, parentId, contentEn, contentAr, images } = req.body as {
      postId?: string;
      alertId?: string;
      eventId?: string;
      parentId?: string;
      contentEn?: string;
      contentAr?: string;
      images?: string[];
    };

    if (!postId && !alertId && !eventId) {
      res.status(400).json({ success: false, message: 'postId, alertId, or eventId is required' });
      return;
    }

    if (!contentEn && !contentAr) {
      res.status(400).json({ success: false, message: 'Comment content is required' });
      return;
    }

    // Validate parent comment if replying
    if (parentId) {
      const parent = await prisma.comment.findUnique({ where: { id: parentId } });
      if (!parent || !parent.isActive) {
        res.status(404).json({ success: false, message: 'Parent comment not found' });
        return;
      }
    }

    const comment = await prisma.comment.create({
      data: {
        authorId: userId,
        postId,
        alertId,
        eventId,
        parentId,
        contentEn,
        contentAr,
        images: images || [],
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, displayName: true, avatarUrl: true } },
        _count: { select: { reactions: true, replies: true } },
      },
    });

    // Create notification for content owner
    let contentOwnerId: string | null = null;
    if (postId) {
      const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } });
      contentOwnerId = post?.authorId || null;
    } else if (alertId) {
      const alert = await prisma.alert.findUnique({ where: { id: alertId }, select: { authorId: true } });
      contentOwnerId = alert?.authorId || null;
    } else if (eventId) {
      const event = await prisma.event.findUnique({ where: { id: eventId }, select: { organizerId: true } });
      contentOwnerId = event?.organizerId || null;
    }

    if (contentOwnerId && contentOwnerId !== userId) {
      await prisma.notification.create({
        data: {
          userId: contentOwnerId,
          type: 'NEW_COMMENT',
          titleEn: 'New Comment',
          titleAr: 'تعليق جديد',
          bodyEn: 'commented on your content',
          bodyAr: 'علق على محتواك',
          data: { commentId: comment.id, userId, postId, alertId, eventId },
        },
      });
    }

    // If this is a reply, notify parent comment author too
    if (parentId) {
      const parent = await prisma.comment.findUnique({ where: { id: parentId }, select: { authorId: true } });
      if (parent && parent.authorId !== userId && parent.authorId !== contentOwnerId) {
        await prisma.notification.create({
          data: {
            userId: parent.authorId,
            type: 'NEW_COMMENT',
            titleEn: 'Reply to Your Comment',
            titleAr: 'رد على تعليقك',
            bodyEn: 'replied to your comment',
            bodyAr: 'رد على تعليقك',
            data: { commentId: comment.id, userId },
          },
        });
      }
    }

    res.status(201).json({ success: true, message: 'Comment created', data: comment });
  } catch (error) {
    console.error('[Comments] createComment error:', error);
    res.status(500).json({ success: false, message: 'Failed to create comment' });
  }
}

// PATCH /comments/:id
export async function updateComment(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { contentEn, contentAr } = req.body as { contentEn?: string; contentAr?: string };

    const comment = await prisma.comment.findUnique({ where: { id } });
    if (!comment || !comment.isActive) {
      res.status(404).json({ success: false, message: 'Comment not found' });
      return;
    }

    const userRole = req.user!.role;
    if (comment.authorId !== userId && !['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      res.status(403).json({ success: false, message: 'Not authorized to update this comment' });
      return;
    }

    const updated = await prisma.comment.update({
      where: { id },
      data: {
        ...(contentEn !== undefined && { contentEn }),
        ...(contentAr !== undefined && { contentAr }),
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, displayName: true, avatarUrl: true } },
      },
    });

    res.json({ success: true, message: 'Comment updated', data: updated });
  } catch (error) {
    console.error('[Comments] updateComment error:', error);
    res.status(500).json({ success: false, message: 'Failed to update comment' });
  }
}

// DELETE /comments/:id
export async function deleteComment(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const comment = await prisma.comment.findUnique({ where: { id } });
    if (!comment) {
      res.status(404).json({ success: false, message: 'Comment not found' });
      return;
    }

    const userRole = req.user!.role;
    if (comment.authorId !== userId && !['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      res.status(403).json({ success: false, message: 'Not authorized to delete this comment' });
      return;
    }

    await prisma.comment.update({ where: { id }, data: { isActive: false } });

    res.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    console.error('[Comments] deleteComment error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete comment' });
  }
}

// POST /comments/:id/react
export async function reactToComment(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id: commentId } = req.params;
    const { type } = req.body as { type: string };

    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment || !comment.isActive) {
      res.status(404).json({ success: false, message: 'Comment not found' });
      return;
    }

    const existing = await prisma.reaction.findFirst({ where: { userId, commentId } });

    if (existing) {
      if (existing.type === type) {
        await prisma.reaction.delete({ where: { id: existing.id } });
        res.json({ success: true, message: 'Reaction removed' });
      } else {
        const updated = await prisma.reaction.update({
          where: { id: existing.id },
          data: { type: type as 'LIKE' },
        });
        res.json({ success: true, message: 'Reaction updated', data: updated });
      }
    } else {
      const reaction = await prisma.reaction.create({
        data: { userId, commentId, type: type as 'LIKE' },
      });
      res.status(201).json({ success: true, message: 'Reaction added', data: reaction });
    }
  } catch (error) {
    console.error('[Comments] reactToComment error:', error);
    res.status(500).json({ success: false, message: 'Failed to react to comment' });
  }
}

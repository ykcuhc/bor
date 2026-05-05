import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { broadcastToNeighborhood } from '../socket';

// GET /events
export async function listEvents(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { page = '1', limit = '20', category, upcoming = 'true', neighborhoodId: qNeighborhoodId } = req.query as Record<string, string>;

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
      isPublic: true,
    };
    if (category) where.category = category;
    if (upcoming === 'true') where.startAt = { gte: new Date() };

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          organizer: { select: { id: true, firstName: true, lastName: true, displayName: true, avatarUrl: true } },
          neighborhood: { select: { id: true, nameEn: true, nameAr: true } },
          _count: { select: { attendees: true, comments: true } },
        },
        orderBy: { startAt: 'asc' },
        skip,
        take: limitNum,
      }),
      prisma.event.count({ where }),
    ]);

    res.json({
      success: true,
      data: events,
      meta: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    console.error('[Events] listEvents error:', error);
    res.status(500).json({ success: false, message: 'Failed to list events' });
  }
}

// GET /events/:id
export async function getEventById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        organizer: { select: { id: true, firstName: true, lastName: true, displayName: true, avatarUrl: true } },
        neighborhood: { include: { governorate: true } },
        attendees: {
          where: { status: 'GOING' },
          include: {
            user: { select: { id: true, firstName: true, lastName: true, displayName: true, avatarUrl: true } },
          },
          take: 10,
        },
        _count: { select: { attendees: true, comments: true } },
      },
    });

    if (!event || !event.isActive) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }

    let userRsvp = null;
    if (userId) {
      userRsvp = await prisma.eventAttendee.findUnique({
        where: { eventId_userId: { eventId: id, userId } },
      });
    }

    res.json({ success: true, data: { ...event, userRsvp } });
  } catch (error) {
    console.error('[Events] getEventById error:', error);
    res.status(500).json({ success: false, message: 'Failed to get event' });
  }
}

// POST /events
export async function createEvent(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const {
      category,
      titleEn,
      titleAr,
      descriptionEn,
      descriptionAr,
      images,
      location,
      latitude,
      longitude,
      startAt,
      endAt,
      maxAttendees,
      isPublic,
    } = req.body as {
      category?: string;
      titleEn?: string;
      titleAr?: string;
      descriptionEn?: string;
      descriptionAr?: string;
      images?: string[];
      location?: string;
      latitude?: number;
      longitude?: number;
      startAt: string;
      endAt?: string;
      maxAttendees?: number;
      isPublic?: boolean;
    };

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { neighborhoodId: true },
    });

    if (!user?.neighborhoodId) {
      res.status(400).json({ success: false, message: 'You must be assigned to a neighborhood to create events' });
      return;
    }

    const event = await prisma.event.create({
      data: {
        organizerId: userId,
        neighborhoodId: user.neighborhoodId,
        category: (category as 'SOCIAL') || 'SOCIAL',
        titleEn,
        titleAr,
        descriptionEn,
        descriptionAr,
        images: images || [],
        location,
        latitude,
        longitude,
        startAt: new Date(startAt),
        endAt: endAt ? new Date(endAt) : undefined,
        maxAttendees,
        isPublic: isPublic !== false,
      },
      include: {
        organizer: { select: { id: true, firstName: true, lastName: true, displayName: true, avatarUrl: true } },
        neighborhood: { select: { id: true, nameEn: true, nameAr: true } },
      },
    });

    // Organizer auto-attends
    await prisma.eventAttendee.create({
      data: { eventId: event.id, userId, status: 'GOING' },
    });

    broadcastToNeighborhood(user.neighborhoodId, 'new_event', event);

    res.status(201).json({ success: true, message: 'Event created', data: event });
  } catch (error) {
    console.error('[Events] createEvent error:', error);
    res.status(500).json({ success: false, message: 'Failed to create event' });
  }
}

// PATCH /events/:id
export async function updateEvent(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const updates = req.body as Record<string, unknown>;

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event || !event.isActive) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }

    const userRole = req.user!.role;
    if (event.organizerId !== userId && !['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      res.status(403).json({ success: false, message: 'Not authorized to update this event' });
      return;
    }

    const updated = await prisma.event.update({
      where: { id },
      data: {
        ...(updates.titleEn !== undefined && { titleEn: updates.titleEn as string }),
        ...(updates.titleAr !== undefined && { titleAr: updates.titleAr as string }),
        ...(updates.descriptionEn !== undefined && { descriptionEn: updates.descriptionEn as string }),
        ...(updates.descriptionAr !== undefined && { descriptionAr: updates.descriptionAr as string }),
        ...(updates.location !== undefined && { location: updates.location as string }),
        ...(updates.startAt && { startAt: new Date(updates.startAt as string) }),
        ...(updates.endAt && { endAt: new Date(updates.endAt as string) }),
        ...(updates.maxAttendees !== undefined && { maxAttendees: updates.maxAttendees as number }),
        ...(updates.isPublic !== undefined && { isPublic: updates.isPublic as boolean }),
        ...(updates.images !== undefined && { images: updates.images as string[] }),
      },
    });

    res.json({ success: true, message: 'Event updated', data: updated });
  } catch (error) {
    console.error('[Events] updateEvent error:', error);
    res.status(500).json({ success: false, message: 'Failed to update event' });
  }
}

// DELETE /events/:id
export async function deleteEvent(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }

    const userRole = req.user!.role;
    if (event.organizerId !== userId && !['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      res.status(403).json({ success: false, message: 'Not authorized to delete this event' });
      return;
    }

    await prisma.event.update({ where: { id }, data: { isActive: false } });

    res.json({ success: true, message: 'Event deleted' });
  } catch (error) {
    console.error('[Events] deleteEvent error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete event' });
  }
}

// POST /events/:id/rsvp
export async function rsvpEvent(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id: eventId } = req.params;
    const { status } = req.body as { status: string };

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event || !event.isActive) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }

    // Check capacity
    if (event.maxAttendees && status === 'GOING') {
      const goingCount = await prisma.eventAttendee.count({
        where: { eventId, status: 'GOING' },
      });
      if (goingCount >= event.maxAttendees) {
        res.status(400).json({ success: false, message: 'Event is at full capacity' });
        return;
      }
    }

    const attendee = await prisma.eventAttendee.upsert({
      where: { eventId_userId: { eventId, userId } },
      create: { eventId, userId, status: status as 'GOING' },
      update: { status: status as 'GOING' },
    });

    // Notify organizer if someone is going
    if (status === 'GOING' && event.organizerId !== userId) {
      await prisma.notification.create({
        data: {
          userId: event.organizerId,
          type: 'NEW_EVENT',
          titleEn: 'New Event Attendee',
          titleAr: 'حضور جديد في الفعالية',
          bodyEn: 'is attending your event',
          bodyAr: 'سيحضر فعاليتك',
          data: { eventId, userId },
        },
      });
    }

    res.json({ success: true, message: 'RSVP updated', data: attendee });
  } catch (error) {
    console.error('[Events] rsvpEvent error:', error);
    res.status(500).json({ success: false, message: 'Failed to RSVP' });
  }
}

// GET /events/:id/attendees
export async function getEventAttendees(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id: eventId } = req.params;
    const { status, page = '1', limit = '20' } = req.query as Record<string, string>;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = { eventId };
    if (status) where.status = status;

    const [attendees, total] = await Promise.all([
      prisma.eventAttendee.findMany({
        where,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, displayName: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limitNum,
      }),
      prisma.eventAttendee.count({ where }),
    ]);

    res.json({
      success: true,
      data: attendees,
      meta: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    console.error('[Events] getEventAttendees error:', error);
    res.status(500).json({ success: false, message: 'Failed to get attendees' });
  }
}

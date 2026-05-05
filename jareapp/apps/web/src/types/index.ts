// ─── Enums ────────────────────────────────────────────────────────────────────

export type UserRole = 'RESIDENT' | 'MODERATOR' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'PENDING';

export type PostCategory =
  | 'general'
  | 'lost_found'
  | 'for_sale'
  | 'services'
  | 'recommendation'
  | 'question'
  | 'complaint'
  | 'announcement'
  | 'emergency';

export type AlertType =
  | 'security'
  | 'fire'
  | 'flood'
  | 'medical'
  | 'infrastructure'
  | 'traffic'
  | 'weather'
  | 'public_health'
  | 'other';

export type AlertSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export type EventCategory =
  | 'community'
  | 'sports'
  | 'cultural'
  | 'educational'
  | 'charity'
  | 'social'
  | 'religious'
  | 'other';

export type RsvpStatus = 'going' | 'maybe' | 'not_going';

export type BusinessCategory =
  | 'restaurant'
  | 'cafe'
  | 'grocery'
  | 'pharmacy'
  | 'salon'
  | 'gym'
  | 'clinic'
  | 'school'
  | 'services'
  | 'retail'
  | 'other';

export type ReactionType = 'like' | 'helpful' | 'celebrate' | 'concerned' | 'thanks';

export type NotificationType =
  | 'new_post'
  | 'comment'
  | 'reply'
  | 'reaction'
  | 'mention'
  | 'new_alert'
  | 'event_reminder'
  | 'new_follower'
  | 'message'
  | 'business_review'
  | 'post_approved'
  | 'post_rejected';

export type ReportReason =
  | 'spam'
  | 'harassment'
  | 'hate_speech'
  | 'misinformation'
  | 'inappropriate'
  | 'other';

export type ReportStatus = 'pending' | 'reviewed' | 'resolved';

// ─── Location ─────────────────────────────────────────────────────────────────

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Governorate {
  id: string;
  nameAr: string;
  nameEn: string;
  neighborhoods: Neighborhood[];
}

export interface Neighborhood {
  id: string;
  nameAr: string;
  nameEn: string;
  governorateId: string;
  governorate?: Governorate;
  center?: GeoPoint;
  boundaries?: GeoPoint[];
  memberCount?: number;
  activeTodayCount?: number;
  champion?: User;
  stats?: NeighborhoodStats;
}

export interface NeighborhoodStats {
  totalPosts: number;
  totalAlerts: number;
  totalEvents: number;
  totalBusinesses: number;
  activeUsersToday: number;
}

export interface Address {
  block: string;
  street: string;
  house: string;
  neighborhoodId?: string;
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  phone: string;
  nameAr: string;
  nameEn?: string;
  avatarUrl?: string;
  bio?: string;
  role: UserRole;
  status: UserStatus;
  neighborhoodId: string;
  neighborhood?: Neighborhood;
  isVerifiedResident: boolean;
  isChampion: boolean;
  reputationScore: number;
  postCount: number;
  followerCount: number;
  followingCount: number;
  isFollowedByMe?: boolean;
  isBlockedByMe?: boolean;
  showPhone: boolean;
  showAddress: boolean;
  allowMessages: boolean;
  createdAt: string;
  lastActiveAt?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
}

// ─── Post ─────────────────────────────────────────────────────────────────────

export interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  thumbnailUrl?: string;
  width?: number;
  height?: number;
}

export interface Post {
  id: string;
  content: string;
  category: PostCategory;
  authorId: string;
  author: User;
  neighborhoodId: string;
  neighborhood?: Neighborhood;
  media: MediaItem[];
  price?: number;
  isSold?: boolean;
  location?: GeoPoint;
  locationName?: string;
  isPinned: boolean;
  isApproved: boolean;
  commentCount: number;
  reactionCounts: Record<ReactionType, number>;
  myReaction?: ReactionType;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  content: string;
  authorId: string;
  author: User;
  parentId?: string;
  replies?: Comment[];
  replyCount: number;
  reactionCounts: Record<ReactionType, number>;
  myReaction?: ReactionType;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Reaction {
  id: string;
  type: ReactionType;
  userId: string;
  user?: User;
  postId?: string;
  commentId?: string;
  createdAt: string;
}

// ─── Alert ────────────────────────────────────────────────────────────────────

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;
  authorId: string;
  author?: User;
  neighborhoodId: string;
  neighborhood?: Neighborhood;
  location?: GeoPoint;
  radius?: number;
  isActive: boolean;
  acknowledgedCount: number;
  isAcknowledgedByMe?: boolean;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Event ────────────────────────────────────────────────────────────────────

export interface Event {
  id: string;
  name: string;
  nameAr?: string;
  description: string;
  descriptionAr?: string;
  category: EventCategory;
  organizerId: string;
  organizer?: User;
  neighborhoodId: string;
  neighborhood?: Neighborhood;
  coverImageUrl?: string;
  location: string;
  locationCoords?: GeoPoint;
  startDate: string;
  endDate?: string;
  maxAttendees?: number;
  isFree: boolean;
  ticketPrice?: number;
  isCancelled: boolean;
  goingCount: number;
  maybeCount: number;
  myRsvp?: RsvpStatus;
  createdAt: string;
  updatedAt: string;
}

// ─── Business ─────────────────────────────────────────────────────────────────

export interface WorkingHours {
  day: number; // 0=Sunday, 6=Saturday
  open: string; // "09:00"
  close: string; // "22:00"
  isClosed: boolean;
}

export interface Business {
  id: string;
  nameAr: string;
  nameEn?: string;
  description?: string;
  descriptionAr?: string;
  category: BusinessCategory;
  ownerId?: string;
  owner?: User;
  neighborhoodId: string;
  neighborhood?: Neighborhood;
  logoUrl?: string;
  coverImageUrl?: string;
  phone?: string;
  whatsapp?: string;
  instagram?: string;
  website?: string;
  address: string;
  location?: GeoPoint;
  workingHours?: WorkingHours[];
  isVerified: boolean;
  isClaimed: boolean;
  isOpen?: boolean;
  averageRating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessReview {
  id: string;
  businessId: string;
  userId: string;
  user?: User;
  rating: number;
  content?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Message ──────────────────────────────────────────────────────────────────

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender?: User;
  content: string;
  media?: MediaItem;
  isRead: boolean;
  isDeleted: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  isBlocked: boolean;
  blockedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Notification ─────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  actorId?: string;
  actor?: User;
  postId?: string;
  commentId?: string;
  alertId?: string;
  eventId?: string;
  businessId?: string;
  isRead: boolean;
  createdAt: string;
}

// ─── Report ───────────────────────────────────────────────────────────────────

export interface Report {
  id: string;
  reporterId: string;
  reporter?: User;
  reason: ReportReason;
  description?: string;
  status: ReportStatus;
  postId?: string;
  post?: Post;
  commentId?: string;
  userId?: string;
  reportedUser?: User;
  resolvedById?: string;
  resolvedAt?: string;
  createdAt: string;
}

// ─── API Types ────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  field?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

// ─── Admin Stats ──────────────────────────────────────────────────────────────

export interface AdminStats {
  totalUsers: number;
  activeUsersToday: number;
  totalPosts: number;
  pendingReports: number;
  totalAlerts: number;
  totalBusinesses: number;
  newUsersThisWeek: number;
  postsThisWeek: number;
}

// ─── Notification Preferences ─────────────────────────────────────────────────

export interface NotificationPreferences {
  newPosts: boolean;
  alerts: boolean;
  events: boolean;
  messages: boolean;
  comments: boolean;
  reactions: boolean;
  pushEnabled: boolean;
}

// ─── Privacy Settings ─────────────────────────────────────────────────────────

export interface PrivacySettings {
  showPhone: boolean;
  showAddress: boolean;
  allowMessages: boolean;
}

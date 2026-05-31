// ─── Core domain types for MyCloset ───────────────────────────────────────────

export type Condition = 'NWT' | 'NWOT' | 'Excellent' | 'Good' | 'Fair';

export type Category =
  | 'Women'
  | 'Men'
  | 'Kids'
  | 'Home'
  | 'Electronics'
  | 'Beauty'
  | 'Pets'
  | 'Garden';

export type SubCategory = {
  id: string;
  name: string;
  category: Category;
};

export type Size =
  | 'XXS' | 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL'
  | '0' | '2' | '4' | '6' | '8' | '10' | '12' | '14' | '16'
  | 'One Size' | 'Custom';

export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatar: string;
  headerImage: string;
  bio: string;
  location: string;         // e.g. "Kuwait City, Kuwait"
  followersCount: number;
  followingCount: number;
  listingsCount: number;
  soldCount: number;
  averageRating: number;
  totalRatings: number;
  joinedAt: string;         // ISO date
  isVerified: boolean;
}

export interface Listing {
  id: string;
  sellerId: string;
  seller: Pick<User, 'id' | 'username' | 'displayName' | 'avatar' | 'isVerified'>;
  title: string;
  description: string;
  images: string[];         // ordered array; images[0] is cover
  category: Category;
  subCategory: string;
  brand: string;
  size: string;
  condition: Condition;
  color: string[];
  originalPrice: number;    // KWD
  listingPrice: number;     // KWD
  quantity: number;
  tags: string[];
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  viewsCount: number;
  status: 'available' | 'sold' | 'reserved';
  createdAt: string;
  updatedAt: string;
  // Virtual field populated by auth context
  isLikedByCurrentUser?: boolean;
}

export interface Comment {
  id: string;
  listingId: string;
  authorId: string;
  author: Pick<User, 'id' | 'username' | 'displayName' | 'avatar'>;
  body: string;
  createdAt: string;
  // Supports @mentions which are resolved into user links
  mentions: string[];
}

export interface Offer {
  id: string;
  listingId: string;
  buyerId: string;
  buyer: Pick<User, 'id' | 'username' | 'displayName' | 'avatar'>;
  amount: number;           // KWD
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'countered';
  message?: string;
  counterAmount?: number;
  expiresAt: string;        // Offers expire after 24 h
  createdAt: string;
}

export interface Order {
  id: string;
  listingId: string;
  listing: Listing;
  buyerId: string;
  sellerId: string;
  amount: number;
  shippingFee: number;
  platformFee: number;      // 20 % of sale price (Poshmark model)
  sellerEarnings: number;
  status: 'pending' | 'shipped' | 'delivered' | 'completed' | 'disputed';
  trackingNumber?: string;
  shippingProvider?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type:
    | 'new_like'
    | 'new_comment'
    | 'new_offer'
    | 'offer_accepted'
    | 'offer_declined'
    | 'new_follower'
    | 'item_sold'
    | 'new_share';
  actorId: string;
  actor: Pick<User, 'id' | 'username' | 'displayName' | 'avatar'>;
  listingId?: string;
  listing?: Pick<Listing, 'id' | 'title' | 'images'>;
  read: boolean;
  createdAt: string;
}

export interface SearchFilters {
  query: string;
  category?: Category;
  subCategory?: string;
  brand?: string;
  size?: string;
  condition?: Condition;
  minPrice?: number;
  maxPrice?: number;
  status?: 'available' | 'sold';
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'most_liked';
}

// ─── Auth context shape ────────────────────────────────────────────────────────

export interface AuthUser extends User {
  likedListings: string[];   // listing IDs
  followingIds: string[];    // user IDs
}

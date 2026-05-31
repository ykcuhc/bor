'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthUser, Listing, Comment, Offer, SearchFilters } from '@/types';
import {
  MOCK_LISTINGS,
  MOCK_USERS,
  MOCK_COMMENTS,
  MOCK_NOTIFICATIONS,
  calcEarnings,
  SHIPPING_FEE_KWD,
} from '@/lib/mockData';

// ─── Auth slice ────────────────────────────────────────────────────────────────

interface AuthSlice {
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<AuthUser>) => void;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  displayName: string;
}

// ─── Listings slice ────────────────────────────────────────────────────────────

interface ListingsSlice {
  listings: Listing[];
  filters: SearchFilters;
  setFilters: (filters: Partial<SearchFilters>) => void;
  resetFilters: () => void;
  getListing: (id: string) => Listing | undefined;
  getListingsByUser: (userId: string) => Listing[];
  addListing: (listing: Omit<Listing, 'id' | 'createdAt' | 'updatedAt' | 'likesCount' | 'commentsCount' | 'sharesCount' | 'viewsCount' | 'status' | 'isLikedByCurrentUser'>) => string;
  toggleLike: (listingId: string) => void;
  filteredListings: () => Listing[];
  incrementViews: (listingId: string) => void;
}

// ─── Social slice ─────────────────────────────────────────────────────────────

interface SocialSlice {
  comments: Comment[];
  getCommentsByListing: (listingId: string) => Comment[];
  addComment: (listingId: string, body: string) => void;
  followUser: (targetUserId: string) => void;
  unfollowUser: (targetUserId: string) => void;
  isFollowing: (targetUserId: string) => boolean;
}

// ─── Offer slice ──────────────────────────────────────────────────────────────

interface OfferSlice {
  offers: Offer[];
  makeOffer: (listingId: string, amount: number, message?: string) => void;
  respondToOffer: (offerId: string, response: 'accepted' | 'declined') => void;
}

// ─── UI slice ─────────────────────────────────────────────────────────────────

interface UISlice {
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  isOfferModalOpen: boolean;
  openOfferModal: (listingId: string) => void;
  closeOfferModal: () => void;
  activeOfferListingId: string | null;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  clearToast: () => void;
  notificationCount: number;
}

// ─── Compose full store ───────────────────────────────────────────────────────

type Store = AuthSlice & ListingsSlice & SocialSlice & OfferSlice & UISlice;

const defaultFilters: SearchFilters = {
  query: '',
  sortBy: 'newest',
};

// Mock password store (in production this lives in Supabase Auth)
const MOCK_PASSWORDS: Record<string, string> = {
  'layla@example.com': 'password123',
  'noura@example.com': 'password123',
  'khalid@example.com': 'password123',
  'maryam@example.com': 'password123',
};

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      // ── Auth ──────────────────────────────────────────────────────────────
      currentUser: null,
      isAuthenticated: false,

      login: async (email, password) => {
        // Simulate async auth check (replace with Supabase signInWithPassword)
        await new Promise(r => setTimeout(r, 500));
        if (MOCK_PASSWORDS[email] === password) {
          const found = MOCK_USERS.find(u => u.email === email);
          if (found) {
            set({
              currentUser: { ...found, likedListings: ['l2', 'l5'], followingIds: ['u2', 'u4'] },
              isAuthenticated: true,
            });
            return true;
          }
        }
        return false;
      },

      register: async (data) => {
        await new Promise(r => setTimeout(r, 600));
        const exists = MOCK_USERS.some(u => u.email === data.email || u.username === data.username);
        if (exists) return false;
        const newUser: AuthUser = {
          id: `u_${Date.now()}`,
          username: data.username,
          email: data.email,
          displayName: data.displayName,
          avatar: `https://i.pravatar.cc/150?u=${data.email}`,
          headerImage: '',
          bio: '',
          location: 'Kuwait',
          followersCount: 0,
          followingCount: 0,
          listingsCount: 0,
          soldCount: 0,
          averageRating: 0,
          totalRatings: 0,
          joinedAt: new Date().toISOString(),
          isVerified: false,
          likedListings: [],
          followingIds: [],
        };
        set({ currentUser: newUser, isAuthenticated: true });
        return true;
      },

      logout: () => set({ currentUser: null, isAuthenticated: false }),

      updateProfile: (data) => {
        const { currentUser } = get();
        if (!currentUser) return;
        set({ currentUser: { ...currentUser, ...data } });
      },

      // ── Listings ──────────────────────────────────────────────────────────
      listings: MOCK_LISTINGS,
      filters: defaultFilters,

      setFilters: (f) => set(s => ({ filters: { ...s.filters, ...f } })),
      resetFilters: () => set({ filters: defaultFilters }),

      getListing: (id) => get().listings.find(l => l.id === id),

      getListingsByUser: (userId) =>
        get().listings.filter(l => l.sellerId === userId),

      addListing: (data) => {
        const { currentUser } = get();
        if (!currentUser) return '';
        const id = `l_${Date.now()}`;
        const now = new Date().toISOString();
        const newListing: Listing = {
          ...data,
          id,
          createdAt: now,
          updatedAt: now,
          likesCount: 0,
          commentsCount: 0,
          sharesCount: 0,
          viewsCount: 0,
          status: 'available',
          isLikedByCurrentUser: false,
        };
        set(s => ({
          listings: [newListing, ...s.listings],
          currentUser: s.currentUser
            ? { ...s.currentUser, listingsCount: s.currentUser.listingsCount + 1 }
            : null,
        }));
        return id;
      },

      toggleLike: (listingId) => {
        const { currentUser } = get();
        if (!currentUser) return;
        const alreadyLiked = currentUser.likedListings.includes(listingId);
        set(s => ({
          currentUser: s.currentUser ? {
            ...s.currentUser,
            likedListings: alreadyLiked
              ? s.currentUser!.likedListings.filter(id => id !== listingId)
              : [...s.currentUser!.likedListings, listingId],
          } : null,
          listings: s.listings.map(l =>
            l.id === listingId
              ? {
                  ...l,
                  likesCount: alreadyLiked ? l.likesCount - 1 : l.likesCount + 1,
                  isLikedByCurrentUser: !alreadyLiked,
                }
              : l
          ),
        }));
      },

      // Core feed algorithm:
      // 1. Apply text search across title/brand/tags
      // 2. Apply category, condition, size, price filters
      // 3. Sort by selected strategy
      filteredListings: () => {
        const { listings, filters, currentUser } = get();
        let result = listings.map(l => ({
          ...l,
          isLikedByCurrentUser: currentUser?.likedListings.includes(l.id) ?? false,
        }));

        if (filters.query) {
          const q = filters.query.toLowerCase();
          result = result.filter(l =>
            l.title.toLowerCase().includes(q) ||
            l.brand.toLowerCase().includes(q) ||
            l.tags.some(t => t.includes(q)) ||
            l.description.toLowerCase().includes(q)
          );
        }
        if (filters.category) result = result.filter(l => l.category === filters.category);
        if (filters.subCategory) result = result.filter(l => l.subCategory === filters.subCategory);
        if (filters.brand) result = result.filter(l => l.brand.toLowerCase() === filters.brand!.toLowerCase());
        if (filters.size) result = result.filter(l => l.size === filters.size);
        if (filters.condition) result = result.filter(l => l.condition === filters.condition);
        if (filters.minPrice !== undefined) result = result.filter(l => l.listingPrice >= filters.minPrice!);
        if (filters.maxPrice !== undefined) result = result.filter(l => l.listingPrice <= filters.maxPrice!);
        if (filters.status) result = result.filter(l => l.status === filters.status);

        switch (filters.sortBy) {
          case 'price_asc':  result.sort((a, b) => a.listingPrice - b.listingPrice); break;
          case 'price_desc': result.sort((a, b) => b.listingPrice - a.listingPrice); break;
          case 'most_liked': result.sort((a, b) => b.likesCount - a.likesCount); break;
          case 'newest':
          default:
            result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        return result;
      },

      incrementViews: (listingId) =>
        set(s => ({
          listings: s.listings.map(l =>
            l.id === listingId ? { ...l, viewsCount: l.viewsCount + 1 } : l
          ),
        })),

      // ── Social ────────────────────────────────────────────────────────────
      comments: MOCK_COMMENTS,

      getCommentsByListing: (listingId) =>
        get().comments.filter(c => c.listingId === listingId),

      addComment: (listingId, body) => {
        const { currentUser } = get();
        if (!currentUser) return;
        const mentions = (body.match(/@(\w+)/g) ?? []).map(m => m.slice(1));
        const newComment: Comment = {
          id: `c_${Date.now()}`,
          listingId,
          authorId: currentUser.id,
          author: {
            id: currentUser.id,
            username: currentUser.username,
            displayName: currentUser.displayName,
            avatar: currentUser.avatar,
          },
          body,
          createdAt: new Date().toISOString(),
          mentions,
        };
        set(s => ({
          comments: [...s.comments, newComment],
          listings: s.listings.map(l =>
            l.id === listingId ? { ...l, commentsCount: l.commentsCount + 1 } : l
          ),
        }));
      },

      followUser: (targetUserId) => {
        const { currentUser } = get();
        if (!currentUser || currentUser.id === targetUserId) return;
        set(s => ({
          currentUser: s.currentUser ? {
            ...s.currentUser,
            followingIds: [...s.currentUser.followingIds, targetUserId],
            followingCount: s.currentUser.followingCount + 1,
          } : null,
        }));
      },

      unfollowUser: (targetUserId) => {
        const { currentUser } = get();
        if (!currentUser) return;
        set(s => ({
          currentUser: s.currentUser ? {
            ...s.currentUser,
            followingIds: s.currentUser.followingIds.filter(id => id !== targetUserId),
            followingCount: s.currentUser.followingCount - 1,
          } : null,
        }));
      },

      isFollowing: (targetUserId) =>
        get().currentUser?.followingIds.includes(targetUserId) ?? false,

      // ── Offers ────────────────────────────────────────────────────────────
      offers: [],

      makeOffer: (listingId, amount, message) => {
        const { currentUser } = get();
        if (!currentUser) return;
        const newOffer: Offer = {
          id: `o_${Date.now()}`,
          listingId,
          buyerId: currentUser.id,
          buyer: {
            id: currentUser.id,
            username: currentUser.username,
            displayName: currentUser.displayName,
            avatar: currentUser.avatar,
          },
          amount,
          status: 'pending',
          message,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
        };
        set(s => ({ offers: [...s.offers, newOffer] }));
        get().showToast(`Offer of ${amount.toFixed(3)} KWD sent!`, 'success');
        get().closeOfferModal();
      },

      respondToOffer: (offerId, response) => {
        set(s => ({
          offers: s.offers.map(o =>
            o.id === offerId ? { ...o, status: response } : o
          ),
        }));
        get().showToast(
          response === 'accepted' ? 'Offer accepted!' : 'Offer declined.',
          response === 'accepted' ? 'success' : 'info'
        );
      },

      // ── UI ────────────────────────────────────────────────────────────────
      isMobileMenuOpen: false,
      toggleMobileMenu: () => set(s => ({ isMobileMenuOpen: !s.isMobileMenuOpen })),

      isOfferModalOpen: false,
      activeOfferListingId: null,
      openOfferModal: (listingId) => set({ isOfferModalOpen: true, activeOfferListingId: listingId }),
      closeOfferModal: () => set({ isOfferModalOpen: false, activeOfferListingId: null }),

      toast: null,
      showToast: (message, type = 'info') => {
        set({ toast: { message, type } });
        setTimeout(() => get().clearToast(), 3500);
      },
      clearToast: () => set({ toast: null }),

      notificationCount: MOCK_NOTIFICATIONS.filter(n => !n.read).length,
    }),
    {
      name: 'mycloset-store',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        }
      ),
      // Only persist auth state and liked listings — re-derive the rest
      partialize: (s) => ({
        currentUser: s.currentUser,
        isAuthenticated: s.isAuthenticated,
      }),
    }
  )
);

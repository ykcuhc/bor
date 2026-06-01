'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthUser, Listing, Comment, Offer, Notification, SearchFilters } from '@/types';
import { getSupabaseClient } from '@/lib/supabase/client';
import * as db from '@/lib/supabase/queries';
import { SHIPPING_FEE_KWD, calcEarnings } from '@/lib/mockData';

// ─── Slice interfaces ──────────────────────────────────────────────────────────

interface AuthSlice {
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  login:          (email: string, password: string) => Promise<boolean>;
  register:       (data: RegisterData) => Promise<boolean>;
  logout:         () => Promise<void>;
  updateProfile:  (data: Partial<AuthUser>) => void;
  initAuth:       () => Promise<void>;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  displayName: string;
}

interface ListingsSlice {
  listings: Listing[];
  listingsLoaded: boolean;
  filters: SearchFilters;
  setFilters:     (f: Partial<SearchFilters>) => void;
  resetFilters:   () => void;
  loadListings:   () => Promise<void>;
  getListing:     (id: string) => Listing | undefined;
  getListingsByUser: (userId: string) => Listing[];
  addListing:     (data: NewListingData) => Promise<string>;
  toggleLike:     (listingId: string) => Promise<void>;
  filteredListings: () => Listing[];
  incrementViews: (listingId: string) => Promise<void>;
}

interface NewListingData {
  title: string; description: string; images: string[];
  category: Listing['category']; subCategory: string; brand: string;
  size: string; condition: Listing['condition']; color: string[];
  originalPrice: number; listingPrice: number; quantity: number; tags: string[];
}

interface SocialSlice {
  comments: Comment[];
  notifications: Notification[];
  loadComments:      (listingId: string) => Promise<void>;
  addComment:        (listingId: string, body: string) => Promise<void>;
  loadNotifications: () => Promise<void>;
  markAllRead:       () => Promise<void>;
  followUser:        (targetUserId: string) => Promise<void>;
  unfollowUser:      (targetUserId: string) => Promise<void>;
  isFollowing:       (targetUserId: string) => boolean;
}

interface OfferSlice {
  offers: Offer[];
  makeOffer:       (listingId: string, amount: number, message?: string) => Promise<void>;
  respondToOffer:  (offerId: string, response: 'accepted' | 'declined') => void;
}

interface UISlice {
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  isOfferModalOpen: boolean;
  openOfferModal:   (listingId: string) => void;
  closeOfferModal:  () => void;
  activeOfferListingId: string | null;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast:  (message: string, type?: 'success' | 'error' | 'info') => void;
  clearToast: () => void;
  notificationCount: number;
}

type Store = AuthSlice & ListingsSlice & SocialSlice & OfferSlice & UISlice;

const DEFAULT_FILTERS: SearchFilters = { query: '', sortBy: 'newest' };

// ─── Store ────────────────────────────────────────────────────────────────────

export const useStore = create<Store>()(
  persist(
    (set, get) => ({

      // ── Auth ────────────────────────────────────────────────────────────────

      currentUser: null,
      isAuthenticated: false,

      initAuth: async () => {
        const supabase = getSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        const profile = await db.fetchUserById(supabase, session.user.id);
        if (!profile) return;

        const [likedListings, followingIds] = await Promise.all([
          db.fetchUserLikedIds(supabase, session.user.id),
          db.fetchFollowingIds(supabase, session.user.id),
        ]);

        set({
          currentUser: { ...profile, likedListings, followingIds },
          isAuthenticated: true,
        });
      },

      login: async (email, password) => {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error || !data.user) return false;

        const profile = await db.fetchUserById(supabase, data.user.id);
        if (!profile) return false;

        const [likedListings, followingIds] = await Promise.all([
          db.fetchUserLikedIds(supabase, data.user.id),
          db.fetchFollowingIds(supabase, data.user.id),
        ]);

        set({
          currentUser: { ...profile, likedListings, followingIds },
          isAuthenticated: true,
        });
        return true;
      },

      register: async ({ username, email, password, displayName }) => {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username, display_name: displayName },
          },
        });
        if (error || !data.user) return false;

        // Wait briefly for the trigger to create the public.users row
        await new Promise(r => setTimeout(r, 800));
        const profile = await db.fetchUserById(supabase, data.user.id);
        if (!profile) return false;

        set({
          currentUser: { ...profile, likedListings: [], followingIds: [] },
          isAuthenticated: true,
        });
        return true;
      },

      logout: async () => {
        const supabase = getSupabaseClient();
        await supabase.auth.signOut();
        set({ currentUser: null, isAuthenticated: false, listings: [], listingsLoaded: false });
      },

      updateProfile: (data) => {
        const { currentUser } = get();
        if (!currentUser) return;
        set({ currentUser: { ...currentUser, ...data } });
      },

      // ── Listings ────────────────────────────────────────────────────────────

      listings: [],
      listingsLoaded: false,
      filters: DEFAULT_FILTERS,

      setFilters:   (f) => set(s => ({ filters: { ...s.filters, ...f } })),
      resetFilters: () => set({ filters: DEFAULT_FILTERS }),

      loadListings: async () => {
        const { filters, currentUser } = get();
        const supabase = getSupabaseClient();
        const data = await db.fetchListings(supabase, filters, currentUser?.id);
        set({ listings: data, listingsLoaded: true });
      },

      getListing: (id) => get().listings.find(l => l.id === id),

      getListingsByUser: (userId) => get().listings.filter(l => l.sellerId === userId),

      addListing: async (data) => {
        const { currentUser } = get();
        if (!currentUser) return '';
        const supabase = getSupabaseClient();

        const id = await db.insertListing(supabase, {
          seller_id:     currentUser.id,
          title:         data.title,
          description:   data.description,
          images:        data.images,
          category:      data.category,
          sub_category:  data.subCategory,
          brand:         data.brand,
          size:          data.size,
          condition:     data.condition,
          color:         data.color,
          original_price: data.originalPrice,
          listing_price:  data.listingPrice,
          quantity:      data.quantity,
          tags:          data.tags,
        });

        // Reload feed so the new listing appears immediately
        await get().loadListings();
        return id;
      },

      toggleLike: async (listingId) => {
        const { currentUser } = get();
        if (!currentUser) return;

        const alreadyLiked = currentUser.likedListings.includes(listingId);
        const supabase = getSupabaseClient();

        // Optimistic update
        set(s => ({
          currentUser: s.currentUser ? {
            ...s.currentUser,
            likedListings: alreadyLiked
              ? s.currentUser.likedListings.filter(id => id !== listingId)
              : [...s.currentUser.likedListings, listingId],
          } : null,
          listings: s.listings.map(l =>
            l.id === listingId
              ? { ...l, likesCount: alreadyLiked ? l.likesCount - 1 : l.likesCount + 1, isLikedByCurrentUser: !alreadyLiked }
              : l
          ),
        }));

        try {
          if (alreadyLiked) await db.unlikeListing(supabase, currentUser.id, listingId);
          else              await db.likeListing(supabase, currentUser.id, listingId);
        } catch {
          // Roll back optimistic update on error
          set(s => ({
            currentUser: s.currentUser ? {
              ...s.currentUser,
              likedListings: alreadyLiked
                ? [...s.currentUser.likedListings, listingId]
                : s.currentUser.likedListings.filter(id => id !== listingId),
            } : null,
            listings: s.listings.map(l =>
              l.id === listingId
                ? { ...l, likesCount: alreadyLiked ? l.likesCount + 1 : l.likesCount - 1, isLikedByCurrentUser: alreadyLiked }
                : l
            ),
          }));
          get().showToast('Failed to update like', 'error');
        }
      },

      // Client-side filter + sort on the already-fetched listings array
      filteredListings: () => {
        const { listings, filters, currentUser } = get();
        let result = listings.map(l => ({
          ...l,
          isLikedByCurrentUser: currentUser?.likedListings.includes(l.id) ?? l.isLikedByCurrentUser,
        }));

        if (filters.query) {
          const q = filters.query.toLowerCase();
          result = result.filter(l =>
            l.title.toLowerCase().includes(q) ||
            l.brand.toLowerCase().includes(q)  ||
            l.tags.some(t => t.includes(q))
          );
        }
        if (filters.category)    result = result.filter(l => l.category    === filters.category);
        if (filters.subCategory) result = result.filter(l => l.subCategory === filters.subCategory);
        if (filters.brand)       result = result.filter(l => l.brand.toLowerCase() === filters.brand!.toLowerCase());
        if (filters.size)        result = result.filter(l => l.size        === filters.size);
        if (filters.condition)   result = result.filter(l => l.condition   === filters.condition);
        if (filters.minPrice !== undefined) result = result.filter(l => l.listingPrice >= filters.minPrice!);
        if (filters.maxPrice !== undefined) result = result.filter(l => l.listingPrice <= filters.maxPrice!);
        if (filters.status)      result = result.filter(l => l.status      === filters.status);

        switch (filters.sortBy) {
          case 'price_asc':  result.sort((a, b) => a.listingPrice - b.listingPrice); break;
          case 'price_desc': result.sort((a, b) => b.listingPrice - a.listingPrice); break;
          case 'most_liked': result.sort((a, b) => b.likesCount   - a.likesCount);   break;
          default:           result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        return result;
      },

      incrementViews: async (listingId) => {
        const supabase = getSupabaseClient();
        try {
          await db.incrementListingViews(supabase, listingId);
          set(s => ({
            listings: s.listings.map(l =>
              l.id === listingId ? { ...l, viewsCount: l.viewsCount + 1 } : l
            ),
          }));
        } catch { /* non-critical — ignore */ }
      },

      // ── Social ──────────────────────────────────────────────────────────────

      comments: [],
      notifications: [],

      loadComments: async (listingId) => {
        const supabase = getSupabaseClient();
        const data = await db.fetchComments(supabase, listingId);
        set({ comments: data });
      },

      addComment: async (listingId, body) => {
        const { currentUser } = get();
        if (!currentUser) return;
        const supabase = getSupabaseClient();
        await db.insertComment(supabase, listingId, currentUser.id, body);
        await get().loadComments(listingId);
      },

      loadNotifications: async () => {
        const { currentUser } = get();
        if (!currentUser) return;
        const supabase = getSupabaseClient();
        const data = await db.fetchNotifications(supabase, currentUser.id);
        const unread = data.filter(n => !n.read).length;
        set({ notifications: data, notificationCount: unread });
      },

      markAllRead: async () => {
        const { currentUser } = get();
        if (!currentUser) return;
        const supabase = getSupabaseClient();
        await db.markNotificationsRead(supabase, currentUser.id);
        set(s => ({
          notifications: s.notifications.map(n => ({ ...n, read: true })),
          notificationCount: 0,
        }));
      },

      followUser: async (targetUserId) => {
        const { currentUser } = get();
        if (!currentUser || currentUser.id === targetUserId) return;
        const supabase = getSupabaseClient();
        await db.followUser(supabase, currentUser.id, targetUserId);
        set(s => ({
          currentUser: s.currentUser ? {
            ...s.currentUser,
            followingIds:   [...s.currentUser.followingIds, targetUserId],
            followingCount: s.currentUser.followingCount + 1,
          } : null,
        }));
      },

      unfollowUser: async (targetUserId) => {
        const { currentUser } = get();
        if (!currentUser) return;
        const supabase = getSupabaseClient();
        await db.unfollowUser(supabase, currentUser.id, targetUserId);
        set(s => ({
          currentUser: s.currentUser ? {
            ...s.currentUser,
            followingIds:   s.currentUser.followingIds.filter(id => id !== targetUserId),
            followingCount: s.currentUser.followingCount - 1,
          } : null,
        }));
      },

      isFollowing: (targetUserId) =>
        get().currentUser?.followingIds.includes(targetUserId) ?? false,

      // ── Offers ──────────────────────────────────────────────────────────────

      offers: [],

      makeOffer: async (listingId, amount, message) => {
        const { currentUser } = get();
        if (!currentUser) return;
        const supabase = getSupabaseClient();
        await db.insertOffer(supabase, listingId, currentUser.id, amount, message);
        get().showToast(`Offer of ${amount.toFixed(3)} KWD sent!`, 'success');
        get().closeOfferModal();
      },

      respondToOffer: (offerId, response) => {
        set(s => ({
          offers: s.offers.map(o => o.id === offerId ? { ...o, status: response } : o),
        }));
        get().showToast(response === 'accepted' ? 'Offer accepted!' : 'Offer declined.', response === 'accepted' ? 'success' : 'info');
      },

      // ── UI ──────────────────────────────────────────────────────────────────

      isMobileMenuOpen:     false,
      toggleMobileMenu:     () => set(s => ({ isMobileMenuOpen: !s.isMobileMenuOpen })),
      isOfferModalOpen:     false,
      activeOfferListingId: null,
      openOfferModal:       (listingId) => set({ isOfferModalOpen: true, activeOfferListingId: listingId }),
      closeOfferModal:      () => set({ isOfferModalOpen: false, activeOfferListingId: null }),
      toast:                null,
      showToast: (message, type = 'info') => {
        set({ toast: { message, type } });
        setTimeout(() => get().clearToast(), 3500);
      },
      clearToast: () => set({ toast: null }),
      notificationCount: 0,
    }),
    {
      name: 'mycloset-store',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : {
          getItem: () => null, setItem: () => {}, removeItem: () => {},
        }
      ),
      partialize: (s) => ({
        currentUser:     s.currentUser,
        isAuthenticated: s.isAuthenticated,
      }),
    }
  )
);

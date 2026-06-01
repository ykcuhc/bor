export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      comments: {
        Row: {
          author_id: string
          body: string
          created_at: string | null
          id: string
          listing_id: string
          mentions: string[] | null
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string | null
          id?: string
          listing_id: string
          mentions?: string[] | null
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string | null
          id?: string
          listing_id?: string
          mentions?: string[] | null
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string | null
          id: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: []
      }
      listings: {
        Row: {
          brand: string | null
          category: Database["public"]["Enums"]["item_category"]
          color: string[] | null
          comments_count: number | null
          condition: Database["public"]["Enums"]["item_condition"]
          created_at: string | null
          description: string | null
          id: string
          images: string[]
          likes_count: number | null
          listing_price: number
          original_price: number
          quantity: number | null
          seller_id: string
          shares_count: number | null
          size: string | null
          status: Database["public"]["Enums"]["listing_status"] | null
          sub_category: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          views_count: number | null
        }
        Insert: {
          brand?: string | null
          category: Database["public"]["Enums"]["item_category"]
          color?: string[] | null
          comments_count?: number | null
          condition: Database["public"]["Enums"]["item_condition"]
          created_at?: string | null
          description?: string | null
          id?: string
          images?: string[]
          likes_count?: number | null
          listing_price: number
          original_price: number
          quantity?: number | null
          seller_id: string
          shares_count?: number | null
          size?: string | null
          status?: Database["public"]["Enums"]["listing_status"] | null
          sub_category?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          views_count?: number | null
        }
        Update: {
          brand?: string | null
          category?: Database["public"]["Enums"]["item_category"]
          color?: string[] | null
          comments_count?: number | null
          condition?: Database["public"]["Enums"]["item_condition"]
          created_at?: string | null
          description?: string | null
          id?: string
          images?: string[]
          likes_count?: number | null
          listing_price?: number
          original_price?: number
          quantity?: number | null
          seller_id?: string
          shares_count?: number | null
          size?: string | null
          status?: Database["public"]["Enums"]["listing_status"] | null
          sub_category?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          views_count?: number | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_id: string
          created_at: string | null
          id: string
          listing_id: string | null
          read: boolean | null
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          actor_id: string
          created_at?: string | null
          id?: string
          listing_id?: string | null
          read?: boolean | null
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          actor_id?: string
          created_at?: string | null
          id?: string
          listing_id?: string | null
          read?: boolean | null
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      offers: {
        Row: {
          amount: number
          buyer_id: string
          counter_amount: number | null
          created_at: string | null
          expires_at: string
          id: string
          listing_id: string
          message: string | null
          status: Database["public"]["Enums"]["offer_status"] | null
        }
        Insert: {
          amount: number
          buyer_id: string
          counter_amount?: number | null
          created_at?: string | null
          expires_at?: string
          id?: string
          listing_id: string
          message?: string | null
          status?: Database["public"]["Enums"]["offer_status"] | null
        }
        Update: {
          amount?: number
          buyer_id?: string
          counter_amount?: number | null
          created_at?: string | null
          expires_at?: string
          id?: string
          listing_id?: string
          message?: string | null
          status?: Database["public"]["Enums"]["offer_status"] | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          amount: number
          buyer_id: string
          created_at: string | null
          id: string
          listing_id: string
          platform_fee: number
          seller_earnings: number
          seller_id: string
          shipping_fee: number
          shipping_provider: string | null
          status: Database["public"]["Enums"]["order_status"] | null
          tracking_number: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          buyer_id: string
          created_at?: string | null
          id?: string
          listing_id: string
          platform_fee: number
          seller_earnings: number
          seller_id: string
          shipping_fee?: number
          shipping_provider?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          tracking_number?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          buyer_id?: string
          created_at?: string | null
          id?: string
          listing_id?: string
          platform_fee?: number
          seller_earnings?: number
          seller_id?: string
          shipping_fee?: number
          shipping_provider?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          tracking_number?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar: string | null
          average_rating: number | null
          bio: string | null
          created_at: string | null
          display_name: string
          email: string
          followers_count: number | null
          following_count: number | null
          header_image: string | null
          id: string
          is_verified: boolean | null
          listings_count: number | null
          location: string | null
          sold_count: number | null
          total_ratings: number | null
          updated_at: string | null
          username: string
        }
        Insert: {
          avatar?: string | null
          average_rating?: number | null
          bio?: string | null
          created_at?: string | null
          display_name: string
          email: string
          followers_count?: number | null
          following_count?: number | null
          header_image?: string | null
          id?: string
          is_verified?: boolean | null
          listings_count?: number | null
          location?: string | null
          sold_count?: number | null
          total_ratings?: number | null
          updated_at?: string | null
          username: string
        }
        Update: {
          avatar?: string | null
          average_rating?: number | null
          bio?: string | null
          created_at?: string | null
          display_name?: string
          email?: string
          followers_count?: number | null
          following_count?: number | null
          header_image?: string | null
          id?: string
          is_verified?: boolean | null
          listings_count?: number | null
          location?: string | null
          sold_count?: number | null
          total_ratings?: number | null
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: {
      item_category: "Women" | "Men" | "Kids" | "Home" | "Electronics" | "Beauty" | "Pets" | "Garden"
      item_condition: "NWT" | "NWOT" | "Excellent" | "Good" | "Fair"
      listing_status: "available" | "sold" | "reserved"
      notification_type: "new_like" | "new_comment" | "new_offer" | "offer_accepted" | "offer_declined" | "new_follower" | "item_sold" | "new_share"
      offer_status: "pending" | "accepted" | "declined" | "expired" | "countered"
      order_status: "pending" | "shipped" | "delivered" | "completed" | "disputed"
    }
    CompositeTypes: { [_ in never]: never }
  }
}

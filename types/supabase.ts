export type Database = {
  public: {
    Tables: {
      cards: {
        Row: {
          id: string
          created_at: string
          name: string
          set: string
          number: string
          image_url: string
          price_data: Record<string, unknown>
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          set: string
          number: string
          image_url: string
          price_data?: Record<string, unknown>
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          set?: string
          number?: string
          image_url?: string
          price_data?: Record<string, unknown>
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 
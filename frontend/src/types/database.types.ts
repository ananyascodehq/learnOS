export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      friendships: {
        Row: {
          addressee_id: string
          created_at: string | null
          id: string
          requester_id: string
          status: Database["public"]["Enums"]["friendship_status"]
        }
        Insert: {
          addressee_id: string
          created_at?: string | null
          id?: string
          requester_id: string
          status?: Database["public"]["Enums"]["friendship_status"]
        }
        Update: {
          addressee_id?: string
          created_at?: string | null
          id?: string
          requester_id?: string
          status?: Database["public"]["Enums"]["friendship_status"]
        }
        Relationships: [
          {
            foreignKeyName: "friendships_addressee_id_fkey"
            columns: ["addressee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      nptel_courses: {
        Row: {
          course_name: string
          course_provider: string | null
          credits: number | null
          created_at: string | null
          id: string
          instructor_name: string | null
          total_weeks: number
          user_id: string
        }
        Insert: {
          course_name: string
          course_provider?: string | null
          credits?: number | null
          created_at?: string | null
          id?: string
          instructor_name?: string | null
          total_weeks: number
          user_id: string
        }
        Update: {
          course_name?: string
          course_provider?: string | null
          credits?: number | null
          created_at?: string | null
          id?: string
          instructor_name?: string | null
          total_weeks?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nptel_courses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      nptel_weeks: {
        Row: {
          course_id: string
          id: string
          status: Database["public"]["Enums"]["nptel_status"]
          updated_at: string | null
          week_number: number
        }
        Insert: {
          course_id: string
          id?: string
          status?: Database["public"]["Enums"]["nptel_status"]
          updated_at?: string | null
          week_number: number
        }
        Update: {
          course_id?: string
          id?: string
          status?: Database["public"]["Enums"]["nptel_status"]
          updated_at?: string | null
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "nptel_weeks_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "nptel_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          category: Database["public"]["Enums"]["category_type"]
          college_work_type:
          | Database["public"]["Enums"]["college_work_type"]
          | null
          created_at: string | null
          date: string
          deadline_submitted: boolean | null
          due_date: string | null
          duration_minutes: number | null
          end_time: string
          id: string
          next_action: string | null
          next_action_done: boolean | null
          start_time: string
          status: Database["public"]["Enums"]["session_status"]
          title: string
          user_id: string
          was_useful: boolean
          what_i_did: string
        }
        Insert: {
          category: Database["public"]["Enums"]["category_type"]
          college_work_type?:
          | Database["public"]["Enums"]["college_work_type"]
          | null
          created_at?: string | null
          date?: string
          deadline_submitted?: boolean | null
          due_date?: string | null
          duration_minutes?: number | null
          end_time: string
          id?: string
          next_action?: string | null
          next_action_done?: boolean | null
          start_time: string
          status?: Database["public"]["Enums"]["session_status"]
          title: string
          user_id: string
          was_useful: boolean
          what_i_did: string
        }
        Update: {
          category?: Database["public"]["Enums"]["category_type"]
          college_work_type?:
          | Database["public"]["Enums"]["college_work_type"]
          | null
          created_at?: string | null
          date?: string
          deadline_submitted?: boolean | null
          due_date?: string | null
          duration_minutes?: number | null
          end_time?: string
          id?: string
          next_action?: string | null
          next_action_done?: boolean | null
          start_time?: string
          status?: Database["public"]["Enums"]["session_status"]
          title?: string
          user_id?: string
          was_useful?: boolean
          what_i_did?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          college: string | null
          created_at: string | null
          email: string
          full_name: string | null
          hide_from_friends: boolean | null
          id: string
          semester: number | null
          semester_end: string | null
          semester_start: string | null
          year: number | null
        }
        Insert: {
          avatar_url?: string | null
          college?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          hide_from_friends?: boolean | null
          id: string
          semester?: number | null
          semester_end?: string | null
          semester_start?: string | null
          year?: number | null
        }
        Update: {
          avatar_url?: string | null
          college?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          hide_from_friends?: boolean | null
          id?: string
          semester?: number | null
          semester_end?: string | null
          semester_start?: string | null
          year?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      category_type:
      | "DSA"
      | "Course/Learning"
      | "Projects"
      | "College Work"
      | "Other"
      college_work_type: "Record" | "Observation" | "Assignment"
      friendship_status: "Pending" | "Accepted" | "Rejected"
      nptel_status: "Not Started" | "In Progress" | "Completed"
      session_status: "In Progress" | "Completed" | "Paused"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {
      category_type: [
        "DSA",
        "Course/Learning",
        "Projects",
        "College Work",
        "Other",
      ],
      college_work_type: ["Record", "Observation", "Assignment"],
      friendship_status: ["Pending", "Accepted", "Rejected"],
      nptel_status: ["Not Started", "In Progress", "Completed"],
      session_status: ["In Progress", "Completed", "Paused"],
    },
  },
} as const

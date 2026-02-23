import type { Database } from './database.types'

export type User = Database['public']['Tables']['users']['Row']
export type Session = Database['public']['Tables']['sessions']['Row']
export type NptelCourse = Database['public']['Tables']['nptel_courses']['Row']
export type NptelWeek = Database['public']['Tables']['nptel_weeks']['Row']
export type Friendship = Database['public']['Tables']['friendships']['Row']

export type CategoryType = Database['public']['Enums']['category_type']
export type SessionStatus = Database['public']['Enums']['session_status']
export type CollegeWorkType = Database['public']['Enums']['college_work_type']
export type NptelStatus = Database['public']['Enums']['nptel_status']

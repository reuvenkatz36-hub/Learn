export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          streak_count: number
          last_activity_date: string | null
          total_xp: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          streak_count?: number
          last_activity_date?: string | null
          total_xp?: number
        }
        Update: {
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          streak_count?: number
          last_activity_date?: string | null
          total_xp?: number
        }
      }
      roadmaps: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          topic: string
          difficulty: 'beginner' | 'intermediate' | 'advanced'
          estimated_hours: number
          sections: Json
          status: 'active' | 'completed' | 'paused'
          generation_status: 'generating' | 'ready' | 'error'
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          title: string
          description?: string | null
          topic: string
          difficulty?: 'beginner' | 'intermediate' | 'advanced'
          estimated_hours?: number
          sections?: Json
          status?: 'active' | 'completed' | 'paused'
          generation_status?: 'generating' | 'ready' | 'error'
        }
        Update: {
          title?: string
          description?: string | null
          status?: 'active' | 'completed' | 'paused'
          generation_status?: 'generating' | 'ready' | 'error'
          sections?: Json
        }
      }
      lessons: {
        Row: {
          id: string
          roadmap_id: string
          user_id: string
          title: string
          section_index: number
          content: Json
          status: 'locked' | 'available' | 'in_progress' | 'completed'
          completed_at: string | null
          created_at: string
        }
        Insert: {
          roadmap_id: string
          user_id: string
          title: string
          section_index: number
          content?: Json
          status?: 'locked' | 'available' | 'in_progress' | 'completed'
        }
        Update: {
          content?: Json
          status?: 'locked' | 'available' | 'in_progress' | 'completed'
          completed_at?: string | null
        }
      }
      quizzes: {
        Row: {
          id: string
          lesson_id: string
          user_id: string
          questions: Json
          score: number | null
          max_score: number | null
          submitted_at: string | null
          created_at: string
        }
        Insert: {
          lesson_id: string
          user_id: string
          questions: Json
          score?: number | null
          max_score?: number | null
        }
        Update: {
          score?: number | null
          submitted_at?: string | null
        }
      }
      assignments: {
        Row: {
          id: string
          lesson_id: string
          user_id: string
          prompt: string
          submission: string | null
          ai_feedback: string | null
          score: number | null
          status: 'pending' | 'submitted' | 'graded'
          submitted_at: string | null
          created_at: string
        }
        Insert: {
          lesson_id: string
          user_id: string
          prompt: string
          submission?: string | null
          ai_feedback?: string | null
          score?: number | null
          status?: 'pending' | 'submitted' | 'graded'
        }
        Update: {
          submission?: string | null
          ai_feedback?: string | null
          score?: number | null
          status?: 'pending' | 'submitted' | 'graded'
          submitted_at?: string | null
        }
      }
      chat_messages: {
        Row: {
          id: string
          user_id: string
          roadmap_id: string | null
          role: 'user' | 'assistant'
          content: string
          created_at: string
        }
        Insert: {
          user_id: string
          roadmap_id?: string | null
          role: 'user' | 'assistant'
          content: string
        }
        Update: never
      }
      knowledge_nodes: {
        Row: {
          id: string
          user_id: string
          roadmap_id: string
          label: string
          node_type: 'topic' | 'concept' | 'skill'
          position: Json
          mastery_level: number
          created_at: string
        }
        Insert: {
          user_id: string
          roadmap_id: string
          label: string
          node_type?: 'topic' | 'concept' | 'skill'
          position?: Json
          mastery_level?: number
        }
        Update: {
          position?: Json
          mastery_level?: number
        }
      }
      knowledge_edges: {
        Row: {
          id: string
          user_id: string
          roadmap_id: string
          source_id: string
          target_id: string
          created_at: string
        }
        Insert: {
          user_id: string
          roadmap_id: string
          source_id: string
          target_id: string
        }
        Update: never
      }
      daily_activity: {
        Row: {
          id: string
          user_id: string
          activity_date: string
          xp_earned: number
          lessons_completed: number
          quizzes_taken: number
        }
        Insert: {
          user_id: string
          activity_date: string
          xp_earned?: number
          lessons_completed?: number
          quizzes_taken?: number
        }
        Update: {
          xp_earned?: number
          lessons_completed?: number
          quizzes_taken?: number
        }
      }
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Roadmap = Database['public']['Tables']['roadmaps']['Row']
export type Lesson = Database['public']['Tables']['lessons']['Row']
export type Quiz = Database['public']['Tables']['quizzes']['Row']
export type Assignment = Database['public']['Tables']['assignments']['Row']
export type ChatMessage = Database['public']['Tables']['chat_messages']['Row']
export type KnowledgeNode = Database['public']['Tables']['knowledge_nodes']['Row']
export type KnowledgeEdge = Database['public']['Tables']['knowledge_edges']['Row']
export type DailyActivity = Database['public']['Tables']['daily_activity']['Row']

export interface RoadmapSection {
  index: number
  title: string
  description: string
  topics: string[]
  estimatedMinutes: number
}

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

export interface LessonContentSection {
  title: string
  content: string
  type: 'text' | 'example' | 'key_point' | 'exercise'
}

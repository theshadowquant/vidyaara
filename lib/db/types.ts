/**
 * Vidyaaraa — Database Types
 * Auto-generate with: npx supabase gen types typescript --project-id <id> > lib/db/types.ts
 */

export type ResourceType =
  | 'notes'
  | 'question-paper'
  | 'lab-manual'
  | 'important-questions'
  | 'syllabus'
  | 'reference';

export type ExamType = 'CIE' | 'SEE' | 'Model' | 'Practice';

export type NoteRequestStatus = 'Under Review' | 'In Progress' | 'Available';

export interface Database {
  public: {
    Tables: {
      universities: {
        Row: {
          id: string;
          name: string;
          short_name: string;
          slug: string;
        };
        Insert: {
          id: string;
          name: string;
          short_name: string;
          slug: string;
        };
        Update: {
          id?: string;
          name?: string;
          short_name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      branches: {
        Row: {
          id: string;
          university_id: string;
          name: string;
          short_name: string;
          slug: string;
        };
        Insert: {
          id: string;
          university_id: string;
          name: string;
          short_name: string;
          slug: string;
        };
        Update: {
          id?: string;
          university_id?: string;
          name?: string;
          short_name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      subjects: {
        Row: {
          id: string;
          university_id: string;
          branch_id: string;
          semester: number;
          code: string;
          name: string;
          credits: number;
        };
        Insert: {
          id: string;
          university_id: string;
          branch_id: string;
          semester: number;
          code: string;
          name: string;
          credits: number;
        };
        Update: {
          id?: string;
          university_id?: string;
          branch_id?: string;
          semester?: number;
          code?: string;
          name?: string;
          credits?: number;
        };
        Relationships: [];
      };
      resources: {
        Row: {
          id: string;
          subject_id: string | null;
          subject_name: string;
          branch_id: string;
          semester: number;
          university_id: string;
          type: ResourceType;
          title: string;
          description: string;
          url: string;
          is_demo: boolean;
          uploaded_at: string;
          search_vector?: string;
        };
        Insert: {
          id?: string;
          subject_id?: string | null;
          subject_name: string;
          branch_id: string;
          semester: number;
          university_id?: string;
          type: ResourceType;
          title: string;
          description?: string;
          url: string;
          is_demo?: boolean;
          uploaded_at?: string;
          search_vector?: string;
        };
        Update: {
          id?: string;
          subject_id?: string | null;
          subject_name?: string;
          branch_id?: string;
          semester?: number;
          university_id?: string;
          type?: ResourceType;
          title?: string;
          description?: string;
          url?: string;
          is_demo?: boolean;
          uploaded_at?: string;
        };
        Relationships: [];
      };
      pyqs: {
        Row: {
          id: string;
          subject_id: string | null;
          subject_name: string;
          subject_code: string;
          branch_id: string;
          semester: number;
          university_id: string;
          year: number;
          exam_type: ExamType;
          url: string;
          is_demo: boolean;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          subject_id?: string | null;
          subject_name: string;
          subject_code?: string;
          branch_id: string;
          semester: number;
          university_id?: string;
          year: number;
          exam_type: ExamType;
          url: string;
          is_demo?: boolean;
          uploaded_at?: string;
        };
        Update: {
          id?: string;
          subject_id?: string | null;
          subject_name?: string;
          subject_code?: string;
          branch_id?: string;
          semester?: number;
          university_id?: string;
          year?: number;
          exam_type?: ExamType;
          url?: string;
          is_demo?: boolean;
          uploaded_at?: string;
        };
        Relationships: [];
      };
      note_requests: {
        Row: {
          id: string;
          subject: string;
          branch: string;
          semester: string;
          status: NoteRequestStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          subject: string;
          branch: string;
          semester: string;
          status?: NoteRequestStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          subject?: string;
          branch?: string;
          semester?: string;
          status?: NoteRequestStatus;
          created_at?: string;
        };
        Relationships: [];
      };
      feedbacks: {
        Row: {
          id: string;
          rating: number;
          comment: string;
          category: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          rating: number;
          comment: string;
          category: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          rating?: number;
          comment?: string;
          category?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      admin_roles: {
        Row: {
          user_id: string;
          granted_at: string;
        };
        Insert: {
          user_id: string;
          granted_at?: string;
        };
        Update: {
          user_id?: string;
          granted_at?: string;
        };
        Relationships: [];
      };
      resource_access_logs: {
        Row: {
          id: string;
          student_name: string;
          usn: string;
          email?: string | null;
          resource_id: string | null;
          resource_title: string;
          resource_type: string;
          branch_id: string | null;
          semester: number | null;
          accessed_at: string;
        };
        Insert: {
          id?: string;
          student_name: string;
          usn: string;
          email?: string | null;
          resource_id?: string | null;
          resource_title: string;
          resource_type?: string;
          branch_id?: string | null;
          semester?: number | null;
          accessed_at?: string;
        };
        Update: {
          id?: string;
          student_name?: string;
          usn?: string;
          email?: string | null;
          resource_id?: string | null;
          resource_title?: string;
          resource_type?: string;
          branch_id?: string | null;
          semester?: number | null;
          accessed_at?: string;
        };
        Relationships: [];
      };
      site_stats: {
        Row: {
          id: string;
          count: number;
          updatedAt: string;
        };
        Insert: {
          id: string;
          count?: number;
          updatedAt?: string;
        };
        Update: {
          id?: string;
          count?: number;
          updatedAt?: string;
        };
        Relationships: [];
      };
      visitor_logs: {
        Row: {
          id: string;
          name: string;
          usn: string;
          email: string | null;
          action: string;
          details: string;
          branch: string | null;
          sem: string | null;
          createdAt: string;
        };
        Insert: {
          id: string;
          name: string;
          usn: string;
          email?: string | null;
          action?: string;
          details: string;
          branch?: string | null;
          sem?: string | null;
          createdAt?: string;
        };
        Update: {
          id?: string;
          name?: string;
          usn?: string;
          email?: string | null;
          action?: string;
          details?: string;
          branch?: string | null;
          sem?: string | null;
          createdAt?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type DbResource          = Database['public']['Tables']['resources']['Row'];
export type DbPYQ               = Database['public']['Tables']['pyqs']['Row'];
export type DbNoteRequest       = Database['public']['Tables']['note_requests']['Row'];
export type DbFeedback          = Database['public']['Tables']['feedbacks']['Row'];
export type DbBranch            = Database['public']['Tables']['branches']['Row'];
export type DbSubject           = Database['public']['Tables']['subjects']['Row'];
export type DbResourceAccessLog = Database['public']['Tables']['resource_access_logs']['Row'];

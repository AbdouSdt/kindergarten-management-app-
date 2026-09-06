/**
 * Database types.
 *
 * This is a hand-written starter that matches supabase/migrations/0001_initial_schema.sql.
 * Once your schema is live you can regenerate it from the source of truth:
 *
 *   npx supabase gen types typescript --project-id <your-project-ref> --schema public > src/types/database.types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: Database["public"]["Enums"]["user_role"];
          full_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: Database["public"]["Enums"]["user_role"];
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: Database["public"]["Enums"]["user_role"];
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      classrooms: {
        Row: {
          id: string;
          name: string;
          age_group: string | null;
          capacity: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          age_group?: string | null;
          capacity?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          age_group?: string | null;
          capacity?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      children: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          date_of_birth: string;
          classroom_id: string | null;
          allergies: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          first_name: string;
          last_name: string;
          date_of_birth: string;
          classroom_id?: string | null;
          allergies?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          first_name?: string;
          last_name?: string;
          date_of_birth?: string;
          classroom_id?: string | null;
          allergies?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "children_classroom_id_fkey";
            columns: ["classroom_id"];
            referencedRelation: "classrooms";
            referencedColumns: ["id"];
          },
        ];
      };
      guardians: {
        Row: {
          child_id: string;
          parent_id: string;
          relationship: string | null;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          child_id: string;
          parent_id: string;
          relationship?: string | null;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: {
          child_id?: string;
          parent_id?: string;
          relationship?: string | null;
          is_primary?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "guardians_child_id_fkey";
            columns: ["child_id"];
            referencedRelation: "children";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "guardians_parent_id_fkey";
            columns: ["parent_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      attendance: {
        Row: {
          id: string;
          child_id: string;
          date: string;
          status: Database["public"]["Enums"]["attendance_status"];
          check_in_at: string | null;
          check_out_at: string | null;
          recorded_by: string | null;
          note: string | null;
        };
        Insert: {
          id?: string;
          child_id: string;
          date: string;
          status?: Database["public"]["Enums"]["attendance_status"];
          check_in_at?: string | null;
          check_out_at?: string | null;
          recorded_by?: string | null;
          note?: string | null;
        };
        Update: {
          id?: string;
          child_id?: string;
          date?: string;
          status?: Database["public"]["Enums"]["attendance_status"];
          check_in_at?: string | null;
          check_out_at?: string | null;
          recorded_by?: string | null;
          note?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "attendance_child_id_fkey";
            columns: ["child_id"];
            referencedRelation: "children";
            referencedColumns: ["id"];
          },
        ];
      };
      announcements: {
        Row: {
          id: string;
          title: string;
          body: string;
          audience: Database["public"]["Enums"]["announcement_audience"];
          classroom_id: string | null;
          author_id: string | null;
          published_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          body: string;
          audience?: Database["public"]["Enums"]["announcement_audience"];
          classroom_id?: string | null;
          author_id?: string | null;
          published_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          body?: string;
          audience?: Database["public"]["Enums"]["announcement_audience"];
          classroom_id?: string | null;
          author_id?: string | null;
          published_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: {
      user_role: "admin" | "parent";
      attendance_status: "present" | "absent" | "late" | "excused";
      announcement_audience: "all" | "parents" | "classroom";
    };
    CompositeTypes: Record<never, never>;
  };
}

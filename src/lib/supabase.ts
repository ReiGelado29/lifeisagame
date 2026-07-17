import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      characters: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          weight: number;
          class: string;
          xp: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name?: string;
          weight?: number;
          class?: string;
          xp?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          weight?: number;
          class?: string;
          xp?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      attribute_categories: {
        Row: {
          id: string;
          name: string;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          display_order?: number;
          created_at?: string;
        };
      };
      attributes: {
        Row: {
          id: string;
          category_id: string;
          name: string;
          parent_id: string | null;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          name: string;
          parent_id?: string | null;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string;
          name?: string;
          parent_id?: string | null;
          display_order?: number;
          created_at?: string;
        };
      };
      character_attributes: {
        Row: {
          id: string;
          character_id: string;
          attribute_id: string;
          value: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          character_id: string;
          attribute_id: string;
          value?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          character_id?: string;
          attribute_id?: string;
          value?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      behaviors: {
        Row: {
          id: string;
          name: string;
          mental_energy: number;
          stable_dopamine: number;
          focus: number;
          stress: number;
          emotional_stability: number;
          fatigue: number;
          cognitive_overload: number;
          xp_reward: number;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          mental_energy?: number;
          stable_dopamine?: number;
          focus?: number;
          stress?: number;
          emotional_stability?: number;
          fatigue?: number;
          cognitive_overload?: number;
          xp_reward?: number;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          mental_energy?: number;
          stable_dopamine?: number;
          focus?: number;
          stress?: number;
          emotional_stability?: number;
          fatigue?: number;
          cognitive_overload?: number;
          xp_reward?: number;
          description?: string | null;
          created_at?: string;
        };
      };
      daily_logs: {
        Row: {
          id: string;
          character_id: string;
          log_date: string;
          mental_energy: number;
          stable_dopamine: number;
          focus: number;
          stress: number;
          emotional_stability: number;
          fatigue: number;
          cognitive_overload: number;
          sleep_hours: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          character_id: string;
          log_date?: string;
          mental_energy?: number;
          stable_dopamine?: number;
          focus?: number;
          stress?: number;
          emotional_stability?: number;
          fatigue?: number;
          cognitive_overload?: number;
          sleep_hours?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          character_id?: string;
          log_date?: string;
          mental_energy?: number;
          stable_dopamine?: number;
          focus?: number;
          stress?: number;
          emotional_stability?: number;
          fatigue?: number;
          cognitive_overload?: number;
          sleep_hours?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      daily_activities: {
        Row: {
          id: string;
          daily_log_id: string;
          behavior_id: string;
          duration_minutes: number;
          notes: string | null;
          performed_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          daily_log_id: string;
          behavior_id: string;
          duration_minutes?: number;
          notes?: string | null;
          performed_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          daily_log_id?: string;
          behavior_id?: string;
          duration_minutes?: number;
          notes?: string | null;
          performed_at?: string;
          created_at?: string;
        };
      };
      missions: {
        Row: {
          id: string;
          character_id: string;
          title: string;
          description: string | null;
          xp_reward: number;
          deadline: string | null;
          urgency: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          character_id: string;
          title: string;
          description?: string | null;
          xp_reward?: number;
          deadline?: string | null;
          urgency?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          character_id?: string;
          title?: string;
          description?: string | null;
          xp_reward?: number;
          deadline?: string | null;
          urgency?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      mission_steps: {
        Row: {
          id: string;
          mission_id: string;
          parent_step_id: string | null;
          title: string;
          description: string | null;
          xp_reward: number;
          is_completed: boolean;
          display_order: number;
          level: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          mission_id: string;
          parent_step_id?: string | null;
          title: string;
          description?: string | null;
          xp_reward?: number;
          is_completed?: boolean;
          display_order?: number;
          level?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          mission_id?: string;
          parent_step_id?: string | null;
          title?: string;
          description?: string | null;
          xp_reward?: number;
          is_completed?: boolean;
          display_order?: number;
          level?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      mission_step_attributes: {
        Row: {
          id: string;
          mission_step_id: string;
          attribute_id: string;
          xp_amount: number;
        };
        Insert: {
          id?: string;
          mission_step_id: string;
          attribute_id: string;
          xp_amount?: number;
        };
        Update: {
          id?: string;
          mission_step_id?: string;
          attribute_id?: string;
          xp_amount?: number;
        };
      };
      inventory_items: {
        Row: {
          id: string;
          character_id: string;
          name: string;
          description: string | null;
          category: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          character_id: string;
          name: string;
          description?: string | null;
          category?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          character_id?: string;
          name?: string;
          description?: string | null;
          category?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      item_objectives: {
        Row: {
          id: string;
          inventory_item_id: string;
          objective: string;
          is_completed: boolean;
          frequency: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          inventory_item_id: string;
          objective: string;
          is_completed?: boolean;
          frequency?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          inventory_item_id?: string;
          objective?: string;
          is_completed?: boolean;
          frequency?: string | null;
          created_at?: string;
        };
      };
      item_information: {
        Row: {
          id: string;
          inventory_item_id: string;
          information: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          inventory_item_id: string;
          information: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          inventory_item_id?: string;
          information?: string;
          created_at?: string;
        };
      };
      notepad_notes: {
        Row: {
          id: string;
          character_id: string;
          title: string | null;
          content: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          character_id: string;
          title?: string | null;
          content?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          character_id?: string;
          title?: string | null;
          content?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};

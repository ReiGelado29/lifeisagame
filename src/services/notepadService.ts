import { supabase } from '../lib/supabase';
import type { Note } from '../types';

export const notepadService = {
  async getNotes(characterId: string): Promise<Note[]> {
    const { data } = await supabase
      .from('notepad_notes')
      .select('*')
      .eq('character_id', characterId)
      .order('updated_at', { ascending: false });
    return data || [];
  },

  async createNote(characterId: string, title: string = 'Nova Nota'): Promise<Note | null> {
    const { data } = await supabase
      .from('notepad_notes')
      .insert({
        character_id: characterId,
        title,
        content: '',
      })
      .select()
      .maybeSingle();
    return data;
  },

  async updateNote(id: string, updates: { title?: string; content?: string }): Promise<Note | null> {
    const { data } = await supabase
      .from('notepad_notes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle();
    return data;
  },

  async deleteNote(id: string): Promise<void> {
    await supabase.from('notepad_notes').delete().eq('id', id);
  },

  async reorderNote(id: string, newDisplayOrder: number): Promise<void> {
    await supabase
      .from('notepad_notes')
      .update({ display_order: newDisplayOrder, updated_at: new Date().toISOString() })
      .eq('id', id);
  },
};

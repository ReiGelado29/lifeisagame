import { supabase } from '../lib/supabase';
import type { AttributeCategory } from '../types';

export const categoryService = {
  async getCategories(userId: string): Promise<AttributeCategory[]> {
    const { data, error } = await supabase
      .from('attribute_categories')
      .select('*')
      .eq('user_id', userId)
      .order('display_order', { ascending: true });

    if (error) throw error;

    return data || [];
  },

  async getCategoryById(
    id: string,
    userId: string
  ): Promise<AttributeCategory | null> {
    const { data, error } = await supabase
      .from('attribute_categories')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;

    return data;
  },

  async createCategory(
    userId: string,
    name: string,
    displayOrder: number
  ): Promise<AttributeCategory | null> {
    const { data, error } = await supabase
      .from('attribute_categories')
      .insert({
        user_id: userId,
        name: name.trim(),
        display_order: displayOrder,
      })
      .select()
      .maybeSingle();

    if (error) throw error;

    return data;
  },

  async updateCategory(
    id: string,
    userId: string,
    name: string
  ): Promise<void> {
    const { error } = await supabase
      .from('attribute_categories')
      .update({
        name: name.trim(),
      })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  },

  async deleteCategory(
    id: string,
    userId: string
  ): Promise<void> {
    const { error } = await supabase
      .from('attribute_categories')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  },

  async reorderCategory(
    id: string,
    userId: string,
    newDisplayOrder: number
  ): Promise<void> {
    const { error } = await supabase
      .from('attribute_categories')
      .update({
        display_order: newDisplayOrder,
      })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  },
};

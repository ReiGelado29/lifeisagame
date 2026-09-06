import { supabase } from '../lib/supabase';
import type { Character, CategoryWithAttributes, Attribute } from '../types';

export const characterService = {
  async getCharacter(userId: string): Promise<Character | null> {
    const { data } = await supabase
      .from('characters')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    return data;
  },

  async createCharacter(userId: string, name: string = 'Adventurer'): Promise<Character | null> {
    const { data } = await supabase
      .from('characters')
      .insert({ user_id: userId, name })
      .select()
      .maybeSingle();
    return data;
  },

  async updateCharacter(id: string, updates: Partial<Character>): Promise<Character | null> {
    const { data } = await supabase
      .from('characters')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle();
    return data;
  },

  async getCharacterWithAttributes(characterId: string): Promise<CategoryWithAttributes[]> {
    const { data: categoriesData } = await supabase
      .from('attribute_categories')
      .select('*')
      .order('display_order');

    const { data: attributesData } = await supabase
      .from('attributes')
      .select('*')
      .order('display_order');

    const { data: charAttributesData } = await supabase
      .from('character_attributes')
      .select('*')
      .eq('character_id', characterId);

    const charAttrsMap = new Map(charAttributesData?.map(ca => [ca.attribute_id, ca.value]) || []);

    type AttributeNode = Attribute & { children: AttributeNode[]; value: number };

    const buildAttributeTree = (
  parentId: string | null,
  categoryId: string
): AttributeNode[] => {
  return (attributesData || [])
    .filter(
      a =>
        a.parent_id === parentId &&
        a.category_id === categoryId
    )
    .map(attr => ({
      ...attr,
      children: buildAttributeTree(attr.id, categoryId),
      value: charAttrsMap.get(attr.id) || 0,
    }));
};

    return (categoriesData || []).map(cat => ({
  ...cat,
  attributes: buildAttributeTree(null, cat.id),
}));
  },

  async updateAttributeValue(characterId: string, attributeId: string, value: number): Promise<void> {
    await supabase
      .from('character_attributes')
      .upsert(
        { character_id: characterId, attribute_id: attributeId, value, updated_at: new Date().toISOString() },
        { onConflict: 'character_id,attribute_id' }
      );
  },

async createSubAttribute(
  parentId: string,
  name: string,
  displayOrder: number
): Promise<Attribute | null> {
  const parent = await this.getAttributeById(parentId);
  if (!parent) return null;

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('attributes')
    .insert({
      user_id: user.id,
      category_id: parent.category_id,
      name: name.trim(),
      parent_id: parentId,
      display_order: displayOrder,
    })
    .select()
    .maybeSingle();

  if (error) throw error;

  return data;
},


  async getAttributeById(id: string): Promise<Attribute | null> {
    const { data } = await supabase
      .from('attributes')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    return data;
  },

  async deleteAttribute(id: string): Promise<void> {
    try {
      const { error: charAttrError } = await supabase.from('character_attributes').delete().eq('attribute_id', id);
      if (charAttrError) throw charAttrError;

      const { error: attrError } = await supabase.from('attributes').delete().eq('id', id);
      if (attrError) throw attrError;
    } catch (error) {
      console.error('Error deleting attribute:', error);
      throw error;
    }
  },

  async getAttributeCount(parentId: string): Promise<number> {
    const { count } = await supabase
      .from('attributes')
      .select('*', { count: 'exact', head: true })
      .eq('parent_id', parentId);
    return count || 0;
  },

  async addXp(characterId: string, amount: number): Promise<void> {
    const { data: charData } = await supabase
      .from('characters')
      .select('xp')
      .eq('id', characterId)
      .maybeSingle();

    if (charData) {
      await supabase
        .from('characters')
        .update({ xp: charData.xp + amount })
        .eq('id', characterId);
    }
  },

  async updateAttributeName(id: string, name: string): Promise<void> {
  const { error } = await supabase
    .from('attributes')
    .update({ name })
    .eq('id', id);

  if (error) throw error;
},

  async reorderAttribute(id: string, newDisplayOrder: number): Promise<void> {
    const { error } = await supabase
      .from('attributes')
      .update({
    display_order: newDisplayOrder
})
      .eq('id', id);
    if (error) throw error;
  },
};

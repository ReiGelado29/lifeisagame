import { supabase } from '../lib/supabase';
import type { InventoryItem, ItemObjective, ItemInformation, InventoryItemWithDetails } from '../types';

export const inventoryService = {
  async getItems(characterId: string): Promise<InventoryItemWithDetails[]> {
    const { data: itemsData } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('character_id', characterId)
      .order('created_at', { ascending: false });

    if (!itemsData || itemsData.length === 0) return [];

    const itemIds = itemsData.map(i => i.id);

    const [objectivesResult, informationResult] = await Promise.all([
      supabase
        .from('item_objectives')
        .select('*')
        .in('inventory_item_id', itemIds)
        .order('created_at'),
      supabase
        .from('item_information')
        .select('*')
        .in('inventory_item_id', itemIds)
        .order('created_at'),
    ]);

    const objectivesMap = new Map<string, ItemObjective[]>();
    objectivesResult.data?.forEach(obj => {
      if (!objectivesMap.has(obj.inventory_item_id)) {
        objectivesMap.set(obj.inventory_item_id, []);
      }
      objectivesMap.get(obj.inventory_item_id)!.push(obj);
    });

    const informationMap = new Map<string, ItemInformation[]>();
    informationResult.data?.forEach(info => {
      if (!informationMap.has(info.inventory_item_id)) {
        informationMap.set(info.inventory_item_id, []);
      }
      informationMap.get(info.inventory_item_id)!.push(info);
    });

    return itemsData.map(item => ({
      ...item,
      objectives: objectivesMap.get(item.id) || [],
      information: informationMap.get(item.id) || [],
    }));
  },

  async createItem(
    characterId: string,
    data: { name: string; description?: string; category?: string }
  ): Promise<InventoryItem | null> {
    const { data: item } = await supabase
      .from('inventory_items')
      .insert({ character_id: characterId, ...data })
      .select()
      .maybeSingle();
    return item;
  },

  async updateItem(id: string, updates: Partial<InventoryItem>): Promise<void> {
    await supabase
      .from('inventory_items')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
  },

  async deleteItem(id: string): Promise<void> {
    await supabase.from('inventory_items').delete().eq('id', id);
  },

  async addObjective(
    itemId: string,
    objective: string,
    frequency?: string
  ): Promise<ItemObjective | null> {
    const { data } = await supabase
      .from('item_objectives')
      .insert({
        inventory_item_id: itemId,
        objective,
        frequency: frequency || null,
      })
      .select()
      .maybeSingle();
    return data;
  },

  async toggleObjective(id: string, isCompleted: boolean): Promise<void> {
    await supabase
      .from('item_objectives')
      .update({ is_completed: !isCompleted })
      .eq('id', id);
  },

  async deleteObjective(id: string): Promise<void> {
    await supabase.from('item_objectives').delete().eq('id', id);
  },

  async addInformation(itemId: string, information: string): Promise<ItemInformation | null> {
    const { data } = await supabase
      .from('item_information')
      .insert({
        inventory_item_id: itemId,
        information,
      })
      .select()
      .maybeSingle();
    return data;
  },

  async deleteInformation(id: string): Promise<void> {
    await supabase.from('item_information').delete().eq('id', id);
  },

  async reorderItem(id: string, newDisplayOrder: number): Promise<void> {
    await supabase
      .from('inventory_items')
      .update({ display_order: newDisplayOrder, updated_at: new Date().toISOString() })
      .eq('id', id);
  },
};

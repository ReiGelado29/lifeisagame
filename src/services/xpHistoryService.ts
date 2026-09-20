import { supabase } from '../lib/supabase';
import type { XpHistory } from '../types';

export const xpHistoryService = {
  async getHistory(characterId: string, limit: number = 50): Promise<XpHistory[]> {
    const { data } = await supabase
      .from('xp_history')
      .select('*')
      .eq('character_id', characterId)
      .order('created_at', { ascending: false })
      .limit(limit);

    return data || [];
  },

  async addXpWithReason(characterId: string, amount: number, reason: string): Promise<XpHistory | null> {
    const { data: charData } = await supabase
      .from('characters')
      .select('xp')
      .eq('id', characterId)
      .maybeSingle();

    if (!charData) return null;

    const newBalance = charData.xp + amount;

    const { data: newChar } = await supabase
      .from('characters')
      .update({ xp: newBalance })
      .eq('id', characterId)
      .select()
      .maybeSingle();

    if (!newChar) return null;

    const { data: history } = await supabase
      .from('xp_history')
      .insert({
        character_id: characterId,
        amount,
        reason,
        balance_after: newBalance,
      })
      .select()
      .maybeSingle();

    return history;
  },

  async deleteXpHistoryEntry(characterId: string, entryId: string): Promise<void> {
  const { data: entry } = await supabase
    .from('xp_history')
    .select('amount')
    .eq('id', entryId)
    .eq('character_id', characterId)
    .maybeSingle();

  if (!entry) return;

  const { data: charData } = await supabase
    .from('characters')
    .select('xp')
    .eq('id', characterId)
    .maybeSingle();

  if (!charData) return;

  await supabase
    .from('characters')
    .update({ xp: charData.xp - entry.amount })
    .eq('id', characterId);

  await supabase
    .from('xp_history')
    .delete()
    .eq('id', entryId)
    .eq('character_id', characterId);
},
  
  async getTotalXp(characterId: string): Promise<number> {
    const { data: charData } = await supabase
      .from('characters')
      .select('xp')
      .eq('id', characterId)
      .maybeSingle();

    return charData?.xp || 0;
  },
};

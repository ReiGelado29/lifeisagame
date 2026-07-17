import { supabase } from '../lib/supabase';
import type { Behavior, DailyLog, DailyActivity, DailyActivityWithBehavior } from '../types';
import { getTodayDateString } from '../utils';
import { DEFAULT_MENTAL_STATE, clamp } from '../engine';

export const progressService = {
  async getBehaviors(): Promise<Behavior[]> {
    const { data } = await supabase
      .from('behaviors')
      .select('*')
      .order('name');
    return data || [];
  },

  async createBehavior(behavior: Omit<Behavior, 'id' | 'created_at'>): Promise<Behavior | null> {
    const { data } = await supabase
      .from('behaviors')
      .insert(behavior)
      .select()
      .maybeSingle();
    return data;
  },

  async updateBehavior(id: string, updates: Partial<Behavior>): Promise<void> {
    await supabase.from('behaviors').update(updates).eq('id', id);
  },

  async deleteBehavior(id: string): Promise<void> {
    await supabase.from('behaviors').delete().eq('id', id);
  },

  async getTodayLog(characterId: string): Promise<DailyLog | null> {
    const today = getTodayDateString();

    let { data: logData } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('character_id', characterId)
      .eq('log_date', today)
      .maybeSingle();

    if (!logData) {
      const { data: newLog } = await supabase
        .from('daily_logs')
        .insert({
          character_id: characterId,
          log_date: today,
        })
        .select()
        .maybeSingle();
      logData = newLog;
    }

    return logData;
  },

  async updateDailyLog(id: string, updates: Partial<DailyLog>): Promise<void> {
    await supabase
      .from('daily_logs')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
  },

  async getDailyActivities(logId: string): Promise<DailyActivityWithBehavior[]> {
    const { data } = await supabase
      .from('daily_activities')
      .select(`
        *,
        behaviors!daily_activities_behavior_id_fkey (*)
      `)
      .eq('daily_log_id', logId)
      .order('performed_at', { ascending: false });

    return (data || []).map(activity => ({
      ...activity,
      behavior: activity.behaviors as Behavior,
    }));
  },

  async addActivity(
    logId: string,
    behaviorId: string,
    durationMinutes: number = 0
  ): Promise<DailyActivity | null> {
    const { data } = await supabase
      .from('daily_activities')
      .insert({
        daily_log_id: logId,
        behavior_id: behaviorId,
        duration_minutes: durationMinutes,
      })
      .select()
      .maybeSingle();

    return data;
  },

  async deleteActivity(id: string): Promise<void> {
    await supabase.from('daily_activities').delete().eq('id', id);
  },

  async applyBehaviorToLog(
    log: DailyLog,
    behavior: Behavior
  ): Promise<DailyLog> {
    const newValues = {
      mental_energy: clamp(log.mental_energy + behavior.mental_energy),
      stable_dopamine: clamp(log.stable_dopamine + behavior.stable_dopamine),
      focus: clamp(log.focus + behavior.focus),
      stress: clamp(log.stress + behavior.stress),
      emotional_stability: clamp(log.emotional_stability + behavior.emotional_stability),
      fatigue: clamp(log.fatigue + behavior.fatigue),
      cognitive_overload: clamp(log.cognitive_overload + behavior.cognitive_overload),
    };

    await this.updateDailyLog(log.id, newValues);

    return { ...log, ...newValues };
  },
};

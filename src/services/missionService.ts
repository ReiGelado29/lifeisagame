import { supabase } from '../lib/supabase';
import type { Mission, MissionStep, MissionStepWithChildren, MissionWithSteps } from '../types';

async function loadMissionStepAttributes(
  stepIds: string[]
): Promise<Map<string, { attribute_id: string; xp_amount: number; attribute_name: string }[]>> {
  if (stepIds.length === 0) return new Map();

  const { data } = await supabase
    .from('mission_step_attributes')
    .select(`
      mission_step_id,
      attribute_id,
      xp_amount,
      attributes!mission_step_attributes_attribute_id_fkey (name)
    `)
    .in('mission_step_id', stepIds);

  const map = new Map<string, { attribute_id: string; xp_amount: number; attribute_name: string }[]>();
  data?.forEach(reward => {
    const stepId = reward.mission_step_id;
    if (!map.has(stepId)) {
      map.set(stepId, []);
    }
    map.get(stepId)!.push({
      attribute_id: reward.attribute_id,
      xp_amount: reward.xp_amount,
      attribute_name: (reward.attributes as { name: string }).name,
    });
  });

  return map;
}

function buildStepTree(
  steps: MissionStep[],
  parentId: string | null,
  attrRewards: Map<string, { attribute_id: string; xp_amount: number; attribute_name: string }[]>
): MissionStepWithChildren[] {
  return steps
    .filter(s => s.parent_step_id === parentId)
    .map(step => ({
      ...step,
      children: buildStepTree(steps, step.id, attrRewards),
      attribute_rewards: attrRewards.get(step.id) || [],
    }));
}

export const missionService = {
  async getMissions(characterId: string): Promise<MissionWithSteps[]> {
    const { data: missionsData } = await supabase
      .from('missions')
      .select('*')
      .eq('character_id', characterId)
.order('display_order', { ascending: true })
.order('created_at', { ascending: true });

    if (!missionsData || missionsData.length === 0) return [];

    const missionIds = missionsData.map(m => m.id);
    const { data: allSteps } = await supabase
      .from('mission_steps')
      .select('*')
      .in('mission_id', missionIds)
      .order('display_order');

    const stepIds = allSteps?.map(s => s.id) || [];
    const attrRewards = await loadMissionStepAttributes(stepIds);

    const missions: MissionWithSteps[] = [];

    for (const mission of missionsData) {
      const missionSteps = allSteps?.filter(s => s.mission_id === mission.id) || [];
      const steps = buildStepTree(missionSteps, null, attrRewards);

      missions.push({ ...mission, steps });
    }

    return missions;
  },

  async createMission(
    characterId: string,
    data: {
      title: string;
      description?: string;
      xp_reward: number;
      deadline?: string;
      urgency: string;
    }
  ): Promise<Mission | null> {
    const { data: mission } = await supabase
      .from('missions')
      .insert({
        character_id: characterId,
        ...data,
      })
      .select()
      .maybeSingle();
    return mission;
  },

  async updateMission(id: string, updates: Partial<Mission>): Promise<void> {
    await supabase
      .from('missions')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
  },

  async deleteMission(id: string): Promise<void> {
    await supabase.from('missions').delete().eq('id', id);
  },

  async createStep(
    missionId: string,
    parentStepId: string | null,
    level: number,
    data: { title: string; description?: string; xp_reward: number }
  ): Promise<MissionStep | null> {
    const { data: siblingCount } = await supabase
      .from('mission_steps')
      .select('display_order')
      .eq('mission_id', missionId)
      .eq('parent_step_id', parentStepId)
      .order('display_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = (siblingCount?.display_order || 0) + 1;

    const { data: step } = await supabase
      .from('mission_steps')
      .insert({
        mission_id: missionId,
        parent_step_id: parentStepId,
        level,
        display_order: nextOrder,
        ...data,
      })
      .select()
      .maybeSingle();

    return step;
  },

  async toggleStepComplete(step: MissionStep): Promise<void> {
    const newCompleteState = !step.is_completed;

    await supabase
      .from('mission_steps')
      .update({ is_completed: newCompleteState, updated_at: new Date().toISOString() })
      .eq('id', step.id);

if (step.xp_reward > 0) {
  const { data: mission } = await supabase
    .from('missions')
    .select('character_id')
    .eq('id', step.mission_id)
    .maybeSingle();

  if (mission) {
    const { data: charData } = await supabase
      .from('characters')
      .select('xp')
      .eq('id', mission.character_id)
      .maybeSingle();

    if (charData) {
      const xpChange = newCompleteState
        ? step.xp_reward
        : -step.xp_reward;

      await supabase
        .from('characters')
        .update({ xp: charData.xp + xpChange })
        .eq('id', mission.character_id);
    }
  }
}
  },

  async deleteStep(id: string): Promise<void> {
    await supabase.from('mission_steps').delete().eq('id', id);
  },

  async updateStep(id: string, updates: Partial<MissionStep>): Promise<void> {
    await supabase
      .from('mission_steps')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
  },

async reorderMission(id: string, targetId: string): Promise<void> {
  const { data: dragged, error: draggedError } = await supabase
    .from('missions')
    .select('id, character_id')
    .eq('id', id)
    .single();

  if (draggedError) throw draggedError;

  const { data: target, error: targetError } = await supabase
    .from('missions')
    .select('id, character_id')
    .eq('id', targetId)
    .single();

  if (targetError) throw targetError;
  if (dragged.character_id !== target.character_id) return;

  const { data: siblings, error: siblingsError } = await supabase
    .from('missions')
    .select('id, display_order')
    .eq('character_id', dragged.character_id)
.order('display_order', { ascending: true })
.order('created_at', { ascending: true });

  if (siblingsError) throw siblingsError;
  if (!siblings) return;

  const reordered = siblings.filter(item => item.id !== id);
  const targetIndex = reordered.findIndex(item => item.id === targetId);

  if (targetIndex === -1) return;

  reordered.splice(targetIndex, 0, {
    id,
    display_order: 0,
  });

  for (let i = 0; i < reordered.length; i++) {
    const { error } = await supabase
      .from('missions')
      .update({
        display_order: i + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reordered[i].id);

    if (error) throw error;
  }
},

async reorderStep(id: string, targetId: string): Promise<void> {
  const { data: dragged, error: draggedError } = await supabase
    .from('mission_steps')
    .select('id, mission_id, parent_step_id')
    .eq('id', id)
    .single();

  if (draggedError) throw draggedError;

  const { data: target, error: targetError } = await supabase
    .from('mission_steps')
    .select('id, mission_id, parent_step_id')
    .eq('id', targetId)
    .single();

  if (targetError) throw targetError;

  if (
    dragged.mission_id !== target.mission_id ||
    dragged.parent_step_id !== target.parent_step_id
  ) {
    return;
  }

  let query = supabase
    .from('mission_steps')
    .select('id, display_order')
    .eq('mission_id', dragged.mission_id);

  query = dragged.parent_step_id === null
    ? query.is('parent_step_id', null)
    : query.eq('parent_step_id', dragged.parent_step_id);

  const { data: siblings, error: siblingsError } = await query
    .order('display_order', { ascending: true });

  if (siblingsError) throw siblingsError;
  if (!siblings) return;

  const reordered = siblings.filter(item => item.id !== id);
  const targetIndex = reordered.findIndex(item => item.id === targetId);

  if (targetIndex === -1) return;

  reordered.splice(targetIndex, 0, {
    id,
    display_order: 0,
  });

  for (let i = 0; i < reordered.length; i++) {
    const { error } = await supabase
      .from('mission_steps')
      .update({
        display_order: i + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reordered[i].id);

    if (error) throw error;
  }
},
};

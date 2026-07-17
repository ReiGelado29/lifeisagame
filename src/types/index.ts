export interface Character {
  id: string;
  user_id: string;
  name: string;
  weight: number;
  class: string;
  xp: number;
  created_at: string;
  updated_at: string;
}

export interface AttributeCategory {
  id: string;
  name: string;
  display_order: number;
  created_at: string;
}

export interface Attribute {
  id: string;
  category_id: string;
  name: string;
  parent_id: string | null;
  display_order: number;
  created_at: string;
}

export interface CharacterAttribute {
  id: string;
  character_id: string;
  attribute_id: string;
  value: number;
  created_at: string;
  updated_at: string;
}

export interface Behavior {
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
}

export interface MentalState {
  mental_energy: number;
  stable_dopamine: number;
  focus: number;
  stress: number;
  emotional_stability: number;
  fatigue: number;
  cognitive_overload: number;
}

export interface DailyLog {
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
}

export interface DailyActivity {
  id: string;
  daily_log_id: string;
  behavior_id: string;
  duration_minutes: number;
  notes: string | null;
  performed_at: string;
  created_at: string;
}

export interface Mission {
  id: string;
  character_id: string;
  title: string;
  description: string | null;
  xp_reward: number;
  deadline: string | null;
  urgency: MissionUrgency;
  status: MissionStatus;
  created_at: string;
  updated_at: string;
}

export type MissionUrgency = 'low' | 'medium' | 'high' | 'critical';
export type MissionStatus = 'active' | 'completed' | 'failed' | 'paused';

export interface MissionStep {
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
}

export interface MissionStepAttribute {
  id: string;
  mission_step_id: string;
  attribute_id: string;
  xp_amount: number;
}

export interface InventoryItem {
  id: string;
  character_id: string;
  name: string;
  description: string | null;
  category: string | null;
  created_at: string;
  updated_at: string;
}

export interface ItemObjective {
  id: string;
  inventory_item_id: string;
  objective: string;
  is_completed: boolean;
  frequency: string | null;
  created_at: string;
}

export interface ItemInformation {
  id: string;
  inventory_item_id: string;
  information: string;
  created_at: string;
}

export interface Note {
  id: string;
  character_id: string;
  title: string | null;
  content: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttributeWithChildren extends Attribute {
  children: AttributeWithChildren[];
  value: number;
}

export interface CategoryWithAttributes extends AttributeCategory {
  attributes: AttributeWithChildren[];
}

export interface MissionStepWithChildren extends MissionStep {
  children: MissionStepWithChildren[];
  attribute_rewards?: { attribute_id: string; xp_amount: number; attribute_name: string }[];
}

export interface MissionWithSteps extends Mission {
  steps: MissionStepWithChildren[];
}

export interface InventoryItemWithDetails extends InventoryItem {
  objectives: ItemObjective[];
  information: ItemInformation[];
}

export interface DailyActivityWithBehavior extends DailyActivity {
  behavior: Behavior;
}

export interface XpHistory {
  id: string;
  character_id: string;
  amount: number;
  reason: string;
  balance_after: number;
  created_at: string;
}

import type { MentalState } from '../types';
import type { MissionUrgency } from '../types';

export const MAX_TREE_DEPTH = 3;

export const DEFAULT_MENTAL_STATE: MentalState = {
  mental_energy: 50,
  stable_dopamine: 50,
  focus: 50,
  stress: 30,
  emotional_stability: 50,
  fatigue: 30,
  cognitive_overload: 30,
};

export const STAT_MIN = 0;
export const STAT_MAX = 100;

export const DIAGNOSTIC_THRESHOLDS = {
  IDEAL: 30,
  WARNING: 60,
  HIGH_RISK: 80,
  CRITICAL: 100,
} as const;

export const URGENCY_CONFIG: Record<MissionUrgency, { label: string; color: string; bg: string; border: string }> = {
  low: { label: 'Baixa', color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/50' },
  medium: { label: 'Média', color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/50' },
  high: { label: 'Alta', color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/50' },
  critical: { label: 'Crítica', color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/50' },
};

export const XP_PER_LEVEL = 100;

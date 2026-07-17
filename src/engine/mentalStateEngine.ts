import type { MentalState, Behavior, DailyActivityWithBehavior } from '../types';
import { DEFAULT_MENTAL_STATE, STAT_MIN, STAT_MAX } from '../constants';

export function clamp(value: number, min: number = STAT_MIN, max: number = STAT_MAX): number {
  return Math.max(min, Math.min(max, value));
}

export function calculateMentalStateFromBehavior(
  currentState: MentalState,
  behavior: Behavior
): MentalState {
  return {
    mental_energy: clamp(currentState.mental_energy + behavior.mental_energy),
    stable_dopamine: clamp(currentState.stable_dopamine + behavior.stable_dopamine),
    focus: clamp(currentState.focus + behavior.focus),
    stress: clamp(currentState.stress + behavior.stress),
    emotional_stability: clamp(currentState.emotional_stability + behavior.emotional_stability),
    fatigue: clamp(currentState.fatigue + behavior.fatigue),
    cognitive_overload: clamp(currentState.cognitive_overload + behavior.cognitive_overload),
  };
}

export function calculateMentalStateFromActivities(
  activities: DailyActivityWithBehavior[]
): MentalState {
  return activities.reduce((state, activity) => {
    return calculateMentalStateFromBehavior(state, activity.behavior);
  }, DEFAULT_MENTAL_STATE);
}

export function calculateTotalXpFromBehaviors(activities: DailyActivityWithBehavior[]): number {
  return activities.reduce((total, activity) => total + activity.behavior.xp_reward, 0);
}

export type StatType = 'positive' | 'negative';

export function getDiagnosticLabel(value: number, type: StatType): string {
  const threshold = type === 'negative' ? value : 100 - value;

  if (threshold < 30) return 'Estado ideal';
  if (threshold < 60) return 'Eficiência começando a cair';
  if (threshold < 80) return 'Alto risco de distração/erro';
  return 'Pausa obrigatória recomendada';
}

export function getDiagnosticColor(value: number, type: StatType): string {
  const threshold = type === 'negative' ? value : 100 - value;

  if (threshold < 30) return 'text-emerald-400';
  if (threshold < 60) return 'text-yellow-400';
  if (threshold < 80) return 'text-orange-400';
  return 'text-red-400';
}

export function getDiagnosticBg(value: number, type: StatType): string {
  const threshold = type === 'negative' ? value : 100 - value;

  if (threshold < 30) return 'bg-emerald-500/20 border-emerald-500/50';
  if (threshold < 60) return 'bg-yellow-500/20 border-yellow-500/50';
  if (threshold < 80) return 'bg-orange-500/20 border-orange-500/50';
  return 'bg-red-500/20 border-red-500/50';
}

export function calculateLevel(xp: number, xpPerLevel: number = 100): number {
  return Math.floor(xp / xpPerLevel) + 1;
}

export function xpToNextLevel(xp: number, xpPerLevel: number = 100): { current: number; needed: number; progress: number } {
  const currentLevel = calculateLevel(xp, xpPerLevel);
  const xpForCurrentLevel = (currentLevel - 1) * xpPerLevel;
  const xpForNextLevel = currentLevel * xpPerLevel;
  const current = xp - xpForCurrentLevel;
  const needed = xpPerLevel;
  const progress = (current / needed) * 100;

  return { current, needed, progress };
}

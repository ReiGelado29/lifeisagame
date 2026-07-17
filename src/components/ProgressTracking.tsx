import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Clock, Droplets, Coffee, Moon, Activity, AlertCircle, Edit2, Save, X } from 'lucide-react';
import type { Behavior, DailyLog, DailyActivityWithBehavior } from '../types';
import { progressService, characterService } from '../services';
import { getDiagnosticLabel, getDiagnosticColor, getDiagnosticBg, type StatType } from '../engine';

interface ProgressTrackingProps {
  characterId: string;
  onBack: () => void;
}

interface BehaviorFormData {
  name: string;
  mental_energy: number;
  stable_dopamine: number;
  focus: number;
  stress: number;
  emotional_stability: number;
  fatigue: number;
  cognitive_overload: number;
  sleep_influence: number;
  xp_reward: number;
  default_duration_minutes: number;
  description: string;
}

const defaultBehaviorForm: BehaviorFormData = {
  name: '',
  mental_energy: 0,
  stable_dopamine: 0,
  focus: 0,
  stress: 0,
  emotional_stability: 0,
  fatigue: 0,
  cognitive_overload: 0,
  sleep_influence: 0,
  xp_reward: 0,
  default_duration_minutes: 30,
  description: '',
};

export function ProgressTracking({ characterId, onBack }: ProgressTrackingProps) {
  const [behaviors, setBehaviors] = useState<Behavior[]>([]);
  const [todayLog, setTodayLog] = useState<DailyLog | null>(null);
  const [todayActivities, setTodayActivities] = useState<DailyActivityWithBehavior[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBehaviorModal, setShowBehaviorModal] = useState<{ isOpen: boolean; behavior: Behavior | null }>({ isOpen: false, behavior: null });
  const [behaviorForm, setBehaviorForm] = useState<BehaviorFormData>(defaultBehaviorForm);
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [editingBehavior, setEditingBehavior] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [characterId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [behaviorsData, logData] = await Promise.all([
        progressService.getBehaviors(),
        progressService.getTodayLog(characterId),
      ]);

      setBehaviors(behaviorsData);

      if (logData) {
        setTodayLog(logData);
        const activitiesData = await progressService.getDailyActivities(logData.id);
        setTodayActivities(activitiesData);
      }
    } catch (error) {
      console.error('Error loading progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addActivity = async (behaviorId: string, duration: number) => {
    if (!todayLog) return;

    const behavior = behaviors.find(b => b.id === behaviorId);
    if (!behavior) return;

    await progressService.addActivity(todayLog.id, behaviorId, duration);
    const updatedLog = await progressService.applyBehaviorToLog(todayLog, behavior);

    if (behavior.xp_reward > 0) {
      await characterService.addXp(characterId, behavior.xp_reward);
    }

    setTodayLog(updatedLog);
    const activitiesData = await progressService.getDailyActivities(updatedLog.id);
    setTodayActivities(activitiesData);
    setShowAddActivity(false);
  };

  const deleteActivity = async (activityId: string) => {
    await progressService.deleteActivity(activityId);
    await loadData();
  };

  const saveBehavior = async () => {
    if (!behaviorForm.name.trim()) return;

    const behaviorData = {
      ...behaviorForm,
      description: behaviorForm.description || null,
    };

    if (showBehaviorModal.behavior) {
      await progressService.updateBehavior(showBehaviorModal.behavior.id, behaviorData);
    } else {
      await progressService.createBehavior(behaviorData);
    }

    setShowBehaviorModal({ isOpen: false, behavior: null });
    setBehaviorForm(defaultBehaviorForm);
    setEditingBehavior(null);
    await loadData();
  };

  const deleteBehavior = async (behaviorId: string) => {
    await progressService.deleteBehavior(behaviorId);
    await loadData();
  };

  const renderStatBar = (label: string, value: number, type: StatType, icon: React.ReactNode) => {
    return (
      <div className={`p-4 rounded-xl border ${getDiagnosticBg(value, type)}`}>
        <div className="flex items-center gap-2 mb-2">
          {icon}
          <span className="text-sm text-slate-300">{label}</span>
          <span className={`ml-auto font-bold ${getDiagnosticColor(value, type)}`}>{value}</span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${type === 'negative' ? 'bg-red-500' : 'bg-emerald-500'}`}
            style={{ width: `${value}%` }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-2">{getDiagnosticLabel(value, type)}</p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar</span>
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Contagem de Progresso</h1>
          <p className="text-slate-400">Acompanhe seu dia e otimize seu funcionamento mental</p>
        </div>

        {todayLog && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
            {renderStatBar('Energia Mental', todayLog.mental_energy, 'positive', <Activity className="w-4 h-4" />)}
            {renderStatBar('Dopamina Estável', todayLog.stable_dopamine, 'positive', <Droplets className="w-4 h-4" />)}
            {renderStatBar('Foco', todayLog.focus, 'positive', <AlertCircle className="w-4 h-4" />)}
            {renderStatBar('Estresse', todayLog.stress, 'negative', <Activity className="w-4 h-4" />)}
            {renderStatBar('Estabilidade Emocional', todayLog.emotional_stability, 'positive', <Activity className="w-4 h-4" />)}
            {renderStatBar('Fadiga', todayLog.fatigue, 'negative', <Moon className="w-4 h-4" />)}
            {renderStatBar('Sobrecarga Cognitiva', todayLog.cognitive_overload, 'negative', <Coffee className="w-4 h-4" />)}
            {renderStatBar('Sono (horas)', todayLog.sleep_hours, 'positive', <Moon className="w-4 h-4" />)}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Atividades de Hoje</h2>
              <button
                onClick={() => setShowAddActivity(true)}
                className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-lg text-emerald-400 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {todayActivities.length === 0 ? (
                <p className="text-slate-400 text-center py-8">Nenhuma atividade registrada hoje</p>
              ) : (
                todayActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="text-white font-medium">{activity.behavior.name}</p>
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span>{activity.duration_minutes} min</span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteActivity(activity.id)}
                      className="text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Comportamentos</h2>
              <button
                onClick={() => {
                  setBehaviorForm(defaultBehaviorForm);
                  setShowBehaviorModal({ isOpen: true, behavior: null });
                }}
                className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-blue-400 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {behaviors.map((behavior) => (
                <div key={behavior.id} className="group">
                  {editingBehavior === behavior.id ? (
                    <div className="p-3 bg-slate-700/50 rounded-lg border border-blue-500/50 space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={behavior.name}
                          placeholder="Nome"
                          className="flex-1 px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                          readOnly
                        />
                        <span className="text-xs text-slate-400 px-2 py-1">XP: {behavior.xp_reward}</span>
                        <span className="text-xs text-slate-400 px-2 py-1">⏱: {(behavior as any).default_duration_minutes || 30}min</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{behavior.name}</p>
                        <p className="text-xs text-slate-400">XP: {behavior.xp_reward} • ⏱: {(behavior as any).default_duration_minutes || 30}min</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setBehaviorForm({
                              name: behavior.name,
                              mental_energy: behavior.mental_energy,
                              stable_dopamine: behavior.stable_dopamine,
                              focus: behavior.focus,
                              stress: behavior.stress,
                              emotional_stability: behavior.emotional_stability,
                              fatigue: behavior.fatigue,
                              cognitive_overload: behavior.cognitive_overload,
                              sleep_influence: (behavior as any).sleep_influence || 0,
                              xp_reward: behavior.xp_reward,
                              default_duration_minutes: (behavior as any).default_duration_minutes || 30,
                              description: behavior.description || '',
                            });
                            setShowBehaviorModal({ isOpen: true, behavior });
                          }}
                          className="text-slate-400 hover:text-white transition-colors text-sm"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteBehavior(behavior.id)}
                          className="text-slate-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showAddActivity && (
        <AddActivityModal
          behaviors={behaviors}
          onAdd={addActivity}
          onClose={() => setShowAddActivity(false)}
        />
      )}

      {showBehaviorModal.isOpen && (
        <BehaviorEditorModal
          behavior={showBehaviorModal.behavior}
          formData={behaviorForm}
          onChange={setBehaviorForm}
          onSave={saveBehavior}
          onClose={() => {
            setShowBehaviorModal({ isOpen: false, behavior: null });
            setBehaviorForm(defaultBehaviorForm);
          }}
        />
      )}
    </div>
  );
}

function AddActivityModal({
  behaviors,
  onAdd,
  onClose,
}: {
  behaviors: Behavior[];
  onAdd: (behaviorId: string, duration: number) => void;
  onClose: () => void;
}) {
  const [selectedBehavior, setSelectedBehavior] = useState('');
  const [duration, setDuration] = useState(30);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBehaviors = behaviors.filter(b =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedBehaviorData = behaviors.find(b => b.id === selectedBehavior);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-white mb-4">Adicionar Atividade</h3>

        <input
          type="text"
          placeholder="Buscar comportamento..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white mb-4 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />

        <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
          {filteredBehaviors.map((behavior) => (
            <button
              key={behavior.id}
              onClick={() => {
                setSelectedBehavior(behavior.id);
                setDuration((behavior as any).default_duration_minutes || 30);
              }}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                selectedBehavior === behavior.id
                  ? 'bg-emerald-500/30 border-emerald-500 border'
                  : 'bg-slate-700/50 hover:bg-slate-700'
              }`}
            >
              <p className="text-white font-medium">{behavior.name}</p>
              <p className="text-xs text-slate-400">{behavior.description || 'Sem descrição'}</p>
              <p className="text-xs text-slate-500 mt-1">Duração padrão: {(behavior as any).default_duration_minutes || 30}min</p>
            </button>
          ))}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-300 mb-2">Duração (minutos)</label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            min="0"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg text-white font-semibold transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => selectedBehavior && onAdd(selectedBehavior, duration)}
            disabled={!selectedBehavior}
            className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white font-semibold transition-colors disabled:opacity-50"
          >
            Adicionar
          </button>
        </div>
      </div>
    </div>
  );
}

function BehaviorEditorModal({
  behavior,
  formData,
  onChange,
  onSave,
  onClose,
}: {
  behavior: Behavior | null;
  formData: BehaviorFormData;
  onChange: (data: BehaviorFormData) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  const statFields: { key: keyof BehaviorFormData; label: string; type: 'positive' | 'negative' }[] = [
    { key: 'mental_energy', label: 'Energia Mental', type: 'positive' },
    { key: 'stable_dopamine', label: 'Dopamina Estável', type: 'positive' },
    { key: 'focus', label: 'Foco', type: 'positive' },
    { key: 'stress', label: 'Estresse', type: 'negative' },
    { key: 'emotional_stability', label: 'Estabilidade Emocional', type: 'positive' },
    { key: 'fatigue', label: 'Fadiga', type: 'negative' },
    { key: 'cognitive_overload', label: 'Sobrecarga Cognitiva', type: 'negative' },
    { key: 'sleep_influence', label: 'Influência no Sono', type: 'positive' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-white mb-4">
          {behavior ? 'Editar Comportamento' : 'Novo Comportamento'}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Nome</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => onChange({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {statFields.map(({ key, label }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-slate-300 mb-2">{label}</label>
                <input
                  type="number"
                  value={formData[key] as number}
                  onChange={(e) => onChange({ ...formData, [key]: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">XP Recompensa</label>
              <input
                type="number"
                value={formData.xp_reward}
                onChange={(e) => onChange({ ...formData, xp_reward: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Duração Padrão (min)</label>
              <input
                type="number"
                value={formData.default_duration_minutes}
                onChange={(e) => onChange({ ...formData, default_duration_minutes: parseInt(e.target.value) || 30 })}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Descrição</label>
            <textarea
              value={formData.description}
              onChange={(e) => onChange({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg text-white font-semibold transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={!formData.name.trim()}
            className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white font-semibold transition-colors disabled:opacity-50"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import type { TouchEvent } from 'react';
import { ArrowLeft, Plus, ChevronDown, ChevronRight, Trash2, Edit2, Check, Calendar, Flag, X, GripVertical } from 'lucide-react';
import type { Mission, MissionStep, MissionWithSteps, MissionStepWithChildren, MissionUrgency } from '../types';
import { missionService } from '../services';
import { URGENCY_CONFIG, MAX_TREE_DEPTH } from '../constants';
import { formatDate } from '../utils';

interface MissionsSectionProps {
  characterId: string;
  onBack: () => void;
}

interface EditingStep {
  stepId: string;
  title: string;
  description: string;
  xpReward: number;
}

interface EditingMission {
  id: string;
  title: string;
  description: string;
  xpReward: string;
  deadline: string;
  urgency: MissionUrgency;
}

export function MissionsSection({ characterId, onBack }: MissionsSectionProps) {
  const [missions, setMissions] = useState<MissionWithSteps[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMissions, setExpandedMissions] = useState<Record<string, boolean>>({});
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});
  const [editingMission, setEditingMission] = useState<EditingMission | null>(null);
  const [editingStep, setEditingStep] = useState<EditingStep | null>(null);
  const [showMissionModal, setShowMissionModal] = useState(false);
  const [showStepModal, setShowStepModal] = useState<{ missionId: string; parentStepId: string | null; level: number } | null>(null);
  const [draggedMissionId, setDraggedMissionId] = useState<string | null>(null);
  const [draggedStepId, setDraggedStepId] = useState<string | null>(null);
  const [dropTargetMissionId, setDropTargetMissionId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | null>(null);
  const [dropTargetStepId, setDropTargetStepId] = useState<string | null>(null);
  const [stepDropPosition, setStepDropPosition] = useState<'before' | 'after' | null>(null);
  
  const dropTargetRef = useRef<{
  missionId: string;
  position: 'before' | 'after';
} | null>(null);

const touchDragRef = useRef<{
  missionId: string;
  startY: number;
  currentY: number;
} | null>(null);

  const stepTouchDragRef = useRef<{
  stepId: string;
  missionId: string;
  parentStepId: string | null;
  startY: number;
  currentY: number;
} | null>(null);

const stepDropTargetRef = useRef<{
  stepId: string;
  position: 'before' | 'after';
} | null>(null);

const stepTouchDragStartedRef = useRef(false);

const autoScrollRef = useRef<number | null>(null);
const touchDragStartedRef = useRef(false);
const missionCardRefs = useRef<Record<string, HTMLDivElement | null>>({});
const stepCardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    loadMissions();
  }, [characterId]);

  const loadMissions = async () => {
    setLoading(true);
    try {
      const missionsData = await missionService.getMissions(characterId);
      setMissions(missionsData);
    } catch (error) {
      console.error('Error loading missions:', error);
    } finally {
      setLoading(false);
    }
  };

  const createMission = async (data: {
    title: string;
    description: string;
    xp_reward: number;
    deadline: string | null;
    urgency: MissionUrgency;
  }) => {
    await missionService.createMission(characterId, data);
    await loadMissions();
  };

  const updateMission = async (id: string, data: Partial<Mission>) => {
    await missionService.updateMission(id, data);
    await loadMissions();
  };

  const deleteMission = async (id: string) => {
    await missionService.deleteMission(id);
    await loadMissions();
  };

  const createStep = async (
    missionId: string,
    parentStepId: string | null,
    level: number,
    data: { title: string; description: string; xp_reward: number }
  ) => {
    await missionService.createStep(missionId, parentStepId, level, data);
    await loadMissions();
  };

  const updateStep = async (stepId: string, data: Partial<MissionStep>) => {
    await missionService.updateStep(stepId, data);
    await loadMissions();
  };

  const toggleStepComplete = async (step: MissionStep) => {
    await missionService.toggleStepComplete(step);
    await loadMissions();
  };

  const deleteStep = async (id: string) => {
    await missionService.deleteStep(id);
    await loadMissions();
  };


const reorderMission = async (
  missionId: string,
  targetMissionId: string,
  position: 'before' | 'after' = 'before'
) => {
  if (missionId === targetMissionId || draggedMissionId === null) {
    finishMissionDrag();
    return;
  }

  const previousMissions = [...missions];
  const reordered = [...missions];

  const fromIndex = reordered.findIndex(m => m.id === missionId);
  const toIndex = reordered.findIndex(m => m.id === targetMissionId);

  if (fromIndex === -1 || toIndex === -1) {
    finishMissionDrag();
    return;
  }

  const [movedMission] = reordered.splice(fromIndex, 1);
  const adjustedTargetIndex = reordered.findIndex(
    mission => mission.id === targetMissionId
  );

  if (adjustedTargetIndex === -1) {
    finishMissionDrag();
    return;
  }

  const insertIndex =
    position === 'after'
      ? adjustedTargetIndex + 1
      : adjustedTargetIndex;

  reordered.splice(insertIndex, 0, movedMission);

  const optimisticMissions = reordered.map((mission, index) => ({
    ...mission,
    display_order: index + 1,
  }));

  setMissions(optimisticMissions);
  finishMissionDrag();

  try {
await missionService.reorderMission(
  missionId,
  targetMissionId,
  position
);
    await loadMissions();
  } catch (error) {
    console.error('Error reordering missions:', error);
    setMissions(previousMissions);
    alert('Não foi possível salvar a nova ordem das missões. Tente novamente.');
  }
};
  
const finishMissionDrag = () => {
  touchDragRef.current = null;
  dropTargetRef.current = null;
  setDraggedMissionId(null);
  setDropTargetMissionId(null);
  setDropPosition(null);

  if (autoScrollRef.current !== null) {
    cancelAnimationFrame(autoScrollRef.current);
    autoScrollRef.current = null;
  }
};

const updateDropTarget = (
  missionId: string,
  clientY: number,
  element: HTMLElement
) => {
  const rect = element.getBoundingClientRect();
  const position: 'before' | 'after' =
    clientY < rect.top + rect.height / 2
      ? 'before'
      : 'after';

  dropTargetRef.current = { missionId, position };

  setDropTargetMissionId(missionId);
  setDropPosition(position);
};
  
const updateStepDropTarget = (
  stepId: string,
  clientY: number,
  element: HTMLElement
) => {
  const rect = element.getBoundingClientRect();

  const position: 'before' | 'after' =
    clientY < rect.top + rect.height / 2
      ? 'before'
      : 'after';

  stepDropTargetRef.current = { stepId, position };

  setDropTargetStepId(stepId);
  setStepDropPosition(position);
};
  
const handleMissionTouchStart = (
e: TouchEvent<HTMLDivElement>,
  missionId: string
) => {
  const touch = e.touches[0];

  touchDragRef.current = {
    missionId,
    startY: touch.clientY,
    currentY: touch.clientY,
  };

  touchDragStartedRef.current = false;
  dropTargetRef.current = null;
setDropTargetMissionId(null);
setDropPosition(null);
};
  
const handleStepTouchStart = (
  e: TouchEvent<HTMLDivElement>,
  stepId: string,
  missionId: string,
  parentStepId: string | null
) => {
  const touch = e.touches[0];

  stepTouchDragRef.current = {
    stepId,
    missionId,
    parentStepId,
    startY: touch.clientY,
    currentY: touch.clientY,
  };

  stepTouchDragStartedRef.current = false;
  stepDropTargetRef.current = null;
  setDropTargetStepId(null);
  setStepDropPosition(null);
};

const handleMissionTouchMove = (
e: TouchEvent<HTMLDivElement>
) => {
  const touch = e.touches[0];
  const drag = touchDragRef.current;

  if (!drag) return;

  const deltaY = Math.abs(touch.clientY - drag.startY);

  if (!touchDragStartedRef.current && deltaY > 10) {
    touchDragStartedRef.current = true;
    setDraggedMissionId(drag.missionId);
  }

  if (!touchDragStartedRef.current) return;

  e.preventDefault();
  drag.currentY = touch.clientY;

  const cards = Object.entries(missionCardRefs.current);
  let nearestCard: HTMLDivElement | null = null;
  let nearestId: string | null = null;
  let nearestDistance = Infinity;

  for (const [id, card] of cards) {
    if (!card || id === drag.missionId) continue;

    const rect = card.getBoundingClientRect();

    if (touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
      nearestCard = card;
      nearestId = id;
      break;
    }

    const distance = Math.min(
      Math.abs(touch.clientY - rect.top),
      Math.abs(touch.clientY - rect.bottom)
    );

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestCard = card;
      nearestId = id;
    }
  }

  if (nearestCard && nearestId) {
    updateDropTarget(nearestId, touch.clientY, nearestCard);
  }

  const edgeSize = 100;
  const viewportHeight = window.innerHeight;

  let scrollAmount = 0;

  if (touch.clientY < edgeSize) {
    scrollAmount = -Math.ceil((edgeSize - touch.clientY) / 5);
  } else if (touch.clientY > viewportHeight - edgeSize) {
    scrollAmount = Math.ceil(
      (touch.clientY - (viewportHeight - edgeSize)) / 5
    );
  }

if (autoScrollRef.current !== null) {
  cancelAnimationFrame(autoScrollRef.current);
  autoScrollRef.current = null;
}

if (scrollAmount !== 0) {
  const scrollStep = () => {
    const currentDrag = touchDragRef.current;

    if (!currentDrag || !touchDragStartedRef.current) {
      autoScrollRef.current = null;
      return;
    }

    const currentY = currentDrag.currentY;
    const height = window.innerHeight;
    const edge = 100;

    let amount = 0;

    if (currentY < edge) {
      amount = -Math.max(2, Math.ceil((edge - currentY) / 5));
    } else if (currentY > height - edge) {
      amount = Math.max(2, Math.ceil((currentY - (height - edge)) / 5));
    }

    if (amount !== 0) {
      window.scrollBy(0, amount);
      autoScrollRef.current = requestAnimationFrame(scrollStep);
    } else {
      autoScrollRef.current = null;
    }
  };

  autoScrollRef.current = requestAnimationFrame(scrollStep);
}
};

const handleMissionTouchEnd = async () => {
  const drag = touchDragRef.current;
  const wasDragging = touchDragStartedRef.current;
  const target = dropTargetRef.current;

  if (autoScrollRef.current !== null) {
    cancelAnimationFrame(autoScrollRef.current);
    autoScrollRef.current = null;
  }

  touchDragRef.current = null;
  touchDragStartedRef.current = false;

  if (
    wasDragging &&
    drag &&
    target &&
    drag.missionId !== target.missionId
  ) {
    await reorderMission(
      drag.missionId,
      target.missionId,
      target.position
    );
  } else {
    finishMissionDrag();
  }
};

const reorderStep = async (
  stepId: string,
  targetStepId: string,
  missionId: string
) => {
  const mission = missions.find(m => m.id === missionId);
  if (!mission) return;

  const draggedStep = findStepInTree(mission.steps, stepId);
  const targetStep = findStepInTree(mission.steps, targetStepId);

  if (
    draggedStep &&
    targetStep &&
    draggedStep.parent_step_id === targetStep.parent_step_id
  ) {
    await missionService.reorderStep(stepId, targetStepId);
    setDraggedStepId(null);
    await loadMissions();
  }
};


  const getUrgencyStyle = (urgency: MissionUrgency) => {
    const config = URGENCY_CONFIG[urgency];
    return `${config.bg} ${config.color} ${config.border}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'border-emerald-500/50';
      case 'failed': return 'border-red-500/50';
      case 'paused': return 'border-slate-500/50';
      default: return 'border-orange-500/50';
    }
  };

  const renderStep = (step: MissionStepWithChildren, missionId: string, level: number = 0) => {
    const hasChildren = step.children.length > 0;
    const isExpanded = expandedSteps[step.id];
    const isEditingThisStep = editingStep?.stepId === step.id;
    const indent = level * 24;

    return (
      <div key={step.id}>
        {isEditingThisStep ? (
          <div className="p-3 bg-slate-700/50 border border-blue-500/50 rounded-lg space-y-2" style={{ marginLeft: indent }}>
            <input
              type="text"
              value={editingStep.title}
              onChange={(e) => setEditingStep({ ...editingStep, title: e.target.value })}
              className="w-full px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Título"
            />
            <textarea
              value={editingStep.description}
              onChange={(e) => setEditingStep({ ...editingStep, description: e.target.value })}
              className="w-full px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Descrição"
              rows={2}
            />
            <input
              type="number"
              value={editingStep.xpReward}
              onChange={(e) => setEditingStep({ ...editingStep, xpReward: parseInt(e.target.value) || 0 })}
              className="w-full px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="XP"
            />
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  await updateStep(step.id, {
                    title: editingStep.title,
                    description: editingStep.description,
                    xp_reward: editingStep.xpReward,
                  });
                  setEditingStep(null);
                }}
                className="flex-1 py-1 bg-blue-500 hover:bg-blue-600 rounded text-white text-sm font-semibold transition-colors"
              >
                <Check className="w-3 h-3 inline mr-1" />
                Salvar
              </button>
              <button
                onClick={() => setEditingStep(null)}
                className="flex-1 py-1 bg-slate-600 hover:bg-slate-500 rounded text-white text-sm font-semibold transition-colors"
              >
                <X className="w-3 h-3 inline mr-1" />
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors group cursor-move ${
              step.is_completed ? 'bg-emerald-500/10' : 'bg-slate-700/30 hover:bg-slate-700/50'
            }`}
            style={{ marginLeft: indent }}
            draggable
            onDragStart={(e) => {
              setDraggedStepId(step.id);
              e.dataTransfer.effectAllowed = 'move';
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (draggedStepId && draggedStepId !== step.id) {
                reorderStep(draggedStepId, step.id, missionId);
              }
            }}
          >
            <div className="text-slate-500 group-hover:text-slate-400 transition-colors opacity-0 group-hover:opacity-100">
              <GripVertical className="w-4 h-4" />
            </div>

            <button
              onClick={() => toggleStepComplete(step)}
              className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                step.is_completed
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : 'border-slate-500 hover:border-emerald-500'
              }`}
            >
              {step.is_completed && <Check className="w-4 h-4" />}
            </button>

            {hasChildren && (
              <button
                onClick={() => setExpandedSteps(prev => ({ ...prev, [step.id]: !isExpanded }))}
                className="text-slate-400 hover:text-white transition-colors"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            )}
            {!hasChildren && <div className="w-4" />}

            <div className="flex-1 min-w-0">
              <p className={`font-medium truncate ${step.is_completed ? 'text-slate-400 line-through' : 'text-white'}`}>
                {step.title}
              </p>
              {step.description && (
                <p className="text-xs text-slate-400 line-clamp-1">{step.description}</p>
              )}
              <p className="text-xs text-slate-500">XP: {step.xp_reward}</p>
            </div>

            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {level < MAX_TREE_DEPTH && (
                <button
                  onClick={() => setShowStepModal({ missionId, parentStepId: step.id, level: level + 1 })}
                  className="text-slate-400 hover:text-emerald-400 transition-colors"
                  title="Adicionar sub-passo"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={() => setEditingStep({ stepId: step.id, title: step.title, description: step.description || '', xpReward: step.xp_reward })}
                className="text-slate-400 hover:text-blue-400 transition-colors"
                title="Editar"
              >
                <Edit2 className="w-4 h-4" />
              </button>

              <button
  onClick={() => {
    if (
      window.confirm(
        `Tem certeza que deseja excluir a etapa "${step.title}"?`
      )
    ) {
      deleteStep(step.id);
    }
  }}
  className="text-slate-400 hover:text-red-400 transition-colors"
  title="Excluir etapa"
>
  <Trash2 className="w-4 h-4" />
</button>
            </div>
          </div>
        )}

        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {step.children.map(child => renderStep(child, missionId, level + 1))}
          </div>
        )}
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
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar</span>
        </button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Missões e Objetivos</h1>
            <p className="text-slate-400">Crie, edite, reordene e acompanhe suas missões</p>
          </div>
          <button
            onClick={() => {
              setEditingMission(null);
              setShowMissionModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 rounded-lg text-white font-semibold transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>Nova Missão</span>
          </button>
        </div>

        <div className="space-y-4">
          {missions.length === 0 ? (
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-12 text-center">
              <p className="text-slate-400 mb-4">Nenhuma missão criada ainda</p>
              <button
                onClick={() => setShowMissionModal(true)}
                className="text-orange-400 hover:text-orange-300 transition-colors"
              >
                Criar primeira missão
              </button>
            </div>
          ) : (
            missions.map((mission) => (
<div
  key={mission.id}
  data-mission-id={mission.id}
  ref={(element) => {
  missionCardRefs.current[mission.id] = element;
}}
  className={`relative bg-slate-800/50 backdrop-blur rounded-2xl border overflow-hidden group cursor-default transition-all duration-150 ${
    getStatusColor(mission.status)
  } ${
    draggedMissionId === mission.id
      ? 'opacity-40 scale-[0.99] border-orange-400'
      : ''
  } ${
    dropTargetMissionId === mission.id
      ? 'border-emerald-400'
      : ''
  }`}
onDragOver={(e) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';

  if (draggedMissionId && draggedMissionId !== mission.id) {
    updateDropTarget(mission.id, e.clientY, e.currentTarget);
  }
}}

onDrop={(e) => {
  e.preventDefault();

  if (draggedMissionId && draggedMissionId !== mission.id) {
    const rect = e.currentTarget.getBoundingClientRect();

    const position =
      e.clientY < rect.top + rect.height / 2
        ? 'before'
        : 'after';

    reorderMission(draggedMissionId, mission.id, position);
  } else {
    finishMissionDrag();
  }
}}
              >
  {dropTargetMissionId === mission.id && dropPosition && (
  <div
    className={`absolute left-0 right-0 z-20 h-1 bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)] ${
      dropPosition === 'before' ? 'top-0' : 'bottom-0'
    }`}
  />
)}
  
               <div
  onClick={() => setExpandedMissions(prev => ({ ...prev, [mission.id]: !prev[mission.id] }))}
  className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-orange-500/10 to-red-500/10 hover:from-orange-500/20 hover:to-red-500/20 transition-colors cursor-pointer"
>
<div
  draggable
onDragStart={(e) => {
  e.stopPropagation();
  e.dataTransfer.setData('text/plain', mission.id);
  e.dataTransfer.effectAllowed = 'move';

  setDraggedMissionId(mission.id);
  setDropTargetMissionId(null);
  setDropPosition(null);
}}
  onClick={(e) => e.stopPropagation()}
className="text-slate-500 group-hover:text-slate-400 transition-colors opacity-0 group-hover:opacity-100 touch-none select-none cursor-grab active:cursor-grabbing"
style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
onTouchStart={(e) => {
  e.stopPropagation();

  // Impede o arraste nativo do navegador durante o toque.
  e.currentTarget.draggable = false;

  handleMissionTouchStart(e, mission.id);
}}
onTouchMove={handleMissionTouchMove}
onTouchEnd={(e) => {
  e.currentTarget.draggable = true;
  void handleMissionTouchEnd();
}}
onTouchCancel={(e) => {
  e.currentTarget.draggable = true;
  void handleMissionTouchEnd();
}}
>
  <GripVertical className="w-4 h-4" />
</div>

                  {expandedMissions[mission.id] ? (
                    <ChevronDown className="w-5 h-5 text-white" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-white" />
                  )}

                  <div className="flex-1 text-left">
                    <h2 className="text-xl font-bold text-white">{mission.title}</h2>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm text-slate-400">XP: {mission.xp_reward}</span>
                      {mission.deadline && (
                        <span className="flex items-center gap-1 text-sm text-slate-400">
                          <Calendar className="w-3 h-3" />
                          {formatDate(mission.deadline)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className={`px-2 py-1 text-xs rounded-full border ${getUrgencyStyle(mission.urgency)}`}>
                      <Flag className="w-3 h-3 inline mr-1" />
                      {mission.urgency}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingMission({
                          id: mission.id,
                          title: mission.title,
                          description: mission.description || '',
                          xpReward: mission.xp_reward.toString(),
                          deadline: mission.deadline ? mission.deadline.split('T')[0] : '',
                          urgency: mission.urgency,
                        });
                        setShowMissionModal(true);
                      }}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
  onClick={(e) => {
    e.stopPropagation();

    if (
      window.confirm(
        `Tem certeza que deseja excluir a missão "${mission.title}"?`
      )
    ) {
      deleteMission(mission.id);
    }
  }}
  className="text-slate-400 hover:text-red-400 transition-colors"
  title="Excluir missão"
>
  <Trash2 className="w-4 h-4" />
</button>
</div>
</div>

                {expandedMissions[mission.id] && (
                  <div className="p-4 border-t border-slate-700/50">
                    {mission.description && (
                      <p className="text-slate-400 mb-4">{mission.description}</p>
                    )}

                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-slate-300">Passos ({mission.steps.length})</span>
                      <button
                        onClick={() => setShowStepModal({ missionId: mission.id, parentStepId: null, level: 0 })}
                        className="flex items-center gap-1 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Adicionar passo
                      </button>
                    </div>

                    <div className="space-y-2">
                      {mission.steps.length === 0 ? (
                        <p className="text-slate-400 text-center py-4">Nenhum passo adicionado</p>
                      ) : (
                        mission.steps.map(step => renderStep(step, mission.id))
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {showMissionModal && (
        <MissionModal
          mission={editingMission}
          onSave={async (data) => {
            if (editingMission) {
              await updateMission(editingMission.id, {
                title: data.title,
                description: data.description,
                xp_reward: data.xp_reward,
                deadline: data.deadline || null,
                urgency: data.urgency,
              });
            } else {
              await createMission(data);
            }
            setShowMissionModal(false);
            setEditingMission(null);
          }}
          onClose={() => {
            setShowMissionModal(false);
            setEditingMission(null);
          }}
        />
      )}

      {showStepModal && (
        <StepModal
          level={showStepModal.level}
          maxLevel={MAX_TREE_DEPTH}
          onSave={async (data) => {
            await createStep(showStepModal.missionId, showStepModal.parentStepId, showStepModal.level, data);
            setShowStepModal(null);
          }}
          onClose={() => setShowStepModal(null)}
        />
      )}
    </div>
  );
}

function findStepInTree(steps: MissionStepWithChildren[], stepId: string): MissionStep | null {
  for (const step of steps) {
    if (step.id === stepId) return step;
    const found = findStepInTree(step.children, stepId);
    if (found) return found;
  }
  return null;
}

function MissionModal({
  mission,
  onSave,
  onClose,
}: {
  mission: EditingMission | null;
  onSave: (data: {
    title: string;
    description: string;
    xp_reward: number;
    deadline: string | null;
    urgency: string;
  }) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(mission?.title || '');
  const [description, setDescription] = useState(mission?.description || '');
  const [xpReward, setXpReward] = useState(mission?.xpReward || '0');
  const [deadline, setDeadline] = useState(mission?.deadline || '');
  const [urgency, setUrgency] = useState(mission?.urgency || 'medium');

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full">
        <h3 className="text-xl font-bold text-white mb-4">
          {mission ? 'Editar Missão' : 'Nova Missão'}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">XP Recompensa</label>
            <input
              type="number"
              value={xpReward}
              onChange={(e) => setXpReward(e.target.value)}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Prazo</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Urgência</label>
            <select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value)}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
              <option value="critical">Crítica</option>
            </select>
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
            onClick={() => onSave({
              title,
              description,
              xp_reward: parseInt(xpReward) || 0,
              deadline: deadline || null,
              urgency,
            })}
            disabled={!title.trim()}
            className="flex-1 py-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 rounded-lg text-white font-semibold transition-all disabled:opacity-50"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

function StepModal({
  level,
  maxLevel,
  onSave,
  onClose,
}: {
  level: number;
  maxLevel: number;
  onSave: (data: { title: string; description: string; xp_reward: number }) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [xpReward, setXpReward] = useState('0');

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full">
        <h3 className="text-xl font-bold text-white mb-2">
          Novo Passo
        </h3>
        <p className="text-sm text-slate-400 mb-4">Nível {level + 1} de {maxLevel + 1}</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">XP Recompensa</label>
            <input
              type="number"
              value={xpReward}
              onChange={(e) => setXpReward(e.target.value)}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              min="0"
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
            onClick={() => onSave({ title, description, xp_reward: parseInt(xpReward) || 0 })}
            disabled={!title.trim()}
            className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white font-semibold transition-colors disabled:opacity-50"
          >
            Criar
          </button>
        </div>
      </div>
    </div>
  );
}

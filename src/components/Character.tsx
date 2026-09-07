import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Plus, ChevronDown, ChevronRight, Trash2, Edit2, X, History, TrendingUp, TrendingDown, GripVertical, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Character, CategoryWithAttributes, AttributeWithChildren, Attribute, XpHistory } from '../types';
import { characterService, categoryService, xpHistoryService } from '../services';
import { MAX_TREE_DEPTH } from '../constants';
import { formatDateTime } from '../utils';

interface CharacterSectionProps {
  characterId: string;
  onBack: () => void;
  onUpdateCharacter: (character: Character) => void;
}

interface EditingAttribute {
  id: string;
  name: string;
  categoryId: string;
  parentId: string | null;
}

interface EditingCategory {
  id: string;
  name: string;
}

export function CharacterSection({ characterId, onBack, onUpdateCharacter }: CharacterSectionProps) {
  const [character, setCharacter] = useState<Character | null>(null);
  const [categories, setCategories] = useState<CategoryWithAttributes[]>([]);
  const [xpHistory, setXpHistory] = useState<XpHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [editingClass, setEditingClass] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [expandedAttributes, setExpandedAttributes] = useState<Record<string, boolean>>({});
  const [editingAttribute, setEditingAttribute] = useState<EditingAttribute | null>(null);
  const [editingCategory, setEditingCategory] = useState<EditingCategory | null>(null);
  const [newCategoryModal, setNewCategoryModal] = useState(false);
  const [newSubAttributeModal, setNewSubAttributeModal] = useState<{ parent: Attribute; categoryId: string; level: number } | null>(null);
  const [showXpModal, setShowXpModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [draggedAttributeId, setDraggedAttributeId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [characterId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: charData } = await supabase
        .from('characters')
        .select('*')
        .eq('id', characterId)
        .maybeSingle();

      if (charData) {
        setCharacter(charData as Character);
      }

      const [categoriesData, historyData] = await Promise.all([
        characterService.getCharacterWithAttributes(characterId),
        xpHistoryService.getHistory(characterId, 50),
      ]);

      setCategories(categoriesData);
      setXpHistory(historyData);

      const expandedMap: Record<string, boolean> = {};
      categoriesData.forEach(c => expandedMap[c.id] = true);
      setExpandedCategories(expandedMap);
    } catch (error) {
      console.error('Error loading character data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateCharacter = async (updates: Partial<Character>) => {
    const data = await characterService.updateCharacter(characterId, updates);
    if (data) {
      setCharacter(data);
      onUpdateCharacter(data);
    }
  };

  const updateAttributeValue = async (attributeId: string, value: number) => {
    await characterService.updateAttributeValue(characterId, attributeId, value);

    setCategories(prev => {
      const updateValue = (attrs: AttributeWithChildren[]): AttributeWithChildren[] => {
        return attrs.map(attr => ({
          ...attr,
          value: attr.id === attributeId ? value : attr.value,
          children: updateValue(attr.children),
        }));
      };
      return prev.map(cat => ({
        ...cat,
        attributes: updateValue(cat.attributes),
      }));
    });
  };

  const updateAttributeName = async (attributeId: string, newName: string) => {
    if (!newName.trim()) return;
    try {
      console.log('Updating attribute name:', attributeId, newName);
      await characterService.updateAttributeName(attributeId, newName.trim());
      console.log('Attribute name updated, reloading...');
      setEditingAttribute(null);
      await loadData();
      console.log('Data reloaded after name update');
    } catch (error) {
      console.error('Failed to update attribute name:', error);
      alert('Erro ao atualizar atributo: ' + (error as Error).message);
    }
  };

  const updateCategoryName = async (categoryId: string, newName: string) => {
    if (!newName.trim()) return;
    try {
      console.log('Updating category name:', categoryId, newName);
      const { error } = await supabase.from('attribute_categories').update({ name: newName.trim() }).eq('id', categoryId);
      if (error) throw error;
      setEditingCategory(null);
      console.log('Category updated, reloading...');
      await loadData();
      console.log('Data reloaded after category update');
    } catch (error) {
      console.error('Failed to update category name:', error);
      alert('Erro ao atualizar categoria: ' + (error as Error).message);
    }
  };

    const createCategory = async (name: string) => {
    if (!name.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const displayOrder = categories.length + 1;

      const newCategory = await categoryService.createCategory(
        user.id,
        name.trim(),
        displayOrder
      );

      if (!newCategory) {
        throw new Error('Não foi possível criar a categoria.');
      }

      setNewCategoryModal(false);
      await loadData();
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      alert(
        'Erro ao criar categoria: ' +
        (error instanceof Error ? error.message : 'Erro desconhecido')
      );
    }
  };

const createSubAttribute = async (
  parentId: string,
  categoryId: string,
  name: string,
  level: number
) => {
  if (level >= MAX_TREE_DEPTH) return;

  try {
    const count = await characterService.getAttributeCount(parentId);

    const newAttr = await characterService.createSubAttribute(
      parentId,
      name.trim(),
      count + 1
    );

    if (!newAttr) {
      throw new Error('Não foi possível criar o atributo.');
    }

    await characterService.updateAttributeValue(
      characterId,
      newAttr.id,
      0
    );

    setNewSubAttributeModal(null);
    await loadData();
  } catch (error) {
    console.error('Erro ao criar sub-atributo:', error);

    alert(
      'Erro ao criar atributo: ' +
      (error instanceof Error ? error.message : 'Erro desconhecido')
    );
  }
};


  const deleteAttribute = async (attributeId: string) => {
    try {
      console.log('Deleting attribute:', attributeId);
      await characterService.deleteAttribute(attributeId);
      console.log('Attribute deleted, reloading...');
      await loadData();
      console.log('Data reloaded after delete');
    } catch (error) {
      console.error('Failed to delete attribute:', error);
      alert('Erro ao deletar atributo: ' + (error as Error).message);
    }
  };

  const deleteXpHistoryEntry = async (entryId: string) => {
    try {
      console.log('Deleting XP history entry:', entryId);
      const { error } = await supabase.from('xp_history').delete().eq('id', entryId);
      if (error) throw error;
      console.log('Entry deleted, reloading...');
      await loadData();
      console.log('Data reloaded after entry delete');
    } catch (error) {
      console.error('Failed to delete XP history entry:', error);
      alert('Erro ao deletar entrada: ' + (error as Error).message);
    }
  };

  const handleDragStart = (e: React.DragEvent, attributeId: string) => {
    setDraggedAttributeId(attributeId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropReorder = async (e: React.DragEvent, targetAttributeId: string) => {
    e.preventDefault();
    if (!draggedAttributeId || draggedAttributeId === targetAttributeId) return;

    try {
      console.log('Reordering:', draggedAttributeId, 'to', targetAttributeId);
      const draggedAttr = findAttributeInCategories(categories, draggedAttributeId);
      const targetAttr = findAttributeInCategories(categories, targetAttributeId);

      if (draggedAttr && targetAttr && draggedAttr.category_id === targetAttr.category_id && draggedAttr.parent_id === targetAttr.parent_id) {
        const tempOrder = draggedAttr.display_order;
        await characterService.reorderAttribute(draggedAttributeId, targetAttr.display_order);
        await characterService.reorderAttribute(targetAttributeId, tempOrder);
        setDraggedAttributeId(null);
        console.log('Reorder complete, reloading...');
        await loadData();
        console.log('Data reloaded after reorder');
      }
    } catch (error) {
      console.error('Failed to reorder attribute:', error);
      alert('Erro ao reposicionar atributo: ' + (error as Error).message);
    }
  };

  const renderAttribute = (attr: AttributeWithChildren, categoryId: string, level: number = 0) => {
    const hasChildren = attr.children.length > 0;
    const isExpanded = expandedAttributes[attr.id];
    const isEditing = editingAttribute?.id === attr.id;
    const indent = level * 24;

    return (
      <div key={attr.id}>
        {isEditing ? (
          <div className="p-3 bg-slate-700/50 rounded-lg border border-blue-500/50 space-y-2" style={{ marginLeft: indent }}>
            <input
              type="text"
              value={editingAttribute.name}
              onChange={(e) => setEditingAttribute({ ...editingAttribute, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => updateAttributeName(attr.id, editingAttribute.name)}
                className="flex-1 py-1 bg-blue-500 hover:bg-blue-600 rounded text-white text-sm font-semibold transition-colors"
              >
                <Check className="w-3 h-3 inline mr-1" />
                Salvar
              </button>
              <button
                onClick={() => setEditingAttribute(null)}
                className="flex-1 py-1 bg-slate-600 hover:bg-slate-500 rounded text-white text-sm font-semibold transition-colors"
              >
                <X className="w-3 h-3 inline mr-1" />
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div
            className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors group cursor-move"
            style={{ marginLeft: indent }}
            draggable
            onDragStart={(e) => handleDragStart(e, attr.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDropReorder(e, attr.id)}
          >
            <div className="text-slate-500 group-hover:text-slate-400 transition-colors">
              <GripVertical className="w-4 h-4" />
            </div>

            {hasChildren && (
              <button
                onClick={() => setExpandedAttributes(prev => ({ ...prev, [attr.id]: !isExpanded }))}
                className="text-slate-400 hover:text-white transition-colors"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            )}
            {!hasChildren && <div className="w-4" />}

            <span className="flex-1 text-white font-medium">{attr.name}</span>

            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => updateAttributeValue(attr.id, Math.max(0, attr.value - 1))}
                className="w-8 h-8 bg-slate-600 hover:bg-slate-500 rounded-lg text-white font-bold transition-colors"
              >
                -
              </button>
              <input
                type="number"
                value={attr.value}
                onChange={(e) => updateAttributeValue(attr.id, parseInt(e.target.value) || 0)}
                className="w-12 text-center bg-slate-600 border border-slate-500 rounded text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                onClick={() => updateAttributeValue(attr.id, attr.value + 1)}
                className="w-8 h-8 bg-slate-600 hover:bg-slate-500 rounded-lg text-white font-bold transition-colors"
              >
                +
              </button>
            </div>

            <button
              onClick={() => setEditingAttribute({ id: attr.id, name: attr.name, categoryId, parentId: attr.parent_id })}
              className="text-slate-400 hover:text-blue-400 transition-colors opacity-0 group-hover:opacity-100"
              title="Editar nome"
            >
              <Edit2 className="w-4 h-4" />
            </button>

            {level < MAX_TREE_DEPTH && (
              <button
                onClick={() => setNewSubAttributeModal({ parent: attr, categoryId, level })}
                className="text-slate-400 hover:text-emerald-400 transition-colors opacity-0 group-hover:opacity-100"
                title="Adicionar sub-atributo"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => deleteAttribute(attr.id)}
              className="text-slate-400 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
              title="Deletar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {attr.children.map(child => renderAttribute(child, categoryId, level + 1))}
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

        <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Nome</label>
              {editingName ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={character?.name || ''}
                    onChange={(e) => setCharacter(prev => prev ? { ...prev, name: e.target.value } : null)}
                    className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => { updateCharacter({ name: character?.name }); setEditingName(false); }}
                    className="p-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white"
                  >
                    <Save className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setEditingName(false)}
                    className="p-2 bg-slate-600 hover:bg-slate-500 rounded-lg text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xl text-white font-semibold">{character?.name}</span>
                  <button onClick={() => setEditingName(true)} className="text-slate-400 hover:text-white">
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Classe</label>
              {editingClass ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={character?.class || ''}
                    onChange={(e) => setCharacter(prev => prev ? { ...prev, class: e.target.value } : null)}
                    className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => { updateCharacter({ class: character?.class }); setEditingClass(false); }}
                    className="p-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white"
                  >
                    <Save className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setEditingClass(false)}
                    className="p-2 bg-slate-600 hover:bg-slate-500 rounded-lg text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xl text-white font-semibold">{character?.class}</span>
                  <button onClick={() => setEditingClass(true)} className="text-slate-400 hover:text-white">
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Peso (kg)</label>
              <input
                type="number"
                value={character?.weight || ''}
                onChange={(e) => {
                  const weight = parseFloat(e.target.value);
                  setCharacter(prev => prev ? { ...prev, weight } : null);
                  updateCharacter({ weight });
                }}
                className="w-24 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                step="0.1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">XP Total</label>
              <div className="flex items-center gap-3">
                <div className="text-2xl font-bold text-emerald-400">{character?.xp || 0}</div>
                <button
                  onClick={() => setShowXpModal(true)}
                  className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-lg text-emerald-400 transition-colors"
                  title="Adicionar XP manualmente"
                >
                  <Plus className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="p-2 bg-slate-600/50 hover:bg-slate-600 rounded-lg text-slate-300 transition-colors"
                  title="Histórico de XP"
                >
                  <History className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {showHistory && (
          <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 p-6 mb-6">
            <h3 className="text-lg font-bold text-white mb-4">Histórico de XP ({xpHistory.length})</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {xpHistory.length === 0 ? (
                <p className="text-slate-400 text-center py-4">Sem histórico de alterações</p>
              ) : (
                xpHistory.map((entry) => (
                  <div
                    key={entry.id}
                    className={`flex items-center justify-between p-3 rounded-lg group ${
                      entry.amount > 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {entry.amount > 0 ? (
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-400" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{entry.reason}</p>
                        <p className="text-xs text-slate-400">{formatDateTime(entry.created_at)}</p>
                      </div>
                    </div>
                    <div className={`font-bold text-right mr-3 ${entry.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      <div>{entry.amount > 0 ? '+' : ''}{entry.amount}</div>
                      <div className="text-xs text-slate-400">→ {entry.balance_after}</div>
                    </div>
                    <button
                      onClick={() => deleteXpHistoryEntry(entry.id)}
                      className="text-slate-400 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                      title="Deletar entrada"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div className="space-y-4">
  <button
    onClick={() => setNewCategoryModal(true)}
    className="w-full flex items-center justify-center gap-2 p-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-xl text-blue-400 font-semibold transition-colors"
  >
    <Plus className="w-5 h-5" />
    Nova categoria
  </button>

  {categories.map((category) => (
            <div key={category.id} className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 overflow-hidden">
              {editingCategory?.id === category.id ? (
                <div className="p-4 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 flex gap-2">
                  <input
                    type="text"
                    value={editingCategory.name}
                    onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                    className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <button
                    onClick={() => updateCategoryName(category.id, editingCategory.name)}
                    className="p-2 bg-blue-500 hover:bg-blue-600 rounded text-white"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditingCategory(null)}
                    className="p-2 bg-slate-600 hover:bg-slate-500 rounded text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setExpandedCategories(prev => ({ ...prev, [category.id]: !prev[category.id] }))}
                  className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 transition-colors group"
                >
                  {expandedCategories[category.id] ? (
                    <ChevronDown className="w-5 h-5 text-white" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-white" />
                  )}
                  <h2 className="text-xl font-bold text-white flex-1">{category.name}</h2>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingCategory({ id: category.id, name: category.name });
                    }}
                    className="text-slate-400 hover:text-blue-400 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </button>
              )}

              {expandedCategories[category.id] && (
                <div className="p-4 space-y-2">
                  {category.attributes.length === 0 ? (
                    <p className="text-slate-400 text-center py-4">Nenhum atributo</p>
                  ) : (
                    category.attributes.map(attr => renderAttribute(attr, category.id))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {newSubAttributeModal && (
        <NewSubAttributeModal
          parentName={newSubAttributeModal.parent.name}
          level={newSubAttributeModal.level}
          maxLevel={MAX_TREE_DEPTH}
         
onConfirm={async (name) => {
  await createSubAttribute(
    newSubAttributeModal.parent.id,
    newSubAttributeModal.categoryId,
    name,
    newSubAttributeModal.level
  );
}}
          onClose={() => setNewSubAttributeModal(null)}
        />
      )}

      {showXpModal && (
        <XpAdjustmentModal
          characterId={characterId}
          onConfirm={async () => {
            await loadData();
            setShowXpModal(false);
          }}
          onClose={() => setShowXpModal(false)}
        />
      )}
    </div>
  );
}

function findAttributeInCategories(categories: CategoryWithAttributes[], attributeId: string): Attribute | null {
  for (const category of categories) {
    const found = findAttributeInTree(category.attributes, attributeId);
    if (found) return found;
  }
  return null;
}

function findAttributeInTree(attributes: AttributeWithChildren[], attributeId: string): Attribute | null {
  for (const attr of attributes) {
    if (attr.id === attributeId) return attr;
    const found = findAttributeInTree(attr.children, attributeId);
    if (found) return found;
  }
  return null;
}

function NewSubAttributeModal({
  parentName,
  level,
  maxLevel,
  onConfirm,
  onClose,
}: {
  parentName: string;
  level: number;
  maxLevel: number;
  onConfirm: (name: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState('');

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full">
        <h3 className="text-xl font-bold text-white mb-4">
          Nova Sub-seção para {parentName}
        </h3>
        <p className="text-slate-400 text-sm mb-4">Nível {level + 1} de {maxLevel + 1}</p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome do atributo"
          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg text-white font-semibold transition-colors"
          >
            Cancelar
          </button>
<button
  type="button"
  onClick={() => {
    console.log('BOTÃO CRIAR CLICADO');
    console.log('NAME:', name);

    if (!name.trim()) {
      alert('O nome está vazio!');
      return;
    }

    console.log('CHAMANDO onConfirm');
    onConfirm(name.trim());
  }}
  className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white font-semibold"
>
  Criar
</button>
        </div>
      </div>
    </div>
  );
}

function XpAdjustmentModal({
  characterId,
  onConfirm,
  onClose,
}: {
  characterId: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const numAmount = parseInt(amount) || 0;
    if (!reason.trim() || numAmount === 0) return;

    setLoading(true);
    try {
      await xpHistoryService.addXpWithReason(characterId, numAmount, reason.trim());
      onConfirm();
    } catch (error) {
      console.error('Error adjusting XP:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full">
        <h3 className="text-xl font-bold text-white mb-4">
          Ajustar XP
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Quantidade</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Ex: 50 ou -25"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Motivo (obrigatório)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              rows={3}
              placeholder="Ex: Missão completada, Penalidade, Ajuste manual..."
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
            onClick={handleSubmit}
            disabled={!reason.trim() || !amount || parseInt(amount) === 0 || loading}
            className={`flex-1 py-2 rounded-lg text-white font-semibold transition-colors disabled:opacity-50 ${
              parseInt(amount) > 0
                ? 'bg-emerald-500 hover:bg-emerald-600'
                : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            {loading ? 'Salvando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}

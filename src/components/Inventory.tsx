import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Edit2, Check, Package, Target, Info, X, GripVertical } from 'lucide-react';
import type { InventoryItemWithDetails, InventoryItem } from '../types';
import { inventoryService } from '../services';

interface InventorySectionProps {
  characterId: string;
  onBack: () => void;
}

interface EditingItem {
  id: string;
  name: string;
  description: string;
  category: string;
}

export function InventorySection({ characterId, onBack }: InventorySectionProps) {
  const [items, setItems] = useState<InventoryItemWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<EditingItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryItemWithDetails | null>(null);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  useEffect(() => {
    loadItems();
  }, [characterId]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const itemsData = await inventoryService.getItems(characterId);
      setItems(itemsData);
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const createItem = async (data: { name: string; description: string; category: string }) => {
    await inventoryService.createItem(characterId, data);
    await loadItems();
  };

  const updateItem = async (id: string, data: Partial<InventoryItem>) => {
    await inventoryService.updateItem(id, data);
    await loadItems();
  };

  const deleteItem = async (id: string) => {
    await inventoryService.deleteItem(id);
    await loadItems();
    if (selectedItem?.id === id) {
      setSelectedItem(null);
    }
  };

  const reorderItem = async (itemId: string, targetItemId: string) => {
    const draggedItem = items.find(i => i.id === itemId);
    const targetItem = items.find(i => i.id === targetItemId);

    if (draggedItem && targetItem) {
      const tempOrder = draggedItem.display_order || 0;
      await inventoryService.reorderItem(itemId, targetItem.display_order || 0);
      await inventoryService.reorderItem(targetItemId, tempOrder);
      setDraggedItemId(null);
      await loadItems();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  if (selectedItem) {
    return (
      <ItemDetailView
        item={selectedItem}
        onBack={() => setSelectedItem(null)}
        onDeleteItem={async () => {
          await deleteItem(selectedItem.id);
        }}
        onAddObjective={async (objective, frequency) => {
          await inventoryService.addObjective(selectedItem.id, objective, frequency);
          await loadItems();
          const updated = items.find(i => i.id === selectedItem.id);
          if (updated) setSelectedItem(updated);
        }}
        onToggleObjective={async (id, isCompleted) => {
          await inventoryService.toggleObjective(id, isCompleted);
          await loadItems();
          const updated = items.find(i => i.id === selectedItem.id);
          if (updated) setSelectedItem(updated);
        }}
        onDeleteObjective={async (id) => {
          await inventoryService.deleteObjective(id);
          await loadItems();
          const updated = items.find(i => i.id === selectedItem.id);
          if (updated) setSelectedItem(updated);
        }}
        onAddInformation={async (info) => {
          await inventoryService.addInformation(selectedItem.id, info);
          await loadItems();
          const updated = items.find(i => i.id === selectedItem.id);
          if (updated) setSelectedItem(updated);
        }}
        onDeleteInformation={async (id) => {
          await inventoryService.deleteInformation(id);
          await loadItems();
          const updated = items.find(i => i.id === selectedItem.id);
          if (updated) setSelectedItem(updated);
        }}
      />
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
            <h1 className="text-3xl font-bold text-white mb-2">Inventário</h1>
            <p className="text-slate-400">Gerencie seus itens, objetivos e informações</p>
          </div>
          <button
            onClick={() => {
              setEditingItem(null);
              setShowItemModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 rounded-lg text-white font-semibold transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>Novo Item</span>
          </button>
        </div>

        <div className="space-y-2">
          {items.length === 0 ? (
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-12 text-center">
              <Package className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400 mb-4">Seu inventário está vazio</p>
              <button
                onClick={() => setShowItemModal(true)}
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                Adicionar primeiro item
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-4 group cursor-move hover:bg-slate-800/70 transition-colors"
                draggable
                onDragStart={(e) => {
                  setDraggedItemId(item.id);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedItemId && draggedItemId !== item.id) {
                    reorderItem(draggedItemId, item.id);
                  }
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="text-slate-500 group-hover:text-slate-400 transition-colors opacity-0 group-hover:opacity-100">
                    <GripVertical className="w-5 h-5" />
                  </div>

                  <button
                    onClick={() => setSelectedItem(item)}
                    className="flex-1 text-left"
                  >
                    <h3 className="text-lg font-bold text-white mb-1">{item.name}</h3>
                    <p className="text-sm text-slate-400 line-clamp-1">{item.description}</p>
                    <div className="flex gap-3 mt-2 text-xs text-slate-500">
                      {item.category && <span className="px-2 py-1 bg-slate-700/50 rounded">{item.category}</span>}
                      <span className="px-2 py-1 bg-slate-700/50 rounded flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        {item.objectives.length} objetivos
                      </span>
                      <span className="px-2 py-1 bg-slate-700/50 rounded flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        {item.information.length} informações
                      </span>
                    </div>
                  </button>

                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setEditingItem({
                          id: item.id,
                          name: item.name,
                          description: item.description || '',
                          category: item.category || '',
                        });
                        setShowItemModal(true);
                      }}
                      className="p-2 text-slate-400 hover:text-blue-400 transition-colors rounded-lg hover:bg-slate-700/50"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="p-2 text-slate-400 hover:text-red-400 transition-colors rounded-lg hover:bg-slate-700/50"
                      title="Deletar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showItemModal && (
        <ItemModal
          item={editingItem}
          onSave={async (data) => {
            if (editingItem) {
              await updateItem(editingItem.id, data);
            } else {
              await createItem(data);
            }
            setShowItemModal(false);
            setEditingItem(null);
          }}
          onClose={() => {
            setShowItemModal(false);
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
}

function ItemDetailView({
  item,
  onBack,
  onDeleteItem,
  onAddObjective,
  onToggleObjective,
  onDeleteObjective,
  onAddInformation,
  onDeleteInformation,
}: {
  item: InventoryItemWithDetails;
  onBack: () => void;
  onDeleteItem: () => void;
  onAddObjective: (objective: string, frequency?: string) => void;
  onToggleObjective: (id: string, isCompleted: boolean) => void;
  onDeleteObjective: (id: string) => void;
  onAddInformation: (information: string) => void;
  onDeleteInformation: (id: string) => void;
}) {
  const [showObjectiveModal, setShowObjectiveModal] = useState(false);
  const [showInformationModal, setShowInformationModal] = useState(false);

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar</span>
          </button>
          <button
            onClick={onDeleteItem}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 font-semibold transition-colors"
          >
            <Trash2 className="w-4 h-4 inline mr-2" />
            Deletar Item
          </button>
        </div>

        <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 p-6 mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">{item.name}</h1>
          <p className="text-slate-400 mb-4">{item.description}</p>
          {item.category && (
            <span className="inline-block px-3 py-1 bg-slate-700/50 rounded-full text-sm text-slate-300">
              {item.category}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-slate-700/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-400" />
                Objetivos ({item.objectives.length})
              </h2>
              <button
                onClick={() => setShowObjectiveModal(true)}
                className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-lg text-emerald-400 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {item.objectives.length === 0 ? (
                <p className="text-slate-400 text-center py-4">Sem objetivos</p>
              ) : (
                item.objectives.map((obj) => (
                  <div key={obj.id} className="flex items-center gap-2 p-3 bg-slate-700/30 rounded-lg">
                    <button
                      onClick={() => onToggleObjective(obj.id, obj.is_completed)}
                      className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                        obj.is_completed
                          ? 'bg-emerald-500 border-emerald-500'
                          : 'border-slate-500 hover:border-emerald-500'
                      }`}
                    >
                      {obj.is_completed && <Check className="w-4 h-4 text-white" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-white ${obj.is_completed ? 'line-through text-slate-400' : ''}`}>
                        {obj.objective}
                      </p>
                      {obj.frequency && (
                        <p className="text-xs text-slate-400">{obj.frequency}</p>
                      )}
                    </div>
                    <button
                      onClick={() => onDeleteObjective(obj.id)}
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
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-400" />
                Informações ({item.information.length})
              </h2>
              <button
                onClick={() => setShowInformationModal(true)}
                className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-blue-400 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {item.information.length === 0 ? (
                <p className="text-slate-400 text-center py-4">Sem informações</p>
              ) : (
                item.information.map((info) => (
                  <div key={info.id} className="flex items-start justify-between p-3 bg-slate-700/30 rounded-lg">
                    <p className="flex-1 text-white text-sm">{info.information}</p>
                    <button
                      onClick={() => onDeleteInformation(info.id)}
                      className="ml-2 text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {showObjectiveModal && (
        <ObjectiveModal
          onSave={(objective, frequency) => {
            onAddObjective(objective, frequency);
            setShowObjectiveModal(false);
          }}
          onClose={() => setShowObjectiveModal(false)}
        />
      )}

      {showInformationModal && (
        <InformationModal
          onSave={(information) => {
            onAddInformation(information);
            setShowInformationModal(false);
          }}
          onClose={() => setShowInformationModal(false)}
        />
      )}
    </div>
  );
}

function ItemModal({
  item,
  onSave,
  onClose,
}: {
  item: EditingItem | null;
  onSave: (data: { name: string; description: string; category: string }) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(item?.name || '');
  const [description, setDescription] = useState(item?.description || '');
  const [category, setCategory] = useState(item?.category || '');

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full">
        <h3 className="text-xl font-bold text-white mb-4">
          {item ? 'Editar Item' : 'Novo Item'}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Categoria</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Arma, Armadura, Consumível"
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
            onClick={() => onSave({ name, description, category })}
            disabled={!name.trim()}
            className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white font-semibold transition-colors disabled:opacity-50"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

function ObjectiveModal({
  onSave,
  onClose,
}: {
  onSave: (objective: string, frequency?: string) => void;
  onClose: () => void;
}) {
  const [objective, setObjective] = useState('');
  const [frequency, setFrequency] = useState('');

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full">
        <h3 className="text-xl font-bold text-white mb-4">Novo Objetivo</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Objetivo</label>
            <textarea
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Frequência (opcional)</label>
            <input
              type="text"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              placeholder="Ex: Diário, Semanal"
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
            onClick={() => onSave(objective, frequency)}
            disabled={!objective.trim()}
            className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white font-semibold transition-colors disabled:opacity-50"
          >
            Adicionar
          </button>
        </div>
      </div>
    </div>
  );
}

function InformationModal({
  onSave,
  onClose,
}: {
  onSave: (information: string) => void;
  onClose: () => void;
}) {
  const [information, setInformation] = useState('');

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full">
        <h3 className="text-xl font-bold text-white mb-4">Nova Informação</h3>

        <textarea
          value={information}
          onChange={(e) => setInformation(e.target.value)}
          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          rows={4}
          placeholder="Escreva a informação..."
        />

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg text-white font-semibold transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave(information)}
            disabled={!information.trim()}
            className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white font-semibold transition-colors disabled:opacity-50"
          >
            Adicionar
          </button>
        </div>
      </div>
    </div>
  );
}

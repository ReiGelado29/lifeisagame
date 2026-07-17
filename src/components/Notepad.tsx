import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Edit2, FileText, GripVertical, X } from 'lucide-react';
import type { Note } from '../types';
import { notepadService } from '../services';

interface NotepadSectionProps {
  characterId: string;
  onBack: () => void;
}

export function NotepadSection({ characterId, onBack }: NotepadSectionProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
  const [renamingNoteId, setRenamingNoteId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState('');

  useEffect(() => {
    loadNotes();
  }, [characterId]);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const notesData = await notepadService.getNotes(characterId);
      setNotes(notesData);
      if (selectedNote && notesData.length > 0) {
        const updated = notesData.find(n => n.id === selectedNote.id);
        if (updated) {
          setSelectedNote(updated);
        } else {
          setSelectedNote(notesData[0]);
        }
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNote = async () => {
    const newNote = await notepadService.createNote(characterId);
    if (newNote) {
      await loadNotes();
      setSelectedNote(newNote);
    }
  };

  const updateNote = async (id: string, updates: { title?: string; content?: string }) => {
    await notepadService.updateNote(id, updates);
    await loadNotes();
  };

  const deleteNote = async (id: string) => {
    await notepadService.deleteNote(id);
    if (selectedNote?.id === id) {
      setSelectedNote(null);
    }
    await loadNotes();
  };

  const renameNote = async (id: string, newTitle: string) => {
    if (newTitle.trim()) {
      await updateNote(id, { title: newTitle.trim() });
    }
    setRenamingNoteId(null);
    setRenameTitle('');
  };

  const reorderNote = async (noteId: string, targetNoteId: string) => {
    const draggedNote = notes.find(n => n.id === noteId);
    const targetNote = notes.find(n => n.id === targetNoteId);

    if (draggedNote && targetNote) {
      const tempOrder = draggedNote.display_order || 0;
      await notepadService.reorderNote(noteId, targetNote.display_order || 0);
      await notepadService.reorderNote(targetNoteId, tempOrder);
      setDraggedNoteId(null);
      await loadNotes();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col md:flex-row">
      <div className="w-full md:w-64 bg-slate-800/50 border-r border-slate-700/50 p-4 flex flex-col">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar</span>
        </button>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Notas</h2>
          <button
            onClick={createNote}
            className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-blue-400 transition-colors"
            title="Nova nota"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
          {notes.length === 0 ? (
            <p className="text-slate-400 text-center py-8">Nenhuma nota</p>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className={`p-3 rounded-lg group cursor-move transition-colors ${
                  selectedNote?.id === note.id
                    ? 'bg-blue-500/30 border border-blue-500/50'
                    : 'bg-slate-700/30 hover:bg-slate-700/50'
                }`}
                draggable
                onDragStart={(e) => {
                  setDraggedNoteId(note.id);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedNoteId && draggedNoteId !== note.id) {
                    reorderNote(draggedNoteId, note.id);
                  }
                }}
              >
                {renamingNoteId === note.id ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={renameTitle}
                      onChange={(e) => setRenameTitle(e.target.value)}
                      className="flex-1 px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <button
                      onClick={() => renameNote(note.id, renameTitle)}
                      className="p-1 text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => setRenamingNoteId(null)}
                      className="p-1 text-red-400 hover:text-red-300 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <div className="text-slate-500 group-hover:text-slate-400 transition-colors opacity-0 group-hover:opacity-100 mt-0.5">
                      <GripVertical className="w-4 h-4" />
                    </div>

                    <button
                      onClick={() => setSelectedNote(note)}
                      className="flex-1 text-left min-w-0"
                    >
                      <p className="font-medium text-white truncate">{note.title || 'Sem título'}</p>
                      <p className="text-xs text-slate-400 line-clamp-1">{note.content || 'Vazia'}</p>
                    </button>

                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setRenamingNoteId(note.id);
                          setRenameTitle(note.title || '');
                        }}
                        className="p-1 text-slate-400 hover:text-blue-400 transition-colors"
                        title="Renomear"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => deleteNote(note.id)}
                        className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                        title="Deletar"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        {selectedNote ? (
          <div className="flex-1 min-h-0 flex flex-col p-8 overflow-hidden">
            {isEditing ? (
              <div className="space-y-4 flex-1 min-h-0 flex flex-col">
                <input
                  type="text"
                  value={selectedNote.title || ''}
                  onChange={(e) =>
                    setSelectedNote({ ...selectedNote, title: e.target.value })
                  }
                  className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-2xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-slate-500"
                  placeholder="Título"
                />
                <textarea
                  key={`${selectedNote.id}-content`}
                  defaultValue={selectedNote.content || ''}
                  onBlur={(e) => {
                    const newContent = e.currentTarget.value;
                    updateNote(selectedNote.id, { content: newContent });
                  }}
                  className="flex-1 p-6 bg-slate-800 border border-slate-700 rounded-xl text-white resize-none focus:outline-none focus:ring-2 focus:ring-slate-500 font-mono text-sm"
                  placeholder="Escreva suas anotações aqui..."
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      updateNote(selectedNote.id, { title: selectedNote.title });
                      setIsEditing(false);
                    }}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white font-semibold transition-colors"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg text-white font-semibold transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 flex-1 min-h-0 flex flex-col">
                <div className="flex items-center justify-between">
                  <h1 className="text-3xl font-bold text-white">{selectedNote.title || 'Sem título'}</h1>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white font-semibold transition-colors flex items-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Editar
                  </button>
                </div>

                <div className="flex-1 p-6 bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-y-auto min-h-0">
                  <pre className="whitespace-pre-wrap font-mono text-slate-300 text-sm">
                    {selectedNote.content || 'Nenhum conteúdo'}
                  </pre>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center flex-col gap-4">
            <FileText className="w-16 h-16 text-slate-500" />
            <p className="text-slate-400 text-lg">Selecione uma nota para começar</p>
            <button
              onClick={createNote}
              className="mt-4 px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg text-white font-semibold transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Criar Nova Nota
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

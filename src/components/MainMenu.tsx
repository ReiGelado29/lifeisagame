import { User, Target, BarChart3, Package, FileText, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  hoverColor: string;
}

const menuItems: MenuItem[] = [
  {
    id: 'character',
    label: 'Personagem',
    icon: <User className="w-6 h-6" />,
    color: 'from-blue-500 to-cyan-600',
    hoverColor: 'hover:from-blue-600 hover:to-cyan-700',
  },
  {
    id: 'progress',
    label: 'Contagem de Progresso',
    icon: <BarChart3 className="w-6 h-6" />,
    color: 'from-emerald-500 to-teal-600',
    hoverColor: 'hover:from-emerald-600 hover:to-teal-700',
  },
  {
    id: 'missions',
    label: 'Missões e Objetivos',
    icon: <Target className="w-6 h-6" />,
    color: 'from-orange-500 to-red-600',
    hoverColor: 'hover:from-orange-600 hover:to-red-700',
  },
  {
    id: 'inventory',
    label: 'Inventário',
    icon: <Package className="w-6 h-6" />,
    color: 'from-amber-500 to-yellow-600',
    hoverColor: 'hover:from-amber-600 hover:to-yellow-700',
  },
  {
    id: 'notepad',
    label: 'Bloco de Notas',
    icon: <FileText className="w-6 h-6" />,
    color: 'from-slate-500 to-gray-600',
    hoverColor: 'hover:from-slate-600 hover:to-gray-700',
  },
];

interface MainMenuProps {
  onSelectSection: (sectionId: string) => void;
  characterName: string;
  characterLevel: number;
}

export function MainMenu({ onSelectSection, characterName, characterLevel }: MainMenuProps) {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-12">
          <div className="inline-block mb-4 px-6 py-2 bg-slate-700/50 backdrop-blur rounded-full border border-slate-600/50">
            <span className="text-slate-300 text-sm">Level {characterLevel}</span>
          </div>
          <h1 className="text-5xl font-bold text-white mb-2 tracking-tight">
            {characterName}
          </h1>
          <p className="text-slate-400">Choose your path, adventurer</p>
        </div>

        <div className="space-y-3">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectSection(item.id)}
              className={`w-full flex items-center gap-4 p-4 bg-gradient-to-r ${item.color} ${item.hoverColor} rounded-xl text-white font-semibold text-left transition-all transform hover:scale-[1.02] hover:shadow-lg group`}
            >
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur group-hover:bg-white/30 transition-colors">
                {item.icon}
              </div>
              <span className="text-lg">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={signOut}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </div>
  );
}

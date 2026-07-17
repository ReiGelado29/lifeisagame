import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { AuthScreen } from './components/Auth';
import { MainMenu } from './components/MainMenu';
import { CharacterSection } from './components/Character';
import { ProgressTracking } from './components/ProgressTracking';
import { MissionsSection } from './components/Missions';
import { InventorySection } from './components/Inventory';
import { NotepadSection } from './components/Notepad';
import type { Character } from './types';
import { characterService } from './services';
import { calculateLevel } from './engine';

function AppContent() {
  const { user, loading } = useAuth();
  const [character, setCharacter] = useState<Character | null>(null);
  const [currentSection, setCurrentSection] = useState<string | null>(null);
  const [loadingCharacter, setLoadingCharacter] = useState(true);

  useEffect(() => {
    if (user) {
      loadCharacter();
    } else {
      setLoadingCharacter(false);
    }
  }, [user]);

  const loadCharacter = async () => {
    setLoadingCharacter(true);
    try {
      let charData = await characterService.getCharacter(user?.id || '');

      if (!charData) {
        charData = await characterService.createCharacter(user?.id || '', 'Adventurer');
      }

      setCharacter(charData);
    } catch (error) {
      console.error('Error loading character:', error);
    } finally {
      setLoadingCharacter(false);
    }
  };

  const handleSelectSection = (sectionId: string) => {
    setCurrentSection(sectionId);
  };

  const handleBack = () => {
    setCurrentSection(null);
    loadCharacter();
  };

  if (loading || loadingCharacter) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl animate-pulse" />
          <p className="text-slate-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  if (!character) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-slate-400">Criando personagem...</p>
      </div>
    );
  }

  if (currentSection === 'character') {
    return (
      <CharacterSection
        characterId={character.id}
        onBack={handleBack}
        onUpdateCharacter={setCharacter}
      />
    );
  }

  if (currentSection === 'progress') {
    return (
      <ProgressTracking
        characterId={character.id}
        onBack={handleBack}
      />
    );
  }

  if (currentSection === 'missions') {
    return (
      <MissionsSection
        characterId={character.id}
        onBack={handleBack}
      />
    );
  }

  if (currentSection === 'inventory') {
    return (
      <InventorySection
        characterId={character.id}
        onBack={handleBack}
      />
    );
  }

  if (currentSection === 'notepad') {
    return (
      <NotepadSection
        characterId={character.id}
        onBack={handleBack}
      />
    );
  }

  return (
    <MainMenu
      onSelectSection={handleSelectSection}
      characterName={character.name}
      characterLevel={calculateLevel(character.xp)}
    />
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

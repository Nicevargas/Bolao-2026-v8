import React from 'react';
import { ActiveTab } from '../types';
import { Home, Trophy, BookOpen, ShieldAlert } from 'lucide-react';

interface BottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isAdminMode: boolean;
  setIsAdminMode: (mode: boolean) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  isAdminMode,
  setIsAdminMode,
}) => {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center px-4 py-2 bg-surface/95 dark:bg-surface-container-high/95 backdrop-blur-lg border-t border-white/10 shadow-[0_-5px_20px_rgba(255,22,240,0.15)] rounded-t-xl select-none pb-safe">
      <button
        onClick={() => {
          setIsAdminMode(false);
          setActiveTab('dashboard');
        }}
        className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer ${
          !isAdminMode && activeTab === 'dashboard'
            ? 'bg-secondary-container/20 text-secondary scale-105'
            : 'text-on-surface-variant hover:text-primary active:scale-90'
        }`}
      >
        <Home size={18} />
        <span className="font-headline text-[10px] mt-1 font-bold">Início</span>
      </button>

      <button
        onClick={() => {
          setIsAdminMode(false);
          setActiveTab('matches');
        }}
        className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer ${
          !isAdminMode && activeTab === 'matches'
            ? 'bg-secondary-container/20 text-secondary scale-105'
            : 'text-on-surface-variant hover:text-primary active:scale-90'
        }`}
      >
        <BookOpen size={18} />
        <span className="font-headline text-[10px] mt-1 font-bold">Palpites</span>
      </button>

      <button
        onClick={() => {
          setIsAdminMode(false);
          setActiveTab('leaderboard');
        }}
        className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer ${
          !isAdminMode && activeTab === 'leaderboard'
            ? 'bg-secondary-container/20 text-secondary scale-105'
            : 'text-on-surface-variant hover:text-primary active:scale-90'
        }`}
      >
        <Trophy size={18} />
        <span className="font-headline text-[10px] mt-1 font-bold">Ranking</span>
      </button>

      {/* Admin quick toggle inside mobile navigation if role exists */}
      <button
        onClick={() => {
          setIsAdminMode(!isAdminMode);
          if (!isAdminMode) {
            setActiveTab('admin');
          } else {
            setActiveTab('dashboard');
          }
        }}
        className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer ${
          isAdminMode
            ? 'bg-red-500/20 text-red-400 scale-105'
            : 'text-on-surface-variant hover:text-red-400 active:scale-90'
        }`}
      >
        <ShieldAlert size={18} />
        <span className="font-headline text-[10px] mt-1 font-bold">Admin</span>
      </button>
    </nav>
  );
};

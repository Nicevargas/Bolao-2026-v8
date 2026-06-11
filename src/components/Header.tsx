import React, { useState } from 'react';
import { ActiveTab } from '../types';
import { Bell, Moon, Sun, Search, Shield, User, LogOut, Settings } from 'lucide-react';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  xpPoints: number;
  isAdminMode: boolean;
  setIsAdminMode: (mode: boolean) => void;
  activeUser: any;
  onLogout: () => void;
  onThemeToggle: (theme: 'light' | 'dark' | 'system') => void;
  currentTheme: 'light' | 'dark' | 'system';
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  xpPoints,
  isAdminMode,
  setIsAdminMode,
  activeUser,
  onLogout,
  onThemeToggle,
  currentTheme,
}) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Dynamic avatars based on active role
  const getAvatar = () => {
    return activeUser?.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuARMZAAfY7zyHup6pOg_GGaTDbvZeb7id7GqlZt33Dyt3UrEMUhJ1tIQZjJyxd_CR4c2N7rEwtot55igaxGgkpcIC6XZ2-IKs7zhnF_fGV2uHhI87XT9ohAyvhhelzSaUEUfjcX3jwKf89eXJcnHm1SfZSCW5I-khY4kAORMq-EPMDxosLHz334xuh6n5Hlonci3l0nrGdJtWbibmhoEqklFOHGNeSaIwigBcVdIylQ6XEpjTlabMJIFNSb1K9d0fPtyCb9eecmZMw';
  };

  const tabs: { label: string; value: ActiveTab }[] = [
    { label: 'Painel', value: 'dashboard' },
    { label: 'Partidas', value: 'matches' },
    { label: 'Ranking', value: 'leaderboard' },
    { label: 'Convites', value: 'invitations' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] bg-surface/85 border-b border-outline/40 shadow-md transition-all">
      <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
        {/* Brand Logo */}
        <div 
          onClick={() => { setActiveTab('dashboard'); setIsAdminMode(false); }} 
          className="flex items-center gap-3 cursor-pointer select-none group"
          id="logo-container"
        >
          <img 
            src="https://iowmvvoeecybxleoipfc.supabase.co/storage/v1/object/public/imagens/1000529284.jpg" 
            alt="Natação Criativa Logo" 
            className="w-10 h-10 rounded-full object-cover border border-primary/40 group-hover:scale-105 transition-transform"
            referrerPolicy="no-referrer"
          />
          <span className="font-headline font-black text-xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary group-hover:brightness-110 transition-all font-extrabold uppercase">
            Bolão Copa 2026
          </span>
          {isAdminMode && (
            <span className="ml-2 text-[9px] bg-red-500 text-white font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider glow-secondary">
              ADMIN
            </span>
          )}
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-6">
          {tabs.map((t) => {
            const isActive = !isAdminMode && activeTab === t.value;
            return (
              <button
                key={t.value}
                onClick={() => {
                  setIsAdminMode(false);
                  setActiveTab(t.value);
                }}
                className={`font-headline text-xs tracking-wider transition-all pb-0.5 cursor-pointer font-bold uppercase ${
                  isActive
                    ? 'text-primary border-b-2 border-primary scale-102'
                    : 'text-on-surface-variant hover:text-secondary'
                }`}
              >
                {t.label}
              </button>
            );
          })}
          {activeUser?.isAdmin && (
            <button
              onClick={() => {
                setIsAdminMode(!isAdminMode);
                if (!isAdminMode) {
                  setActiveTab('admin');
                } else {
                  setActiveTab('dashboard');
                }
              }}
              className={`font-headline text-xs tracking-wider pb-0.5 font-bold uppercase transition-all ${
                isAdminMode ? 'text-red-400 border-b-2 border-red-500' : 'text-on-surface-variant hover:text-red-400'
              }`}
            >
              Canais Admin
            </button>
          )}
        </nav>

        {/* Action Widgets */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center px-3.5 py-1.5 bg-secondary/10 border border-secondary/20 rounded-full font-headline text-xs text-secondary font-black">
            {xpPoints.toLocaleString()} XP
          </div>

          {/* Theme Switcher Cycle: light -> dark -> system */}
          <button 
            onClick={() => {
              const next: Record<string, 'light' | 'dark' | 'system'> = {
                light: 'dark',
                dark: 'system',
                system: 'light'
              };
              onThemeToggle(next[currentTheme] || 'dark');
            }}
            className="p-2 text-on-surface-variant hover:text-primary transition-all rounded-full hover:bg-white/5 active:scale-95 flex items-center justify-center"
            title={`Tema Atual: ${currentTheme === 'light' ? 'Claro' : currentTheme === 'dark' ? 'Escuro' : 'Seguir Sistema'}. Clique para mudar.`}
          >
            {currentTheme === 'light' ? (
              <Sun size={19} className="text-amber-500" />
            ) : currentTheme === 'dark' ? (
              <Moon size={19} className="text-primary" />
            ) : (
              <Settings size={18} className="text-[#9cb1cc] animate-spin" style={{ animationDuration: '6s' }} />
            )}
          </button>

          {/* Notifications button */}
          <button 
            onClick={() => alert(`Olá ${activeUser?.name}! Você tem 0 avisos pendentes.`)}
            className="p-2 text-on-surface-variant hover:text-primary transition-all rounded-full hover:bg-white/5 relative active:scale-95"
            title="Notificações"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#D91C7A] rounded-full"></span>
          </button>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="w-10 h-10 rounded-full border-2 border-primary overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer active:scale-95"
              id="avatar-button"
            >
              <img 
                alt="User avatar" 
                className="w-full h-full object-cover select-none" 
                referrerPolicy="no-referrer"
                src={getAvatar()} 
              />
            </button>

            {profileDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40 bg-transparent" 
                  onClick={() => setProfileDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 rounded-xl glass-card border border-white/10 p-2 shadow-2xl z-50 text-on-surface">
                  <div className="px-3 py-2 border-b border-white/5 mb-1 select-none">
                    <p className="font-bold text-xs truncate">{activeUser?.name || 'Felipe Rodrigo Costa'}</p>
                    <p className="text-[10px] text-on-surface-variant truncate">{activeUser?.email || '02nicevargas@gmail.com'}</p>
                    <span className="text-[9px] bg-primary/20 text-primary uppercase font-bold px-1.5 py-0.5 rounded block w-fit mt-1">
                      {activeUser?.role || 'Membro'}
                    </span>
                  </div>
                  
                  {activeUser?.isAdmin && (
                    <button
                      onClick={() => {
                        setIsAdminMode(!isAdminMode);
                        if (!isAdminMode) {
                          setActiveTab('admin');
                        } else {
                          setActiveTab('dashboard');
                        }
                        setProfileDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs tracking-wide transition-all hover:bg-white/5 uppercase font-bold ${isAdminMode ? 'text-red-400 bg-red-500/10' : 'text-on-surface'}`}
                    >
                      <Shield size={14} className={isAdminMode ? 'text-red-400' : 'text-on-surface-variant'} />
                      <span>{isAdminMode ? 'Visão Membro' : 'Painel Admin'}</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      onLogout();
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded-lg text-xs text-error hover:bg-error/10 transition-all mt-1 uppercase font-bold"
                  >
                    <LogOut size={14} />
                    <span>Sair da Conta</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

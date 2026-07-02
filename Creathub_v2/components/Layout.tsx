
import React, { useState } from 'react';
import { ViewType } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewType;
  setView: (view: ViewType) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, setView }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const NavItem = ({ view, icon, label, isNew, isHot }: { view: ViewType, icon: string, label: string, isNew?: boolean, isHot?: boolean }) => (
    <button 
      onClick={() => {
        setView(view);
        setIsSidebarOpen(false);
      }}
      className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-300 ${
        currentView === view 
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
      }`}
    >
      <div className="flex items-center gap-3">
        <i className={`fa-solid ${icon} w-5 text-center`}></i>
        <span>{label}</span>
      </div>
      {isNew && (
        <span className="bg-emerald-500 text-[8px] px-1.5 py-0.5 rounded text-white font-black uppercase tracking-tighter">Novo</span>
      )}
      {isHot && (
        <span className="bg-orange-500 text-[8px] px-1.5 py-0.5 rounded text-white font-black uppercase tracking-tighter">Hot</span>
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row overflow-hidden text-slate-200">
      
      {/* MOBILE HEADER */}
      <header className="lg:hidden glass border-b border-slate-800 px-4 py-3 flex items-center justify-between z-50">
        <div className="flex items-center gap-2" onClick={() => setView('gallery')}>
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <i className="fa-solid fa-wand-magic-sparkles text-white text-xs"></i>
          </div>
          <span className="font-black text-white tracking-tight">IA-Video</span>
        </div>
        
        <button 
          onClick={toggleSidebar}
          className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          <i className={`fa-solid ${isSidebarOpen ? 'fa-xmark' : 'fa-bars-staggered'} text-xl`}></i>
        </button>
      </header>

      {/* SIDEBAR */}
      <aside className={`
        fixed inset-y-0 left-0 z-[60] w-72 glass border-r border-slate-800 transform transition-transform duration-500 ease-in-out lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col p-6 space-y-8 overflow-y-auto">
          
          <div className="hidden lg:flex items-center gap-3 px-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <i className="fa-solid fa-wand-magic-sparkles text-white"></i>
            </div>
            <div className="flex flex-col">
              <span className="font-black text-white leading-none tracking-tight">IA-Video Hub</span>
              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Open Studio</span>
            </div>
          </div>

          <div className="flex-1 space-y-2">
            <span className="text-[10px] text-slate-600 font-black uppercase tracking-[0.2em] px-4 block mb-4">Navegação</span>
            <NavItem view="gallery" icon="fa-th-large" label="Explorar Galeria" />
            <NavItem view="create" icon="fa-circle-plus" label="Gerar com IA" />
            <NavItem view="my-videos" icon="fa-clapperboard" label="Minha Coleção" />
            <NavItem view="scheduler" icon="fa-calendar-check" label="Agendar Posts" isNew />
            
            <div className="pt-4 mt-4 border-t border-slate-800/50">
               <span className="text-[10px] text-slate-600 font-black uppercase tracking-[0.2em] px-4 block mb-4">Conta</span>
               <NavItem view="store" icon="fa-coins" label="Comprar Créditos" isHot />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800/50">
            <p className="text-[9px] text-slate-600 text-center uppercase font-black tracking-widest">
              Acesso Profissional Ilimitado
            </p>
          </div>
        </div>
      </aside>

      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[55] lg:hidden animate-in fade-in duration-300"
          onClick={toggleSidebar}
        ></div>
      )}

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-8 lg:px-12">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;

import React from 'react';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Dribbble, 
  Settings, 
  HelpCircle, 
  LogOut, 
  FileText 
} from 'lucide-react';

interface SidebarProps {
  currentSubView: string;
  setCurrentSubView: (view: string) => void;
  onExportReport: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentSubView,
  setCurrentSubView,
  onExportReport,
  onLogout,
}) => {
  const adminMenuItems = [
    { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'companies', label: 'Empresas', icon: Building2 },
    { id: 'users', label: 'Gestão de Usuários', icon: Users },
    { id: 'matchConfig', label: 'Configuração de Jogos', icon: Dribbble },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex flex-col h-screen w-64 fixed left-0 top-0 bg-surface-container dark:bg-surface-container-lowest border-r border-outline-variant/30 py-6 pt-24 z-50 transition-all">
      {/* Title */}
      <div className="px-6 mb-8 select-none">
        <h2 className="font-headline text-lg font-black text-on-surface">Painel de Admin</h2>
        <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
          Edição Copa do Mundo 2026
        </p>
      </div>

      {/* Nav Menu Items */}
      <nav className="flex-grow space-y-1 select-none">
        {adminMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentSubView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentSubView(item.id)}
              className={`w-full flex items-center px-4 py-3 mx-2 rounded-lg text-sm transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-primary-container text-on-primary-container font-headline font-bold scale-[1.02]'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:translate-x-1'
              }`}
            >
              <Icon size={18} className="mr-3" />
              <span className="font-bold">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer Operations */}
      <div className="mx-4 pb-6 space-y-4 select-none">
        <button 
          onClick={onExportReport}
          className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-on-primary font-headline font-black rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all text-xs tracking-wider cursor-pointer font-bold"
        >
          EXPORTAR RELATÓRIO
        </button>

        <div className="border-t border-outline-variant/20 pt-4 space-y-1">
          <button 
            onClick={() => alert('Sistema de suporte ativo. Um atendente ao vivo responderá em breve.')}
            className="w-full flex items-center px-4 py-2 text-on-surface-variant hover:text-primary rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            <HelpCircle size={14} className="mr-2" />
            <span>Central de Ajuda</span>
          </button>
          <button 
            onClick={onLogout}
            className="w-full flex items-center px-4 py-2 text-error hover:bg-error/10 rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            <LogOut size={14} className="mr-2" />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

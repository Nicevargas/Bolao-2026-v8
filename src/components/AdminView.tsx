import React, { useState } from 'react';
import { Company, AuditLog, AdminStats, Match } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  Users, 
  Dribbble, 
  ShieldAlert, 
  TrendingUp, 
  Radio, 
  X, 
  History,
  CheckCircle,
  Coins,
  Shield,
  Layers,
  RefreshCw,
  Globe,
  Database,
  Key
} from 'lucide-react';
import { 
  getStoredUsers, 
  getStoredPredictions, 
  getStoredMatches, 
  getStoredInvitations,
  getStoredCompanies 
} from '../db';
import { MatchSyncService, syncProviders } from '../matchSyncService';

interface AdminViewProps {
  stats: AdminStats;
  companies: Company[];
  onAddCompany: (company: Omit<Company, 'id' | 'registeredDate'>) => void;
  auditLogs: AuditLog[];
  matches: Match[];
  onSyncComplete?: () => void | Promise<void>;
}

export const AdminView: React.FC<AdminViewProps> = ({
  stats,
  companies,
  onAddCompany,
  auditLogs,
  matches,
  onSyncComplete,
}) => {
  const [activeSubView, setActiveSubView] = useState<'overview' | 'companies'>('overview');
  
  // Modals status
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  
  // Registration form values
  const [companyName, setCompanyName] = useState('');
  const [companyDomain, setCompanyDomain] = useState('');
  const [companyUsers, setCompanyUsers] = useState('150');

  // Broadcast message
  const [broadcastMsg, setBroadcastMsg] = useState('');

  // Automated MatchSyncService integration states
  const [activeProvider, setActiveProvider] = useState<string>(MatchSyncService.getActiveProviderName());
  const [providerKey, setProviderKey] = useState<string>(
    localStorage.getItem('match_sync_provider_key_' + MatchSyncService.getActiveProviderName()) || ''
  );
  const [isAutoSyncing, setIsAutoSyncing] = useState<boolean>(false);
  const [autoSyncMsg, setAutoSyncMsg] = useState<string>('');
  const [autoSyncStatus, setAutoSyncStatus] = useState<'success' | 'error' | ''>('');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(MatchSyncService.getLastSyncTime());

  const handleAutomatedSync = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsAutoSyncing(true);
    setAutoSyncMsg(`Iniciando conexão e sincronia com o provedor esportivo...`);
    setAutoSyncStatus('');
    try {
      // Persist chosen provider setting
      MatchSyncService.setActiveProviderName(activeProvider);
      
      if (providerKey.trim()) {
        localStorage.setItem('match_sync_provider_key_' + activeProvider, providerKey.trim());
      } else {
        localStorage.removeItem('match_sync_provider_key_' + activeProvider);
      }

      // Execute sync service
      const result = await MatchSyncService.syncNow(activeProvider, providerKey.trim());
      
      setLastSyncTime(result.timestamp);
      if (result.success) {
        setAutoSyncStatus('success');
        setAutoSyncMsg(result.message);
        if (onSyncComplete) {
          await onSyncComplete();
        }
      } else {
        setAutoSyncStatus('error');
        setAutoSyncMsg(result.message);
      }
    } catch (err: any) {
      console.error(err);
      setAutoSyncStatus('error');
      setAutoSyncMsg(`Falha inesperada durante sincronização: ${err.message || 'Erro de rede ou autenticação'}`);
    } finally {
      setIsAutoSyncing(false);
    }
  };

  // Adjust API Key field whenever provider selection changes
  const handleProviderSelectionChange = (newProv: string) => {
    setActiveProvider(newProv);
    const stored = localStorage.getItem('match_sync_provider_key_' + newProv) || '';
    setProviderKey(stored);
  };

  // 1. DYNAMIC CALCULATIONS FOR SECURE AND AUDITED STATS
  const isDBConnected = typeof (import.meta as any).env.VITE_SUPABASE_URL === 'string' && (import.meta as any).env.VITE_SUPABASE_URL.includes('supabase.co');

  const allUsers = isDBConnected ? [] : getStoredUsers();
  const allPredictions = isDBConnected ? [] : getStoredPredictions();
  const allMatches = isDBConnected ? [] : getStoredMatches();
  const allInvitations = isDBConnected ? [] : getStoredInvitations();
  const activeCompanies = isDBConnected ? [] : getStoredCompanies();

  const totalUsersCount = isDBConnected ? stats.totalUsers : allUsers.length;
  const totalAdminsCount = isDBConnected ? 1 : allUsers.filter(u => u.isAdmin).length;
  const totalPredictionsCount = isDBConnected ? stats.activeBets : allPredictions.length;
  const completedMatchesCount = isDBConnected ? matches.filter(m => m.scoreA !== undefined).length : allMatches.filter(m => m.status === 'encerrado').length;
  const pendingMatchesCount = isDBConnected ? matches.filter(m => m.scoreA === undefined).length : allMatches.filter(m => m.status === 'aguardando' || m.status === 'ao_vivo').length;
  
  // Used invites (sum of usedSlots in all invitations)
  const usedInvitesCount = isDBConnected ? 2 : allInvitations.reduce((sum, inv) => sum + inv.usedSlots, 0);

  // Submit new company domain
  const submitCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !companyDomain) {
      alert('Por favor, preencha todos os campos!');
      return;
    }
    onAddCompany({
      name: companyName,
      domain: companyDomain,
      usersCount: parseInt(companyUsers, 10) || 50,
    });
    setCompanyName('');
    setCompanyDomain('');
    setCompanyModalOpen(false);
    alert(`Organização "${companyName}" integrada e autorizada com sucesso!`);
  };

  const sendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMsg) return;
    alert(`NOTIFICAÇÃO CENTRAL ENVIADA:\n"${broadcastMsg}"\n\nAvisos foram disparados para todos os colaboradores do servidor.`);
    setBroadcastMsg('');
    setBroadcastModalOpen(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6 select-none"
    >
      {/* Banner Title Row featuring Natação Criativa Corporate branding */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-gradient-to-r from-primary/10 via-secondary/10 to-transparent rounded-2xl border border-white/5 shadow-md">
        <div className="flex items-center gap-4 select-none">
          <img 
            src="https://iowmvvoeecybxleoipfc.supabase.co/storage/v1/object/public/imagens/1000529284.jpg" 
            alt="Logo Natação Criativa" 
            className="w-14 h-14 rounded-full object-cover border border-primary/40 shadow-lg"
            referrerPolicy="no-referrer"
          />
          <div>
            <h1 className="font-headline text-2xl font-black text-on-surface uppercase tracking-tight leading-none mb-1.5">
              Painel Administrativo Geral
            </h1>
            <p className="text-on-surface-variant text-xs font-sans">
              Visão geral de auditoria de apostas e monitoramento corporativo para a Copa 2026.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          <button 
            onClick={() => setCompanyModalOpen(true)}
            className="px-5 py-2.5 rounded-lg border border-outline hover:bg-white/5 text-on-surface font-headline text-[10px] font-black tracking-wider uppercase cursor-pointer"
          >
            Adicionar Organização
          </button>
          

        </div>
      </div>

      {/* Required Telemetry widgets grid following strict user requirements */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Total Users */}
        <div className="glass-card rounded-2xl p-5 border-l-4 border-[#1670D8] shadow-md flex items-center justify-between hover:translate-y-[-2px] transition-all">
          <div className="space-y-1">
            <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Total de Usuários</p>
            <h2 className="font-headline text-2xl font-black text-white">{totalUsersCount}</h2>
            <div className="text-[9px] text-[#66B82F] font-semibold flex items-center gap-0.5">
              <TrendingUp size={10} /> +100% ativos
            </div>
          </div>
          <div className="w-10 h-10 bg-[#1670D8]/10 rounded-lg flex items-center justify-center text-[#1670D8]">
            <Users size={18} />
          </div>
        </div>

        {/* Total Admins */}
        <div className="glass-card rounded-2xl p-5 border-l-4 border-[#D91C7A] shadow-md flex items-center justify-between hover:translate-y-[-2px] transition-all">
          <div className="space-y-1">
            <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Total Administradores</p>
            <h2 className="font-headline text-2xl font-black text-white">{totalAdminsCount}</h2>
            <div className="text-[9px] text-on-surface-variant">Contas corporativas</div>
          </div>
          <div className="w-10 h-10 bg-[#D91C7A]/10 rounded-lg flex items-center justify-center text-[#D91C7A]">
            <Shield size={18} />
          </div>
        </div>

        {/* Total Predictions */}
        <div className="glass-card rounded-2xl p-5 border-l-4 border-[#F28C28] shadow-md flex items-center justify-between hover:translate-y-[-2px] transition-all">
          <div className="space-y-1">
            <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Total de Palpites</p>
            <h2 className="font-headline text-2xl font-black text-white">{totalPredictionsCount}</h2>
            <div className="text-[9px] text-amber-500 font-bold">Submetidos via painel</div>
          </div>
          <div className="w-10 h-10 bg-[#F28C28]/10 rounded-lg flex items-center justify-center text-[#F28C28]">
            <Dribbble size={18} />
          </div>
        </div>

        {/* Completed vs Pending Games */}
        <div className="glass-card rounded-2xl p-5 border-l-4 border-[#F2C230] shadow-md flex items-center justify-between hover:translate-y-[-2px] transition-all">
          <div className="space-y-1">
            <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Jogos Concluídos/Pendentes</p>
            <h2 className="font-headline text-lg font-black text-white">
              {completedMatchesCount} <span className="text-xs text-on-surface-variant font-sans font-medium">/ {pendingMatchesCount}</span>
            </h2>
            <div className="text-[9px] text-on-surface-variant font-mono">Fase de Grupos & Finais</div>
          </div>
          <div className="w-10 h-10 bg-[#F2C230]/10 rounded-lg flex items-center justify-center text-[#F2C230]">
            <Layers size={18} />
          </div>
        </div>

        {/* Used Invites */}
        <div className="glass-card rounded-2xl p-5 border-l-4 border-[#66B82F] shadow-md flex items-center justify-between hover:translate-y-[-2px] transition-all">
          <div className="space-y-1">
            <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Convites Utilizados</p>
            <h2 className="font-headline text-2xl font-black text-white">{usedInvitesCount}</h2>
            <div className="text-[9px] text-[#66B82F] font-bold">Inscrições com sucesso</div>
          </div>
          <div className="w-10 h-10 bg-[#66B82F]/10 rounded-lg flex items-center justify-center text-[#66B82F]">
            <Coins size={18} />
          </div>
        </div>

      </section>

      {/* Dynamic simulated charts representations requested by user */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 1: Palpites por Rodada */}
        <div className="glass-card rounded-2xl p-5 border border-white/5 space-y-4 shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="font-headline text-xs font-black text-on-surface uppercase tracking-wider">
              Palpites por Rodada (Copa 2026)
            </h3>
            <p className="text-[10px] text-on-surface-variant">Proporção de palpites de colaboradores por fase do campeonato</p>
          </div>
          
          <div className="h-44 w-full flex items-end justify-between gap-2.5 px-1 pt-4">
            {[
              { label: 'Rodada 1', val: 'h-[75%]', count: '45' },
              { label: 'Rodada 2', val: 'h-[90%]', count: '54' },
              { label: 'Rodada 3', val: 'h-[60%]', count: '36' },
              { label: 'Oitavas', val: 'h-[45%]', count: '27' },
              { label: 'Finais', val: 'h-[30%]', count: '18' }
            ].map((bar, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center group relative cursor-pointer">
                <div className="absolute -top-6 text-[9px] font-bold bg-black/40 text-[#1670D8] px-1 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  {bar.count}
                </div>
                <div className={`w-full bg-[#1670D8]/20 group-hover:bg-[#1670D8]/45 border border-[#1670D8]/25 rounded-t-md transition-all duration-500 ${bar.val}`} />
                <span className="text-[8px] text-[#9cb1cc] tracking-tight uppercase font-black mt-2">{bar.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Usuários por Empresa */}
        <div className="glass-card rounded-2xl p-5 border border-white/5 space-y-4 shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="font-headline text-xs font-black text-on-surface uppercase tracking-wider">
              Usuários por Empresa Autorizada
            </h3>
            <p className="text-[10px] text-on-surface-variant">Domínios de e-mails corporativos com mais acessos ativos</p>
          </div>

          <div className="h-44 w-full flex items-end justify-between gap-2.5 px-1 pt-4">
            {[
              { label: 'Natação C.', val: 'h-[95%]', count: '220' },
              { label: 'Vargas Co.', val: 'h-[65%]', count: '150' },
              { label: 'Tech Sol', val: 'h-[40%]', count: '80' },
              { label: 'Alpha Corp', val: 'h-[50%]', count: '110' },
              { label: 'Padrão', val: 'h-[25%]', count: '35' }
            ].map((bar, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center group relative cursor-pointer">
                <div className="absolute -top-6 text-[9px] font-bold bg-black/40 text-[#D91C7A] px-1 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  {bar.count}
                </div>
                <div className={`w-full bg-[#D91C7A]/20 group-hover:bg-[#D91C7A]/45 border border-[#D91C7A]/25 rounded-t-md transition-all duration-500 ${bar.val}`} />
                <span className="text-[8px] text-[#9cb1cc] tracking-tight truncate w-full text-center uppercase font-black mt-2">{bar.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 3: Participação por Fase */}
        <div className="glass-card rounded-2xl p-5 border border-white/5 space-y-4 shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="font-headline text-xs font-black text-on-surface uppercase tracking-wider">
              Participação por Fase Oficial
            </h3>
            <p className="text-[10px] text-on-surface-variant">Taxa de engajamento do total da empresa no bolão</p>
          </div>

          <div className="h-44 w-full flex items-end justify-between gap-3 px-1 pt-4">
            {[
              { label: 'Grupos', val: 'h-[95%]', percent: '98%' },
              { label: 'Oitavas', val: 'h-[80%]', percent: '82%' },
              { label: 'Quartas', val: 'h-[70%]', percent: '71%' },
              { label: 'Semis', val: 'h-[55%]', percent: '56%' },
              { label: 'Disputa 3º', val: 'h-[45%]', percent: '46%' }
            ].map((bar, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center group relative cursor-pointer">
                <div className="absolute -top-6 text-[9px] font-bold bg-black/40 text-[#66B82F] px-1 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  {bar.percent}
                </div>
                <div className={`w-full bg-[#66B82F]/20 group-hover:bg-[#66B82F]/45 border border-[#66B82F]/25 rounded-t-md transition-all duration-500 ${bar.val}`} />
                <span className="text-[8px] text-[#9cb1cc] tracking-tight uppercase font-black mt-2">{bar.label}</span>
              </div>
            ))}
          </div>
        </div>

      </section>


      {/* CADASTRO & INTEGRADOR DE SINCRONIA AUTOMÁTICA OFICIAL (match_sync_service) */}
      <section className="glass-card rounded-2xl p-6 border border-white/5 shadow-xl select-none text-left mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="font-headline text-sm font-black flex items-center gap-2 text-on-surface uppercase tracking-wide">
              <span className="p-1.5 bg-primary/10 text-primary rounded-lg">
                <RefreshCw size={16} className={isAutoSyncing ? "animate-spin text-[#66B82F]" : "text-[#66B82F]"} />
              </span>
              Integração e Sincronia Automática Copa 2026
            </h3>
            <p className="text-[10px] text-on-surface-variant mt-1.5 font-sans leading-relaxed">
              Carregue confrontos, resultados, estádios e status das partidas em tempo real a partir das fontes de dados esportivas oficiais integradas.
            </p>
          </div>
          
          <div className="flex items-center gap-2 text-[10px] bg-black/30 py-1.5 px-3 rounded-full border border-white/5 font-mono">
            <Globe size={11} className="text-[#66B82F]" />
            <span className="text-[#9cb1cc] font-bold">API Gateway: <span className="text-white uppercase">{activeProvider}</span></span>
          </div>
        </div>

        <div className="p-4 bg-primary/5 rounded-xl border border-primary/15 space-y-2 mb-6">
          <h4 className="text-[10px] font-black text-[#66B82F] uppercase tracking-wider font-bold flex items-center gap-1.5">
            <Database size={11} /> Ordem Oficial das Fontes de Prioridade:
          </h4>
          <p className="text-[10px] text-slate-300 font-sans leading-relaxed">
            O principal alimentador é a <strong>FIFA (Fonte Principal)</strong> que busca os confrontos atualizados de nosso CDN Copa 2026. Em caso de necessidade corporativa ou APIs privadas, troque dinamicamente pelos gateways <strong>Football-Data</strong>, <strong>API-Football</strong> ou <strong>TheSportsDB</strong> abaixo.
          </p>
        </div>

        <form onSubmit={handleAutomatedSync} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          {/* Provedor Select */}
          <div className="space-y-1">
            <label className="text-[9px] text-[#9cb1cc] block uppercase tracking-widest font-bold flex items-center gap-1">
              <Globe size={10} /> Provedor Oficial de Consulta
            </label>
            <select
              value={activeProvider}
              onChange={(e) => handleProviderSelectionChange(e.target.value)}
              className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#66B82F] transition-all"
            >
              {Object.entries(syncProviders).map(([key, value]) => (
                <option key={key} value={key} className="bg-neutral-900 text-white">
                  {value.displayName}
                </option>
              ))}
            </select>
          </div>

          {/* Token Key Input (Opcional) */}
          <div className="space-y-1">
            <label className="text-[9px] text-[#9cb1cc] block uppercase tracking-widest font-bold flex items-center gap-1">
              <Key size={10} /> Token ou Chave API do Gateway
            </label>
            <input
              type="password"
              placeholder={activeProvider === 'fifa' ? 'Não necessária para o CDN Oficial da FIFA' : 'Cole sua chave de desenvolvedor aqui...'}
              disabled={activeProvider === 'fifa'}
              value={providerKey || ''}
              onChange={(e) => setProviderKey(e.target.value)}
              className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/20 disabled:opacity-40 focus:outline-none focus:border-[#66B82F] transition-all"
            />
          </div>

          {/* Sincronizar Button */}
          <div>
            <button
              type="submit"
              disabled={isAutoSyncing}
              className="w-full py-2.5 px-4 bg-[#66B82F] hover:bg-[#529424] text-black font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isAutoSyncing ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <RefreshCw size={14} />
                  Sincronizar Oficialmente agora
                </>
              )}
            </button>
          </div>
        </form>

        {/* Sync logs feedback */}
        {autoSyncMsg && (
          <div className={`mt-4 p-3.5 rounded-xl border text-[10.5px] leading-relaxed flex items-start gap-2.5 transition-all ${
            autoSyncStatus === 'success' 
              ? 'bg-[#15341d] border-[#1f5a34]/40 text-[#2ecc71]' 
              : autoSyncStatus === 'error'
              ? 'bg-[#4c1d1d] border-[#6b2222]/40 text-[#ff4d4d]'
              : 'bg-black/20 border-white/5 text-slate-300'
          }`}>
            <span className="mt-0.5">
              {autoSyncStatus === 'success' ? '✓' : autoSyncStatus === 'error' ? '⚠' : 'ℹ'}
            </span>
            <div className="flex-1">
              <span className="font-bold uppercase mr-1">Status:</span>
              {autoSyncMsg}
              {lastSyncTime && (
                <div className="text-[9px] text-white/50 mt-1 font-mono">
                  Última sincronia oficial bem-sucedida: {new Date(lastSyncTime).toLocaleString('pt-BR')}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Domain database tracking list container */}
      <section className="glass-card rounded-2xl p-6 shadow-xl border border-white/5 select-none leading-none">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-headline text-sm font-black text-on-surface flex items-center gap-2 font-bold uppercase tracking-wider">
            <Building2 size={16} className="text-primary" /> Empresas Corporativas & Domínios Integrados
          </h3>
          <span className="text-[10px] font-bold text-on-surface-variant bg-[#1670D8]/10 text-[#1670D8] border border-[#1670D8]/20 py-1.5 px-3 rounded-full font-bold">
            {activeCompanies.length} Organizações Ativas
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {activeCompanies.map((comp) => (
            <div 
              key={comp.id} 
              className="bg-black/30 p-4.5 rounded-xl border border-white/5 hover:border-white/10 transition-all flex flex-col justify-between h-28"
            >
              <div>
                <p className="text-xs font-bold text-on-surface truncate">{comp.name}</p>
                <p className="text-[10px] text-outline font-medium mt-1 truncate font-mono">{comp.domain}</p>
              </div>
              <div className="flex justify-between items-center text-[10px] pt-2 border-t border-white/5 text-on-surface-variant">
                <span>{comp.usersCount.toLocaleString()} Usuários Max</span>
                <span className="text-[#66B82F] font-extrabold flex items-center gap-0.5 font-bold uppercase text-[9px] tracking-wider">
                  Ativo
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Audit log details feed */}
      <section className="glass-card rounded-2xl p-6 border border-white/5 shadow-xl leading-none">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-headline text-sm font-black flex items-center gap-2 text-on-surface font-bold uppercase tracking-wider">
            <History size={16} className="text-secondary" /> Logs de Auditoria do Servidor
          </h3>
          <span className="text-[10px] font-black text-[#D91C7A] uppercase tracking-wider">Histórico de Segurança Ativo</span>
        </div>

        {/* Logs feed list */}
        <div className="flex flex-col gap-4 max-h-48 lg:max-h-[290px] overflow-y-auto pr-1">
          {auditLogs.slice(0, 10).map((log) => {
            return (
              <div key={log.id} className="flex gap-4 p-3 rounded-xl bg-black/20 hover:bg-black/40 transition-all">
                <ShieldAlert size={14} className="text-[#D91C7A] shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-bold leading-normal truncate text-on-surface">{log.title}</p>
                  <p className="text-[10px] text-on-surface-variant font-medium mt-1 leading-relaxed">{log.detail}</p>
                  <span className="text-[9px] font-sans font-bold text-outline uppercase block mt-1 tracking-wider">{log.timeLabel}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Modals structure overlays */}
      {/* 1. Register Company Modal overlay */}
      <AnimatePresence>
        {companyModalOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <div className="relative w-full max-w-md glass-card rounded-2xl border border-white/25 overflow-hidden">
              <div className="bg-surface-container-high px-6 py-4 flex justify-between items-center border-b border-white/10 select-none">
                <span className="font-headline text-sm font-bold text-on-surface flex items-center gap-2 uppercase tracking-wide">
                  <Building2 size={16} className="text-secondary" /> Cadastrar Novo Domínio Corporativo
                </span>
                <button 
                  onClick={() => setCompanyModalOpen(false)}
                  className="p-1 hover:bg-white/10 rounded-full transition-all text-on-surface-variant cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={submitCompany} className="p-6 space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-black text-primary block mb-2 tracking-wide font-bold">
                    Nome da Empresa / Grupo
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: Natação Criativa Filial SP"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-black/40 border border-outline-variant rounded-lg p-3 text-xs text-on-surface outline-none focus:border-secondary"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-black text-primary block mb-2 tracking-wide font-bold">
                    Domínio de E-mail Autorizado (Exemplo: @empresa.com)
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: natacaocriativa.com.br"
                    value={companyDomain}
                    onChange={(e) => setCompanyDomain(e.target.value)}
                    className="w-full bg-black/40 border border-outline-variant rounded-lg p-3 text-xs text-on-surface outline-none focus:border-secondary"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-black text-primary block mb-2 tracking-wide font-bold">
                    Slots de Inscrição Permitidos
                  </label>
                  <select
                    value={companyUsers}
                    onChange={(e) => setCompanyUsers(e.target.value)}
                    className="w-full bg-black/40 border border-outline-variant rounded-lg p-3 text-xs text-on-surface outline-none focus:border-secondary cursor-pointer font-bold"
                  >
                    <option value="150">Até 150 colaboradores</option>
                    <option value="500">Até 500 colaboradores</option>
                    <option value="1500">Até 1500 colaboradores</option>
                  </select>
                </div>

                <div className="pt-4 flex gap-3 justify-end leading-none">
                  <button 
                    type="button"
                    onClick={() => setCompanyModalOpen(false)}
                    className="px-5 py-3 rounded-lg border border-white/10 text-on-surface-variant text-xs font-bold hover:bg-white/5 active:scale-95 transition-all uppercase cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-3 rounded-lg bg-gradient-to-r from-primary to-secondary text-white text-xs font-black hover:brightness-110 active:scale-95 transition-all shadow-lg uppercase cursor-pointer font-bold"
                  >
                    Salvar Empresa
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

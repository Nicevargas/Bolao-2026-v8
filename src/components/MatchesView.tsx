import React, { useState } from 'react';
import { Match } from '../types';
import { motion } from 'motion/react';
import { 
  Lock, 
  Unlock, 
  MapPin, 
  Calendar,
  CheckCircle,
  Clock,
  Sparkles,
  ChevronDown,
  LayoutGrid,
  TableProperties,
  AlertTriangle,
  Play
} from 'lucide-react';
import { getActiveUser } from '../db';

interface MatchesViewProps {
  matches: Match[];
  onSavePrediction: (matchId: string, scoreA: number, scoreB: number) => void;
  xpPoints: number;
}

export const MatchesView: React.FC<MatchesViewProps> = ({
  matches,
  onSavePrediction,
  xpPoints,
}) => {
  const activeUser = getActiveUser();
  const [selectedPhase, setSelectedPhase] = useState<string>('Todos');
  const [selectedRoundFilter, setSelectedRoundFilter] = useState<string>('Todos');
  const [activityMode, setActivityMode] = useState<'all' | 'myBets'>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table'); // Default to exact table visual match!
  
  // Temporary prediction inputs storage
  const [predictions, setPredictions] = useState<Record<string, { scoreA: string; scoreB: string }>>({});

  const handleScoreChange = (matchId: string, team: 'A' | 'B', val: string) => {
    // Only allow whole positive integers
    const sanitizedVal = val.replace(/[^0-9]/g, '');
    setPredictions(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [`score${team}`]: sanitizedVal,
      }
    }));
  };

  const handleSave = (matchId: string) => {
    const scoreAStr = predictions[matchId]?.scoreA;
    const scoreBStr = predictions[matchId]?.scoreB;

    if (scoreAStr === undefined || scoreBStr === undefined || scoreAStr === '' || scoreBStr === '') {
      alert('Por favor, insira o placar de ambas as seleções para salvar seu palpite!');
      return;
    }

    const valA = parseInt(scoreAStr, 10);
    const valB = parseInt(scoreBStr, 10);

    onSavePrediction(matchId, valA, valB);
  };

  // Groupings requested by user
  const phases = [
    'Todos',
    'Fase de Grupos',
    'Oitavas de Final',
    'Quartas de Final',
    'Semifinal',
    'Disputa de Terceiro Lugar',
    'Final'
  ];

  // Filter matches matching selections
  const filteredMatches = matches.filter(match => {
    // Phase filtering
    if (selectedPhase !== 'Todos' && match.teamA.info !== selectedPhase && !match.id.includes(selectedPhase)) {
      // Custom heuristic match
      const label = match.teamA.info || '';
      if (!label.toLowerCase().includes(selectedPhase.toLowerCase())) {
        return false;
      }
    }

    // Round filtering
    if (selectedRoundFilter !== 'Todos' && !match.id.includes(selectedRoundFilter)) {
      // check if phase name or subtitle match
      const roundLabel = match.teamA.info || '';
      if (!roundLabel.toLowerCase().includes(selectedRoundFilter.toLowerCase())) {
        return false;
      }
    }

    // Bets filtering
    if (activityMode === 'myBets') {
      return match.userBet !== undefined;
    }

    return true;
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6"
    >
      {/* Title block with brand logo prefix */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-gradient-to-r from-primary/15 via-secondary/10 to-transparent rounded-2xl border border-white/5 shadow-md">
        <div className="flex items-center gap-4 select-none">
          <img 
            src="https://iowmvvoeecybxleoipfc.supabase.co/storage/v1/object/public/imagens/1000529284.jpg" 
            alt="Logo Oficial Natação Criativa" 
            className="w-14 h-14 rounded-full object-cover border border-primary/40 shadow-lg"
            referrerPolicy="no-referrer"
          />
          <div>
            <h1 className="font-headline text-2xl font-black text-on-surface uppercase tracking-tight leading-none mb-1.5">
              Grade de Partidas & Apostas
            </h1>
            <p className="text-on-surface-variant text-xs font-sans">
              As partidas estão organizadas por fases oficiais da Copa 2026. Fechamento automático no horário correspondente!
            </p>
          </div>
        </div>
        
        {/* View Mode selection */}
        <div className="flex bg-surface-container rounded-xl p-1 shrink-0 self-start md:self-center select-none">
          <button
            onClick={() => setViewMode('table')}
            className={`px-4 py-2 text-xs font-bold font-headline rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'table' ? 'bg-[#1670D8] text-white shadow-md' : 'text-on-surface-variant hover:text-white'
            }`}
          >
            <TableProperties size={14} />
            <span>Tabela Planilha</span>
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={`px-4 py-2 text-xs font-bold font-headline rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'cards' ? 'bg-[#1670D8] text-white shadow-md' : 'text-on-surface-variant hover:text-white'
            }`}
          >
            <LayoutGrid size={14} />
            <span>Painel Palpites</span>
          </button>
        </div>
      </div>

      {/* Filters selectors bento bar */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end select-none bg-surface-container/40 p-4 rounded-xl border border-white/5">
        
        {/* Phase Filter selector */}
        <div className="md:col-span-4">
          <label className="text-[10px] font-black uppercase tracking-wider text-primary block mb-2 font-bold">
            Filtrar por Fase da Copa
          </label>
          <div className="relative">
            <select 
              value={selectedPhase}
              onChange={(e) => setSelectedPhase(e.target.value)}
              className="w-full bg-black/40 border border-white/10 text-on-surface text-xs font-semibold p-3 rounded-xl focus:border-secondary outline-none cursor-pointer appearance-none"
            >
              {phases.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant" />
          </div>
        </div>

        {/* My Activity Filter buttons */}
        <div className="md:col-span-4">
          <label className="text-[10px] font-black uppercase tracking-wider text-primary block mb-2 font-bold">
            Filtros Rapidos de Palpites
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => setActivityMode('all')}
              className={`py-3 text-[10px] tracking-wider uppercase font-headline font-black rounded-xl active:scale-95 transition-all cursor-pointer ${
                activityMode === 'all'
                  ? 'bg-[#D91C7A] text-white font-bold'
                  : 'bg-black/30 text-on-surface-variant hover:text-white border border-white/5'
              }`}
            >
              Ver Todos
            </button>
            <button 
              onClick={() => setActivityMode('myBets')}
              className={`py-3 text-[10px] tracking-wider uppercase font-headline font-black rounded-xl active:scale-95 transition-all cursor-pointer ${
                activityMode === 'myBets'
                  ? 'bg-[#D91C7A] text-white font-bold'
                  : 'bg-black/30 text-on-surface-variant hover:text-white border border-white/5'
              }`}
            >
              Meus Ativos
            </button>
          </div>
        </div>

        {/* Current User XP Display */}
        <div className="md:col-span-4 flex items-center justify-end">
          <div className="bg-secondary/10 border border-secondary/20 rounded-xl px-5 py-2.5 text-right flex items-center gap-3 w-full justify-between">
            <span className="text-[10px] text-secondary font-headline font-black uppercase tracking-widest text-[#D91C7A] font-bold">
              ESTADO PARTICIPANTE
            </span>
            <span className="font-headline text-sm font-black text-on-surface">
              {xpPoints.toLocaleString()} XP
            </span>
          </div>
        </div>
      </section>

      {matches.length === 0 ? (
        <div className="p-12 text-center glass-card border border-white/5 rounded-2xl space-y-4 max-w-lg mx-auto py-16">
          <img 
            src="https://iowmvvoeecybxleoipfc.supabase.co/storage/v1/object/public/imagens/1000529284.jpg" 
            alt="Logo Oficial Natação Criativa" 
            className="w-16 h-16 rounded-full object-cover border border-primary/40 mx-auto opacity-75 shadow"
            referrerPolicy="no-referrer"
          />
          <h2 className="font-headline text-lg font-black text-on-surface uppercase tracking-tight">Nenhuma partida cadastrada</h2>
          <p className="text-xs text-on-surface-variant font-sans leading-relaxed">
            Não existem partidas ou confrontos programados no momento. As rodadas oficiais da Copa do Mundo 2026 serão sincronizadas automaticamente.
          </p>
        </div>
      ) : (
        <>
          {/* Render Table (Google Sheets Model Matches Exact Grid request) */}
          {viewMode === 'table' && (
        <div className="overflow-x-auto overflow-y-hidden rounded-2xl border border-white/10 shadow-xl bg-surface-container/40">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/40 border-b border-white/10 font-headline text-[10px] font-black uppercase tracking-wider text-primary select-none">
                <th className="py-3 px-2 md:px-4">DATA/HORA</th>
                <th className="py-3 px-2 md:px-4">MANDANTE</th>
                <th className="py-3 px-2 md:px-4 text-center">PLACAR</th>
                <th className="py-3 px-2 md:px-4">VISITANTE</th>
                <th className="py-3 px-2 md:px-4 hidden sm:table-cell">FASE</th>
                <th className="py-3 px-2 md:px-4 hidden md:table-cell">ESTÁDIO</th>
                <th className="py-3 px-2 md:px-4 text-center">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-sans text-xs">
              {filteredMatches.map((match) => {
                const isLocked = new Date(match.dateStr) <= new Date() || match.type === 'live' || match.type === 'completed';
                const hasUserBet = match.userBet !== undefined;

                const matchDate = new Date(match.dateStr);
                const readableDate = matchDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                const readableTime = matchDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

                return (
                  <tr
                    key={match.id}
                    className="hover:bg-white/5 transition-all text-on-surface relative group"
                  >
                    <td className="py-3 px-2 md:py-4 md:px-4 font-mono text-slate-300 select-none whitespace-nowrap">
                      <span className="block text-[10px] md:text-xs">{readableDate}</span>
                      <span className="block text-[9px] md:text-[10px] text-slate-500">{readableTime}</span>
                    </td>
                    <td className="py-3 px-2 md:py-4 md:px-4">
                      <div className="flex items-center gap-1.5 md:gap-2">
                        {match.teamA.logo && <span className="text-base md:text-2xl shrink-0">{match.teamA.logo}</span>}
                        <span className="font-extrabold text-white text-[11px] md:text-xs leading-tight">{match.teamA.name}</span>
                      </div>
                    </td>

                    <td className="py-2 px-1 md:py-4 md:px-4">
                      <div className="flex items-center justify-center gap-1">
                        {isLocked ? (
                          <div className="flex items-center gap-0.5 bg-black/40 px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-md border border-white/5">
                            <span className="font-headline font-black text-slate-200 text-[11px] md:text-xs">
                              {hasUserBet ? match.userBet?.scoreA : (match.scoreA !== undefined ? match.scoreA : '-')}
                            </span>
                            <span className="text-[9px] md:text-[10px] text-[#D91C7A] font-bold">:</span>
                            <span className="font-headline font-black text-slate-200 text-[11px] md:text-xs">
                              {hasUserBet ? match.userBet?.scoreB : (match.scoreB !== undefined ? match.scoreB : '-')}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-0.5 md:gap-1 select-none">
                            <input
                              type="text"
                              maxLength={2}
                              value={predictions[match.id]?.scoreA ?? (match.userBet?.scoreA ?? '')}
                              placeholder="-"
                              onChange={(e) => handleScoreChange(match.id, 'A', e.target.value)}
                              className="w-6 h-6 md:w-8 md:h-8 rounded bg-black/30 border border-white/10 text-center font-black outline-none focus:border-[#1670D8] text-[10px] md:text-xs"
                            />
                            <span className="text-[#D91C7A] font-bold font-headline select-none text-[10px] md:text-xs">:</span>
                            <input
                              type="text"
                              maxLength={2}
                              value={predictions[match.id]?.scoreB ?? (match.userBet?.scoreB ?? '')}
                              placeholder="-"
                              onChange={(e) => handleScoreChange(match.id, 'B', e.target.value)}
                              className="w-6 h-6 md:w-8 md:h-8 rounded bg-black/30 border border-white/10 text-center font-black outline-none focus:border-[#1670D8] text-[10px] md:text-xs"
                            />
                            <button
                              onClick={() => handleSave(match.id)}
                              className="ml-0.5 md:ml-1 px-1 md:px-1.5 py-0.5 bg-gradient-to-r from-primary to-secondary text-white rounded text-[8px] md:text-[9px] font-black uppercase tracking-widest cursor-pointer"
                              title="Salvar palpite"
                            >
                              OK
                            </button>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-2 md:py-4 md:px-4">
                      <div className="flex items-center gap-1.5 md:gap-2">
                        {match.teamB.logo && <span className="text-base md:text-2xl shrink-0">{match.teamB.logo}</span>}
                        <span className="font-extrabold text-white text-[11px] md:text-xs leading-tight">{match.teamB.name}</span>
                      </div>
                    </td>

                    <td className="py-3 px-2 md:py-4 md:px-4 hidden sm:table-cell whitespace-nowrap">
                      <span className="font-bold text-slate-300 font-headline uppercase text-[9px] md:text-[10px]">
                        {match.teamA.info || 'COPA 2026'}
                      </span>
                    </td>

                    <td className="py-3 px-2 md:py-4 md:px-4 hidden md:table-cell">
                      <span className="text-slate-400 text-[10px] md:text-xs whitespace-nowrap">{match.stadium.split(',')[0]}</span>
                    </td>

                    <td className="py-3 px-2 md:py-4 md:px-4 text-center">
                      {isLocked ? (
                        match.type === 'completed' ? (
                          <span className="text-[9px] md:text-[10px] bg-[#66B82F]/20 text-[#66B82F] font-bold px-1.5 md:px-2 py-0.5 rounded leading-none whitespace-nowrap">
                            Encerrado
                          </span>
                        ) : match.type === 'live' ? (
                          <span className="text-[9px] md:text-[10px] bg-red-600/20 text-red-400 font-bold px-1.5 md:px-2 py-0.5 rounded leading-none animate-pulse whitespace-nowrap">
                            Ao Vivo
                          </span>
                        ) : (
                          <span className="text-[8px] md:text-[9px] bg-amber-500/10 text-amber-500 font-bold px-1 md:px-1.5 py-0.5 rounded flex items-center gap-0.5 leading-none justify-center">
                            <Lock size={8} className="md:hidden" /><Lock size={10} className="hidden md:block" />
                            <span className="hidden md:inline">Fechado</span>
                          </span>
                        )
                      ) : (
                        <span className="text-[9px] md:text-[10px] bg-blue-500/15 text-blue-400 font-bold px-1.5 md:px-2 py-0.5 rounded leading-none whitespace-nowrap">
                          Aberto
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredMatches.length === 0 && (
            <div className="p-8 text-center text-[#9cb1cc] select-none font-bold">
              Nenhuma partida encontrada para este filtro.
            </div>
          )}
        </div>
      )}

      {/* Grid view option cards */}
      {viewMode === 'cards' && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredMatches.map((match) => {
            const isLocked = new Date(match.dateStr) <= new Date() || match.type === 'live' || match.type === 'completed';
            const hasUserBet = match.userBet !== undefined;

            return (
              <div 
                key={match.id}
                className="glass-card rounded-2xl overflow-hidden border border-white/10 shadow-lg flex flex-col justify-between"
              >
                {/* upper header */}
                <div className="px-3 md:px-4 py-2 md:py-2.5 bg-black/30 border-b border-outline/30 flex justify-between items-center text-[9px] md:text-[10px] font-black uppercase text-primary select-none font-headline gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Clock size={10} className="shrink-0 hidden md:block" />
                    <Clock size={9} className="shrink-0 md:hidden" />
                    <span className="truncate">{match.teamA.info || 'Fase de Grupos'}</span>
                  </div>
                  <span className="text-on-surface-variant truncate max-w-[40%] md:max-w-[50%] text-right">{match.stadium}</span>
                </div>

                <div className="p-5 space-y-4">
                  {/* Flag comparison banner Row */}
                  <div className="flex items-center justify-between gap-4 select-none">
                    <div className="flex-1 text-center font-bold">
                      <span className="block text-3xl mb-1">{match.teamA.logo}</span>
                      <span className="text-xs text-on-surface truncate block uppercase font-black">{match.teamA.name}</span>
                    </div>

                    <div className="px-3.5 py-1.5 rounded-lg bg-black/40 border border-white/5 font-heavy font-headline text-[#D91C7A] text-sm">
                      {match.type === 'completed' || match.type === 'live' ? (
                        <span>{match.scoreA} : {match.scoreB}</span>
                      ) : (
                        <span>VS</span>
                      )}
                    </div>

                    <div className="flex-1 text-center font-bold">
                      <span className="block text-3xl mb-1">{match.teamB.logo}</span>
                      <span className="text-xs text-on-surface truncate block uppercase font-black">{match.teamB.name}</span>
                    </div>
                  </div>

                  {/* Guessing mechanics bar or locked alert */}
                  {isLocked ? (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center space-y-1.5 select-none">
                      <p className="text-[10px] text-red-400 font-extrabold uppercase tracking-wider flex items-center justify-center gap-1">
                        <Lock size={12} /> Os palpites para esta partida foram encerrados.
                      </p>
                      {hasUserBet && (
                        <div className="text-xs font-headline font-black text-on-surface leading-none">
                          SEU PALPITE DISPARADO: {match.userBet?.scoreA} - {match.userBet?.scoreB}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-3">
                      <span className="block text-[10px] font-black uppercase text-center text-primary tracking-wider font-bold">
                        Insira Seu Palpite para o Placar
                      </span>
                      <div className="flex items-center justify-center gap-3">
                        <input 
                          type="text"
                          maxLength={2}
                          placeholder="-"
                          value={predictions[match.id]?.scoreA ?? (match.userBet?.scoreA ?? '')}
                          onChange={(e) => handleScoreChange(match.id, 'A', e.target.value)}
                          className="w-12 h-12 bg-black/50 border border-outline/65 text-center text-xl font-headline font-black rounded-lg text-white"
                        />
                        <span className="text-secondary font-bold">:</span>
                        <input 
                          type="text"
                          maxLength={2}
                          placeholder="-"
                          value={predictions[match.id]?.scoreB ?? (match.userBet?.scoreB ?? '')}
                          onChange={(e) => handleScoreChange(match.id, 'B', e.target.value)}
                          className="w-12 h-12 bg-black/50 border border-outline/65 text-center text-xl font-headline font-black rounded-lg text-white"
                        />
                      </div>
                      <button
                        onClick={() => handleSave(match.id)}
                        className="w-full py-2.5 bg-[#1670D8] hover:brightness-110 rounded-lg text-[10px] font-black uppercase tracking-wider font-headline font-bold text-white cursor-pointer"
                      >
                        SALVAR PALPITE
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      )}
    </>
  )}

    </motion.div>
  );
};

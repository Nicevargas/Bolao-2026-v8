import React, { useState, useEffect } from 'react';
import { Participant, Match } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award, 
  Crown, 
  Share2, 
  Search,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Target,
  Check,
  X
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { calculatePoints as calculatePointsFn } from '../supabaseService';

interface LeaderboardViewProps {
  participants: Participant[];
  matches: Match[];
}

interface BetDetail {
  matchId: string;
  matchLabel: string;
  teamA: string;
  teamB: string;
  scoreA?: number;
  scoreB?: number;
  betA: number;
  betB: number;
  points: number;
  isExact: boolean;
  isWinnerCorrect: boolean;
  isCompleted: boolean;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ participants, matches }) => {
  const [selectedLeague, setSelectedLeague] = useState('Ranking Geral');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllRows, setShowAllRows] = useState(false);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [myBets, setMyBets] = useState<BetDetail[]>([]);
  const [loadingBets, setLoadingBets] = useState(false);

  const isDBConnected = isSupabaseConfigured();

  const currentUserId = participants.find(p => p.isUser)?.userId;

  useEffect(() => {
    if (!isDBConnected || !currentUserId) return;
    const fetchMyBets = async () => {
      setLoadingBets(true);
      try {
        const { data: myBetsData, error } = await supabase!
          .from('bets')
          .select('*')
          .eq('user_id', currentUserId);

        if (error) throw error;

        const bets: BetDetail[] = [];
        for (const bet of (myBetsData || [])) {
          const match = matches.find(m => m.id === bet.match_id);
          if (!match) continue;

          const isCompleted = match.scoreA !== undefined && match.scoreB !== undefined;
          let isExact = false;
          let isWinnerCorrect = false;
          let points = 0;

          if (isCompleted) {
            const calcResult = calculatePointsFn(match.scoreA!, match.scoreB!, bet.bet_goals_a, bet.bet_goals_b);
            isExact = calcResult.isExact;
            isWinnerCorrect = calcResult.isWinnerCorrect;
            points = calcResult.points_total;
          }

          bets.push({
            matchId: bet.match_id,
            matchLabel: `${match.teamA.name} x ${match.teamB.name}`,
            teamA: match.teamA.name,
            teamB: match.teamB.name,
            scoreA: match.scoreA,
            scoreB: match.scoreB,
            betA: bet.bet_goals_a,
            betB: bet.bet_goals_b,
            points,
            isExact,
            isWinnerCorrect,
            isCompleted
          });
        }

        setMyBets(bets);
      } catch (err) {
        console.error('Error fetching my bets:', err);
      } finally {
        setLoadingBets(false);
      }
    };
    fetchMyBets();
  }, [isDBConnected, matches, currentUserId]);

  const currentParticipants = participants && participants.length > 0 ? participants : [];

  if (currentParticipants.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-4 text-center py-16"
      >
        <img 
          src="https://iowmvvoeecybxleoipfc.supabase.co/storage/v1/object/public/imagens/1000529284.jpg" 
          alt="Logo Oficial Natação Criativa" 
          className="w-16 h-16 rounded-full object-cover border border-primary/40 mx-auto opacity-75 mb-4 shadow"
          referrerPolicy="no-referrer"
        />
        <h2 className="font-headline text-xl font-black text-on-surface uppercase tracking-tight">
          Nenhum ranking disponível
        </h2>
        <p className="text-xs text-on-surface-variant font-sans max-w-sm mx-auto leading-relaxed">
          Nenhum palpite computado ou processamento realizado ainda. Cadastre novas contas ou simule resultados nas partidas oficiais para dar o pontapé inicial!
        </p>
        <div className="inline-block mt-2">
          <span className="text-[10px] font-mono font-black uppercase tracking-wider bg-[#D91C7A]/20 text-secondary border border-[#D91C7A]/30 px-3 py-1 rounded-full shadow">
            0 Participantes
          </span>
        </div>
      </motion.div>
    );
  }

  const top1 = currentParticipants[0];
  const top2 = currentParticipants[1];
  const top3 = currentParticipants[2];

  const tableRows = currentParticipants.filter(p => p.rank > 3);

  const filteredTableRows = tableRows.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const visibleRows = showAllRows ? filteredTableRows : filteredTableRows.slice(0, 10);

  const toggleExpand = (userId: string) => {
    if (userId !== currentUserId) return;
    setExpandedUserId(expandedUserId === userId ? null : userId);
  };

  const triggerShare = () => {
    setToastMessage('Preparando o resumo de suas conquistas...');
    setShowToast(true);

    setTimeout(() => {
      const text = encodeURIComponent(
         "Estou desafiando meus colegas no BOLÃO DA COPA 2026 oficial da Natação Criativa! Quem acertará mais resultados? 🏆⚽"
      );
      window.open(`https://wa.me/?text=${text}`, '_blank');
      setToastMessage('Redirecionando para compartilhar no WhatsApp!');
      
      setTimeout(() => setShowToast(false), 3000);
    }, 1200);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-8 select-none"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 bg-gradient-to-r from-primary/10 via-secondary/15 to-transparent rounded-2xl border border-white/5 shadow-md">
        <div className="flex items-center gap-4">
          <img 
            src="https://iowmvvoeecybxleoipfc.supabase.co/storage/v1/object/public/imagens/1000529284.jpg" 
            alt="Logo Oficial Natação Criativa" 
            className="w-12 h-12 rounded-full object-cover border border-primary/40 shadow-lg"
            referrerPolicy="no-referrer"
          />
          <div>
            <h1 className="font-headline text-2xl font-black text-on-surface uppercase tracking-tight">
              Ranking Geral
            </h1>
            <p className="text-on-surface-variant text-xs font-sans">
              Acompanhe a classificação geral de todos os colaboradores e suba rumo ao topo de sua lousa corporativa.
            </p>
          </div>
        </div>

        <div className="flex gap-4 items-center">
          <button 
            onClick={triggerShare}
            className="flex items-center gap-2 bg-gradient-to-r from-primary to-secondary text-white px-5 py-3 rounded-xl font-headline text-xs font-black tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-md uppercase cursor-pointer font-bold"
          >
            <Share2 size={14} />
            <span>COMPARTILHAR</span>
          </button>
        </div>
      </div>

      {/* Podium Top 3 */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end relative py-4">
        {top2 && (
          <div className={`order-2 md:order-1 glass-card p-6 rounded-2xl border border-[#c3c5d8]/40 shadow-[0_0_15px_rgba(195,197,216,0.15)] flex flex-col items-center justify-center relative overflow-hidden group transition-all ${top2.isUser ? 'hover:scale-[1.02] cursor-pointer' : ''}`} onClick={() => toggleExpand(top2.userId || '')}>
            <div className="w-16 h-16 rounded-full border-4 border-[#c3c5d8]/40 mb-3 overflow-hidden shadow-xl select-none">
              <img 
                alt="Silver Medalist User" 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
                src={top2.avatar} 
              />
            </div>
            <Award className="text-[#c3c5d8] mb-1" size={28} />
            <span className="font-headline text-sm font-bold text-on-surface truncate">{top2.name}</span>
            <p className="text-[10px] text-outline font-headline font-black uppercase tracking-wider mt-0.5">{top2.league}</p>
            <div className="mt-3 font-headline text-lg font-black text-primary">{top2.points} PTS</div>
            <span className="absolute left-3 top-3 text-[10px] font-headline font-black text-outline bg-white/5 px-2 py-0.5 rounded-full">#2</span>
          </div>
        )}

        {top1 && (
          <div className={`order-1 md:order-2 glass-card p-8 rounded-2xl border border-yellow shadow-[0_0_20px_rgba(242,194,48,0.3)] flex flex-col items-center justify-center relative overflow-hidden md:scale-105 z-10 group transition-all ${top1.isUser ? 'hover:scale-[1.07] cursor-pointer' : ''}`} onClick={() => toggleExpand(top1.userId || '')}>
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow/10 blur-3xl rounded-full"></div>
            
            <div className="w-20 h-20 rounded-full border-4 border-yellow mb-3 overflow-hidden shadow-[0_0_20px_rgba(242,194,48,0.4)] select-none">
              <img 
                alt="Gold Medalist User" 
                className="w-full h-full object-cover animate-pulse" 
                referrerPolicy="no-referrer"
                src={top1.avatar} 
              />
            </div>
            <Crown className="text-yellow mb-1" size={32} />
            <span className="font-headline text-base font-extrabold text-on-surface truncate">{top1.name}</span>
            <p className="text-yellow text-xs font-headline font-black uppercase tracking-widest mt-0.5">{top1.league}</p>
            <div className="mt-4 font-headline text-2xl font-black text-yellow">{top1.points} PTS</div>
            <span className="absolute left-3 top-3 text-xs font-headline font-black text-yellow bg-yellow/10 px-3 py-1 rounded-full">#1</span>
          </div>
        )}

        {top3 && (
          <div className={`order-3 md:order-3 glass-card p-6 rounded-2xl border border-secondary/30 shadow-[0_0_15px_rgba(217,28,122,0.15)] flex flex-col items-center justify-center relative overflow-hidden group transition-all ${top3.isUser ? 'hover:scale-[1.02] cursor-pointer' : ''}`} onClick={() => toggleExpand(top3.userId || '')}>
            <div className="w-16 h-16 rounded-full border-4 border-secondary/25 mb-3 overflow-hidden shadow-xl select-none">
              <img 
                alt="Bronze Medalist User" 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
                src={top3.avatar} 
              />
            </div>
            <Award className="text-secondary mb-1" size={28} />
            <span className="font-headline text-sm font-bold text-on-surface truncate">{top3.name}</span>
            <p className="text-[10px] text-outline font-headline font-black uppercase tracking-wider mt-0.5">{top3.league}</p>
            <div className="mt-3 font-headline text-lg font-black text-secondary">{top3.points} PTS</div>
            <span className="absolute left-3 top-3 text-[10px] font-headline font-black text-outline bg-white/5 px-2 py-0.5 rounded-full">#3</span>
          </div>
        )}
      </section>

      {/* Expanded bets for podium user */}
      {expandedUserId && (top1?.userId === expandedUserId || top2?.userId === expandedUserId || top3?.userId === expandedUserId) && (
        <ExpandedBetsSection userId={expandedUserId} bets={myBets} loading={loadingBets} />
      )}

      {/* Leaderboard Table */}
      <section className="glass-card rounded-2xl overflow-hidden shadow-2xl border border-white/5">
        <div className="px-6 py-4 bg-surface-container/40 border-b border-white/5 flex flex-col sm:flex-row justify-between items-center gap-3">
          <span className="font-headline text-xs font-black text-outline uppercase tracking-wider">
            Classificação Integrada de Colaboradores
          </span>
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input 
              type="text" 
              placeholder="Buscar competidor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/30 border border-white/5 focus:border-secondary rounded-lg pl-8 p-2 text-xs font-medium text-on-surface outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container border-b border-white/10 select-none">
                <th className="px-2 md:px-6 py-4 font-headline text-[10px] font-black text-on-surface-variant uppercase tracking-widest text-center font-bold">#</th>
                <th className="px-2 md:px-6 py-4 font-headline text-[10px] font-black text-on-surface-variant uppercase tracking-widest text-center font-bold hidden sm:table-cell">FOTO</th>
                <th className="px-2 md:px-6 py-4 font-headline text-[10px] font-black text-on-surface-variant uppercase tracking-widest font-bold">NOME</th>
                <th className="px-2 md:px-6 py-3 font-headline text-[10px] font-black text-on-surface-variant uppercase tracking-widest text-center font-bold hidden md:table-cell">EXATOS</th>
                <th className="px-2 md:px-6 py-3 font-headline text-[10px] font-black text-on-surface-variant uppercase tracking-widest text-center font-bold hidden md:table-cell">RESULTADOS</th>
                <th className="px-2 md:px-6 py-4 font-headline text-[10px] font-black text-on-surface-variant uppercase tracking-widest text-right font-bold">PTS</th>
                <th className="px-2 md:px-6 py-4 font-headline text-[10px] font-black text-on-surface-variant uppercase tracking-widest text-center font-bold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {visibleRows.map((row) => {
                const isYou = row.isUser;
                const isExpanded = expandedUserId === row.userId;
                const userBets = isYou ? myBets : [];
                return (
                  <React.Fragment key={row.userId || row.name}>
                    <tr 
                      className={`transition-all duration-150 ${isYou ? 'cursor-pointer hover:bg-white/[0.03]' : ''} ${
                        isYou 
                          ? 'bg-primary-container/10 border-l-4 border-l-primary' 
                          : 'border-l-4 border-l-transparent'
                      }`}
                      onClick={() => toggleExpand(row.userId || '')}
                    >
                      <td className="px-2 md:px-6 py-4 text-center select-none">
                        <span className={`font-headline text-xs font-black ${isYou ? 'text-primary' : 'text-on-surface-variant'}`}>
                          #{row.rank}
                        </span>
                      </td>

                      <td className="px-2 md:px-6 py-4 text-center select-none hidden sm:table-cell">
                        <div className={`w-7 h-7 md:w-9 md:h-9 rounded-full overflow-hidden mx-auto border ${isYou ? 'border-primary' : 'border-white/10'}`}>
                          <img 
                            alt={`${row.name} avatar`} 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                            src={row.avatar} 
                          />
                        </div>
                      </td>

                      <td className="px-2 md:px-6 py-4 select-all">
                        <div className="min-w-0">
                          <p className={`text-xs font-bold font-sans truncate ${isYou ? 'text-primary' : 'text-on-surface'}`}>
                            {row.name}
                          </p>
                          <span className="text-[9px] text-[#9cb1cc] font-medium block truncate">
                            {row.league || 'Participante'}
                          </span>
                        </div>
                      </td>

                      <td className="px-2 md:px-6 py-4 text-center font-bold text-xs text-yellow select-none hidden md:table-cell">
                        {row.exactCount}
                      </td>

                      <td className="px-2 md:px-6 py-4 text-center font-bold text-xs text-[#66B82F] select-none hidden md:table-cell">
                        {row.winnerCount}
                      </td>

                      <td className="px-2 md:px-6 py-4 text-right">
                        <span className={`font-headline text-xs font-black whitespace-nowrap ${isYou ? 'text-primary' : 'text-on-surface'}`}>
                          {row.points}
                        </span>
                      </td>

                      <td className="px-2 md:px-6 py-4 text-center">
                        {isYou ? (
                          isExpanded ? (
                            <ChevronUp size={14} className="text-primary mx-auto" />
                          ) : (
                            <ChevronDown size={14} className="text-primary mx-auto" />
                          )
                        ) : null}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={7} className="px-0 py-0">
                          <ExpandedBetsSection userId={row.userId || ''} bets={userBets} loading={loadingBets} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredTableRows.length > 5 && (
          <div className="p-4 bg-surface-container/35 border-t border-white/5 text-center select-none">
            <button 
              onClick={() => setShowAllRows(!showAllRows)}
              className="font-headline text-[10px] font-black text-primary hover:text-secondary uppercase tracking-widest flex items-center justify-center gap-2 mx-auto cursor-pointer font-bold"
            >
              <span>{showAllRows ? 'Recolher Lista' : 'Visualizar Lista Completa'}</span>
              <ChevronDown size={14} className={`transform transition-transform ${showAllRows ? 'rotate-180' : ''}`} />
            </button>
          </div>
        )}
      </section>

      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: 30, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 30, x: '-50%' }}
            className="fixed bottom-24 left-1/2 z-[200] select-none pointer-events-none"
          >
            <div className="bg-secondary-container text-on-secondary-container px-6 py-3 rounded-full font-sans font-bold shadow-2xl flex items-center gap-2 border border-secondary">
              <CheckCircle size={16} className="text-secondary animate-bounce" />
              <span className="text-sm">{toastMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

interface ExpandedBetsSectionProps {
  userId: string;
  bets: BetDetail[];
  loading: boolean;
}

const ExpandedBetsSection: React.FC<ExpandedBetsSectionProps> = ({ userId, bets, loading }) => {
  if (loading) {
    return (
      <div className="bg-surface-container/30 px-6 py-6 border-t border-white/5">
        <p className="text-xs text-on-surface-variant text-center">Carregando palpites...</p>
      </div>
    );
  }

  if (bets.length === 0) {
    return (
      <div className="bg-surface-container/30 px-6 py-6 border-t border-white/5">
        <p className="text-xs text-on-surface-variant text-center">Nenhum palpite registrado.</p>
      </div>
    );
  }

  const completedBets = bets.filter(b => b.isCompleted);
  const totalEarned = completedBets.reduce((sum, b) => sum + b.points, 0);

  return (
    <div className="bg-surface-container/30 px-6 py-5 border-t border-white/5">
      <div className="flex items-center gap-2 mb-4">
        <Target size={14} className="text-primary" />
        <span className="font-headline text-[10px] font-black text-on-surface-variant uppercase tracking-widest">
          Detalhamento de Palpites — {completedBets.length} jogos computados | {totalEarned} pts ganhos
        </span>
      </div>
      <div className="grid gap-2">
        {bets.map((bet) => (
          <div
            key={bet.matchId}
            className="flex items-center gap-3 p-3 rounded-xl bg-black/20 border border-white/5"
          >
            {/* Match info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-xs font-bold text-on-surface">
                <span className="truncate">{bet.teamA}</span>
                {bet.isCompleted && (
                  <span className="text-on-surface-variant font-mono">
                    {bet.scoreA}×{bet.scoreB}
                  </span>
                )}
                <span className="truncate">{bet.teamB}</span>
              </div>
              <div className="text-[10px] text-on-surface-variant font-mono mt-0.5">
                Palpite: {bet.betA}×{bet.betB}
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2">
              {!bet.isCompleted ? (
                <span className="text-[9px] text-on-surface-variant font-medium uppercase tracking-wider">
                  Aguardando
                </span>
              ) : (
                <>
                  {bet.isExact ? (
                    <span className="flex items-center gap-1 text-[10px] text-yellow font-black uppercase">
                      <Check size={12} /> Exato
                    </span>
                  ) : bet.isWinnerCorrect ? (
                    <span className="flex items-center gap-1 text-[10px] text-[#66B82F] font-black uppercase">
                      <Check size={12} /> Resultado
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] text-red-400 font-black uppercase">
                      <X size={12} /> Errou
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Points */}
            <div className="text-right min-w-[50px]">
              {bet.isCompleted ? (
                <span className="font-headline text-sm font-black text-primary">
                  +{bet.points}
                </span>
              ) : (
                <span className="font-headline text-xs font-black text-on-surface-variant">
                  —
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

import React from 'react';
import { ActiveTab, Match, Participant } from '../types';
import { motion } from 'motion/react';
import { 
  Trophy, 
  TrendingUp, 
  Sparkles, 
  Clock, 
  ArrowRight, 
  Award,
  BookOpen,
  Calendar,
  Layers,
  Sparkle
} from 'lucide-react';
import { getActiveUser, getStoredPredictions, getStoredMatches } from '../db';

interface DashboardViewProps {
  setActiveTab: (tab: ActiveTab) => void;
  matches: Match[];
  participants: Participant[];
  xpPoints: number;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  setActiveTab,
  matches,
  participants,
  xpPoints,
}) => {
  const isDBConnected = typeof (import.meta as any).env.VITE_SUPABASE_URL === 'string' && (import.meta as any).env.VITE_SUPABASE_URL.includes('supabase.co');

  const activeUser = isDBConnected 
    ? { 
        id: 'dummy', 
        name: participants.find(p => p.isUser)?.name || 'Participante',
        points: participants.find(p => p.isUser)?.points || 0,
        exactCount: participants.find(p => p.isUser)?.exactCount || 0,
        winnerCount: participants.find(p => p.isUser)?.winnerCount || 0,
        email: 'user@natacaocriativa.com',
        avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(participants.find(p => p.isUser)?.name || 'user')}`,
        role: 'member',
        themePreference: 'dark' as any,
        isAdmin: false
      }
    : getActiveUser();

  // SECURE LINKING: count of predictions submitted by the user
  const totalGuessesCount = isDBConnected
    ? matches.filter(m => m.userBet !== undefined).length
    : getStoredPredictions().filter(p => p.user_id === activeUser?.id).length;

  // Completed vs Pending analytics for participant dashboard
  const completedCount = isDBConnected
    ? matches.filter(m => m.scoreA !== undefined).length
    : getStoredMatches().filter(m => m.status === 'encerrado').length;

  const pendingCount = isDBConnected
    ? matches.filter(m => m.scoreA === undefined).length
    : getStoredMatches().filter(m => m.status === 'aguardando' || m.status === 'ao_vivo').length;

  // Find user's rank in leaderboard
  const sortedParticipants = [...participants].sort((a, b) => b.points - a.points);
  const userRankIndex = sortedParticipants.findIndex(p => p.isUser);
  const userRank = userRankIndex >= 0 ? userRankIndex + 1 : '1';

  // Get today's matches (live + scheduled), or fallback to upcoming/recent completed
  const featuredMatches = (() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 86400000);

    const today = matches.filter(m => {
      if (!m.dateStr) return false;
      const d = new Date(m.dateStr);
      return d >= todayStart && d < todayEnd;
    });

    if (today.length > 0) return today;

    const upcoming = matches
      .filter(m => m.type === 'upcoming')
      .sort((a, b) => new Date(a.dateStr).getTime() - new Date(b.dateStr).getTime());
    if (upcoming.length > 0) return upcoming.slice(0, 3);

    const completed = matches
      .filter(m => m.type === 'completed')
      .sort((a, b) => new Date(b.dateStr).getTime() - new Date(a.dateStr).getTime());
    if (completed.length > 0) return completed.slice(0, 3);

    return matches.slice(0, 3);
  })();
  
  // Get quick Top 5 rankings
  const rankingPreview = participants.slice(0, 5);

  // Next match for Quick Stats Card
  const nextMatch = matches.find(m => m.type === 'upcoming') || matches[2] || matches[0];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6"
    >
      {/* Welcome Hero banner featuring Natação Criativa Logo */}
      <section className="relative overflow-hidden rounded-3xl p-6 lg:p-8 bg-gradient-to-br from-primary/10 via-secondary/5 to-surface-container border border-white/5 shadow-xl glass-card">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 justify-between select-none">
          <div className="space-y-3 max-w-xl text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2.5">
              <img 
                src="https://iowmvvoeecybxleoipfc.supabase.co/storage/v1/object/public/imagens/1000529284.jpg" 
                alt="Logo Natação Criativa" 
                className="w-8 h-8 rounded-full object-cover border border-primary/50"
                referrerPolicy="no-referrer"
              />
              <span className="font-headline text-xs font-black tracking-widest text-secondary uppercase">
                Bolão Copa do Mundo 2026
              </span>
            </div>
            
            <h1 className="font-headline text-2xl md:text-4xl text-on-surface font-black leading-none">
              Bem-vindo de volta, <span className="brand-gradient-text">{activeUser?.name || 'Rodrigo'}</span>!
            </h1>
            <p className="font-sans text-xs md:text-sm text-on-surface-variant leading-relaxed">
              O maior campeonato esportivo de palpites corporativos está fervendo! Complete as previsões para os próximos confrontos, verifique estatísticas oficiais da sua empresa e lidere o ranking oficial.
            </p>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
              <button 
                onClick={() => setActiveTab('matches')}
                className="px-6 py-2.5 bg-gradient-to-r from-primary to-secondary text-white rounded-full font-headline text-xs font-black tracking-wide shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer font-bold"
              >
                PALPITAR JOGOS
              </button>
              <button 
                onClick={() => setActiveTab('leaderboard')}
                className="px-6 py-2.5 border border-outline hover:bg-white/5 rounded-full font-headline text-xs font-black text-on-surface active:scale-95 transition-all cursor-pointer"
              >
                VER TABELA COMPLETA
              </button>
            </div>
          </div>

          {/* Large Brand Icon Frame */}
          <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full p-1 bg-gradient-to-tr from-[#1670D8] via-[#D91C7A] to-[#F28C28] shadow-[0_0_40px_rgba(22,112,216,0.25)] flex items-center justify-center">
            <img 
              src="https://iowmvvoeecybxleoipfc.supabase.co/storage/v1/object/public/imagens/1000529284.jpg" 
              alt="Crest" 
              className="w-full h-full object-cover rounded-full"
              referrerPolicy="no-referrer"
            />
            <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-[#F28C28] to-[#F2C230] text-black font-black text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-black font-extrabold shadow animate-bounce">
              LIVE
            </div>
          </div>
        </div>
        {/* Blurs */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#1670D8]/10 blur-3xl rounded-full"></div>
      </section>

      {/* Bento Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        
        {/* Rank Card */}
        <div className="glass-card rounded-2xl p-5 border-l-4 border-[#1670D8] shadow-md flex items-center justify-between hover:translate-y-[-2px] transition-all">
          <div className="space-y-1">
            <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Sua Posição</p>
            <h2 className="font-headline text-3xl font-black text-[#1670D8]">#{userRank}</h2>
            <div className="text-[10px] font-bold text-[#66B82F] flex items-center gap-1">
              <TrendingUp size={12} /> Top {userRankIndex <= 1 ? '10%' : '15%'} do torneio
            </div>
          </div>
          <div className="w-11 h-11 bg-[#1670D8]/10 rounded-xl flex items-center justify-center text-[#1670D8]">
            <Trophy size={20} />
          </div>
        </div>

        {/* Guesses Submitted */}
        <div className="glass-card rounded-2xl p-5 border-l-4 border-[#D91C7A] shadow-md flex items-center justify-between hover:translate-y-[-2px] transition-all">
          <div className="space-y-1">
            <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Palpites Realizados</p>
            <h2 className="font-headline text-3xl font-black text-[#D91C7A]">{totalGuessesCount}</h2>
            <div className="text-[10px] text-on-surface-variant font-medium">
              Dos {matches.length} jogos disponíveis
            </div>
          </div>
          <div className="w-11 h-11 bg-[#D91C7A]/10 rounded-xl flex items-center justify-center text-[#D91C7A]">
            <BookOpen size={18} />
          </div>
        </div>

        {/* Accumulated Points */}
        <div className="glass-card rounded-2xl p-5 border-l-4 border-[#F28C28] shadow-md flex items-center justify-between hover:translate-y-[-2px] transition-all">
          <div className="space-y-1">
            <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Pontos Acumulados</p>
            <h2 className="font-headline text-3xl font-black text-[#F28C28]">
              {activeUser?.points || 0} <span className="text-xs font-medium font-sans">PTS</span>
            </h2>
            <div className="text-[10px] font-bold text-yellow flex items-center gap-0.5">
              <Sparkles size={12} /> {activeUser?.exactCount || 0} Acertos Exatos!
            </div>
          </div>
          <div className="w-11 h-11 bg-[#F28C28]/10 rounded-xl flex items-center justify-center text-[#F28C28]">
            <Award size={20} />
          </div>
        </div>

        {/* Pending vs Completed Tracker */}
        <div className="glass-card rounded-2xl p-5 border-l-4 border-[#66B82F] shadow-md flex items-center justify-between hover:translate-y-[-2px] transition-all">
          <div className="space-y-1">
            <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Jogos Concluídos / Pendentes</p>
            <h2 className="font-headline text-2xl font-black text-[#66B82F]">
              {completedCount} <span className="text-sm font-normal text-[#9cb1cc]">/ {pendingCount}</span>
            </h2>
            <div className="text-[10px] font-medium text-[#9cb1cc]">
              {pendingCount > 0 ? `${pendingCount} partidas aguardando palpite` : 'Todos os palpites finalizados!'}
            </div>
          </div>
          <div className="w-11 h-11 bg-[#66B82F]/10 rounded-xl flex items-center justify-center text-[#66B82F]">
            <Calendar size={18} />
          </div>
        </div>

      </section>

      {/* Dynamic Official Point Rules Panel */}
      <section className="glass-card rounded-2xl p-6 border border-white/5 bg-gradient-to-r from-primary/5 via-secondary/5 to-transparent select-none leading-none">
        <h3 className="font-headline text-xs font-black text-on-surface uppercase tracking-wider mb-4 flex items-center gap-1.5">
          <Award size={14} className="text-[#F28C28]" /> Regulamento de Pontuação Oficial (Copa 2026)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="p-4 bg-black/25 rounded-xl border border-white/5 space-y-2">
            <div className="text-[10px] text-[#1670D8] font-bold uppercase tracking-wider">Resultado Correto</div>
            <div className="text-xl font-bold text-white mb-1">+2 <span className="text-xs text-on-surface-variant font-normal">pts</span></div>
            <p className="text-[10px] text-on-surface-variant leading-relaxed">Acerto do vencedor da partida (Time A, Time B ou Empate)</p>
          </div>
          
          <div className="p-4 bg-black/25 rounded-xl border border-white/5 space-y-2">
            <div className="text-[10px] text-[#D91C7A] font-bold uppercase tracking-wider">Gols do Time A</div>
            <div className="text-xl font-bold text-white mb-1">+1 <span className="text-xs text-on-surface-variant font-normal">pt</span></div>
            <p className="text-[10px] text-on-surface-variant leading-relaxed">Acerto exato do número de gols marcados pelo Time A</p>
          </div>

          <div className="p-4 bg-black/25 rounded-xl border border-white/5 space-y-2">
            <div className="text-[10px] text-[#F28C28] font-bold uppercase tracking-wider">Gols do Time B</div>
            <div className="text-xl font-bold text-white mb-1">+1 <span className="text-xs text-on-surface-variant font-normal">pt</span></div>
            <p className="text-[10px] text-on-surface-variant leading-relaxed">Acerto exato do número de gols marcados pelo Time B</p>
          </div>

          <div className="p-4 bg-black/25 rounded-xl border border-white/5 space-y-2">
            <div className="text-[10px] text-[#66B82F] font-bold uppercase tracking-wider">Placar Exato Bônus</div>
            <div className="text-xl font-bold text-white mb-1">+1 <span className="text-xs text-on-surface-variant font-normal">pt</span></div>
            <p className="text-[10px] text-on-surface-variant leading-relaxed">Bônus extra concedido ao acertar o placar dos dois times</p>
          </div>

          <div className="p-4 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl border border-primary/20 space-y-2 flex flex-col justify-center">
            <div className="text-[10px] text-[#F2C230] font-black uppercase tracking-widest">MÁXIMO POR JOGO</div>
            <div className="text-2xl font-black text-[#F2C230]">5 <span className="text-xs text-on-surface-variant font-black">PTS</span></div>
            <p className="text-[8px] text-[#9cb1cc] leading-normal uppercase font-bold tracking-wider">Pontuação integral exata</p>
          </div>
        </div>
      </section>

      {/* Main grids splitting highlights & rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Featured matches list on left */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between select-none">
            <h3 className="font-headline text-sm font-black text-on-surface uppercase tracking-wider flex items-center gap-2">
              <Layers size={16} className="text-primary" /> Jogos em Destaque de Hoje
            </h3>
            <button 
              onClick={() => setActiveTab('matches')}
              className="text-primary hover:text-secondary text-xs uppercase font-black tracking-widest flex items-center gap-1 font-bold transition-all"
            >
              Ver Tudo <ArrowRight size={14} />
            </button>
          </div>

          <div className="space-y-4">
            {featuredMatches.map((match) => {
              const isLocked = new Date(match.dateStr) <= new Date() || match.type === 'live' || match.type === 'completed';
              return (
                <div 
                  key={match.id}
                  className="glass-card rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-all shadow-sm relative overflow-hidden"
                >
                  <div className="absolute right-4 top-4 select-none">
                    {match.type === 'live' ? (
                      <span className="px-2.5 py-1 bg-red-600 text-white rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1 animate-pulse">
                        <span className="w-1.5 h-1.5 bg-white rounded-full"></span> AO VIVO
                      </span>
                    ) : match.type === 'completed' ? (
                      <span className="px-2.5 py-1 bg-[#66B82F]/20 text-[#66B82F] rounded-full text-[9px] font-black uppercase tracking-wider">
                        FINALIZADO
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-primary/20 text-primary border border-primary/25 rounded-full text-[9px] font-black uppercase tracking-wider">
                        ABERTO
                      </span>
                    )}
                  </div>

                  {/* Flag row visual layout exact match */}
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-2">
                    <div className="flex items-center gap-3 w-full md:w-5/12 justify-center md:justify-end">
                      <span className="font-headline font-black text-sm text-on-surface">{match.teamA.name}</span>
                      <span className="text-3xl select-none" role="img" aria-label={match.teamA.name}>
                        {match.teamA.logo}
                      </span>
                    </div>

                    <div className="font-headline text-center px-4 py-1.5 bg-black/30 border border-white/5 rounded-2xl flex items-center gap-3.5 select-none font-extrabold text-lg brand-gradient-text">
                      {match.scoreA !== undefined && match.scoreB !== undefined ? (
                        <>
                          <span>{match.scoreA}</span>
                          <span className="text-xs text-on-surface-variant font-sans font-medium">X</span>
                          <span>{match.scoreB}</span>
                        </>
                      ) : (
                        <div className="px-3 py-0.5 text-xs text-primary leading-normal uppercase tracking-wider font-headline font-black">
                          VS
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-5/12 justify-center md:justify-start">
                      <span className="text-3xl select-none" role="img" aria-label={match.teamB.name}>
                        {match.teamB.logo}
                      </span>
                      <span className="font-headline font-black text-sm text-on-surface">{match.teamB.name}</span>
                    </div>
                  </div>

                  {match.userBet && (
                    <div className="text-center text-[10px] text-slate-400 font-bold select-none">
                      Seu palpite: {match.userBet.scoreA} - {match.userBet.scoreB}
                      {match.type === 'completed' && match.pointsEarned !== undefined && (
                        <span className="text-green-400 ml-2">+{match.pointsEarned}pts</span>
                      )}
                    </div>
                  )}

                  <div className="mt-2 pt-3 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-3 select-none">
                    <div className="flex items-center text-[11px] text-on-surface-variant gap-1">
                      <Clock size={12} className="text-primary" />
                      <span>{match.dateStr ? new Date(match.dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                    </div>
                    
                    {isLocked ? (
                      <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wide bg-white/5 px-3 py-1 rounded-lg">
                        Previsões Fechadas
                      </span>
                    ) : (
                      <button 
                        onClick={() => setActiveTab('matches')}
                        className="px-5 py-1.5 bg-gradient-to-r from-primary/80 to-secondary/80 hover:brightness-110 text-white rounded-lg font-headline text-[10px] font-black tracking-wider uppercase transition-all flex items-center gap-1.5 cursor-pointer font-bold"
                      >
                        <Sparkle size={12} />
                        <span>DAR PALPITE</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Leaders ranking view on right */}
        <div className="lg:col-span-4 space-y-4">
          <h3 className="font-headline text-sm font-black text-on-surface uppercase tracking-wider flex items-center gap-2 select-none">
            <Trophy size={16} className="text-yellow" /> Palpitadores Elite
          </h3>

          <div className="glass-card rounded-2xl overflow-hidden border border-white/5 shadow-xl select-none">
            <div className="p-3 space-y-1">
              {rankingPreview.map((user, idx) => {
                const rankTextColors = ['text-yellow', 'text-slate-300', 'text-amber-600', 'text-on-surface-variant', 'text-on-surface-variant'];
                return (
                  <div 
                    key={user.name}
                    className={`flex items-center gap-3 p-2.5 rounded-xl transition-all border border-transparent ${
                      user.isUser ? 'bg-primary/15 border-primary/25' : 'hover:bg-white/5'
                    }`}
                  >
                    <span className={`font-headline text-xs font-black w-4 text-center ${rankTextColors[idx] || 'text-on-surface-variant'}`}>
                      {user.rank}
                    </span>
                    <img 
                      alt={user.name} 
                      className="w-8 h-8 rounded-full object-cover border border-white/10" 
                      referrerPolicy="no-referrer"
                      src={user.avatar} 
                    />
                    <div className="flex-1 min-w-0 pr-1">
                      <p className="font-sans text-xs font-extrabold text-on-surface truncate">{user.name}</p>
                      <p className="text-[9px] text-[#9cb1cc] truncate uppercase tracking-widest font-black mt-0.5">
                        {user.isUser ? 'VOCÊ' : (user.league || 'Competidor')}
                      </p>
                    </div>
                    <span className="font-headline text-xs font-black text-primary">
                      {user.points} <span className="text-[9px] font-normal text-[#9cb1cc] font-sans">pts</span>
                    </span>
                  </div>
                );
              })}
            </div>

            <button 
              onClick={() => setActiveTab('leaderboard')}
              className="w-full bg-black/40 hover:bg-black/60 cursor-pointer py-3 text-center border-t border-white/5 flex justify-center items-center gap-2 transition-all font-headline text-[10px] font-black text-primary uppercase tracking-widest"
            >
              <span>Ver Classificação Geral</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

      </div>
    </motion.div>
  );
};

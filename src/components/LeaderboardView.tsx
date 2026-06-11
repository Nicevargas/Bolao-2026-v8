import React, { useState } from 'react';
import { Participant } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award, 
  Crown, 
  Share2, 
  TrendingUp, 
  Search,
  CheckCircle,
  ChevronDown
} from 'lucide-react';

interface LeaderboardViewProps {
  participants: Participant[];
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ participants }) => {
  const [selectedLeague, setSelectedLeague] = useState('Ranking Geral');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllRows, setShowAllRows] = useState(false);

  // Load participants from State prop rather than bypassing via local database query
  const currentParticipants = participants && participants.length > 0 ? participants : [];

  // If there are zero entries, render beautifully-styled Empty State matching requirements
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

  // Split top 3 for the podium layout
  const top1 = currentParticipants[0];
  const top2 = currentParticipants[1];
  const top3 = currentParticipants[2];

  // Other list elements (all participants starting from rank 4)
  const tableRows = currentParticipants.filter(p => p.rank > 3);
  
  // Search query support
  const filteredTableRows = tableRows.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Splice rows for visual completeness
  const visibleRows = showAllRows ? filteredTableRows : filteredTableRows.slice(0, 10);

  const triggerShare = () => {
    setToastMessage('Preparando o resumo de suas conquistas...');
    setShowToast(true);

    setTimeout(() => {
      const text = encodeURIComponent(
         "Estou desafiando meus colegas no BOLÃO DA COPA 2026 oficial da Natação Criativa! Quem acertará mais resultados? 🏆⚽"
      );
      window.open(`https://wa.me/?text=${text}`, '_blank');
      setToastMessage('Redirecionando para compartilhar no WhatsApp!');
      
      // Auto-hide toast
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
      {/* Visual Header bar */}
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

        {/* Share buttons */}
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

      {/* Podium Top 3 with exquisite fantasy sport cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end relative py-4">
        {/* Rank 2 (Silver) */}
        {top2 && (
          <div className="order-2 md:order-1 glass-card p-6 rounded-2xl border border-[#c3c5d8]/40 shadow-[0_0_15px_rgba(195,197,216,0.15)] flex flex-col items-center justify-center relative overflow-hidden group hover:scale-[1.02] transition-all">
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

        {/* Rank 1 (Gold) */}
        {top1 && (
          <div className="order-1 md:order-2 glass-card p-8 rounded-2xl border border-yellow shadow-[0_0_20px_rgba(242,194,48,0.3)] flex flex-col items-center justify-center relative overflow-hidden md:scale-105 z-10 group hover:scale-[1.07] transition-all">
            {/* Spotlight blur */}
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

        {/* Rank 3 (Bronze) */}
        {top3 && (
          <div className="order-3 md:order-3 glass-card p-6 rounded-2xl border border-secondary/30 shadow-[0_0_15px_rgba(217,28,122,0.15)] flex flex-col items-center justify-center relative overflow-hidden group hover:scale-[1.02] transition-all">
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

      {/* Leaderboard Table Container */}
      <section className="glass-card rounded-2xl overflow-hidden shadow-2xl border border-white/5">
        
        {/* Table Search bar and filters */}
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

        {/* Real HTML table matches exact column values requested */}
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
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {visibleRows.map((row) => {
                const isYou = row.isUser;
                return (
                  <tr 
                    key={row.name}
                    className={`transition-all duration-150 hover:bg-white/[0.03] ${
                      isYou 
                        ? 'bg-primary-container/10 border-l-4 border-l-primary' 
                        : 'border-l-4 border-l-transparent'
                    }`}
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
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Load More Button */}
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

      {/* Floating share/toast status banner */}
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

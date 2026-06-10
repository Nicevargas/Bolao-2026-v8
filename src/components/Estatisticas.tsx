import React, { useEffect, useState } from 'react';
import { Sparkles, BarChart3, Users, User } from 'lucide-react';

interface TopPerformer {
  rank: number;
  name: string;
  username: string;
  avatar: string;
  points: number;
}

interface RoundData {
  label: string;
  value: string;
  points: string;
  active: boolean;
}

interface StatsData {
  totalGuesses: number;
  averagePoints: number;
  activeParticipants: number;
  leaderName: string;
  totalExacts: number;
  totalCorrect: number;
  topPerformers: TopPerformer[];
  roundsData: RoundData[];
}

export default function Estatisticas() {
  const [animate, setAnimate] = useState(false);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/estatisticas');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Erro ao buscar estatísticas:', err);
      } finally {
        setLoading(false);
        // Delay slightly for the animation entry of bars
        setTimeout(() => setAnimate(true), 150);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center w-full">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-on-surface-variant text-sm font-semibold">Carregando estatísticas do banco de dados...</p>
      </div>
    );
  }

  const totalGuesses = stats?.totalGuesses || 0;
  const totalExacts = stats?.totalExacts || 0;
  const totalCorrect = stats?.totalCorrect || 0;
  const totalWinnerAcertos = Math.max(0, totalCorrect - totalExacts);
  const totalErrors = Math.max(0, totalGuesses - totalCorrect);

  const exactPct = totalGuesses > 0 ? Math.round((totalExacts / totalGuesses) * 100) : 0;
  const correctPct = totalGuesses > 0 ? Math.round((totalWinnerAcertos / totalGuesses) * 100) : 0;
  const errorPct = totalGuesses > 0 ? Math.round((totalErrors / totalGuesses) * 100) : 0;

  // Pie/donut offsets calculations:
  // Circumference of radius 40 circle is 251.2
  // We want to overlay segments:
  // Circle 1: Gray (Errors / All)
  // Circle 2: Acertos (correctPct + exactPct)
  // Circle 3: Exacts (exactPct)
  const successPct = exactPct + correctPct;
  const correctOffset = totalGuesses > 0 ? (251.2 - (successPct / 100) * 251.2) : 251.2;
  const exactOffset = totalGuesses > 0 ? (251.2 - (exactPct / 100) * 251.2) : 251.2;

  const rounds = stats?.roundsData && stats.roundsData.length > 0 ? stats.roundsData : [
    { label: 'Grupo A', value: '10%', points: '0 pts', active: false },
    { label: 'Grupo B', value: '10%', points: '0 pts', active: false },
    { label: 'Oitavas', value: '10%', points: '0 pts', active: false },
    { label: 'Quartas', value: '10%', points: '0 pts', active: false },
    { label: 'Semifinal', value: '10%', points: '0 pts', active: false },
    { label: 'Final', value: '10%', points: '0 pts', active: false },
  ];

  return (
    <div className="animate-in fade-in duration-300 relative text-left">
      {/* Welcome & Summary Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-3xl font-extrabold text-white mb-2 tracking-tight">Estatísticas do Bolão</h1>
        <p className="text-on-surface-variant font-medium text-sm md:text-base max-w-2xl">
          Acompanhe o desempenho global dos participantes e a precisão dos palpites em tempo real.
        </p>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Card: Total de Palpites */}
        <div className="glass-card p-6 flex items-center gap-5 rounded-2xl" id="total-palpites-card">
          <div className="w-14 h-14 rounded-2xl bg-secondary-container/20 flex items-center justify-center text-secondary">
            <Sparkles size={28} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Total de Palpites</p>
            <p className="text-2xl md:text-3xl font-extrabold text-white">{totalGuesses.toLocaleString()}</p>
          </div>
        </div>

        {/* Card: Média de Pontos */}
        <div className="glass-card p-6 flex items-center gap-5 rounded-2xl" id="media-pontos-card">
          <div className="w-14 h-14 rounded-2xl bg-primary-container/20 flex items-center justify-center text-primary">
            <BarChart3 size={28} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Média de Pontos</p>
            <p className="text-2xl md:text-3xl font-extrabold text-white">{(stats?.averagePoints || 0).toFixed(1)}</p>
          </div>
        </div>

        {/* Card: Participantes Ativos */}
        <div className="glass-card p-6 flex items-center gap-5 rounded-2xl" id="participantes-ativos-card">
          <div className="w-14 h-14 rounded-2xl bg-tertiary-container/20 flex items-center justify-center text-tertiary">
            <Users size={28} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Participantes Ativos</p>
            <p className="text-2xl md:text-3xl font-extrabold text-white">{(stats?.activeParticipants || 0).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        {/* Left Column: Performance Chart */}
        <div className="lg:col-span-8 glass-card p-6 md:p-8 rounded-3xl flex flex-col justify-between" id="performance-chart-card">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg md:text-xl font-bold text-white tracking-tight">Pontos por Rodada / Fase</h3>
              <p className="text-on-surface-variant text-xs font-semibold">Evolução da média de pontuação geral por rodada cadastrada</p>
            </div>
            <div className="flex gap-2">
              <span className="flex items-center gap-2 text-xs text-primary font-bold">
                <span className="w-3 h-3 rounded-full bg-primary animate-pulse"></span> Média Geral
              </span>
            </div>
          </div>

          {/* Bar Chart (CSS Flex) */}
          <div className="h-64 flex items-end justify-between gap-3 md:gap-5 px-2 border-b border-white/5 pb-2 min-h-[220px]">
            {rounds.map((round, idx) => (
              <div key={idx} className="flex flex-col items-center flex-1 gap-2.5 h-full justify-end">
                <div
                  className={`w-full rounded-t-lg relative group transition-all duration-1000 ease-out cursor-pointer ${
                    round.active
                      ? 'bg-secondary shadow-[0_0_20px_rgba(255,72,151,0.5)]'
                      : 'bg-primary/30 group-hover:bg-primary/50'
                  }`}
                  style={{ height: animate ? round.value : '10%' }}
                >
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-surface-container-high border border-white/10 p-1.5 rounded-lg text-[10px] md:text-xs text-white whitespace-nowrap shadow-xl z-20 font-bold">
                    {round.points}
                  </div>
                </div>
                <span className="text-[9px] md:text-xs text-on-surface-variant font-bold uppercase tracking-wider text-center truncate w-full">
                  {round.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Precision Donut */}
        <div className="lg:col-span-4 glass-card p-6 md:p-8 rounded-3xl flex flex-col items-center justify-between" id="precision-donut-card">
          <div className="w-full text-center">
            <h3 className="text-lg md:text-xl font-bold text-white mb-1">Precisão Geral</h3>
            <p className="text-on-surface-variant text-xs font-semibold">Proporção dos palpites calculados</p>
          </div>

          {/* Donut Visualization */}
          <div className="relative w-40 h-40 my-6">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              {/* Background Circle */}
              <circle
                cx="50"
                cy="50"
                fill="transparent"
                r="40"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="12"
              ></circle>
              {/* Success Layer (Acertos de vencedor/empate) */}
              <circle
                className="text-primary-container"
                cx="50"
                cy="50"
                fill="transparent"
                r="40"
                stroke="currentColor"
                strokeWidth="12"
                strokeDasharray="251.2"
                strokeDashoffset={animate ? correctOffset : 251.2}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1.2s ease-out' }}
              ></circle>
              {/* Epic Win Layer (Placar Exato) */}
              <circle
                className="text-secondary"
                cx="50"
                cy="50"
                fill="transparent"
                r="40"
                stroke="currentColor"
                strokeWidth="12"
                strokeDasharray="251.2"
                strokeDashoffset={animate ? exactOffset : 251.2}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s ease-out' }}
              ></circle>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl md:text-3xl font-extrabold text-white">{exactPct}%</span>
              <span className="text-[10px] uppercase font-bold text-on-surface-variant whitespace-nowrap">Exatos</span>
            </div>
          </div>

          <div className="w-full space-y-3.5 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-secondary"></span>
                <span className="font-bold text-on-surface-variant">Placar Exato (5 pts)</span>
              </div>
              <span className="font-extrabold text-white">{totalExacts.toLocaleString()} <span className="text-[9px] text-on-surface-variant font-normal">({exactPct}%)</span></span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary-container"></span>
                <span className="font-bold text-on-surface-variant">Acerto Parcial (2 a 4 pts)</span>
              </div>
              <span className="font-extrabold text-white">{totalWinnerAcertos.toLocaleString()} <span className="text-[9px] text-on-surface-variant font-normal">({correctPct}%)</span></span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-white/10"></span>
                <span className="font-bold text-on-surface-variant">Sem Pontuação (0 ou 1 pt)</span>
              </div>
              <span className="font-extrabold text-white">{totalErrors.toLocaleString()} <span className="text-[9px] text-on-surface-variant font-normal">({errorPct}%)</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent High Performers */}
      <section className="glass-card p-6 md:p-8 rounded-3xl overflow-hidden shadow-lg" id="top-performers-section">
        <h3 className="text-lg md:text-xl font-bold text-white mb-6 tracking-tight">
          Maiores Pontuadores do Bolão
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((rank) => {
            const performer = stats?.topPerformers?.find(p => p.rank === rank) || {
              rank,
              name: '-',
              username: '-',
              avatar: '',
              points: 0
            };

            // Custom color borders/accents depending on podium rank
            const rankColor = performer.rank === 1 
              ? 'border-tertiary/20 hover:border-tertiary/40' 
              : performer.rank === 2 
                ? 'border-slate-300/10 hover:border-slate-300/30' 
                : 'border-orange-400/10 hover:border-orange-400/30';
            
            const rankBadgeBg = performer.rank === 1 
              ? 'bg-tertiary text-on-tertiary' 
              : performer.rank === 2 
                ? 'bg-slate-300 text-slate-800' 
                : 'bg-orange-400 text-orange-950';

            return (
              <div key={rank} className={`bg-white/5 rounded-2xl p-4 flex items-center gap-4 border transition-all ${rankColor}`} id={`top-performer-${performer.rank}`}>
                <div className="relative">
                  {performer.avatar ? (
                    <img 
                      src={performer.avatar} 
                      alt={performer.name} 
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-full border border-white/20 object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0">
                      <User size={20} />
                    </div>
                  )}
                  <span className={`absolute -top-1.5 -right-1.5 text-[10px] font-black px-1.5 py-0.5 rounded-full shadow border border-surface ${rankBadgeBg}`}>
                    #{performer.rank}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm truncate">{performer.name}</p>
                  <p className="text-[10px] text-on-surface-variant font-medium truncate">@{performer.username}</p>
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-xl text-primary leading-none">{performer.points}</p>
                  <p className="text-[8px] uppercase font-bold text-on-surface-variant">pontos</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

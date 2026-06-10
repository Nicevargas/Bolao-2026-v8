import React, { useEffect, useState } from 'react';
import { Sparkles, BarChart3, Users, PieChart, Star, User } from 'lucide-react';

export default function Estatisticas() {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 150);
    return () => clearTimeout(timer);
  }, []);

  const rounds = [
    { label: 'R1', value: '45%', points: '18 pts', active: false },
    { label: 'R2', value: '65%', points: '26 pts', active: false },
    { label: 'R3', value: '85%', points: '34 pts', active: false },
    { label: 'Oitavas', value: '55%', points: '22 pts', active: true },
    { label: 'Quartas', value: '70%', points: '28 pts', active: false },
    { label: 'Semi', value: '10%', points: '0 pts', active: false },
    { label: 'Final', value: '10%', points: '0 pts', active: false },
  ];

  return (
    <div className="animate-in fade-in duration-300 relative text-left">
      {/* Welcome & Summary Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2 tracking-tight">Estatísticas do Bolão</h1>
        <p className="text-on-surface-variant font-medium text-sm md:text-base max-w-2xl">
          Acompanhe o desempenho global dos participantes e a precisão dos palpites em tempo real.
        </p>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Card: Total de Palpites */}
        <div className="glass-card p-6 flex items-center gap-5 rounded-2xl">
          <div className="w-14 h-14 rounded-2xl bg-secondary-container/20 flex items-center justify-center text-secondary">
            <Sparkles size={28} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Total de Palpites</p>
            <p className="text-2xl md:text-3xl font-extrabold text-white">12.482</p>
          </div>
        </div>

        {/* Card: Média de Pontos */}
        <div className="glass-card p-6 flex items-center gap-5 rounded-2xl">
          <div className="w-14 h-14 rounded-2xl bg-primary-container/20 flex items-center justify-center text-primary">
            <BarChart3 size={28} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Média de Pontos</p>
            <p className="text-2xl md:text-3xl font-extrabold text-white">42.5</p>
          </div>
        </div>

        {/* Card: Participantes Ativos */}
        <div className="glass-card p-6 flex items-center gap-5 rounded-2xl">
          <div className="w-14 h-14 rounded-2xl bg-tertiary-container/20 flex items-center justify-center text-tertiary">
            <Users size={28} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Participantes Ativos</p>
            <p className="text-2xl md:text-3xl font-extrabold text-white">856</p>
          </div>
        </div>
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        {/* Left Column: Performance Chart */}
        <div className="lg:col-span-8 glass-card p-6 md:p-8 rounded-3xl flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg md:text-xl font-bold text-white tracking-tight">Pontos por Rodada</h3>
              <p className="text-on-surface-variant text-xs font-semibold">Evolução da média de pontuação geral</p>
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
                  style={{ height: animate ? round.value : '0%' }}
                >
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-surface-container-high border border-white/10 p-1.5 rounded-lg text-[10px] md:text-xs text-white whitespace-nowrap shadow-xl z-20 font-bold">
                    {round.points}
                  </div>
                </div>
                <span className="text-[9px] md:text-xs text-on-surface-variant font-bold uppercase tracking-wider">
                  {round.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Precision Donut */}
        <div className="lg:col-span-4 glass-card p-6 md:p-8 rounded-3xl flex flex-col items-center justify-between">
          <div className="w-full text-center">
            <h3 className="text-lg md:text-xl font-bold text-white mb-1">Precisão</h3>
            <p className="text-on-surface-variant text-xs font-semibold">Placar Exato vs Acertos</p>
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
              {/* Success Layer (Acertos) */}
              <circle
                className="text-primary-container"
                cx="50"
                cy="50"
                fill="transparent"
                r="40"
                stroke="currentColor"
                strokeWidth="12"
                strokeDasharray="251.2"
                strokeDashoffset={animate ? '75' : '251.2'}
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
                strokeDashoffset={animate ? '180' : '251.2'}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s ease-out' }}
              ></circle>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl md:text-3xl font-extrabold text-white">28%</span>
              <span className="text-[10px] uppercase font-bold text-on-surface-variant">Exatos</span>
            </div>
          </div>

          <div className="w-full space-y-3.5 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-secondary"></span>
                <span className="font-bold text-on-surface-variant">Placar Exato</span>
              </div>
              <span className="font-extrabold text-white">3.495</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary-container"></span>
                <span className="font-bold text-on-surface-variant">Acerto Vencedor</span>
              </div>
              <span className="font-extrabold text-white">6.120</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-white/10"></span>
                <span className="font-bold text-on-surface-variant">Erros</span>
              </div>
              <span className="font-extrabold text-white">2.867</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent High Performers */}
      <section className="glass-card p-6 md:p-8 rounded-3xl overflow-hidden shadow-lg">
        <h3 className="text-lg md:text-xl font-bold text-white mb-6 tracking-tight">
          Maiores Pontuadores da Rodada
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Top 1 */}
          <div className="bg-white/5 rounded-2xl p-4 flex items-center gap-4 border border-tertiary/20 group hover:border-tertiary/40 transition-colors">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0">
                <User size={20} />
              </div>
              <span className="absolute -top-1.5 -right-1.5 bg-tertiary text-on-tertiary text-[10px] font-black px-1.5 py-0.5 rounded-full shadow border border-surface">
                #1
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-sm truncate">Enzo Machado</p>
              <p className="text-[10px] text-on-surface-variant font-medium">@enzo_swim</p>
            </div>
            <div className="text-right">
              <p className="font-extrabold text-xl text-tertiary leading-none">98</p>
              <p className="text-[8px] uppercase font-bold text-on-surface-variant">pontos</p>
            </div>
          </div>

          {/* Top 2 */}
          <div className="bg-white/5 rounded-2xl p-4 flex items-center gap-4 border border-white/5 group hover:border-primary/20 transition-colors">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0">
                <User size={20} />
              </div>
              <span className="absolute -top-1.5 -right-1.5 bg-slate-300 text-slate-800 text-[10px] font-black px-1.5 py-0.5 rounded-full shadow border border-surface">
                #2
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-sm truncate">Julia Soares</p>
              <p className="text-[10px] text-on-surface-variant font-medium">@juh_natacao</p>
            </div>
            <div className="text-right">
              <p className="font-extrabold text-xl text-primary leading-none">85</p>
              <p className="text-[8px] uppercase font-bold text-on-surface-variant">pontos</p>
            </div>
          </div>

          {/* Top 3 */}
          <div className="bg-white/5 rounded-2xl p-4 flex items-center gap-4 border border-white/5 group hover:border-primary/25 transition-colors">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0">
                <User size={20} />
              </div>
              <span className="absolute -top-1.5 -right-1.5 bg-orange-400 text-orange-900 text-[10px] font-black px-1.5 py-0.5 rounded-full shadow border border-surface">
                #3
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-sm truncate">Gabriel Costa</p>
              <p className="text-[10px] text-on-surface-variant font-medium">@biel_costa</p>
            </div>
            <div className="text-right">
              <p className="font-extrabold text-xl text-primary leading-none">82</p>
              <p className="text-[8px] uppercase font-bold text-on-surface-variant">pontos</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

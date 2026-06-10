import React from 'react';
import { Trophy, TrendingUp, Award, Target, Clock, Zap, Star, X } from 'lucide-react';
import { UserProfile } from '../types';

interface DashboardProps {
  user: UserProfile;
  onNavigate: (tab: string) => void;
}

export default function Dashboard({ user, onNavigate }: DashboardProps) {
  return (
    <div className="animate-in fade-in duration-300">
      {/* Welcome Message */}
      <section className="mb-8 text-left">
        <h1 className="text-3xl md:text-4xl font-black mb-2 tracking-tight text-white">
          Olá, {user.name}! 👋
        </h1>
        <p className="text-on-surface-variant font-medium text-sm md:text-base">
          Sua jornada rumo ao topo do pódio continua agora.
        </p>
      </section>

      {/* Bento Grid: Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Minha Posição */}
        <div className="glass-card rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity select-none pointer-events-none">
            <Trophy size={140} className="text-tertiary" />
          </div>
          <div className="z-10">
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Minha Posição</p>
            <h2 className="text-5xl font-extrabold tracking-tight text-tertiary">#{user.rank}</h2>
          </div>
          <div className="z-10 mt-4 flex items-center gap-2 text-xs font-bold text-green-400">
            <TrendingUp size={16} />
            <span>Subiu 3 posições</span>
          </div>
        </div>

        {/* Meus Pontos */}
        <div className="glass-card rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity select-none pointer-events-none">
            <Award size={140} className="text-primary" />
          </div>
          <div className="z-10">
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Meus Pontos</p>
            <h2 className="text-5xl font-extrabold tracking-tight text-primary">
              {user.points} <span className="text-xl font-bold text-on-surface-variant">pts</span>
            </h2>
          </div>
          <div className="z-10 mt-4 flex items-center gap-2 text-xs font-bold text-on-surface-variant">
            <span>Média do grupo: 32 pts</span>
          </div>
        </div>

        {/* Placares Exatos */}
        <div className="glass-card rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity select-none pointer-events-none">
            <Target size={140} className="text-secondary" />
          </div>
          <div className="z-10">
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Placares Exatos</p>
            <h2 className="text-5xl font-extrabold tracking-tight text-secondary">
              {user.exacts < 10 ? `0${user.exacts}` : user.exacts}
            </h2>
          </div>
          <div className="z-10 mt-4 flex items-center gap-2 text-xs font-bold text-on-surface-variant">
            <span>Taxa de precisão: {user.accuracy}%</span>
          </div>
        </div>
      </div>

      {/* Highlighted Card: Próximo Jogo */}
      <section className="mb-10">
        <div className="glass-card rounded-3xl p-6 md:p-8 border-l-4 border-secondary relative overflow-hidden">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-8 relative z-10 w-full">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold tracking-wider mb-4">
                <Clock size={12} className="mr-1.5" />
                PRÓXIMO JOGO EM DESTAQUE
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-2 tracking-tight text-white">Brasil vs Alemanha</h3>
              <p className="text-on-surface-variant text-sm md:text-base font-medium">22/06 • 16h00 • Arena Mundial</p>
            </div>

            <div className="flex items-center justify-center gap-6 md:gap-10">
              <div className="flex flex-col items-center">
                <img
                  alt="Brasil Flag"
                  referrerPolicy="no-referrer"
                  className="w-16 h-12 md:w-20 md:h-14 object-cover rounded-xl shadow-lg border border-white/10 mb-2 transition-transform hover:scale-105"
                  src="https://flagcdn.com/w80/br.png"
                />
                <span className="font-extrabold text-white text-sm md:text-base select-none">BRA</span>
              </div>
              <div className="text-3xl md:text-4xl font-black text-on-surface/30 px-2 italic">VS</div>
              <div className="flex flex-col items-center">
                <img
                  alt="Alemanha Flag"
                  referrerPolicy="no-referrer"
                  className="w-16 h-12 md:w-20 md:h-14 object-cover rounded-xl shadow-lg border border-white/10 mb-2 transition-transform hover:scale-105"
                  src="https://flagcdn.com/w80/de.png"
                />
                <span className="font-extrabold text-white text-sm md:text-base select-none">GER</span>
              </div>
            </div>

            <div>
              <button
                onClick={() => onNavigate('Apostas')}
                className="bg-secondary-container text-on-secondary-container px-6 py-3.5 rounded-full font-bold text-sm neon-glow-pink hover:scale-105 transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer w-full md:w-auto"
              >
                <span>DAR PALPITE</span>
                <Zap size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Content: Recent Predictions */}
      <section className="text-left">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl md:text-2xl font-bold tracking-tight text-white">Últimos Resultados</h3>
          <button
            onClick={() => onNavigate('MeusPalpites')}
            className="text-primary font-bold text-sm hover:underline hover:text-primary-container transition-colors cursor-pointer"
          >
            Ver tudo
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass-card rounded-2xl p-4 flex items-center justify-between group hover:border-primary/20 transition-all">
            <div className="flex items-center gap-4">
              <div className="bg-surface-container-high/60 p-3 rounded-xl flex items-center justify-center text-tertiary">
                <Star size={20} className="fill-tertiary" />
              </div>
              <div>
                <p className="font-bold text-white text-sm md:text-base">Argentina 2 - 1 França</p>
                <p className="text-xs text-on-surface-variant font-medium">Seu palpite: 2-1 • Acertou em cheio!</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-tertiary font-black text-sm md:text-base">+10 pts</span>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-4 flex items-center justify-between group hover:border-pink-500/20 transition-all">
            <div className="flex items-center gap-4">
              <div className="bg-surface-container-high/60 p-3 rounded-xl flex items-center justify-center text-error">
                <X size={20} />
              </div>
              <div>
                <p className="font-bold text-white text-sm md:text-base">Espanha 0 - 0 Japão</p>
                <p className="text-xs text-on-surface-variant font-medium">Seu palpite: 2-0 • Errou o vencedor</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-error font-black text-sm md:text-base">+0 pts</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

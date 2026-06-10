import React from 'react';
import { Trophy, TrendingUp, Award, Target, Clock, Zap, Star } from 'lucide-react';
import { UserProfile, Match } from '../types';

interface DashboardProps {
  user: UserProfile;
  matches: Match[];
  onNavigate: (tab: string) => void;
}

export default function Dashboard({ user, matches, onNavigate }: DashboardProps) {
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

        {(() => {
          const finishedMatches = matches ? matches.filter(
            m => m.status === 'ENCERRADO' || m.status === 'PONTUADO' || (m.realHomeScore !== undefined && m.realHomeScore !== null)
          ) : [];

          if (finishedMatches.length === 0) {
            return (
              <div className="glass-card rounded-3xl p-8 text-center border border-white/5 bg-white/[0.01]">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4 text-pink-400">
                  <Trophy size={24} />
                </div>
                <h4 className="text-base font-bold text-white mb-1">Nenhum resultado disponível</h4>
                <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed mb-4 font-medium">
                  Ainda não temos jogos finalizados no banco de dados. Os resultados oficiais do torneio aparecerão aqui assim que as partidas forem concluídas!
                </p>
                <button
                  onClick={() => onNavigate('Apostas')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/20 text-pink-400 hover:text-pink-300 rounded-xl font-bold text-xs uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-98 cursor-pointer shadow-lg shadow-pink-500/5 hover:border-pink-500/30"
                >
                  <span>Ver Próximos Jogos</span>
                </button>
              </div>
            );
          }

          const calculateScore = (golsT1: number, golsT2: number, palpiteT1: number, palpiteT2: number): number => {
            const resultado_correto = (golsT1 > golsT2 && palpiteT1 > palpiteT2) || 
                                      (golsT1 < golsT2 && palpiteT1 < palpiteT2) || 
                                      (golsT1 === golsT2 && palpiteT1 === palpiteT2);
                                      
            const gol_time1_correto = (golsT1 === palpiteT1);
            const gol_time2_correto = (golsT2 === palpiteT2);
            const placar_exato = (golsT1 === palpiteT1 && golsT2 === palpiteT2);
            
            let pontos = 0;
            if (resultado_correto) pontos += 2;
            if (gol_time1_correto) pontos += 1;
            if (gol_time2_correto) pontos += 1;
            if (placar_exato) pontos += 1;

            return pontos;
          };

          return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {finishedMatches.slice(0, 4).map(m => {
                const hasGuess = m.userHomeScore !== undefined && m.userAwayScore !== undefined && m.userHomeScore !== "";
                const valT1 = m.realHomeScore ?? 0;
                const valT2 = m.realAwayScore ?? 0;
                
                let pts = 0;
                let detailText = "Você não registrou palpite para este jogo.";
                if (hasGuess) {
                  const p1 = Number(m.userHomeScore);
                  const p2 = Number(m.userAwayScore);
                  pts = calculateScore(valT1, valT2, p1, p2);
                  if (pts === 5) {
                    detailText = `Seu palpite: ${p1}-${p2} • Acertou em cheio! 🎯`;
                  } else if (pts > 0) {
                    detailText = `Seu palpite: ${p1}-${p2} • Acertou o resultado.`;
                  } else {
                    detailText = `Seu palpite: ${p1}-${p2} • Errou o resultado.`;
                  }
                }

                return (
                  <div key={m.id} className="glass-card rounded-2xl p-4 flex items-center justify-between group hover:border-primary/20 transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl flex items-center justify-center ${pts === 5 ? 'bg-tertiary/10 text-tertiary shadow-[0_0_15px_rgba(244,63,94,0.15)]' : pts > 0 ? 'bg-primary/10 text-primary' : 'bg-white/5 text-gray-400'}`}>
                        {pts === 5 ? <Star size={20} className="fill-tertiary animate-pulse" /> : <Trophy size={20} />}
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm md:text-base flex items-center gap-2">
                          <span>{m.homeTeam} {m.realHomeScore}</span>
                          <span className="text-gray-500 font-normal text-xs font-mono">x</span>
                          <span>{m.realAwayScore} {m.awayTeam}</span>
                        </p>
                        <p className="text-xs text-on-surface-variant font-medium mt-0.5">
                          {detailText}
                        </p>
                      </div>
                    </div>
                    <div className="text-right pl-2">
                      <span className={`font-black text-sm md:text-base ${pts > 0 ? 'text-tertiary' : 'text-gray-500'}`}>
                        +{pts} pts
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </section>
    </div>
  );
}

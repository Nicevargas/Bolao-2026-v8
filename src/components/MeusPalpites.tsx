import React from 'react';
import { Sparkles, Calendar, Award } from 'lucide-react';
import { Match, UserProfile } from '../types';

interface MeusPalpitesProps {
  user: UserProfile;
  matches: Match[];
  onNavigate: (tab: string) => void;
}

export default function MeusPalpites({ user, matches, onNavigate }: MeusPalpitesProps) {
  // Mock history list as defined in mockup plus real saved ones
  const historyData = [
    {
      date: '14/06 - 15:00',
      homeTeam: 'Brasil',
      awayTeam: 'México',
      homeFlag: 'https://flagcdn.com/w80/br.png',
      awayFlag: 'https://flagcdn.com/w80/mx.png',
      guess: '2 - 0',
      result: '2 - 0',
      points: '+15',
      status: 'PONTUADO'
    },
    {
      date: '15/06 - 11:00',
      homeTeam: 'França',
      awayTeam: 'Japão',
      homeFlag: 'https://flagcdn.com/w80/fr.png',
      awayFlag: 'https://flagcdn.com/w80/jp.png',
      guess: '3 - 1',
      result: '2 - 1',
      points: '+05',
      status: 'PONTUADO'
    },
    {
      date: '15/06 - 20:00',
      homeTeam: 'Argentina',
      awayTeam: 'Portugal',
      homeFlag: 'https://flagcdn.com/w80/ar.png',
      awayFlag: 'https://flagcdn.com/w80/pt.png',
      guess: '1 - 1',
      result: '0 - 2',
      points: '0',
      status: 'ENCERRADO'
    },
  ];

  return (
    <div className="animate-in fade-in duration-300 relative text-left">
      <div className="mb-8">
        <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-2 tracking-tight">Meus Palpites</h2>
        <p className="text-on-surface-variant font-medium text-sm md:text-base">
          Acompanhe seu desempenho e histórico de apostas no mundial.
        </p>
      </div>

      {/* Dashboard Stats Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Pontuação Total</span>
          <span className="text-4xl font-extrabold text-primary metrics-glow mt-2">{user.points}</span>
        </div>
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Acertos Exatos</span>
          <span className="text-4xl font-extrabold text-tertiary metrics-glow mt-2">
            {user.exacts < 10 ? `0${user.exacts}` : user.exacts}
          </span>
        </div>
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Posição Geral</span>
          <span className="text-4xl font-extrabold text-secondary metrics-glow mt-2">#{user.rank}</span>
        </div>
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between border-secondary-container/20">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Próximo Jogo</span>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xl font-bold text-white tracking-tight">BRA x GER</span>
          </div>
          <span className="text-xs font-bold text-secondary mt-1 uppercase tracking-widest animate-pulse">
            Apostas Abertas
          </span>
        </div>
      </div>

      {/* History Table Section */}
      <div className="glass-card rounded-2xl overflow-hidden shadow-xl border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="bg-white/5 border-b border-white/10 uppercase tracking-wider font-bold">
                <th className="px-6 py-4 text-xs text-on-surface-variant">Data</th>
                <th className="px-6 py-4 text-xs text-on-surface-variant">Confronto</th>
                <th className="px-6 py-4 text-xs text-on-surface-variant text-center">Meu Palpite</th>
                <th className="px-6 py-4 text-xs text-on-surface-variant text-center">Resultado</th>
                <th className="px-6 py-4 text-xs text-on-surface-variant text-center">Pontos</th>
                <th className="px-6 py-4 text-xs text-on-surface-variant">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium">
              {/* Static Historic Matches */}
              {historyData.map((row, idx) => (
                <tr key={idx} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-5 text-sm text-on-surface/80">{row.date}</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <img
                        alt={row.homeTeam}
                        referrerPolicy="no-referrer"
                        className="w-8 h-6 object-cover rounded shadow border border-white/10"
                        src={row.homeFlag}
                      />
                      <span className="text-sm font-bold text-white">{row.homeTeam}</span>
                      <span className="text-on-surface-variant text-xs font-semibold mx-1">vs</span>
                      <span className="text-sm font-bold text-white">{row.awayTeam}</span>
                      <img
                        alt={row.awayTeam}
                        referrerPolicy="no-referrer"
                        className="w-8 h-6 object-cover rounded shadow border border-white/10"
                        src={row.awayFlag}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="bg-primary/10 text-primary font-bold text-base px-3 py-1 rounded-lg">
                      {row.guess}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="text-on-surface font-bold text-base">{row.result}</span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`font-extrabold text-base ${row.points !== '0' ? 'text-tertiary' : 'text-on-surface-variant'}`}>
                      {row.points}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                        row.status === 'PONTUADO'
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-white/10 text-on-surface-variant border border-white/20'
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}

              {/* Real / Interactive Active Guesses from matches state */}
              {matches.map((m, idx) => {
                const hasGuess = m.userHomeScore !== undefined && m.userAwayScore !== undefined;
                return (
                  <tr
                    key={m.id}
                    className={`hover:bg-white/5 transition-colors group ${
                      idx % 2 === 0 ? 'bg-white/[0.01]' : ''
                    }`}
                  >
                    <td className="px-6 py-5 text-sm text-on-surface/80">
                      {m.date} - {m.time}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <img
                          alt={m.homeTeam}
                          referrerPolicy="no-referrer"
                          className="w-8 h-6 object-cover rounded shadow border border-white/10"
                          src={m.homeFlag}
                        />
                        <span className="text-sm font-bold text-white">{m.homeTeam}</span>
                        <span className="text-on-surface-variant text-xs font-semibold mx-1">vs</span>
                        <span className="text-sm font-bold text-white">{m.awayTeam}</span>
                        <img
                          alt={m.awayTeam}
                          referrerPolicy="no-referrer"
                          className="w-8 h-6 object-cover rounded shadow border border-white/10"
                          src={m.awayFlag}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      {hasGuess ? (
                        <span className="bg-secondary-container/20 text-secondary font-bold text-base px-3 py-1 rounded-lg ring-1 ring-secondary/30">
                          {m.userHomeScore} - {m.userAwayScore}
                        </span>
                      ) : (
                        <button
                          onClick={() => onNavigate('Apostas')}
                          className="text-xs text-secondary hover:underline cursor-pointer"
                        >
                          Palpitar
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-5 text-center text-on-surface-variant text-sm italic">
                      {m.realHomeScore !== undefined ? `${m.realHomeScore} - ${m.realAwayScore}` : '- -'}
                    </td>
                    <td className="px-6 py-5 text-center text-on-surface-variant text-sm italic">
                      {m.pointsEarned !== undefined ? `+${m.pointsEarned}` : '-'}
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                          hasGuess
                            ? 'bg-secondary-container/20 text-secondary border border-secondary/40 animate-pulse'
                            : 'bg-white/5 text-on-surface-variant/50 border border-white/5'
                        }`}
                      >
                        {hasGuess ? 'ABERTO' : 'SEM PALPITE'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Desktop FAB mock */}
      <div className="fixed bottom-8 right-8 hidden md:block z-20">
        <button
          onClick={() => onNavigate('Apostas')}
          className="bg-secondary-container text-white px-8 py-4 rounded-full font-bold shadow-2xl hover:scale-105 active:scale-95 transition-transform flex items-center gap-2 group cursor-pointer"
        >
          <Calendar size={18} />
          <span>NOVO PALPITE</span>
        </button>
      </div>
    </div>
  );
}

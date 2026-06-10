import React, { useState } from 'react';
import { Loader2, Check } from 'lucide-react';
import { Match } from '../types';

interface ApostasProps {
  matches: Match[];
  onSaveGuess: (matchId: string, homeScore: number, awayScore: number) => void;
}

export default function Apostas({ matches, onSaveGuess }: ApostasProps) {
  // Store loading/saved status for each button
  const [savingStatus, setSavingStatus] = useState<Record<string, 'idle' | 'saving' | 'saved'>>({});
  // Local score states for active inputs
  const [scores, setScores] = useState<Record<string, { home: string; away: string }>>({});

  // Synchronize dynamic API-loaded matches into local scores state
  React.useEffect(() => {
    const initial: Record<string, { home: string; away: string }> = {};
    matches.forEach(m => {
      initial[m.id] = {
        home: m.userHomeScore !== undefined && m.userHomeScore !== null ? m.userHomeScore.toString() : '',
        away: m.userAwayScore !== undefined && m.userAwayScore !== null ? m.userAwayScore.toString() : ''
      };
    });
    setScores(initial);
  }, [matches]);

  const handleScoreChange = (matchId: string, field: 'home' | 'away', value: string) => {
    // Limit length to 2 digits
    const cleaned = value.replace(/[^0-9]/g, '').slice(0, 2);
    setScores(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [field]: cleaned
      }
    }));
  };

  const handleSave = (matchId: string) => {
    const matchScores = scores[matchId];
    if (!matchScores || matchScores.home === '' || matchScores.away === '') return;

    setSavingStatus(prev => ({ ...prev, [matchId]: 'saving' }));

    setTimeout(() => {
      onSaveGuess(matchId, Number(matchScores.home), Number(matchScores.away));
      setSavingStatus(prev => ({ ...prev, [matchId]: 'saved' }));

      setTimeout(() => {
        setSavingStatus(prev => ({ ...prev, [matchId]: 'idle' }));
      }, 2000);
    }, 1000);
  };

  return (
    <div className="animate-in fade-in duration-300 relative text-left">
      {/* Decorative localized splashes as in mockup */}
      <div className="absolute top-[-2%] left-[-4%] w-[250px] h-[250px] bg-[#8ce000] opacity-5 blur-[60px] rounded-full pointer-events-none select-none"></div>
      <div className="absolute top-[-2%] right-[-4%] w-[250px] h-[250px] bg-[#fabd00] opacity-5 blur-[60px] rounded-full pointer-events-none select-none"></div>

      <section className="mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2 tracking-tight">Próximos Jogos</h1>
        <p className="text-on-surface-variant font-medium text-sm md:text-base">
          Garanta seus pontos! Faça seus palpites para a fase de grupos.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
        {matches.map(match => {
          const status = savingStatus[match.id] || 'idle';
          const currentScores = scores[match.id] || { home: '', away: '' };
          const isValid = currentScores.home !== '' && currentScores.away !== '';

          return (
            <div
              key={match.id}
              className="glass-card rounded-2xl p-6 flex flex-col items-center justify-between transition-all duration-300 hover:scale-[1.01] hover:bg-white/10"
            >
              <div className="w-full flex items-center justify-between gap-1 sm:gap-2 mb-6">
                {/* Home Team */}
                <div className="flex flex-col items-center gap-2 flex-1">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden border border-white/20 shadow-md">
                    <img
                      alt={match.homeTeam}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                      src={match.homeFlag}
                    />
                  </div>
                  <span className="font-bold text-[10px] sm:text-xs uppercase tracking-wider text-on-surface text-center">
                    {match.homeTeam}
                  </span>
                </div>

                {/* Scores Inputs */}
                <div className="flex items-center gap-1.5 sm:gap-2 px-1 sm:px-2">
                  <input
                    type="text"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    placeholder="0"
                    onFocus={(e) => e.target.select()}
                    className="w-10 h-12 sm:w-12 sm:h-14 md:w-14 md:h-16 bg-surface-container-high border-2 border-primary/20 rounded-xl text-center font-extrabold text-xl sm:text-2xl md:text-3xl text-on-surface focus:border-secondary focus:outline-none transition-all placeholder:opacity-30"
                    value={currentScores.home}
                    onChange={(e) => handleScoreChange(match.id, 'home', e.target.value)}
                  />
                  <span className="font-black text-on-surface-variant text-base sm:text-lg md:text-xl">X</span>
                  <input
                    type="text"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    placeholder="0"
                    onFocus={(e) => e.target.select()}
                    className="w-10 h-12 sm:w-12 sm:h-14 md:w-14 md:h-16 bg-surface-container-high border-2 border-primary/20 rounded-xl text-center font-extrabold text-xl sm:text-2xl md:text-3xl text-on-surface focus:border-secondary focus:outline-none transition-all placeholder:opacity-30"
                    value={currentScores.away}
                    onChange={(e) => handleScoreChange(match.id, 'away', e.target.value)}
                  />
                </div>

                {/* Away Team */}
                <div className="flex flex-col items-center gap-2 flex-1">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden border border-white/20 shadow-md">
                    <img
                      alt={match.awayTeam}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                      src={match.awayFlag}
                    />
                  </div>
                  <span className="font-bold text-[10px] sm:text-xs uppercase tracking-wider text-on-surface text-center">
                    {match.awayTeam}
                  </span>
                </div>
              </div>

              {/* Card Footer Details */}
              <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/5 pt-4">
                <div className="flex flex-col text-center sm:text-left">
                  <span className="text-[10px] md:text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    {match.date} • {match.time}
                  </span>
                  <span className="text-[10px] md:text-xs font-extrabold text-tertiary uppercase tracking-wider">
                    {match.location}
                  </span>
                </div>

                <button
                  disabled={!isValid || status === 'saving'}
                  onClick={() => handleSave(match.id)}
                  className={`w-full sm:w-auto px-6 py-2.5 rounded-full font-bold text-xs shadow-md transition-all uppercase tracking-wider cursor-pointer ${
                    status === 'saved'
                      ? 'bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]'
                      : 'bg-secondary-container text-on-secondary-container hover:bg-secondary-container/90 active:scale-95 disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(255,0,140,0.3)]'
                  }`}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    {status === 'saving' && <Loader2 size={14} className="animate-spin" />}
                    {status === 'saved' && <Check size={14} />}
                    {status === 'idle' && 'Salvar Palpite'}
                    {status === 'saving' && 'Salvando...'}
                    {status === 'saved' && 'Salvo!'}
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

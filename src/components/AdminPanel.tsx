import React, { useState } from 'react';
import { Settings, Shield, PlusCircle, RefreshCw, Save, HelpCircle, Sparkles, Check } from 'lucide-react';
import { Match } from '../types';

interface AdminPanelProps {
  matches: Match[];
  onStateMutated: () => void;
}

export default function AdminPanel({ matches, onStateMutated }: AdminPanelProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New match input states
  const [newMatch, setNewMatch] = useState({
    id: '',
    fase: 'Grupo A',
    grupo: 'Grupo A',
    data_jogo: '26 DE JUNHO - 16:00',
    time1: '',
    time2: '',
    location: 'ARENA COPA'
  });

  // Score states for each game ID
  const [scores, setScores] = useState<Record<string, { t1: number; t2: number }>>({});

  const showFeedback = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => {
      setSuccessMsg(null);
    }, 4000);
  };

  const handleScoreChange = (matchId: string, team: 1 | 2, value: string) => {
    const numVal = Math.max(0, parseInt(value) || 0);
    setScores(prev => ({
      ...prev,
      [matchId]: {
        t1: team === 1 ? numVal : (prev[matchId]?.t1 || 0),
        t2: team === 2 ? numVal : (prev[matchId]?.t2 || 0)
      }
    }));
  };

  const handlePublishScore = async (matchId: string) => {
    const score = scores[matchId];
    if (!score) {
      alert("Defina o placar antes de publicar.");
      return;
    }

    setLoading(matchId);
    try {
      const res = await fetch('/api/admin/lancar-resultado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jogo_id: matchId,
          gols_time1: score.t1,
          gols_time2: score.t2
        })
      });

      if (res.ok) {
        showFeedback(`Ok! Placar do jogo ${matchId} finalizado com sucesso!`);
        onStateMutated();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  const handleAddMatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatch.id || !newMatch.time1 || !newMatch.time2) {
      alert("Escreva o ID único, Time 1 e Time 2.");
      return;
    }

    setLoading('add_match');
    try {
      const res = await fetch('/api/admin/jogos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMatch)
      });

      if (res.ok) {
        showFeedback(`Sucesso! Novo jogo [${newMatch.time1} x ${newMatch.time2}] adicionado.`);
        setNewMatch({
          id: '',
          fase: 'Grupo A',
          grupo: 'Grupo A',
          data_jogo: '26 DE JUNHO - 16:00',
          time1: '',
          time2: '',
          location: 'ARENA COPA'
        });
        onStateMutated();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  const handleForceReprocess = async () => {
    setLoading('reprocess');
    try {
      const res = await fetch('/api/admin/reprocessar', { method: 'POST' });
      if (res.ok) {
        showFeedback("Mecanismo rodado! Todos os palpites de jogos finalizados foram atualizados via trigger/formulas.");
        onStateMutated();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(null);
    }
  };

  const handleCleanBootstrap = async () => {
    setLoading('seed');
    try {
      const res = await fetch('/api/admin/importar', { method: 'POST' });
      if (res.ok) {
        showFeedback("Banco de jogos redefinido para o padrão da Copa do Mundo 2026!");
        onStateMutated();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="animate-in fade-in duration-300 relative text-left">
      {/* Admin header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2 tracking-tight">Painel Administrativo</h1>
          <p className="text-on-surface-variant font-medium text-sm md:text-base max-w-2xl">
            Simulador de Gestão da Copa. Controle rodadas, lance resultados e recomputação automática de pontos.
          </p>
        </div>

        {/* Floating feedback alert toast inside component */}
        {successMsg && (
          <div className="px-4 py-2.5 bg-green-500/10 border border-green-500/20 text-green-400 font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg animate-in fade-in slide-in-from-top-2">
            <Check size={14} />
            <span>{successMsg}</span>
          </div>
        )}
      </div>

      {/* Overview stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Quick Trigger reprocess */}
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-1">Reprocessador Geral</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Força o recálculo imediato de todos os pontos de palpites com base nos resultados concluídos. Útil em auditoria de regras de pontuação.
            </p>
          </div>
          <button
            onClick={handleForceReprocess}
            disabled={loading !== null}
            className="mt-6 flex items-center justify-center gap-2 px-5 py-3 bg-secondary hover:bg-pink-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-pink-500/10"
          >
            <RefreshCw size={14} className={loading === 'reprocess' ? 'animate-spin' : ''} />
            <span>Recomputar Pontuações</span>
          </button>
        </div>

        {/* Clean Seeder */}
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-1">Redefinir Tabelas</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Deleta alterações e reinsere todo o calendário padrão das quatro partidas inaugurais da Copa. Restaura a integridade da demonstração.
            </p>
          </div>
          <button
            onClick={handleCleanBootstrap}
            disabled={loading !== null}
            className="mt-6 flex items-center justify-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 disabled:opacity-50 text-white border border-white/10 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            <Shield size={14} className={loading === 'seed' ? 'animate-spin' : ''} />
            <span>Redefinir Jogos para Padrão</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        {/* Match Finalization Deck (Left 7 Columns) */}
        <section className="lg:col-span-8 glass-card rounded-3xl p-6 md:p-8 flex flex-col">
          <div className="mb-6 flex justify-between items-center bg-white/[0.02] p-4 rounded-2xl border border-white/5">
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Inserir Resultados Oficiais</h3>
              <p className="text-xs text-on-surface-variant font-medium mt-0.5">O preenchimento destes dados dispara automaticamente as recomputações de pontos dos apostadores.</p>
            </div>
            <Sparkles size={20} className="text-secondary animate-pulse" />
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
            {matches.map((m) => {
              const isMatchDone = m.status === 'ENCERRADO';
              const currentT1 = scores[m.id]?.t1 ?? (m.realHomeScore ?? 0);
              const currentT2 = scores[m.id]?.t2 ?? (m.realAwayScore ?? 0);

              return (
                <div
                  key={m.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isMatchDone
                      ? 'bg-green-500/5 border-green-500/20'
                      : 'bg-white/5 border-white/5 hover:border-pink-500/10'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase bg-white/5 px-2 py-0.5 rounded">
                        {m.location || 'Copa 2026'}
                      </span>
                      <span className="text-[10px] text-on-surface-variant font-medium">{m.date}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <img src={m.homeFlag} alt="" className="w-6 h-4 object-cover rounded shadow" />
                      <span className="font-bold text-sm text-white">{m.homeTeam}</span>
                      <span className="text-xs text-on-surface-variant">vs</span>
                      <img src={m.awayFlag} alt="" className="w-6 h-4 object-cover rounded shadow" />
                      <span className="font-bold text-sm text-white">{m.awayTeam}</span>
                    </div>
                  </div>

                  {/* Input Score Counters */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 bg-[#020819] px-3 py-1.5 rounded-xl border border-white/5">
                      <input
                        type="number"
                        min="0"
                        disabled={isMatchDone && loading !== m.id}
                        value={scores[m.id]?.t1 ?? (m.realHomeScore !== undefined ? m.realHomeScore : '')}
                        onChange={(e) => handleScoreChange(m.id, 1, e.target.value)}
                        placeholder="0"
                        className="w-10 bg-transparent text-center font-black text-white text-base focus:outline-none"
                      />
                      <span className="text-white/30 text-xs font-bold">x</span>
                      <input
                        type="number"
                        min="0"
                        disabled={isMatchDone && loading !== m.id}
                        value={scores[m.id]?.t2 ?? (m.realAwayScore !== undefined ? m.realAwayScore : '')}
                        onChange={(e) => handleScoreChange(m.id, 2, e.target.value)}
                        placeholder="0"
                        className="w-10 bg-transparent text-center font-black text-white text-base focus:outline-none"
                      />
                    </div>

                    <button
                      onClick={() => handlePublishScore(m.id)}
                      disabled={loading !== null}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                        isMatchDone
                          ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                          : 'bg-primary text-on-primary hover:bg-primary/90'
                      }`}
                    >
                      <Save size={13} />
                      <span>{isMatchDone ? 'Atualizar' : 'Publicar'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Add Custom Game Calendar Form (Right 4 Columns) */}
        <section className="lg:col-span-4 glass-card rounded-3xl p-6 md:p-8 flex flex-col justify-between">
          <form onSubmit={handleAddMatchSubmit} className="space-y-4">
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-1.5 border-b border-white/5 pb-3">
              <PlusCircle size={18} className="text-primary-container" />
              <span>Inserir Novo Jogo</span>
            </h3>

            <div className="space-y-1 text-xs">
              <label className="font-bold text-on-surface-variant uppercase">ID Único do Confronto</label>
              <input
                type="text"
                required
                placeholder="Exemplo: wc5"
                value={newMatch.id}
                onChange={(e) => setNewMatch(prev => ({ ...prev, id: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-primary-container rounded-xl py-2.5 px-3 text-white focus:outline-none transition-colors mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 text-xs">
                <label className="font-bold text-on-surface-variant uppercase">Time Casa</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Uruguai"
                  value={newMatch.time1}
                  onChange={(e) => setNewMatch(prev => ({ ...prev, time1: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-primary-container rounded-xl py-2.5 px-3 text-white focus:outline-none transition-colors mt-1"
                />
              </div>

              <div className="space-y-1 text-xs">
                <label className="font-bold text-on-surface-variant uppercase">Time Fora</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Inglaterra"
                  value={newMatch.time2}
                  onChange={(e) => setNewMatch(prev => ({ ...prev, time2: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-primary-container rounded-xl py-2.5 px-3 text-white focus:outline-none transition-colors mt-1"
                />
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-bold text-on-surface-variant uppercase">Fase / Rodada</label>
              <input
                type="text"
                placeholder="Ex: Grupo A ou Oitavas"
                value={newMatch.fase}
                onChange={(e) => setNewMatch(prev => ({ ...prev, fase: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-primary-container rounded-xl py-2.5 px-3 text-white focus:outline-none transition-colors mt-1"
              />
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-bold text-on-surface-variant uppercase">Data & Horário</label>
              <input
                type="text"
                placeholder="Ex: 26 DE JUNHO - 16:00"
                value={newMatch.data_jogo}
                onChange={(e) => setNewMatch(prev => ({ ...prev, data_jogo: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-primary-container rounded-xl py-2.5 px-3 text-white focus:outline-none transition-colors mt-1"
              />
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-bold text-on-surface-variant uppercase">Estádio / Arena</label>
              <input
                type="text"
                placeholder="Ex: Wembley Stadium"
                value={newMatch.location}
                onChange={(e) => setNewMatch(prev => ({ ...prev, location: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-primary-container rounded-xl py-2.5 px-3 text-white focus:outline-none transition-colors mt-1"
              />
            </div>

            <button
              type="submit"
              disabled={loading !== null}
              className="w-full mt-4 flex items-center justify-center gap-2 px-5 py-3 bg-[#001c5c] border border-primary/40 hover:bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              <span>Salvar Novo Jogo</span>
            </button>
          </form>
        </section>
      </div>

    </div>
  );
}

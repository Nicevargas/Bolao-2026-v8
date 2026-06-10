import React, { useState } from 'react';
import { Award, Trophy, Shield, HelpCircle, Activity, Globe, Info, User } from 'lucide-react';
import { Participant } from '../types';

interface RankingProps {
  participants: Participant[];
  standings: any[];
  isLoadingStandings: boolean;
  configStatus?: { supabase: boolean; footballData: boolean; supabaseUrl: string | null } | null;
}

export default function Ranking({ participants, standings, isLoadingStandings, configStatus }: RankingProps) {
  const [viewMode, setViewMode] = useState<'bolao' | 'tabela'>('bolao');

  // Extract top 3 for players podium
  const gold = participants[0];
  const silver = participants[1];
  const bronze = participants[2];
  const rest = participants.slice(3);

  return (
    <div className="animate-in fade-in duration-300 relative text-left">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2 tracking-tight">
            {viewMode === 'bolao' ? 'Classificação do Bolão' : 'Tabela de Classificação'}
          </h1>
          <p className="text-on-surface-variant font-bold text-xs md:text-sm tracking-wider uppercase">
            Mundial de Nataçao Criativa • Copa 2026
          </p>
        </div>

        {/* Dynamic Source Connection badge */}
        <div className="flex items-center gap-2">
          {configStatus?.footballData ? (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-400 text-xs font-bold rounded-full border border-green-500/20 shadow-md">
              <Globe size={12} className="animate-pulse" />
              <span>API Conectada (Real)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-yellow-500/10 text-yellow-400 text-xs font-bold rounded-full border border-yellow-500/20 shadow-md">
              <Activity size={12} />
              <span>Simulador Ativo (Offline)</span>
            </div>
          )}
        </div>
      </div>

      {/* Switcher tabs */}
      <div className="flex border-b border-white/10 mb-8 max-w-sm gap-2">
        <button
          onClick={() => setViewMode('bolao')}
          className={`flex-1 py-3 text-xs md:text-sm font-extrabold uppercase tracking-wider transition-all border-b-2 cursor-pointer text-center ${
            viewMode === 'bolao'
              ? 'text-secondary border-secondary font-black'
              : 'text-on-surface-variant border-transparent hover:text-white'
          }`}
        >
          Jogadores do Bolão
        </button>
        <button
          onClick={() => setViewMode('tabela')}
          className={`flex-1 py-3 text-xs md:text-sm font-extrabold uppercase tracking-wider transition-all border-b-2 cursor-pointer text-center ${
            viewMode === 'tabela'
              ? 'text-primary border-primary font-black'
              : 'text-on-surface-variant border-transparent hover:text-white'
          }`}
        >
          Tabela Copa (API)
        </button>
      </div>

      {viewMode === 'bolao' && (
        <>
          {/* Podium Section */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end mb-12 px-2 pb-4">
            {/* Silver Position */}
            {silver && (
              <div className="order-2 md:order-1 h-full flex flex-col justify-end">
                <div className="glass-card p-6 rounded-2xl flex flex-col items-center text-center relative border-b-4 border-secondary/50 group hover:-translate-y-1 transition-all duration-300">
                  <div className="absolute -top-6 w-12 h-12 glass-card rounded-full flex items-center justify-center border border-secondary text-secondary shadow-md bg-surface">
                    <Award size={24} className="text-secondary" />
                  </div>
                  <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 mb-4 flex items-center justify-center text-white transition-all group-hover:border-secondary shadow-md shrink-0">
                    <User size={28} />
                  </div>
                  <h3 className="font-bold text-lg text-on-surface">{silver.name}</h3>
                  <div className="flex flex-col mt-2">
                    <span className="text-4xl font-extrabold text-secondary">{silver.points.toLocaleString()}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Pontos</span>
                  </div>
                  <div className="w-full mt-4 pt-4 border-t border-white/5 flex justify-around text-xs">
                    <div>
                      <p className="text-on-surface-variant font-medium">Placares</p>
                      <p className="font-bold text-white text-sm">{silver.exacts}</p>
                    </div>
                    <div>
                      <p className="text-on-surface-variant font-medium">Acertos</p>
                      <p className="font-bold text-white text-sm">{silver.accuracy}%</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Gold Position */}
            {gold && (
              <div className="order-1 md:order-2 h-full flex flex-col justify-end">
                <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl flex flex-col items-center text-center relative border border-white/20 border-b-8 border-tertiary group hover:-translate-y-2.5 transition-all duration-300 shadow-[0_0_35px_rgba(250,189,0,0.15)]">
                  <div className="absolute -top-10 w-20 h-20 glass-card rounded-full flex items-center justify-center border-2 border-tertiary bg-tertiary-container/10">
                    <Trophy size={44} className="text-tertiary stroke-[1.5]" />
                  </div>
                  <div className="relative mt-4">
                    <div className="w-24 h-24 rounded-full bg-white/10 border-4 border-tertiary shadow-[0_0_25px_rgba(250,189,0,0.4)] mb-4 flex items-center justify-center text-white transition-all group-hover:scale-105 shrink-0">
                      <User size={40} />
                    </div>
                    <div className="absolute bottom-4 right-0 bg-tertiary text-on-tertiary font-black px-2 py-0.5 rounded-full text-xs border border-surface">
                      #1
                    </div>
                  </div>
                  <h3 className="font-bold text-xl text-white tracking-tight">{gold.name}</h3>
                  <div className="flex flex-col mt-2">
                    <span className="text-5xl font-extrabold text-tertiary">{gold.points.toLocaleString()}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Pontos Líder</span>
                  </div>
                  <div className="w-full mt-6 pt-6 border-t border-white/10 flex justify-around text-sm">
                    <div>
                      <p className="text-on-surface-variant font-medium">Placares</p>
                      <p className="font-bold text-white text-base">{gold.exacts}</p>
                    </div>
                    <div>
                      <p className="text-on-surface-variant font-medium">Acertos</p>
                      <p className="font-bold text-white text-base">{gold.accuracy}%</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bronze Position */}
            {bronze && (
              <div className="order-3 h-full flex flex-col justify-end">
                <div className="glass-card p-6 rounded-2xl flex flex-col items-center text-center relative border-b-4 border-primary-container/50 group hover:-translate-y-1 transition-all duration-300">
                  <div className="absolute -top-6 w-12 h-12 glass-card rounded-full flex items-center justify-center border border-primary-container text-primary-container shadow-md bg-surface">
                    <Award size={24} className="text-primary-container" />
                  </div>
                  <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 mb-4 flex items-center justify-center text-white transition-all group-hover:border-primary-container shadow-md shrink-0">
                    <User size={28} />
                  </div>
                  <h3 className="font-bold text-lg text-on-surface">{bronze.name}</h3>
                  <div className="flex flex-col mt-2">
                    <span className="text-4xl font-extrabold text-primary-container">{bronze.points.toLocaleString()}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Pontos</span>
                  </div>
                  <div className="w-full mt-4 pt-4 border-t border-white/5 flex justify-around text-xs">
                    <div>
                      <p className="text-on-surface-variant font-medium">Placares</p>
                      <p className="font-bold text-white text-sm">{bronze.exacts}</p>
                    </div>
                    <div>
                      <p className="text-on-surface-variant font-medium">Acertos</p>
                      <p className="font-bold text-white text-sm">{bronze.accuracy}%</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Detailed players rows list */}
          <section className="glass-card rounded-3xl overflow-hidden mb-8 shadow-xl">
            <div className="bg-surface-container-high/40 px-4 sm:px-6 py-4 grid grid-cols-12 items-center text-on-surface-variant font-bold text-[10px] sm:text-xs uppercase tracking-wider border-b border-white/5">
              <div className="col-span-2 sm:col-span-1 text-center font-bold">Pos</div>
              <div className="col-span-6 sm:col-span-5 md:col-span-6">Participante</div>
              <div className="col-span-2 text-center">Exatos</div>
              <div className="hidden sm:block sm:col-span-2 text-center">Acertos</div>
              <div className="col-span-2 text-right">Pontos</div>
            </div>

            <div className="divide-y divide-white/5">
              {rest.map((participant) => (
                <div
                  key={participant.rank + '_' + participant.username}
                  className="px-4 sm:px-6 py-4 grid grid-cols-12 items-center hover:bg-white/5 transition-all group cursor-pointer"
                >
                  <div className="col-span-2 sm:col-span-1 text-center font-bold text-on-surface-variant group-hover:text-primary transition-colors text-xs sm:text-sm md:text-base">
                    {participant.rank}º
                  </div>
                  <div className="col-span-6 sm:col-span-5 md:col-span-6 flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white group-hover:border-primary/50 transition-all shadow-sm shrink-0">
                      <User size={16} />
                    </div>
                    <span className="font-bold text-on-surface text-[11px] sm:text-xs md:text-sm group-hover:text-white transition-colors truncate">
                      {participant.name}
                    </span>
                  </div>
                  <div className="col-span-2 text-center font-bold text-xs md:text-sm text-on-surface-variant">
                    {participant.exacts}
                  </div>
                  <div className="hidden sm:block sm:col-span-2 text-center font-bold text-xs md:text-sm text-on-surface-variant">
                    {participant.accuracy}%
                  </div>
                  <div className="col-span-2 text-right font-extrabold text-[13px] sm:text-sm md:text-base text-primary">
                    {participant.points.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {viewMode === 'tabela' && (
        <div className="space-y-8">
          {isLoadingStandings ? (
            <div className="h-64 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-12 h-12 border-4 border-t-secondary border-primary/20 rounded-full animate-spin"></div>
              <p className="text-on-surface-variant font-bold text-sm">Buscando tabela de classificação...</p>
            </div>
          ) : (
            <>
              {(!configStatus || !configStatus.footballData) && (
                <div className="glass-card mb-6 p-6 rounded-2xl border border-yellow-500/20 flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-400 shrink-0">
                    <Info size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Modo de Simulação Ativo</h3>
                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                      Mostrando dados simulados para demonstração do Bolão de Natação Criativa. Para carregar a classificação em tempo real diretamente do FOOTBALL_DATA API, adicione a chave <code className="text-secondary bg-white/5 px-1 py-0.5 rounded font-mono font-bold">FOOTBALL_DATA_API_TOKEN</code> nas configurações.
                    </p>
                  </div>
                </div>
              )}

              {/* Grid of tournament standings cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {standings.map((groupStand, idx) => (
                  <div key={idx} className="glass-card rounded-2xl overflow-hidden shadow-xl border border-white/5">
                    <div className="bg-white/5 px-6 py-4 flex items-center justify-between border-b border-white/5">
                      <h3 className="font-black text-xs md:text-sm uppercase tracking-wider text-white">
                        {groupStand.group}
                      </h3>
                      <Shield size={16} className="text-primary-container" />
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs min-w-[450px]">
                        <thead>
                          <tr className="text-on-surface-variant font-bold border-b border-white/5 bg-white/[0.01]">
                            <th className="px-4 py-3 text-center w-10">#</th>
                            <th className="px-4 py-3">Seleção / Equipe</th>
                            <th className="px-4 py-3 text-center w-10">P</th>
                            <th className="px-4 py-3 text-center w-10">J</th>
                            <th className="px-4 py-3 text-center w-10">V</th>
                            <th className="px-4 py-3 text-center w-10">E</th>
                            <th className="px-4 py-3 text-center w-10">D</th>
                            <th className="px-4 py-3 text-center w-14">Gols</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-medium">
                          {groupStand.table.map((row: any) => (
                            <tr key={row.position} className="hover:bg-white/5 transition-colors">
                              <td className="px-4 py-3 text-center font-bold text-on-surface-variant">
                                {row.position}
                              </td>
                              <td className="px-4 py-3 font-extrabold text-white">
                                {row.team}
                              </td>
                              <td className="px-4 py-3 text-center font-black text-primary">
                                {row.points}
                              </td>
                              <td className="px-4 py-3 text-center text-on-surface-variant">
                                {row.played}
                              </td>
                              <td className="px-4 py-3 text-center text-green-400">
                                {row.won}
                              </td>
                              <td className="px-4 py-3 text-center text-yellow-400">
                                {row.draw}
                              </td>
                              <td className="px-4 py-3 text-center text-red-400">
                                {row.lost}
                              </td>
                              <td className="px-4 py-3 text-center text-on-surface-variant font-mono">
                                {row.goalsFor}:{row.goalsAgainst}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

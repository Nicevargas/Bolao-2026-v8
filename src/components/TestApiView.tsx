import React, { useEffect, useState } from 'react';
import { syncProviders } from '../matchSyncService';

type ProviderKey = 'football-data' | 'fifa';

export const TestApiView: React.FC = () => {
  const [provider, setProvider] = useState<ProviderKey>('fifa');
  const [matches, setMatches] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rawText, setRawText] = useState('');

  useEffect(() => {
    fetchApi(provider);
  }, [provider]);

  const fetchApi = async (prov: ProviderKey) => {
    setLoading(true);
    setMatches(null);
    setError('');
    setRawText('');

    try {
      if (prov === 'football-data') {
        const token = '6e4f3d3e9e4e475595193b606ad85336';
        const url = 'https://api.football-data.org/v4/competitions/WC/matches?season=2026';
        const res = await fetch(url, {
          headers: { 'X-Auth-Token': token }
        });
        if (!res.ok) {
          setError(`HTTP ${res.status}: ${res.statusText}`);
          setLoading(false);
          return;
        }
        const data = await res.json();
        if (data.matches && data.matches.length > 0) {
          setRawText(JSON.stringify(data.matches[0], null, 2));
        }
        setMatches(data.matches || []);
      } else if (prov === 'fifa') {
        const result = await syncProviders.fifa.fetchMatches();
        setMatches(result || []);
      }
    } catch (e: any) {
      setError(`Erro: ${e.message}`);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: 20, color: '#fff', fontFamily: 'monospace', fontSize: 12 }}>
      <h2 style={{ color: '#D91C7A' }}>DEBUG - API de Partidas</h2>

      <div style={{ marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
        <span style={{ color: '#9cb1cc' }}>Provedor:</span>
        <button
          onClick={() => setProvider('football-data')}
          style={{
            padding: '6px 14px',
            borderRadius: 6,
            border: 'none',
            background: provider === 'football-data' ? '#1670D8' : '#333',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: provider === 'football-data' ? 'bold' : 'normal'
          }}
        >
          Football-Data.org
        </button>
        <button
          onClick={() => setProvider('fifa')}
          style={{
            padding: '6px 14px',
            borderRadius: 6,
            border: 'none',
            background: provider === 'fifa' ? '#1670D8' : '#333',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: provider === 'fifa' ? 'bold' : 'normal'
          }}
        >
          FIFA (openfootball)
        </button>
      </div>

      {loading && <div style={{ color: '#9cb1cc' }}>Carregando...</div>}

      {error && (
        <div style={{ background: '#330', border: '1px solid #ff4444', borderRadius: 8, padding: 12, margin: '10px 0' }}>
          <strong style={{ color: '#ff6666' }}>ERRO:</strong> {error}
        </div>
      )}

      {matches !== null && (
        <div>
          <div style={{ color: '#66B82F', marginBottom: 8 }}>
            <strong>{provider === 'fifa' ? 'FIFA (openfootball)' : 'Football-Data.org'}</strong> — Total: {matches.length} partidas
          </div>

          {matches.length > 0 && (
            <>
              <details style={{ marginBottom: 16 }}>
                <summary style={{ cursor: 'pointer', color: '#D91C7A', fontWeight: 'bold', marginBottom: 8 }}>
                  RAW — Primeira partida (todos os campos)
                </summary>
                <pre style={{ whiteSpace: 'pre-wrap', fontSize: 10, background: '#1a1a2e', padding: 12, borderRadius: 8, maxHeight: 400, overflow: 'auto' }}>
                  {rawText || JSON.stringify(matches[0], null, 2)}
                </pre>
              </details>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', background: '#111', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: '#222', textAlign: 'left' }}>
                      <th style={{ padding: 6, color: '#9cb1cc' }}>#</th>
                      <th style={{ padding: 6, color: '#9cb1cc' }}>Casa</th>
                      <th style={{ padding: 6, color: '#9cb1cc' }}>Fora</th>
                      <th style={{ padding: 6, color: '#9cb1cc' }}>Data</th>
                      <th style={{ padding: 6, color: '#9cb1cc' }}>Hora</th>
                      <th style={{ padding: 6, color: '#9cb1cc' }}>Estádio</th>
                      <th style={{ padding: 6, color: '#9cb1cc' }}>Cidade</th>
                      <th style={{ padding: 6, color: '#9cb1cc' }}>Grupo</th>
                      <th style={{ padding: 6, color: '#9cb1cc' }}>Status</th>
                      <th style={{ padding: 6, color: '#9cb1cc' }}>Placar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matches.slice(0, 64).map((m: any, i: number) => {
                      const dateStr = m.match_date || m.utcDate || m.date || '';
                      const timeStr = dateStr ? new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '-';
                      const matchDate = dateStr ? new Date(dateStr).toLocaleDateString('pt-BR') : '-';
                      const score = m.goals_a !== null && m.goals_b !== null ? `${m.goals_a} x ${m.goals_b}` : '-';

                      return (
                        <tr key={m.id || i} style={{ borderBottom: '1px solid #333' }}>
                          <td style={{ padding: 6, color: '#9cb1cc' }}>{m.id || i + 1}</td>
                          <td style={{ padding: 6, color: '#fff' }}>{m.flag_a || ''} {m.team_a || m.homeTeam?.name || '-'}</td>
                          <td style={{ padding: 6, color: '#fff' }}>{m.flag_b || ''} {m.team_b || m.awayTeam?.name || '-'}</td>
                          <td style={{ padding: 6 }}>{matchDate}</td>
                          <td style={{ padding: 6, color: '#66B82F' }}>{timeStr}</td>
                          <td style={{ padding: 6, color: m.stadium && m.stadium !== 'Estádio FIFA' ? '#66B82F' : '#ff4444' }}>{m.stadium || m.venue || '-'}</td>
                          <td style={{ padding: 6 }}>{m.city || '-'}</td>
                          <td style={{ padding: 6 }}>{m.group_name || m.group || m.grupo || '-'}</td>
                          <td style={{ padding: 6 }}>{m.status}</td>
                          <td style={{ padding: 6 }}>{score}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {matches.length > 64 && (
                  <div style={{ color: '#9cb1cc', marginTop: 8 }}>
                    Mostrando 64 de {matches.length} partidas
                  </div>
                )}
              </div>
            </>
          )}

          {matches.length === 0 && (
            <div style={{ marginTop: 10, padding: 12, background: '#222', borderRadius: 8, color: '#ff0' }}>
              Nenhuma partida retornada pelo provedor.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

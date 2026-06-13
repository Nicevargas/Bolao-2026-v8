import React, { useEffect, useState } from 'react';

type ProviderKey = 'football-data' | 'fifa';

export const TestApiView: React.FC = () => {
  const [provider, setProvider] = useState<ProviderKey>('football-data');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchApi(provider);
  }, [provider]);

  const fetchApi = async (prov: ProviderKey) => {
    setLoading(true);
    setResult(null);
    setError('');

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
        setResult({ source: 'Football-Data.org', raw: data, matches: data.matches });
      } else if (prov === 'fifa') {
        const url = 'https://raw.githubusercontent.com/openfootball/world-cup/master/2026/matches.json';
        const res = await fetch(url);
        if (!res.ok) {
          setError(`HTTP ${res.status}: ${res.statusText}`);
          setLoading(false);
          return;
        }
        const data = await res.json();
        setResult({ source: 'FIFA (openfootball)', raw: data, matches: data.matches });
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

      {result && (
        <div>
          <div style={{ color: '#66B82F', marginBottom: 8 }}>
            <strong>{result.source}</strong> — Total de partidas: {result.matches?.length || 0}
          </div>

          {result.matches && result.matches.length > 0 && (
            <>
              {/* RAW JSON do primeiro jogo */}
              <details style={{ marginBottom: 16 }}>
                <summary style={{ cursor: 'pointer', color: '#D91C7A', fontWeight: 'bold', marginBottom: 8 }}>
                  RAW JSON — Primeira partida (campos disponíveis)
                </summary>
                <pre style={{ whiteSpace: 'pre-wrap', fontSize: 10, background: '#1a1a2e', padding: 12, borderRadius: 8, maxHeight: 400, overflow: 'auto' }}>
                  {JSON.stringify(result.matches[0], null, 2)}
                </pre>
              </details>

              {/* Tabela com todos os campos */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', background: '#111', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: '#222', textAlign: 'left' }}>
                      <th style={{ padding: 6, color: '#9cb1cc' }}>ID</th>
                      <th style={{ padding: 6, color: '#9cb1cc' }}>Casa</th>
                      <th style={{ padding: 6, color: '#9cb1cc' }}>Fora</th>
                      <th style={{ padding: 6, color: '#9cb1cc' }}>Data</th>
                      <th style={{ padding: 6, color: '#9cb1cc' }}>Hora</th>
                      <th style={{ padding: 6, color: '#9cb1cc' }}>Estádio</th>
                      <th style={{ padding: 6, color: '#9cb1cc' }}>Cidade</th>
                      <th style={{ padding: 6, color: '#9cb1cc' }}>Grupo</th>
                      <th style={{ padding: 6, color: '#9cb1cc' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.matches.slice(0, 50).map((m: any, i: number) => {
                      // Try different field paths for venue/stadium
                      const venue = m.venue || m.estadio || m.stadium || (m.venue?.name) || m.match_venue || m.location || '-';
                      const city = m.city || m.cidade || (m.venue?.city) || (m.match_city) || (m.venue?.split(',').length > 1 ? m.venue?.split(',')[1]?.trim() : '-');
                      const dateStr = m.utcDate || m.date || m.match_date || m.matchDate || '';
                      const timeStr = dateStr ? new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '-';
                      const matchDate = dateStr ? new Date(dateStr).toLocaleDateString('pt-BR') : '-';
                      const home = m.homeTeam?.name || m.team_a || m.home || m.team1 || '-';
                      const away = m.awayTeam?.name || m.team_b || m.away || m.team2 || '-';

                      return (
                        <tr key={m.id || i} style={{ borderBottom: '1px solid #333' }}>
                          <td style={{ padding: 6 }}>{m.id || i}</td>
                          <td style={{ padding: 6 }}>{home}</td>
                          <td style={{ padding: 6 }}>{away}</td>
                          <td style={{ padding: 6 }}>{matchDate}</td>
                          <td style={{ padding: 6 }}>{timeStr}</td>
                          <td style={{ padding: 6, color: venue === '-' ? '#ff4444' : '#66B82F' }}>{venue}</td>
                          <td style={{ padding: 6 }}>{city}</td>
                          <td style={{ padding: 6 }}>{m.group || m.group_name || m.grupo || '-'}</td>
                          <td style={{ padding: 6 }}>{m.status}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {result.matches && result.matches.length === 0 && (
            <div style={{ marginTop: 10, padding: 12, background: '#222', borderRadius: 8 }}>
              <strong>Resposta completa da API:</strong>
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: 10, marginTop: 8 }}>
                {JSON.stringify(result.raw, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

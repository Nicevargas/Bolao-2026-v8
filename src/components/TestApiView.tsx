import React, { useEffect, useState } from 'react';

export const TestApiView: React.FC = () => {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchApi = async () => {
      setLoading(true);
      const token = '6e4f3d3e9e4e475595193b606ad85336';
      const url = 'https://api.football-data.org/v4/competitions/WC/matches?season=2026';

      try {
        const res = await fetch(url, {
          headers: { 'X-Auth-Token': token }
        });
        if (!res.ok) {
          setError(`HTTP ${res.status}: ${res.statusText}`);
          setLoading(false);
          return;
        }
        const data = await res.json();
        setResult(data);
      } catch (e: any) {
        setError(`Erro: ${e.message}`);
      }
      setLoading(false);
    };
    fetchApi();
  }, []);

  return (
    <div style={{ padding: 20, color: '#fff', fontFamily: 'monospace', fontSize: 12 }}>
      <h2 style={{ color: '#D91C7A' }}>DEBUG - API Football-Data.org</h2>
      <p style={{ color: '#9cb1cc' }}>Token: 6e4f3d3e9e4e475595193b606ad85336</p>

      {loading && <div>Carregando...</div>}

      {error && (
        <div style={{ background: '#330', border: '1px solid #ff4444', borderRadius: 8, padding: 12, margin: '10px 0' }}>
          <strong style={{ color: '#ff6666' }}>ERRO:</strong> {error}
        </div>
      )}

      {result && (
        <div>
          <div style={{ color: '#66B82F', marginBottom: 8 }}>
            Total de partidas: {result.matches?.length || 0}
            {result.matches?.length === 0 && <span style={{ color: '#ff0' }}> (ARRAY VAZIO)</span>}
            {!result.matches && <span style={{ color: '#ff0' }}> (campo 'matches' não existe no retorno)</span>}
          </div>

          {result.matches && result.matches.length > 0 && (
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#111' }}>
              <thead>
                <tr style={{ background: '#222', textAlign: 'left' }}>
                  <th style={{ padding: 8, fontSize: 11, color: '#9cb1cc' }}>ID</th>
                  <th style={{ padding: 8, fontSize: 11, color: '#9cb1cc' }}>Casa</th>
                  <th style={{ padding: 8, fontSize: 11, color: '#9cb1cc' }}>Fora</th>
                  <th style={{ padding: 8, fontSize: 11, color: '#9cb1cc' }}>Data</th>
                  <th style={{ padding: 8, fontSize: 11, color: '#9cb1cc' }}>Estádio</th>
                  <th style={{ padding: 8, fontSize: 11, color: '#9cb1cc' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {result.matches.slice(0, 50).map((m: any, i: number) => (
                  <tr key={m.id || i} style={{ borderBottom: '1px solid #333' }}>
                    <td style={{ padding: 6 }}>{m.id}</td>
                    <td style={{ padding: 6 }}>{m.homeTeam?.name || '-'}</td>
                    <td style={{ padding: 6 }}>{m.awayTeam?.name || '-'}</td>
                    <td style={{ padding: 6 }}>{m.utcDate ? new Date(m.utcDate).toLocaleDateString('pt-BR') : '-'}</td>
                    <td style={{ padding: 6 }}>{m.venue || m.stage || '-'}</td>
                    <td style={{ padding: 6 }}>{m.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {result.matches && result.matches.length === 0 && (
            <div style={{ marginTop: 10, padding: 12, background: '#222', borderRadius: 8 }}>
              <strong>Resposta completa da API:</strong>
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: 10, marginTop: 8 }}>
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

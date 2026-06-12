import React, { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';

export const DebugMatchesView: React.FC = () => {
  const [matches, setMatches] = useState<any[]>([]);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [dbConnected, setDbConnected] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setDbConnected(isSupabaseConfigured());

      if (!isSupabaseConfigured()) {
        setError('Supabase NÃO configurado (VITE_SUPABASE_URL vazio)');
        setLoading(false);
        return;
      }

      try {
        const { data, error: err } = await supabase!
          .from('matches')
          .select('*')
          .order('match_date', { ascending: true });

        if (err) {
          setError(`Erro na query matches: ${err.message} (${JSON.stringify(err)})`);
        } else {
          setMatches(data || []);
          if (!data || data.length === 0) {
            setError('Tabela matches existe mas está VAZIA');
          }
        }
      } catch (e: any) {
        setError(`Exceção: ${e.message || e}`);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  return (
    <div style={{ padding: 20, color: '#fff', fontFamily: 'monospace', fontSize: 12 }}>
      <h2 style={{ color: '#D91C7A' }}>DEBUG - Jogos do Banco</h2>
      
      <div style={{ marginBottom: 10 }}>
        <strong>Supabase configurado:</strong> {dbConnected ? '✅ Sim' : '❌ Não'}
      </div>

      {loading && <div>Carregando...</div>}

      {error && (
        <div style={{ 
          background: '#330000', 
          border: '1px solid #ff4444', 
          borderRadius: 8, 
          padding: 12, 
          marginBottom: 12,
          whiteSpace: 'pre-wrap'
        }}>
          <strong style={{ color: '#ff6666' }}>ERRO:</strong>
          <div>{error}</div>
        </div>
      )}

      {matches.length > 0 && (
        <div>
          <div style={{ marginBottom: 8, color: '#66B82F' }}>
            ✅ {matches.length} jogos encontrados
          </div>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            background: '#111',
            borderRadius: 8,
            overflow: 'hidden'
          }}>
            <thead>
              <tr style={{ background: '#222', textAlign: 'left' }}>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Time A</th>
                <th style={thStyle}>Time B</th>
                <th style={thStyle}>Data</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Fase</th>
                <th style={thStyle}>Grupo</th>
                <th style={thStyle}>Placar</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((m: any) => (
                <tr key={m.id} style={{ borderBottom: '1px solid #333' }}>
                  <td style={tdStyle}>{m.id}</td>
                  <td style={tdStyle}>{m.team_a} {m.flag_a || ''}</td>
                  <td style={tdStyle}>{m.team_b} {m.flag_b || ''}</td>
                  <td style={tdStyle}>{m.match_date ? new Date(m.match_date).toLocaleString('pt-BR') : '-'}</td>
                  <td style={tdStyle}>{m.status}</td>
                  <td style={tdStyle}>{m.phase}</td>
                  <td style={tdStyle}>{m.group_name}</td>
                  <td style={tdStyle}>{m.goals_a ?? '-'} : {m.goals_b ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const thStyle: React.CSSProperties = {
  padding: '8px 12px',
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  color: '#9cb1cc'
};

const tdStyle: React.CSSProperties = {
  padding: '6px 12px',
  fontSize: 11
};

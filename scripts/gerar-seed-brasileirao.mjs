// Gera supabase/seed_brasileirao_2026.sql com a tabela de jogos do Brasileirão Série A.
//
// Uso:
//   FOOTBALL_DATA_API_KEY=sua-chave node scripts/gerar-seed-brasileirao.mjs
//   node scripts/gerar-seed-brasileirao.mjs --arquivo resposta.json   (JSON já baixado da API)
//
// A chave é gratuita em https://www.football-data.org/client/register.
// Depois, rode o SQL gerado no SQL Editor do Supabase. Pode ser repetido para atualizar placares.
import { readFileSync, writeFileSync } from 'node:fs';

const SEASON = process.env.SEASON || '2026';
const OUT = new URL('../supabase/seed_brasileirao_2026.sql', import.meta.url);

function lerChave() {
  if (process.env.FOOTBALL_DATA_API_KEY) return process.env.FOOTBALL_DATA_API_KEY;
  try {
    const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
    return env.match(/^VITE_FOOTBALL_DATA_API_KEY="?([^"\r\n]+)"?/m)?.[1];
  } catch {
    return undefined;
  }
}

async function carregarJogos() {
  const i = process.argv.indexOf('--arquivo');
  if (i > -1) return JSON.parse(readFileSync(process.argv[i + 1], 'utf8')).matches;

  const key = lerChave();
  if (!key) throw new Error('Defina FOOTBALL_DATA_API_KEY (ou VITE_FOOTBALL_DATA_API_KEY no .env.local).');
  const res = await fetch(`https://api.football-data.org/v4/competitions/BSA/matches?season=${SEASON}`, {
    headers: { 'X-Auth-Token': key },
  });
  if (!res.ok) throw new Error(`football-data.org respondeu ${res.status}: ${await res.text()}`);
  return (await res.json()).matches;
}

const sql = (v) => (v === null || v === undefined || v === '' ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`);
const num = (v) => (Number.isInteger(v) ? v : 'NULL');
const STATUS = { FINISHED: 'encerrado', AWARDED: 'encerrado', IN_PLAY: 'ao_vivo', PAUSED: 'ao_vivo' };

const jogos = await carregarJogos();
if (!jogos?.length) throw new Error('Nenhum jogo retornado.');

const linhas = jogos.map((m) => {
  const rodada = `Rodada ${m.matchday}`;
  const status = STATUS[m.status] || 'aguardando';
  const placar = status === 'aguardando' ? ['NULL', 'NULL'] : [num(m.score?.fullTime?.home), num(m.score?.fullTime?.away)];
  return `(${[
    sql(`bsa${SEASON}_${m.id}`), sql('Brasileirão Série A'), sql(rodada), sql('-'), sql(rodada),
    sql(m.homeTeam.shortName || m.homeTeam.name), sql(m.awayTeam.shortName || m.awayTeam.name),
    sql('⚽'), sql('⚽'), sql(m.utcDate), sql('A definir'), sql(''), sql(status), placar[0], placar[1],
  ].join(', ')})`;
});

writeFileSync(OUT, `-- Brasileirão Série A ${SEASON}: ${jogos.length} jogos (gerado por scripts/gerar-seed-brasileirao.mjs)
INSERT INTO public.matches (id, competition, phase, group_name, round_number, team_a, team_b, flag_a, flag_b, match_date, stadium, city, status, goals_a, goals_b) VALUES
${linhas.join(',\n')}
ON CONFLICT (id) DO UPDATE SET
  match_date = EXCLUDED.match_date,
  status = EXCLUDED.status,
  goals_a = EXCLUDED.goals_a,
  goals_b = EXCLUDED.goals_b;
`);
console.log(`${jogos.length} jogos gravados em supabase/seed_brasileirao_2026.sql`);

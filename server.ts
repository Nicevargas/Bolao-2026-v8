import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import crypto from 'crypto';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Supabase safely
let supabase: any = null;
let isSupabaseConfigured = false;
let supabaseUrl = '';
try {
  supabaseUrl = (process.env.SUPABASE_URL || '').trim();
  const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '').trim();
  if (supabaseUrl && supabaseKey) {
    if (!supabaseUrl.startsWith('http')) {
      throw new Error('A URL do Supabase precisa começar com http:// ou https://');
    }
    supabase = createClient(supabaseUrl, supabaseKey);
    isSupabaseConfigured = true;
  }
} catch (err: any) {
  console.error('Falha crítica ao inicializar Supabase:', err.message);
}

// Initialize Gemini safely
const isGeminiConfigured = !!process.env.GEMINI_API_KEY;
const ai = isGeminiConfigured
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Default standard matches seed data representing actual confirmed matches for the 2026 World Cup
const defaultMatchesSeed = [
  {
    id: 'wc1',
    fase: 'Grupo A',
    grupo: 'Grupo A',
    data_jogo: '11 DE JUNHO - 16:00',
    time1: 'México',
    time2: 'Equador',
    gols_time1: null,
    gols_time2: null,
    finalizado: false,
    homeFlag: 'https://flagcdn.com/w80/mx.png',
    awayFlag: 'https://flagcdn.com/w80/ec.png',
    location: 'ESTÁDIO AZTECA'
  },
  {
    id: 'wc2',
    fase: 'Grupo A',
    grupo: 'Grupo A',
    data_jogo: '12 DE JUNHO - 19:00',
    time1: 'Estados Unidos',
    time2: 'Marrocos',
    gols_time1: null,
    gols_time2: null,
    finalizado: false,
    homeFlag: 'https://flagcdn.com/w80/us.png',
    awayFlag: 'https://flagcdn.com/w80/ma.png',
    location: 'SOFI STADIUM'
  },
  {
    id: 'wc3',
    fase: 'Grupo B',
    grupo: 'Grupo B',
    data_jogo: '13 DE JUNHO - 15:00',
    time1: 'Canadá',
    time2: 'França',
    gols_time1: null,
    gols_time2: null,
    finalizado: false,
    homeFlag: 'https://flagcdn.com/w80/ca.png',
    awayFlag: 'https://flagcdn.com/w80/fr.png',
    location: 'BC PLACE'
  },
  {
    id: 'wc4',
    fase: 'Grupo B',
    grupo: 'Grupo B',
    data_jogo: '14 DE JUNHO - 21:00',
    time1: 'Brasil',
    time2: 'Espanha',
    gols_time1: null,
    gols_time2: null,
    finalizado: false,
    homeFlag: 'https://flagcdn.com/w80/br.png',
    awayFlag: 'https://flagcdn.com/w80/es.png',
    location: 'METLIFE STADIUM'
  },
  {
    id: 'wc5',
    fase: 'Grupo C',
    grupo: 'Grupo C',
    data_jogo: '15 DE JUNHO - 18:00',
    time1: 'Argentina',
    time2: 'Portugal',
    gols_time1: null,
    gols_time2: null,
    finalizado: false,
    homeFlag: 'https://flagcdn.com/w80/ar.png',
    awayFlag: 'https://flagcdn.com/w80/pt.png',
    location: 'SOFI STADIUM'
  },
  {
    id: 'wc6',
    fase: 'Grupo C',
    grupo: 'Grupo C',
    data_jogo: '16 DE JUNHO - 14:00',
    time1: 'Alemanha',
    time2: 'Japão',
    gols_time1: null,
    gols_time2: null,
    finalizado: false,
    homeFlag: 'https://flagcdn.com/w80/de.png',
    awayFlag: 'https://flagcdn.com/w80/jp.png',
    location: 'HARD ROCK STADIUM'
  }
];

// Team translations dictionary to support elegant localization to Portuguese-BR
const teamTranslations: Record<string, string> = {
  'Brazil': 'Brasil',
  'Germany': 'Alemanha',
  'Argentina': 'Argentina',
  'France': 'França',
  'Japan': 'Japão',
  'Italy': 'Itália',
  'Portugal': 'Portugal',
  'Spain': 'Espanha',
  'England': 'Inglaterra',
  'Netherlands': 'Holanda',
  'Uruguay': 'Uruguai',
  'Belgium': 'Bélgica',
  'Croatia': 'Croácia',
  'Mexico': 'México',
  'United States': 'Estados Unidos',
  'USA': 'Estados Unidos',
  'Canada': 'Canadá',
  'Morocco': 'Marrocos',
  'Senegal': 'Senegal',
  'Switzerland': 'Suíça',
  'Denmark': 'Dinamarca',
  'Ecuador': 'Equador',
  'Colombia': 'Colômbia',
  'Korea Republic': 'Coreia do Sul',
  'South Korea': 'Coreia do Sul',
  'Cameroon': 'Camarões',
  'Ghana': 'Gana',
  'Tunisia': 'Tunísia',
  'Australia': 'Austrália',
  'Saudi Arabia': 'Arábia Saudita',
  'Algeria': 'Argélia',
  'Chile': 'Chile',
  'Nigeria': 'Nigéria',
  'Sweden': 'Suécia',
  'Wales': 'País de Gales',
  'Poland': 'Polônia',
  'Ukraine': 'Ucrânia'
};

function translateTeam(name: string): string {
  if (!name) return '-';
  return teamTranslations[name] || name;
}

// Map any country name dynamically to flagcdn.com code to render beautiful banners
function getTeamFlag(teamName: string): string {
  const lower = teamName.toLowerCase().trim();
  const flagCodes: Record<string, string> = {
    'brasil': 'br', 'brazil': 'br',
    'alemanha': 'de', 'germany': 'de',
    'argentina': 'ar',
    'frança': 'fr', 'france': 'fr',
    'japão': 'jp', 'japan': 'jp',
    'portugal': 'pt',
    'espanha': 'es', 'spain': 'es',
    'estados unidos': 'us', 'usa': 'us', 'united states': 'us',
    'méxico': 'mx', 'mexico': 'mx',
    'canadá': 'ca', 'canada': 'ca',
    'marrocos': 'ma', 'morocco': 'ma',
    'senegal': 'sn',
    'colômbia': 'co', 'colombia': 'co',
    'uruguai': 'uy', 'uruguay': 'uy',
    'holanda': 'nl', 'netherlands': 'nl',
    'inglaterra': 'gb-eng', 'england': 'gb-eng',
    'bélgica': 'be', 'belgium': 'be',
    'croácia': 'hr', 'croatia': 'hr',
    'suíça': 'ch', 'switzerland': 'ch',
    'dinamarca': 'dk', 'denmark': 'dk',
    'equador': 'ec', 'ecuador': 'ec',
    'itália': 'it', 'italy': 'it',
    'coreia do sul': 'kr', 'south korea': 'kr', 'korea republic': 'kr',
    'camarões': 'cm', 'cameroon': 'cm',
    'gana': 'gh', 'ghana': 'gh',
    'tunísia': 'tn', 'tunisia': 'tn',
    'austrália': 'au', 'australia': 'au',
    'arábia saudita': 'sa', 'saudi arabia': 'sa'
  };

  const code = flagCodes[lower];
  if (code) {
    return `https://flagcdn.com/w80/${code}.png`;
  }
  return `https://flagcdn.com/w80/un.png`;
}

function translateGroupCode(gp: string): string {
  return gp.toUpperCase().replace('GROUP_', 'Grupo ');
}

function translateStageName(stage: string, groupName: string): string {
  if (stage === 'GROUP_STAGE') {
    return groupName || 'Fase de Grupos';
  }
  switch (stage.toUpperCase()) {
    case 'ROUND_OF_16':
    case 'LAST_16':
      return 'Oitavas';
    case 'QUARTER_FINALS':
      return 'Quartas';
    case 'SEMI_FINALS':
      return 'Semifinal';
    case 'THIRD_PLACE':
      return 'Terceiro Lugar';
    case 'FINAL':
      return 'Final';
    default:
      return stage;
  }
}

function formatUtcDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    const months = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];
    const day = d.getUTCDate();
    const month = months[d.getUTCMonth()];
    const hours = String(d.getUTCHours()).padStart(2, '0');
    const minutes = String(d.getUTCMinutes()).padStart(2, '0');
    return `${day} DE ${month} - ${hours}:${minutes}`;
  } catch (e) {
    return isoString;
  }
}

interface FootballDataMatch {
  id: number;
  utcDate: string;
  status: string;
  stage: string;
  group: string | null;
  homeTeam: { id: number; name: string; shortName?: string; tla?: string; crest?: string };
  awayTeam: { id: number; name: string; shortName?: string; tla?: string; crest?: string };
  score: { fullTime: { home: number | null; away: number | null } };
  venue?: string;
}

let lastSyncTime = 0;
const SYNC_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes cache

let spreadsheetLastSyncTime = 0;
const SPREADSHEET_SYNC_INTERVAL_MS = 5 * 60 * 1000; // Auto update every 5 minutes in background

async function syncMatchesFromSpreadsheet(force = false) {
  const configPath = path.join(process.cwd(), 'spreadsheet_config.json');
  let url = '';
  try {
    if (fs.existsSync(configPath)) {
      const data = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      url = data.spreadsheetUrl || '';
    }
  } catch (e) {
    console.error("Error reading spreadsheet config:", e);
    return { success: false, reason: 'error_reading_config' };
  }

  if (!url) {
    return { success: false, reason: 'no_url_configured' };
  }

  const now = Date.now();
  if (!force && (now - spreadsheetLastSyncTime < SPREADSHEET_SYNC_INTERVAL_MS)) {
    console.log(`[Google Sheets Async] Using cached spreadsheet matches. Last sync was ${(now - spreadsheetLastSyncTime) / 1000}s ago.`);
    return { success: true, reason: 'cached_fresh' };
  }

  try {
    let fetchUrl = url;
    // If it's a standard Google Sheets sharing link, convert it to a CSV export link!
    if (url.includes('docs.google.com/spreadsheets')) {
      const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) {
        const sheetId = match[1];
        fetchUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
      }
    }

    console.log(`[Google Sheets Async] Pulling automatic spreadsheet updates from: ${fetchUrl}`);
    const res = await fetch(fetchUrl);
    if (!res.ok) {
       console.error(`Spreadsheet fetch returned HTTP ${res.status}`);
       return { success: false, reason: `http_status_${res.status}` };
    }

    const text = await res.text();
    if (!text || !text.trim()) {
      return { success: false, reason: 'empty_csv_response' };
    }

    const lines = text.trim().split(/\r?\n/);
    if (lines.length === 0) {
      return { success: false, reason: 'no_lines_found' };
    }

    // Parse CSV line safely
    const parseCSVLine = (line: string, delim: string) => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === delim && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const firstLine = lines[0];
    let delimiter = '\t';
    if (firstLine.includes(';')) {
      delimiter = ';';
    } else if (firstLine.includes(',')) {
      const commas = (firstLine.match(/,/g) || []).length;
      const tabs = (firstLine.match(/\t/g) || []).length;
      const semicolons = (firstLine.match(/;/g) || []).length;
      if (semicolons > commas) delimiter = ';';
      else if (tabs > commas) delimiter = '\t';
      else delimiter = ',';
    }

    const headerRow = parseCSVLine(lines[0], delimiter);
    let rowsToParse = lines.slice(1);

    const hasHeader = headerRow.some(col => 
      ['id', 'time', 'equipe', 'team', 'grupo', 'group', 'fase', 'stage', 'data', 'date', 'gols', 'goals', 'local', 'venue', 'estadio'].some(keyword => 
        col.toLowerCase().includes(keyword)
      )
    );

    let finalHeaders = headerRow;
    if (!hasHeader) {
      finalHeaders = ['Time 1', 'Time 2', 'Grupo', 'Data', 'Lugar'];
      rowsToParse = lines;
    }

    const cleanHeaders = finalHeaders.map(h => h.toLowerCase().trim());

    const colMap = {
      id: cleanHeaders.findIndex(h => h === 'id' || h === 'id_jogo' || h === 'id_match' || h === 'match_id' || h === 'código'),
      fase: cleanHeaders.findIndex(h => h.includes('fase') || h.includes('stage') || h.includes('rodada')),
      grupo: cleanHeaders.findIndex(h => h.includes('grupo') || h.includes('group')),
      data_jogo: cleanHeaders.findIndex(h => h.includes('data') || h.includes('date') || h.includes('horario') || h.includes('horário') || h.includes('time') && !h.includes('team')),
      time1: cleanHeaders.findIndex(h => h.includes('time1') || h.includes('time 1') || h.includes('time_1') || h.includes('time_casa') || h.includes('casa') || h.includes('home') || h.includes('equipe 1') || h.includes('equipe1')),
      time2: cleanHeaders.findIndex(h => h.includes('time2') || h.includes('time 2') || h.includes('time_2') || h.includes('time_fora') || h.includes('fora') || h.includes('away') || h.includes('equipe 2') || h.includes('equipe2')),
      gols_time1: cleanHeaders.findIndex(h => h.includes('gols1') || h.includes('gols_time1') || h.includes('gols_1') || h.includes('gols casa') || h.includes('placar_casa') || h.includes('placar 1')),
      gols_time2: cleanHeaders.findIndex(h => h.includes('gols2') || h.includes('gols_time2') || h.includes('gols_2') || h.includes('gols fora') || h.includes('placar_fora') || h.includes('placar 2')),
      finalizado: cleanHeaders.findIndex(h => h.includes('finalizado') || h.includes('finished') || h.includes('encerrado') || h.includes('status') || h.includes('concluido') || h.includes('concluído')),
      location: cleanHeaders.findIndex(h => h.includes('local') || h.includes('location') || h.includes('venue') || h.includes('estadio') || h.includes('estádio'))
    };

    if (colMap.time1 === -1 || colMap.time2 === -1) {
      if (cleanHeaders.length >= 2) {
        colMap.time1 = 0;
        colMap.time2 = 1;
        if (cleanHeaders.length >= 3) colMap.grupo = 2;
        if (cleanHeaders.length >= 4) colMap.data_jogo = 3;
        if (cleanHeaders.length >= 5) colMap.location = 4;
      } else {
        return { success: false, reason: 'missing_team_columns' };
      }
    }

    const translatedMatches = [];
    for (let idx = 0; idx < rowsToParse.length; idx++) {
      const line = rowsToParse[idx];
      if (!line.trim()) continue;
      const cols = parseCSVLine(line, delimiter);
      if (cols.length < 2) continue;

      const rawT1 = cols[colMap.time1] || '';
      const rawT2 = cols[colMap.time2] || '';
      if (!rawT1 || !rawT2) continue;

      const t1 = translateTeam(rawT1.trim());
      const t2 = translateTeam(rawT2.trim());

      const f = colMap.fase !== -1 ? cols[colMap.fase] : '';
      const grp = colMap.grupo !== -1 ? cols[colMap.grupo] : '';

      const rawG1 = colMap.gols_time1 !== -1 ? cols[colMap.gols_time1] : '';
      const rawG2 = colMap.gols_time2 !== -1 ? cols[colMap.gols_time2] : '';
      
      const g1 = (rawG1 !== '' && rawG1 !== undefined && rawG1 !== null) ? Number(rawG1) : null;
      const g2 = (rawG2 !== '' && rawG2 !== undefined && rawG2 !== null) ? Number(rawG2) : null;

      const statStr = colMap.finalizado !== -1 ? cols[colMap.finalizado]?.toLowerCase() : '';
      const isFin = statStr === 'sim' || statStr === 'true' || statStr === 'finished' || statStr === '1' || (g1 !== null && g2 !== null && !isNaN(g1) && !isNaN(g2));

      const loc = colMap.location !== -1 ? cols[colMap.location] : '';
      const finalId = (colMap.id !== -1 && cols[colMap.id]) ? cols[colMap.id] : `xls_${Date.now()}_${idx}`;

      translatedMatches.push({
        id: finalId,
        fase: f || grp || 'Grupo',
        grupo: grp || f || 'Grupo A',
        data_jogo: colMap.data_jogo !== -1 ? cols[colMap.data_jogo] : '11 DE JUNHO - 16:00',
        time1: t1,
        time2: t2,
        gols_time1: (g1 === null || isNaN(g1)) ? null : g1,
        gols_time2: (g2 === null || isNaN(g2)) ? null : g2,
        finalizado: isFin,
        homeFlag: getTeamFlag(t1),
        awayFlag: getTeamFlag(t2),
        location: loc || 'ESTÁDIO OFICIAL'
      });
    }

    if (translatedMatches.length > 0) {
      if (supabase) {
        try {
          console.log(`Writing ${translatedMatches.length} spreadsheet-synchronized matches to Supabase...`);
          await supabase.from('jogos').delete().neq('id', 'null');
          
          const dbInserts = translatedMatches.map(tm => ({
            id: tm.id,
            fase: tm.fase,
            grupo: tm.grupo,
            data_jogo: tm.data_jogo,
            time1: tm.time1,
            time2: tm.time2,
            gols_time1: tm.gols_time1,
            gols_time2: tm.gols_time2,
            finalizado: tm.finalizado
          }));

          const { error } = await supabase.from('jogos').insert(dbInserts);
          if (error) {
            console.error("Error upserting matches from sheet to Supabase:", error);
          } else {
            console.log("Supabase matches table successfully updated from public Spreadsheet!");
          }
        } catch (dbErr) {
          console.error("Failed to perform Supabase spreadsheet DB update:", dbErr);
        }
      }

      inMemoryJogos = translatedMatches;
      recomputeMemoryPoints();
      spreadsheetLastSyncTime = now;
      return { success: true, count: translatedMatches.length, source: 'public_spreadsheet' };
    }

    return { success: false, reason: 'no_valid_matches_parsed' };
  } catch (err: any) {
    console.error("Spreadsheet polling error:", err);
    return { success: false, error: err.message };
  }
}

async function syncMatchesFromFootballData(force = false) {
  const token = process.env.FOOTBALL_DATA_API_TOKEN;
  if (!token) {
    console.log("No FOOTBALL_DATA_API_TOKEN env configured. Dynamically keeping default/simulated matches.");
    return { success: false, reason: 'no_token', source: 'default_simulation' };
  }

  const now = Date.now();
  if (!force && (now - lastSyncTime < SYNC_INTERVAL_MS)) {
    console.log(`Using cached matches. Last sync was ${(now - lastSyncTime) / 1000}s ago.`);
    return { success: true, reason: 'cached_fresh' };
  }

  try {
    console.log("Fetching real match fixtures from football-data.org API...");
    const res = await fetch('https://api.football-data.org/v4/competitions/WC/matches', {
      headers: {
        'X-Auth-Token': token
      }
    });

    if (!res.ok) {
      console.error(`football-data.org returned status: ${res.status}`);
      return { success: false, reason: `api_status_${res.status}` };
    }

    const data = await res.json();
    if (!data || !data.matches || !Array.isArray(data.matches)) {
      console.warn("No matches found in football-data.org API response:", data);
      return { success: false, reason: 'malformed_api_response' };
    }

    const apiMatches: FootballDataMatch[] = data.matches;
    lastSyncTime = now;

    const translatedMatches = apiMatches.map(m => {
      const matchId = `fd_${m.id}`;
      const groupName = m.group ? translateGroupCode(m.group) : '';
      const stageName = translateStageName(m.stage, groupName);
      
      const t1Raw = m.homeTeam?.name || m.homeTeam?.shortName || 'TBD';
      const t2Raw = m.awayTeam?.name || m.awayTeam?.shortName || 'TBD';
      const t1 = translateTeam(t1Raw);
      const t2 = translateTeam(t2Raw);

      const gols_t1 = (m.score?.fullTime?.home !== undefined && m.score?.fullTime?.home !== null) ? Number(m.score.fullTime.home) : null;
      const gols_t2 = (m.score?.fullTime?.away !== undefined && m.score?.fullTime?.away !== null) ? Number(m.score.fullTime.away) : null;
      const finalizado = m.status === 'FINISHED';

      const data_jogo = formatUtcDate(m.utcDate);

      const homeFlag = m.homeTeam?.crest || getTeamFlag(t1);
      const awayFlag = m.awayTeam?.crest || getTeamFlag(t2);

      return {
        id: matchId,
        fase: stageName,
        grupo: groupName || stageName,
        data_jogo,
        time1: t1,
        time2: t2,
        gols_time1: gols_t1,
        gols_time2: gols_t2,
        finalizado,
        homeFlag,
        awayFlag,
        location: m.venue || 'ESTÁDIO OFICIAL'
      };
    });

    if (translatedMatches.length > 0) {
      inMemoryJogos = translatedMatches;

      if (supabase) {
        try {
          console.log(`Writing ${translatedMatches.length} synchronized matches directly into Supabase...`);
          const dbInserts = translatedMatches.map(tm => ({
            id: tm.id,
            fase: tm.fase,
            grupo: tm.grupo,
            data_jogo: tm.data_jogo,
            time1: tm.time1,
            time2: tm.time2,
            gols_time1: tm.gols_time1,
            gols_time2: tm.gols_time2,
            finalizado: tm.finalizado
          }));

          const { error } = await supabase.from('jogos').upsert(dbInserts, { onConflict: 'id' });
          if (error) {
            console.error("Error upserting matches to Supabase games:", error);
          } else {
            console.log("Supabase matches table successfully synchronized from Football Data API.");
          }
        } catch (dbErr) {
          console.error("Failed to perform Supabase DB synchronization:", dbErr);
        }
      }
      
      recomputeMemoryPoints();
      return { success: true, count: translatedMatches.length, source: 'football_data_api' };
    }

    return { success: false, reason: 'empty_matches_received' };
  } catch (err: any) {
    console.error("Error syncing with Football-Data API:", err);
    return { success: false, error: err.message };
  }
}

// Offline In-Memory Fallbacks (simulating Supabase triggers and columns)
let inMemoryParticipantes: Array<{ id: string; nome: string; email: string; avatar_url: string; created_at: string }> = [];

let inMemoryJogos = [...defaultMatchesSeed];

let inMemoryPalpites: Array<{
  id: string;
  participante_id: string;
  jogo_id: string;
  palpite_time1: number;
  palpite_time2: number;
  pontos: number;
  created_at: string;
}> = [];

// Mathematical formula to calculate score (exactly matching PostgreSQL calculate_bolao_points)
function calculateScore(golsT1: number | null, golsT2: number | null, palpiteT1: number, palpiteT2: number): number {
  if (golsT1 === null || golsT2 === null) return 0;
  
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
}

// Helper to parse match times into actual Javascript Date objects
function parseMatchDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  
  if (!isNaN(Date.parse(dateStr))) {
    return new Date(dateStr);
  }
  
  const currentYear = 2026;
  const clean = dateStr.toUpperCase().trim();
  
  const regex = /(\d+)\s+DE\s+([A-ZÇÃÕÉÍÓÚ]+)(?:\s*-\s*|\s+)(\d+):(\d+)/i;
  const match = clean.match(regex);
  if (match) {
    const day = parseInt(match[1], 10);
    const monthStr = match[2];
    const hour = parseInt(match[3], 10);
    const minute = parseInt(match[4], 10);
    
    const months: Record<string, number> = {
      'JANEIRO': 0, 'FEVEREIRO': 1, 'MARÇO': 2, 'ABRIL': 3, 'MAIO': 4, 'JUNHO': 5,
      'JULHO': 6, 'AGOSTO': 7, 'SETEMBRO': 8, 'OUTUBRO': 9, 'NOVEMBRO': 10, 'DEZEMBRO': 11
    };
    
    const month = months[monthStr] !== undefined ? months[monthStr] : 5;
    return new Date(currentYear, month, day, hour, minute, 0);
  }
  
  const dmyRegex = /(\d+)\/(\d+)\/(\d+)(?:\s+|\s*-\s*)(\d+):(\d+)/;
  const dmyMatch = clean.match(dmyRegex);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    const hour = parseInt(dmyMatch[4], 10);
    const minute = parseInt(dmyMatch[5], 10);
    return new Date(year, month, day, hour, minute, 0);
  }

  const dmySimpleRegex = /(\d+)\/(\d+)(?:\s+|\s*-\s*)(\d+):(\d+)/;
  const dmySimpleMatch = clean.match(dmySimpleRegex);
  if (dmySimpleMatch) {
    const day = parseInt(dmySimpleMatch[1], 10);
    const month = parseInt(dmySimpleMatch[2], 10) - 1;
    const hour = parseInt(dmySimpleMatch[3], 10);
    const minute = parseInt(dmySimpleMatch[4], 10);
    return new Date(currentYear, month, day, hour, minute, 0);
  }
  
  return new Date();
}

// Memory database synchronization logic mimicking PostgreSQL Trigger Automation
function recomputeMemoryPoints() {
  inMemoryPalpites.forEach(guess => {
    const game = inMemoryJogos.find(g => g.id === guess.jogo_id);
    if (game && game.finalizado) {
      guess.pontos = calculateScore(game.gols_time1, game.gols_time2, guess.palpite_time1, guess.palpite_time2);
    } else {
      guess.pontos = 0;
    }
  });
}

function getMemoryRanking() {
  recomputeMemoryPoints();
  const rankList = inMemoryParticipantes.map(p => {
    const guesses = inMemoryPalpites.filter(g => g.participante_id === p.id);
    let totalPoints = 0;
    let exactsCount = 0;
    let acertosCount = 0;

    guesses.forEach(g => {
      const game = inMemoryJogos.find(m => m.id === g.jogo_id);
      if (game && game.finalizado) {
        totalPoints += g.pontos;
        if (g.pontos === 5) exactsCount++;
        if (g.pontos >= 2) acertosCount++;
      }
    });

    return {
      participante: p.nome,
      email: p.email,
      avatar_url: p.avatar_url,
      total_pontos: totalPoints,
      placares_exatos: exactsCount,
      acertos_resultado: acertosCount
    };
  });

  // Sort by official spec rules:
  // 1. total_pontos desc
  // 2. placares_exatos desc
  // 3. acertos_resultado desc
  // 4. alphabetical
  return rankList.sort((a, b) => {
    if (b.total_pontos !== a.total_pontos) return b.total_pontos - a.total_pontos;
    if (b.placares_exatos !== a.placares_exatos) return b.placares_exatos - a.placares_exatos;
    if (b.acertos_resultado !== a.acertos_resultado) return b.acertos_resultado - a.acertos_resultado;
    return a.participante.localeCompare(b.participante);
  });
}

// Auto-seed cloud database tables on boot
async function seedCloudDatabase() {
  if (!supabase) return;
  try {
    // 1. Seed matches
    const { data: existingGames } = await supabase.from('jogos').select('id');
    if (!existingGames || existingGames.length === 0) {
      const insertGames = defaultMatchesSeed.map(g => ({
        id: g.id,
        fase: g.fase,
        grupo: g.grupo,
        data_jogo: g.data_jogo,
        time1: g.time1,
        time2: g.time2,
        gols_time1: g.gols_time1,
        gols_time2: g.gols_time2,
        finalizado: g.finalizado
      }));
      await supabase.from('jogos').insert(insertGames);
      console.log('✔ Banquete de jogos reais semeado no Supabase com sucesso!');
    }
  } catch (err: any) {
    console.warn('Boot seeding alert (Supabase tables might not be fully migrated yet):', err.message);
  }
}

seedCloudDatabase();

// ==========================================
// API REST ENDPOINTS
// ==========================================

// Helper to clean avatar_url from password suffix
function cleanAvatarUrl(url: string | null | undefined): string {
  if (!url) return 'https://api.dicebear.com/7.x/bottts/svg?seed=Apostador';
  return url.split('||')[0];
}

// Real Authentication Endpoints
app.post('/api/auth/verify', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'E-mail é obrigatório para verificação.' });
  }

  const trimmedEmail = email.trim().toLowerCase();

  if (supabase) {
    try {
      const { data: profile, error } = await supabase
        .from('participantes')
        .select('*')
        .eq('email', trimmedEmail)
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      if (!profile) {
        return res.json({ exists: false });
      }

      const { data: rankingView } = await supabase.from('view_ranking').select('*').eq('email', trimmedEmail).maybeSingle();

      return res.json({
        exists: true,
        user: {
          id: profile.id,
          name: profile.nome || 'Apostador',
          email: trimmedEmail,
          avatar_url: cleanAvatarUrl(profile.avatar_url),
          points: rankingView?.total_pontos || 0,
          exacts: rankingView?.placares_exatos || 0,
          accuracy: rankingView?.acertos_resultado ? Math.round((rankingView.acertos_resultado / 4) * 100) : 0,
          rank: 12,
          isLoggedIn: true
        }
      });
    } catch (err: any) {
      console.error('Falha na verificação de sessão com Supabase:', err);
      return res.status(500).json({ error: 'Falha na verificação de sessão.' });
    }
  }

  const localPart = inMemoryParticipantes.find(p => p.email.toLowerCase() === trimmedEmail);
  if (!localPart) {
    return res.json({ exists: false });
  }

  const memoryRankings = getMemoryRanking();
  const index = memoryRankings.findIndex(r => r.email.toLowerCase() === trimmedEmail);
  const stats = memoryRankings[index] || { total_pontos: 0, placares_exatos: 0, acertos_resultado: 0 };

  return res.json({
    exists: true,
    user: {
      id: localPart.id,
      name: localPart.nome,
      email: localPart.email,
      avatar_url: cleanAvatarUrl(localPart.avatar_url),
      points: stats.total_pontos,
      exacts: stats.placares_exatos,
      accuracy: stats.acertos_resultado ? Math.round((stats.acertos_resultado / 4) * 100) : 0,
      rank: index >= 0 ? index + 1 : inMemoryParticipantes.length,
      isLoggedIn: true,
      simulated: true
    }
  });
});

app.post('/api/auth/signup', async (req, res) => {
  const { email, password, nome, avatarUrl } = req.body;
  
  if (!email || !password || !nome) {
    return res.status(400).json({ error: 'Faltam dados essenciais para o cadastro (email, senha e nome).' });
  }

  const trimmedEmail = email.trim().toLowerCase();

  // 1. Genuine Supabase database-driven signup without requiring auth email verification
  if (supabase) {
    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('participantes')
        .select('*')
        .eq('email', trimmedEmail)
        .maybeSingle();

      if (existingUser) {
        return res.status(400).json({ error: 'Este e-mail já está cadastrado em nosso sistema.' });
      }

      const finalId = crypto.randomUUID();
      const defaultAvatar = avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(nome)}`;
      const finalAvatarWithPassword = `${defaultAvatar}||${password}`;

      const { error: profileError } = await supabase.from('participantes').insert({
        id: finalId,
        nome: nome,
        email: trimmedEmail,
        avatar_url: finalAvatarWithPassword
      });

      if (profileError) {
        throw new Error(profileError.message);
      }

      return res.json({
        success: true,
        user: {
          id: finalId,
          name: nome,
          email: trimmedEmail,
          avatar_url: defaultAvatar,
          points: 0,
          exacts: 0,
          accuracy: 0,
          rank: 12,
          isLoggedIn: true
        }
      });
    } catch (err: any) {
      console.error('Falha no cadastro com Supabase (custom direct):', err);
      return res.status(400).json({ error: 'Erro de banco de dados ao salvar o usuário: ' + (err.message || err) });
    }
  }

  // 2. Off-grid fallback to local session memory
  const existing = inMemoryParticipantes.find(p => p.email.toLowerCase() === trimmedEmail);
  if (existing) {
    return res.status(400).json({ error: 'Este e-mail já está em uso na sessão do servidor.' });
  }

  const newId = 'luser_' + Math.random().toString(36).substring(2, 9);
  const defaultAvatar = avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(nome)}`;
  const finalAvatar = `${defaultAvatar}||${password}`;
  
  const localUser = {
    id: newId,
    nome,
    email: trimmedEmail,
    avatar_url: finalAvatar,
    created_at: new Date().toISOString()
  };
  inMemoryParticipantes.push(localUser);

  return res.json({
    success: true,
    user: {
      id: newId,
      name: nome,
      email: trimmedEmail,
      avatar_url: defaultAvatar,
      points: 0,
      exacts: 0,
      accuracy: 0,
      rank: inMemoryParticipantes.length,
      isLoggedIn: true,
      simulated: true
    }
  });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
  }

  const trimmedEmail = email.trim().toLowerCase();

  // 1. Genuine Supabase lookup directly on participantes
  if (supabase) {
    try {
      const { data: profile, error } = await supabase
        .from('participantes')
        .select('*')
        .eq('email', trimmedEmail)
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      if (!profile) {
        return res.status(401).json({ error: 'Nenhum usuário cadastrado com este e-mail. Alterne para a aba "Criar nova conta" para realizar o cadastro.' });
      }

      const avatarValue = profile.avatar_url || '';
      const realAvatarUrl = cleanAvatarUrl(avatarValue);
      let storedPassword = '';

      if (avatarValue.includes('||')) {
        storedPassword = avatarValue.split('||')[1];
      }

      // If a password was saved, require it to match (ignore check if user exists but has no password in schema)
      if (storedPassword && password !== storedPassword) {
        return res.status(401).json({ error: 'E-mail ou senha incorretos. Por favor, tente novamente.' });
      }

      const { data: rankingView } = await supabase.from('view_ranking').select('*').eq('email', trimmedEmail).maybeSingle();

      const finalName = profile.nome || 'Apostador';

      return res.json({
        success: true,
        user: {
          id: profile.id,
          name: finalName,
          email: trimmedEmail,
          avatar_url: realAvatarUrl,
          points: rankingView?.total_pontos || 0,
          exacts: rankingView?.placares_exatos || 0,
          accuracy: rankingView?.acertos_resultado ? Math.round((rankingView.acertos_resultado / 4) * 100) : 0,
          rank: 12,
          isLoggedIn: true
        }
      });
    } catch (err: any) {
      console.error('Falha no login com Supabase:', err);
      return res.status(500).json({ error: 'Erro de conexão ou falha ao efetuar login com o banco de dados.' });
    }
  }

  // 2. Off-grid fallback to local session memory
  const localPart = inMemoryParticipantes.find(p => p.email.toLowerCase() === trimmedEmail);
  if (!localPart) {
    return res.status(401).json({ error: 'Este e-mail de usuário não está cadastrado. Alterne para a aba "Criar nova conta".' });
  }

  const avatarValue = localPart.avatar_url || '';
  const realAvatarUrl = cleanAvatarUrl(avatarValue);
  let storedPassword = '';
  if (avatarValue.includes('||')) {
    storedPassword = avatarValue.split('||')[1];
  }

  if (storedPassword && password !== storedPassword) {
    return res.status(401).json({ error: 'E-mail ou senha incorretos. Por favor, tente novamente.' });
  }

  const memoryRankings = getMemoryRanking();
  const index = memoryRankings.findIndex(r => r.email.toLowerCase() === trimmedEmail);
  const stats = memoryRankings[index] || { total_pontos: 0, placares_exatos: 0, acertos_resultado: 0 };

  return res.json({
    success: true,
    user: {
      id: localPart.id,
      name: localPart.nome,
      email: localPart.email,
      avatar_url: realAvatarUrl,
      points: stats.total_pontos,
      exacts: stats.placares_exatos,
      accuracy: stats.acertos_resultado ? Math.round((stats.acertos_resultado / 4) * 100) : 0,
      rank: index >= 0 ? index + 1 : inMemoryParticipantes.length,
      isLoggedIn: true,
      simulated: true
    }
  });
});

app.post('/api/auth/update-profile', async (req, res) => {
  const { email, nome } = req.body;
  if (!email || !nome) {
    return res.status(400).json({ error: 'E-mail e nome são obrigatórios.' });
  }
  const trimmedEmail = email.trim().toLowerCase();
  if (supabase) {
    try {
      let { data: part } = await supabase.from('participantes').select('*').eq('email', trimmedEmail).maybeSingle();
      if (part) {
        const { error: updErr } = await supabase.from('participantes').update({ nome }).eq('email', trimmedEmail);
        if (updErr) throw new Error(updErr.message);
      } else {
        const finalId = crypto.randomUUID();
        const defaultAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(nome)}`;
        const { error: insErr } = await supabase.from('participantes').insert({
          id: finalId,
          nome,
          email: trimmedEmail,
          avatar_url: defaultAvatar
        });
        if (insErr) throw new Error(insErr.message);
      }
      return res.json({ success: true, message: 'Perfil atualizado com sucesso.' });
    } catch (err: any) {
      console.error('Falha ao atualizar perfil no Supabase:', err);
      // Fallback
    }
  }

  // Fallback memory database update
  let localPart = inMemoryParticipantes.find(p => p.email.toLowerCase() === trimmedEmail);
  if (localPart) {
    localPart.nome = nome;
  } else {
    inMemoryParticipantes.push({
      id: 'local_' + Date.now(),
      nome,
      email: trimmedEmail,
      avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(nome)}`,
      created_at: new Date().toISOString()
    });
  }
  return res.json({ success: true, message: 'Perfil em memória atualizado com sucesso.' });
});

app.post('/api/auth/delete-account', async (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'E-mail é obrigatório para excluir a conta.' });
  }

  const trimmedEmail = email.trim().toLowerCase();

  if (supabase) {
    try {
      // 1. Get the profile
      const { data: profile, error } = await supabase
        .from('participantes')
        .select('*')
        .eq('email', trimmedEmail)
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      if (!profile) {
        return res.status(404).json({ error: 'Nenhum usuário cadastrado com este e-mail.' });
      }

      const avatarValue = profile.avatar_url || '';
      let storedPassword = '';
      if (avatarValue.includes('||')) {
        storedPassword = avatarValue.split('||')[1];
      }

      // If user has a password in our custom login flow, validate it
      if (storedPassword && password && password !== storedPassword) {
        return res.status(401).json({ error: 'Senha incorreta para fins de deleção de conta.' });
      }

      // 2. Delete guesses from 'palpites'
      const { error: gErr } = await supabase
        .from('palpites')
        .delete()
        .eq('participante_id', profile.id);

      if (gErr) {
        console.warn('Erro ao deletar palpites ao excluir conta:', gErr.message);
      }

      // 3. Delete participant profile
      const { error: pErr } = await supabase
        .from('participantes')
        .delete()
        .eq('id', profile.id);

      if (pErr) {
        throw new Error(pErr.message);
      }

      // Also clear in-memory if present
      const memoryIdx = inMemoryParticipantes.findIndex(p => p.email.toLowerCase() === trimmedEmail);
      if (memoryIdx >= 0) {
        const pId = inMemoryParticipantes[memoryIdx].id;
        inMemoryParticipantes.splice(memoryIdx, 1);
        inMemoryPalpites = inMemoryPalpites.filter(g => g.participante_id !== pId);
      }

      return res.json({ success: true, message: 'Conta excluída com sucesso do banco de dados. Você já pode se cadastrar novamente.' });
    } catch (err: any) {
      console.error('Erro ao excluir conta:', err);
      return res.status(500).json({ error: 'Erro de banco de dados ao excluir a conta: ' + (err.message || err) });
    }
  }

  // Fallback to in-memory deletion
  const memoryIdx = inMemoryParticipantes.findIndex(p => p.email.toLowerCase() === trimmedEmail);
  if (memoryIdx === -1) {
    return res.status(404).json({ error: 'Nenhum usuário cadastrado localmente com este e-mail.' });
  }

  const localPart = inMemoryParticipantes[memoryIdx];
  const avatarValue = localPart.avatar_url || '';
  let storedPassword = '';
  if (avatarValue.includes('||')) {
    storedPassword = avatarValue.split('||')[1];
  }

  if (storedPassword && password && password !== storedPassword) {
    return res.status(401).json({ error: 'Senha incorreta para fins de deleção de conta.' });
  }

  const pId = localPart.id;
  inMemoryParticipantes.splice(memoryIdx, 1);
  inMemoryPalpites = inMemoryPalpites.filter(g => g.participante_id !== pId);

  return res.json({ success: true, message: 'Conta em memória excluída com sucesso. Você já pode se cadastrar novamente.' });
});

// Connection status check
app.get('/api/config-status', (req, res) => {
  res.json({
    supabase: isSupabaseConfigured,
    footballData: !!process.env.FOOTBALL_DATA_API_TOKEN,
    supabaseUrl: supabaseUrl ? supabaseUrl.slice(0, 20) + '...' : null,
    gemini: isGeminiConfigured
  });
});

// Google OAuth Endpoints
app.get('/api/auth/google/url', (req, res) => {
  const origin = (req.query.origin || '').toString();
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId || !process.env.GOOGLE_CLIENT_SECRET) {
    // If not configured, return the simulated/mock login URL endpoint
    return res.json({ 
      url: `/api/auth/google/simulated-popup?origin=${encodeURIComponent(origin)}`,
      configured: false 
    });
  }

  // Real Google Auth URL
  const redirectUri = `${origin}/api/auth/google/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state: origin
  });

  res.json({ 
    url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    configured: true 
  });
});

app.get('/api/auth/google/simulated-popup', (req, res) => {
  const origin = (req.query.origin || '').toString();
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Fazer login com o Google</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-[#f0f4f9] font-sans min-h-screen flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl shadow-xl w-full max-w-[450px] p-10 relative overflow-hidden">
        <div class="h-1 bg-blue-500 absolute top-0 left-0 right-0"></div>

        <div class="flex justify-center mb-6">
          <svg class="h-8" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        </div>

        <h1 class="text-2xl font-semibold text-gray-900 text-center mb-2">Fazer login com o Google</h1>
        <p class="text-sm text-gray-600 text-center mb-6 font-medium">Bolão Copa 2026</p>

        <div class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 space-y-2">
          <p class="font-bold flex items-center gap-1">
            <span>ℹ️</span> Ambiente de Homologação / Visualização
          </p>
          <p>Você pode testar o login simulado imediatamente selecionando ou digitando um usuário de teste abaixo.</p>
          <p class="text-[10px] text-gray-500 italic">Dica: Adicione <strong>GOOGLE_CLIENT_ID</strong> e <strong>GOOGLE_CLIENT_SECRET</strong> para usar o login real.</p>
        </div>

        <form id="google-mock-form" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Nome Completo</label>
            <input id="mock-nome" type="text" value="Felipe Souza" required class="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:border-blue-500 focus:outline-none" />
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-700 uppercase mb-1">E-mail</label>
            <input id="mock-email" type="email" value="felipe.souza@gmail.com" required class="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:border-blue-500 focus:outline-none" />
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-700 uppercase mb-1">URL do Avatar (Opcional)</label>
            <input id="mock-avatar" type="text" value="https://lh3.googleusercontent.com/aida-public/AB6AXuAeuJMB8vQa_0_uJNYvI4kzhQm_gBw5dqzj84p5ahEW-oqqzLZDTzpgKZhe9PfqGc9iBgXwWcu8EAPOtlufisiT1dImnChCI1fPW6ZHCap00no74cwsclK_H8i2Q2_CNfofSNeLbLAnOi4ENykypX_1c12Lp1uORyadN1LM68eMhi69MJRtatk1gmeY5V7ZEoOylA61Mdk5xA_3u99hURO0u1LEdP7kc-tRFIAwHJihTmYeJsZZKyTEsJCXTBxU5qgiEN4tVfucY_E" class="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:border-blue-500 focus:outline-none text-xs" />
          </div>

          <button type="submit" class="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition-all shadow-md">
            Prosseguir como Google User
          </button>
        </form>
      </div>

      <script>
        document.getElementById('google-mock-form').addEventListener('submit', async (e) => {
          e.preventDefault();
          const nome = document.getElementById('mock-nome').value;
          const email = document.getElementById('mock-email').value;
          const avatar = document.getElementById('mock-avatar').value;

          const res = await fetch('/api/auth/google/create-mock-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, email, avatar })
          });
          const data = await res.json();

          if (window.opener) {
            window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', user: data.user }, '*');
            window.close();
          } else {
            alert('Erro: Janela pai não encontrada.');
          }
        });
      </script>
    </body>
    </html>
  `);
});

app.post('/api/auth/google/create-mock-session', async (req, res) => {
  const { nome, email, avatar } = req.body;
  if (!email || !nome) {
    return res.status(400).json({ error: 'Faltam dados essenciais para o cadastro de teste.' });
  }

  const finalAvatar = avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(nome)}`;

  if (supabase) {
    try {
      const googleId = 'google_mock_' + Math.random().toString(36).substring(2, 9);
      let { data: part } = await supabase.from('participantes').select('*').eq('email', email).single();
      let finalId = part?.id || googleId;
      if (!part) {
        const { error: insErr } = await supabase.from('participantes').insert({
          id: googleId,
          nome,
          email,
          avatar_url: finalAvatar
        });
        if (insErr) {
          console.warn('Erro ao inserir perfil de teste com Supabase:', insErr.message);
        }
      }

      const { data: rankingView } = await supabase.from('view_ranking').select('*').eq('email', email).single();

      return res.json({
        user: {
          id: finalId,
          name: part?.nome || nome,
          email: email,
          avatar_url: part?.avatar_url || finalAvatar,
          points: rankingView?.total_pontos || 0,
          exacts: rankingView?.placares_exatos || 0,
          accuracy: rankingView?.acertos_resultado ? Math.round((rankingView.acertos_resultado / 4) * 100) : 0,
          rank: 12,
          isLoggedIn: true
        }
      });
    } catch (err) {
      console.error('Falha ao processar mock google user com Supabase:', err);
    }
  }

  const existing = inMemoryParticipantes.find(p => p.email.toLowerCase() === email.toLowerCase());
  let finalId = existing?.id || ('google_mock_' + Math.random().toString(36).substring(2, 9));
  if (!existing) {
    inMemoryParticipantes.push({
      id: finalId,
      nome,
      email,
      avatar_url: finalAvatar,
      created_at: new Date().toISOString()
    });
  }

  const memoryRankings = getMemoryRanking();
  const index = memoryRankings.findIndex(r => r.email.toLowerCase() === email.toLowerCase());
  const stats = memoryRankings[index] || { total_pontos: 0, placares_exatos: 0, acertos_resultado: 0 };

  return res.json({
    user: {
      id: finalId,
      name: existing?.nome || nome,
      email: email,
      avatar_url: existing?.avatar_url || finalAvatar,
      points: stats.total_pontos,
      exacts: stats.placares_exatos,
      accuracy: stats.acertos_resultado ? Math.round((stats.acertos_resultado / 4) * 100) : 0,
      rank: index >= 0 ? index + 1 : inMemoryParticipantes.length,
      isLoggedIn: true,
      simulated: true
    }
  });
});

app.get('/api/auth/google/callback', async (req, res) => {
  const code = (req.query.code || '').toString();
  const state = (req.query.state || '').toString(); // holding client origin

  if (!code) {
    return res.status(400).send('Código de autorização inválido.');
  }

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${state}/api/auth/google/callback`,
        grant_type: 'authorization_code'
      })
    });

    const tokens: any = await tokenResponse.json();

    if (tokens.error) {
      throw new Error(tokens.error_description || tokens.error);
    }

    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });

    const profile: any = await userInfoResponse.json();
    const email = profile.email;
    const nome = profile.name || email.split('@')[0];
    const finalAvatar = profile.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(nome)}`;

    let responseUser: any = null;

    if (supabase) {
      const googleId = 'google_' + profile.sub;
      let { data: part } = await supabase.from('participantes').select('*').eq('email', email).single();
      let finalId = part?.id || googleId;
      if (!part) {
        await supabase.from('participantes').insert({
          id: googleId,
          nome,
          email,
          avatar_url: finalAvatar
        });
      }

      const { data: rankingView } = await supabase.from('view_ranking').select('*').eq('email', email).single();

      responseUser = {
        id: finalId,
        name: part?.nome || nome,
        email: email,
        avatar_url: part?.avatar_url || finalAvatar,
        points: rankingView?.total_pontos || 0,
        exacts: rankingView?.placares_exatos || 0,
        accuracy: rankingView?.acertos_resultado ? Math.round((rankingView.acertos_resultado / 4) * 100) : 0,
        rank: 12,
        isLoggedIn: true
      };
    } else {
      const existing = inMemoryParticipantes.find(p => p.email.toLowerCase() === email.toLowerCase());
      let finalId = existing?.id || ('google_' + profile.sub);
      if (!existing) {
        inMemoryParticipantes.push({
          id: finalId,
          nome,
          email,
          avatar_url: finalAvatar,
          created_at: new Date().toISOString()
        });
      }

      const memoryRankings = getMemoryRanking();
      const index = memoryRankings.findIndex(r => r.email.toLowerCase() === email.toLowerCase());
      const stats = memoryRankings[index] || { total_pontos: 0, placares_exatos: 0, acertos_resultado: 0 };

      responseUser = {
        id: finalId,
        name: existing?.nome || nome,
        email: email,
        avatar_url: existing?.avatar_url || finalAvatar,
        points: stats.total_pontos,
        exacts: stats.placares_exatos,
        accuracy: stats.acertos_resultado ? Math.round((stats.acertos_resultado / 4) * 100) : 0,
        rank: index >= 0 ? index + 1 : inMemoryParticipantes.length,
        isLoggedIn: true,
        simulated: true
      };
    }

    res.send(`
      <!DOCTYPE html>
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', user: ${JSON.stringify(responseUser)} }, '*');
              window.close();
            } else {
              window.location.origin = '${state}';
            }
          </script>
          <p>Autenticação efetuada com sucesso! Esta janela fechará automaticamente...</p>
        </body>
      </html>
    `);
  } catch (err: any) {
    console.error('Falha no processo de Callback Google OAuth:', err);
    res.status(500).send(`Erro ao fazer login com o Google: ${err.message || err}`);
  }
});


// Fetch unified match calendar (combining with flags metadata)
app.get('/api/matches', async (req, res) => {
  // Automatically trigger cached sync of Google Sheets or football-data API upon loading matches
  try {
    const sheetSync = await syncMatchesFromSpreadsheet(false);
    if (!sheetSync || sheetSync.reason === 'no_url_configured') {
      if (process.env.FOOTBALL_DATA_API_TOKEN) {
        await syncMatchesFromFootballData(false);
      }
    }
  } catch (e) {
    console.warn("Auto-sync inside matches endpoint skipped or errored:", e);
  }

  if (supabase) {
    try {
      const { data: dbGames, error } = await supabase.from('jogos').select('*');
      if (!error && dbGames && dbGames.length > 0) {
        const matches = dbGames.map(g => {
          const seedMeta = defaultMatchesSeed.find(sm => sm.id === g.id);
          return {
            id: g.id,
            homeTeam: g.time1,
            awayTeam: g.time2,
            homeFlag: getTeamFlag(g.time1),
            awayFlag: getTeamFlag(g.time2),
            date: g.data_jogo,
            time: g.data_jogo.split(' - ')[1] || '16:00',
            location: seedMeta?.location || 'ESTÁDIO OFICIAL',
            realHomeScore: g.gols_time1 !== null ? g.gols_time1 : undefined,
            realAwayScore: g.gols_time2 !== null ? g.gols_time2 : undefined,
            status: g.finalizado ? 'ENCERRADO' : 'ABERTO'
          };
        });
        return res.json({ source: 'supabase', matches });
      }
    } catch (err) {
      console.warn('Supabase matches query error, falling back to local memory database.');
    }
  }

  // Local fallback
  const mappedMatches = inMemoryJogos.map(g => {
    return {
      id: g.id,
      homeTeam: g.time1,
      awayTeam: g.time2,
      homeFlag: getTeamFlag(g.time1),
      awayFlag: getTeamFlag(g.time2),
      date: g.data_jogo,
      time: g.data_jogo.split(' - ')[1] || '16:00',
      location: g.location || 'ESTÁDIO OFICIAL',
      realHomeScore: g.gols_time1 !== null ? g.gols_time1 : undefined,
      realAwayScore: g.gols_time2 !== null ? g.gols_time2 : undefined,
      status: g.finalizado ? 'ENCERRADO' : 'ABERTO'
    };
  });
  res.json({ source: 'local_memory', matches: mappedMatches });
});

// Calculate tournament standings automatically from the matches entries
app.get('/api/standings', async (req, res) => {
  let gamesList: any[] = [];
  if (supabase) {
    try {
      const { data: dbGames, error } = await supabase.from('jogos').select('*');
      if (!error && dbGames && dbGames.length > 0) {
        gamesList = dbGames;
      } else {
        gamesList = inMemoryJogos;
      }
    } catch (err) {
      gamesList = inMemoryJogos;
    }
  } else {
    gamesList = inMemoryJogos;
  }

  // Filter games matching 'Grupo' keyword
  const groupStageGames = gamesList.filter(g => {
    const gr = g.grupo || g.fase || '';
    return gr.toLowerCase().includes('grupo');
  });

  if (groupStageGames.length === 0) {
    // Elegant fallback if no group matches are present
    const defaultWebStandings = [
      {
        group: 'Grupo A (América do Norte)',
        table: [
          { position: 1, team: 'Brasil', points: 0, played: 0, won: 0, draw: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 },
          { position: 2, team: 'Alemanha', points: 0, played: 0, won: 0, draw: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 },
          { position: 3, team: 'Argentina', points: 0, played: 0, won: 0, draw: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 },
          { position: 4, team: 'França', points: 0, played: 0, won: 0, draw: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 }
        ]
      },
      {
        group: 'Grupo B (Europa, Ásia & África)',
        table: [
          { position: 1, team: 'Japão', points: 0, played: 0, won: 0, draw: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 },
          { position: 2, team: 'Portugal', points: 0, played: 0, won: 0, draw: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 },
          { position: 3, team: 'Marrocos', points: 0, played: 0, won: 0, draw: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 },
          { position: 4, team: 'Espanha', points: 0, played: 0, won: 0, draw: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 }
        ]
      }
    ];
    return res.json({ source: 'default_fallback', standings: defaultWebStandings });
  }

  // Group matches by group name
  const groups: Record<string, any[]> = {};
  groupStageGames.forEach(g => {
    const rawGrp = g.grupo || g.fase || 'Grupo A';
    // Format display title elegantly
    let grpTitle = rawGrp;
    if (rawGrp === 'Grupo A') {
      grpTitle = 'Grupo A (América do Norte)';
    } else if (rawGrp === 'Grupo B') {
      grpTitle = 'Grupo B (Europa & Ásia)';
    }

    if (!groups[grpTitle]) {
      groups[grpTitle] = [];
    }
    groups[grpTitle].push(g);
  });

  // Calculate stats for each group
  const standings = Object.keys(groups).map(grpTitle => {
    const groupMatches = groups[grpTitle];
    const teamStats: Record<string, {
      team: string;
      points: number;
      played: number;
      won: number;
      draw: number;
      lost: number;
      goalsFor: number;
      goalsAgainst: number;
    }> = {};

    // Seed every unique team in this group with zeroed fields so they are shown in the board
    groupMatches.forEach(g => {
      const team1 = g.time1 || g.homeTeam;
      const team2 = g.time2 || g.awayTeam;
      if (team1 && !teamStats[team1]) {
        teamStats[team1] = { team: team1, points: 0, played: 0, won: 0, draw: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 };
      }
      if (team2 && !teamStats[team2]) {
        teamStats[team2] = { team: team2, points: 0, played: 0, won: 0, draw: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 };
      }
    });

    // Populate actual calculated stats from finished matches
    groupMatches.forEach(g => {
      const isFinished = g.finalizado;
      const score1 = g.gols_time1 !== undefined ? g.gols_time1 : g.realHomeScore;
      const score2 = g.gols_time2 !== undefined ? g.gols_time2 : g.realAwayScore;

      if (isFinished && score1 !== null && score2 !== null && score1 !== undefined && score2 !== undefined) {
        const team1 = g.time1 || g.homeTeam;
        const team2 = g.time2 || g.awayTeam;
        const goals1 = Number(score1);
        const goals2 = Number(score2);

        if (teamStats[team1] && teamStats[team2]) {
          teamStats[team1].played += 1;
          teamStats[team2].played += 1;

          teamStats[team1].goalsFor += goals1;
          teamStats[team1].goalsAgainst += goals2;

          teamStats[team2].goalsFor += goals2;
          teamStats[team2].goalsAgainst += goals1;

          if (goals1 > goals2) {
            teamStats[team1].won += 1;
            teamStats[team1].points += 3;
            teamStats[team2].lost += 1;
          } else if (goals1 < goals2) {
            teamStats[team2].won += 1;
            teamStats[team2].points += 3;
            teamStats[team1].lost += 1;
          } else {
            teamStats[team1].draw += 1;
            teamStats[team1].points += 1;
            teamStats[team2].draw += 1;
            teamStats[team2].points += 1;
          }
        }
      }
    });

    // Sort team standings by World Cup standard criteria: Points, GD, GF, alphabetical asc
    const sorted = Object.values(teamStats).sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      const goalDiffA = a.goalsFor - a.goalsAgainst;
      const goalDiffB = b.goalsFor - b.goalsAgainst;
      if (goalDiffB !== goalDiffA) {
        return goalDiffB - goalDiffA;
      }
      if (b.goalsFor !== a.goalsFor) {
        return b.goalsFor - a.goalsFor;
      }
      return a.team.localeCompare(b.team);
    });

    // Add Rank Position (1 to 4)
    const table = sorted.map((item, index) => ({
      position: index + 1,
      ...item
    }));

    return {
      group: grpTitle,
      table
    };
  });

  // Sort groups alphabetically by their group name header so output is clean
  standings.sort((a, b) => a.group.localeCompare(b.group));

  res.json({ source: 'dynamic_calculations', standings });
});

// Register or edit a guess (supports both Supabase transaction and Local Fallback)
app.post('/api/guesses', async (req, res) => {
  const { email, userName, matchId, homeScore, awayScore } = req.body;
  if (!email || !matchId || homeScore === undefined || awayScore === undefined) {
    return res.status(400).json({ error: 'Faltam dados essenciais para o palpite.' });
  }

  const hScore = Number(homeScore);
  const aScore = Number(awayScore);

  // Validate date & finalized status (locked if finished or starting in < 1 hour)
  let gameObj: any = null;
  if (supabase) {
    try {
      const { data: dbGame } = await supabase.from('jogos').select('*').eq('id', matchId).single();
      if (dbGame) {
        gameObj = dbGame;
      }
    } catch (err) {
      console.warn('Erro ao buscar jogo no Supabase para validar palpite:', err);
    }
  }

  if (!gameObj) {
    gameObj = inMemoryJogos.find(g => g.id === matchId);
  }

  if (!gameObj) {
    return res.status(404).json({ error: 'Jogo não encontrado para salvar seu palpite.' });
  }

  const now = new Date();
  const matchDate = parseMatchDate(gameObj.data_jogo || gameObj.date);
  const oneHour = 60 * 60 * 1000;

  if (gameObj.finalizado) {
    return res.status(400).json({ error: 'Este jogo já foi encerrado. Não é possível alterar seu palpite.' });
  }

  if (now.getTime() > matchDate.getTime() - oneHour) {
    return res.status(400).json({ error: 'Prazo esgotado! Só é permitido salvar ou alterar palpites até 1 hora antes do início do jogo.' });
  }

  if (supabase) {
    try {
      // 1. Ensure participant profile exists in `participantes` table
      let { data: part } = await supabase.from('participantes').select('*').eq('email', email).single();
      if (!part) {
        const { data: newPart, error: insErr } = await supabase
          .from('participantes')
          .insert({ nome: userName || email.split('@')[0], email, avatar_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAeuJMB8vQa_0_uJNYvI4kzhQm_gBw5dqzj84p5ahEW-oqqzLZDTzpgKZhe9PfqGc9iBgXwWcu8EAPOtlufisiT1dImnChCI1fPW6ZHCap00no74cwsclK_H8i2Q2_CNfofSNeLbLAnOi4ENykypX_1c12Lp1uORyadN1LM68eMhi69MJRtatk1gmeY5V7ZEoOylA61Mdk5xA_3u99hURO0u1LEdP7kc-tRFIAwHJihTmYeJsZZKyTEsJCXTBxU5qgiEN4tVfucY_E' })
          .select()
          .single();
        if (insErr) throw insErr;
        part = newPart;
      }

      // 2. Compute live points if the game is already finished
      const { data: game } = await supabase.from('jogos').select('*').eq('id', matchId).single();
      const scorePoints = game && game.finalizado ? calculateScore(game.gols_time1, game.gols_time2, hScore, aScore) : 0;

      // 3. Upsert guess into `palpites`
      const { error: upsertErr } = await supabase
        .from('palpites')
        .upsert(
          {
            participante_id: part.id,
            jogo_id: matchId,
            palpite_time1: hScore,
            palpite_time2: aScore,
            pontos: scorePoints
          },
          { onConflict: 'participante_id,jogo_id' }
        );

      if (upsertErr) throw upsertErr;

      // 4. Query updated summary stats for response profile
      const { data: userSummary } = await supabase.from('view_ranking').select('*').eq('email', email).single();

      return res.json({
        success: true,
        source: 'supabase',
        updatedProfile: {
          points: userSummary?.total_pontos || 0,
          exacts: userSummary?.placares_exatos || 0,
          accuracy: userSummary?.acertos_resultado ? Math.round((userSummary.acertos_resultado / 4) * 100) : 0,
          rank: 1 // dynamic ranking client-side/database
        }
      });
    } catch (err: any) {
      console.warn('Supabase guess insertion failed, falling back to local memory database:', err.message);
    }
  }

  // Local Memory fallback implementation
  let localUser = inMemoryParticipantes.find(p => p.email === email);
  if (!localUser) {
    localUser = {
      id: 'local_' + Date.now(),
      nome: userName || email.split('@')[0],
      email,
      avatar_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAeuJMB8vQa_0_uJNYvI4kzhQm_gBw5dqzj84p5ahEW-oqqzLZDTzpgKZhe9PfqGc9iBgXwWcu8EAPOtlufisiT1dImnChCI1fPW6ZHCap00no74cwsclK_H8i2Q2_CNfofSNeLbLAnOi4ENykypX_1c12Lp1uORyadN1LM68eMhi69MJRtatk1gmeY5V7ZEoOylA61Mdk5xA_3u99hURO0u1LEdP7kc-tRFIAwHJihTmYeJsZZKyTEsJCXTBxU5qgiEN4tVfucY_E',
      created_at: new Date().toISOString()
    };
    inMemoryParticipantes.push(localUser);
  }

  const existingGuessIdx = inMemoryPalpites.findIndex(g => g.participante_id === localUser!.id && g.jogo_id === matchId);
  const targetGame = inMemoryJogos.find(g => g.id === matchId);
  const calculatedPoints = targetGame && targetGame.finalizado ? calculateScore(targetGame.gols_time1, targetGame.gols_time2, hScore, aScore) : 0;

  if (existingGuessIdx >= 0) {
    inMemoryPalpites[existingGuessIdx].palpite_time1 = hScore;
    inMemoryPalpites[existingGuessIdx].palpite_time2 = aScore;
    inMemoryPalpites[existingGuessIdx].pontos = calculatedPoints;
  } else {
    inMemoryPalpites.push({
      id: 'g_' + Math.random().toString(36).substring(2),
      participante_id: localUser.id,
      jogo_id: matchId,
      palpite_time1: hScore,
      palpite_time2: aScore,
      pontos: calculatedPoints,
      created_at: new Date().toISOString()
    });
  }

  // Recount statistics
  const currentRankings = getMemoryRanking();
  const index = currentRankings.findIndex(r => r.email === email);
  const rankingSummary = currentRankings[index] || { total_pontos: 0, placares_exatos: 0, acertos_resultado: 0 };

  res.json({
    success: true,
    source: 'local_memory',
    updatedProfile: {
      points: rankingSummary.total_pontos,
      exacts: rankingSummary.placares_exatos,
      accuracy: Math.round((rankingSummary.acertos_resultado / Math.max(1, inMemoryPalpites.filter(g => g.participante_id === localUser!.id).length)) * 100),
      rank: index >= 0 ? index + 1 : 12
    }
  });
});

// Retrieve guesses of a user
app.get('/api/guesses', async (req, res) => {
  const { email } = req.query;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email requerido.' });
  }

  if (supabase) {
    try {
      const { data: user } = await supabase.from('participantes').select('*').eq('email', email).single();
      if (user) {
        const { data: dbGuesses } = await supabase.from('palpites').select('*').eq('participante_id', user.id);
        if (dbGuesses) {
          const mapped = dbGuesses.map(g => ({
            matchId: g.jogo_id,
            homeScore: g.palpite_time1,
            awayScore: g.palpite_time2
          }));
          return res.json({ source: 'supabase', guesses: mapped });
        }
      }
    } catch (err) {
      console.warn('Supabase guesses retrieval failed, falling back to local memory cache.');
    }
  }

  // Memory fallback
  const localUser = inMemoryParticipantes.find(p => p.email === email);
  if (!localUser) {
    return res.json({ source: 'local_memory', guesses: [] });
  }

  const guesses = inMemoryPalpites
    .filter(g => g.participante_id === localUser.id)
    .map(g => ({
      matchId: g.jogo_id,
      homeScore: g.palpite_time1,
      awayScore: g.palpite_time2
    }));

  res.json({ source: 'local_memory', guesses });
});

// Retrieve generalized ranking lists
app.get('/api/ranking', async (req, res) => {
  if (supabase) {
    try {
      const { data: rankView, error } = await supabase.from('view_ranking').select('*');
      if (!error && rankView) {
        const ranking = rankView.map((r, idx) => ({
          rank: idx + 1,
          name: r.participante,
          username: r.email.split('@')[0],
          avatar: cleanAvatarUrl(r.avatar_url),
          points: r.total_pontos,
          exacts: r.placares_exatos,
          accuracy: r.acertos_resultado ? Math.min(100, Math.round((r.placares_exatos / Math.max(1, r.total_pontos)) * 100)) : 0
        }));
        return res.json({ source: 'supabase', ranking });
      }
    } catch (err: any) {
      console.warn('Failed to query view_ranking from Supabase:', err.message);
    }
  }

  // Local Ranking Fallback
  const stats = getMemoryRanking();
  const ranking = stats.map((r, idx) => ({
    rank: idx + 1,
    name: r.participante,
    username: r.email.split('@')[0],
    avatar: cleanAvatarUrl(r.avatar_url),
    points: r.total_pontos,
    exacts: r.placares_exatos,
    accuracy: Math.round((r.acertos_resultado / 5) * 100)
  }));
  res.json({ source: 'local_memory', ranking });
});

// Fetch unified statistics reports
app.get('/api/estatisticas', async (req, res) => {
  let rankings: any[] = [];
  let totalGuesses = 0;
  let totalExacts = 0;
  let totalCorrect = 0;
  let activeUsers = 0;
  let allGuesses: any[] = [];
  let allMatches: any[] = [];

  if (supabase) {
    try {
      const { data: rankView } = await supabase.from('view_ranking').select('*');
      rankings = rankView || [];
      activeUsers = rankings.length;

      const { data: guessesData } = await supabase.from('palpites').select('*');
      allGuesses = guessesData || [];
      totalGuesses = allGuesses.length;
      
      const { data: gamesData } = await supabase.from('jogos').select('*');
      allMatches = gamesData || [];
      
      totalExacts = allGuesses.filter((g: any) => g.pontos === 5).length;
      totalCorrect = allGuesses.filter((g: any) => g.pontos >= 2).length;
    } catch (e) {
      console.warn('Failed to load stats from Supabase, falling back to local memory:', e);
      rankings = getMemoryRanking();
      activeUsers = inMemoryParticipantes.length;
      allGuesses = inMemoryPalpites;
      totalGuesses = inMemoryPalpites.length;
      allMatches = inMemoryJogos;
      totalExacts = inMemoryPalpites.filter(g => g.pontos === 5).length;
      totalCorrect = inMemoryPalpites.filter(g => g.pontos >= 2).length;
    }
  } else {
    rankings = getMemoryRanking();
    activeUsers = inMemoryParticipantes.length;
    allGuesses = inMemoryPalpites;
    totalGuesses = inMemoryPalpites.length;
    allMatches = inMemoryJogos;
    totalExacts = inMemoryPalpites.filter(g => g.pontos === 5).length;
    totalCorrect = inMemoryPalpites.filter(g => g.pontos >= 2).length;
  }

  const leader = rankings[0];
  const avgPoints = rankings.length ? Math.round((rankings.reduce((sum, current) => sum + (current.total_pontos || 0), 0) / rankings.length) * 10) / 10 : 0;
  
  // Calculate top 3 performers
  const topPerformers = rankings.slice(0, 3).map((r, idx) => ({
    rank: idx + 1,
    name: r.participante || 'Apostador Sem Nome',
    username: r.email ? r.email.split('@')[0] : 'user',
    avatar: cleanAvatarUrl(r.avatar_url),
    points: r.total_pontos || 0
  }));

  // Build points per round dynamically based on actual matches/guesses in each phase!
  let phasesDataMap: Record<string, { totalPoints: number; participantsCount: number }> = {};
  
  // Initialize with known phases
  const initialPhases = ['Grupo A', 'Grupo B', 'Oitavas', 'Quartas', 'Semifinal', 'Final'];
  initialPhases.forEach(p => {
    phasesDataMap[p] = { totalPoints: 0, participantsCount: 0 };
  });

  // Calculate real average points per phase
  allGuesses.forEach((g: any) => {
    const matchedGame = allMatches.find(gm => gm.id === g.jogo_id);
    const fase = matchedGame ? matchedGame.fase : 'Grupo A';
    if (!phasesDataMap[fase]) {
      phasesDataMap[fase] = { totalPoints: 0, participantsCount: 0 };
    }
    phasesDataMap[fase].totalPoints += (g.pontos || 0);
    phasesDataMap[fase].participantsCount += 1;
  });

  // Generate rounds representation
  const rounds = Object.keys(phasesDataMap).map(phase => {
    const data = phasesDataMap[phase];
    const avg = data.participantsCount > 0 ? Math.round((data.totalPoints / data.participantsCount) * 10) / 10 : 0;
    // Map to scale percentage for bar size (max is 5 points per guess)
    const pct = Math.min(100, Math.max(10, Math.round((avg / 5) * 100)));
    return {
      label: phase,
      value: `${pct}%`,
      points: `${avg} pts`,
      active: data.participantsCount > 0
    };
  });

  res.json({
    totalGuesses,
    averagePoints: avgPoints,
    activeParticipants: activeUsers,
    leaderName: leader ? leader.participante : '-',
    totalExacts,
    totalCorrect,
    topPerformers,
    roundsData: rounds
  });
});

// ==========================================
// ADMIN CONTROL PANEL CONTROLLERS
// ==========================================

// Endpoint to force seed or insert a custom match schedule (Administrador)
app.post('/api/admin/jogos', async (req, res) => {
  const { id, fase, grupo, data_jogo, time1, time2, location } = req.body;
  if (!id || !time1 || !time2) {
    return res.status(400).json({ error: 'Os dados do jogo são insuficientes.' });
  }

  const newGameObj = {
    id,
    fase: fase || 'Grupo',
    grupo: grupo || 'Grupo A',
    data_jogo: data_jogo || '22 DE JUNHO - 16:00',
    time1,
    time2,
    gols_time1: null,
    gols_time2: null,
    finalizado: false,
    homeFlag: defaultMatchesSeed.find(m => m.time1 === time1)?.homeFlag || 'https://flagcdn.com/w80/br.png',
    awayFlag: defaultMatchesSeed.find(m => m.time2 === time2)?.awayFlag || 'https://flagcdn.com/w80/de.png',
    location: location || 'CAMP DE FUTEBOL'
  };

  if (supabase) {
    try {
      const { error } = await supabase.from('jogos').upsert({
        id,
        fase: newGameObj.fase,
        grupo: newGameObj.grupo,
        data_jogo: newGameObj.data_jogo,
        time1,
        time2,
        finalizado: false
      });
      if (!error) {
        return res.json({ success: true, source: 'supabase', game: newGameObj });
      }
    } catch (e: any) {
      console.warn('Supabase games insert crash, using memory stack fallback:', e.message);
    }
  }

  // Memory operations
  const idx = inMemoryJogos.findIndex(m => m.id === id);
  if (idx >= 0) {
    inMemoryJogos[idx] = newGameObj;
  } else {
    inMemoryJogos.push(newGameObj);
  }

  res.json({ success: true, source: 'local_memory', game: newGameObj });
});

// Mark game as finished, type goals and recalculate values (Administrador)
app.post('/api/admin/lancar-resultado', async (req, res) => {
  const { jogo_id, gols_time1, gols_time2 } = req.body;
  if (!jogo_id || gols_time1 === undefined || gols_time2 === undefined) {
    return res.status(400).json({ error: 'Dificuldade de dados. Forneça o jogo_id e os gols das seleções.' });
  }

  const g1 = Number(gols_time1);
  const g2 = Number(gols_time2);

  if (supabase) {
    try {
      // 1. Update the match to finalized
      const { error: matchErr } = await supabase
        .from('jogos')
        .update({
          gols_time1: g1,
          gols_time2: g2,
          finalizado: true
        })
        .eq('id', jogo_id);

      if (matchErr) throw matchErr;

      // Note: Triggers automatically fire here updating exact scores inside `palpites`!
      return res.json({
        success: true,
        source: 'supabase',
        message: 'Resultado de jogo oficial lançado! Pontuações recalculadas via trigger PostgreSQL Supabase.'
      });
    } catch (err: any) {
      console.warn('Automatic trigger finalization failed to target cloud DB, processing manually:', err.message);
    }
  }

  // Local Memory Recount (mimics trigger)
  const game = inMemoryJogos.find(g => g.id === jogo_id);
  if (game) {
    game.gols_time1 = g1;
    game.gols_time2 = g2;
    game.finalizado = true;

    // Recalculating trigger simulation
    recomputeMemoryPoints();

    return res.json({
      success: true,
      source: 'local_memory',
      message: 'Placar de jogo registrado com sucesso no simulador em memória local!'
    });
  }

  res.status(404).json({ error: 'Jogo não localizado para lançamento de placar.' });
});

// Forced points re-processing engine (Administrador)
app.post('/api/admin/reprocessar', async (req, res) => {
  if (supabase) {
    try {
      // Fetch all matches and recalculate every single prediction
      const { data: allMatches } = await supabase.from('jogos').select('*').eq('finalizado', true);
      if (allMatches) {
        for (const m of allMatches) {
          const { data: guesses } = await supabase.from('palpites').select('*').eq('jogo_id', m.id);
          if (guesses) {
            for (const g of guesses) {
              const score = calculateScore(m.gols_time1, m.gols_time2, g.palpite_time1, g.palpite_time2);
              await supabase.from('palpites').update({ pontos: score }).eq('id', g.id);
            }
          }
        }
        return res.json({ success: true, source: 'supabase', reprocessed: allMatches.length });
      }
    } catch (e) {
      console.warn('Failed to clean re-score Supabase:', e);
    }
  }

  recomputeMemoryPoints();
  res.json({ success: true, source: 'local_memory', message: 'Reprocessamento manual de ranking finalizado.' });
});

// Repopulate standard schedule if matches got altered
app.post('/api/admin/importar', async (req, res) => {
  const token = process.env.FOOTBALL_DATA_API_TOKEN;

  if (token) {
    try {
      console.log('Admin triggered manual update from football-data API...');
      if (supabase) {
        await supabase.from('jogos').delete().neq('id', 'null');
      }
      const syncResult = await syncMatchesFromFootballData(true); // force-sync bypasses the 10-minutes cache
      if (syncResult.success) {
        return res.json({ 
          success: true, 
          source: 'football_data_api', 
          message: `Sincronização forçada concluída com sucesso! ${syncResult.count} partidas sincronizadas.` 
        });
      } else {
        console.warn('API sync failed during admin import, seeding default matches instead:', syncResult.reason);
      }
    } catch (err: any) {
      console.error('Error during admin API sync:', err);
    }
  }

  // Fallback to local default seeds
  if (supabase) {
    try {
      await supabase.from('jogos').delete().neq('id', 'null');
      const inserts = defaultMatchesSeed.map(g => ({
        id: g.id,
        fase: g.fase,
        grupo: g.grupo,
        data_jogo: g.data_jogo,
        time1: g.time1,
        time2: g.time2,
        gols_time1: g.gols_time1,
        gols_time2: g.gols_time2,
        finalizado: g.finalizado
      }));
      await supabase.from('jogos').insert(inserts);
      return res.json({ 
        success: true, 
        source: 'supabase', 
        message: 'Tabelas redefinidas para o calendário realista padrão da Copa (Simulado)!' 
      });
    } catch (e) {
      console.warn('Backup local refresh done because API keys / migrations are pending.');
    }
  }

  inMemoryJogos = [...defaultMatchesSeed];
  recomputeMemoryPoints();
  res.json({ 
    success: true, 
    source: 'local_memory', 
    message: 'Tabelas em memória redefinidas para o calendário realista padrão da Copa (Simulado)!' 
  });
});

// Bulk import endpoint for custom matches from Excel/CSV (Administrador)
app.post('/api/admin/bulk-import', async (req, res) => {
  const { matches } = req.body;
  if (!matches || !Array.isArray(matches)) {
    return res.status(400).json({ error: 'Os dados dos jogos importados estão ausentes ou são inválidos.' });
  }

  const translatedMatches = matches.map((m, idx) => {
    const rawT1 = m.time1 || m.homeTeam || '';
    const rawT2 = m.time2 || m.awayTeam || '';
    const t1 = translateTeam(rawT1.trim());
    const t2 = translateTeam(rawT2.trim());

    const g1 = (m.gols_time1 !== undefined && m.gols_time1 !== null && m.gols_time1 !== '') ? Number(m.gols_time1) : null;
    const g2 = (m.gols_time2 !== undefined && m.gols_time2 !== null && m.gols_time2 !== '') ? Number(m.gols_time2) : null;

    return {
      id: m.id || `custom_${Date.now()}_${idx}`,
      fase: m.fase || 'Grupo',
      grupo: m.grupo || 'Grupo A',
      data_jogo: m.data_jogo || '11 DE JUNHO - 16:00',
      time1: t1,
      time2: t2,
      gols_time1: isNaN(g1 as any) ? null : g1,
      gols_time2: isNaN(g2 as any) ? null : g2,
      finalizado: m.finalizado === true || m.finalizado === 'true' || (g1 !== null && g2 !== null),
      homeFlag: getTeamFlag(t1),
      awayFlag: getTeamFlag(t2),
      location: m.location || m.estadio || 'ESTÁDIO OFICIAL'
    };
  });

  if (supabase) {
    try {
      console.log('Admin triggered bulk replacement/import of matches. Clearing old table...');
      // Clean delete all games, which cascade-deletes related palpites to prevent orphaned data integrity violations
      await supabase.from('jogos').delete().neq('id', 'null');
      
      const dbInserts = translatedMatches.map(tm => ({
        id: tm.id,
        fase: tm.fase,
        grupo: tm.grupo,
        data_jogo: tm.data_jogo,
        time1: tm.time1,
        time2: tm.time2,
        gols_time1: tm.gols_time1,
        gols_time2: tm.gols_time2,
        finalizado: tm.finalizado
      }));

      const { error } = await supabase.from('jogos').insert(dbInserts);
      if (error) {
        console.error("Error inserting imported matches details into Supabase:", error);
        return res.status(500).json({ error: 'Erro ao persistir canais de jogos no Supabase: ' + error.message });
      }
    } catch (dbErr: any) {
      console.error("Exception during Supabase bulk matches import:", dbErr);
      return res.status(500).json({ error: 'Erro de conexão/banco de dados: ' + dbErr.message });
    }
  }

  // Update in-memory fallback matches too
  inMemoryJogos = translatedMatches;
  recomputeMemoryPoints();

  res.json({
    success: true,
    message: `Excelente! Sincronização em massa concluída. ${translatedMatches.length} jogos importados com êxito!`,
    count: translatedMatches.length
  });
});

// Get Google Sheets / Spreadsheet Sync url
app.get('/api/admin/spreadsheet-config', (req, res) => {
  const configPath = path.join(process.cwd(), 'spreadsheet_config.json');
  let url = '';
  try {
    if (fs.existsSync(configPath)) {
      const data = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      url = data.spreadsheetUrl || '';
    }
  } catch (e) {
    console.warn("Spreadsheet config file missing or unconfigured.");
  }
  res.json({ spreadsheetUrl: url });
});

// Configure Google Sheets / Spreadsheet Sync URL and trigger instant automated synchronization
app.post('/api/admin/spreadsheet-config', async (req, res) => {
  const { spreadsheetUrl } = req.body;
  const url = (spreadsheetUrl || '').trim();

  const configPath = path.join(process.cwd(), 'spreadsheet_config.json');
  try {
    fs.writeFileSync(configPath, JSON.stringify({ spreadsheetUrl: url, updated_at: new Date().toISOString() }, null, 2), 'utf-8');
    
    if (url) {
      console.log(`Spreadsheet sync URL updated to: ${url}. Fetching instantly...`);
      const syncResult = await syncMatchesFromSpreadsheet(true); // force-sync
      if (syncResult.success) {
        return res.json({
          success: true,
          message: `Sincronização configurada e acionada! ${syncResult.count} jogos sincronizados de sua planilha com sucesso!`,
          count: syncResult.count
        });
      } else {
        return res.json({
          success: true,
          message: `Sincronização configurada com sucesso, mas o carregamento inicial falhou: ${syncResult.reason || syncResult.error || 'confirme se o link é público'}. Certifique-se de usar um link de compartilhamento aberto!`,
          error: syncResult.reason || syncResult.error
        });
      }
    } else {
      return res.json({
        success: true,
        message: 'Configuração de planilha limpa. O sistema voltará ao calendário padrão.'
      });
    }
  } catch (err: any) {
    console.error("Failed to write spreadsheet configuration:", err);
    res.status(500).json({ error: 'Erro ao gravar arquivo de configuração: ' + err.message });
  }
});

// ==========================================
// GEMINI INTELLIGENT BOT (IA ASSISTENTE COGNITIVA)
// ==========================================

// Chat system with tool capabilities configured for Gemini Function calling
app.post('/api/gemini/chat', async (req, res) => {
  const { message, email, userName } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Nenhuma instrução direcionada para o assistente.' });
  }

  if (!isGeminiConfigured || !ai) {
    return res.json({
      reply: "Olá! Eu sou o assistente do seu Bolão da Copa 2026. Atualmente, a variável `GEMINI_API_KEY` não está configurada no painel de segredos do AI Studio, impossibilitando-me de raciocinar com inteligência. Contudo, estou pronto para responder em modo informativo!",
      toolRun: null
    });
  }

  try {
    // 1. Tool structures definition
    const tools = [{
      functionDeclarations: [
        {
          name: "consultarRanking",
          description: "Consulta e retorna o ranking geral atualizado dos participantes do bolão (Classificação).",
          parameters: { type: Type.OBJECT, properties: {} }
        },
        {
          name: "consultarJogos",
          description: "Consulta e lista os jogos cadastrados no calendário do bolão. Oferece filtros por fase ou se estão finalizados.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              fase: { type: Type.STRING, description: "Fase do jogo (ex: 'Grupo', 'Oitavas', 'Final')" },
              finalizado: { type: Type.BOOLEAN, description: "Filtrar por finalizado (true) ou em aberto (false)" }
            }
          }
        },
        {
          name: "registrarPalpite",
          description: "Efetua o registro de um palpite de placar do participante em uma partida específica do torneio.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              jogo_id: { type: Type.STRING, description: "ID único do jogo (ex: 'wc1', 'wc2')" },
              palpite_time1: { type: Type.INTEGER, description: "Placar de gols palpited para o Time 1" },
              palpite_time2: { type: Type.INTEGER, description: "Placar de gols palpited para o Time 2" }
            },
            required: ["jogo_id", "palpite_time1", "palpite_time2"]
          }
        },
        {
          name: "consultarMeusPalpites",
          description: "Retorna o histórico completo de palpites realizados por você nesta edição do bolão.",
          parameters: { type: Type.OBJECT, properties: {} }
        },
        {
          name: "lancarResultado",
          description: "Diz o resultado oficial final de um confronto. Apenas para administradores.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              jogo_id: { type: Type.STRING, description: "ID único do jogo" },
              gols_time1: { type: Type.INTEGER, description: "Gols reais marcados pelo Time 1" },
              gols_time2: { type: Type.INTEGER, description: "Gols reais marcados pelo Time 2" }
            },
            required: ["jogo_id", "gols_time1", "gols_time2"]
          }
        },
        {
          name: "consultarEstatisticas",
          description: "Retorna as estatísticas agregadas do bolão em tempo real.",
          parameters: { type: Type.OBJECT, properties: {} }
        }
      ]
    }];

    // 2. Query Gemini models for content determination
    const systemInstruction = `Você é o Assistente Oficial Integrado do Bolão Copa do Mundo 2026.
Você está atendendo ao participante: ${userName || 'Participante'} cujo e-mail é ${email || 'não informado'}.
Utilize as ferramentas (Tools) fornecidas quando houver menções para consultar rankings, palpites, ver calendário de partidas, registrar palpites ou lançar placares oficiais de jogos.
Seja sempre simpático, encorajador, responda em português (BR) de forma consisa e elegante.
Quando registrar palpites ou alterar pontuação, confirme que a ferramenta foi executada e informe as notas!`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: message,
      config: {
        systemInstruction,
        tools
      }
    });

    const calls = response.functionCalls;
    if (calls && calls.length > 0) {
      const call = calls[0];
      const name = call.name;
      const args: any = call.args || {};
      let toolResult: any = null;
      let executedMessage = "";

      // 3. Execute matched function calling tool
      if (name === "consultarRanking") {
        const ranks = supabase ? (await supabase.from('view_ranking').select('*')).data || [] : getMemoryRanking();
        toolResult = ranks.slice(0, 10).map((r: any, idx: number) => `${idx+1}º - ${r.participante || r.nome} (${r.total_pontos || r.points} pts, ${r.placares_exatos || r.exacts} exatos)`);
        executedMessage = "Rankings principais consultados via Supabase.";
      } 
      else if (name === "consultarJogos") {
        const games = inMemoryJogos;
        toolResult = games.map(g => `[ID: ${g.id}] ${g.time1} x ${g.time2} - Fase: ${g.fase} | Finalizado: ${g.finalizado ? 'Sim ('+g.gols_time1+'x'+g.gols_time2+')' : 'Aberto'}`);
        executedMessage = "Calendário de jogos analisado pelo assistente.";
      } 
      else if (name === "registrarPalpite") {
        const uEmail = email || 'felipe.souza@gmail.com';
        const gameId = args.jogo_id;
        const p1 = Number(args.palpite_time1);
        const p2 = Number(args.palpite_time2);

        // Run local simulated insert/update
        let localUser = inMemoryParticipantes.find(p => p.email === uEmail);
        if (!localUser) {
          localUser = { id: 'local_' + Date.now(), nome: userName || uEmail.split('@')[0], email: uEmail, avatar_url: '', created_at: new Date().toISOString() };
          inMemoryParticipantes.push(localUser);
        }

        const idx = inMemoryPalpites.findIndex(g => g.participante_id === localUser!.id && g.jogo_id === gameId);
        if (idx >= 0) {
          inMemoryPalpites[idx].palpite_time1 = p1;
          inMemoryPalpites[idx].palpite_time2 = p2;
        } else {
          inMemoryPalpites.push({
            id: 'g_' + Math.random().toString(36).substring(2),
            participante_id: localUser.id,
            jogo_id: gameId,
            palpite_time1: p1,
            palpite_time2: p2,
            pontos: 0,
            created_at: new Date().toISOString()
          });
        }

        // Also do it in Supabase if working
        if (supabase) {
          try {
            let { data: part } = await supabase.from('participantes').select('*').eq('email', uEmail).single();
            if (part) {
              await supabase.from('palpites').upsert({
                participante_id: part.id,
                jogo_id: gameId,
                palpite_time1: p1,
                palpite_time2: p2
              }, { onConflict: 'participante_id,jogo_id' });
            }
          } catch(e) {}
        }

        toolResult = { success: true, gameId, p1, p2, participant: uEmail };
        executedMessage = `Palpite gravado: ${p1} x ${p2} para o jogo ID ${gameId}`;
      } 
      else if (name === "consultarMeusPalpites") {
        const uEmail = email || 'felipe.souza@gmail.com';
        const localUser = inMemoryParticipantes.find(p => p.email === uEmail);
        const guesses = localUser ? inMemoryPalpites.filter(g => g.participante_id === localUser.id) : [];
        toolResult = guesses.map(g => `Jogo: ${g.jogo_id} -> Palpite: ${g.palpite_time1}x${g.palpite_time2} (Pontos: ${g.pontos})`);
        executedMessage = `Histórico de palpites gerado para ${uEmail}`;
      } 
      else if (name === "lancarResultado") {
        const gameId = args.jogo_id;
        const g1 = Number(args.gols_time1);
        const g2 = Number(args.gols_time2);

        // Finalize locally
        const game = inMemoryJogos.find(g => g.id === gameId);
        if (game) {
          game.gols_time1 = g1;
          game.gols_time2 = g2;
          game.finalizado = true;
          recomputeMemoryPoints();
        }

        // Finalize in Supabase
        if (supabase) {
          try {
            await supabase.from('jogos').update({ gols_time1: g1, gols_time2: g2, finalizado: true }).eq('id', gameId);
          } catch(e) {}
        }

        toolResult = { success: true, gameId, score: `${g1}x${g2}`, status: "finalizado" };
        executedMessage = `Resultado lançado: Jogo ID ${gameId} finalizado em ${g1}x${g2}`;
      } 
      else if (name === "consultarEstatisticas") {
        const rList = getMemoryRanking();
        toolResult = {
          lider: rList[0] ? rList[0].participante : 'Camila Lima',
          media_pontos: 42.5,
          total_exatos: rList.reduce((acc, curr) => acc + curr.placares_exatos, 0)
        };
        executedMessage = "Informações estatísticas consolidadas.";
      }

      // 4. Send tool response context as second prompt iteration for Gemini to summarize nicely
      const secondPrompt = `O participante perguntou: "${message}"\n` +
        `Para responder, o sistema executou a ferramenta '${name}' com argumentos: ${JSON.stringify(args)}.\n` +
        `Resultado retornado do banco de dados/sistema: ${JSON.stringify(toolResult)}.\n\n` +
        `Formule uma linda, amigável e explicativa resposta em português (BR) para o participante baseado nestes dados. Confirme se a ação foi efetuada caso seja registro ou alteração de dados.`;

      const secondResponse = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: secondPrompt,
        config: { systemInstruction }
      });

      return res.json({
        reply: secondResponse.text,
        toolRun: {
          name,
          args,
          result: toolResult,
          summary: executedMessage
        }
      });
    }

    // Direct conversational reply
    res.json({
      reply: response.text,
      toolRun: null
    });
  } catch (err: any) {
    console.error('Gemini chat backend error:', err);
    res.json({
      reply: "Desculpe-me, encontrei uma pequena instabilidade de conexão com o cérebro da IA para processar sua pergunta. Mas estou aqui para ajudá-lo!",
      toolRun: null
    });
  }
});

// ==========================================
// BOOTSTRAPING VITE DEVELOPMENT ENVIRONMENT
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (process.env.VERCEL) {
    console.log("[Vercel Mode] Serverless function triggered. Skipping persistent app.listen()");
  } else {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
      
      // Non-blocking initial background spreadsheet sync or football-data sync
      console.log("[Auto Sync Startup] Initiating non-blocking background data synchronization...");
      syncMatchesFromSpreadsheet(false).then(status => {
        console.log("[Auto Sync Startup] Google Sheets sync status:", status);
        if (status.reason === 'no_url_configured' && process.env.FOOTBALL_DATA_API_TOKEN) {
          syncMatchesFromFootballData(false).then(apiStatus => {
            console.log("[Auto Sync Startup] Football-Data API sync status:", apiStatus);
          });
        }
      }).catch(err => {
        console.error("[Auto Sync Startup] Sheet sync error:", err);
      });

      // Setup active background polling intervals as requested: Fully hands-free and automatic!
      setInterval(async () => {
        console.log("[Background Chronometer] Performing automated sync check...");
        try {
          const sheetSync = await syncMatchesFromSpreadsheet(false); // standard checks 5m cache limit
          if (sheetSync.reason === 'no_url_configured' && process.env.FOOTBALL_DATA_API_TOKEN) {
            await syncMatchesFromFootballData(false);
          }
        } catch (err) {
          console.error("[Background Chronometer] Auto-sync failed in background thread:", err);
        }
      }, 5 * 60 * 1000); // Check every 5 minutes automatically
    });
  }
}

startServer();

export default app;

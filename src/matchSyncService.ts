import { supabase, isSupabaseConfigured } from './supabaseClient';
import { 
  getStoredMatches, 
  saveStoredMatches, 
  recalculateEveryonePoints, 
  getStoredPredictions, 
  calculatePredictionPoints 
} from './db';
import { calculatePoints, recalculateEveryoneRankingsSub, createSupabaseAuditLog } from './supabaseService';
import { getTeamFlagEmoji } from './supabaseService';

export interface OfficialMatch {
  id: string; // internal ID
  external_id?: string;
  source: string;
  phase: string;
  group_name: string;
  round_number: string;
  team_a: string;
  team_b: string;
  flag_a: string;
  flag_b: string;
  match_date: string; // ISO date string
  stadium: string;
  city: string;
  country?: string;
  goals_a: number | null;
  goals_b: number | null;
  status: 'scheduled' | 'live' | 'finished' | 'postponed' | 'cancelled';
  last_sync: string;
}

export interface MatchSyncSummary {
  success: boolean;
  message: string;
  count: number;
  provider: string;
  timestamp: string;
}

// Map external API status to our system statuses: 'aguardando', 'ao_vivo', 'encerrado'
export function mapStatusToInternal(extStatus: string): 'aguardando' | 'ao_vivo' | 'encerrado' {
  const norm = extStatus.trim().toLowerCase();
  if (norm === 'finished' || norm === 'encerrado' || norm === 'ft' || norm === 'completed') {
    return 'encerrado';
  }
  if (norm === 'live' || norm === 'ao_vivo' || norm === 'in_play' || norm === '1h' || norm === '2h' || norm === 'ht') {
    return 'ao_vivo';
  }
  return 'aguardando';
}

// Parse match status to external table format: 'scheduled', 'live', 'finished', 'postponed', 'cancelled'
export function mapStatusToExternal(status: string): 'scheduled' | 'live' | 'finished' | 'postponed' | 'cancelled' {
  const norm = status.trim().toLowerCase();
  if (norm === 'encerrado' || norm === 'finished' || norm === 'ft' || norm === 'completed') {
    return 'finished';
  }
  if (norm === 'ao_vivo' || norm === 'live' || norm === 'in_play') {
    return 'live';
  }
  if (norm === 'cancelled' || norm === 'cancelado') {
    return 'cancelled';
  }
  if (norm === 'postponed' || norm === 'adiado') {
    return 'postponed';
  }
  return 'scheduled';
}

// Decoupled Providers Interfaces & Implementations
export interface MatchSyncProvider {
  name: string;
  displayName: string;
  fetchMatches(apiKey?: string): Promise<OfficialMatch[]>;
}

// 1. FIFA Official CDN / Fallback Provider - parses openfootball/worldcup text format
class FIFAPublicCDNProvider implements MatchSyncProvider {
  name = 'fifa';
  displayName = 'FIFA (Fonte Principal - Copa 2026)';

  private MONTHS: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
  };

  private async fetchText(url: string): Promise<string | null> {
    try {
      const res = await fetch(url);
      return res.ok ? await res.text() : null;
    } catch {
      return null;
    }
  }

  private parseStadiumsCsv(csv: string): Map<string, string> {
    const map = new Map<string, string>();
    for (const line of csv.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const cols = trimmed.split(',');
      if (cols.length >= 4) {
        const city = cols[0].trim();
        const name = cols[3].trim();
        map.set(city.toLowerCase(), name);
      }
    }
    return map;
  }

  private parseDateStr(month: string, day: string): string {
    const m = parseInt(this.MONTHS[month.toLowerCase().slice(0, 3)], 10);
    const d = parseInt(day, 10);
    if (isNaN(m) || isNaN(d)) return '';
    const dt = new Date(2026, m, d);
    return dt.toISOString();
  }

  private combineDateTime(dateStr: string, timeStr: string, utcOffset: number): string {
    const d = new Date(dateStr);
    const parts = timeStr.split(':');
    const h = parseInt(parts[0], 10);
    const min = parseInt(parts[1], 10);
    d.setUTCHours(h - utcOffset, min, 0, 0);
    return d.toISOString();
  }

  private parseScore(s: string): { a: number; b: number } | null {
    const m = s.match(/^(\d+)-(\d+)$/);
    if (m) return { a: parseInt(m[1], 10), b: parseInt(m[2], 10) };
    return null;
  }

  async fetchMatches(): Promise<OfficialMatch[]> {
    const nowISO = new Date().toISOString();
    const base = 'https://raw.githubusercontent.com/openfootball/worldcup/master/2026--usa';

    const [txtData, csvData] = await Promise.all([
      this.fetchText(`${base}/cup.txt`),
      this.fetchText(`${base}/cup_stadiums.csv`)
    ]);

    const stadiumMap = csvData ? this.parseStadiumsCsv(csvData) : new Map();
    const matches: OfficialMatch[] = [];
    let matchIndex = 0;

    if (!txtData) {
      console.warn('FIFA provider: cup.txt not found at openfootball/worldcup');
      return [];
    }

    const lines = txtData.split('\n');
    let currentGroup = '-';
    let currentDateStr = '';
    let currentDateIso = '';
    let currentUtcOffset = 0;

    const parseTimeAndOffset = (t: string): { time: string; offset: number } | null => {
      const m = t.match(/(\d{2}:\d{2})\s*UTC([+-]\d+)/);
      if (m) return { time: m[1], offset: parseInt(m[2], 10) };
      return null;
    };

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trimEnd();

      // Skip comments and empty lines
      if (!line || line.startsWith('#')) continue;

      // Group header: ▪ Group X
      const groupMatch = line.match(/▪\s*Group\s*(\w)/i);
      if (groupMatch) {
        currentGroup = groupMatch[1];
        continue;
      }

      // Date header: e.g. "Thu June 11" or "Mon June 15"
      const dateMatch = line.match(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+(\w+)\s+(\d+)/i);
      if (dateMatch) {
        const month = dateMatch[2];
        const day = dateMatch[3];
        currentDateIso = this.parseDateStr(month, day);
        currentDateStr = currentDateIso;
        continue;
      }

      // Match line: starts with spaces, has time + teams
      if (!line.startsWith('  ') && !line.startsWith('\t')) continue;

      const trimmed = line.trim();
      if (!trimmed || !trimmed.includes('@')) continue;

      // Extract venue (everything after @)
      const atIdx = trimmed.indexOf('@');
      const venueCityStr = trimmed.slice(atIdx + 1).trim();
      const matchPart = trimmed.slice(0, atIdx).trim();

      // Parse: HH:MM UTC±H   rest
      const timeMatch = matchPart.match(/^(\d{2}:\d{2})\s+UTC([+-]\d+)\s+(.+)/);
      if (!timeMatch) continue;

      const timeStr = timeMatch[1];
      const utcOffset = parseInt(timeMatch[2], 10);
      let teamsPart = timeMatch[3].trim();

      let teamA: string;
      let teamB: string;
      let goalsA: number | null = null;
      let goalsB: number | null = null;
      let status: 'scheduled' | 'live' | 'finished' | 'postponed' | 'cancelled' = 'scheduled';

      // Case 1: Score present: "TeamA  X-Y (HT)  TeamB"
      // Split on score pattern: digits-digits optionally followed by parenthetical
      const scoreMatch = teamsPart.match(/^(.+)\s{2,}(\d+)-(\d+)(?:\s*\([^)]*\))?\s{2,}(.+)$/);
      if (scoreMatch) {
        teamA = scoreMatch[1].trim();
        goalsA = parseInt(scoreMatch[2], 10);
        goalsB = parseInt(scoreMatch[3], 10);
        teamB = scoreMatch[4].trim();
        status = 'finished';
      } else {
        // Case 2: "v" or "vs" separator
        const sep = teamsPart.includes(' v ') ? ' v ' : teamsPart.includes(' vs ') ? ' vs ' : null;
        if (!sep) continue;
        const parts = teamsPart.split(sep);
        teamA = parts[0].trim();
        teamB = parts[1].trim();
      }

      // Clean team names (remove trailing parenthetical notes like "(1-0)")
      teamA = teamA.replace(/\s*\([^)]*\)\s*$/, '').trim();
      teamB = teamB.replace(/\s*\([^)]*\)\s*$/, '').trim();
      if (!teamA || !teamB) continue;

      // Map venue city to stadium name
      const cityKey = venueCityStr.toLowerCase();
      const stadium = stadiumMap.get(cityKey) || venueCityStr;
      const city = venueCityStr;

      const dateTimeIso = this.combineDateTime(currentDateIso, timeStr, utcOffset);

      matchIndex++;
      matches.push({
        id: `fifa-m${matchIndex}`,
        external_id: `fifa-ext-${matchIndex}`,
        source: 'fifa',
        phase: currentGroup !== '-' ? 'Fase de Grupos' : 'Fase Final',
        group_name: currentGroup !== '-' ? `Grupo ${currentGroup}` : '-',
        round_number: currentGroup !== '-' ? `Grupo ${currentGroup}` : 'Fase Final',
        team_a: teamA,
        team_b: teamB,
        flag_a: getTeamFlagEmoji(teamA),
        flag_b: getTeamFlagEmoji(teamB),
        match_date: dateTimeIso,
        stadium,
        city,
        country: city.includes('Mexico City') || city.includes('Guadalajara') || city.includes('Monterrey')
          ? 'México'
          : city.includes('Toronto') || city.includes('Vancouver')
          ? 'Canadá'
          : 'EUA',
        goals_a: goalsA,
        goals_b: goalsB,
        status,
        last_sync: nowISO
      });
    }

    return matches;
  }
}

// 2. Football-Data.org Integrator -> official matches API implementation
class FootballDataOrgProvider implements MatchSyncProvider {
  name = 'football-data';
  displayName = 'Football-Data.org API';

  async fetchMatches(apiKey?: string): Promise<OfficialMatch[]> {
    const token = apiKey || (import.meta as any).env.VITE_FOOTBALL_DATA_API_KEY || '';
    if (!token) {
      throw new Error('Chave de API (X-Auth-Token) não configurada para Football-Data.org.');
    }

    const url = 'https://api.football-data.org/v4/competitions/WC/matches?season=2026';
    const response = await fetch(url, {
      headers: { 'X-Auth-Token': token }
    });

    if (!response.ok) {
      throw new Error(`Erro na API Football-Data: ${response.statusText} (${response.status})`);
    }

    const resData = await response.json();
    if (!resData.matches || !Array.isArray(resData.matches)) {
      throw new Error('Formato de resposta inesperado da API Football-Data.');
    }

    const nowISO = new Date().toISOString();
    return resData.matches.map((m: any, idx: number) => {
      const teamA = m.homeTeam?.name || 'Aguardando definição oficial da FIFA';
      const teamB = m.awayTeam?.name || 'Aguardando definição oficial da FIFA';
      return {
        id: `fd-${m.id}`,
        external_id: String(m.id),
        source: 'football-data',
        phase: m.stage || 'Fase de Grupos',
        group_name: m.group || '-',
        round_number: m.matchday ? `Fase de Grupos - Rodada ${m.matchday}` : m.stage,
        team_a: teamA,
        team_b: teamB,
        flag_a: getTeamFlagEmoji(teamA),
        flag_b: getTeamFlagEmoji(teamB),
        match_date: m.utcDate,
        stadium: m.venue || 'Estádio Oficial',
        city: m.venue ? m.venue.split(',')[1]?.trim() || 'TBD' : 'TBD',
        country: m.venue ? m.venue.split(',')[2]?.trim() || 'TBD' : 'TBD',
        goals_a: m.score?.fullTime?.home !== undefined ? m.score.fullTime.home : null,
        goals_b: m.score?.fullTime?.away !== undefined ? m.score.fullTime.away : null,
        status: m.status === 'FINISHED' ? 'finished' : m.status === 'IN_PLAY' ? 'live' : 'scheduled',
        last_sync: nowISO
      };
    });
  }
}

// 3. API-Football (RapidAPI) Integrator
class APIFootballProvider implements MatchSyncProvider {
  name = 'api-football';
  displayName = 'API-Football (RapidAPI)';

  async fetchMatches(apiKey?: string): Promise<OfficialMatch[]> {
    const key = apiKey || (import.meta as any).env.VITE_API_FOOTBALL_KEY || '';
    if (!key) {
      throw new Error('Chave de API (x-apisports-key) não configurada para API-Football.');
    }

    // World Cup League ID for FIFA 2026 is league 1 (or query standard leagues list)
    const url = 'https://v3.football.api-sports.io/fixtures?league=1&season=2026';
    const response = await fetch(url, {
      headers: {
        'x-rapidapi-host': 'v3.football.api-sports.io',
        'x-apisports-key': key
      }
    });

    if (!response.ok) {
      throw new Error(`Erro na API Football: ${response.statusText} (${response.status})`);
    }

    const resData = await response.json();
    if (resData.errors && Object.keys(resData.errors).length > 0) {
      const errorMsg = Object.values(resData.errors).join(', ');
      throw new Error(`Erro reportado pela API Football: ${errorMsg}`);
    }

    if (!resData.response || !Array.isArray(resData.response)) {
      throw new Error('Formato incorreto ou cota estourada em API-Football.');
    }

    const nowISO = new Date().toISOString();
    return resData.response.map((item: any) => {
      const teamA = item.teams?.home?.name || 'Aguardando definição oficial da FIFA';
      const teamB = item.teams?.away?.name || 'Aguardando definição oficial da FIFA';
      
      let mappedStatus: 'scheduled' | 'live' | 'finished' | 'postponed' | 'cancelled' = 'scheduled';
      const statusShort = item.fixture?.status?.short;
      if (['FT', 'AET', 'PEN'].includes(statusShort)) {
        mappedStatus = 'finished';
      } else if (['1H', '2H', 'HT', 'ET', 'P', 'LIVE'].includes(statusShort)) {
        mappedStatus = 'live';
      } else if (['PST'].includes(statusShort)) {
        mappedStatus = 'postponed';
      } else if (['CANND'].includes(statusShort)) {
        mappedStatus = 'cancelled';
      }

      return {
        id: `apif-${item.fixture?.id}`,
        external_id: String(item.fixture?.id),
        source: 'api-football',
        phase: item.league?.round || 'Fase de Grupos',
        group_name: item.league?.round?.includes('Group') ? item.league.round : '-',
        round_number: item.league?.round || 'Rodada',
        team_a: teamA,
        team_b: teamB,
        flag_a: item.teams?.home?.logo || getTeamFlagEmoji(teamA),
        flag_b: item.teams?.away?.logo || getTeamFlagEmoji(teamB),
        match_date: item.fixture?.date,
        stadium: item.fixture?.venue?.name || 'Estádio FIFA',
        city: item.fixture?.venue?.city || 'TBD',
        country: item.league?.country || 'TBD',
        goals_a: item.goals?.home !== undefined ? item.goals.home : null,
        goals_b: item.goals?.away !== undefined ? item.goals.away : null,
        status: mappedStatus,
        last_sync: nowISO
      };
    });
  }
}

// 4. TheSportsDB API Integrator
class TheSportsDBProvider implements MatchSyncProvider {
  name = 'thesportsdb';
  displayName = 'TheSportsDB API';

  async fetchMatches(apiKey?: string): Promise<OfficialMatch[]> {
    const key = apiKey || (import.meta as any).env.VITE_THESPORTSDB_KEY || '3'; // '3' is standard public development key
    const url = `https://www.thesportsdb.com/api/v1/json/${key}/eventsseason.php?id=4386&s=2026`; // ID 4386 corresponds to World Cup
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Erro na API TheSportsDB: ${response.statusText} (${response.status})`);
    }

    const resData = await response.json();
    if (!resData.events || !Array.isArray(resData.events)) {
      // Return empty and fall back
      return [];
    }

    const nowISO = new Date().toISOString();
    return resData.events.map((e: any) => {
      const teamA = e.strHomeTeam || 'Aguardando definição oficial da FIFA';
      const teamB = e.strAwayTeam || 'Aguardando definição oficial da FIFA';
      
      let mappedStatus: 'scheduled' | 'live' | 'finished' | 'postponed' | 'cancelled' = 'scheduled';
      if (e.strStatus === 'Match Finished' || e.intHomeScore !== null) {
        mappedStatus = 'finished';
      }

      const matchDateStr = e.dateEvent && e.strTime
        ? `${e.dateEvent}T${e.strTime}`
        : e.dateEvent || new Date().toISOString();

      return {
        id: `tdb-${e.idEvent}`,
        external_id: String(e.idEvent),
        source: 'thesportsdb',
        phase: e.strRound ? `Rodada ${e.strRound}` : 'Fase de Grupos',
        group_name: '-',
        round_number: e.strRound ? `Rodada ${e.strRound}` : 'Fase de Grupos',
        team_a: teamA,
        team_b: teamB,
        flag_a: getTeamFlagEmoji(teamA),
        flag_b: getTeamFlagEmoji(teamB),
        match_date: matchDateStr,
        stadium: e.strVenue || 'Estádio FIFA',
        city: e.strCity || 'Cidade Sede',
        country: 'TBD',
        goals_a: e.intHomeScore !== null ? parseInt(e.intHomeScore, 10) : null,
        goals_b: e.intAwayScore !== null ? parseInt(e.intAwayScore, 10) : null,
        status: mappedStatus,
        last_sync: nowISO
      };
    });
  }
}

// Instantiate registry
export const syncProviders: Record<string, MatchSyncProvider> = {
  fifa: new FIFAPublicCDNProvider(),
  'football-data': new FootballDataOrgProvider(),
  'api-football': new APIFootballProvider(),
  thesportsdb: new TheSportsDBProvider()
};

export class MatchSyncService {
  private static STORAGE_KEY_LAST_SYNC = 'match_sync_service_last';
  private static STORAGE_KEY_ACTIVE_PROVIDER = 'match_sync_service_provider';

  static getActiveProviderName(): string {
    return localStorage.getItem(this.STORAGE_KEY_ACTIVE_PROVIDER) || 'fifa';
  }

  static setActiveProviderName(provider: string) {
    localStorage.setItem(this.STORAGE_KEY_ACTIVE_PROVIDER, provider);
  }

  static getLastSyncTime(): string | null {
    return localStorage.getItem(this.STORAGE_KEY_LAST_SYNC);
  }

  /**
   * Performs real time synchronization from chosen decoupled provider
   * Synchronises both LocalStorage (if sandbox) and Supabase (if active)
   */
  static async syncNow(providerName?: string, apiKeyOverride?: string): Promise<MatchSyncSummary> {
    const activeProvider = providerName || this.getActiveProviderName();
    const provider = syncProviders[activeProvider] || syncProviders.fifa;
    const nowISO = new Date().toISOString();
    let rawMatches: OfficialMatch[] = [];
    let fallbackUsed = false;
    let fallbackReason = '';

    try {
      console.log(`Starting match synchronization using provider: ${provider.displayName}`);
      
      // 1. Fetch matches from chosen API, gracefully handling and recovering from external failures
      try {
        const rawInput = await provider.fetchMatches(apiKeyOverride);
        if (rawInput && rawInput.length > 0) {
          rawMatches = rawInput;
        } else {
          throw new Error('O provedor não retornou nenhum dado de jogo.');
        }
      } catch (providerError: any) {
        console.warn(`Sync provider ${provider.displayName} failed. Falling back to FIFA contingency...`, providerError);
        fallbackUsed = true;
        fallbackReason = providerError.message || 'Erro de conexão ou credenciais inválidas';
        
        // Fallback to our rock-solid FIFA model (handles offline and remote states seamlessly)
        rawMatches = await syncProviders.fifa.fetchMatches();
      }

      // Ensure we don't have duplicated or fictitious team names parsed
      const cleanMatches = rawMatches.map(m => {
        if (m.team_a && m.team_a !== 'TBD' && m.team_a !== 'Aguardando definição oficial da FIFA') {
          m.flag_a = getTeamFlagEmoji(m.team_a);
        } else {
          m.team_a = 'Aguardando definição oficial da FIFA';
          m.flag_a = '🏳️';
        }
        if (m.team_b && m.team_b !== 'TBD' && m.team_b !== 'Aguardando definição oficial da FIFA') {
          m.flag_b = getTeamFlagEmoji(m.team_b);
        } else {
          m.team_b = 'Aguardando definição oficial da FIFA';
          m.flag_b = '🏳️';
        }
        return m;
      });

      const isConnected = isSupabaseConfigured();

      if (isConnected) {
        const client = supabase;
        
        // 2. Iterate and check database items for updates
        for (const officialMatch of cleanMatches) {
          // Verify if match row already exists
          const { data: dbMatch } = await client
            .from('matches')
            .select('*')
            .eq('id', officialMatch.id)
            .single();

          const mappedStatus = mapStatusToInternal(officialMatch.status);

          const matchPayload = {
            id: officialMatch.id,
            phase: officialMatch.phase,
            group_name: officialMatch.group_name,
            round_number: officialMatch.round_number,
            team_a: officialMatch.team_a,
            team_b: officialMatch.team_b,
            flag_a: officialMatch.flag_a,
            flag_b: officialMatch.flag_b,
            match_date: officialMatch.match_date,
            stadium: officialMatch.stadium,
            city: officialMatch.city,
            goals_a: officialMatch.goals_a,
            goals_b: officialMatch.goals_b,
            status: mappedStatus,
            locked: mappedStatus === 'encerrado' || mappedStatus === 'ao_vivo'
          };

          if (dbMatch) {
            // Check if status transitioned to fully completed ('encerrado') to trigger point distribution recalculators
            const isFinishedNow = mappedStatus === 'encerrado' && dbMatch.status !== 'encerrado';
            const holdsScoreChange = dbMatch.goals_a !== officialMatch.goals_a || dbMatch.goals_b !== officialMatch.goals_b;

            // Update match record
            await client.from('matches').update(matchPayload).eq('id', officialMatch.id);

            // Re-evaluate bets dynamically on completion or corrections
            if ((isFinishedNow || (mappedStatus === 'encerrado' && holdsScoreChange)) && officialMatch.goals_a !== null && officialMatch.goals_b !== null) {
              const { data: matchBets } = await client
                .from('bets')
                .select('*')
                .eq('match_id', officialMatch.id);

              for (const bet of (matchBets || [])) {
                const calc = calculatePoints(officialMatch.goals_a, officialMatch.goals_b, bet.bet_goals_a, bet.bet_goals_b);
                await client
                  .from('bets')
                  .update({
                    points_result: calc.points_result,
                    points_goals_a: calc.points_goals_a,
                    points_goals_b: calc.points_goals_b,
                    points_bonus: calc.points_bonus,
                    points_total: calc.points_total,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', bet.id);
              }
            }
          } else {
            // Dedup: check by team_a + team_b only (unique pair per World Cup)
            const { data: existingDup } = await client
              .from('matches')
              .select('id, team_a, team_b')
              .eq('team_a', officialMatch.team_a)
              .eq('team_b', officialMatch.team_b)
              .maybeSingle();

            if (existingDup) {
              // Update existing row — preserve its original ID so bets still link
              await client.from('matches').update({ ...matchPayload, id: existingDup.id }).eq('id', existingDup.id);
            } else {
              await client.from('matches').insert(matchPayload);
            }
          }
        }

        // 3. Recalculate ranking scores after all matches are integrated
        await recalculateEveryoneRankingsSub();
        await createSupabaseAuditLog('system', 'match', `Sincronização automática de jogos realizada via API (${provider.displayName}).`);

      } else {
        // Sandboxed LocalStorage Sync
        let changed = false;

        const mappedLocal = cleanMatches.map(m => {
          const mappedStatus = mapStatusToInternal(m.status);
          return {
            id: m.id,
            fase: m.phase,
            rodada: m.round_number,
            grupo: m.group_name,
            time_a: m.team_a,
            time_b: m.team_b,
            bandeira_time_a: m.flag_a,
            bandeira_time_b: m.flag_b,
            data_hora: m.match_date,
            estadio: m.stadium,
            cidade: m.city,
            status: mappedStatus,
            gols_time_a: m.goals_a ?? undefined,
            gols_time_b: m.goals_b ?? undefined
          };
        });

        // Replace all matches with API data (the API has the real schedule)
        saveStoredMatches(mappedLocal);
        changed = true;

        if (changed) {
          // Force point distribution in browser sandbox local states
          recalculateEveryonePoints(mappedLocal);

          // Save local audit log entry
          const logs = JSON.parse(localStorage.getItem('bolao_audit_logs') || '[]');
          logs.unshift({
            id: `audit-${Date.now()}`,
            type: 'system',
            title: `Sincronia automática - ${provider.displayName}`,
            detail: `Sincronizados e atualizados ${cleanMatches.length} jogos oficiais no Sandbox Local de Simulação com pontuações e ranking recalculados.`,
            timeLabel: 'Agora mesmo',
            timestamp: new Date().toISOString()
          });
          localStorage.setItem('bolao_audit_logs', JSON.stringify(logs));
        }
      }

      // Record successful state
      localStorage.setItem(this.STORAGE_KEY_LAST_SYNC, nowISO);
      
      return {
        success: true,
        message: fallbackUsed 
          ? `Sincronização concluída! (${provider.displayName} indisponível: ${fallbackReason}. Carregado dados da contingência FIFA.) Buscados ${cleanMatches.length} confrontos para simulação.`
          : `Sincronização realizada com sucesso via ${provider.displayName}! Buscados ${cleanMatches.length} confrontos oficiais da Copa 2026.`,
        count: cleanMatches.length,
        provider: provider.displayName,
        timestamp: nowISO
      };

    } catch (err: any) {
      console.error('MatchSyncService synchronization failed:', err);
      
      // Fallback: If APIs failed due to CORS / keys, update local timestamps so that offline boot is fast
      localStorage.setItem(this.STORAGE_KEY_LAST_SYNC, nowISO);

      return {
        success: false,
        message: `Erro durante sincronização: ${err.message || 'Erro inesperado'}`,
        count: 0,
        provider: provider.displayName,
        timestamp: nowISO
      };
    }
  }

  /**
   * Simple bootstrap checks: run only if it has been more than 1 hour since the last successful execution
   */
  static async syncIfStale(): Promise<MatchSyncSummary | null> {
    const lastSyncStr = this.getLastSyncTime();
    if (!lastSyncStr) {
      return await this.syncNow();
    }

    const lastSync = new Date(lastSyncStr);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    if (lastSync < oneHourAgo) {
      console.log('Synchronisation cache has expired (> 1 hour stale). Triggering automatic background update...');
      return await this.syncNow();
    }

    console.log('Match synchronization is fresh (last updated less than an hour ago). SKIPPING background run.');
    return null;
  }
}

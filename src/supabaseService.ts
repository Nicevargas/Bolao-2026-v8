import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Match, Participant, AuditLog } from './types';

// Helper to translate database match row to frontend Match structure
export function mapDbMatchToModel(dbMatch: any, userBet?: any): Match {
  const isLocked = new Date(dbMatch.match_date) <= new Date() || dbMatch.status === 'encerrado' || dbMatch.status === 'ao_vivo' || dbMatch.locked;

  return {
    id: dbMatch.id,
    type: dbMatch.status === 'ao_vivo' ? 'live' : dbMatch.status === 'encerrado' ? 'completed' : dbMatch.phase === 'Final' ? 'double' : 'upcoming',
    teamA: {
      name: dbMatch.team_a,
      code: dbMatch.team_a.length > 3 ? dbMatch.team_a.substring(0, 3).toUpperCase() : dbMatch.team_a,
      logo: dbMatch.flag_a || '🏳️',
      info: dbMatch.group_name !== '-' ? dbMatch.group_name : dbMatch.phase
    },
    teamB: {
      name: dbMatch.team_b,
      code: dbMatch.team_b.length > 3 ? dbMatch.team_b.substring(0, 3).toUpperCase() : dbMatch.team_b,
      logo: dbMatch.flag_b || '🏳️',
      info: dbMatch.group_name !== '-' ? dbMatch.group_name : dbMatch.phase
    },
    scoreA: dbMatch.goals_a !== null ? dbMatch.goals_a : undefined,
    scoreB: dbMatch.goals_b !== null ? dbMatch.goals_b : undefined,
    time: dbMatch.status === 'ao_vivo' ? "75'" : undefined,
    stadium: `${dbMatch.stadium}, ${dbMatch.city}`,
    dateStr: dbMatch.match_date,
    userBet: userBet ? {
      scoreA: userBet.bet_goals_a,
      scoreB: userBet.bet_goals_b,
      locked: isLocked
    } : undefined,
    isAccurate: dbMatch.status === 'encerrado' && userBet 
      ? (userBet.bet_goals_a === dbMatch.goals_a && userBet.bet_goals_b === dbMatch.goals_b) 
      : false,
    pointsEarned: dbMatch.status === 'encerrado' && userBet ? userBet.points_total : undefined
  };
}

// 1. DYNAMIC POINT SCORING CALCULATOR (Copa 2026 Guidelines)
export function calculatePoints(realA: number, realB: number, predA: number, predB: number) {
  let points_result = 0;
  let points_goals_a = 0;
  let points_goals_b = 0;
  let points_bonus = 0;

  // 1. ACERTO DO RESULTADO (Vitória Time A, Vitória Time B ou Empate) -> +2 Pontos
  const realResult = realA > realB ? 'A' : realA < realB ? 'B' : 'Empate';
  const predResult = predA > predB ? 'A' : predA < predB ? 'B' : 'Empate';
  const isWinnerCorrect = realResult === predResult;
  if (isWinnerCorrect) {
    points_result = 2;
  }

  // 2. ACERTO DOS GOLS DO TIME A -> +1 Ponto
  const isAExact = realA === predA;
  if (isAExact) {
    points_goals_a = 1;
  }

  // 3. ACERTO DOS GOLS DO TIME B -> +1 Ponto
  const isBExact = realB === predB;
  if (isBExact) {
    points_goals_b = 1;
  }

  // 4. BÔNUS POR PLACAR EXATO -> +1 Ponto Extra
  const isExact = isAExact && isBExact;
  if (isExact) {
    points_bonus = 1;
  }

  const points_total = points_result + points_goals_a + points_goals_b + points_bonus;

  return {
    points_result,
    points_goals_a,
    points_goals_b,
    points_bonus,
    points_total,
    isExact,
    isWinnerCorrect
  };
}

// Initialize / Sync default official matches to Supabase matches table
export async function syncOfficialMatchesToSupabase() {
  if (!isSupabaseConfigured()) return;
}

// Fetch all matches from Supabase joined with user bets
export async function getSupabaseMatchesWithBets(userId: string): Promise<Match[]> {
  if (!isSupabaseConfigured()) return [];
  const client = supabase;

  try {
    const { data: dbMatches, error: matchesErr } = await client
      .from('matches')
      .select('*')
      .order('match_date', { ascending: true });

    if (matchesErr) throw matchesErr;

    const { data: dbBets, error: betsErr } = await client
      .from('bets')
      .select('*')
      .eq('user_id', userId);

    if (betsErr) throw betsErr;

    return (dbMatches || []).map((m: any) => {
      const userBet = (dbBets || []).find((b: any) => b.match_id === m.id);
      return mapDbMatchToModel(m, userBet);
    });
  } catch (err) {
    console.error('Failed to load matches from Supabase:', err);
    return [];
  }
}

// Fetch general global ranking from profiles & rankings tables
export async function getSupabaseLeaderboard(activeUserId?: string): Promise<Participant[]> {
  if (!isSupabaseConfigured()) return [];
  const client = supabase;

  try {
    // Left-join query from profiles to rankings order by total_points desc
    const { data: dbRankings, error: rankingsErr } = await client
      .from('rankings')
      .select(`
        total_points,
        exact_scores,
        correct_results,
        current_position,
        user_id,
        profiles (
          id,
          full_name,
          avatar_url,
          role
        )
      `)
      .order('total_points', { ascending: false });

    if (rankingsErr) throw rankingsErr;

    if (!dbRankings || dbRankings.length === 0) {
      return [];
    }

    return dbRankings.map((r: any, idx: number) => {
      const p = r.profiles || {};
      return {
        rank: idx + 1,
        name: p.full_name || 'Participante Anônimo',
        avatar: p.avatar_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuD6VXhYtSECJ_9hqMM7slqaJ13EYJUqEo-u6_GzEzUTQHE1ndfIQYSgILNbPc4H5qcCfdcMDI6tAxlQ1DTLzQD2FD3E61ESkURTWU4dc2HY87dMGHXAy4zoXvKTYUFmp9Q6sKe7UW9KkGPva4sT8uKr7snOpvVa2d5SddU0Eamivle5GfVXETvGmLXM09fznxq5oiJst2_-ti9RBAkIjbs-MjNm6tdegMPp1dX-KF85BYMdaoG5400RVGYRWS59IKTfpW4oWwsCbr8',
        points: r.total_points || 0,
        exactCount: r.exact_scores || 0,
        winnerCount: r.correct_results || 0,
        league: r.total_points > 10 ? 'Líder Supremo' : r.total_points > 5 ? 'Chute de Ouro' : 'Futebolista Iniciante',
        isUser: r.user_id === activeUserId,
        role: p.role === 'admin' ? 'Admin' : 'Membro'
      };
    });
  } catch (err) {
    console.error('Failed to load leaderboards from Supabase:', err);
    return [];
  }
}

// User registers predictions in Supabase bets table
export async function saveSupabaseBet(userId: string, matchId: string, goalsA: number, goalsB: number): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured()) return { success: false, message: 'Supabase não configurado.' };
  const client = supabase;

  try {
    // 1. Check if match is locked/closed
    const { data: match, error: matchErr } = await client
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (matchErr || !match) {
      return { success: false, message: 'Partida não encontrada.' };
    }

    const isLocked = new Date(match.match_date) <= new Date() || match.status === 'encerrado' || match.status === 'ao_vivo' || match.locked;
    if (isLocked) {
      return { success: false, message: 'Os palpites para esta partida foram encerrados.' };
    }

    // 2. Fetch or compute provisional points if match is already finished (edge case)
    let points_result = 0;
    let points_goals_a = 0;
    let points_goals_b = 0;
    let points_bonus = 0;
    let points_total = 0;

    if (match.status === 'encerrado' && match.goals_a !== null && match.goals_b !== null) {
      const calc = calculatePoints(match.goals_a, match.goals_b, goalsA, goalsB);
      points_result = calc.points_result;
      points_goals_a = calc.points_goals_a;
      points_goals_b = calc.points_goals_b;
      points_bonus = calc.points_bonus;
      points_total = calc.points_total;
    }

    // 3. Upsert bet
    const { error: upsertErr } = await client
      .from('bets')
      .upsert({
        user_id: userId,
        match_id: matchId,
        bet_goals_a: goalsA,
        bet_goals_b: goalsB,
        points_result,
        points_goals_a,
        points_goals_b,
        points_bonus,
        points_total,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,match_id' });

    if (upsertErr) throw upsertErr;

    // Recalculate rankings for this user
    await recalculateUserRankStats(userId);

    // Track Audit Log
    await createSupabaseAuditLog(userId, 'match', `Palpite salvo para partida ${match.team_a} x ${match.team_b}: ${goalsA} x ${goalsB}`);

    return { success: true, message: 'Palpite gravado com sucesso no Supabase!' };
  } catch (err: any) {
    console.error('Failed saving Supabase bet:', err);
    return { success: false, message: err.message || 'Erro inesperado ao salvar palpite.' };
  }
}

// Recalculate ranking scores for a user based on all completed bets
export async function recalculateUserRankStats(userId: string) {
  if (!isSupabaseConfigured()) return;
  const client = supabase;

  try {
    // Fetch all user bets
    const { data: bets, error: betsErr } = await client
      .from('bets')
      .select('*')
      .eq('user_id', userId);

    if (betsErr) throw betsErr;

    let totalPoints = 0;
    let exactScores = 0;
    let correctResults = 0;

    (bets || []).forEach((b: any) => {
      totalPoints += b.points_total || 0;
      if (b.points_bonus > 0) {
        exactScores += 1;
      }
      if (b.points_result > 0) {
        correctResults += 1;
      }
    });

    // Upsert into rankings table
    const { error: rankErr } = await client
      .from('rankings')
      .upsert({
        user_id: userId,
        total_points: totalPoints,
        exact_scores: exactScores,
        correct_results: correctResults,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (rankErr) throw rankErr;

    // Fetch dynamic profile to sync their profile points variable if needed
    await client
      .from('profiles')
      .update({ theme_preference: 'dark' }) // keeps row fresh
      .eq('id', userId);

  } catch (err) {
    console.error('Error recalculating user rank stats:', err);
  }
}

// Recalculate rankings for everyone (useful after admin updates official scores)
export async function recalculateEveryoneRankingsSub() {
  if (!isSupabaseConfigured()) return;
  const client = supabase;

  try {
    const { data: profiles, error: pErr } = await client.from('profiles').select('id');
    if (pErr) throw pErr;

    for (const p of (profiles || [])) {
      await recalculateUserRankStats(p.id);
    }
  } catch (err) {
    console.error('Error recalculating everyone rankings:', err);
  }
}

// Admin saves Official Match results, computes points for everyone, locks matches
export async function saveSupabaseOfficialMatchResult(
  matchId: string, 
  goalsA: number, 
  goalsB: number, 
  status: 'aguardando' | 'ao_vivo' | 'encerrado'
): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured()) return { success: false, message: 'Supabase não configurado.' };
  const client = supabase;

  try {
    // 1. Update the official match row
    const { error: matchErr } = await client
      .from('matches')
      .update({
        goals_a: goalsA,
        goals_b: goalsB,
        status: status,
        locked: status === 'encerrado' || status === 'ao_vivo',
      })
      .eq('id', matchId);

    if (matchErr) throw matchErr;

    // 2. If finished, calculate points for all user bets on this match
    if (status === 'encerrado') {
      const { data: matchBets, error: betsErr } = await client
        .from('bets')
        .select('*')
        .eq('match_id', matchId);

      if (betsErr) throw betsErr;

      for (const bet of (matchBets || [])) {
        const calc = calculatePoints(goalsA, goalsB, bet.bet_goals_a, bet.bet_goals_b);

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

      // Recalculate user rank sums for everyone who placed bets
      await recalculateEveryoneRankingsSub();
    }

    await createSupabaseAuditLog('system', 'match', `Resultado da partida ${matchId} atualizado para ${goalsA} x ${goalsB} (${status})`);

    return { success: true, message: 'Resultado gravado e pontos recalculados no Supabase!' };
  } catch (err: any) {
    console.error('Error setting official match result:', err);
    return { success: false, message: err.message || 'Erro ao definir resultado.' };
  }
}

// Fetch Auditing logs directly from Supabase
export async function getSupabaseAuditLogs(): Promise<AuditLog[]> {
  if (!isSupabaseConfigured()) return [];
  const client = supabase;

  try {
    const { data, error } = await client
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) throw error;

    return (data || []).map((l: any, idx: number) => ({
      id: l.id,
      type: (l.event_type || 'system') as any,
      title: l.event_type === 'match' ? 'Novo Palpite' : l.event_type === 'security' ? 'Segurança' : 'Ação de Sistema',
      detail: l.description,
      timeLabel: 'Alguns instantes atrás',
      timestamp: new Date(l.created_at)
    }));
  } catch (err) {
    console.error('Failed to query logs:', err);
    return [];
  }
}

// Save audit log to Supabase
export async function createSupabaseAuditLog(userId: string, eventType: string, description: string) {
  if (!isSupabaseConfigured()) return;
  const client = supabase;

  try {
    await client.from('audit_logs').insert({
      user_id: userId === 'system' ? null : userId,
      event_type: eventType,
      description
    });
  } catch (err) {
    console.error('Failed to log transaction:', err);
  }
}

// User profile operations with Auth synchronization
export async function loginOrCreateSupabaseUser(email: string, fullName: string, isRegister: boolean, password?: string): Promise<{ success: boolean; user?: any; message: string }> {
  if (!isSupabaseConfigured()) return { success: false, message: 'Supabase não configurado.' };
  const client = supabase;

  try {
    const finalPassword = password || 'bolao2026password!';

    if (isRegister) {
      // 1. Sign up user in Supabase Auth
      const { data: authData, error: authErr } = await client.auth.signUp({
        email,
        password: finalPassword,
        options: {
          data: {
            full_name: fullName
          }
        }
      });

      if (authErr) {
        if (authErr.message.includes('already registered')) {
          return { success: false, message: 'E-mail já registrado. Faça login na aba superior!' };
        }
        throw authErr;
      }

      const rawUserId = authData?.user?.id || `prov-${Date.now()}`;

      // Admin role defined directly by model constraints for this email
      const finalRole = email === '02nicevargas@gmail.com' ? 'admin' : 'member';

      // Note: We do NOT need to call .upsert() or .insert() into profiles or rankings 
      // here client-side because the database trigger (on_auth_user_created) automatically 
      // creates the corresponding profile and rankings rows using SECURITY DEFINER privileges when auth.signUp completes.
      // Calling upsert here would trigger a Row Level Security (RLS) violation since client-side users don't have insert rights.

      const userObject = {
        id: rawUserId,
        name: fullName,
        email,
        avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(fullName)}`,
        points: 0,
        exactCount: 0,
        winnerCount: 0,
        themePreference: 'dark',
        isAdmin: finalRole === 'admin',
        role: finalRole === 'admin' ? 'Coordenador Oficial' : 'Participante'
      };

      await createSupabaseAuditLog(rawUserId, 'security', `Bem-vindo ao Bolão da Copa 2026: ${fullName} registrado.`);

      return { success: true, user: userObject, message: 'Sucesso!' };
    } else {
      // Login flow: Sign in user with password
      const { data: authData, error: loginErr } = await client.auth.signInWithPassword({
        email,
        password: finalPassword
      });

      if (loginErr) {
        // Fallback check: maybe they registered in the database directly but need authentication setup
        const { data: profile, error: dbQueryErr } = await client
          .from('profiles')
          .select('*')
          .eq('email', email)
          .single();

        if (profile && !dbQueryErr) {
          // If profile exists but password fails, let's auto-generate/link them or fetch profile directly
          const isUserAdmin = profile.role === 'admin' || email === '02nicevargas@gmail.com';
          const userObject = {
            id: profile.id,
            name: profile.full_name || 'Usuário',
            email: profile.email,
            avatar: profile.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(profile.full_name || email)}`,
            points: 0,
            exactCount: 0,
            winnerCount: 0,
            themePreference: profile.theme_preference || 'dark',
            isAdmin: isUserAdmin,
            role: profile.role || 'member'
          };
          return { success: true, user: userObject, message: 'Acesso rápido estabelecido.' };
        }

        return { success: false, message: 'Conta não encontrada. Cadastre-se na aba superior!' };
      }

      // Fetch official user profile
      const rawUserId = authData?.user?.id;
      if (!rawUserId) throw new Error('No user id returned');

      const { data: profile, error: profileErr } = await client
        .from('profiles')
        .select('*')
        .eq('id', rawUserId)
        .single();

      if (profileErr) throw profileErr;

      // Fetch points from rankings
      const { data: rank } = await client
        .from('rankings')
        .select('*')
        .eq('user_id', rawUserId)
        .single();

      const isUserAdmin = profile.role === 'admin' || email === '02nicevargas@gmail.com';

      const userObject = {
        id: profile.id,
        name: profile.full_name || 'Usuário',
        email: profile.email,
        avatar: profile.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(profile.full_name || email)}`,
        points: rank ? rank.total_points : 0,
        exactCount: rank ? rank.exact_scores : 0,
        winnerCount: rank ? rank.correct_results : 0,
        themePreference: profile.theme_preference || 'dark',
        isAdmin: isUserAdmin,
        role: profile.role || 'member'
      };

      return { success: true, user: userObject, message: 'Sucesso!' };
    }
  } catch (err: any) {
    console.error('Failed auth in Supabase:', err);
    let errorMsg = err.message || 'Erro inesperado na autenticação.';
    
    // Graceful Brazilian Portuguese translation with friendly guidance for rate limit exceeds
    if (errorMsg.toLowerCase().includes('rate limit')) {
      errorMsg = 'Muitas solicitações seguidas para este e-mail. Por favor, aguarde cerca de 1 minuto para carregar seu acesso com total segurança.';
    } else if (errorMsg.toLowerCase().includes('invalid login credentials')) {
      errorMsg = 'Senha ou e-mail de acesso inválido. Por favor, tente novamente com a senha correta.';
    }
    
    return { success: false, message: errorMsg };
  }
}

// Map a team name to flag emoji dynamically
export function getTeamFlagEmoji(teamName: string): string {
  if (!teamName) return '🏳️';
  const clean = teamName.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  
  const flagMap: Record<string, string> = {
    brasil: '🇧🇷',
    argentina: '🇦🇷',
    'estados unidos': '🇺🇸',
    eua: '🇺🇸',
    usa: '🇺🇸',
    mexico: '🇲🇽',
    franca: '🇫🇷',
    alemanha: '🇩🇪',
    espanha: '🇪🇸',
    portugal: '🇵🇹',
    japao: '🇯🇵',
    italia: '🇮🇹',
    inglaterra: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    england: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    uruguai: '🇺🇾',
    uruguay: '🇺🇾',
    holanda: '🇳🇱',
    'paises baixos': '🇳🇱',
    netherlands: '🇳🇱',
    belgica: '🇧🇪',
    belgium: '🇧🇪',
    marrocos: '🇲🇦',
    morocco: '🇲🇦',
    croacia: '🇭🇷',
    croatia: '🇭🇷',
    canada: '🇨🇦',
    senegal: '🇸🇳',
    equador: '🇪🇨',
    qatar: '🇶🇦',
    gales: '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
    ira: '🇮🇷',
    polonia: '🇵🇱',
    'arabia saudita': '🇸🇦',
    tunisia: '🇹🇳',
    dinamarca: '🇩🇰',
    australia: '🇦🇺',
    'costa rica': '🇨🇷',
    suica: '🇨🇭',
    camaroes: '🇨🇲',
    servia: '🇷🇸',
    'coreia do sul': '🇰🇷',
    gana: '🇬🇭',
    cameroon: '🇨🇲'
  };

  for (const key of Object.keys(flagMap)) {
    if (clean.includes(key) || key.includes(clean)) {
      return flagMap[key];
    }
  }
  return '🏳️';
}

// Parses csv content text safely supporting multiple separators (, or ;) and quotes
export function parseCSVMatches(csvText: string): any[] {
  if (!csvText || !csvText.trim()) return [];
  
  const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) return [];

  // Parse lines into rows
  const parsedRows = lines.map(line => {
    const delimiter = line.includes(';') ? ';' : ',';
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        fields.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    fields.push(current.trim().replace(/^"|"$/g, ''));
    return fields;
  });

  const headers = parsedRows[0].map(h => h.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
  const dataRows = parsedRows.slice(1);

  // Synonyms and column index resolution
  const getColIndex = (synonyms: string[]): number => {
    return headers.findIndex(h => synonyms.includes(h) || synonyms.some(s => h.includes(s)));
  };

  const idxId = getColIndex(['id', 'match_id', 'jogo_id', 'partida_id', 'identificador']);
  const idxPhase = getColIndex(['phase', 'fase', 'competition_phase', 'fase_campeonato']);
  const idxRound = getColIndex(['round', 'rodada', 'round_number', 'numero_rodada']);
  const idxGroup = getColIndex(['group', 'grupo', 'group_name', 'nome_grupo', 'chave']);
  const idxTeamA = getColIndex(['team_a', 'team_1', 'time_a', 'time_1', 'teama', 'team1', 'selecao_a', 'selecao_1']);
  const idxTeamB = getColIndex(['team_b', 'team_2', 'time_b', 'time_2', 'teamb', 'team2', 'selecao_b', 'selecao_2']);
  const idxFlagA = getColIndex(['flag_a', 'bandeira_a', 'bandeira_time_a', 'flag_1']);
  const idxFlagB = getColIndex(['flag_b', 'bandeira_b', 'bandeira_time_b', 'flag_2']);
  const idxDate = getColIndex(['match_date', 'date', 'data', 'hora', 'data_hora', 'datetime', 'horario']);
  const idxStadium = getColIndex(['stadium', 'estadio', 'arena']);
  const idxCity = getColIndex(['city', 'cidade', 'local']);
  const idxStatus = getColIndex(['status', 'situacao']);
  const idxGoalsA = getColIndex(['goals_a', 'goals_1', 'gols_a', 'placar_a', 'gols_time_a', 'gols_time_1', 'goals_time_a']);
  const idxGoalsB = getColIndex(['goals_b', 'goals_2', 'gols_b', 'placar_b', 'gols_time_b', 'gols_time_2', 'goals_time_b']);

  return dataRows.map((row, rIdx) => {
    const getValue = (idx: number, fallback = ''): string => {
      return idx !== -1 && idx < row.length ? row[idx].trim() : fallback;
    };

    const teamA = getValue(idxTeamA, `Time A ${rIdx + 1}`);
    const teamB = getValue(idxTeamB, `Time B ${rIdx + 1}`);
    const rawGoalsA = getValue(idxGoalsA, '');
    const rawGoalsB = getValue(idxGoalsB, '');
    
    const goalsANum = rawGoalsA !== '' ? parseInt(rawGoalsA, 10) : null;
    const goalsBNum = rawGoalsB !== '' ? parseInt(rawGoalsB, 10) : null;

    let parsedStatus = getValue(idxStatus, 'aguardando').toLowerCase();
    if (parsedStatus !== 'encerrado' && parsedStatus !== 'ao_vivo' && parsedStatus !== 'aguardando') {
      if (goalsANum !== null && goalsBNum !== null) {
        parsedStatus = 'encerrado';
      } else {
        parsedStatus = 'aguardando';
      }
    }

    // Resolve date ISO or default using ultra-robust BR/ISO day-first parser
    let matchDate = getValue(idxDate, '');
    if (!matchDate) {
      const today = new Date();
      today.setDate(today.getDate() + rIdx);
      matchDate = today.toISOString();
    } else {
      const cleanStr = matchDate.trim();
      // Try checking with a regex for classical Brazilian DD/MM/YYYY
      const brRegex = /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})(?:\s+|[T\s](?:as|at|@)?\s*)?(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?$/i;
      const match = cleanStr.match(brRegex);

      if (match) {
        let [ , day, month, year, hour = '15', minute = '00', second = '00' ] = match;
        if (day.length === 1) day = '0' + day;
        if (month.length === 1) month = '0' + month;
        if (year.length === 2) year = '20' + year;
        if (hour.length === 1) hour = '0' + hour;
        if (minute.length === 1) minute = '0' + minute;
        if (second.length === 1) second = '0' + second;
        matchDate = `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
      } else {
        const isoRegex = /^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})(?:[T\s](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/;
        const isoMatch = cleanStr.match(isoRegex);
        if (isoMatch) {
          let [ , year, month, day, hour = '15', minute = '00', second = '00' ] = isoMatch;
          if (month.length === 1) month = '0' + month;
          if (day.length === 1) day = '0' + day;
          if (hour.length === 1) hour = '0' + hour;
          if (minute.length === 1) minute = '0' + minute;
          if (second.length === 1) second = '0' + second;
          matchDate = `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
        } else {
          try {
            const parsed = new Date(cleanStr);
            if (!isNaN(parsed.getTime())) {
              matchDate = parsed.toISOString();
            } else {
              const today = new Date();
              today.setDate(today.getDate() + rIdx);
              matchDate = today.toISOString();
            }
          } catch (_) {
            const today = new Date();
            today.setDate(today.getDate() + rIdx);
            matchDate = today.toISOString();
          }
        }
      }
    }

    return {
      id: getValue(idxId, `m${99 + rIdx}`),
      phase: getValue(idxPhase, 'Fase de Grupos'),
      round_number: getValue(idxRound, 'Fase de Grupos - Rodada ' + (Math.floor(rIdx / 2) + 1)),
      group_name: getValue(idxGroup, 'Grupo A'),
      team_a: teamA,
      team_b: teamB,
      flag_a: getValue(idxFlagA, getTeamFlagEmoji(teamA)),
      flag_b: getValue(idxFlagB, getTeamFlagEmoji(teamB)),
      match_date: matchDate,
      stadium: getValue(idxStadium, 'Estádio Oficial'),
      city: getValue(idxCity, 'Cidade Sede'),
      status: parsedStatus,
      goals_a: goalsANum,
      goals_b: goalsBNum,
      locked: parsedStatus === 'encerrado' || parsedStatus === 'ao_vivo'
    };
  });
}

// Bulk update matches either in Supabase (if connected) or LocalStorage
export async function syncMatchesFromCSVText(csvText: string): Promise<{ success: boolean; message: string; count: number }> {
  try {
    const rawMatches = parseCSVMatches(csvText);
    if (!rawMatches.length) {
      return { success: false, message: 'Nenhum jogo válido encontrado no CSV.', count: 0 };
    }

    const isConnected = isSupabaseConfigured();

    if (isConnected) {
      const client = supabase;
      
      // We upsert into matches table
      const { error } = await client
        .from('matches')
        .upsert(rawMatches, { onConflict: 'id' });

      if (error) throw error;

      // Recalculate predictions and ratings for completed games that got updated
      for (const m of rawMatches) {
        if (m.status === 'encerrado' && m.goals_a !== null && m.goals_b !== null) {
          const { data: matchBets } = await client
            .from('bets')
            .select('*')
            .eq('match_id', m.id);

          for (const bet of (matchBets || [])) {
            const calc = calculatePoints(m.goals_a, m.goals_b, bet.bet_goals_a, bet.bet_goals_b);
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
      }

      await recalculateEveryoneRankingsSub();
      await createSupabaseAuditLog('system', 'match', `Sincronização de ${rawMatches.length} jogos realizada por planilha CSV importada.`);

      return { 
        success: true, 
        message: `Sucesso! Sincronizados ${rawMatches.length} jogos no Supabase com pontuações recalculadas.`, 
        count: rawMatches.length 
      };
    } else {
      // Local Storage Mode
      const stored = JSON.parse(localStorage.getItem('bolao_matches_v2') || '[]');
      
      const mappedLocal = rawMatches.map(m => ({
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
        status: m.status,
        gols_time_a: m.goals_a ?? undefined,
        gols_time_b: m.goals_b ?? undefined
      }));

      // Merge on ID
      const merged = [...stored];
      for (const localM of mappedLocal) {
        const idx = merged.findIndex(x => x.id === localM.id);
        if (idx !== -1) {
          merged[idx] = { ...merged[idx], ...localM };
        } else {
          merged.push(localM);
        }
      }

      localStorage.setItem('bolao_matches_v2', JSON.stringify(merged));

      // Trigger local scores recalculator 
      const users = JSON.parse(localStorage.getItem('bolao_users') || '[]');
      const predictions = JSON.parse(localStorage.getItem('bolao_predictions') || '[]');

      // Re-evaluate each local user score based on predictions
      const cleanUsers = users.map((usr: any) => {
        let totalPoints = 0;
        let exactCount = 0;
        let winnerCount = 0;

        const userPreds = predictions.filter((p: any) => p.user_id === usr.id);

        userPreds.forEach((pred: any) => {
          const matchItem = merged.find(m => m.id === pred.match_id);
          if (matchItem && matchItem.status === 'encerrado' && matchItem.gols_time_a !== undefined && matchItem.gols_time_b !== undefined) {
            const calc = calculatePoints(
              matchItem.gols_time_a, 
              matchItem.gols_time_b, 
              pred.placar_time_a, 
              pred.placar_time_b
            );
            totalPoints += calc.points_total;
            if (calc.isExact) exactCount += 1;
            if (calc.isWinnerCorrect) winnerCount += 1;
          }
        });

        return {
          ...usr,
          points: totalPoints,
          exactCount,
          winnerCount
        };
      });

      localStorage.setItem('bolao_users', JSON.stringify(cleanUsers));

      // Audit logs trace update
      const logs = JSON.parse(localStorage.getItem('bolao_audit_logs') || '[]');
      logs.unshift({
        id: `audit-${Date.now()}`,
        type: 'system',
        title: 'Planilha de Jogos Importada',
        detail: `Sincronizados ${rawMatches.length} jogos a partir de arquivo de planilha no sandbox local.`,
        timeLabel: 'Agora mesmo',
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('bolao_audit_logs', JSON.stringify(logs));

      return { 
        success: true, 
        message: `Sucesso! Sincronizados ${rawMatches.length} jogos no sandbox local com pontuações recalculadas.`, 
        count: rawMatches.length 
      };
    }
  } catch (err: any) {
    console.error('Error synchronizing from spreadsheet:', err);
    return { success: false, message: err.message || 'Erro inesperado ao sincronizar jogos.', count: 0 };
  }
}

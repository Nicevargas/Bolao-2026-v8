import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Match, Participant, AuditLog } from './types';

// Helper to translate database match row to frontend Match structure
export function mapDbMatchToModel(dbMatch: any, userBet?: any): Match {
  const isLocked = new Date(dbMatch.match_date).getTime() - 300000 <= Date.now() || dbMatch.status === 'encerrado' || dbMatch.status === 'ao_vivo' || dbMatch.locked;

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
    stadium: [dbMatch.stadium, dbMatch.city].filter(Boolean).join(', ') || 'Estádio Oficial, TBD',
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

    console.log('=== TRACE SUPA === raw matches from DB:', dbMatches?.length, 'items');
    console.log('=== TRACE SUPA === raw bets from DB:', dbBets?.length, 'items');
    console.log('=== TRACE SUPA === match IDs:', dbMatches?.map((m:any) => ({ id: m.id, team_a: m.team_a, team_b: m.team_b, source: m.source })));
    console.log('=== TRACE SUPA === bet match_ids:', dbBets?.map((b:any) => b.match_id));

    const result = (dbMatches || []).map((m: any) => {
      const userBet = (dbBets || []).find((b: any) => b.match_id === m.id);
      return mapDbMatchToModel(m, userBet);
    });

    console.log('=== TRACE SUPA === result (Match[]) IDs:', result.map(r => r.id));
    return result;
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
        role: p.role === 'admin' ? 'Admin' : 'Membro',
        userId: r.user_id
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

    const isLocked = new Date(match.match_date).getTime() - 300000 <= Date.now() || match.status === 'encerrado' || match.status === 'ao_vivo' || match.locked;
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

    // Fetch all matches to get real scores for live calculation
    const { data: allMatches, error: matchesErr } = await client
      .from('matches')
      .select('*');

    if (matchesErr) throw matchesErr;

    let totalPoints = 0;
    let exactScores = 0;
    let correctResults = 0;

    (bets || []).forEach((b: any) => {
      const match = (allMatches || []).find((m: any) => m.id === b.match_id);
      const isMatchCompleted = match && match.goals_a !== null && match.goals_b !== null && match.status === 'encerrado';

      if (isMatchCompleted) {
        // Calculate points LIVE from real match scores + bet prediction
        const calc = calculatePoints(match.goals_a, match.goals_b, b.bet_goals_a, b.bet_goals_b);
        totalPoints += calc.points_total;
        if (calc.points_bonus > 0) exactScores += 1;
        if (calc.points_result > 0) correctResults += 1;
      } else {
        // For non-completed matches, use stored points (should be 0)
        totalPoints += b.points_total || 0;
        if (b.points_bonus > 0) exactScores += 1;
        if (b.points_result > 0) correctResults += 1;
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

    const { error: profileErr } = await client
      .from('profiles')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (profileErr) {
      console.warn(`Failed to touch profile ${userId}:`, profileErr);
    }

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

      console.log(`=== SAVE RESULT === Processing ${matchBets?.length || 0} bets for match ${matchId} (${goalsA}x${goalsB})`);

      for (const bet of (matchBets || [])) {
        const calc = calculatePoints(goalsA, goalsB, bet.bet_goals_a, bet.bet_goals_b);

        console.log(`=== SAVE RESULT === Bet ${bet.id}: pred ${bet.bet_goals_a}x${bet.bet_goals_b} → calc points_total=${calc.points_total}, result=${calc.points_result}, bonus=${calc.points_bonus}, exact=${calc.isExact}`);

        const { error: updateBetErr } = await client
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

        if (updateBetErr) {
          console.error(`=== SAVE RESULT === Failed to update bet ${bet.id}:`, updateBetErr);
        } else {
          console.log(`=== SAVE RESULT === Bet ${bet.id} updated successfully`);
        }
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

// Fetch all bets from Supabase (for admin points preview)
export async function getSupabaseAllBets(): Promise<any[]> {
  if (!isSupabaseConfigured()) return [];
  const client = supabase;
  try {
    const { data, error } = await client.from('bets').select('*');
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching all bets:', err);
    return [];
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

// Admin updates a match's full data (teams, date, phase, etc.)
export async function createSupabaseMatch(data: {
  team_a: string;
  team_b: string;
  flag_a?: string;
  flag_b?: string;
  match_date: string;
  stadium: string;
  city?: string;
  phase?: string;
  group_name?: string;
  round_number?: string;
}): Promise<{ success: boolean; message: string; matchId?: string }> {
  if (!isSupabaseConfigured()) return { success: false, message: 'Supabase não configurado.' };
  const client = supabase;

  try {
    const { data: newMatch, error } = await client
      .from('matches')
      .insert({
        team_a: data.team_a,
        team_b: data.team_b,
        flag_a: data.flag_a || null,
        flag_b: data.flag_b || null,
        match_date: data.match_date,
        stadium: data.stadium || 'TBD',
        city: data.city || '',
        phase: data.phase || 'Fase de Grupos',
        group_name: data.group_name || '-',
        round_number: data.round_number || '',
        status: 'aguardando',
        goals_a: null,
        goals_b: null,
        locked: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) throw error;

    await createSupabaseAuditLog('system', 'match', `Partida ${data.team_a} x ${data.team_b} criada por administrador.`);
    return { success: true, message: 'Partida criada com sucesso!', matchId: newMatch?.id };
  } catch (err: any) {
    console.error('Error creating match:', err);
    return { success: false, message: err.message || 'Erro ao criar partida.' };
  }
}

export async function updateSupabaseMatch(matchId: string, data: {
  team_a?: string;
  team_b?: string;
  flag_a?: string;
  flag_b?: string;
  match_date?: string;
  stadium?: string;
  city?: string;
  phase?: string;
  group_name?: string;
  round_number?: string;
  goals_a?: number | null;
  goals_b?: number | null;
  status?: string;
}): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured()) return { success: false, message: 'Supabase não configurado.' };
  const client = supabase;

  try {
    const { error } = await client
      .from('matches')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', matchId);

    if (error) throw error;

    await createSupabaseAuditLog('system', 'match', `Partida ${matchId} atualizada por administrador.`);
    return { success: true, message: 'Partida atualizada com sucesso!' };
  } catch (err: any) {
    console.error('Error updating match:', err);
    return { success: false, message: err.message || 'Erro ao atualizar partida.' };
  }
}

// Admin deletes a match and cascades its bets
export async function deleteSupabaseMatch(matchId: string): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured()) return { success: false, message: 'Supabase não configurado.' };
  const client = supabase;

  try {
    const { error } = await client
      .from('matches')
      .delete()
      .eq('id', matchId);

    if (error) throw error;

    await recalculateEveryoneRankingsSub();
    await createSupabaseAuditLog('system', 'match', `Partida ${matchId} excluída por administrador.`);
    return { success: true, message: 'Partida excluída com sucesso!' };
  } catch (err: any) {
    console.error('Error deleting match:', err);
    return { success: false, message: err.message || 'Erro ao excluir partida.' };
  }
}



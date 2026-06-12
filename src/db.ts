import { Match, Participant, Company, AuditLog } from './types';
import { INITIAL_AUDIT_LOGS } from './data';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  points: number;
  exactCount: number;
  winnerCount: number;
  companyId?: string;
  themePreference: 'light' | 'dark' | 'system';
  isAdmin: boolean;
  role?: string;
  createdAt: string;
}

export interface Prediction {
  user_id: string;
  match_id: string;
  placar_time_a: number;
  placar_time_b: number;
  data_palpite: string;
}

export interface Invitation {
  code: string;
  companyId: string;
  companyName: string;
  maxSlots: number;
  usedSlots: number;
  createdBy: string;
}

// Fake matches removed — only real API data is used

// Seed standard initial participants list
export const INITIAL_USERS: User[] = [
  {
    id: 'u3',
    name: 'Rodrigo / Felipe Costa',
    email: '02nicevargas@gmail.com', // Match system email metadata
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA4UGP85L_irYmCQ-SK6i2T3hP8g_UD5VbiFG0fvX7C2q08XTzK53r6Emlqj-vw98UooXSyWmhi7lE7qYryk69E5WAbKeig_GxDO3d9pIqZC-B0di6P1cbHc1j2BbK6QGIe-z5AYcoydosUPThbxrbwMSXrcGFfQ-1NL3XXVkFg2qGiVhU_r_X-8AVrBXqND1Z_mH_ULff-mQIsxitRsXjhsSYW40hxMkPhaeYK5AJlw_fq4OhqZCM9lF7kb3SgYGLggWsULakcTTs',
    points: 564,
    exactCount: 12,
    winnerCount: 28,
    companyId: 'c2',
    themePreference: 'dark',
    isAdmin: true, // Let them toggle admin mode easily as before
    role: 'Líder Criativo',
    createdAt: '2026-03-12'
  }
];

export const INITIAL_COMPANIES_DB: Company[] = [
  { id: 'c1', name: 'Creative Tech Solutions', domain: 'creativetech.com', usersCount: 1450, registeredDate: '2026-06-10' },
  { id: 'c2', name: 'Natação Criativa Corp', domain: 'natacaocriativa.com.br', usersCount: 3200, registeredDate: '2026-03-12' },
];

export const INITIAL_INVITATIONS: Invitation[] = [
  {
    code: 'NATACAO2026',
    companyId: 'c2',
    companyName: 'Natação Criativa Corp',
    maxSlots: 1500,
    usedSlots: 450,
    createdBy: 'u3'
  },
  {
    code: 'CREATIVA10',
    companyId: 'c1',
    companyName: 'Creative Tech Solutions',
    maxSlots: 500,
    usedSlots: 120,
    createdBy: 'u3'
  }
];

export const INITIAL_PREDICTIONS: Prediction[] = [];

// New dynamic point scoring calculation algorithm as per Copa 2026 guidelines
export function calculatePredictionPoints(
  realA: number,
  realB: number,
  predA: number,
  predB: number
): { points: number; isExact: boolean; isWinnerCorrect: boolean } {
  let points = 0;
  
  // 1. ACERTO DO RESULTADO (Vitória Time A, Vitória Time B ou Empate) -> +2 Pontos
  const realResult = realA > realB ? 'A' : realA < realB ? 'B' : 'Empate';
  const predResult = predA > predB ? 'A' : predA < predB ? 'B' : 'Empate';
  const isWinnerCorrect = realResult === predResult;
  if (isWinnerCorrect) {
    points += 2;
  }
  
  // 2. ACERTO DOS GOLS DO TIME A -> +1 Ponto
  const isAExact = realA === predA;
  if (isAExact) {
    points += 1;
  }
  
  // 3. ACERTO DOS GOLS DO TIME B -> +1 Ponto
  const isBExact = realB === predB;
  if (isBExact) {
    points += 1;
  }
  
  // 4. BÔNUS POR PLACAR EXATO -> +1 Ponto Extra
  const isExact = isAExact && isBExact;
  if (isExact) {
    points += 1;
  }
  
  return {
    points,
    isExact,
    isWinnerCorrect
  };
}

// Overwrite and synchonise user scores based on stored predictions & seed bases
export function recalculateEveryonePoints(customMatches?: any[]) {
  let users = JSON.parse(localStorage.getItem('bolao_users') || '[]');
  if (!users.length) return;

  // Filter out fictitious profiles
  users = users.filter((u: any) => u.id !== 'u1' && u.id !== 'u2');

  const matches = customMatches || JSON.parse(localStorage.getItem('bolao_matches_v2') || '[]');
  const predictions = JSON.parse(localStorage.getItem('bolao_predictions') || '[]');

  const baseStats: Record<string, { points: number; exact: number; winner: number }> = {
    'u3': { points: 564, exact: 12, winner: 28 },
  };

  const updatedUsers = users.map((u: any) => {
    const base = baseStats[u.id] || { points: 0, exact: 0, winner: 0 };
    let extraPoints = 0;
    let extraExact = 0;
    let extraWinner = 0;

    matches.forEach((m: any) => {
      if (m.status === 'encerrado') {
        const pred = predictions.find((p: any) => p.user_id === u.id && p.match_id === m.id);
        if (pred) {
          const scoring = calculatePredictionPoints(m.gols_time_a, m.gols_time_b, pred.placar_time_a, pred.placar_time_b);
          extraPoints += scoring.points;
          if (scoring.isExact) {
            extraExact += 1;
          }
          if (scoring.isWinnerCorrect) {
            extraWinner += 1;
          }
        }
      }
    });

    return {
      ...u,
      points: base.points + extraPoints,
      exactCount: base.exact + extraExact,
      winnerCount: base.winner + extraWinner
    };
  });

  localStorage.setItem('bolao_users', JSON.stringify(updatedUsers));
}

// Helper to fully initialize DB states in localStorage if they don't yet exist
export function initDB() {
  if (!localStorage.getItem('bolao_users')) {
    localStorage.setItem('bolao_users', JSON.stringify(INITIAL_USERS));
  }
  if (!localStorage.getItem('bolao_companies')) {
    localStorage.setItem('bolao_companies', JSON.stringify(INITIAL_COMPANIES_DB));
  }
  if (!localStorage.getItem('bolao_invitations')) {
    localStorage.setItem('bolao_invitations', JSON.stringify(INITIAL_INVITATIONS));
  }
  if (!localStorage.getItem('bolao_predictions')) {
    localStorage.setItem('bolao_predictions', JSON.stringify(INITIAL_PREDICTIONS));
  }
  if (!localStorage.getItem('bolao_active_user_id')) {
    // Default logged in user is u3 (the developer/tester)
    localStorage.setItem('bolao_active_user_id', 'u3');
  }
  if (!localStorage.getItem('bolao_audit_logs')) {
    localStorage.setItem('bolao_audit_logs', JSON.stringify(INITIAL_AUDIT_LOGS));
  }
  // Always recalculate points dynamically upon init to enforce correctness
  recalculateEveryonePoints();
}

// Get raw tables from Storage
export function getStoredUsers(): User[] {
  initDB();
  const users: User[] = JSON.parse(localStorage.getItem('bolao_users') || '[]');
  const cleaned = users.filter(u => u.id !== 'u1' && u.id !== 'u2');
  if (users.length !== cleaned.length) {
    localStorage.setItem('bolao_users', JSON.stringify(cleaned));
  }
  return cleaned;
}

export function getStoredAuditLogs(): any[] {
  initDB();
  return JSON.parse(localStorage.getItem('bolao_audit_logs') || '[]');
}

export function saveStoredAuditLogs(logs: any[]) {
  localStorage.setItem('bolao_audit_logs', JSON.stringify(logs));
}

export function getStoredMatches(): any[] {
  initDB();
  return JSON.parse(localStorage.getItem('bolao_matches_v2') || '[]');
}

export function saveStoredMatches(matches: any[]) {
  localStorage.setItem('bolao_matches_v2', JSON.stringify(matches));
}

export function getStoredCompanies(): Company[] {
  initDB();
  return JSON.parse(localStorage.getItem('bolao_companies') || '[]');
}

export function getStoredInvitations(): Invitation[] {
  initDB();
  return JSON.parse(localStorage.getItem('bolao_invitations') || '[]');
}

export function getStoredPredictions(): Prediction[] {
  initDB();
  return JSON.parse(localStorage.getItem('bolao_predictions') || '[]');
}

export function getActiveUser(): User | null {
  initDB();
  const activeId = localStorage.getItem('bolao_active_user_id');
  if (!activeId) return null;
  const users = getStoredUsers();
  return users.find(u => u.id === activeId) || null;
}

// Actions
export function loginUser(email: string): User | null {
  const users = getStoredUsers();
  const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (found) {
    localStorage.setItem('bolao_active_user_id', found.id);
    return found;
  }
  return null;
}

export function registerUser(name: string, email: string, domainOrCode: string): { success: boolean; user?: User; message: string } {
  const users = getStoredUsers();
  const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return { success: false, message: 'Este e-mail já está cadastrado.' };
  }

  // Domain extraction
  const emailDomain = email.split('@')[1] || '';

  // Validate either by company invitation code or matching workspace domain
  const companies = getStoredCompanies();
  const invitations = getStoredInvitations();

  // Look for invitation code match
  const matchedInvite = invitations.find(i => i.code.toUpperCase() === domainOrCode.toUpperCase());
  let matchedCompany = companies.find(c => c.domain.toLowerCase() === emailDomain.toLowerCase());

  if (!matchedInvite && !matchedCompany && domainOrCode) {
    // Try to match company name/domain directly with invitation code
    matchedCompany = companies.find(c => c.name.toLowerCase().includes(domainOrCode.toLowerCase()));
  }

  const finalCompanyId = matchedInvite ? matchedInvite.companyId : (matchedCompany ? matchedCompany.id : 'c2');

  // Incremet slots
  if (matchedInvite) {
    const updatedInvites = invitations.map(i => {
      if (i.code.toUpperCase() === matchedInvite.code.toUpperCase()) {
        return { ...i, usedSlots: i.usedSlots + 1 };
      }
      return i;
    });
    localStorage.setItem('bolao_invitations', JSON.stringify(updatedInvites));
  }

  const randomAvatars = [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDX0a_fMiYsLvCq-EVQUmI3ESXPQM3UhaMN1iAXKMF2N_h1v_F4i9DgTBGjOyH2bZmRErpRE2pnwzxLssuSHsUCKClPJ_3VaRSq8iHN4VUgc0pOrGGfwq2RA3DVYXdn6fAgmVQ2gRJt-eT8rClwG42ivZk77oSw00ewe_kjZ1LGZFVASTY25TVVHRrBiW-1OM5m2ZUaZWKTu_y7HN4mLXvhttvQOOFa0123upjK8Q3V-zKRbByyKgtzfamzBK0_oEhflymajzXPvFM',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuD6VXhYtSECJ_9hqMM7slqaJ13EYJUqEo-u6_GzEzUTQHE1ndfIQYSgILNbPc4H5qcCfdcMDI6tAxlQ1DTLzQD2FD3E61ESkURTWU4dc2HY87dMGHXAy4zoXvKTYUFmp9Q6sKe7UW9KkGPva4sT8uKr7snOpvVa2d5SddU0Eamivle5GfVXETvGmLXM09fznxq5oiJst2_-ti9RBAkIjbs-MjNm6tdegMPp1dX-KF85BYMdaoG5400RVGYRWS59IKTfpW4oWwsCbr8',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAmZ9mAbC5QnTH-Vd4NzCxSSJSlhKHZjQZpe9EpNSNqY45HZTPAMW-RQeGh8xl7-9_rGEwwHqTpXQ_e46DoY9QeSF-taowmZiAtUC7Qxka7cl8TEF6aG4G297ycmATCT6_UtulzUfqcjLivTauXY9QPC8K-Oy4yNccpZbVjbdKrX-nS8HPbsGCSejU1n2m7dzyncTbBG5CPzcJ772aT6sJDeJ-DbPepTDrjf3Jm1IaBx4J5K2US5DXZh2cPnJTxZdYLA9hA6s6Gqa8',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBF3YJY06iJC2Hv--ZAVELEROKgCoja5xtm51BwC-GvafWS2Rkjwi-KVa-jWuD4NVP5yhv1Kr0ufnzofBTjDq1m_NM3h_KUT6XzY25TJm0Kfj2b0Hcrp8Ya4xy3PkG6c6FW-FKy5ajcsDk66lA2tA17DJp12gy3v_ayHw2l4knQoi5Jy7OvL9yFkveZw_q97mGGXYSZGCidAZt7CzTbQuszSehEkcXq0NdXOwa7FFTUc-ftZ3QTc6NslTWqzdhOOMxhvCA9LoxyVlA'
  ];

  const newUser: User = {
    id: `u-${Date.now()}`,
    name,
    email,
    avatar: randomAvatars[Math.floor(Math.random() * randomAvatars.length)],
    points: 0,
    exactCount: 0,
    winnerCount: 0,
    companyId: finalCompanyId,
    themePreference: 'dark',
    isAdmin: false,
    role: 'Participante',
    createdAt: new Date().toISOString().substring(0, 10)
  };

  const updatedUsers = [...users, newUser];
  localStorage.setItem('bolao_users', JSON.stringify(updatedUsers));
  localStorage.setItem('bolao_active_user_id', newUser.id);

  return { success: true, user: newUser, message: 'Usuário registrado com sucesso!' };
}

export function savePrediction(userId: string, matchId: string, scoreA: number, scoreB: number): { success: boolean; message: string } {
  // Check if match is already closed
  const matches = getStoredMatches();
  const match = matches.find(m => m.id === matchId);
  if (!match) {
    return { success: false, message: 'Partida não encontrada.' };
  }

  // Bloqueia palpite 5 minutos antes do jogo
  if (new Date(match.data_hora).getTime() - 300000 <= Date.now() || match.status === 'encerrado' || match.status === 'ao_vivo') {
    return { success: false, message: 'Os palpites para esta partida foram encerrados.' };
  }

  const predictions = getStoredPredictions();
  const existingIndex = predictions.findIndex(p => p.user_id === userId && p.match_id === matchId);

  const newPrediction: Prediction = {
    user_id: userId,
    match_id: matchId,
    placar_time_a: scoreA,
    placar_time_b: scoreB,
    data_palpite: new Date().toISOString()
  };

  if (existingIndex > -1) {
    predictions[existingIndex] = newPrediction;
  } else {
    predictions.push(newPrediction);
  }

  localStorage.setItem('bolao_predictions', JSON.stringify(predictions));

  // Recalculate everyone's points accurately according to prediction statuses
  recalculateEveryonePoints();

  return { success: true, message: 'Palpite salvo com sucesso!' };
}

export function addInvitationCode(code: string, companyId: string, maxSlots: number, createdBy: string): Invitation {
  const invitations = getStoredInvitations();
  const companies = getStoredCompanies();
  const company = companies.find(c => c.id === companyId);
  const companyName = company ? company.name : 'Outra Empresa';

  const newInvite: Invitation = {
    code: code.toUpperCase().trim(),
    companyId,
    companyName,
    maxSlots,
    usedSlots: 0,
    createdBy
  };

  localStorage.setItem('bolao_invitations', JSON.stringify([...invitations, newInvite]));
  return newInvite;
}

export function updatePreference(userId: string, theme: 'light' | 'dark' | 'system') {
  const users = getStoredUsers();
  const updated = users.map(u => {
    if (u.id === userId) {
      return { ...u, themePreference: theme };
    }
    return u;
  });
  localStorage.setItem('bolao_users', JSON.stringify(updated));
}

// Convert simulated database predictions to visual structure required by MatchesView
export function getMatchesWithParsedBets(userId: string): Match[] {
  const matches = getStoredMatches();
  const predictions = getStoredPredictions();

  return matches.map(m => {
    const userBet = predictions.find(p => p.user_id === userId && p.match_id === m.id);
    const hasBet = userBet !== undefined;

    // Is closed verification
    const isLocked = new Date(m.data_hora).getTime() - 300000 <= Date.now() || m.status === 'encerrado' || m.status === 'ao_vivo';

    return {
      id: m.id,
      type: m.status === 'ao_vivo' ? 'live' : m.status === 'encerrado' ? 'completed' : m.fase === 'Final' ? 'double' : 'upcoming',
      teamA: {
        name: m.time_a,
        code: m.time_a.length > 3 ? m.time_a.substring(0, 3).toUpperCase() : m.time_a,
        logo: m.bandeira_time_a, // Emoji flag or URL
        info: m.grupo !== '-' ? m.grupo : m.fase
      },
      teamB: {
        name: m.time_b,
        code: m.time_b.length > 3 ? m.time_b.substring(0, 3).toUpperCase() : m.time_b,
        logo: m.bandeira_time_b,
        info: m.grupo !== '-' ? m.grupo : m.fase
      },
      scoreA: m.gols_time_a,
      scoreB: m.gols_time_b,
      time: m.status === 'ao_vivo' ? "55'" : undefined,
      stadium: [m.estadio, m.cidade].filter(Boolean).join(', ') || 'Estádio Oficial, TBD',
      dateStr: m.data_hora,
      userBet: hasBet ? {
        scoreA: userBet!.placar_time_a,
        scoreB: userBet!.placar_time_b,
        locked: isLocked
      } : undefined,
      isAccurate: m.status === 'encerrado' && hasBet ? (userBet!.placar_time_a === m.gols_time_a && userBet!.placar_time_b === m.gols_time_b) : false,
      pointsEarned: m.status === 'encerrado' && hasBet && m.gols_time_a !== undefined && m.gols_time_b !== undefined ? (
        calculatePredictionPoints(m.gols_time_a, m.gols_time_b, userBet!.placar_time_a, userBet!.placar_time_b).points
      ) : undefined
    };
  });
}

// Convert simulated user list into Participants score list ordered by points
export function getParticipantsFromStored(): Participant[] {
  const users = getStoredUsers();
  const sorted = [...users].sort((a, b) => b.points - a.points);
  
  return sorted.map((u, index) => ({
    rank: index + 1,
    name: u.name,
    avatar: u.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuD6VXhYtSECJ_9hqMM7slqaJ13EYJUqEo-u6_GzEzUTQHE1ndfIQYSgILNbPc4H5qcCfdcMDI6tAxlQ1DTLzQD2FD3E61ESkURTWU4dc2HY87dMGHXAy4zoXvKTYUFmp9Q6sKe7UW9KkGPva4sT8uKr7snOpvVa2d5SddU0Eamivle5GfVXETvGmLXM09fznxq5oiJst2_-ti9RBAkIjbs-MjNm6tdegMPp1dX-KF85BYMdaoG5400RVGYRWS59IKTfpW4oWwsCbr8',
    points: u.points,
    exactCount: u.exactCount,
    winnerCount: u.winnerCount,
    league: u.id === 'u3' ? 'Líder Criativo' : u.points > 800 ? 'Palpitador Divino' : u.points > 400 ? 'Especialista Aprendiz' : 'Novato',
    isUser: u.id === localStorage.getItem('bolao_active_user_id'),
    role: u.isAdmin ? 'Admin' : 'Membro'
  }));
}

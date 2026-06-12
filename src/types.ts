export type ActiveTab = 'dashboard' | 'matches' | 'leaderboard' | 'admin' | 'invitations' | 'debug';

export interface Match {
  id: string;
  type: 'live' | 'upcoming' | 'completed' | 'double';
  teamA: {
    name: string;
    code: string;
    logo: string;
    info?: string;
  };
  teamB: {
    name: string;
    code: string;
    logo: string;
    info?: string;
  };
  scoreA?: number;
  scoreB?: number;
  time?: string;
  stadium: string;
  userBet?: {
    scoreA: number;
    scoreB: number;
    locked: boolean;
  };
  isAccurate?: boolean;
  pointsEarned?: number;
  dateStr?: string;
}

export interface Participant {
  rank: number;
  name: string;
  avatar: string;
  points: number;
  league?: string;
  role?: string;
  exactCount: number;
  winnerCount: number;
  isUser?: boolean;
  isTrending?: boolean;
}

export interface AuditLog {
  id: string;
  type: 'match' | 'company' | 'prize' | 'security' | 'system';
  title: string;
  detail: string;
  timeLabel: string;
  timestamp: Date;
}

export interface Company {
  id: string;
  name: string;
  domain: string;
  usersCount: number;
  registeredDate: string;
  trendingStatus?: 'up' | 'down' | 'stable';
}

export interface AdminStats {
  totalCompanies: number;
  totalUsers: number;
  activeBets: number;
  pendingResults: number;
}

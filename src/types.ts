export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string;
  awayFlag: string;
  date: string;
  time: string;
  location: string;
  userHomeScore?: number | "";
  userAwayScore?: number | "";
  realHomeScore?: number;
  realAwayScore?: number;
  pointsEarned?: number;
  status: 'PONTUADO' | 'ENCERRADO' | 'ABERTO';
}

export interface Participant {
  rank: number;
  name: string;
  avatar: string;
  points: number;
  exacts: number;
  accuracy: number;
  username: string;
}

export interface UserProfile {
  name: string;
  email: string;
  rank: number;
  points: number;
  exacts: number;
  accuracy: number;
  isLoggedIn: boolean;
}

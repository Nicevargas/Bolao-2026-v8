import { Match, Participant, AuditLog, Company } from './types';

export const INITIAL_MATCHES: Match[] = [
  {
    id: 'm1',
    type: 'live',
    teamA: {
      name: 'Argentina',
      code: 'ARG',
      logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCKxz7dRX3vmMxOC5d2glLzqZ6xPLkYMapyC2e6qqt8YKo5qETtqwondpqaG9UNWKTrnLzAh9JG8HBcOEdqq2LDXRHyC9TQoODrWWYUh027p52sPtj8fUr6eNBRJfkzmu3nbhDASLDu9XPrxrscK6Xt0E1ZuGnINXjzhDPGVZL2LGDSvuKcokqd2YTWORnwxwBA4fkP3C8eWoXFOE6ti9MTRZJ2BCBbXDWNr-wVoME1_cgsFS5_NhENmgjehpgy-x6IfTrnSvr8Reg',
    },
    teamB: {
      name: 'Holanda',
      code: 'NED',
      logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDqb9hblX1VkeLy-aNYBpzRfOJ9jq2nvKjX1r6RbER_FqbzVaok_u0QKn6HEt220Ks-Jv-nODVNJJY6UWDspgsK5OzxQDhmgLuyLRsf65BECWYBlQ-_eiDA3qucspGdPacQdNZCD_lCj0I5wEJjwXbTmNemZaOqWM-d14ef6he2OnqB2V87naBYHh8u2DqvQtMfmlj0l6liYDLeyg6Of1k1DDupGwz3eiv3pDLDMGfMMCfGv-DS2zL0nN-fpAc2Gakcws9zD2mx_vY',
    },
    scoreA: 2,
    scoreB: 1,
    time: "78'",
    stadium: 'Estádio Lusail, Doha',
  },
  {
    id: 'm2',
    type: 'live',
    teamA: {
      name: 'EUA',
      code: 'USA',
      logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBIuKOLtzLf2UVNFGPpD6_MNCJo0_tXtLGTh-NtD-EJjrlLDIPoeSqvjpHtDDN86ELLtnd0E75Nh90cqBYjHVAgIB5mf4Ih0xaNugpqKhOT7qGRWvN9bDPCPgxvAfqLIaxZTT4wbT6E9nVc6tuhy40k5-KIzqXnxWwbKTWH-X3SnMOt80y5TS2145wshphKAfOUpW8-sGjXbkltsra0ja7bxGzAEcLTpqvgvNlHhxGAeP_2wQIez3hxwJrzQGCsMUhBxGufl6evZvs',
      info: 'Anfitrião'
    },
    teamB: {
      name: 'Brasil',
      code: 'BRA',
      logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuArELmiZZWDjXRhS-BTgLVpQYg0SSCMWX0U2QWqfg9XZNm2ZCDg5ZCUlSWGE6dt4U1xsWmH2oSpPQWcZagDMjwuXJia9Zy8fkiw7oC6e9iv29cAibHczrpzGsUpl9x2ZC4tCIBjSS6qt4rKyvqWDhzNVivd6C82KFfBY6IMT0lo8UaMO69wSguub3eDfDU8rbUd5bmN1bf0r5apxLc0gpgyRvvO2Xx8GP6DazS2uAndYrQ59CBdXejsvbUUQlkiXOPLPLZBqBKlF8o',
      info: 'Cabeça de Chave'
    },
    scoreA: 2,
    scoreB: 1,
    time: "64'",
    stadium: 'MetLife Stadium, NJ',
    userBet: {
      scoreA: 1,
      scoreB: 3,
      locked: true,
    },
  },
  {
    id: 'm3',
    type: 'upcoming',
    teamA: {
      name: 'Alemanha',
      code: 'GER',
      logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBOGVrV9fiIUOyypAd2hhifSWRuIa_-MRX8ZZRrlT8tx2suRKVZnGqw06goqy27ugKi48a5SAVJ2245ovqNSqHzoCiQ-mtbDIk0TsU4ZjTf1uU8ZyaP5aUzDkWSpaePcMIhpCS3V1LNW_15lueREzhSmonr5xIl-J7valyBJyUfXzLK083FTgs6g9p2yY-Jx2na7dHPwwz-qBurva4rzptNpoW_79xQaTAgEiKCG-8lIJrgDoSbNtIw5PzEl5n-RmTTUUO4N9CoH5I',
    },
    teamB: {
      name: 'Japão',
      code: 'JPN',
      logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCZxQNbe_D6qO44kQsgngmDFjS_TTaJkLNM52sMt0Iy6CY7RebkvFn62UHysVyhe0SFXyw6eHl8blgaAWRGcuYk5dyUOudpz4HBHTELgd0O-nyUf9QvPjmERRvmafqFQnEphaJJShlomxrrNKp6AzgkEwnijaUi-fgWcQJ0YRihhyEgAzvrzr48-3MUCeQ39Iena-68TC6izRg9Eqf2bqxYLRUlaxhMGajBpnMGxdDYgEOiXhEelczyjYtmtSzCMderVWapMAiAWSA',
    },
    time: '20:00',
    dateStr: 'AMANHÃ',
    stadium: 'Estádio Internacional Khalifa',
  },
  {
    id: 'm4',
    type: 'upcoming',
    teamA: {
      name: 'França',
      code: 'FRA',
      logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCGTWhfzHarYAjJQMb34raKwq3Bdixh5wncirSSkaF9sBDpErueq143trtg5wWkPaNQgxqBcDXNSPjxJNU999UhnWmkFisXwSIp6y7DmeMq5O9Rbrl9Hl1Az9_jFCwtO3fLcCHFrTvZ21GCsXbOh9FdAUn7RH_Q6PC0ZqaIXgU86Bbgpj6r6uI3_Yg5TxpVNeQ4vmIJPj8YRscbIFEAQDXbjyWsAIRvRr_-zfCPzhGVwDCUhppmHBE5JITsaeTpHUfs3f_y61nZH_I',
    },
    teamB: {
      name: 'Argentina',
      code: 'ARG',
      logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBMjP6bVv6ZHTSu-t7v3lwrrgQFv-MuU_W-PA4BOwwC81MF0Ohhj30pDyXFVmYN0ZJa_XkQb2z_0qHWaBX-pD5zMtDgCdh70QTGj__72kRURwssSk0q981oy_c3QAFmn3ZNT0_1yGV3sjineKMFoUywIXDwu9nrEIheuKnyDercwJ9LCcivbHM-LqBAFPL_IwFGqUNw3fYOOPSseiZIGtGjiApQljIqBfL1Bta2chy1CglBMoeTrNgspzRQ-3cggXDJmxj9lKk0iGE',
    },
    time: '18:00',
    dateStr: 'Amanhã - 18:00',
    stadium: 'SoFi Stadium, LA',
  },
  {
    id: 'm5',
    type: 'completed',
    teamA: {
      name: 'Espanha',
      code: 'ESP',
      logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBvKLp0lH8S96Hl99gm8ipeYGi9uWTDAoCJ3EQkT3N1_jzlILRXArXqkBOs-b7xAXxrkFn4CfWTi0CEiii3_UQNHcJ_NLVR4ogUkyvNXpNx91gxGPf9zvEhoUW_Uqldji_KYZzXuMkRXUCOC_tgYbxtZMueGklJ-V8bFYjuhetL4PdrpBxrl8xENXLcBp0LhzDUmq9x-NjJxtaWXyas6OOYwfHVhSdI3ubnQBXDOH8XhCY8ewds4ni0uJNCCD8qUnyNCFlup0x6iiE',
    },
    teamB: {
      name: 'Alemanha',
      code: 'GER',
      logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBWeDyQ6zsFFQj0r3fPm3-HeIV-0e6kMpHOst8THyecmVeR33pR5CBXyaUfijyR_pdTXYYPeQWJAc6KYkNcAtkM0ZYd8vHvYMdfOB0AM8mO1yDKk7CdMfF64XaVB24Or6FzH4Av7SBhQAf4WyF1TjQGgAQ2auk6cML6iH2t-RLoUQ2xahfz-35-rmBJ0SN24AJu2UIYJ6VEQOG9Y1k0jH2XL-HGF-iQi0LzUbLR74hdzeJD-ZsliqqwZ0tn8mf-FHhMPuWuTA3lOQ8',
    },
    scoreA: 1,
    scoreB: 1,
    stadium: 'Al Bayt Stadium',
    userBet: {
      scoreA: 1,
      scoreB: 1,
      locked: true,
    },
    isAccurate: true,
    pointsEarned: 150,
  },
  {
    id: 'm6',
    type: 'double',
    teamA: {
      name: 'Portugal',
      code: 'POR',
      logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCfpn9172YLLe7AvrXEZm5YK5MhrLPjK7DHwO0NSAZtOVrn2DhUX8zKS_U1kO2b-ssgKqLsAtOAiyH4PqHd29bdwWgzKfOJlVioU-0k9BGzvva8gFe4B_p6_rbUhxEfYJB_uXd7u9lG3lCTe6eSMbVw_zPJkGozDEU3rHAUIayBwdGpEEXfLe2YNO5FFTu22Ag6sNDhDoHl2K_0YM_dQhsfjZ3-G42VD23mBVCW9oYK-euJWVFcKJGQ3kE2QZ6vqco7zYhvDq0qLQo',
    },
    teamB: {
      name: 'Inglaterra',
      code: 'ENG',
      logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBdrm8h_LrWSo54VXm1YfXwh8ovRn7eomBaQ0dIo2EERz846-AhcZrwqZy6E9lHyv0U0j2fvG9qfQLKoQRHHicIIrK_g61ZFhTlhFMUjp3XLrPUz6Tps5ddjG-UHMq6kRAs_B2OQo9--xQwpjZTdYZvKAts6Ba-1LdwVfSV2WD5UzQ6FMsHuWZkG4dC0duus_D6V6RBF8Q_5in-KQdEGr1u2ANUtMjtmi9oMd--rHnvROQ4Zr3QxTyRAQrFpnQH5DtzuI5Z9-Q6q9M',
    },
    time: '21:00',
    dateStr: '24 Jun - 21:00',
    stadium: 'Hard Rock Stadium, Miami',
  },
];

export const INITIAL_PARTICIPANTS: Participant[] = [
  {
    rank: 1,
    name: 'Rodrigo / Felipe Costa (Você)',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA4UGP85L_irYmCQ-SK6i2T3hP8g_UD5VbiFG0fvX7C2q08XTzK53r6Emlqj-vw98UooXSyWmhi7lE7qYryk69E5WAbKeig_GxDO3d9pIqZC-B0di6P1cbHc1j2BbK6QGIe-z5AYcoydosUPThbxrbwMSXrcGFfQ-1NL3XXVkFg2qGiVhU_r_X-8AVrBXqND1Z_mH_ULff-mQIsxitRsXjhsSYW40hxMkPhaeYK5AJlw_fq4OhqZCM9lF7kb3SgYGLggWsULakcTTs',
    points: 564,
    league: 'Especialista Aprendiz',
    exactCount: 12,
    winnerCount: 28,
    isUser: true,
    isTrending: true,
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log1',
    type: 'match',
    title: 'Resultados de Jogos Atualizados',
    detail: 'Brasil vs Croácia finalizado. 4.200 palpites resolvidos.',
    timeLabel: 'Há 2 minutos',
    timestamp: new Date(Date.now() - 120000),
  },
  {
    id: 'log2',
    type: 'company',
    title: 'Nova Empresa Verificada',
    detail: '"Creative Tech Solutions" entrou na campanha.',
    timeLabel: 'Há 45 minutos',
    timestamp: new Date(Date.now() - 2700000),
  },
  {
    id: 'log3',
    type: 'prize',
    title: 'Configurações de Prêmios Modificadas',
    detail: 'Recompensas do ranking atualizadas pelo Admin #04.',
    timeLabel: 'Há 2 horas',
    timestamp: new Date(Date.now() - 7200000),
  },
  {
    id: 'log4',
    type: 'security',
    title: 'Alerta de Segurança',
    detail: 'Padrão de palpites incomum detectado do IP 192.168.1.1.',
    timeLabel: 'Há 5 horas',
    timestamp: new Date(Date.now() - 18000000),
  },
  {
    id: 'log5',
    type: 'system',
    title: 'Manutenção do Sistema',
    detail: 'Otimização do banco de dados concluída com sucesso.',
    timeLabel: 'Há 10 horas',
    timestamp: new Date(Date.now() - 36000000),
  },
];

export const INITIAL_COMPANIES: Company[] = [
  { id: 'c1', name: 'Creative Tech Solutions', domain: 'creativetech.com', usersCount: 1450, registeredDate: '2026-06-10' },
  { id: 'c2', name: 'Natação Criativa Corp', domain: 'natacaocriativa.com.br', usersCount: 3200, registeredDate: '2026-03-12' },
  { id: 'c3', name: 'Acme Global Ventures', domain: 'acmeglobal.co', usersCount: 850, registeredDate: '2026-05-18' },
  { id: 'c4', name: 'Samba Coders SAS', domain: 'sambacoders.com.br', usersCount: 2100, registeredDate: '2026-04-01' },
];

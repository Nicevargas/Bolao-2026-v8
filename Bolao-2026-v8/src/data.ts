import { AuditLog } from './types';

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

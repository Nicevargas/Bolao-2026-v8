import { useState, useEffect } from 'react';
import { ActiveTab, Match, Participant, Company, AuditLog, AdminStats } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from './components/Header';

import { BottomNav } from './components/BottomNav';
import { DashboardView } from './components/DashboardView';
import { MatchesView } from './components/MatchesView';
import { LeaderboardView } from './components/LeaderboardView';
import { AdminView } from './components/AdminView';

import { SplashView } from './components/SplashView';
import { LoginView } from './components/LoginView';
import { InvitationView } from './components/InvitationView';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { 
  getSupabaseMatchesWithBets,
  getSupabaseLeaderboard,
  saveSupabaseBet,
  getSupabaseAuditLogs,
  createSupabaseAuditLog,
  syncOfficialMatchesToSupabase
} from './supabaseService';
import { 
  getActiveUser, 
  getMatchesWithParsedBets, 
  getParticipantsFromStored, 
  getStoredCompanies, 
  getStoredAuditLogs, 
  savePrediction,
  addInvitationCode,
  loginUser,
  registerUser,
  getStoredUsers,
  getStoredInvitations,
  updatePreference,
  saveStoredMatches,
  getStoredMatches,
  getStoredPredictions,
  recalculateEveryonePoints
} from './db';

export default function App() {
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [activeUser, setActiveUser] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  
  // Navigation tabs routing state
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);


  // Load database entities dynamically from active state triggers
  const [matches, setMatches] = useState<Match[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  
  const [xpPoints, setXpPoints] = useState<number>(1240);
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark' | 'system'>('dark');

  const isDBConnected = isSupabaseConfigured();

  // Re-sync states from persistent storage layer on user login / action
  const syncDatabaseStates = async () => {
    setIsSyncing(true);
    try {
      if (isDBConnected) {
        const activeId = localStorage.getItem('supabase_active_user_id');
        const email = localStorage.getItem('supabase_active_user_email');
        const fullName = localStorage.getItem('supabase_active_user_fullname');

        if (activeId && email) {
          // Retrieve real matches from Supabase
          const supMatches = await getSupabaseMatchesWithBets(activeId);
          // Retrieve real ranking
          const supLeaderboard = await getSupabaseLeaderboard(activeId);
          // Query live profiles to ensure active fields are synchronized
          const { data: dbProfile } = await supabase!
            .from('profiles')
            .select('*')
            .eq('id', activeId)
            .single();

          const activeParticipantObj = supLeaderboard.find(p => p.isUser);
          
          const reconciledUserObj = {
            id: activeId,
            name: dbProfile?.full_name || fullName || 'Participante',
            email: email,
            avatar: dbProfile?.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(dbProfile?.full_name || fullName || email)}`,
            points: activeParticipantObj ? activeParticipantObj.points : 0,
            exactCount: activeParticipantObj ? activeParticipantObj.exactCount : 0,
            winnerCount: activeParticipantObj ? activeParticipantObj.winnerCount : 0,
            themePreference: dbProfile?.theme_preference || 'dark',
            isAdmin: dbProfile?.role === 'admin' || email === '02nicevargas@gmail.com',
            role: dbProfile?.role || 'member'
          };

          setActiveUser(reconciledUserObj);
          setMatches(supMatches);
          setParticipants(supLeaderboard);
          setCompanies([]); // Suppress local companies as requested (use exclusively real)
          
          const supLogs = await getSupabaseAuditLogs();
          setAuditLogs(supLogs);
          setXpPoints(reconciledUserObj.points * 2 + 100);
          setCurrentTheme(reconciledUserObj.themePreference as any || 'dark');
        } else {
          setActiveUser(null);
        }
      } else {
        // Localstorage sandbox support
        const user = getActiveUser();
        setActiveUser(user);

        if (user) {
          setMatches(getMatchesWithParsedBets(user.id));
          setParticipants(getParticipantsFromStored());
          setCompanies(getStoredCompanies());
          
          // Map audit logs to typed list
          const logged = getStoredAuditLogs() || [];
          const transformed: AuditLog[] = logged.map((l: any, idx: number) => ({
            id: l.id || `log-${idx}`,
            type: (l.type || 'system') as any,
            title: l.title || 'Log de Transação',
            detail: l.detail || '',
            timeLabel: l.timeLabel || 'Alguns instantes atrás',
            timestamp: l.timestamp ? new Date(l.timestamp) : new Date()
          }));
          setAuditLogs(transformed);

          // Track xpPoints closely linked to score
          setXpPoints(user.points * 2 + 100);
          setCurrentTheme(user.themePreference || 'dark');
        }
      }
    } catch (err) {
      console.error('Failed state synchronisations:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Run initialization
  useEffect(() => {
    const bootstrap = async () => {
      if (isDBConnected) {
        await syncOfficialMatchesToSupabase();
      }
      
      await syncDatabaseStates();
    };
    bootstrap();
  }, []);

  // Supabase Real-time postgres_changes listener setup
  useEffect(() => {
    if (isDBConnected && supabase) {
      const channel = supabase.channel('realtime_bolao_db')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => {
          syncDatabaseStates();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bets' }, () => {
          syncDatabaseStates();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'rankings' }, () => {
          syncDatabaseStates();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
          syncDatabaseStates();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isDBConnected]);

  // Theme application logic
  useEffect(() => {
    const root = document.body;
    if (currentTheme === 'light') {
      root.classList.remove('dark-theme');
      root.classList.add('light-theme');
    } else if (currentTheme === 'dark') {
      root.classList.remove('light-theme');
      root.classList.add('dark-theme');
    } else {
      // follow device system
      const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
      if (darkQuery.matches) {
        root.classList.remove('light-theme');
        root.classList.add('dark-theme');
      } else {
        root.classList.remove('dark-theme');
        root.classList.add('light-theme');
      }
    }
  }, [currentTheme]);

  const handleThemeToggle = async (theme: 'light' | 'dark' | 'system') => {
    if (activeUser) {
      if (isDBConnected) {
        await supabase!
          .from('profiles')
          .update({ theme_preference: theme })
          .eq('id', activeUser.id);
      } else {
        updatePreference(activeUser.id, theme);
      }
    }
    setCurrentTheme(theme);
  };

  const handleUpdateAvatar = async (avatarUrl: string) => {
    if (!activeUser) return;

    if (isDBConnected) {
      const { error } = await supabase!
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', activeUser.id);

      if (error) {
        console.warn('Direct profile update failed, trying RPC:', error.message);
        const { error: rpcError } = await supabase!
          .rpc('update_my_avatar', {
            p_user_id: activeUser.id,
            p_avatar_url: avatarUrl
          });
        if (rpcError) {
          console.error('RPC avatar update also failed:', rpcError.message);
          throw new Error(rpcError.message);
        }
      }
    } else {
      const users = getStoredUsers();
      const updated = users.map((u: any) => {
        if (u.id === activeUser.id) {
          return { ...u, avatar: avatarUrl };
        }
        return u;
      });
      localStorage.setItem('bolao_users', JSON.stringify(updated));
    }

    await syncDatabaseStates();
  };

  // Authentication Callbacks
  const handleLoginSuccess = async (user: any) => {
    setActiveUser(user);
    if (!user.isAdmin) setIsAdminMode(false);
    await syncDatabaseStates();
  };

  const handleLogout = () => {
    localStorage.removeItem('supabase_active_user_id');
    localStorage.removeItem('supabase_active_user_email');
    localStorage.removeItem('supabase_active_user_fullname');
    localStorage.removeItem('bolao_active_user_id');
    setActiveUser(null);
    setIsAdminMode(false);
    setActiveTab('dashboard');
  };

  // Safe Prediction Trigger linked directly to persistent local simulation database
  const handleSavePrediction = async (matchId: string, scoreA: number, scoreB: number) => {
    if (!activeUser) return;

    if (isDBConnected) {
      const res = await saveSupabaseBet(activeUser.id, matchId, scoreA, scoreB);
      if (res.success) {
        await syncDatabaseStates();
        alert('Seu palpite foi gravado com sucesso no Supabase!');
      } else {
        alert(res.message);
      }
    } else {
      const res = savePrediction(activeUser.id, matchId, scoreA, scoreB);
      if (res.success) {
        // Append temporary transaction details to audit log
        const logs = JSON.parse(localStorage.getItem('bolao_audit_logs') || '[]');
        const targetMatch = getStoredMatches().find((m: any) => m.id === matchId);
        const teamAStr = targetMatch ? targetMatch.time_a : 'Time A';
        const teamBStr = targetMatch ? targetMatch.time_b : 'Time B';

        logs.unshift({
          id: `audit-${Date.now()}`,
          type: 'match',
          title: 'Novo Palpite Salvo',
          detail: `${activeUser.name} cadastrou palpite para Copa 2026: ${teamAStr} ${scoreA} x ${scoreB} ${teamBStr}.`,
          timeLabel: 'Agora mesmo',
          timestamp: new Date().toISOString()
        });
        localStorage.setItem('bolao_audit_logs', JSON.stringify(logs));
        
        syncDatabaseStates();
        alert('Seu palpite foi gravado com sucesso no servidor do Bolão!');
      } else {
        alert(res.message);
      }
    }
  };

  // Handles company workspace additions
  const handleAddCompany = (newComp: Omit<Company, 'id' | 'registeredDate'>) => {
    if (isDBConnected) {
      alert('Operação restrita para administrador diretamente via Painel do Supabase!');
      return;
    }
    const list = getStoredCompanies();
    const fresh: Company = {
      id: `comp-${Date.now()}`,
      name: newComp.name,
      domain: newComp.domain,
      usersCount: newComp.usersCount,
      registeredDate: new Date().toISOString().substring(0, 10),
      trendingStatus: 'up'
    };
    localStorage.setItem('bolao_companies', JSON.stringify([fresh, ...list]));

    // Register log trace
    const logs = JSON.parse(localStorage.getItem('bolao_audit_logs') || '[]');
    logs.unshift({
      id: `audit-${Date.now()}`,
      type: 'company',
      title: 'Espço de Trabalho Ativado',
      detail: `Corporação "${newComp.name}" liberou domínio @${newComp.domain} com ${newComp.usersCount} vagas corporativas.`,
      timeLabel: 'Agora mesmo',
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('bolao_audit_logs', JSON.stringify(logs));

    syncDatabaseStates();
  };

  // Telemetry properties aggregates
  const rawInvitations = getStoredInvitations();
  const rawCompanies = getStoredCompanies();
  const rawUsers = getStoredUsers();
  const rawPredictions = getStoredPredictions();

  const adminStats: AdminStats = {
    totalCompanies: isDBConnected ? 0 : rawCompanies.length,
    totalUsers: isDBConnected ? participants.length : rawUsers.length,
    activeBets: isDBConnected ? matches.filter(m => m.userBet !== undefined).length : rawPredictions.length,
    pendingResults: isDBConnected ? matches.filter(m => m.scoreA === undefined).length : getStoredMatches().filter((m: any) => m.status !== 'encerrado').length
  };


  // Main system renderer
  return (
    <>
      {/* 1. Branded Splash Screen */}
      <AnimatePresence>
        {showSplash && (
          <SplashView onDismiss={() => setShowSplash(false)} />
        )}
      </AnimatePresence>

      {/* 2. Login & Tabbed SignUp Auth */}
      {!activeUser ? (
        <LoginView onLoginSuccess={handleLoginSuccess} />
      ) : (
        <div className="min-h-screen bg-background text-on-background relative flex flex-col pt-20 pb-24 lg:pb-8">
          
          {/* Atmospheric fluid glowing effects */}
          <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden select-none">
            <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary/10 blur-[130px] rounded-full animate-pulse"></div>
            <div className="absolute bottom-[10%] left-[-5%] w-[30%] h-[30%] bg-secondary/10 blur-[110px] rounded-full"></div>
          </div>

          {/* Connected Brand Header */}
            <Header 
              activeTab={activeTab} 
              setActiveTab={setActiveTab} 
              xpPoints={xpPoints}
              isAdminMode={isAdminMode}
              setIsAdminMode={(v) => {
                const newVal = typeof v === 'boolean' ? v : !isAdminMode;
                if (newVal && !activeUser?.isAdmin) return;
                setIsAdminMode(newVal);
              }}
              activeUser={activeUser}
              onLogout={handleLogout}
              onThemeToggle={handleThemeToggle}
              onUpdateAvatar={handleUpdateAvatar}
              currentTheme={currentTheme}
            />

          {/* Dashboard Stage Workspace */}
          <div className="flex-1 w-full max-w-7xl mx-auto px-6 relative z-10 flex">
            {/* Stage content frame */}
            <div className="flex-grow py-6 transition-all">
              {isAdminMode && activeUser?.isAdmin ? (
                <AdminView 
                  stats={adminStats}
                  matches={matches}
                  onSyncComplete={syncDatabaseStates}
                />
              ) : (
                <>
                  {activeTab === 'dashboard' && (
                    <DashboardView 
                      setActiveTab={setActiveTab} 
                      matches={matches} 
                      participants={participants}
                      xpPoints={xpPoints}
                    />
                  )}
                  {activeTab === 'matches' && (
                    <MatchesView 
                      matches={matches} 
                      onSavePrediction={handleSavePrediction}
                      xpPoints={xpPoints}
                    />
                  )}
                  {activeTab === 'leaderboard' && (
                    <LeaderboardView participants={participants} />
                  )}
                  {activeTab === 'invitations' && (
                    <InvitationView />
                  )}

                </>
              )}
            </div>
          </div>

          {/* Bottom quick navigation mobile tab bar */}
          <BottomNav 
            activeTab={activeTab} 
            setActiveTab={setActiveTab}
            isAdminMode={isAdminMode}
            setIsAdminMode={(v) => {
              const newVal = typeof v === 'boolean' ? v : !isAdminMode;
              if (newVal && !activeUser?.isAdmin) return;
              setIsAdminMode(newVal);
            }}
          />
        </div>
      )}
    </>
  );
}

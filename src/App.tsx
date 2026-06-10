import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  Trophy,
  BarChart3,
  History,
  ChevronDown,
  Menu,
  X,
  Globe,
  User,
  LogOut
} from 'lucide-react';

import Login from './components/Login';
import EditProfileModal from './components/EditProfileModal';
import Dashboard from './components/Dashboard';
import Apostas from './components/Apostas';
import Ranking from './components/Ranking';
import Estatisticas from './components/Estatisticas';
import MeusPalpites from './components/MeusPalpites';
import PrivacyPolicyModal from './components/PrivacyPolicyModal';

import { Match, Participant, UserProfile } from './types';

// Fallback initial participants just in case API behaves unexpectedly
const defaultParticipants: Participant[] = [
  {
    rank: 1,
    name: 'Camila Lima',
    username: 'camis_lima',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC51EMHkXhwLsSNjr44kljRrs3Jn_GVgy0yF15ev1GhzxheBOpDcbGsWP90MdrvCO3Fh_Chbxi29HNWjILqXf14bWGPuIWqotGqyTNl_2lWDbRo6ZLY_y_wLeh1neFgiuIJbJY8203ZzBPim-neTAs4fB0VFHlHGbVgOkHcdiBcjLbiV2U_C-zerQm2bXKBJOPs0hTEw8Cwyx1aRhiRGzV52N_HzzUT5FzqerSu60ediDjvUVBzM3j4zxYDQtIwZIPRRmKeKFa9oz4',
    points: 1385,
    exacts: 18,
    accuracy: 92
  },
  {
    rank: 2,
    name: 'Felipe Souza',
    username: 'felipe.souza',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAeuJMB8vQa_0_uJNYvI4kzhQm_gBw5dqzj84p5ahEW-oqqzLZDTzpgKZhe9PfqGc9iBgXwWcu8EAPOtlufisiT1dImnChCI1fPW6ZHCap00no74cwsclK_H8i2Q2_CNfofSNeLbLAnOi4ENykypX_1c12Lp1uORyadN1LM68eMhi69MJRtatk1gmeY5V7ZEoOylA61Mdk5xA_3u99hURO0u1LEdP7kc-tRFIAwHJihTmYeJsZZKyTEsJCXTBxU5qgiEN4tVfucY_E',
    points: 1240,
    exacts: 12,
    accuracy: 85
  },
  {
    rank: 3,
    name: 'Rodrigo Alv.',
    username: 'rodrigo_alv',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAxEvsYlwgLBMD2KpgRK31nOuJ-b-iRr_pr-ywKXA-rH1J6LmGSg-deeKNbIfF3Pwd523ANr98xNo-e8AmFY1-Rw0Qoo-9vcprh_hgqiSdLNQOfCY8Smmpor79OQ0r3Q3roktaSX2ESra59MYpuZuXbxmtW-MVttNIVHTkO_Dbm0p-fMejd7gm93hq7Eb4OVXBDFATxMfY8uRY08C2-nOSSo6ge3ISrYtlBPeu78wWS9Mb-jqF9sUD1EsJSkMlLDMhOMkd8JNdbhrA',
    points: 1190,
    exacts: 9,
    accuracy: 78
  }
];

export default function App() {
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('bolao_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.email === 'string') {
          return { ...parsed, isLoggedIn: true };
        }
      } catch (e) {
        console.warn('Falha ao restaurar sessão de usuário local:', e);
      }
    }
    return {
      name: '',
      email: '',
      rank: 12,
      points: 0,
      exacts: 0,
      accuracy: 0,
      isLoggedIn: false
    };
  });

  const [matches, setMatches] = useState<Match[]>([]);
  const [standings, setStandings] = useState<any[]>([]);
  const [rankingList, setRankingList] = useState<Participant[]>([]);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // App configuration state checked from our backend api
  const [config, setConfig] = useState<{ supabase: boolean; footballData: boolean; supabaseUrl: string | null } | null>(null);
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);
  const [isLoadingStandings, setIsLoadingStandings] = useState(true);
  const [showHelperModal, setShowHelperModal] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // Fetch initial system configurations
  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch('/api/config-status');
        if (res.ok) {
          const status = await res.json();
          setConfig(status);
        }
      } catch (err) {
        console.error('Falha ao checar status de conexões:', err);
      }
    }
    loadConfig();
  }, []);

  // Fetch games, table standings, and general ranks
  useEffect(() => {
    async function fetchMatches() {
      setIsLoadingMatches(true);
      try {
        const res = await fetch('/api/matches');
        if (res.ok) {
          const data = await res.json();
          setMatches(data.matches || []);
        }
      } catch (err) {
        console.error('Falha ao obter jogos do servidor:', err);
      } finally {
        setIsLoadingMatches(false);
      }
    }

    async function fetchStandings() {
      setIsLoadingStandings(true);
      try {
        const res = await fetch('/api/standings');
        if (res.ok) {
          const data = await res.json();
          setStandings(data.standings || []);
        }
      } catch (err) {
        console.error('Falha ao obter tabela do servidor:', err);
      } finally {
        setIsLoadingStandings(false);
      }
    }

    fetchMatches();
    fetchStandings();
  }, [config]);

  // Sync user's guesses and unified participant ranks
  useEffect(() => {
    if (!user.isLoggedIn) return;

    async function fetchRanking() {
      try {
        const res = await fetch('/api/ranking');
        if (res.ok) {
          const data = await res.json();
          setRankingList(data.ranking || []);
        }
      } catch (err) {
        console.error('Falha ao carregar ranking:', err);
      }
    }

    async function fetchUserGuesses() {
      try {
        const response = await fetch(`/api/guesses?email=${encodeURIComponent(user.email)}`);
        if (response.ok) {
          const data = await response.json();
          const guesses = data.guesses || [];
          
          if (guesses.length > 0) {
            setMatches(prevMatches =>
              prevMatches.map(match => {
                const matchedGuess = guesses.find((g: any) => g.matchId === match.id);
                if (matchedGuess) {
                  return {
                    ...match,
                    userHomeScore: matchedGuess.homeScore,
                    userAwayScore: matchedGuess.awayScore
                  };
                }
                return match;
              })
            );
          }
        }
      } catch (err) {
        console.error('Falha ao sincronizar palpites:', err);
      }
    }

    fetchRanking();
    fetchUserGuesses();
  }, [user.isLoggedIn, user.email]);

  const handleStateMutated = () => {
    async function refreshAll() {
      try {
        const resConfig = await fetch('/api/config-status');
        if (resConfig.ok) {
          const status = await resConfig.json();
          setConfig(status);
        }
        
        const resMatches = await fetch('/api/matches');
        if (resMatches.ok) {
          const data = await resMatches.json();
          setMatches(data.matches || []);
        }

        const resStandings = await fetch('/api/standings');
        if (resStandings.ok) {
          const data = await resStandings.json();
          setStandings(data.standings || []);
        }

        const resRanking = await fetch('/api/ranking');
        if (resRanking.ok) {
          const data = await resRanking.json();
          setRankingList(data.ranking || []);
        }

        const responseGuesses = await fetch(`/api/guesses?email=${encodeURIComponent(user.email)}`);
        if (responseGuesses.ok) {
          const data = await responseGuesses.json();
          const guesses = data.guesses || [];
          if (guesses.length > 0) {
            setMatches(prevMatches =>
              prevMatches.map(match => {
                const matchedGuess = guesses.find((g: any) => g.matchId === match.id);
                if (matchedGuess) {
                  return {
                    ...match,
                    userHomeScore: matchedGuess.homeScore,
                    userAwayScore: matchedGuess.awayScore
                  };
                }
                return match;
              })
            );
          }
        }
      } catch (err) {
        console.error('Falha ao sincronizar dados recém-mutados via Chatbot:', err);
      }
    }
    refreshAll();
  };

  const handleLogin = (profile: UserProfile) => {
    setUser(profile);
    localStorage.setItem('bolao_user', JSON.stringify(profile));
  };

  const handleLogout = () => {
    setUser({
      name: '',
      email: '',
      rank: 12,
      points: 0,
      exacts: 0,
      accuracy: 0,
      isLoggedIn: false
    });
    localStorage.removeItem('bolao_user');
  };

  const handleSaveProfile = async (name: string, email: string) => {
    try {
      const res = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, nome: name })
      });
      if (!res.ok) {
        throw new Error('Falha de comunicação com o servidor.');
      }
      
      const nextUser = {
        ...user,
        name,
        email,
        isLoggedIn: true
      };
      setUser(nextUser);
      localStorage.setItem('bolao_user', JSON.stringify(nextUser));

      // Refresh data
      handleStateMutated();
    } catch (err: any) {
      console.error('Falha de sincronização de perfil:', err);
      throw err;
    }
  };

  const handleSaveGuess = async (matchId: string, homeScore: number, awayScore: number) => {
    // 1. Instantly write to client state to be snappy
    setMatches(prevMatches =>
      prevMatches.map(m =>
        m.id === matchId
          ? { ...m, userHomeScore: homeScore, userAwayScore: awayScore }
          : m
      )
    );

    // 2. Submit to backend API
    try {
      const response = await fetch('/api/guesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          userName: user.name,
          matchId,
          homeScore,
          awayScore
        })
      });

      if (response.ok) {
        const apiResponse = await response.json();
        if (apiResponse.success && apiResponse.updatedProfile) {
          const updated = {
            ...user,
            points: apiResponse.updatedProfile.points,
            exacts: apiResponse.updatedProfile.exacts,
            accuracy: apiResponse.updatedProfile.accuracy,
            rank: apiResponse.updatedProfile.rank
          };
          setUser(updated);
          localStorage.setItem('bolao_user', JSON.stringify(updated));
        }
      }
    } catch (err) {
      console.error('Falha ao enviar palpite ao servidor:', err);
    }
  };

  const handleCopySQL = () => {
    const sqlText = `-- Tabela de perfis do Bolão Copa 2026\nCREATE TABLE IF NOT EXISTS wc_profiles (\n  email TEXT PRIMARY KEY,\n  name TEXT NOT NULL,\n  avatar TEXT,\n  points INTEGER DEFAULT 0,\n  exacts INTEGER DEFAULT 0,\n  accuracy INTEGER DEFAULT 0,\n  rank INTEGER DEFAULT 1,\n  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())\n);\n\n-- Tabela de palpites do Bolão Copa 2026\nCREATE TABLE IF NOT EXISTS wc_guesses (\n  email TEXT NOT NULL,\n  match_id TEXT NOT NULL,\n  home_score INTEGER NOT NULL,\n  away_score INTEGER NOT NULL,\n  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),\n  PRIMARY KEY (email, match_id)\n);\n\n-- Ativar permissões de acesso público para simples homologação\nALTER TABLE wc_profiles ENABLE ROW LEVEL SECURITY;\nALTER TABLE wc_guesses ENABLE ROW LEVEL SECURITY;\n\nCREATE POLICY "Acesso público Geral wc_profiles" ON wc_profiles FOR ALL USING (true);\nCREATE POLICY "Acesso público Geral wc_guesses" ON wc_guesses FOR ALL USING (true);`;
    navigator.clipboard.writeText(sqlText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };



  if (!user.isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Apostas', icon: CalendarDays, label: 'Palpitar' },
    { name: 'Ranking', icon: Trophy, label: 'Líderes' },
    { name: 'Estatisticas', icon: BarChart3, label: 'Estatísticas' },
    { name: 'MeusPalpites', icon: History, label: 'Histórico' }
  ];

  return (
    <div className="bg-background text-on-background font-sans min-h-screen relative flex flex-col md:flex-row overflow-x-hidden">
      {/* Primary Left Navigation Drawer (Desktop) */}
      <aside className="hidden md:flex flex-col justify-between w-64 bg-[#041235] border-r border-white/5 z-20 shrink-0 sticky top-0 h-screen p-6">
        <div className="space-y-8">
          {/* Logo Brand Header */}
          <div className="flex flex-col gap-1">
            <img
              alt="Logo Bolão da Copa"
              referrerPolicy="no-referrer"
              className="w-48 h-auto drop-shadow-[0_0_15px_rgba(173,199,255,0.2)] rounded-xl"
              src="https://jgtjmuvadcbtmfjiiipv.supabase.co/storage/v1/object/public/imagens/1000529284.jpg"
            />
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    setActiveTab(item.name);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                    isActive
                      ? 'bg-secondary-container text-on-secondary-container shadow-lg shadow-pink-500/15'
                      : 'text-on-surface-variant hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon size={16} />
                  <span>{item.label || item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Profile editing button at the foot of aside */}
        <div className="pt-4 border-t border-white/5 space-y-2">
          <button
            onClick={() => setShowEditProfileModal(true)}
            className="w-full flex items-center gap-3 px-4 py-2.5 bg-pink-500/10 rounded-xl font-bold text-xs uppercase tracking-wider text-pink-400 hover:text-pink-300 hover:bg-pink-500/20 transition-all cursor-pointer border border-pink-500/20"
          >
            <User size={16} />
            <span>Editar perfil</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 bg-red-500/10 rounded-xl font-bold text-xs uppercase tracking-wider text-red-500 hover:text-red-400 hover:bg-red-500/20 transition-all cursor-pointer border border-red-500/20"
          >
            <LogOut size={16} />
            <span>Sair da conta</span>
          </button>
        </div>
      </aside>

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col min-w-0 z-10 relative pb-24 md:pb-8">
        {/* Top Header */}
        <header className="sticky top-0 bg-[#00103a]/80 backdrop-blur-md z-20 border-b border-white/5 h-16 flex items-center justify-between px-4 sm:px-6 md:px-10">
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="text-white hover:bg-white/5 p-2 rounded-lg transition-colors cursor-pointer"
            >
              <Menu size={24} />
            </button>
            <img
              alt="Logo Bolão da Copa"
              referrerPolicy="no-referrer"
              className="h-10 w-auto rounded-lg mx-2"
              src="https://jgtjmuvadcbtmfjiiipv.supabase.co/storage/v1/object/public/imagens/1000529284.jpg"
            />
          </div>

          <div className="hidden md:flex items-center gap-4">
            <span className="text-xs uppercase font-extrabold tracking-widest text-primary">
              Natação Criativa • Gerenciador de Jogos e Tabela
            </span>
          </div>

          {/* User Profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 hover:bg-white/5 px-3 py-1.5 rounded-full transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center bg-white/10 text-white">
                <User size={16} />
              </div>
              <span className="hidden sm:block text-xs font-bold text-white max-w-[110px] truncate">
                {user.name}
              </span>
              <ChevronDown size={14} className="text-on-surface-variant text-white/50" />
            </button>

            {dropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-48 bg-[#041235] border border-white/10 rounded-xl shadow-2xl py-1.5 text-left z-30 animate-in fade-in slide-in-from-top-1 duration-150"
                onMouseLeave={() => setDropdownOpen(false)}
              >
                <div className="px-4 py-2 border-b border-white/5">
                  <p className="text-xs font-bold text-white truncate">{user.name}</p>
                  <p className="text-[10px] text-on-surface-variant truncate">{user.email}</p>
                </div>
                <button
                  onClick={() => {
                    setActiveTab('MeusPalpites');
                    setDropdownOpen(false);
                  }}
                  className="w-full px-4 py-2 text-xs text-on-surface-variant hover:text-white hover:bg-white/5 transition-colors text-left font-semibold cursor-pointer"
                >
                  Meus Palpites
                </button>
                <button
                  onClick={() => {
                    setShowEditProfileModal(true);
                    setDropdownOpen(false);
                  }}
                  className="w-full px-4 py-2 text-xs text-pink-400 hover:text-pink-300 hover:bg-white/5 transition-colors text-left font-bold cursor-pointer border-b border-white/5"
                >
                  Editar Perfil
                </button>
                <button
                  onClick={() => {
                    handleLogout();
                    setDropdownOpen(false);
                  }}
                  className="w-full px-4 py-2 text-xs text-gray-400 hover:text-red-400 hover:bg-white/5 transition-colors text-left font-bold cursor-pointer"
                >
                  Sair da Conta
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Mobile Navigation Drawer Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 bg-black/60 z-30 md:hidden" onClick={() => setMobileMenuOpen(false)}>
            <aside
              className="w-64 bg-[#041235] h-full p-6 flex flex-col justify-between"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-8">
                <div className="flex justify-between items-center">
                  <img
                    alt="Logo"
                    referrerPolicy="no-referrer"
                    className="h-10 w-auto rounded-lg"
                    src="https://jgtjmuvadcbtmfjiiipv.supabase.co/storage/v1/object/public/imagens/1000529284.jpg"
                  />
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-on-surface-variant hover:text-white p-1 rounded transition-colors cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>

                <nav className="space-y-2">
                  {navItems.map(item => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.name;
                    return (
                      <button
                        key={item.name}
                        onClick={() => {
                          setActiveTab(item.name);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                          isActive
                            ? 'bg-secondary-container text-on-secondary-container'
                            : 'text-on-surface-variant hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <Icon size={18} />
                        <span>{item.label || item.name}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    setShowPrivacy(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-bold text-pink-400 hover:text-white uppercase tracking-wider transition-all cursor-pointer border border-pink-500/10"
                >
                  <Globe size={12} />
                  <span>Privacidade & LGPD</span>
                </button>

                <button
                  onClick={() => {
                    setShowEditProfileModal(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-3 bg-pink-500/10 hover:bg-pink-500/20 rounded-xl text-xs font-bold text-pink-400 hover:text-white uppercase tracking-wider transition-all cursor-pointer border border-pink-500/20"
                >
                  <User size={16} />
                  <span>Editar Perfil</span>
                </button>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-3 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-xs font-bold text-red-500 hover:text-white uppercase tracking-wider transition-all cursor-pointer border border-red-500/20"
                >
                  <LogOut size={16} />
                  <span>Sair da conta</span>
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* Warnings or configuration banners removed as requested */}

        {/* Main Routed Area */}
        <main className="flex-1 px-4 sm:px-6 md:px-10 py-8 max-w-7xl mx-auto w-full">
          {isLoadingMatches && activeTab !== 'Ranking' && (
            <div className="h-48 flex items-center justify-center text-center">
              <div className="w-8 h-8 border-4 border-t-primary border-white/10 rounded-full animate-spin"></div>
            </div>
          )}

          {!isLoadingMatches && (
            <>
              {activeTab === 'Dashboard' && <Dashboard user={user} matches={matches} onNavigate={setActiveTab} />}
              {activeTab === 'Apostas' && <Apostas matches={matches} onSaveGuess={handleSaveGuess} />}
              {activeTab === 'Ranking' && (
                <Ranking
                  participants={rankingList.length > 0 ? rankingList : defaultParticipants}
                  standings={standings}
                  isLoadingStandings={isLoadingStandings}
                  configStatus={config}
                />
              )}
              {activeTab === 'Estatisticas' && <Estatisticas />}
              {activeTab === 'MeusPalpites' && (
                <MeusPalpites user={user} matches={matches} onNavigate={setActiveTab} />
              )}
            </>
          )}
        </main>

        {/* Mobile Bottom Navigation Bar (as in markup layout) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#041235]/95 backdrop-blur-md border-t border-white/5 flex justify-around items-center px-2 z-20">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.name;
            return (
              <button
                key={item.name}
                onClick={() => setActiveTab(item.name)}
                className={`flex flex-col items-center justify-center flex-1 h-full select-none cursor-pointer ${
                  isActive ? 'text-secondary' : 'text-on-surface-variant'
                }`}
              >
                <Icon size={20} className={isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
                <span className="text-[10px] font-bold mt-1 tracking-tight select-none">
                  {item.label || item.name}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Privacy Policy Modal */}
      <PrivacyPolicyModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />

      {/* Profile Modification Modal (Bypassing login/register blocks) */}
      <EditProfileModal
        isOpen={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
        user={user}
        onSave={handleSaveProfile}
      />

    </div>
  );
}

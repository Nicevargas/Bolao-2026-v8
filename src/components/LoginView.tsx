import React, { useState } from 'react';
import { loginUser, registerUser, getStoredUsers, User } from '../db';
import { isSupabaseConfigured } from '../supabaseClient';
import { loginOrCreateSupabaseUser } from '../supabaseService';
import { motion } from 'motion/react';
import { Shield, Sparkles, Building2, UserPlus, KeyRound, Mail, CheckCircle } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCodeOrDomain, setInviteCodeOrDomain] = useState('NATACAO2026');
  const [errorStatus, setErrorStatus] = useState('');

  const isDBConnected = isSupabaseConfigured();
  const usersList = getStoredUsers();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    if (isDBConnected) {
      if (password.trim().length < 6) {
        setErrorStatus('A senha deve ter no mínimo 6 caracteres.');
        return;
      }
      setErrorStatus('');
      const res = await loginOrCreateSupabaseUser(email, '', false, password);
      if (res.success && res.user) {
        localStorage.setItem('supabase_active_user_id', res.user.id);
        localStorage.setItem('supabase_active_user_email', res.user.email);
        localStorage.setItem('supabase_active_user_fullname', res.user.name);
        onLoginSuccess(res.user);
      } else {
        setErrorStatus(res.message);
      }
    } else {
      const logged = loginUser(email);
      if (logged) {
        onLoginSuccess(logged);
      } else {
        setErrorStatus('E-mail não cadastrado. Vá até a aba "Cadastrar" para criar sua conta gratuitamente com seu domínio ou cupom!');
      }
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      setErrorStatus('Preencha os campos obrigatórios.');
      return;
    }

    if (isDBConnected) {
      if (password.trim().length < 6) {
        setErrorStatus('A senha deve ter no mínimo 6 caracteres para se cadastrar.');
        return;
      }
      setErrorStatus('');
      const res = await loginOrCreateSupabaseUser(email, name, true, password);
      if (res.success && res.user) {
        localStorage.setItem('supabase_active_user_id', res.user.id);
        localStorage.setItem('supabase_active_user_email', res.user.email);
        localStorage.setItem('supabase_active_user_fullname', res.user.name);
        onLoginSuccess(res.user);
      } else {
        setErrorStatus(res.message);
      }
    } else {
      const res = registerUser(name, email, inviteCodeOrDomain);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setErrorStatus(res.message);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[8888] bg-[#0c0f14] text-white flex items-center justify-center p-4 overflow-y-auto">
      {/* Decorative Orbs */}
      <div className="absolute top-10 right-10 w-96 h-96 bg-primary/20 blur-[130px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-secondary/15 blur-[110px] rounded-full pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#111622]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.5)] space-y-6"
      >
        {/* Natação Criativa Logo & Header */}
        <div className="text-center space-y-3 select-none">
          <div className="mx-auto w-24 h-24 rounded-full p-0.5 bg-gradient-to-tr from-primary to-secondary">
            <img 
              src="https://iowmvvoeecybxleoipfc.supabase.co/storage/v1/object/public/imagens/1000529284.jpg" 
              alt="Natação Criativa Logo" 
              className="w-full h-full object-cover rounded-full"
              referrerPolicy="no-referrer"
            />
          </div>
          <h2 className="font-headline text-2xl font-black text-on-surface uppercase tracking-tight">
            Bolão da Copa 2026
          </h2>
          <p className="text-xs text-[#9cb1cc] font-medium leading-normal">
            Faça seu palpite e vença prêmios incríveis com a Natação Criativa!
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-white/10 select-none">
          <button 
            onClick={() => { setTab('login'); setErrorStatus(''); }}
            className={`flex-1 pb-3 text-center text-xs font-bold font-headline uppercase border-b-2 transition-all ${
              tab === 'login' ? 'border-primary text-primary' : 'border-transparent text-[#9cb1cc]'
            }`}
          >
            ENTRAR
          </button>
          <button 
            onClick={() => { setTab('register'); setErrorStatus(''); }}
            className={`flex-1 pb-3 text-center text-xs font-bold font-headline uppercase border-b-2 transition-all ${
              tab === 'register' ? 'border-primary text-primary' : 'border-transparent text-[#9cb1cc]'
            }`}
          >
            CADASTRAR
          </button>
        </div>

        {/* Error notification */}
        {errorStatus && (
          <div className="bg-red-500/20 text-red-300 p-3 rounded-lg text-xs leading-normal font-sans border border-red-500/35">
            {errorStatus}
          </div>
        )}

        {/* Content Tabs */}
        {tab === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-primary uppercase tracking-widest block font-bold mb-1">
                Seu E-mail Cadastrado
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9cb1cc]" />
                <input 
                  type="email" 
                  required
                  placeholder="exemplo@natacaocriativa.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs focus:border-primary focus:ring-0 outline-none transition-all"
                />
              </div>
            </div>

            {isDBConnected && (
              <div className="space-y-1">
                <label className="text-[10px] font-black text-primary uppercase tracking-widest block font-bold mb-1">
                  Sua Senha de Acesso
                </label>
                <div className="relative">
                  <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9cb1cc]" />
                  <input 
                    type="password" 
                    required
                    placeholder="No mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs focus:border-primary focus:ring-0 outline-none transition-all"
                  />
                </div>
              </div>
            )}

            {/* Quick-select convenience for testing and metadata credentials */}
            <div className="pt-2">
              <span className="text-[9px] text-[#9cb1cc] block uppercase tracking-widest font-black mb-2">
                E-mails de Acesso Rápido para Teste:
              </span>
              <div className="flex flex-col gap-1.5">
                {usersList.map(u => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      setEmail(u.email);
                      if (isDBConnected) {
                        setPassword('bolao2026password!');
                      }
                    }}
                    className="w-full text-left bg-white/5 hover:bg-white/10 rounded-lg p-2 flex items-center justify-between text-[11px] font-medium text-slate-300 border border-white/5"
                  >
                    <span className="truncate">{u.email}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/20 text-primary uppercase font-bold">
                      {u.name.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <button 
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-primary to-secondary text-white font-headline text-xs font-black rounded-xl tracking-wider hover:brightness-110 active:scale-95 transition-all uppercase shadow-lg font-bold"
            >
              ACESSAR PAINEL
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-primary uppercase tracking-widest block font-bold mb-1">
                Nome Completo
              </label>
              <input 
                type="text" 
                required
                placeholder="Ex: Rodrigo Costa"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-xs focus:border-primary outline-none transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-primary uppercase tracking-widest block font-bold mb-1">
                Seu Melhor E-mail
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9cb1cc]" />
                <input 
                  type="email" 
                  required
                  placeholder="rodrigo@suaempresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs focus:border-primary outline-none transition-all"
                />
              </div>
              <span className="text-[9px] text-[#9cb1cc] block">
                Ao cadastrar com domínio corporativo verificado, você entra automaticamente na liga de sua empresa.
              </span>
            </div>

            {isDBConnected && (
              <div className="space-y-1">
                <label className="text-[10px] font-black text-primary uppercase tracking-widest block font-bold mb-1">
                  Crie sua Senha de Acesso
                </label>
                <div className="relative">
                  <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9cb1cc]" />
                  <input 
                    type="password" 
                    required
                    placeholder="Senha (mínimo 6 caracteres)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-black text-primary uppercase tracking-widest block font-bold mb-1">
                Código de Convite ou Domínio Corporativo
              </label>
              <div className="relative">
                <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9cb1cc]" />
                <input 
                  type="text" 
                  placeholder="Ex: NATACAO2026 ou corporativo"
                  value={inviteCodeOrDomain}
                  onChange={(e) => setInviteCodeOrDomain(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs focus:border-primary outline-none transition-all font-bold uppercase"
                />
              </div>
              <span className="text-[9px] text-[#9cb1cc] block">
                Utilize o código default <strong className="text-secondary select-all">NATACAO2026</strong> se não tiver um domínio corporativo cadastrado.
              </span>
            </div>

            <button 
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-primary to-secondary text-white font-headline text-xs font-black rounded-xl tracking-wider hover:brightness-110 active:scale-95 transition-all uppercase shadow-lg font-bold"
            >
              CRIAR CONTA E JOGAR
            </button>
          </form>
        )}

        <div className="pt-2 text-center text-[10px] text-on-surface-variant font-sans select-none opacity-60">
          Bolão Oficial • Copa do Mundo 2026
        </div>
      </motion.div>
    </div>
  );
};

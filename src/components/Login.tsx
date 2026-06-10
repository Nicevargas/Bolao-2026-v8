import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { UserProfile } from '../types';
import PrivacyPolicyModal from './PrivacyPolicyModal';

interface LoginProps {
  onLogin: (profile: UserProfile) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPrivacy, setShowPrivacy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isRegistering && !nome.trim()) {
      setError('Por favor, digite seu nome completo para realizar o cadastro.');
      return;
    }
    if (!email.trim()) {
      setError('Por favor, insira o seu e-mail.');
      return;
    }
    if (!password || password.length < 6) {
      setError('A senha precisa ter no mínimo 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const endpoint = isRegistering ? '/api/auth/signup' : '/api/auth/login';
      const payload = isRegistering 
        ? { email, password, nome }
        : { email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Ocorreu um erro ao processar sua solicitação.');
      }

      if (data.success && data.user) {
        onLogin(data.user);
      } else {
        throw new Error('Falha ao processar resposta de autenticação.');
      }
    } catch (err: any) {
      const msg = err.message || '';
      let translated = msg;
      
      const lower = msg.toLowerCase();
      if (lower.includes('invalid login credentials') || lower.includes('invalid_grant')) {
        translated = 'E-mail ou senha incorretos. Por favor, tente novamente.';
      } else if (lower.includes('user already registered') || lower.includes('already exists') || lower.includes('unique constraint')) {
        translated = 'Este e-mail já está cadastrado em nosso sistema.';
      } else if (lower.includes('password should be at least 6 characters')) {
        translated = 'A senha precisa ter no mínimo 6 caracteres.';
      } else if (lower.includes('email not confirmed')) {
        translated = 'O e-mail ainda não foi confirmado. Verifique sua caixa de entrada.';
      } else if (lower.includes('signup requires a valid password') || lower.includes('signup_requires_valid_password')) {
        translated = 'O cadastro exige uma senha válida de pelo menos 6 caracteres.';
      } else if (lower.includes('database error saving new user') || lower.includes('database_error')) {
        translated = 'Erro do banco de dados ao salvar o usuário (Database error saving new user). Isso geralmente é causado por um "trigger" ou função SQL incompatível no Supabase (por exemplo, ao tentar inserir em "participantes" ou "profiles" com colunas incorretas ou faltando). Verifique seus Triggers de Autenticação no painel do Supabase.';
      } else if (lower.includes('failed to fetch') || lower.includes('networkerror') || lower.includes('fetch failed')) {
        translated = 'Erro de conexão com o servidor. Verifique sua internet.';
      } else if (lower.includes('user not found')) {
        translated = 'Nenhum usuário cadastrado com este e-mail.';
      } else if (!translated) {
        translated = 'Houve uma falha inesperada na autenticação. Tente novamente.';
      }

      setError(translated);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#00103a] text-on-background font-body-md min-h-screen flex flex-col justify-center items-center px-4">
      {/* Main Content Wrapper */}
      <main className="relative z-10 w-full max-w-md py-8 flex flex-col items-center">
        
        {/* Brand Logo Area */}
        <div className="mb-6 transition-transform duration-500 hover:scale-[1.03]">
          <img
            alt="Bolão da Copa Natação Criativa Logo"
            referrerPolicy="no-referrer"
            className="w-48 md:w-56 h-auto drop-shadow-[0_0_20px_rgba(173,199,255,0.25)] rounded-2xl"
            src="https://zybwsvkeftolvkcarnep.supabase.co/storage/v1/object/public/imagens/bolao2026.jpeg"
          />
        </div>

        {/* Glassmorphic Auth Card */}
        <section className="glass-card w-full rounded-2xl p-6 md:p-8 shadow-2xl relative border border-white/10 bg-[#041235]/80 backdrop-blur-md">
          <header className="text-center mb-6">
            <h1 className="font-headline-md text-2xl text-white mb-1.5 font-bold tracking-tight">
              {isRegistering ? 'Criar Nova Conta' : 'Acessar Conta'}
            </h1>
            <p className="text-xs text-on-surface-variant font-medium">
              {isRegistering 
                ? 'Insira seus dados para registrar palpites reais' 
                : 'Insira seu email e senha de acesso'}
            </p>
          </header>

          {error && (
            <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs text-center font-bold animate-in fade-in slide-in-from-top-1">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field (Sign-up only) */}
            {isRegistering && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                <label className="block text-[10px] font-extrabold text-on-surface-variant uppercase tracking-wider px-1" htmlFor="nome">
                  Nome Completo
                </label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">
                    <User size={18} />
                  </span>
                  <input
                    id="nome"
                    type="text"
                    required
                    placeholder="Seu nome no Ranking"
                    className="w-full h-11 bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 text-xs text-white placeholder:text-on-surface-variant/40 transition-all focus:bg-white/10 focus:outline-none focus:border-pink-500/50"
                    value={nome}
                    onChange={(e) => {
                      setNome(e.target.value);
                      setError('');
                    }}
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-extrabold text-on-surface-variant uppercase tracking-wider px-1" htmlFor="email">
                Email / Usuário
              </label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">
                  <Mail size={18} />
                </span>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="seu@email.com"
                  className="w-full h-11 bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 text-xs text-white placeholder:text-on-surface-variant/40 transition-all focus:bg-white/10 focus:outline-none focus:border-pink-500/50"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="block text-[10px] font-extrabold text-on-surface-variant uppercase tracking-wider" htmlFor="password">
                  Senha
                </label>
              </div>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">
                  <Lock size={18} />
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Mínimo 6 dígitos"
                  className="w-full h-11 bg-white/5 border border-white/10 rounded-xl pl-11 pr-12 text-xs text-white placeholder:text-on-surface-variant/40 transition-all focus:bg-white/10 focus:outline-none focus:border-pink-500/50"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 mt-2 bg-secondary-container text-on-secondary-container font-black text-xs uppercase tracking-wider rounded-inner transition-all transform active:scale-95 neon-glow-pink hover:bg-secondary-container/90 flex items-center justify-center space-x-2 group cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Processando...</span>
                </>
              ) : (
                <>
                  <span>{isRegistering ? 'Confirmar Cadastro' : 'Entrar no Bolão'}</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Spacer */}
          <div className="mt-6 pt-5 border-t border-white/5 text-center">
            <button
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError('');
              }}
              className="text-xs text-pink-400 hover:text-pink-300 font-bold transition-colors cursor-pointer"
            >
              {isRegistering 
                ? 'Já possui uma conta? Faça seu login' 
                : 'Não tem uma conta cadastrada? Cadastre-se'}
            </button>
          </div>
        </section>

        {/* Footer info showing security */}
        <footer className="mt-6 text-center space-y-2 select-none">
          <p className="text-[10px] text-gray-400 font-medium flex items-center justify-center gap-1">
            <Sparkles size={12} className="text-yellow-400" />
            <span>Sua conta e seus palpites são armazenados com segurança.</span>
          </p>
          <div className="flex justify-center space-x-4 text-[10px] text-on-surface-variant opacity-60">
            <button 
              type="button"
              onClick={() => setShowPrivacy(true)}
              className="hover:text-white hover:opacity-100 transition-opacity cursor-pointer bg-none border-none p-0"
            >
              Termos de Uso
            </button>
            <span className="text-white/20 select-none">|</span>
            <button 
              type="button"
              onClick={() => setShowPrivacy(true)}
              className="hover:text-white hover:opacity-100 transition-opacity cursor-pointer bg-none border-none p-0"
            >
              Privacidade
            </button>
          </div>
        </footer>
      </main>

      <PrivacyPolicyModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />
    </div>
  );
}

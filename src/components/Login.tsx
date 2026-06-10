import React, { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { UserProfile } from '../types';

interface LoginProps {
  onLogin: (profile: UserProfile) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('E-mail e senha são obrigatórios.');
      return;
    }

    if (isRegistering && !nome.trim()) {
      setError('O nome é obrigatório para cadastro.');
      return;
    }

    setLoading(true);
    try {
      const endpoint = isRegistering ? '/api/auth/signup' : '/api/auth/login';
      const body = isRegistering
        ? { nome: nome.trim(), email: email.trim(), password }
        : { email: email.trim(), password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      let data: any;
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch (_) {
        throw new Error('Falha de resposta do servidor.');
      }

      if (!res.ok) {
        throw new Error(data.error || 'Ocorreu um erro ao processar a requisição.');
      }

      if (data.success && data.user) {
        onLogin({
          name: data.user.name,
          email: data.user.email,
          points: data.user.points ?? 0,
          exacts: data.user.exacts ?? 0,
          accuracy: data.user.accuracy ?? 0,
          rank: data.user.rank ?? 12,
          isLoggedIn: true
        });
      } else {
        throw new Error('Retorno inválido do servidor.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020a1e] flex flex-col items-center justify-center p-4 selection:bg-pink-500 selection:text-white">
      {/* Background ambient light */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] md:w-[500px] h-[350px] md:h-[500px] bg-pink-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md z-10 transition-all duration-300 transform scale-100 ease-out">
        {/* Brand Logo & Presentation */}
        <div className="flex flex-col items-center mb-8 text-center animate-in fade-in slide-in-from-top-4 duration-300">
          <img
            alt="Logo Bolão da Copa"
            referrerPolicy="no-referrer"
            className="w-40 h-auto drop-shadow-[0_0_20px_rgba(173,199,255,0.25)] rounded-2xl border border-white/5 mb-4"
            src="https://zybwsvkeftolvkcarnep.supabase.co/storage/v1/object/public/imagens/bolao2026.jpeg"
          />
          <h2 className="text-sm font-extrabold tracking-widest text-pink-400 uppercase mt-1">
            Bolão Oficial Copa 2026
          </h2>
          <p className="text-xs text-gray-400 mt-1 max-w-xs">
            Faça parte, registre seus palpites e mostre que você domina as estatísticas!
          </p>
        </div>

        {/* Card Component */}
        <div className="bg-[#041235]/95 border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
          
          <header className="mb-6 text-center">
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              {isRegistering ? 'Criar sua Conta' : 'Acesse o Bolão'}
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              {isRegistering 
                ? 'Preencha os campos abaixo para participar' 
                : 'Insira suas credenciais cadastradas'}
            </p>
          </header>

          {error && (
            <div className="mb-4 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs text-center font-bold animate-in fade-in duration-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campo Nome (Apenas Cadastro) */}
            {isRegistering && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                <label className="block text-[10px] font-extrabold text-gray-300 uppercase tracking-wider pl-1" htmlFor="nome">
                  Nome Completo
                </label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-pink-400 transition-colors">
                    <User size={18} />
                  </span>
                  <input
                    id="nome"
                    type="text"
                    required
                    placeholder="Como quer ser chamado no Ranking"
                    className="w-full h-11 bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 text-xs text-white placeholder:text-gray-500 transition-all focus:bg-white/10 focus:outline-none focus:border-pink-500/50"
                    value={nome}
                    onChange={(e) => {
                      setNome(e.target.value);
                      setError('');
                    }}
                  />
                </div>
              </div>
            )}

            {/* Campo E-mail */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-extrabold text-gray-300 uppercase tracking-wider pl-1" htmlFor="email">
                E-mail
              </label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-pink-400 transition-colors">
                  <Mail size={18} />
                </span>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="exemplo@email.com"
                  className="w-full h-11 bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 text-xs text-white placeholder:text-gray-500 transition-all focus:bg-white/10 focus:outline-none focus:border-pink-500/50"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-extrabold text-gray-300 uppercase tracking-wider pl-1" htmlFor="password">
                Senha
              </label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-pink-400 transition-colors">
                  <Lock size={18} />
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder={isRegistering ? 'Escolha uma senha de acesso' : 'Insira sua senha'}
                  className="w-full h-11 bg-white/5 border border-white/10 rounded-xl pl-11 pr-12 text-xs text-white placeholder:text-gray-500 transition-all focus:bg-white/10 focus:outline-none focus:border-pink-500/50"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all transform active:scale-[0.98] cursor-pointer flex items-center justify-center space-x-2 shadow-lg shadow-pink-500/20 mt-6"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Processando...</span>
                </>
              ) : (
                <>
                  <span>{isRegistering ? 'Finalizar Cadastro' : 'Entrar no Bolão'}</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Separation Divider */}
          <div className="mt-6 pt-5 border-t border-white/5 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError('');
                setNome('');
                setEmail('');
                setPassword('');
              }}
              className="text-xs text-pink-400 hover:text-pink-300 font-bold transition-colors cursor-pointer"
            >
              {isRegistering 
                ? 'Já possui uma conta? Faça seu login' 
                : 'Não tem uma conta cadastrada? Crie agora mesmo'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

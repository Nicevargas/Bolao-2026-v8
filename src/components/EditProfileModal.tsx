import React, { useState } from 'react';
import { User, Mail, ShieldCheck, X, Check } from 'lucide-react';
import { UserProfile } from '../types';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onSave: (name: string, email: string) => Promise<void>;
}

export default function EditProfileModal({ isOpen, onClose, user, onSave }: EditProfileModalProps) {
  const [nome, setNome] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!nome.trim()) {
      setError('Por favor, preencha o seu nome.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Por favor, informe um e-mail válido.');
      return;
    }

    setLoading(true);
    try {
      await onSave(nome.trim(), email.trim());
      setSuccess('Perfil atualizado com sucesso!');
      setTimeout(() => {
        onClose();
        setSuccess('');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar perfil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-[#041235] border border-white/10 rounded-3xl w-full max-w-md flex flex-col overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-pink-500/10 text-pink-400 rounded-xl">
              <User size={22} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Editar Perfil</h2>
              <p className="text-[10px] text-pink-400 font-extrabold uppercase tracking-wider mt-0.5">Identidade no Bolão</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold text-center">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-xs font-bold text-center flex items-center justify-center gap-2">
              <Check size={14} />
              <span>{success}</span>
            </div>
          )}

          {/* Name field */}
          <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
            <label className="block text-[10px] font-extrabold text-on-surface-variant uppercase tracking-wider px-1" htmlFor="profile-nome">
              Nome Completo
            </label>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-pink-500 transition-colors">
                <User size={18} />
              </span>
              <input
                id="profile-nome"
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

          {/* Email field */}
          <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
            <label className="block text-[10px] font-extrabold text-on-surface-variant uppercase tracking-wider px-1" htmlFor="profile-email">
              E-mail de Cadastro
            </label>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-pink-500 transition-colors">
                <Mail size={18} />
              </span>
              <input
                id="profile-email"
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

          <div className="text-[10px] text-gray-500 leading-relaxed px-1">
            <strong>Dica:</strong> Alterar seu e-mail irá conectar a sua sessão a outra pessoa no placar de líderes ou iniciar uma nova do zero. Seus palpites acompanham seu e-mail correspondente.
          </div>

          {/* Action buttons */}
          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-white/10 hover:bg-white/5 text-xs text-white uppercase rounded-xl tracking-wider transition-all cursor-pointer font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-secondary hover:bg-pink-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all hover:scale-[1.02] active:scale-98 cursor-pointer shadow-lg shadow-pink-500/10 flex items-center gap-1.5"
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}

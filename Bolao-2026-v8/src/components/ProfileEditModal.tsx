import React, { useState } from 'react';
import { X, RefreshCw, Check, Link, Image } from 'lucide-react';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar: string;
  onSave: (avatarUrl: string) => Promise<void>;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  isOpen,
  onClose,
  currentAvatar,
  onSave,
}) => {
  const [avatarUrl, setAvatarUrl] = useState(currentAvatar);
  const [isSaving, setIsSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentAvatar);
  const [imgError, setImgError] = useState(false);

  const generateRandomSeed = () => {
    const adjectives = ['Feliz', 'Bravo', 'Esperto', 'Calmo', 'Rapido', 'Forte', 'Gentil', 'Alegre', 'Sabio', 'Criativo', 'Ousado', 'Leal', 'Justo', 'Paciente', 'Corajoso', 'Divertido', 'Misterioso', 'Radiante', 'Sereno', 'Valente'];
    const nouns = ['Tigre', 'Dragao', 'Fenix', 'Lobo', 'Agua', 'Fogo', 'Raio', 'Sol', 'Lua', 'Estrela', 'Tornado', 'Mar', 'Montanha', 'Rio', 'Floresta', 'Templo', 'Mago', 'Guerreiro', 'Guardiao', 'Pirata'];
    const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    const num = Math.floor(Math.random() * 999);
    return `${randomAdj}${randomNoun}${num}`;
  };

  const handleRandomize = () => {
    const seed = generateRandomSeed();
    const newUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(seed)}`;
    setAvatarUrl(newUrl);
    setPreviewUrl(newUrl);
    setImgError(false);
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value.trim();
    setAvatarUrl(url);
    if (url) {
      setPreviewUrl(url);
    }
    setImgError(false);
  };

  const handleSave = async () => {
    if (!avatarUrl) return;
    setIsSaving(true);
    try {
      await onSave(avatarUrl);
      onClose();
    } catch (err) {
      console.error('Erro ao salvar avatar:', err);
      alert('Erro ao salvar avatar. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass-card rounded-2xl border border-white/10 p-6 w-full max-w-md mx-auto shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-black uppercase font-headline text-on-surface">Editar Avatar</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-on-surface-variant hover:text-on-surface transition-all rounded-lg hover:bg-white/5 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex justify-center mb-6">
          <div className="w-28 h-28 rounded-full border-4 border-primary/30 overflow-hidden bg-black/20">
            {imgError ? (
              <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                <Image size={32} />
              </div>
            ) : (
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            )}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-bold uppercase tracking-wide text-on-surface-variant mb-1.5">
            URL da Imagem
          </label>
          <div className="flex items-center gap-2 bg-black/20 rounded-lg border border-white/10 px-3 py-2">
            <Link size={14} className="text-on-surface-variant shrink-0" />
            <input
              type="text"
              value={avatarUrl}
              onChange={handleUrlChange}
              placeholder="https://exemplo.com/avatar.jpg"
              className="bg-transparent text-xs text-on-surface w-full outline-none placeholder:text-on-surface-variant/40"
            />
          </div>
        </div>

        <div className="mb-6">
          <button
            onClick={handleRandomize}
            className="w-full flex items-center justify-center gap-2 bg-secondary/10 hover:bg-secondary/20 text-secondary font-bold text-xs uppercase tracking-wide rounded-lg px-4 py-2.5 transition-all border border-secondary/20 cursor-pointer"
          >
            <RefreshCw size={14} />
            Gerar Novo Avatar Aleatório
          </button>
          <p className="text-[10px] text-on-surface-variant/60 text-center mt-1.5">
            Gera um avatar estilizado automaticamente
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-xs font-bold uppercase rounded-lg border border-white/10 text-on-surface-variant hover:bg-white/5 transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !avatarUrl}
            className="flex-1 px-4 py-2.5 text-xs font-bold uppercase rounded-lg bg-primary text-white hover:bg-primary/80 transition-all disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {isSaving ? (
              'Salvando...'
            ) : (
              <><Check size={14} /> Salvar</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};


import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../types';

interface ProfileModalProps {
  user: UserProfile;
  onClose: () => void;
  onUpdate: (updatedData: Partial<UserProfile>, file?: File) => Promise<void>;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    display_name: user.display_name || '',
    phone: user.phone || '',
    taxId: user.taxId || '',
    avatar_url: user.avatar_url || ''
  });
  const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormData({
      display_name: user.display_name || '',
      phone: user.phone || '',
      taxId: user.taxId || '',
      avatar_url: user.avatar_url || ''
    });
  }, [user]);

  const handleImageClick = () => {
    if (showSuccess) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Imagem muito grande. Escolha uma foto menor que 2MB.");
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    
    setIsSaving(true);
    try {
      await onUpdate(formData, selectedFile);
      setShowSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error: any) {
      alert(`Erro ao atualizar: ${error.message || "Tente novamente."}`);
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="glass w-full max-w-md p-8 rounded-[3rem] border-slate-800 space-y-6 animate-in zoom-in duration-300 relative overflow-hidden shadow-2xl">
        
        {showSuccess && (
          <div className="absolute inset-0 z-20 bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 animate-in fade-in duration-500">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-green-500/20">
              <i className="fa-solid fa-check text-white text-3xl"></i>
            </div>
            <h3 className="text-2xl font-black text-white mb-2 uppercase">Atualizado!</h3>
            <p className="text-slate-400 text-sm">Seus dados VIP foram salvos.</p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-white tracking-tight">Dados de Membro</h2>
          <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:text-white transition-all">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        <div className="flex flex-col items-center space-y-3 pb-2">
          <div 
            onClick={handleImageClick}
            className="group relative w-24 h-24 rounded-3xl overflow-hidden cursor-pointer ring-4 ring-indigo-600/30 hover:ring-indigo-500 transition-all bg-slate-800 flex items-center justify-center"
          >
            {formData.avatar_url ? (
              <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover group-hover:opacity-50 transition-opacity" />
            ) : (
              <i className="fa-solid fa-user text-3xl text-slate-500"></i>
            )}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40">
              <i className="fa-solid fa-camera text-white text-xl"></i>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome Completo</label>
            <input
              type="text"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none transition-all font-medium"
              value={formData.display_name}
              onChange={e => setFormData({ ...formData, display_name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">WhatsApp</label>
            <input
              type="text"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none transition-all font-medium"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(00) 00000-0000"
            />
          </div>

          <button
            disabled={isSaving}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
          >
            {isSaving ? <i className="fa-solid fa-spinner fa-spin"></i> : "Salvar Alterações"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileModal;


import React, { useState, useEffect } from 'react';
import { CreditPackage, PaymentResponse, UserProfile } from '../types';
import { supabase } from '../lib/supabase';

interface CreditStoreProps {
  user: UserProfile;
  onPaymentSuccess: () => void;
}

const CreditStore: React.FC<CreditStoreProps> = ({ user, onPaymentSuccess }) => {
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [loadingPurchase, setLoadingPurchase] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [pendingPkg, setPendingPkg] = useState<CreditPackage | null>(null);
  const [profileData, setProfileData] = useState({
    display_name: user.display_name || '',
    email: user.email || '',
    taxId: user.taxId || '',
    phone: user.phone || ''
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  useEffect(() => {
    fetchPackages();
  }, []);

  useEffect(() => {
    setProfileData({
      display_name: user.display_name || '',
      email: user.email || '',
      taxId: user.taxId || '',
      phone: user.phone || ''
    });
  }, [user]);

  const fetchPackages = async () => {
    try {
      setLoadingPackages(true);
      const { data, error } = await supabase
        .from('credit_packages')
        .select('*')
        .eq('tipo_acesso', 3)
        .order('price', { ascending: true });

      if (error) throw error;
      
      const mappedPackages = (data || []).map((pkg: any) => ({
        id: pkg.id,
        name: pkg.name,
        price: Number(pkg.price),
        credits: Number(pkg.credits) || 0,
        popular: pkg.popular,
        bestValue: pkg.best_value
      }));

      setPackages(mappedPackages);
      
      const initialQuantities: Record<string, number> = {};
      mappedPackages.forEach(pkg => {
        initialQuantities[pkg.id] = 1;
      });
      setQuantities(initialQuantities);
    } catch (err) {
      console.error("Error fetching packages:", err);
    } finally {
      setLoadingPackages(false);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setQuantities(prev => ({
      ...prev,
      [id]: Math.max(1, (prev[id] || 1) + delta)
    }));
  };

  const checkDataComplete = () => {
    return (
      profileData.display_name.trim() !== '' &&
      profileData.email.trim() !== '' &&
      profileData.taxId.trim() !== '' &&
      profileData.phone.trim() !== ''
    );
  };

  const handlePurchase = async (pkg: CreditPackage) => {
    if (!checkDataComplete()) {
      setPendingPkg(pkg);
      setIsDataModalOpen(true);
      return;
    }

    const qty = quantities[pkg.id] || 1;
    setLoadingPurchase(pkg.id);
    
    try {
      const valorTotal = pkg.price * qty;
      const quantidadeTotal = pkg.credits * qty;

      const payload = {
        nome: profileData.display_name,
        email: profileData.email,
        tax_id: profileData.taxId,
        valor: valorTotal,
        descricao: `${pkg.name} (${quantidadeTotal} créditos)`,
        user_id: user.id,
        telefone: profileData.phone
      };

      console.log("[CreditStore] Webhook Payload Verificado:", payload);

      const response = await fetch('https://n8n-n8n.6wqa93.easypanel.host/webhook/pgtosite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Erro ao processar pagamento');
      
      const data = await response.json();
      setPaymentData(data);
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar cobrança.');
    } finally {
      setLoadingPurchase(null);
    }
  };

  const handleUpdateProfileAndPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkDataComplete()) {
      alert("Preencha todos os campos.");
      return;
    }

    setIsUpdatingProfile(true);
    try {
      if (!user.isMock) {
        const { error } = await supabase
          .from('profiles')
          .update({
            display_name: profileData.display_name,
            phone: profileData.phone,
            tax_id: profileData.taxId,
            email: profileData.email
          })
          .eq('id', user.id);
        
        if (error) throw error;
      }

      // FECHAR MODAL IMEDIATAMENTE ANTES DE CHAMAR O PAGAMENTO
      setIsDataModalOpen(false);
      if (pendingPkg) {
        handlePurchase(pendingPkg);
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar perfil.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const copyToClipboard = () => {
    if (paymentData?.qrcode) {
      navigator.clipboard.writeText(paymentData.qrcode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loadingPackages) {
    return (
      <div className="flex flex-col items-center justify-center py-32 animate-pulse">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Carregando planos...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700">
      <div className="text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-2">
          <i className="fa-solid fa-shield-check"></i>
          Liberação Imediata via PIX
        </div>
        <h2 className="text-4xl md:text-5xl font-black text-white">
          Escolha seu <span className="gradient-text">Plano de Créditos</span>
        </h2>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Adquira créditos para liberar vídeos na galeria ou gerar produções exclusivas com IA.
        </p>
      </div>

      {!paymentData ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {packages.map((pkg) => {
            const qty = quantities[pkg.id] || 1;
            const totalPrice = pkg.price * qty;
            const totalCredits = pkg.credits * qty;

            return (
              <div 
                key={pkg.id}
                className={`relative glass p-8 rounded-[3rem] flex flex-col items-center text-center space-y-8 border-2 transition-all duration-300 hover:translate-y-[-8px] shadow-2xl ${
                  pkg.popular ? 'border-indigo-500 bg-indigo-500/10 shadow-indigo-500/20' : 
                  pkg.bestValue ? 'border-pink-500 bg-pink-500/10 shadow-pink-500/20' : 
                  'border-slate-800 hover:border-slate-700'
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-black px-6 py-2 rounded-full uppercase tracking-widest shadow-xl ring-4 ring-slate-950">
                    🔥 Mais Escolhido
                  </div>
                )}
                {pkg.bestValue && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-pink-600 text-white text-[10px] font-black px-6 py-2 rounded-full uppercase tracking-widest shadow-xl ring-4 ring-slate-950">
                    💎 Alta Performance
                  </div>
                )}

                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-white">{pkg.name}</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                    {pkg.price === 10 ? 'Uso Público' : pkg.price === 50 ? 'Uso Exclusivo' : 'Acesso Profissional'}
                  </p>
                </div>

                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-2">
                    <i className="fa-solid fa-coins text-yellow-400 text-2xl"></i>
                    <span className="text-5xl font-black text-white tracking-tighter">{totalCredits}</span>
                  </div>
                </div>

                <div className="w-full bg-slate-900/50 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <button onClick={() => updateQuantity(pkg.id, -1)} className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors">
                    <i className="fa-solid fa-minus text-xs"></i>
                  </button>
                  <span className="text-sm font-bold text-slate-400">{qty} Un.</span>
                  <button onClick={() => updateQuantity(pkg.id, 1)} className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors">
                    <i className="fa-solid fa-plus text-xs"></i>
                  </button>
                </div>

                <div className="space-y-4 w-full">
                  <div className="flex flex-col">
                    <span className="text-4xl font-black text-white">R$ {totalPrice.toFixed(2).replace('.', ',')}</span>
                    <span className="text-[9px] text-emerald-400 font-black uppercase tracking-widest mt-1">Pagamento Único PIX</span>
                  </div>
                  
                  <button 
                    onClick={() => handlePurchase(pkg)}
                    disabled={!!loadingPurchase}
                    className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${
                      pkg.popular ? 'bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/30' : 
                      pkg.bestValue ? 'bg-pink-600 hover:bg-pink-500 shadow-xl shadow-pink-600/30' : 
                      'bg-slate-700 hover:bg-slate-600 shadow-lg'
                    }`}
                  >
                    {loadingPurchase === pkg.id ? (
                      <i className="fa-solid fa-spinner fa-spin text-xl"></i>
                    ) : (
                      <>
                        <i className="fa-brands fa-pix text-lg"></i>
                        Pagar com PIX
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="max-w-md mx-auto glass p-10 rounded-[3.5rem] border-2 border-indigo-500/50 text-center space-y-8 animate-in zoom-in duration-500">
          <div className="space-y-3">
            <div className="w-16 h-16 bg-indigo-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-500/30">
              <i className="fa-brands fa-pix text-3xl text-indigo-400"></i>
            </div>
            <h3 className="text-3xl font-black text-white">Quase lá!</h3>
            <p className="text-sm text-slate-400 leading-relaxed px-4">
              Efetue o pagamento via PIX para que seus créditos sejam liberados automaticamente.
            </p>
          </div>

          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative bg-white p-5 rounded-[2rem] mx-auto w-fit">
              <img src={paymentData.img_qrcode} alt="QR Code PIX" className="w-56 h-56" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col p-5 bg-slate-900/80 rounded-3xl border border-slate-800 text-center">
              <span className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] mb-1">Total a Pagar</span>
              <span className="text-3xl font-black text-green-400 tracking-tighter">
                R$ {paymentData.valor.toFixed(2).replace('.', ',')}
              </span>
            </div>

            <button 
              onClick={copyToClipboard}
              className={`w-full py-4 rounded-2xl border-2 font-black text-xs uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all duration-300 ${
                copied ? 'border-green-500 text-green-400 bg-green-500/10' : 'border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-800/50'
              }`}
            >
              <i className={`fa-solid ${copied ? 'fa-check-double scale-125' : 'fa-copy'}`}></i>
              {copied ? 'Código Copiado!' : 'Copiar Código PIX'}
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <button 
              onClick={() => setPaymentData(null)}
              className="text-xs text-slate-500 hover:text-white transition-colors font-bold uppercase tracking-widest"
            >
              Voltar aos pacotes
            </button>
            <div className="pt-6 border-t border-slate-800/50">
              <div className="flex items-center justify-center gap-3">
                <div className="relative w-2 h-2">
                  <div className="absolute inset-0 bg-yellow-500 rounded-full animate-ping opacity-75"></div>
                  <div className="relative w-2 h-2 bg-yellow-500 rounded-full"></div>
                </div>
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Aguardando Confirmação</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {isDataModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="glass w-full max-w-md p-8 rounded-[3rem] border-slate-800 space-y-6 animate-in zoom-in duration-300">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-amber-500/30">
                <i className="fa-solid fa-user-pen text-2xl text-amber-400"></i>
              </div>
              <h3 className="text-2xl font-black text-white">Dados Obrigatórios</h3>
              <p className="text-xs text-slate-400 leading-relaxed px-4">
                Para gerar sua cobrança PIX com segurança, precisamos que você complete seu cadastro.
              </p>
            </div>

            <form onSubmit={handleUpdateProfileAndPurchase} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 tracking-widest">Nome Completo</label>
                <input
                  type="text"
                  required
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none transition-all"
                  value={profileData.display_name}
                  onChange={e => setProfileData({ ...profileData, display_name: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 tracking-widest">E-mail</label>
                <input
                  type="email"
                  required
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none transition-all"
                  value={profileData.email}
                  onChange={e => setProfileData({ ...profileData, email: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 tracking-widest">CPF / CNPJ</label>
                  <input
                    type="text"
                    required
                    placeholder="000.000.000-00"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none transition-all"
                    value={profileData.taxId}
                    onChange={e => setProfileData({ ...profileData, taxId: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 tracking-widest">Telefone</label>
                  <input
                    type="text"
                    required
                    placeholder="(00) 00000-0000"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none transition-all"
                    value={profileData.phone}
                    onChange={e => setProfileData({ ...profileData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsDataModalOpen(false)}
                  className="flex-1 py-4 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 transition-all"
                >
                  {isUpdatingProfile ? <i className="fa-solid fa-spinner fa-spin"></i> : "Salvar e Continuar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditStore;

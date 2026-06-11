import React, { useState } from 'react';
import { motion } from 'motion/react';
import { getStoredInvitations, addInvitationCode, getStoredCompanies, getActiveUser, initDB } from '../db';
import { Share2, Copy, CheckCircle, Mail, Globe, Users, Trophy, QrCode } from 'lucide-react';

export const InvitationView: React.FC = () => {
  const user = getActiveUser();
  const [invitations, setInvitations] = useState(getStoredInvitations());
  const [companies] = useState(getStoredCompanies());
  const [newCode, setNewCode] = useState('');
  const [selectedComp, setSelectedComp] = useState('c2');
  const [maxSlots, setMaxSlots] = useState(500);
  const [statusMessage, setStatusMessage] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCreateCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode) return;

    const findMatch = invitations.find(i => i.code.toUpperCase() === newCode.toUpperCase().trim());
    if (findMatch) {
      setStatusMessage('Este código de convite já existe!');
      return;
    }

    const created = addInvitationCode(newCode, selectedComp, maxSlots, user?.id || 'u3');
    setInvitations(prev => [...prev, created]);
    setNewCode('');
    setStatusMessage('Novo código de convite corporativo gerado com sucesso!');
    setTimeout(() => setStatusMessage(''), 4000);
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6"
    >
      {/* Banner Area */}
      <section className="relative overflow-hidden rounded-3xl p-8 lg:p-10 bg-gradient-to-br from-primary/10 via-secondary/5 to-surface-container border border-white/5 shadow-xl glass-card">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 justify-between select-none">
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-2">
              <img 
                src="https://iowmvvoeecybxleoipfc.supabase.co/storage/v1/object/public/imagens/1000529284.jpg" 
                alt="Logo Natação Criativa" 
                className="w-8 h-8 rounded-full object-cover border border-primary"
                referrerPolicy="no-referrer"
              />
              <span className="font-headline text-xs font-black tracking-widest text-[#D91C7A] uppercase">
                Área de Convites
              </span>
            </div>
            <h1 className="font-headline text-3xl md:text-4xl text-on-surface mb-2 font-black leading-tight">
              Convide Seus <span className="brand-gradient-text">Colegas de Trabalho</span>
            </h1>
            <p className="font-sans text-sm text-on-surface-variant leading-relaxed">
              Expanda a competição de sua empresa! Cada convite corporativo cria uma liga interna instantânea e garante que os resultados permaneçam vinculados de forma auditada.
            </p>
          </div>
          {/* Circular QR/Visual deco */}
          <div className="w-24 h-24 rounded-2xl bg-surface-container/60 border border-white/10 flex items-center justify-center text-primary relative">
            <QrCode size={48} className="animate-pulse" />
            <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-green rounded-full"></div>
          </div>
        </div>
        {/* Atmosphere blurs */}
        <div className="absolute top-[-40px] right-[-40px] w-48 h-48 bg-secondary/10 blur-[80px] rounded-full"></div>
      </section>

      {statusMessage && (
        <div className="bg-primary/25 text-on-background border border-primary/45 p-3 rounded-xl text-xs flex items-center gap-2 font-bold select-none animate-pulse">
          <CheckCircle size={16} className="text-green" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Primary Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Invite Generator form */}
        <section className="lg:col-span-4 space-y-4">
          <h2 className="font-headline text-lg font-black text-on-surface select-none">
            Gerar Código de Convite
          </h2>
          <div className="glass-card rounded-2xl p-6 border border-white/10 shadow-xl space-y-4">
            <form onSubmit={handleCreateCode} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-black tracking-wider text-primary block mb-2 font-bold">
                  Código Customizado
                </label>
                <input 
                  type="text"
                  required
                  placeholder="EX: CRIATIVA2026"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full bg-black/30 border border-white/5 rounded-xl p-3 text-xs font-bold text-on-surface uppercase outline-none focus:border-secondary"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-black tracking-wider text-primary block mb-2 font-bold">
                  Vincular à Empresa
                </label>
                <select
                  value={selectedComp}
                  onChange={(e) => setSelectedComp(e.target.value)}
                  className="w-full bg-black/30 border border-white/5 text-on-surface text-xs font-semibold p-3 rounded-xl focus:border-secondary outline-none cursor-pointer"
                >
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-black tracking-wider text-primary block mb-2 font-bold">
                  Limite de Convidados (Vagas)
                </label>
                <select
                  value={maxSlots}
                  onChange={(e) => setMaxSlots(parseInt(e.target.value, 10))}
                  className="w-full bg-black/30 border border-white/5 text-on-surface text-xs font-semibold p-3 rounded-xl focus:border-secondary outline-none cursor-pointer"
                >
                  <option value="150">Até 150 colaboradores</option>
                  <option value="500">Até 500 colaboradores</option>
                  <option value="1500">Até 1500 colaboradores</option>
                  <option value="5000">Sem limite operacional</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white font-headline text-xs font-black rounded-xl hover:brightness-110 active:scale-95 transition-all uppercase shadow-md select-none cursor-pointer font-bold"
              >
                CRIAR CUPOM DE ACESSO
              </button>
            </form>
          </div>
        </section>

        {/* Coupons Explorer */}
        <section className="lg:col-span-8 space-y-4">
          <h2 className="font-headline text-lg font-black text-on-surface select-none">
            Códigos de Convites Ativos e Cupons Operacionais
          </h2>
          <div className="space-y-4">
            {invitations.map((invite) => {
              const pct = Math.min(100, Math.floor((invite.usedSlots / invite.maxSlots) * 100));
              return (
                <div 
                  key={invite.code}
                  className="glass-card rounded-2xl p-5 border border-white/10 shadow-lg relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all hover:bg-surface-container/60"
                >
                  {/* Left branding */}
                  <div className="space-y-1.5 flex-1 select-none">
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-primary/20 text-primary border border-primary/25 font-headline font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        {invite.code}
                      </span>
                      <span className="text-[10px] text-on-surface-variant font-medium flex items-center gap-1">
                        <Globe size={11} /> {invite.companyName}
                      </span>
                    </div>

                    <div className="w-full max-w-sm pt-2 space-y-1">
                      <div className="flex justify-between text-[10px] text-[#9cb1cc] font-medium leading-none">
                        <span>Vagas Preenchidas</span>
                        <span>{invite.usedSlots} / {invite.maxSlots} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-primary to-[#D91C7A] h-full" style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => handleCopy(invite.code)}
                      className={`px-4 py-2 bg-surface-container hover:bg-surface-container-high border border-white/10 rounded-xl font-headline text-[11px] font-black tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                        copiedCode === invite.code ? 'text-green border-green' : 'text-on-surface'
                      }`}
                    >
                      {copiedCode === invite.code ? (
                        <>
                          <CheckCircle size={14} className="text-green animate-bounce" />
                          <span>COPIADO!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          <span>COPIAR</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        const message = `Ei! Junte-se ao Bolão da Copa 2026 da Natação Criativa! Registre sua conta usando o código de convite corporativo: ${invite.code} 🏆⚽`;
                        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-secondary-container to-secondary text-white rounded-xl font-headline text-[11px] font-black tracking-wider hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer font-bold"
                    >
                      <Share2 size={13} />
                      <span>COMPARTILHAR</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </motion.div>
  );
};

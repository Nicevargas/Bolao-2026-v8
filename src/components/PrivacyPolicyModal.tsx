import React from 'react';
import { ShieldCheck, X, Eye, FileText, Lock, Globe } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PrivacyPolicyModal({ isOpen, onClose }: PrivacyPolicyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-[#041235] border border-white/10 rounded-3xl w-full max-w-2xl h-[85vh] flex flex-col overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-pink-500/10 text-pink-400 rounded-xl">
              <ShieldCheck size={22} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Política de Privacidade</h2>
              <p className="text-[10px] text-pink-400 font-extrabold uppercase tracking-wider mt-0.5">Segurança dos Dados & LGPD</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 text-sm text-gray-300 leading-relaxed scrollbar-thin scrollbar-thumb-white/10">
          
          <div className="text-xs text-on-surface-variant font-medium bg-white/5 p-4 rounded-2xl border border-white/5">
            Última atualização: 10 de Junho de 2026. Este documento estabelece como os seus dados pessoais e palpites do bolão são processados, garantindo total transparência e conformidade com as diretrizes vigentes de privacidade e segurança.
          </div>

          {/* Section 1 */}
          <div className="space-y-2">
            <h3 className="text-white font-bold flex items-center gap-2">
              <FileText size={16} className="text-pink-400" />
              <span>1. Quais dados coletamos?</span>
            </h3>
            <p className="text-xs pl-6 text-gray-400">
              Coletamos apenas os dados essenciais para o funcionamento e interatividade do bolão com outros apostadores:
            </p>
            <ul className="list-disc pl-10 text-xs text-gray-400 space-y-1">
              <li><strong>Nome completo e apelido:</strong> Para exibição no ranking geral público.</li>
              <li><strong>Endereço de e-mail:</strong> Utilizado como ID de usuário para autenticação real e unicidade.</li>
              <li><strong>Foto/Avatar de perfil:</strong> Imagem pública opcional para personalização do placar de líderes.</li>
              <li><strong>Informações de palpites:</strong> Placar inserido em cada jogo da Copa do Mundo 2026.</li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="space-y-2">
            <h3 className="text-white font-bold flex items-center gap-2">
              <Lock size={16} className="text-pink-400" />
              <span>2. Segurança & Proteção de Credenciais</span>
            </h3>
            <p className="text-xs pl-6 text-gray-400">
              Sua senha é protegida usando algoritmos criptográficos robustos de sentido único (hash) gerenciados de forma isolada pela provedora de identidade <strong>Supabase Auth</strong>. Nós nunca temos acesso a sua senha original em texto puro em nossos servidores. Todos os fluxos de rede operam exclusivamente sob conexões criptografadas de ponta a ponta via protocolos seguidos de HTTPS/SSL.
            </p>
          </div>

          {/* Section 3 */}
          <div className="space-y-2">
            <h3 className="text-white font-bold flex items-center gap-2">
              <Eye size={16} className="text-pink-400" />
              <span>3. Transparência & Visibilidade de Dados</span>
            </h3>
            <p className="text-xs pl-6 text-gray-400">
              Como se trata de um Bolão Competitivo, os seguintes dados são voluntariamente visíveis para todos os outros participantes logados na plataforma: seu nome, pontuação total acumulada, quantidade de placares exatos computados e estatísticas gerais de acertos de resultado. Seus palpites de partidas futuras ou em andamento podem ser mantidos sob sigilo até o apito inicial da rodada, garantindo isonomia esportiva.
            </p>
          </div>

          {/* Section 4 */}
          <div className="space-y-2">
            <h3 className="text-white font-bold flex items-center gap-2">
              <Globe size={16} className="text-pink-400" />
              <span>4. Direitos sob a LGPD</span>
            </h3>
            <p className="text-xs pl-6 text-gray-400">
              De acordo com a Lei Geral de Proteção de Dados Pessoais (LGPD), você possui o pleno direito de solicitar a alteração dos seus dados de perfil, exportação do seu histórico esportivo ou remoção integral definitiva da sua conta e de todos os seus registros de palpites do banco de dados a qualquer momento via solicitação de encerramento de sessão ou contato direto.
            </p>
          </div>

          {/* Section 5 */}
          <div className="space-y-2">
            <h3 className="text-white font-bold flex items-center gap-2 text-xs uppercase tracking-wider text-on-surface-variant">
              <span>Termos de Uso Adicionais</span>
            </h3>
            <p className="text-[11px] text-gray-500 pl-6 border-l-2 border-gray-700">
              Ao cadastrar uma conta real no Bolão Copa do Mundo 2026, você concorda que o uso da inteligência artificial (assistente IA integrado) é fornecido para facilitação de consulta de saldos e palpites e não substitui os canais de regulamentos estabelecidos. A administração se reserva o direito de auditar condutas fraudulentas ou registros duplicados para preservação do ranking geral saudável.
            </p>
          </div>

        </div>

        {/* Footer actions */}
        <div className="p-6 border-t border-white/10 flex justify-end bg-white/[0.01]">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-secondary hover:bg-pink-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all hover:scale-[1.02] active:scale-98 cursor-pointer shadow-lg shadow-pink-500/10"
          >
            Entendido
          </button>
        </div>

      </div>
    </div>
  );
}

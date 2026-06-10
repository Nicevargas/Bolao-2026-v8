import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, X, ChevronUp, RefreshCw, AlertCircle, ShieldAlert } from 'lucide-react';
import { UserProfile } from '../types';

interface Message {
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  tool?: {
    name: string;
    summary: string;
    args?: any;
    result?: any;
  } | null;
}

interface ChatbotProps {
  user: UserProfile;
  onStateMutated: () => void;
}

export default function Chatbot({ user, onStateMutated }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'bot',
      text: `Olá, **${user.name}**! Sou o **Assistente de Inteligência Artificial** do Bolão Copa do Mundo 2026. 🏆\n\nEstou conectado diretamente ao banco de dados Supabase e posso ajudar com várias ações:\n\n*   📊 **Consultar o ranking** geral de apostadores.\n*   ⚽ **Registrar seu palpite** para qualquer jogo.\n*   🔍 **Consultar seu histórico** de apostas.\n*   ⚙️ **Lançar pontuações de partidas** (para administradores).\n\nComo posso ajudar você hoje?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim()) return;

    const userText = inputMessage;
    setInputMessage('');

    // Append user message
    const userMsg: Message = {
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          email: user.email,
          userName: user.name
        })
      });

      if (res.ok) {
        const data = await res.json();
        const botMsg: Message = {
          sender: 'bot',
          text: data.reply || 'Processei sua solicitação.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          tool: data.toolRun ? {
            name: data.toolRun.name,
            summary: data.toolRun.summary,
            args: data.toolRun.args,
            result: data.toolRun.result
          } : null
        };

        setMessages(prev => [...prev, botMsg]);

        // If the AI ran a state-mutation tool (like registering a guess or recording official result)
        // trigger state refresh on client screen!
        if (data.toolRun && ['registrarPalpite', 'lancarResultado'].includes(data.toolRun.name)) {
          onStateMutated();
        }
      } else {
        throw new Error('Servidor indisponível.');
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: 'Oops! Desculpe, não consegui processar sua solicitação agora. Verifique a conectividade da chave `GEMINI_API_KEY`!',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const quickPrompts = [
    { label: '🏆 Classificação Atual', text: 'Quem é o líder do ranking do bolão?' },
    { label: '⚽ Meu Palpite Brasil x Alemanha', text: 'Quais são meus palpites de jogos registrados?' },
    { label: '📊 Estatísticas Gerais', text: 'Me mostre as estatísticas gerais do bolão' }
  ];

  return (
    <div className="fixed bottom-6 right-6 z-40 text-left font-sans">
      {/* Mini Toggle Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          id="btn-assistente-ia"
          className="flex items-center gap-2 px-5 py-4 bg-secondary text-white rounded-full font-extrabold shadow-[0_4px_30px_rgba(255,72,151,0.4)] hover:scale-105 active:scale-95 transition-transform cursor-pointer group"
        >
          <Sparkles size={18} className="animate-pulse text-yellow-300 md:group-hover:rotate-12 transition-transform" />
          <span className="text-xs md:text-sm uppercase tracking-wider">Ajudante IA</span>
        </button>
      )}

      {/* Main Expanded Panel Chat Box */}
      {isOpen && (
        <div className="bg-[#030d2a] border border-white/10 rounded-2xl w-[350px] sm:w-[410px] h-[550px] shadow-[0_15px_50px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          
          {/* Header */}
          <div className="bg-[#041235] px-4 py-3.5 flex justify-between items-center border-b border-white/15">
            <div className="flex items-center gap-2">
              <Bot className="text-secondary h-5 w-5" />
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-white flex items-center gap-1.5 leading-none">
                  Siri do Bolão - Inteligência Artificial
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block"></span>
                </h3>
                <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mt-1 block">Copa do Mundo 2026</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-on-surface-variant hover:text-white p-1 rounded-lg transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
            {messages.map((msg, index) => {
              const isBot = msg.sender === 'bot';
              return (
                <div key={index} className={`flex gap-3 ${isBot ? 'justify-start' : 'justify-end'}`}>
                  {isBot && (
                    <div className="w-8 h-8 rounded-full bg-secondary/15 flex items-center justify-center text-secondary shrink-0">
                      <Bot size={16} />
                    </div>
                  )}
                  <div className="max-w-[75%] space-y-1.5">
                    <div
                      className={`px-3.5 py-2.5 rounded-2xl text-xs font-semibold leading-relaxed ${
                        isBot
                          ? 'bg-white/5 text-gray-200 border border-white/5 rounded-tl-none font-medium'
                          : 'bg-secondary text-white rounded-tr-none shadow-[0_0_15px_rgba(255,72,151,0.15)]'
                      }`}
                    >
                      {/* Very simple markdown implementation styling basic bolding and bullet list syntax */}
                      <div className="whitespace-pre-line text-left">
                        {msg.text.split('\n').map((line, lIdx) => {
                          let element = line;
                          // Handle bold **text**
                          const boldRegex = /\*\*(.*?)\*\*/g;
                          const hasBold = boldRegex.test(element);
                          
                          if (hasBold) {
                            return (
                              <p key={lIdx} dangerouslySetInnerHTML={{
                                __html: element.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                              }} className="my-0.5" />
                            );
                          }

                          // Handle bullet list items
                          if (element.trim().startsWith('*')) {
                            return (
                              <li key={lIdx} className="list-disc ml-4 my-1">
                                {element.trim().slice(1).trim()}
                              </li>
                            );
                          }
                          return <p key={lIdx} className="my-0.5">{element}</p>;
                        })}
                      </div>
                    </div>

                    {/* Integrated Tool Output Trace Badge (The specification highlight) */}
                    {msg.tool && (
                      <div className="p-2.5 bg-green-500/10 border border-green-500/20 rounded-xl text-[10px] text-green-400 font-bold flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <RefreshCw size={11} className="animate-spin text-green-300" />
                          <span>Mecanismo Ativado: <strong>{msg.tool.name}</strong></span>
                        </div>
                        <span className="text-[9px] uppercase tracking-wider bg-green-500/20 text-white font-extrabold px-1.5 py-0.5 rounded">Realizado</span>
                      </div>
                    )}

                    <span className="text-[9px] font-bold text-on-surface-variant block select-none px-1">
                      {msg.timestamp}
                    </span>
                  </div>
                  {!isBot && (
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0 border border-primary/20">
                      <User size={16} />
                    </div>
                  )}
                </div>
              );
            })}

            {isTyping && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
                  <Bot size={16} />
                </div>
                <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/5 rounded-tl-none flex items-center gap-1">
                  <span className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Shortcuts Prompt buttons */}
          <div className="px-3 py-1 bg-white/[0.02] border-t border-white/5 space-x-1.5 overflow-x-auto whitespace-nowrap scrollbar-none py-2 shrink-0">
            {quickPrompts.map((q, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setInputMessage(q.text);
                }}
                className="inline-block px-2.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-[10px] text-gray-300 hover:text-white font-bold transition-all border border-white/5 cursor-pointer max-w-[150px] truncate"
              >
                {q.label}
              </button>
            ))}
          </div>

          {/* Input Sender Form Footer */}
          <form onSubmit={handleSendMessage} className="p-3 bg-[#041235] border-t border-white/10 flex items-center gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Digite sua dúvida ou lance seu palpite..."
              className="flex-1 bg-white/5 border border-white/10 hover:border-white/20 focus:border-secondary rounded-xl py-2 px-3 text-xs text-white placeholder-white/30 focus:outline-none transition-colors"
            />
            <button
              type="submit"
              className="p-2.5 rounded-xl bg-secondary text-white hover:bg-pink-600 shadow-md font-bold hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            >
              <Send size={14} />
            </button>
          </form>
          
        </div>
      )}
    </div>
  );
}

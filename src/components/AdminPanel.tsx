import React, { useState } from 'react';
import { Settings, Shield, PlusCircle, RefreshCw, Save, HelpCircle, Sparkles, Check, FileSpreadsheet, Upload, Trash2, AlertCircle, X } from 'lucide-react';
import { Match } from '../types';

interface AdminPanelProps {
  matches: Match[];
  onStateMutated: () => void;
}

export default function AdminPanel({ matches, onStateMutated }: AdminPanelProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New match input states
  const [newMatch, setNewMatch] = useState({
    id: '',
    fase: 'Grupo A',
    grupo: 'Grupo A',
    data_jogo: '26 DE JUNHO - 16:00',
    time1: '',
    time2: '',
    location: 'ARENA COPA'
  });

  // Score states for each game ID
  const [scores, setScores] = useState<Record<string, { t1: number; t2: number }>>({});

  // Excel/CSV bulk import states
  const [pasteText, setPasteText] = useState('');
  const [parsedPreview, setParsedPreview] = useState<any[]>([]);
  const [importError, setImportError] = useState<string | null>(null);

  const handleParseData = (text: string) => {
    setImportError(null);
    if (!text.trim()) {
      setImportError("Insira ou cole dados de texto válidos.");
      return;
    }

    try {
      // Normalizar e separar em linhas
      const lines = text.trim().split(/\r?\n/);
      if (lines.length < 1) {
        setImportError("Nenhum dado encontrado.");
        return;
      }

      // Detectar delimitador (tabulação para Excel copiado, ou ponto e vírgula/vírgula para CSV)
      const firstLine = lines[0];
      let delimiter = '\t';
      if (firstLine.includes(';')) {
        delimiter = ';';
      } else if (firstLine.includes(',')) {
        const commas = (firstLine.match(/,/g) || []).length;
        const tabs = (firstLine.match(/\t/g) || []).length;
        const semicolons = (firstLine.match(/;/g) || []).length;
        if (semicolons > commas) delimiter = ';';
        else if (tabs > commas) delimiter = '\t';
        else delimiter = ',';
      }

      // Função simples de parse que trata aspas
      const parseCSVLine = (line: string, delim: string) => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === delim && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      };

      const headerRow = parseCSVLine(lines[0], delimiter);
      let rowsToParse = lines.slice(1);

      // Palavras-chave para identificar se há linha de cabeçalho
      const hasHeader = headerRow.some(col => 
        ['id', 'time', 'equipe', 'team', 'grupo', 'group', 'fase', 'stage', 'data', 'date', 'gols', 'goals', 'local', 'venue', 'estadio'].some(keyword => 
          col.toLowerCase().includes(keyword)
        )
      );

      let finalHeaders = headerRow;
      if (!hasHeader) {
        // Se não tem cabeçalho detectado, usamos as colunas na ordem padrão e incluímos firstline nos dados
        finalHeaders = ['Time 1', 'Time 2', 'Grupo', 'Data', 'Lugar'];
        rowsToParse = lines;
      }

      const cleanHeaders = finalHeaders.map(h => h.toLowerCase().trim());

      const colMap = {
        id: cleanHeaders.findIndex(h => h === 'id' || h === 'id_jogo' || h === 'id_match' || h === 'match_id' || h === 'código'),
        fase: cleanHeaders.findIndex(h => h.includes('fase') || h.includes('stage') || h.includes('rodada')),
        grupo: cleanHeaders.findIndex(h => h.includes('grupo') || h.includes('group')),
        data_jogo: cleanHeaders.findIndex(h => h.includes('data') || h.includes('date') || h.includes('horario') || h.includes('horário') || h.includes('time') && !h.includes('team')),
        time1: cleanHeaders.findIndex(h => h.includes('time1') || h.includes('time 1') || h.includes('time_1') || h.includes('time_casa') || h.includes('casa') || h.includes('home') || h.includes('equipe 1') || h.includes('equipe1')),
        time2: cleanHeaders.findIndex(h => h.includes('time2') || h.includes('time 2') || h.includes('time_2') || h.includes('time_fora') || h.includes('fora') || h.includes('away') || h.includes('equipe 2') || h.includes('equipe2')),
        gols_time1: cleanHeaders.findIndex(h => h.includes('gols1') || h.includes('gols_time1') || h.includes('gols_1') || h.includes('gols casa') || h.includes('placar_casa') || h.includes('placar 1')),
        gols_time2: cleanHeaders.findIndex(h => h.includes('gols2') || h.includes('gols_time2') || h.includes('gols_2') || h.includes('gols fora') || h.includes('placar_fora') || h.includes('placar 2')),
        finalizado: cleanHeaders.findIndex(h => h.includes('finalizado') || h.includes('finished') || h.includes('encerrado') || h.includes('status') || h.includes('concluido') || h.includes('concluído')),
        location: cleanHeaders.findIndex(h => h.includes('local') || h.includes('location') || h.includes('venue') || h.includes('estadio') || h.includes('estádio'))
      };

      // Mapeamento posicional fallback caso as colunas principais de equipe não estejam nomeadas claramente
      if (colMap.time1 === -1 || colMap.time2 === -1) {
        if (cleanHeaders.length >= 2) {
          colMap.time1 = 0;
          colMap.time2 = 1;
          if (cleanHeaders.length >= 3) colMap.grupo = 2;
          if (cleanHeaders.length >= 4) colMap.data_jogo = 3;
          if (cleanHeaders.length >= 5) colMap.location = 4;
        } else {
          setImportError("Planilha inválida. Certifique-se de que existem colunas para identificar os dois times confrontantes.");
          return;
        }
      }

      const list: any[] = [];
      rowsToParse.forEach((line, idx) => {
        if (!line.trim()) return;
        const cols = parseCSVLine(line, delimiter);
        if (cols.length < 2) return;

        const t1 = cols[colMap.time1] || '';
        const t2 = cols[colMap.time2] || '';
        if (!t1 || !t2) return;

        const f = colMap.fase !== -1 ? cols[colMap.fase] : '';
        const grp = colMap.grupo !== -1 ? cols[colMap.grupo] : '';
        
        const rawG1 = colMap.gols_time1 !== -1 ? cols[colMap.gols_time1] : '';
        const rawG2 = colMap.gols_time2 !== -1 ? cols[colMap.gols_time2] : '';
        const g1 = rawG1 !== '' && rawG1 !== undefined && rawG1 !== null ? Number(rawG1) : null;
        const g2 = rawG2 !== '' && rawG2 !== undefined && rawG2 !== null ? Number(rawG2) : null;

        const statStr = colMap.finalizado !== -1 ? cols[colMap.finalizado]?.toLowerCase() : '';
        const isFin = statStr === 'sim' || statStr === 'true' || statStr === 'finished' || statStr === '1' || (g1 !== null && g2 !== null);

        const loc = colMap.location !== -1 ? cols[colMap.location] : '';
        const finalId = (colMap.id !== -1 && cols[colMap.id]) ? cols[colMap.id] : `xls_${Date.now()}_${idx}`;

        list.push({
          id: finalId,
          fase: f || grp || 'Grupo',
          grupo: grp || f || 'Grupo A',
          data_jogo: colMap.data_jogo !== -1 ? cols[colMap.data_jogo] : '11 DE JUNHO - 16:00',
          time1: t1,
          time2: t2,
          gols_time1: isNaN(g1 as any) ? null : g1,
          gols_time2: isNaN(g2 as any) ? null : g2,
          finalizado: isFin,
          location: loc || 'ESTÁDIO OFICIAL'
        });
      });

      if (list.length === 0) {
        setImportError("Sua planilha não possui registros legíveis de jogos. Verifique os dados.");
      } else {
        setParsedPreview(list);
      }
    } catch (e: any) {
      setImportError("Falha ao analisar colunas: " + e.message);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (text) {
        setPasteText(text);
        handleParseData(text);
      }
    };
    reader.readAsText(file);
  };

  const handleCommitBulkImport = async () => {
    if (parsedPreview.length === 0) return;
    setLoading('bulk_import');
    try {
      const res = await fetch('/api/admin/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matches: parsedPreview })
      });

      if (res.ok) {
        const bodyObj = await res.json();
        showFeedback(bodyObj.message || `Grade importada com sucesso! ${parsedPreview.length} jogos carregados.`);
        setParsedPreview([]);
        setPasteText('');
        onStateMutated();
      } else {
        const errObj = await res.json();
        alert(`Erro na gravação: ${errObj.error}`);
      }
    } catch (err: any) {
      console.error(err);
      alert("Erro ao comunicar com a API de importação: " + err.message);
    } finally {
      setLoading(null);
    }
  };

  const [onlineSheetUrl, setOnlineSheetUrl] = useState('');
  const [sheetSyncStatus, setSheetSyncStatus] = useState<string | null>(null);

  React.useEffect(() => {
    fetch('/api/admin/spreadsheet-config')
      .then(r => r.json())
      .then(data => {
        if (data && data.spreadsheetUrl) {
          setOnlineSheetUrl(data.spreadsheetUrl);
        }
      })
      .catch(err => console.error("Falha ao carregar setup de planilha:", err));
  }, []);

  const handleSaveSheetUrl = async () => {
    setLoading('sheet_config');
    setSheetSyncStatus(null);
    try {
      const res = await fetch('/api/admin/spreadsheet-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spreadsheetUrl: onlineSheetUrl })
      });
      if (res.ok) {
        const data = await res.json();
        showFeedback(data.message || "Sincronização de planilha configurada com sucesso!");
        if (data.error) {
          setSheetSyncStatus(`Aviso: ${data.error}`);
        } else {
          setSheetSyncStatus(`Sincronizado! ${data.count || 0} jogos ativos recuperados de sua planilha.`);
        }
        onStateMutated();
      } else {
        const data = await res.json();
        setSheetSyncStatus(`Erro: ${data.error || 'Falha de comunicação'}`);
      }
    } catch (e: any) {
      setSheetSyncStatus(`Erro de rede: ${e.message}`);
    } finally {
      setLoading(null);
    }
  };

  const showFeedback = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => {
      setSuccessMsg(null);
    }, 4000);
  };

  const handleScoreChange = (matchId: string, team: 1 | 2, value: string) => {
    const numVal = Math.max(0, parseInt(value) || 0);
    setScores(prev => ({
      ...prev,
      [matchId]: {
        t1: team === 1 ? numVal : (prev[matchId]?.t1 || 0),
        t2: team === 2 ? numVal : (prev[matchId]?.t2 || 0)
      }
    }));
  };

  const handlePublishScore = async (matchId: string) => {
    const score = scores[matchId];
    if (!score) {
      alert("Defina o placar antes de publicar.");
      return;
    }

    setLoading(matchId);
    try {
      const res = await fetch('/api/admin/lancar-resultado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jogo_id: matchId,
          gols_time1: score.t1,
          gols_time2: score.t2
        })
      });

      if (res.ok) {
        showFeedback(`Ok! Placar do jogo ${matchId} finalizado com sucesso!`);
        onStateMutated();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  const handleAddMatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatch.id || !newMatch.time1 || !newMatch.time2) {
      alert("Escreva o ID único, Time 1 e Time 2.");
      return;
    }

    setLoading('add_match');
    try {
      const res = await fetch('/api/admin/jogos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMatch)
      });

      if (res.ok) {
        showFeedback(`Sucesso! Novo jogo [${newMatch.time1} x ${newMatch.time2}] adicionado.`);
        setNewMatch({
          id: '',
          fase: 'Grupo A',
          grupo: 'Grupo A',
          data_jogo: '26 DE JUNHO - 16:00',
          time1: '',
          time2: '',
          location: 'ARENA COPA'
        });
        onStateMutated();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  const handleForceReprocess = async () => {
    setLoading('reprocess');
    try {
      const res = await fetch('/api/admin/reprocessar', { method: 'POST' });
      if (res.ok) {
        showFeedback("Mecanismo rodado! Todos os palpites de jogos finalizados foram atualizados via trigger/formulas.");
        onStateMutated();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(null);
    }
  };

  const handleCleanBootstrap = async () => {
    setLoading('seed');
    try {
      const res = await fetch('/api/admin/importar', { method: 'POST' });
      if (res.ok) {
        showFeedback("Banco de jogos redefinido para o padrão da Copa do Mundo 2026!");
        onStateMutated();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="animate-in fade-in duration-300 relative text-left">
      {/* Admin header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2 tracking-tight">Painel Administrativo</h1>
          <p className="text-on-surface-variant font-medium text-sm md:text-base max-w-2xl">
            Simulador de Gestão da Copa. Controle rodadas, lance resultados e recomputação automática de pontos.
          </p>
        </div>

        {/* Floating feedback alert toast inside component */}
        {successMsg && (
          <div className="px-4 py-2.5 bg-green-500/10 border border-green-500/20 text-green-400 font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg animate-in fade-in slide-in-from-top-2">
            <Check size={14} />
            <span>{successMsg}</span>
          </div>
        )}
      </div>

      {/* Overview stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Quick Trigger reprocess */}
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-1">Reprocessador Geral</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Força o recálculo imediato de todos os pontos de palpites com base nos resultados concluídos. Útil em auditoria de regras de pontuação.
            </p>
          </div>
          <button
            onClick={handleForceReprocess}
            disabled={loading !== null}
            className="mt-6 flex items-center justify-center gap-2 px-5 py-3 bg-secondary hover:bg-pink-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-pink-500/10"
          >
            <RefreshCw size={14} className={loading === 'reprocess' ? 'animate-spin' : ''} />
            <span>Recomputar Pontuações</span>
          </button>
        </div>

        {/* Clean Seeder */}
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-1">Redefinir Tabelas</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Deleta alterações e reinsere todo o calendário padrão das quatro partidas inaugurais da Copa. Restaura a integridade da demonstração.
            </p>
          </div>
          <button
            onClick={handleCleanBootstrap}
            disabled={loading !== null}
            className="mt-6 flex items-center justify-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 disabled:opacity-50 text-white border border-white/10 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            <Shield size={14} className={loading === 'seed' ? 'animate-spin' : ''} />
            <span>Redefinir Jogos para Padrão</span>
          </button>
        </div>
      </div>

      {/* Sincronização Automática via Planilha Google Sheets / Excel na Nuvem */}
      <div className="glass-card p-6 md:p-8 rounded-3xl mb-8 border border-orange-500/10 bg-orange-500/[0.01]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/5">
          <div className="flex items-center gap-3 text-left">
            <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white font-bold shadow-lg shadow-orange-500/10">
              <RefreshCw size={24} className={loading === 'sheet_config' ? 'animate-spin' : ''} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Sincronização Automática via Google Sheets</h3>
              <p className="text-xs text-on-surface-variant font-medium mt-0.5">
                Mantenha suas tabelas e resultados atualizados automaticamente. O servidor baixa e sincroniza sua planilha da nuvem a cada 5 minutos e a cada carregamento de página!
              </p>
            </div>
          </div>
          <div className="text-[11px] bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-lg text-orange-300 font-bold flex items-center gap-1">
            <span>● Status: Sincronização Ativa</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
          <div className="lg:col-span-8 space-y-4">
            <div>
              <label className="block text-xs font-bold text-white/80 mb-2">
                Link de Compartilhamento da Planilha Google Sheets (Qualquer usuário com o link pode ler)
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="url"
                  value={onlineSheetUrl}
                  onChange={(e) => setOnlineSheetUrl(e.target.value)}
                  placeholder="Ex: https://docs.google.com/spreadsheets/d/1A2B3C4D.../edit?usp=sharing"
                  className="flex-1 bg-[#020819] border border-white/10 focus:border-orange-500/55 rounded-xl px-4 py-3 text-xs text-white placeholder:text-white/20 focus:outline-none transition-colors"
                />
                <button
                  onClick={handleSaveSheetUrl}
                  disabled={loading !== null}
                  className="px-5 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  {loading === 'sheet_config' ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Sincronizando...</span>
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      <span>Salvar e Sincronizar</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {sheetSyncStatus && (
              <div className={`p-4 rounded-xl text-xs font-semibold border flex items-center gap-2.5 animate-in fade-in slide-in-from-top-1 ${
                sheetSyncStatus.includes('Erro') 
                  ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                  : 'bg-green-500/10 border-green-500/20 text-green-300'
              }`}>
                <AlertCircle size={15} className="shrink-0" />
                <span>{sheetSyncStatus}</span>
              </div>
            )}
          </div>

          <div className="lg:col-span-4 bg-white/[0.02] border border-white/5 rounded-2xl p-5 text-xs text-on-surface-variant flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-white mb-2 uppercase tracking-wide flex items-center gap-1.5">
                <Sparkles size={13} className="text-orange-400" />
                <span>Instruções de Publicação</span>
              </h4>
              <p className="leading-relaxed text-[11px] mb-2">
                Como habilitar o Google Sheets para sincronização automática total em segundo plano:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-[11px]">
                <li>No seu Google Sheets, clique no botão <strong className="text-white">Compartilhar</strong> (canto superior direito).</li>
                <li>Altere o Acesso Geral para <strong className="text-orange-300">Qualquer pessoa com o link</strong> (Leitor).</li>
                <li>Copie o link do navegador e cole aqui!</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* Importador via Planilha Excel / CSV */}
      <div className="glass-card p-6 md:p-8 rounded-3xl mb-8 border border-white/5 bg-white/[0.01]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-orange-500/10 text-orange-400 font-bold">
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Importador em Massa de Planilha / Excel</h3>
              <p className="text-xs text-on-surface-variant font-medium mt-0.5">
                Alimente, substitua ou redefina rodadas e times copiando e colando células diretamente do Excel ou subindo arquivos CSV.
              </p>
            </div>
          </div>
          <div className="text-[11px] bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-on-surface-variant font-semibold">
            Dica: Copie e cole colunas (Time 1, Time 2, Grupo, Data) de sua planilha!
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-4 text-left">
            <div className="text-xs text-on-surface-variant font-medium flex items-center gap-1.5 mb-1">
              <span>Cole os dados da planilha de Excel abaixo (com ou sem cabeçalhos)</span>
              <HelpCircle size={12} className="text-white/40" />
            </div>
            <textarea
              value={pasteText}
              onChange={(e) => {
                setPasteText(e.target.value);
                handleParseData(e.target.value);
              }}
              placeholder={`Exemplo de dados copiados/colados do Excel:
México	Equador	Grupo A	11 de Junho - 16:00	Estádio Azteca
Estados Unidos	Marrocos	Grupo A	12 de Junho - 19:00	SoFi Stadium
Canadá	França	Grupo B	13 de Junho - 15:00	BC Place
Brasil	Espanha	Grupo B	14 de Junho - 21:00	MetLife Stadium`}
              className="w-full h-36 bg-[#020819] border border-white/10 focus:border-orange-500/55 rounded-2xl p-4 text-white text-xs font-mono placeholder:text-white/20 focus:outline-none transition-colors"
            />

            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-white font-bold cursor-pointer transition-colors">
                <Upload size={14} className="text-orange-400" />
                <span>Ou carregar arquivo CSV</span>
                <input
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>

              {parsedPreview.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setParsedPreview([]);
                    setPasteText('');
                  }}
                  className="flex items-center gap-1 text-xs text-red-400 font-bold hover:underline bg-transparent border-0 cursor-pointer"
                >
                  <X size={12} />
                  <span>Limpar</span>
                </button>
              )}
            </div>
          </div>

          <div className="lg:col-span-4 bg-white/[0.02] border border-white/5 rounded-2xl p-5 text-left text-xs text-on-surface-variant space-y-3 flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-white mb-2 uppercase tracking-wide flex items-center gap-1.5">
                <AlertCircle size={13} className="text-orange-400" />
                <span>Como funciona no Excel?</span>
              </h4>
              <p className="leading-relaxed text-[11px]">
                Preencha os jogos nas colunas do Excel. Copie as células e cole aqui diretamente para alimentar as tabelas e remover a Itália ou outros times indesejados!
              </p>
              <ul className="list-disc list-inside space-y-1 mt-2 text-[11px]">
                <li>Selecione suas linhas no <strong className="text-white">Excel/Sheets</strong>.</li>
                <li>Copie (<kbd className="bg-white/5 px-1 py-0.5 rounded text-white font-mono">Ctrl+C</kbd>) e cole aqui.</li>
                <li>Times e bandeiras do World Cup 2026 são resolvidos instantaneamente.</li>
              </ul>
            </div>
            
            {importError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-start gap-2">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span className="leading-normal">{importError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Live Preview of parsed games from Spreadsheet */}
        {parsedPreview.length > 0 && (
          <div className="mt-6 p-5 bg-orange-500/[0.02] border border-orange-500/20 rounded-2xl text-left animate-in fade-in slide-in-from-top-1">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-white/5">
              <div>
                <h4 className="text-base font-bold text-white flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-400 animate-pulse" />
                  <span>Jogos Detectados na Planilha Prontos para Importar ({parsedPreview.length})</span>
                </h4>
                <p className="text-[11px] text-on-surface-variant mt-0.5">
                  Esta operação limpará a grade antiga (e referências dela) e aplicará o seu novo calendário.
                </p>
              </div>

              <button
                onClick={handleCommitBulkImport}
                disabled={loading !== null}
                className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 font-bold text-xs text-white uppercase tracking-wider rounded-xl cursor-pointer shadow-lg shadow-orange-500/10 flex items-center justify-center gap-2"
              >
                <Check size={14} />
                <span>{loading === 'bulk_import' ? 'Salvando...' : 'Aplicar e Sobregravar Tabelas'}</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/5 bg-[#010613]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-white/5 text-white/50 border-b border-white/5 font-bold uppercase text-[9px] tracking-wider">
                    <th className="py-2.5 px-3">ID Jogo</th>
                    <th className="py-2.5 px-3">Fase / Rodada</th>
                    <th className="py-2.5 px-3">Time Casa</th>
                    <th className="py-2.5 px-3">Time Fora</th>
                    <th className="py-2.5 px-3">Data e Hora</th>
                    <th className="py-2.5 px-3 font-medium">Local</th>
                    <th className="py-2.5 px-3 text-center">Status inicial</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-white text-[11px]">
                  {parsedPreview.slice(0, 10).map((p, pIdx) => (
                    <tr key={pIdx} className="hover:bg-white/[0.01]">
                      <td className="py-2.5 px-3 font-mono text-[10px] text-white/55">{p.id}</td>
                      <td className="py-2.5 px-3 font-medium text-white/90">{p.fase}</td>
                      <td className="py-2.5 px-3 font-bold">
                        <span className="flex items-center gap-2">
                          <img 
                            src={`https://flagcdn.com/w80/${
                              p.time1.toLowerCase() === 'brasil' ? 'br' : 
                              p.time1.toLowerCase() === 'equador' ? 'ec' : 
                              p.time1.toLowerCase() === 'estados unidos' ? 'us' : 
                              p.time1.toLowerCase() === 'marrocos' ? 'ma' : 
                              p.time1.toLowerCase() === 'canadá' ? 'ca' : 
                              p.time1.toLowerCase() === 'frança' ? 'fr' : 
                              p.time1.toLowerCase() === 'argentina' ? 'ar' : 
                              p.time1.toLowerCase() === 'portugal' ? 'pt' : 
                              p.time1.toLowerCase() === 'espanha' ? 'es' : 
                              p.time1.toLowerCase() === 'alemanha' ? 'de' : 
                              p.time1.toLowerCase() === 'japão' ? 'jp' : 
                              p.time1.toLowerCase() === 'méxico' ? 'mx' : 'un'
                            }.png`} 
                            alt="" 
                            className="w-5 h-3.5 object-cover rounded shadow-xs" 
                            onError={(e) => (e.currentTarget.src = 'https://flagcdn.com/w80/un.png')} 
                            referrerPolicy="no-referrer" 
                          />
                          {p.time1}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-bold">
                        <span className="flex items-center gap-2">
                          <img 
                            src={`https://flagcdn.com/w80/${
                              p.time2.toLowerCase() === 'brasil' ? 'br' : 
                              p.time2.toLowerCase() === 'equador' ? 'ec' : 
                              p.time2.toLowerCase() === 'estados unidos' ? 'us' : 
                              p.time2.toLowerCase() === 'marrocos' ? 'ma' : 
                              p.time2.toLowerCase() === 'canadá' ? 'ca' : 
                              p.time2.toLowerCase() === 'frança' ? 'fr' : 
                              p.time2.toLowerCase() === 'argentina' ? 'ar' : 
                              p.time2.toLowerCase() === 'portugal' ? 'pt' : 
                              p.time2.toLowerCase() === 'espanha' ? 'es' : 
                              p.time2.toLowerCase() === 'alemanha' ? 'de' : 
                              p.time2.toLowerCase() === 'japão' ? 'jp' : 
                              p.time2.toLowerCase() === 'méxico' ? 'mx' : 'un'
                            }.png`} 
                            alt="" 
                            className="w-5 h-3.5 object-cover rounded shadow-xs" 
                            onError={(e) => (e.currentTarget.src = 'https://flagcdn.com/w80/un.png')} 
                            referrerPolicy="no-referrer" 
                          />
                          {p.time2}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-white/80">{p.data_jogo}</td>
                      <td className="py-2.5 px-3 text-white/60">{p.location}</td>
                      <td className="py-2.5 px-3 text-center">
                        {p.gols_time1 !== null && p.gols_time2 !== null ? (
                          <span className="bg-green-500/10 border border-green-500/20 text-green-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            {p.gols_time1} x {p.gols_time2}
                          </span>
                        ) : (
                          <span className="bg-white/5 border border-white/10 text-white/55 px-2 py-0.5 rounded-full text-[10px]">
                            Aberto
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedPreview.length > 10 && (
                <div className="py-2 px-3 bg-white/5 text-center text-[10px] text-white/45 uppercase tracking-wide border-t border-white/5">
                  ... E mais {parsedPreview.length - 10} confrontos adicionais identificados serão importados!
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        {/* Match Finalization Deck (Left 7 Columns) */}
        <section className="lg:col-span-8 glass-card rounded-3xl p-6 md:p-8 flex flex-col">
          <div className="mb-6 flex justify-between items-center bg-white/[0.02] p-4 rounded-2xl border border-white/5">
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Inserir Resultados Oficiais</h3>
              <p className="text-xs text-on-surface-variant font-medium mt-0.5">O preenchimento destes dados dispara automaticamente as recomputações de pontos dos apostadores.</p>
            </div>
            <Sparkles size={20} className="text-secondary animate-pulse" />
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
            {matches.map((m) => {
              const isMatchDone = m.status === 'ENCERRADO';
              const currentT1 = scores[m.id]?.t1 ?? (m.realHomeScore ?? 0);
              const currentT2 = scores[m.id]?.t2 ?? (m.realAwayScore ?? 0);

              return (
                <div
                  key={m.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isMatchDone
                      ? 'bg-green-500/5 border-green-500/20'
                      : 'bg-white/5 border-white/5 hover:border-pink-500/10'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase bg-white/5 px-2 py-0.5 rounded">
                        {m.location || 'Copa 2026'}
                      </span>
                      <span className="text-[10px] text-on-surface-variant font-medium">{m.date}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <img src={m.homeFlag} alt="" className="w-6 h-4 object-cover rounded shadow" />
                      <span className="font-bold text-sm text-white">{m.homeTeam}</span>
                      <span className="text-xs text-on-surface-variant">vs</span>
                      <img src={m.awayFlag} alt="" className="w-6 h-4 object-cover rounded shadow" />
                      <span className="font-bold text-sm text-white">{m.awayTeam}</span>
                    </div>
                  </div>

                  {/* Input Score Counters */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 bg-[#020819] px-3 py-1.5 rounded-xl border border-white/5">
                      <input
                        type="number"
                        min="0"
                        disabled={isMatchDone && loading !== m.id}
                        value={scores[m.id]?.t1 ?? (m.realHomeScore !== undefined ? m.realHomeScore : '')}
                        onChange={(e) => handleScoreChange(m.id, 1, e.target.value)}
                        placeholder="0"
                        className="w-10 bg-transparent text-center font-black text-white text-base focus:outline-none"
                      />
                      <span className="text-white/30 text-xs font-bold">x</span>
                      <input
                        type="number"
                        min="0"
                        disabled={isMatchDone && loading !== m.id}
                        value={scores[m.id]?.t2 ?? (m.realAwayScore !== undefined ? m.realAwayScore : '')}
                        onChange={(e) => handleScoreChange(m.id, 2, e.target.value)}
                        placeholder="0"
                        className="w-10 bg-transparent text-center font-black text-white text-base focus:outline-none"
                      />
                    </div>

                    <button
                      onClick={() => handlePublishScore(m.id)}
                      disabled={loading !== null}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                        isMatchDone
                          ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                          : 'bg-primary text-on-primary hover:bg-primary/90'
                      }`}
                    >
                      <Save size={13} />
                      <span>{isMatchDone ? 'Atualizar' : 'Publicar'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Add Custom Game Calendar Form (Right 4 Columns) */}
        <section className="lg:col-span-4 glass-card rounded-3xl p-6 md:p-8 flex flex-col justify-between">
          <form onSubmit={handleAddMatchSubmit} className="space-y-4">
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-1.5 border-b border-white/5 pb-3">
              <PlusCircle size={18} className="text-primary-container" />
              <span>Inserir Novo Jogo</span>
            </h3>

            <div className="space-y-1 text-xs">
              <label className="font-bold text-on-surface-variant uppercase">ID Único do Confronto</label>
              <input
                type="text"
                required
                placeholder="Exemplo: wc5"
                value={newMatch.id}
                onChange={(e) => setNewMatch(prev => ({ ...prev, id: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-primary-container rounded-xl py-2.5 px-3 text-white focus:outline-none transition-colors mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 text-xs">
                <label className="font-bold text-on-surface-variant uppercase">Time Casa</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Uruguai"
                  value={newMatch.time1}
                  onChange={(e) => setNewMatch(prev => ({ ...prev, time1: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-primary-container rounded-xl py-2.5 px-3 text-white focus:outline-none transition-colors mt-1"
                />
              </div>

              <div className="space-y-1 text-xs">
                <label className="font-bold text-on-surface-variant uppercase">Time Fora</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Inglaterra"
                  value={newMatch.time2}
                  onChange={(e) => setNewMatch(prev => ({ ...prev, time2: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-primary-container rounded-xl py-2.5 px-3 text-white focus:outline-none transition-colors mt-1"
                />
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-bold text-on-surface-variant uppercase">Fase / Rodada</label>
              <input
                type="text"
                placeholder="Ex: Grupo A ou Oitavas"
                value={newMatch.fase}
                onChange={(e) => setNewMatch(prev => ({ ...prev, fase: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-primary-container rounded-xl py-2.5 px-3 text-white focus:outline-none transition-colors mt-1"
              />
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-bold text-on-surface-variant uppercase">Data & Horário</label>
              <input
                type="text"
                placeholder="Ex: 26 DE JUNHO - 16:00"
                value={newMatch.data_jogo}
                onChange={(e) => setNewMatch(prev => ({ ...prev, data_jogo: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-primary-container rounded-xl py-2.5 px-3 text-white focus:outline-none transition-colors mt-1"
              />
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-bold text-on-surface-variant uppercase">Estádio / Arena</label>
              <input
                type="text"
                placeholder="Ex: Wembley Stadium"
                value={newMatch.location}
                onChange={(e) => setNewMatch(prev => ({ ...prev, location: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-primary-container rounded-xl py-2.5 px-3 text-white focus:outline-none transition-colors mt-1"
              />
            </div>

            <button
              type="submit"
              disabled={loading !== null}
              className="w-full mt-4 flex items-center justify-center gap-2 px-5 py-3 bg-[#001c5c] border border-primary/40 hover:bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              <span>Salvar Novo Jogo</span>
            </button>
          </form>
        </section>
      </div>

    </div>
  );
}

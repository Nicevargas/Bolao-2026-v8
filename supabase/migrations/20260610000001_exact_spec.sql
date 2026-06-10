-- ==========================================
-- SCRIPT DE MIGRAÇÃO: BOLÃO COPA DO MUNDO 2026
-- VERSÃO: 2.0 (ESPECIFICAÇÃO TÉCNICA OFICIAL)
-- OBJETIVO: Estrutura oficial com cálculo automático e triggers
-- ==========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela participantes
CREATE TABLE IF NOT EXISTS participantes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Indices para participante por email
CREATE UNIQUE INDEX IF NOT EXISTS idx_participantes_email ON participantes(email);

-- 2. Tabela jogos
CREATE TABLE IF NOT EXISTS jogos (
  id TEXT PRIMARY KEY,
  fase TEXT NOT NULL,
  grupo TEXT NOT NULL,
  data_jogo TEXT NOT NULL,
  time1 TEXT NOT NULL,
  time2 TEXT NOT NULL,
  gols_time1 INTEGER,
  gols_time2 INTEGER,
  finalizado BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Tabela palpites
CREATE TABLE IF NOT EXISTS palpites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participante_id UUID REFERENCES participantes(id) ON DELETE CASCADE,
  jogo_id TEXT REFERENCES jogos(id) ON DELETE CASCADE,
  palpite_time1 INTEGER NOT NULL,
  palpite_time2 INTEGER NOT NULL,
  pontos INTEGER DEFAULT 0 CHECK (pontos BETWEEN 0 AND 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(participante_id, jogo_id)
);

-- Indice para pesquisas rapidas de palpites de um determinado participante
CREATE INDEX IF NOT EXISTS idx_palpites_participante ON palpites(participante_id);

-- 4. Função de cálculo de pontuação oficial (0 a 5 pontos)
CREATE OR REPLACE FUNCTION calculate_bolao_points(
  real1 INTEGER,
  real2 INTEGER,
  guess1 INTEGER,
  guess2 INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  resultado_correto BOOLEAN;
  gol_time1_correto BOOLEAN;
  gol_time2_correto BOOLEAN;
  placar_exato BOOLEAN;
  total_pontos INTEGER := 0;
BEGIN
  -- Retorna 0 se algum dado for nulo
  IF real1 IS NULL OR real2 IS NULL OR guess1 IS NULL OR guess2 IS NULL THEN
    RETURN 0;
  END IF;

  -- Acertou vencedor ou empate (+2 pontos)
  resultado_correto := (real1 > real2 AND guess1 > guess2) OR 
                       (real1 < real2 AND guess1 < guess2) OR 
                       (real1 = real2 AND guess1 = guess2);
                       
  -- Acertou gols do Time 1 (+1 ponto)
  gol_time1_correto := (real1 = guess1);
  
  -- Acertou gols do Time 2 (+1 ponto)
  gol_time2_correto := (real2 = guess2);
  
  -- Acertou placar exato (+1 ponto bônus adicional)
  placar_exato := (real1 = guess1 AND real2 = guess2);

  IF resultado_correto THEN
    total_pontos := total_pontos + 2;
  END IF;
  
  IF gol_time1_correto THEN
    total_pontos := total_pontos + 1;
  END IF;
  
  IF gol_time2_correto THEN
    total_pontos := total_pontos + 1;
  END IF;
  
  IF placar_exato THEN
    total_pontos := total_pontos + 1;
  END IF;

  RETURN total_pontos;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 5. Automação de Resultados por Trigger:
-- Atualiza os pontos de todos os palpites daquele jogo automaticamente quando for finalizado.
CREATE OR REPLACE FUNCTION process_match_scores_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.finalizado = true AND (OLD.finalizado = false OR OLD.finalizado IS NULL OR NEW.gols_time1 != OLD.gols_time1 OR NEW.gols_time2 != OLD.gols_time2) THEN
    -- Atualiza pontuação de todos os palpites vinculados a esse jogo usando o cálculo automático
    UPDATE palpites
    SET pontos = calculate_bolao_points(NEW.gols_time1, NEW.gols_time2, palpite_time1, palpite_time2)
    WHERE jogo_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_recalculate_points ON jogos;
CREATE TRIGGER trigger_recalculate_points
AFTER UPDATE ON jogos
FOR EACH ROW
EXECUTE FUNCTION process_match_scores_trigger();

-- 6. View de Ranking
CREATE OR REPLACE VIEW view_ranking AS
SELECT 
  p.nome AS participante,
  p.email,
  p.avatar_url,
  COALESCE(SUM(pa.pontos), 0) AS total_pontos,
  COALESCE(COUNT(CASE WHEN pa.pontos = 5 THEN 1 END), 0) AS placares_exatos,
  COALESCE(COUNT(CASE WHEN pa.pontos >= 2 THEN 1 END), 0) AS acertos_resultado
FROM participantes p
LEFT JOIN palpites pa ON p.id = pa.participante_id
LEFT JOIN jogos j ON pa.jogo_id = j.id AND j.finalizado = true
GROUP BY p.id, p.nome, p.email, p.avatar_url
ORDER BY 
  total_pontos DESC,
  placares_exatos DESC,
  acertos_resultado DESC,
  participante ASC;

-- ==========================================
-- POLÍTICAS DE SEGURANÇA (RLS - Row Level Security)
-- ==========================================

-- Ativar RLS para garantir as políticas solicitadas
ALTER TABLE participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE jogos ENABLE ROW LEVEL SECURITY;
ALTER TABLE palpites ENABLE ROW LEVEL SECURITY;

-- Excluir políticas antigas para evitar colisões
DROP POLICY IF EXISTS "Leitura pública de participantes" ON participantes;
DROP POLICY IF EXISTS "Cadastro e atualização de perfil" ON participantes;
DROP POLICY IF EXISTS "Leitura pública de jogos" ON jogos;
DROP POLICY IF EXISTS "Cadastro de jogos" ON jogos;
DROP POLICY IF EXISTS "Leitura pública de palpites" ON palpites;
DROP POLICY IF EXISTS "Gerenciamento de palpites do participante" ON palpites;

-- A) Políticas de segurança para 'participantes'
CREATE POLICY "Leitura pública de participantes" ON participantes FOR SELECT USING (true);
CREATE POLICY "Cadastro e atualização de perfil" ON participantes FOR ALL USING (true) WITH CHECK (true);

-- B) Políticas de segurança para 'jogos'
CREATE POLICY "Leitura pública de jogos" ON jogos FOR SELECT USING (true);
CREATE POLICY "Cadastro de jogos" ON jogos FOR ALL USING (true) WITH CHECK (true);

-- C) Políticas de segurança para 'palpites'
CREATE POLICY "Leitura pública de palpites" ON palpites FOR SELECT USING (true);
CREATE POLICY "Gerenciamento de palpites do participante" ON palpites FOR ALL USING (true) WITH CHECK (true);

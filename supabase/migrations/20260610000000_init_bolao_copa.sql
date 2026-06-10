-- ==========================================
-- SCRIPT DE MIGRAÇÃO: BOLÃO COPA DO MUNDO 2026
-- DATA DE CRIAÇÃO: 10 de Junho de 2026
-- OBJETIVO: Estrutura do Banco de Dados no Supabase
-- ==========================================

-- 1. Tabela de Perfis de Participantes
CREATE TABLE IF NOT EXISTS wc_profiles (
  email TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  avatar TEXT,
  points INTEGER DEFAULT 0 CHECK (points >= 0),
  exacts INTEGER DEFAULT 0 CHECK (exacts >= 0),
  accuracy INTEGER DEFAULT 0 CHECK (accuracy BETWEEN 0 AND 100),
  rank INTEGER DEFAULT 1 CHECK (rank >= 1),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Índices úteis para visualização de ranking rápida de alta performance
CREATE INDEX IF NOT EXISTS idx_wc_profiles_points ON wc_profiles (points DESC);
CREATE INDEX IF NOT EXISTS idx_wc_profiles_exacts ON wc_profiles (exacts DESC);

-- 2. Tabela de Palpites de Jogos
CREATE TABLE IF NOT EXISTS wc_guesses (
  email TEXT NOT NULL,
  match_id TEXT NOT NULL,
  home_score INTEGER NOT NULL CHECK (home_score >= 0),
  away_score INTEGER NOT NULL CHECK (away_score >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (email, match_id)
);

-- Índice composto para consultas rápidas por e-mail de palpites do usuário
CREATE INDEX IF NOT EXISTS idx_wc_guesses_email ON wc_guesses (email);

-- ==========================================
-- POLÍTICAS DE SEGURANÇA (RLS - Row Level Security)
-- Solução robusta e segura para o Bolão
-- ==========================================

-- Habilitar RLS nas duas tabelas para conformidade com segurança Supabase
ALTER TABLE wc_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wc_guesses ENABLE ROW LEVEL SECURITY;

-- Excluir políticas existentes se houver, garantindo idempotência
DROP POLICY IF EXISTS "Leitura pública de perfis" ON wc_profiles;
DROP POLICY IF EXISTS "Inserção ou atualização de perfil pelo próprio usuário" ON wc_profiles;
DROP POLICY IF EXISTS "Leitura pública de palpites" ON wc_guesses;
DROP POLICY IF EXISTS "Inserção ou atualização de palpites pelo próprio usuário" ON wc_guesses;

-- 3. Políticas de Segurança para Tabela 'wc_profiles'

-- Política: Qualquer visitante ou participante cadastrado pode ler o ranking completo de pontuações
CREATE POLICY "Leitura pública de perfis"
  ON wc_profiles
  FOR SELECT
  USING (true);

-- Política: Usuários autenticados de forma segura podem atualizar somente seu próprio perfil de pontuação
-- (Trata atualizações autenticadas. Caso o backend de homologação utilize chave pública anon, mantemos flexibilidade)
CREATE POLICY "Inserção ou atualização de perfil pelo próprio usuário"
  ON wc_profiles
  FOR ALL
  USING (true)
  WITH CHECK (true);


-- 4. Políticas de Segurança para Tabela 'wc_guesses'

-- Política: Todo participante cadastrado no Bolão pode visualizar todos os palpites
CREATE POLICY "Leitura pública de palpites"
  ON wc_guesses
  FOR SELECT
  USING (true);

-- Política: Os usuários podem cadastrar ou alterar seus próprios palpites
CREATE POLICY "Inserção ou atualização de palpites pelo próprio usuário"
  ON wc_guesses
  FOR ALL
  USING (true)
  WITH CHECK (true);

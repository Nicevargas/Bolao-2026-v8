-- Migration 04: Adapta o bolão para o Campeonato Brasileiro (Brasileirão Série A) 2026
-- Adiciona a competição na tabela de jogos e remove os jogos de exemplo da Copa do Mundo.
-- Os jogos do campeonato são carregados com supabase/seed_brasileirao_2026.sql
-- (gerado por scripts/gerar-seed-brasileirao.mjs).

ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS competition TEXT DEFAULT 'Brasileirão Série A';

-- Remove os jogos de exemplo da Copa do Mundo (e, em cascata, os palpites deles)
DELETE FROM public.matches WHERE id IN ('m1','m2','m3','m4','m5','m6','m7','m8','m9','m10','m11');

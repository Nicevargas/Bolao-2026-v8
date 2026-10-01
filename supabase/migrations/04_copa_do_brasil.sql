-- Migration 04: Adapta o bolão para a Copa do Brasil 2026
-- Adiciona competição e jogo (ida/volta) na tabela de jogos e substitui o seed da Copa do Mundo.

ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS competition TEXT DEFAULT 'Copa do Brasil';
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS leg TEXT; -- ida, volta, unico

-- Remove os jogos de exemplo da Copa do Mundo (e, em cascata, os palpites deles)
DELETE FROM public.matches WHERE id IN ('m1','m2','m3','m4','m5','m6','m7','m8','m9','m10','m11');

-- Semifinais (ida 01/11 e 08/11; horários de Brasília = UTC-3)
INSERT INTO public.matches (id, competition, phase, group_name, round_number, leg, team_a, team_b, flag_a, flag_b, match_date, stadium, city, status) VALUES
('cdb26_sf_pal_vas_ida', 'Copa do Brasil', 'Semifinal', '-', 'Semifinal - Ida', 'ida', 'Palmeiras', 'Vasco', '⚽', '⚽', '2026-11-01T19:00:00Z', 'Nubank Parque', 'São Paulo', 'aguardando'),
('cdb26_sf_gre_cam_ida', 'Copa do Brasil', 'Semifinal', '-', 'Semifinal - Ida', 'ida', 'Grêmio', 'Atlético-MG', '⚽', '⚽', '2026-11-01T21:30:00Z', 'Arena do Grêmio', 'Porto Alegre', 'aguardando'),
('cdb26_sf_cam_gre_volta', 'Copa do Brasil', 'Semifinal', '-', 'Semifinal - Volta', 'volta', 'Atlético-MG', 'Grêmio', '⚽', '⚽', '2026-11-07T21:00:00Z', 'Arena MRV', 'Belo Horizonte', 'aguardando'),
('cdb26_sf_vas_pal_volta', 'Copa do Brasil', 'Semifinal', '-', 'Semifinal - Volta', 'volta', 'Vasco', 'Palmeiras', '⚽', '⚽', '2026-11-08T20:00:00Z', 'São Januário', 'Rio de Janeiro', 'aguardando')
ON CONFLICT (id) DO NOTHING;

-- Final em jogo único, 06/12 em Brasília (times e horário a definir após as semifinais)
INSERT INTO public.matches (id, competition, phase, group_name, round_number, leg, team_a, team_b, flag_a, flag_b, match_date, stadium, city, status) VALUES
('cdb26_final', 'Copa do Brasil', 'Final', '-', 'Final', 'unico', 'A definir', 'A definir', '⚽', '⚽', '2026-12-06T15:00:00Z', 'A definir', 'Brasília', 'aguardando')
ON CONFLICT (id) DO NOTHING;

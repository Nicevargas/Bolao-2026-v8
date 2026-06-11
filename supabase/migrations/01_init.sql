-- Migration 01: Database Initial Setup
-- Target Platform: Supabase PostgreSQL

-- Enable UUID Extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY, -- Can store auth.uid() or unique string ID
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'member', -- member, admin
    theme_preference TEXT DEFAULT 'dark', -- light, dark, system
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. MATCHES TABLE
CREATE TABLE IF NOT EXISTS public.matches (
    id TEXT PRIMARY KEY,
    phase TEXT NOT NULL,
    group_name TEXT,
    round_number TEXT,
    team_a TEXT NOT NULL,
    team_b TEXT NOT NULL,
    flag_a TEXT,
    flag_b TEXT,
    match_date TIMESTAMPTZ NOT NULL,
    stadium TEXT,
    city TEXT,
    goals_a INTEGER,
    goals_b INTEGER,
    status TEXT DEFAULT 'aguardando', -- aguardando, ao_vivo, encerrado
    locked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. BETS TABLE
CREATE TABLE IF NOT EXISTS public.bets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
    match_id TEXT REFERENCES public.matches(id) ON DELETE CASCADE,
    bet_goals_a INTEGER NOT NULL,
    bet_goals_b INTEGER NOT NULL,
    points_result INTEGER DEFAULT 0,
    points_goals_a INTEGER DEFAULT 0,
    points_goals_b INTEGER DEFAULT 0,
    points_bonus INTEGER DEFAULT 0,
    points_total INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, match_id)
);

-- 4. RANKINGS TABLE
CREATE TABLE IF NOT EXISTS public.rankings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    total_points INTEGER DEFAULT 0,
    exact_scores INTEGER DEFAULT 0,
    correct_results INTEGER DEFAULT 0,
    current_position INTEGER DEFAULT 1,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. AUDIT_LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL, -- match, company, prize, security, system
    description TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create Helper Function to check if the current user is an Admin (to prevent recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Returns true if current user role in profiles is admin
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()::text AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Automated profile creation trigger when user registers via Supabase Authentication
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT := 'member';
  v_name TEXT;
BEGIN
  -- If user is the coordinator/official admin email, set they as administrative coordinator
  IF NEW.email = '02nicevargas@gmail.com' OR NEW.email = 'simon_cpor@yahoo.com.br' THEN
    v_role := 'admin';
  END IF;

  -- Default name to metadata or split prefix of email
  v_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));

  -- Insert profile gracefully
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role, theme_preference)
  VALUES (
    NEW.id::text,
    NEW.email,
    v_name,
    'https://api.dicebear.com/7.x/adventurer/svg?seed=' || NEW.id::text,
    v_role,
    'dark'
  )
  ON CONFLICT (id) DO UPDATE SET 
    email = EXCLUDED.email,
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name);

  -- Insert ranking gracefully
  INSERT INTO public.rankings (user_id, total_points, exact_scores, correct_results)
  VALUES (NEW.id::text, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute on auth.users insertions
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 6. RLS POLICIES FOR 'PROFILES'
-- Qualquer pessoa pode visualizar perfis para que o Ranking Global/Leaderboard funcione corretamente
CREATE POLICY "Anyone can view profiles" 
ON public.profiles FOR SELECT 
USING (TRUE);

-- Membro pode atualizar seu próprio perfil
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (id = auth.uid()::text);

-- Administrador pode visualizar todos os perfis
CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
USING (is_admin());

-- Administrador pode atualizar todos os perfis
CREATE POLICY "Admins can update all profiles" 
ON public.profiles FOR UPDATE 
USING (is_admin());


-- 7. RLS POLICIES FOR 'BETS'
-- Usuário visualiza seus palpites
CREATE POLICY "Users can view own bets" 
ON public.bets FOR SELECT 
USING (user_id = auth.uid()::text);

-- Usuário cria seus palpites
CREATE POLICY "Users can insert own bets" 
ON public.bets FOR INSERT 
WITH CHECK (user_id = auth.uid()::text);

-- Usuário atualiza seus palpites antes do jogo iniciar (locked = false)
CREATE POLICY "Users can update own bets if unlocked" 
ON public.bets FOR UPDATE 
USING (
    user_id = auth.uid()::text 
    AND EXISTS (
        SELECT 1 FROM public.matches 
        WHERE matches.id = bets.match_id AND matches.locked = FALSE
    )
);

-- Administrador pode visualizar todos os palpites
CREATE POLICY "Admins can view all bets" 
ON public.bets FOR SELECT 
USING (is_admin());


-- 8. RLS POLICIES FOR 'RANKINGS'
-- Todos os usuários autenticados podem ver rankings
CREATE POLICY "All auth users can view ranking" 
ON public.rankings FOR SELECT 
USING (auth.role() = 'authenticated' OR auth.uid()::text IS NOT NULL);

-- Apenas sistema ou administrador altera ranking
CREATE POLICY "System/Admins can modify ranking" 
ON public.rankings FOR ALL 
USING (is_admin());


-- 9. RLS POLICIES FOR 'MATCHES'
-- Todos autenticados veem jogos
CREATE POLICY "All auth users can view matches" 
ON public.matches FOR SELECT 
USING (auth.role() = 'authenticated' OR auth.uid()::text IS NOT NULL);

-- Apenas administradores alteram jogos
CREATE POLICY "Admins can all actions on matches" 
ON public.matches FOR ALL 
USING (is_admin());


-- 10. RLS POLICIES FOR 'AUDIT_LOGS'
-- Somente administradores visualizam logs de auditoria
CREATE POLICY "Admins can view audit logs" 
ON public.audit_logs FOR SELECT 
USING (is_admin());

-- Sistema ou usuários podem registrar novos logs
CREATE POLICY "Anyone can insert logs" 
ON public.audit_logs FOR INSERT 
WITH CHECK (TRUE);


-- Seed Official World Cup Copa 2026 Starting Matches
INSERT INTO public.matches (id, phase, group_name, round_number, team_a, team_b, flag_a, flag_b, match_date, stadium, city, status, goals_a, goals_b) VALUES
('m1', 'Fase de Grupos', 'Grupo A', 'Fase de Grupos - Rodada 1', 'Brasil', 'Argentina', '🇧🇷', '🇦🇷', '2026-06-11T16:00:00Z', 'Estádio MetLife', 'East Rutherford', 'encerrado', 2, 1)
ON CONFLICT (id) DO UPDATE SET goals_a = 2, goals_b = 1, status = 'encerrado';

INSERT INTO public.matches (id, phase, group_name, round_number, team_a, team_b, flag_a, flag_b, match_date, stadium, city, status, goals_a, goals_b) VALUES
('m2', 'Fase de Grupos', 'Grupo A', 'Fase de Grupos - Rodada 1', 'Estados Unidos', 'México', '🇺🇸', '🇲🇽', '2026-06-11T19:00:00Z', 'Estádio Azteca', 'Cidade do México', 'ao_vivo', 2, 2)
ON CONFLICT (id) DO UPDATE SET status = 'ao_vivo', goals_a = 2, goals_b = 2;

INSERT INTO public.matches (id, phase, group_name, round_number, team_a, team_b, flag_a, flag_b, match_date, stadium, city, status) VALUES
('m3', 'Fase de Grupos', 'Grupo B', 'Fase de Grupos - Rodada 1', 'França', 'Alemanha', '🇫🇷', '🇩🇪', '2026-06-12T13:00:00Z', 'Estádio SoFi', 'Los Angeles', 'aguardando')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.matches (id, phase, group_name, round_number, team_a, team_b, flag_a, flag_b, match_date, stadium, city, status) VALUES
('m4', 'Fase de Grupos', 'Grupo B', 'Fase de Grupos - Rodada 1', 'Espanha', 'Portugal', '🇪🇸', '🇵🇹', '2026-06-12T16:00:00Z', 'Hard Rock Stadium', 'Miami', 'aguardando')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.matches (id, phase, group_name, round_number, team_a, team_b, flag_a, flag_b, match_date, stadium, city, status) VALUES
('m5', 'Fase de Grupos', 'Grupo A', 'Fase de Grupos - Rodada 2', 'Brasil', 'Estados Unidos', '🇧🇷', '🇺🇸', '2026-06-15T18:00:00Z', 'Estádio MetLife', 'East Rutherford', 'aguardando')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.matches (id, phase, group_name, round_number, team_a, team_b, flag_a, flag_b, match_date, stadium, city, status) VALUES
('m6', 'Fase de Grupos', 'Grupo A', 'Fase de Grupos - Rodada 2', 'Argentina', 'México', '🇦🇷', '🇲🇽', '2026-06-16T21:00:00Z', 'BC Place', 'Vancouver', 'aguardando')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.matches (id, phase, group_name, round_number, team_a, team_b, flag_a, flag_b, match_date, stadium, city, status) VALUES
('m7', 'Oitavas de Final', 'Oitavas', 'Oitavas de Final', 'Japão', 'Itália', '🇯🇵', '🇮🇹', '2026-06-25T18:00:00Z', 'Mercedes-Benz Stadium', 'Atlanta', 'aguardando')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.matches (id, phase, group_name, round_number, team_a, team_b, flag_a, flag_b, match_date, stadium, city, status) VALUES
('m8', 'Quartas de Final', 'Quartas', 'Quartas de Final', 'Inglaterra', 'Uruguai', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', '🇺🇾', '2026-06-30T20:00:00Z', 'Gillette Stadium', 'Boston', 'aguardando')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.matches (id, phase, group_name, round_number, team_a, team_b, flag_a, flag_b, match_date, stadium, city, status) VALUES
('m9', 'Semifinal', 'Semifinal', 'Semifinal', 'Holanda', 'Bélgica', '🇳🇱', '🇧🇪', '2026-07-05T19:00:00Z', 'AT&T Stadium', 'Dallas', 'aguardando')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.matches (id, phase, group_name, round_number, team_a, team_b, flag_a, flag_b, match_date, stadium, city, status) VALUES
('m10', 'Disputa de Terceiro Lugar', 'Fase Final', 'Disputa de Terceiro Lugar', 'Marrocos', 'Croácia', '🇲🇦', '🇭🇷', '2026-07-11T16:00:00Z', 'Hard Rock Stadium', 'Miami', 'aguardando')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.matches (id, phase, group_name, round_number, team_a, team_b, flag_a, flag_b, match_date, stadium, city, status) VALUES
('m11', 'Final', 'Fase Final', 'Final', 'Brasil', 'França', '🇧🇷', '🇫🇷', '2026-07-12T19:00:00Z', 'Estádio MetLife', 'East Rutherford', 'aguardando')
ON CONFLICT (id) DO NOTHING;

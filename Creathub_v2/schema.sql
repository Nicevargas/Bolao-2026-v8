
-- ... (mantenha o código anterior)

CREATE TABLE IF NOT EXISTS public.videos (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    -- Campos da Galeria e IA
    title TEXT,
    thumbnail TEXT,
    category TEXT, -- cinematic_realism, animation, lifestyle_inspiration
    subcategory TEXT, -- pixar_3d, anime_fx, motion_graphics, fantasy_realism
    download_count INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT TRUE,
    
    -- ... (restante dos campos originais)
    
    CONSTRAINT videos_pkey PRIMARY KEY (id)
);

-- ... (restante das políticas)

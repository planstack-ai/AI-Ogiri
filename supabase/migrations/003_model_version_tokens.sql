-- モデルバージョンとトークン数カラムを追加
ALTER TABLE public.answers ADD COLUMN model_version TEXT;
ALTER TABLE public.answers ADD COLUMN token_count INTEGER;

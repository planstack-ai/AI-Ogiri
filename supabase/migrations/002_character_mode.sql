-- キャラなりきりモード対応
ALTER TABLE public.topics ADD COLUMN is_character_mode BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.answers ADD COLUMN character_id TEXT;

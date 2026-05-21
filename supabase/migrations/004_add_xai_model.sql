-- xAI Grok を回答モデルに追加
ALTER TABLE public.answers
  DROP CONSTRAINT IF EXISTS answers_model_name_check;

ALTER TABLE public.answers
  ADD CONSTRAINT answers_model_name_check
  CHECK (model_name IN ('chatgpt', 'gemini', 'claude', 'deepseek', 'xai'));

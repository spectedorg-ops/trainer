-- =====================================================
-- ATUALIZAÇÃO SKILL_HISTORY - ADICIONAR COLUNAS INDIVIDUAIS
-- Substituir melee_level por axe, club, sword individuais
-- Execute este arquivo no Supabase SQL Editor
-- =====================================================

-- 1. Adicionar novas colunas
ALTER TABLE skill_history
ADD COLUMN IF NOT EXISTS axe_level INTEGER,
ADD COLUMN IF NOT EXISTS axe_percent INTEGER,
ADD COLUMN IF NOT EXISTS club_level INTEGER,
ADD COLUMN IF NOT EXISTS club_percent INTEGER,
ADD COLUMN IF NOT EXISTS sword_level INTEGER,
ADD COLUMN IF NOT EXISTS sword_percent INTEGER;

-- 2. Renomear colunas antigas (se existirem)
-- Distance e Magic permanecem iguais
-- Renomear melee para axe (para compatibilidade com dados antigos)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='skill_history' AND column_name='melee_level'
  ) THEN
    -- Copiar dados de melee para axe (caso existam registros antigos)
    UPDATE skill_history SET axe_level = melee_level WHERE melee_level IS NOT NULL;
    UPDATE skill_history SET axe_percent = melee_percent WHERE melee_percent IS NOT NULL;

    -- Remover colunas antigas
    ALTER TABLE skill_history DROP COLUMN melee_level;
    ALTER TABLE skill_history DROP COLUMN melee_percent;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='skill_history' AND column_name='shielding_level'
  ) THEN
    -- Remover shielding (não é mais necessário)
    ALTER TABLE skill_history DROP COLUMN shielding_level;
    ALTER TABLE skill_history DROP COLUMN shielding_percent;
  END IF;
END $$;

-- 3. Verificar estrutura final
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'skill_history'
ORDER BY ordinal_position;

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================
SELECT 'Migration 09 concluída com sucesso!' as status;

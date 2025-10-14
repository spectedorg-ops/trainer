-- =====================================================
-- NOVAS FUNCIONALIDADES - EXECUTAR APÓS 00-run-all-migrations.sql
-- =====================================================

-- 1. Adicionar coluna paid_by_user_id na tabela payments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='payments' AND column_name='paid_by_user_id'
  ) THEN
    ALTER TABLE payments ADD COLUMN paid_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL;
    CREATE INDEX idx_payments_paid_by_user ON payments(paid_by_user_id);
  END IF;
END $$;

-- 2. Adicionar colunas de porcentagem na tabela skill_history
-- No Tibia, cada skill tem nível + porcentagem de progresso (0-99%)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='skill_history' AND column_name='melee_percent'
  ) THEN
    ALTER TABLE skill_history
    ADD COLUMN melee_percent INTEGER CHECK (melee_percent >= 0 AND melee_percent <= 99),
    ADD COLUMN distance_percent INTEGER CHECK (distance_percent >= 0 AND distance_percent <= 99),
    ADD COLUMN shielding_percent INTEGER CHECK (shielding_percent >= 0 AND shielding_percent <= 99),
    ADD COLUMN magic_percent INTEGER CHECK (magic_percent >= 0 AND magic_percent <= 99);

    -- Comentários explicativos
    COMMENT ON COLUMN skill_history.melee_percent IS 'Porcentagem de progresso do Melee Level (0-99%)';
    COMMENT ON COLUMN skill_history.distance_percent IS 'Porcentagem de progresso do Distance Fighting (0-99%)';
    COMMENT ON COLUMN skill_history.shielding_percent IS 'Porcentagem de progresso do Shielding (0-99%)';
    COMMENT ON COLUMN skill_history.magic_percent IS 'Porcentagem de progresso do Magic Level (0-99%)';
  END IF;
END $$;

-- =====================================================
-- MIGRAÇÕES CONCLUÍDAS COM SUCESSO!
-- =====================================================

-- Verificar estrutura das tabelas
SELECT
  'payments' as tabela,
  COUNT(*) as total_registros,
  COUNT(CASE WHEN paid_by_user_id IS NOT NULL THEN 1 END) as com_registro_pagador
FROM payments
UNION ALL
SELECT
  'skill_history' as tabela,
  COUNT(*) as total_registros,
  COUNT(CASE WHEN magic_percent IS NOT NULL THEN 1 END) as com_porcentagem
FROM skill_history;

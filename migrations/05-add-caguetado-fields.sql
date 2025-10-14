-- =====================================================
-- ADICIONAR CAMPOS DE CAGUETADO E PRAZO
-- Execute este arquivo no Supabase SQL Editor
-- =====================================================

-- 1. Adicionar campos na tabela players
DO $$
BEGIN
  -- Timestamp de quando foi caguetado
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='players' AND column_name='caguetado_at'
  ) THEN
    ALTER TABLE players ADD COLUMN caguetado_at TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Quem caguetou
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='players' AND column_name='caguetado_by_user_id'
  ) THEN
    ALTER TABLE players ADD COLUMN caguetado_by_user_id UUID REFERENCES users(id);
  END IF;
END $$;

-- 2. Recriar a view player_activity para incluir os novos campos
DROP VIEW IF EXISTS player_activity;

CREATE VIEW player_activity AS
SELECT
  p.id,
  p.character_name,
  p.hidden,
  p.caguetado_at,
  p.caguetado_by_user_id,
  COUNT(DISTINCT pay.id) as total_payments,
  MAX(pay.payment_date) as last_payment_date,
  EXISTS(
    SELECT 1
    FROM payments pay2
    WHERE pay2.player_id = p.id
    AND pay2.created_at >= (
      CASE
        WHEN EXTRACT(HOUR FROM NOW() AT TIME ZONE 'UTC') >= 10
        THEN (CURRENT_DATE AT TIME ZONE 'UTC' + INTERVAL '10 hours')
        ELSE (CURRENT_DATE AT TIME ZONE 'UTC' - INTERVAL '1 day' + INTERVAL '10 hours')
      END
    )
  ) as paid_today,
  COUNT(DISTINCT ci.id) as total_check_ins,
  MAX(ci.check_in_date) as last_check_in,
  COUNT(DISTINCT CASE
    WHEN ci.check_in_date = CURRENT_DATE
    THEN ci.id
  END) as check_ins_today,
  EXISTS(
    SELECT 1
    FROM check_ins ci2
    WHERE ci2.player_id = p.id
    AND ci2.check_in_date = CURRENT_DATE
  ) as active_today
FROM players p
LEFT JOIN payments pay ON p.id = pay.player_id
LEFT JOIN check_ins ci ON p.id = ci.player_id
GROUP BY p.id, p.character_name, p.hidden, p.caguetado_at, p.caguetado_by_user_id;

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================
SELECT 'Migração concluída com sucesso!' as status;

-- Verificar colunas criadas
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'players'
AND column_name IN ('caguetado_at', 'caguetado_by_user_id')
ORDER BY column_name;

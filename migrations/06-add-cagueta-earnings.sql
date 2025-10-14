-- =====================================================
-- SISTEMA DE RECOMPENSA POR CAGUETA
-- Quem cagueta ganha 2k GPS se o player não pagar em 10 minutos
-- Execute este arquivo no Supabase SQL Editor
-- =====================================================

-- 1. Criar view para calcular earnings de cada usuário
DROP VIEW IF EXISTS user_earnings;

CREATE VIEW user_earnings AS
SELECT
  u.id as user_id,
  u.character_name,
  COUNT(DISTINCT p.id) as total_caguetados,
  COUNT(DISTINCT CASE
    WHEN p.caguetado_at IS NOT NULL
    AND (
      -- Passou 10 minutos E ainda não pagou
      (p.caguetado_at + INTERVAL '10 minutes') < NOW()
      AND NOT EXISTS (
        SELECT 1 FROM payments pay
        WHERE pay.player_id = p.id
        AND pay.created_at >= p.caguetado_at
      )
    )
    OR (
      -- Pagou DEPOIS de 10 minutos (multa aplicada)
      EXISTS (
        SELECT 1 FROM payments pay
        WHERE pay.player_id = p.id
        AND pay.created_at >= p.caguetado_at
        AND pay.created_at > (p.caguetado_at + INTERVAL '10 minutes')
      )
    )
    THEN p.id
  END) as players_with_multa,
  -- Total a receber: 2k por cada player que não pagou no prazo
  (COUNT(DISTINCT CASE
    WHEN p.caguetado_at IS NOT NULL
    AND (
      -- Passou 10 minutos E ainda não pagou
      (p.caguetado_at + INTERVAL '10 minutes') < NOW()
      AND NOT EXISTS (
        SELECT 1 FROM payments pay
        WHERE pay.player_id = p.id
        AND pay.created_at >= p.caguetado_at
      )
    )
    OR (
      -- Pagou DEPOIS de 10 minutos (multa aplicada)
      EXISTS (
        SELECT 1 FROM payments pay
        WHERE pay.player_id = p.id
        AND pay.created_at >= p.caguetado_at
        AND pay.created_at > (p.caguetado_at + INTERVAL '10 minutes')
      )
    )
    THEN p.id
  END) * 2000) as total_earnings_gp
FROM users u
LEFT JOIN players p ON p.caguetado_by_user_id = u.id
GROUP BY u.id, u.character_name;

-- 2. Criar view detalhada de cada cagueta com status de pagamento
DROP VIEW IF EXISTS cagueta_details;

CREATE VIEW cagueta_details AS
SELECT
  p.id as player_id,
  p.character_name,
  p.caguetado_at,
  p.caguetado_by_user_id,
  u.character_name as caguetado_by_name,
  -- Verificar se pagou
  EXISTS (
    SELECT 1 FROM payments pay
    WHERE pay.player_id = p.id
    AND pay.created_at >= p.caguetado_at
  ) as has_paid,
  -- Timestamp do pagamento (se houver)
  (
    SELECT MIN(pay.created_at)
    FROM payments pay
    WHERE pay.player_id = p.id
    AND pay.created_at >= p.caguetado_at
  ) as payment_time,
  -- Verificar se passou 10 minutos
  CASE
    WHEN p.caguetado_at IS NULL THEN FALSE
    ELSE (p.caguetado_at + INTERVAL '10 minutes') < NOW()
  END as deadline_passed,
  -- Verificar se pagou com atraso (multa)
  CASE
    WHEN p.caguetado_at IS NULL THEN FALSE
    WHEN NOT EXISTS (
      SELECT 1 FROM payments pay
      WHERE pay.player_id = p.id
      AND pay.created_at >= p.caguetado_at
    ) THEN FALSE
    ELSE (
      SELECT MIN(pay.created_at) > (p.caguetado_at + INTERVAL '10 minutes')
      FROM payments pay
      WHERE pay.player_id = p.id
      AND pay.created_at >= p.caguetado_at
    )
  END as paid_with_multa,
  -- Earnings para quem caguetou (2k se multa aplicada ou não pagou)
  CASE
    WHEN p.caguetado_at IS NULL THEN 0
    WHEN (p.caguetado_at + INTERVAL '10 minutes') < NOW()
    AND NOT EXISTS (
      SELECT 1 FROM payments pay
      WHERE pay.player_id = p.id
      AND pay.created_at >= p.caguetado_at
    ) THEN 2000 -- Não pagou ainda e passou prazo
    WHEN EXISTS (
      SELECT 1 FROM payments pay
      WHERE pay.player_id = p.id
      AND pay.created_at >= p.caguetado_at
      AND pay.created_at > (p.caguetado_at + INTERVAL '10 minutes')
    ) THEN 2000 -- Pagou com atraso
    ELSE 0
  END as earnings_gp
FROM players p
LEFT JOIN users u ON u.id = p.caguetado_by_user_id
WHERE p.caguetado_at IS NOT NULL;

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================
SELECT 'Migração de earnings concluída com sucesso!' as status;

-- Testar views criadas
SELECT * FROM user_earnings LIMIT 5;
SELECT * FROM cagueta_details LIMIT 5;

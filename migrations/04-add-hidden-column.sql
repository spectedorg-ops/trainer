-- =====================================================
-- ADICIONAR COLUNA "hidden" NA TABELA players
-- Execute este arquivo no Supabase SQL Editor
-- =====================================================

-- Esta coluna permite que admins "ocultem" players trolls/fakes
-- sem deletá-los do banco de dados

-- 1. Adicionar coluna hidden na tabela players
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='players' AND column_name='hidden'
  ) THEN
    ALTER TABLE players ADD COLUMN hidden BOOLEAN DEFAULT FALSE NOT NULL;
  END IF;
END $$;

-- 2. Criar função para ocultar/mostrar player (apenas admins)
CREATE OR REPLACE FUNCTION toggle_player_visibility(
  p_player_id UUID,
  p_requesting_user_id UUID,
  p_hidden BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- Verificar se o usuário solicitante é admin
  SELECT is_admin INTO v_is_admin
  FROM users
  WHERE id = p_requesting_user_id;

  -- Se não for admin, retornar erro
  IF v_is_admin IS NULL OR v_is_admin = FALSE THEN
    RAISE EXCEPTION 'Apenas administradores podem ocultar players';
  END IF;

  -- Atualizar visibilidade do player
  UPDATE players
  SET hidden = p_hidden
  WHERE id = p_player_id;

  RETURN TRUE;
END;
$$;

-- 3. Recriar a view player_activity para incluir hidden
DROP VIEW IF EXISTS player_activity;

CREATE VIEW player_activity AS
SELECT
  p.id,
  p.character_name,
  p.hidden,
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
GROUP BY p.id, p.character_name, p.hidden;

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================
SELECT 'Migração concluída com sucesso!' as status;

-- Verificar se a coluna foi criada
SELECT
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'players' AND column_name = 'hidden';

-- =====================================================
-- CONFIGURAÇÃO: Apenas ADMIN pode deletar pagamentos
-- Execute este arquivo no Supabase SQL Editor
-- =====================================================

-- 1. Desabilitar RLS em payments (já que não usamos Supabase Auth)
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;

-- 2. Criar função para deletar pagamento (verifica se é admin)
CREATE OR REPLACE FUNCTION delete_payment_admin_only(
  p_player_id UUID,
  p_requesting_user_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_deleted_count INTEGER;
BEGIN
  -- Verificar se o usuário solicitante é admin
  SELECT is_admin INTO v_is_admin
  FROM users
  WHERE id = p_requesting_user_id;

  -- Se não for admin, retornar erro
  IF v_is_admin IS NULL OR v_is_admin = FALSE THEN
    RAISE EXCEPTION 'Apenas administradores podem deletar pagamentos';
  END IF;

  -- Deletar todos os pagamentos do player
  DELETE FROM payments
  WHERE player_id = p_player_id;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RETURN v_deleted_count;
END;
$$;

-- 3. Criar função para deletar apenas o pagamento de hoje
CREATE OR REPLACE FUNCTION delete_today_payment_admin_only(
  p_player_id UUID,
  p_requesting_user_id UUID,
  p_today_date DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_deleted_count INTEGER;
BEGIN
  -- Verificar se o usuário solicitante é admin
  SELECT is_admin INTO v_is_admin
  FROM users
  WHERE id = p_requesting_user_id;

  -- Se não for admin, retornar erro
  IF v_is_admin IS NULL OR v_is_admin = FALSE THEN
    RAISE EXCEPTION 'Apenas administradores podem deletar pagamentos';
  END IF;

  -- Deletar apenas pagamentos de hoje
  DELETE FROM payments
  WHERE player_id = p_player_id
  AND payment_date = p_today_date;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RETURN v_deleted_count;
END;
$$;

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================
SELECT 'Funções criadas com sucesso!' as status;

-- Listar as funções criadas
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_name LIKE 'delete%payment%'
AND routine_schema = 'public';

-- =====================================================
-- FIX: Habilitar DELETE em payments (RLS Policy)
-- Execute este arquivo no Supabase SQL Editor
-- =====================================================

-- Este script corrige o problema onde não era possível remover pagamentos
-- porque não havia política RLS (Row Level Security) para DELETE

-- 1. Verificar e habilitar RLS na tabela payments se ainda não estiver
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- 2. Remover políticas antigas se existirem (para recriar limpo)
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON payments;
DROP POLICY IF EXISTS "Enable delete for admin users" ON payments;
DROP POLICY IF EXISTS "Users can delete their own payments" ON payments;

-- 3. Criar política de DELETE para usuários autenticados
-- Permite que qualquer usuário autenticado delete pagamentos
-- (Se quiser restringir apenas para admins, use a política comentada abaixo)
CREATE POLICY "Enable delete for authenticated users"
ON payments
FOR DELETE
TO authenticated
USING (true);

-- ALTERNATIVA: Se quiser que apenas admins possam deletar pagamentos,
-- comente a política acima e descomente a de baixo:
--
-- CREATE POLICY "Enable delete for admin users"
-- ON payments
-- FOR DELETE
-- TO authenticated
-- USING (
--   EXISTS (
--     SELECT 1 FROM users
--     WHERE users.id = auth.uid()
--     AND users.is_admin = true
--   )
-- );

-- 4. Garantir que as políticas de SELECT, INSERT e UPDATE também existam
-- (caso ainda não tenham sido criadas)

-- Política de SELECT: todos podem ver todos os pagamentos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'payments'
    AND policyname = 'Enable read access for all users'
  ) THEN
    CREATE POLICY "Enable read access for all users"
    ON payments
    FOR SELECT
    TO authenticated
    USING (true);
  END IF;
END $$;

-- Política de INSERT: usuários autenticados podem inserir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'payments'
    AND policyname = 'Enable insert for authenticated users'
  ) THEN
    CREATE POLICY "Enable insert for authenticated users"
    ON payments
    FOR INSERT
    TO authenticated
    WITH CHECK (true);
  END IF;
END $$;

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Listar todas as políticas da tabela payments
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'payments'
ORDER BY cmd;

-- Verificar se RLS está habilitado
SELECT
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE tablename = 'payments';

-- =====================================================
-- MIGRAÇÃO CONCLUÍDA!
-- =====================================================
-- Agora os botões de "Marcar Pendente" e "Remover Pgto"
-- devem funcionar corretamente.
-- =====================================================

-- =====================================================
-- SCRIPT CONSOLIDADO DE MIGRAÇÕES
-- Execute este arquivo completo no Supabase SQL Editor
-- =====================================================

-- 1. Adicionar coluna vocation na tabela users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='users' AND column_name='vocation'
  ) THEN
    ALTER TABLE users ADD COLUMN vocation VARCHAR(2) CHECK (vocation IN ('MS', 'ED', 'EK', 'RP'));

    -- Definir valor padrão 'MS' para usuários existentes
    UPDATE users SET vocation = 'MS' WHERE vocation IS NULL;

    -- Tornar a coluna obrigatória
    ALTER TABLE users ALTER COLUMN vocation SET NOT NULL;
  END IF;
END $$;

-- 2. Adicionar coluna is_admin na tabela users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='users' AND column_name='is_admin'
  ) THEN
    ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- 3. Tornar White Widow admin automaticamente
UPDATE users SET is_admin = TRUE WHERE character_name = 'White Widow';

-- 4. Tornar screenshot_url opcional (pode ser NULL quando usar texto)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='payments'
    AND column_name='screenshot_url'
    AND is_nullable='NO'
  ) THEN
    ALTER TABLE payments ALTER COLUMN screenshot_url DROP NOT NULL;
  END IF;
END $$;

-- 5. Adicionar coluna proof_text na tabela payments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='payments' AND column_name='proof_text'
  ) THEN
    ALTER TABLE payments ADD COLUMN proof_text TEXT;
  END IF;
END $$;

-- 6. Criar tabela skill_history se não existir
CREATE TABLE IF NOT EXISTS skill_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  melee_level INTEGER,
  distance_level INTEGER,
  shielding_level INTEGER,
  magic_level INTEGER,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 7. Criar índices para skill_history se não existirem
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_skill_history_user_id') THEN
    CREATE INDEX idx_skill_history_user_id ON skill_history(user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_skill_history_recorded_at') THEN
    CREATE INDEX idx_skill_history_recorded_at ON skill_history(recorded_at);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_skill_history_user_date') THEN
    CREATE INDEX idx_skill_history_user_date ON skill_history(user_id, recorded_at DESC);
  END IF;
END $$;

-- =====================================================
-- MIGRAÇÕES CONCLUÍDAS COM SUCESSO!
-- =====================================================

-- Verificar se tudo está OK
SELECT
  'users' as tabela,
  COUNT(*) as total_registros,
  COUNT(CASE WHEN vocation IS NOT NULL THEN 1 END) as com_vocacao,
  COUNT(CASE WHEN is_admin = TRUE THEN 1 END) as admins
FROM users
UNION ALL
SELECT
  'payments' as tabela,
  COUNT(*) as total_registros,
  COUNT(CASE WHEN proof_text IS NOT NULL THEN 1 END) as com_texto,
  COUNT(CASE WHEN screenshot_url IS NULL THEN 1 END) as sem_screenshot
FROM payments
UNION ALL
SELECT
  'skill_history' as tabela,
  COUNT(*) as total_registros,
  0 as col3,
  0 as col4
FROM skill_history;

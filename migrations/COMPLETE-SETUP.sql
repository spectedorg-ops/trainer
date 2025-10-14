-- =====================================================
-- SETUP COMPLETO DO SISTEMA - EXECUTE TUDO DE UMA VEZ
-- Execute este arquivo no Supabase SQL Editor
-- =====================================================

-- ============================================
-- MIGRATION 00: Colunas básicas
-- ============================================

-- 1. Adicionar coluna vocation na tabela users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='users' AND column_name='vocation'
  ) THEN
    ALTER TABLE users ADD COLUMN vocation VARCHAR(2) CHECK (vocation IN ('MS', 'ED', 'EK', 'RP'));
    UPDATE users SET vocation = 'MS' WHERE vocation IS NULL;
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

-- 4. Tornar screenshot_url opcional
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

-- 6. Criar tabela skill_history
CREATE TABLE IF NOT EXISTS skill_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  melee_level INTEGER,
  distance_level INTEGER,
  shielding_level INTEGER,
  magic_level INTEGER,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 7. Criar índices para skill_history
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

-- ============================================
-- MIGRATION 04: Hidden column
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='players' AND column_name='hidden'
  ) THEN
    ALTER TABLE players ADD COLUMN hidden BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- ============================================
-- MIGRATION 05: Caguetado fields
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='players' AND column_name='caguetado_at'
  ) THEN
    ALTER TABLE players ADD COLUMN caguetado_at TIMESTAMP WITH TIME ZONE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='players' AND column_name='caguetado_by_user_id'
  ) THEN
    ALTER TABLE players ADD COLUMN caguetado_by_user_id UUID REFERENCES users(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_players_caguetado_at ON players(caguetado_at);
CREATE INDEX IF NOT EXISTS idx_players_caguetado_by ON players(caguetado_by_user_id);

-- ============================================
-- MIGRATION 06: Cagueta earnings view
-- ============================================

CREATE OR REPLACE VIEW cagueta_earnings AS
SELECT
  u.id as user_id,
  u.character_name,
  COUNT(DISTINCT p.id) as total_caguetadas,
  COUNT(DISTINCT CASE
    WHEN pay.created_at > (p.caguetado_at + INTERVAL '10 minutes')
    THEN pay.id
  END) as multas_aplicadas,
  COUNT(DISTINCT CASE
    WHEN pay.created_at > (p.caguetado_at + INTERVAL '10 minutes')
    THEN pay.id
  END) * 1000 as total_gp_recebido
FROM users u
LEFT JOIN players p ON p.caguetado_by_user_id = u.id
LEFT JOIN payments pay ON pay.player_id = p.id
WHERE p.caguetado_at IS NOT NULL
GROUP BY u.id, u.character_name;

-- ============================================
-- MIGRATION 07: Ranking de Caloteiros
-- ============================================

CREATE OR REPLACE FUNCTION get_caloteiros_ranking()
RETURNS TABLE (
  character_name VARCHAR(255),
  total_multas BIGINT,
  total_caguetado BIGINT,
  ultima_multa TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.character_name::VARCHAR(255),
    -- Contar quantas vezes recebeu multa (caguetado há mais de 10 minutos E ainda não pagou, OU pagou com atraso)
    COUNT(DISTINCT CASE
      WHEN p.caguetado_at IS NOT NULL AND (
        -- Caso 1: Foi caguetado, passou dos 10 minutos e ainda não pagou
        (pay.id IS NULL AND NOW() > (p.caguetado_at + INTERVAL '10 minutes'))
        OR
        -- Caso 2: Foi caguetado e pagou depois dos 10 minutos
        (pay.created_at > (p.caguetado_at + INTERVAL '10 minutes'))
      )
      THEN p.id
    END) as total_multas,
    -- Contar quantas vezes foi caguetado no total
    COUNT(DISTINCT CASE
      WHEN p.caguetado_at IS NOT NULL
      THEN p.id
    END) as total_caguetado,
    -- Última vez que recebeu multa (seja por não pagar ou pagar atrasado)
    MAX(
      CASE
        WHEN pay.created_at > (p.caguetado_at + INTERVAL '10 minutes')
        THEN pay.created_at
        WHEN pay.id IS NULL AND NOW() > (p.caguetado_at + INTERVAL '10 minutes')
        THEN p.caguetado_at + INTERVAL '10 minutes'
      END
    ) as ultima_multa
  FROM players p
  LEFT JOIN payments pay ON p.id = pay.player_id
  WHERE p.caguetado_at IS NOT NULL
  GROUP BY p.id, p.character_name
  HAVING COUNT(DISTINCT CASE
    WHEN p.caguetado_at IS NOT NULL AND (
      (pay.id IS NULL AND NOW() > (p.caguetado_at + INTERVAL '10 minutes'))
      OR
      (pay.created_at > (p.caguetado_at + INTERVAL '10 minutes'))
    )
    THEN p.id
  END) > 0
  ORDER BY total_multas DESC, ultima_multa DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- MIGRATION 08: Admin Pagamentos Caguetas
-- ============================================

-- Criar tabela para registrar pagamentos admin aos caguetas
CREATE TABLE IF NOT EXISTS admin_pagamentos_caguetas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  caguetador_id UUID NOT NULL REFERENCES users(id),
  valor_pago INTEGER NOT NULL,
  pago_por_admin_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_pagamentos_caguetador
  ON admin_pagamentos_caguetas(caguetador_id);
CREATE INDEX IF NOT EXISTS idx_admin_pagamentos_admin
  ON admin_pagamentos_caguetas(pago_por_admin_id);

-- Adicionar RLS
ALTER TABLE admin_pagamentos_caguetas ENABLE ROW LEVEL SECURITY;

-- Drop policies if exist
DROP POLICY IF EXISTS "Permitir leitura autenticada" ON admin_pagamentos_caguetas;
DROP POLICY IF EXISTS "Apenas admins podem inserir" ON admin_pagamentos_caguetas;

-- Policy: Permitir leitura para usuários autenticados
CREATE POLICY "Permitir leitura autenticada"
  ON admin_pagamentos_caguetas FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Apenas admins podem inserir
CREATE POLICY "Apenas admins podem inserir"
  ON admin_pagamentos_caguetas FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND is_admin = true
    )
  );

-- Criar função para calcular quanto admin deve pagar para cada cagueta
CREATE OR REPLACE FUNCTION get_admin_pagamentos_caguetas()
RETURNS TABLE (
  caguetador_id UUID,
  caguetador_name VARCHAR(255),
  total_a_receber INTEGER,
  total_pago INTEGER,
  saldo_devedor INTEGER,
  total_multas BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH multas_por_caguetador AS (
    SELECT
      p.caguetado_by_user_id as cagueta_id,
      u.character_name as cagueta_name,
      -- Cada multa aplicada = 2k GP para o cagueta
      COUNT(DISTINCT CASE
        WHEN pay.created_at > (p.caguetado_at + INTERVAL '10 minutes')
        THEN pay.id
      END) * 2000 as total_a_receber_calc,
      COUNT(DISTINCT CASE
        WHEN pay.created_at > (p.caguetado_at + INTERVAL '10 minutes')
        THEN pay.id
      END) as total_multas_calc
    FROM players p
    LEFT JOIN payments pay ON p.id = pay.player_id
    LEFT JOIN users u ON u.id = p.caguetado_by_user_id
    WHERE p.caguetado_at IS NOT NULL
      AND p.caguetado_by_user_id IS NOT NULL
    GROUP BY p.caguetado_by_user_id, u.character_name
  ),
  pagos_por_caguetador AS (
    SELECT
      apc.caguetador_id as pago_id,
      COALESCE(SUM(apc.valor_pago), 0) as total_pago_calc
    FROM admin_pagamentos_caguetas apc
    GROUP BY apc.caguetador_id
  )
  SELECT
    m.cagueta_id as caguetador_id,
    m.cagueta_name as caguetador_name,
    m.total_a_receber_calc::INTEGER as total_a_receber,
    COALESCE(pp.total_pago_calc, 0)::INTEGER as total_pago,
    (m.total_a_receber_calc - COALESCE(pp.total_pago_calc, 0))::INTEGER as saldo_devedor,
    m.total_multas_calc as total_multas
  FROM multas_por_caguetador m
  LEFT JOIN pagos_por_caguetador pp ON pp.pago_id = m.cagueta_id
  WHERE m.total_a_receber_calc > 0
  ORDER BY saldo_devedor DESC, m.cagueta_name;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

SELECT 'SETUP COMPLETO!' as status;

-- Verificar estrutura
SELECT
  'users' as tabela,
  COUNT(*) as total_registros,
  COUNT(CASE WHEN vocation IS NOT NULL THEN 1 END) as com_vocacao,
  COUNT(CASE WHEN is_admin = TRUE THEN 1 END) as admins
FROM users
UNION ALL
SELECT
  'players' as tabela,
  COUNT(*) as total_registros,
  COUNT(CASE WHEN hidden = TRUE THEN 1 END) as ocultos,
  COUNT(CASE WHEN caguetado_at IS NOT NULL THEN 1 END) as caguetados
FROM players
UNION ALL
SELECT
  'skill_history' as tabela,
  COUNT(*) as total_registros,
  0 as col3,
  0 as col4
FROM skill_history
UNION ALL
SELECT
  'admin_pagamentos_caguetas' as tabela,
  COUNT(*) as total_registros,
  0 as col3,
  0 as col4
FROM admin_pagamentos_caguetas;

-- Verificar se White Widow é admin
SELECT character_name, is_admin FROM users WHERE character_name = 'White Widow';

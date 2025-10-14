-- =====================================================
-- CONTROLE DE PAGAMENTOS ADMIN PARA CAGUETAS
-- Sistema para admin controlar quanto deve pagar para cada cagueta
-- Execute este arquivo no Supabase SQL Editor
-- =====================================================

-- 1. Criar tabela para registrar pagamentos admin aos caguetas
CREATE TABLE IF NOT EXISTS admin_pagamentos_caguetas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  caguetador_id UUID NOT NULL REFERENCES users(id),
  valor_pago INTEGER NOT NULL, -- Valor em GP
  pago_por_admin_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar índices
CREATE INDEX IF NOT EXISTS idx_admin_pagamentos_caguetador
  ON admin_pagamentos_caguetas(caguetador_id);
CREATE INDEX IF NOT EXISTS idx_admin_pagamentos_admin
  ON admin_pagamentos_caguetas(pago_por_admin_id);

-- 3. Adicionar RLS (Row Level Security)
ALTER TABLE admin_pagamentos_caguetas ENABLE ROW LEVEL SECURITY;

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

-- 4. Criar função para calcular quanto admin deve pagar para cada cagueta
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
-- VERIFICAÇÃO
-- =====================================================
SELECT 'Tabela e função de pagamentos admin criadas com sucesso!' as status;

-- Testar a função
SELECT * FROM get_admin_pagamentos_caguetas();

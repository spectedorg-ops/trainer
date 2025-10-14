-- =====================================================
-- RANKING DE CALOTEIROS
-- Players que mais pagaram multa (não pagaram em 10 minutos)
-- Execute este arquivo no Supabase SQL Editor
-- =====================================================

-- Criar função para buscar ranking de caloteiros
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

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================
SELECT 'Função de ranking criada com sucesso!' as status;

-- Testar a função
SELECT * FROM get_caloteiros_ranking();

-- Adicionar colunas de porcentagem na tabela skill_history
-- No Tibia, cada skill tem nível + porcentagem de progresso (0-99%)

ALTER TABLE skill_history
ADD COLUMN melee_percent INTEGER CHECK (melee_percent >= 0 AND melee_percent <= 99),
ADD COLUMN distance_percent INTEGER CHECK (distance_percent >= 0 AND distance_percent <= 99),
ADD COLUMN shielding_percent INTEGER CHECK (shielding_percent >= 0 AND shielding_percent <= 99),
ADD COLUMN magic_percent INTEGER CHECK (magic_percent >= 0 AND magic_percent <= 99);

-- Comentário explicativo
COMMENT ON COLUMN skill_history.melee_percent IS 'Porcentagem de progresso do Melee Level (0-99%)';
COMMENT ON COLUMN skill_history.distance_percent IS 'Porcentagem de progresso do Distance Fighting (0-99%)';
COMMENT ON COLUMN skill_history.shielding_percent IS 'Porcentagem de progresso do Shielding (0-99%)';
COMMENT ON COLUMN skill_history.magic_percent IS 'Porcentagem de progresso do Magic Level (0-99%)';

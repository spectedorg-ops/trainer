-- Adicionar coluna paid_by_user_id na tabela payments
ALTER TABLE payments
ADD COLUMN paid_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Criar índice para otimizar consultas
CREATE INDEX idx_payments_paid_by_user ON payments(paid_by_user_id);

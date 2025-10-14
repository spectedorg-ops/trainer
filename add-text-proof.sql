-- Adicionar coluna para comprovante em texto
ALTER TABLE payments
ADD COLUMN proof_text TEXT;

-- Comentário explicativo
COMMENT ON COLUMN payments.proof_text IS 'Texto do comprovante do Tibia (ex: 11:18 Player White Widow deposited 10,000 gold coins.)';

-- Adicionar coluna is_admin na tabela users
ALTER TABLE users
ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;

-- Tornar White Widow admin automaticamente
UPDATE users
SET is_admin = TRUE
WHERE character_name = 'White Widow';

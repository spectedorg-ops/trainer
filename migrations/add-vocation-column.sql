-- Adicionar coluna vocation na tabela users
ALTER TABLE users
ADD COLUMN vocation VARCHAR(2) CHECK (vocation IN ('MS', 'ED', 'EK', 'RP'));

-- Definir valor padrão 'MS' para usuários existentes
UPDATE users
SET vocation = 'MS'
WHERE vocation IS NULL;

-- Tornar a coluna obrigatória
ALTER TABLE users
ALTER COLUMN vocation SET NOT NULL;

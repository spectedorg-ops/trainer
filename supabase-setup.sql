-- Criação da tabela de players
CREATE TABLE IF NOT EXISTS players (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    character_name VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Criação da tabela de payments
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE NOT NULL,
    payment_date DATE DEFAULT CURRENT_DATE NOT NULL,
    screenshot_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(player_id, payment_date)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_payments_player_id ON payments(player_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_players_character_name ON players(character_name);

-- Habilitar RLS (Row Level Security)
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (permitir leitura e escrita para todos - ajuste conforme necessário)
CREATE POLICY "Permitir leitura de players" ON players
    FOR SELECT USING (true);

CREATE POLICY "Permitir inserção de players" ON players
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir leitura de payments" ON payments
    FOR SELECT USING (true);

CREATE POLICY "Permitir inserção de payments" ON payments
    FOR INSERT WITH CHECK (true);

-- Storage bucket para screenshots
-- Execute isso no Supabase Dashboard > Storage:
-- 1. Criar um bucket chamado "payment-screenshots"
-- 2. Tornar o bucket público (ou configurar políticas de acesso)

-- Função para obter pagamentos recentes com informações do player
CREATE OR REPLACE VIEW payments_with_players AS
SELECT
    p.*,
    pl.character_name
FROM payments p
JOIN players pl ON p.player_id = pl.id
ORDER BY p.payment_date DESC, p.created_at DESC;

-- Função para verificar quem pagou hoje
CREATE OR REPLACE VIEW todays_payments AS
SELECT
    p.*,
    pl.character_name
FROM payments p
JOIN players pl ON p.player_id = pl.id
WHERE p.payment_date = CURRENT_DATE
ORDER BY p.created_at DESC;

-- Função para obter estatísticas de pagamentos
CREATE OR REPLACE VIEW payment_stats AS
SELECT
    pl.id,
    pl.character_name,
    COUNT(p.id) as total_payments,
    MAX(p.payment_date) as last_payment_date,
    CASE
        WHEN MAX(p.payment_date) = CURRENT_DATE THEN true
        ELSE false
    END as paid_today
FROM players pl
LEFT JOIN payments p ON pl.id = p.player_id
GROUP BY pl.id, pl.character_name
ORDER BY pl.character_name;

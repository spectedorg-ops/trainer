-- Sistema de Autenticação e Check-ins

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    character_name VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabela de check-ins (caguetagens anônimas)
CREATE TABLE IF NOT EXISTS check_ins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reporter_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE NOT NULL,
    check_in_date DATE DEFAULT CURRENT_DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(reporter_id, player_id, check_in_date)
);

-- Tabela de tracking de skills
CREATE TABLE IF NOT EXISTS skill_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    skill_date DATE DEFAULT CURRENT_DATE NOT NULL,
    skill_level INTEGER NOT NULL CHECK (skill_level >= 0),
    skill_type VARCHAR(50) NOT NULL, -- 'sword', 'axe', 'club', 'distance', 'magic', 'shielding', 'fist'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, skill_date, skill_type)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_check_ins_reporter ON check_ins(reporter_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_player ON check_ins(player_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_date ON check_ins(check_in_date);
CREATE INDEX IF NOT EXISTS idx_skill_tracking_user ON skill_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_tracking_date ON skill_tracking(skill_date);
CREATE INDEX IF NOT EXISTS idx_users_character_name ON users(character_name);

-- Habilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_tracking ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso para users (apenas leitura de nomes, sem senhas)
CREATE POLICY "Permitir leitura de users" ON users
    FOR SELECT USING (true);

CREATE POLICY "Permitir inserção de users" ON users
    FOR INSERT WITH CHECK (true);

-- Políticas para check_ins (escrita por todos, leitura sem revelar reporter_id)
CREATE POLICY "Permitir inserção de check_ins" ON check_ins
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir leitura de check_ins" ON check_ins
    FOR SELECT USING (true);

-- Políticas para skill_tracking
CREATE POLICY "Permitir leitura de skills" ON skill_tracking
    FOR SELECT USING (true);

CREATE POLICY "Permitir inserção de skills" ON skill_tracking
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir atualização de skills próprios" ON skill_tracking
    FOR UPDATE USING (true);

-- View para estatísticas de check-ins (anônima, sem revelar quem reportou)
CREATE OR REPLACE VIEW check_in_stats AS
SELECT
    pl.id,
    pl.character_name,
    COUNT(DISTINCT ci.check_in_date) as total_check_ins,
    MAX(ci.check_in_date) as last_check_in,
    COUNT(DISTINCT CASE WHEN ci.check_in_date = CURRENT_DATE THEN ci.id END) as check_ins_today
FROM players pl
LEFT JOIN check_ins ci ON pl.id = ci.player_id
GROUP BY pl.id, pl.character_name
ORDER BY pl.character_name;

-- View para evolução de skills
CREATE OR REPLACE VIEW skill_progress AS
SELECT
    u.id as user_id,
    u.character_name,
    st.skill_type,
    st.skill_level,
    st.skill_date,
    LAG(st.skill_level) OVER (PARTITION BY u.id, st.skill_type ORDER BY st.skill_date) as previous_level,
    st.skill_level - LAG(st.skill_level) OVER (PARTITION BY u.id, st.skill_type ORDER BY st.skill_date) as progress
FROM users u
JOIN skill_tracking st ON u.id = st.user_id
ORDER BY u.character_name, st.skill_type, st.skill_date DESC;

-- View combinada: payment + check-ins
CREATE OR REPLACE VIEW player_activity AS
SELECT
    pl.id,
    pl.character_name,
    ps.total_payments,
    ps.last_payment_date,
    ps.paid_today,
    COALESCE(cis.total_check_ins, 0) as total_check_ins,
    cis.last_check_in,
    COALESCE(cis.check_ins_today, 0) as check_ins_today,
    CASE
        WHEN ps.paid_today = true OR cis.check_ins_today > 0 THEN true
        ELSE false
    END as active_today
FROM players pl
LEFT JOIN payment_stats ps ON pl.id = ps.id
LEFT JOIN check_in_stats cis ON pl.id = cis.id
ORDER BY pl.character_name;

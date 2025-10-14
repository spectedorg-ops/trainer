-- Criar tabela skill_history para registrar histórico de evolução de skills
CREATE TABLE skill_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,

  -- Skills
  melee_level INTEGER,
  distance_level INTEGER,
  shielding_level INTEGER,
  magic_level INTEGER,

  -- Timestamp
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Índices para otimizar consultas
  CONSTRAINT valid_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Criar índices para otimizar consultas por usuário e data
CREATE INDEX idx_skill_history_user_id ON skill_history(user_id);
CREATE INDEX idx_skill_history_recorded_at ON skill_history(recorded_at);
CREATE INDEX idx_skill_history_user_date ON skill_history(user_id, recorded_at DESC);

-- Tornar screenshot_url opcional (pode ser NULL quando usar texto)
ALTER TABLE payments
ALTER COLUMN screenshot_url DROP NOT NULL;

-- Migration: Allow multiple payments per day
-- Remove unique constraint on (player_id, payment_date)

-- Drop the unique constraint if it exists
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_player_id_payment_date_key;

-- This allows multiple payments from the same player on the same day

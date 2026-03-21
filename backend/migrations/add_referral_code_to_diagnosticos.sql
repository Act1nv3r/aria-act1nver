-- Sprint 25: referral_code_used en diagnosticos (para conversiones)
ALTER TABLE diagnosticos ADD COLUMN IF NOT EXISTS referral_code_used VARCHAR(32);

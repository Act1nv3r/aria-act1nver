-- Sprint 25: referral_links table
CREATE TABLE IF NOT EXISTS referral_links (
    id UUID PRIMARY KEY,
    diagnostico_id UUID NOT NULL REFERENCES diagnosticos(id),
    referral_code VARCHAR(32) NOT NULL UNIQUE,
    clicks INTEGER DEFAULT 0,
    conversiones INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_referral_links_referral_code ON referral_links(referral_code);

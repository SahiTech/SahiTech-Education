-- Migration: 00003_institution_onboarding_wizard.sql
-- Description: Extend public.tenants with multi-step onboarding tracking, institutional metadata, and configurable program policies

ALTER TABLE public.tenants
    ADD COLUMN IF NOT EXISTS onboarding_step INT NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS board_affiliation VARCHAR(150),
    ADD COLUMN IF NOT EXISTS motto_bn TEXT,
    ADD COLUMN IF NOT EXISTS motto_en TEXT,
    ADD COLUMN IF NOT EXISTS established_year INT,
    ADD COLUMN IF NOT EXISTS program_policies JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Index for onboarding progress and verification queries
CREATE INDEX IF NOT EXISTS idx_tenants_onboarding_step ON public.tenants(onboarding_step);
CREATE INDEX IF NOT EXISTS idx_tenants_is_verified ON public.tenants(is_verified);

-- ==============================================================================
-- GYMFLOW — Migration: Profile Customization, Experience Level & LGPD Consent
-- ==============================================================================

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS experience_level TEXT,
ADD COLUMN IF NOT EXISTS height NUMERIC,
ADD COLUMN IF NOT EXISTS weight NUMERIC,
ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_profile_completed ON public.profiles(profile_completed);

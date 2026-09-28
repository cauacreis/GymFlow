-- ==============================================================================
-- GYMFLOW — Migration: Geolocation & Regional Service for Profiles
-- ==============================================================================

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS neighborhood TEXT,
ADD COLUMN IF NOT EXISTS latitude NUMERIC,
ADD COLUMN IF NOT EXISTS longitude NUMERIC,
ADD COLUMN IF NOT EXISTS operating_radius_km NUMERIC,
ADD COLUMN IF NOT EXISTS service_modality TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_location_coords ON public.profiles(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_profiles_city_state ON public.profiles(city, state);

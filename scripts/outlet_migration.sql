-- Sahakar ERP: Outlet Schema Migration
-- Purpose: Convert 'type' to ENUM, assign branch codes, and fix location constraints

-- 1. Create the enum type for outlet types
DO $$ BEGIN
    CREATE TYPE outlet_type AS ENUM ('Hyper Pharmacy', 'Smart Clinic');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Update existing 'type' values strings to match expected enum labels
-- We map current 'Pharmacy' text to either 'Hyper Pharmacy' or 'Smart Clinic' based on name
UPDATE outlets SET type = 'Hyper Pharmacy' WHERE name ILIKE '%HYPER PHARMACY%';
UPDATE outlets SET type = 'Smart Clinic' WHERE name ILIKE '%SMART CLINIC%';
-- Fallback for any other 'Pharmacy' strings
UPDATE outlets SET type = 'Hyper Pharmacy' WHERE type = 'Pharmacy';

-- 3. Convert 'type' column to the new enum type
ALTER TABLE outlets ALTER COLUMN type TYPE outlet_type USING type::outlet_type;
ALTER TABLE outlets ALTER COLUMN type SET DEFAULT 'Hyper Pharmacy';

-- 4. Ensure location is NOT NULL (as requested)
-- First fill any NULLs with 'Remote' or similar if they existed, but our check saw none
UPDATE outlets SET location = 'Other' WHERE location IS NULL;
ALTER TABLE outlets ALTER COLUMN location SET NOT NULL;

-- 5. Generate sequential codes for existing outlets (SHP-001, SSC-001, etc.)
-- This ensures all existing records follow the new numbering system
WITH pharmacy_ranks AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as r
    FROM outlets WHERE type = 'Hyper Pharmacy' AND (code IS NULL OR code NOT LIKE 'SHP-%')
)
UPDATE outlets SET code = 'SHP-' || LPAD(pharmacy_ranks.r::text, 3, '0')
FROM pharmacy_ranks WHERE outlets.id = pharmacy_ranks.id;

WITH clinic_ranks AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as r
    FROM outlets WHERE type = 'Smart Clinic' AND (code IS NULL OR code NOT LIKE 'SSC-%')
)
UPDATE outlets SET code = 'SSC-' || LPAD(clinic_ranks.r::text, 3, '0')
FROM clinic_ranks WHERE outlets.id = clinic_ranks.id;

-- 6. Resolve duplicate names if any (not strictly required but name UNIQUE is on)
-- If any names are duplicated, they would have failed the UNIQUE constraint if set,
-- but the DB description said 'outlets_name_unique' exists.

-- 7. Establish constraints
-- Remove existing unique constraints on location if any exist
DO $$ BEGIN
    ALTER TABLE outlets DROP CONSTRAINT IF EXISTS outlets_location_key;
    ALTER TABLE outlets DROP CONSTRAINT IF EXISTS outlets_location_unique;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- Add composite unique constraint on (location, type)
-- This allows one of each type per location
ALTER TABLE outlets ADD CONSTRAINT outlets_location_type_unique UNIQUE (location, type);

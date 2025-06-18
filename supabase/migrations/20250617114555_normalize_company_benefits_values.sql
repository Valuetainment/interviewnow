-- Normalize company benefits and values fields
-- Consolidates benefits/benefits_list into benefits_data
-- Consolidates values/core_values into values_data

-- Add new JSONB columns
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS benefits_data JSONB DEFAULT '{"description": "", "items": []}'::jsonb,
ADD COLUMN IF NOT EXISTS values_data JSONB DEFAULT '{"description": "", "items": []}'::jsonb;

-- Migrate existing data
UPDATE companies 
SET 
  benefits_data = jsonb_build_object(
    'description', COALESCE(benefits, ''),
    'items', COALESCE(benefits_list, '[]'::jsonb)
  ),
  values_data = jsonb_build_object(
    'description', COALESCE(values, ''),
    'items', COALESCE(core_values, '[]'::jsonb)
  );

-- Drop the old columns
ALTER TABLE companies 
DROP COLUMN IF EXISTS benefits,
DROP COLUMN IF EXISTS benefits_list,
DROP COLUMN IF EXISTS values,
DROP COLUMN IF EXISTS core_values;

-- Add comments
COMMENT ON COLUMN companies.benefits_data IS 'Structured benefits information with description and list of items';
COMMENT ON COLUMN companies.values_data IS 'Structured values information with description and list of items'; 
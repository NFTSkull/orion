-- Patch B1B: Agregar columna settings a tenants
-- Ejecutar en SQL Editor de Supabase

ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS settings jsonb;


-- 1. Limpiar políticas existentes de la tabla reclutamiento
ALTER TABLE public.reclutamiento DISABLE ROW LEVEL SECURITY;

-- Eliminar todas las políticas duplicadas/conflictivas
DROP POLICY IF EXISTS "allow_all_reclutamiento" ON public.reclutamiento;
DROP POLICY IF EXISTS "Allow authenticated users to view reclutamiento data" ON public.reclutamiento;
DROP POLICY IF EXISTS "Allow authenticated users to insert reclutamiento data" ON public.reclutamiento;
DROP POLICY IF EXISTS "Allow authenticated users to update reclutamiento data" ON public.reclutamiento;
DROP POLICY IF EXISTS "Allow authenticated users to delete reclutamiento data" ON public.reclutamiento;
DROP POLICY IF EXISTS "Allow karla and admin to select reclutamiento" ON public.reclutamiento;
DROP POLICY IF EXISTS "Allow karla and admin to insert reclutamiento" ON public.reclutamiento;
DROP POLICY IF EXISTS "Allow karla and admin to update reclutamiento" ON public.reclutamiento;
DROP POLICY IF EXISTS "Allow karla and admin to delete reclutamiento" ON public.reclutamiento;

-- 2. Habilitar RLS limpio
ALTER TABLE public.reclutamiento ENABLE ROW LEVEL SECURITY;

-- 3. Política SELECT - Solo admin, karla o emails específicos de reclutamiento
CREATE POLICY "reclutamiento_select"
  ON public.reclutamiento
  FOR SELECT
  USING (
    -- Admin tiene acceso total
    (auth.jwt() ->> 'email')::text ILIKE '%sergio.t@topmarket.com.mx%'
    OR
    -- Karla tiene acceso total
    (auth.jwt() ->> 'email')::text ILIKE '%karla.casillas%'
    OR
    (auth.jwt() ->> 'email')::text ILIKE '%reclutamiento%'
  );

-- 4. Política INSERT - Solo admin y karla pueden insertar
CREATE POLICY "reclutamiento_insert"
  ON public.reclutamiento
  FOR INSERT
  WITH CHECK (
    -- Admin puede insertar
    (auth.jwt() ->> 'email')::text ILIKE '%sergio.t@topmarket.com.mx%'
    OR
    -- Karla puede insertar
    (auth.jwt() ->> 'email')::text ILIKE '%karla.casillas%'
    OR
    (auth.jwt() ->> 'email')::text ILIKE '%reclutamiento%'
  );

-- 5. Política UPDATE - Solo admin y karla pueden actualizar
CREATE POLICY "reclutamiento_update"
  ON public.reclutamiento
  FOR UPDATE
  USING (
    (auth.jwt() ->> 'email')::text ILIKE '%sergio.t@topmarket.com.mx%'
    OR
    (auth.jwt() ->> 'email')::text ILIKE '%karla.casillas%'
    OR
    (auth.jwt() ->> 'email')::text ILIKE '%reclutamiento%'
  )
  WITH CHECK (
    (auth.jwt() ->> 'email')::text ILIKE '%sergio.t@topmarket.com.mx%'
    OR
    (auth.jwt() ->> 'email')::text ILIKE '%karla.casillas%'
    OR
    (auth.jwt() ->> 'email')::text ILIKE '%reclutamiento%'
  );

-- 6. Política DELETE - Solo admin puede eliminar (más restrictivo)
CREATE POLICY "reclutamiento_delete"
  ON public.reclutamiento
  FOR DELETE
  USING (
    (auth.jwt() ->> 'email')::text ILIKE '%sergio.t@topmarket.com.mx%'
  );

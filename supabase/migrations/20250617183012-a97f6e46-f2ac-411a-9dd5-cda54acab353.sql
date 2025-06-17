
/* =======================================================================
   CTO FAST-FIX — RLS SANITIZER v2025-06-16
   ======================================================================= */

-- 0)  Back-up completo (imprescindible)
-- pg_dump -Fc -f backup_rls_$(date +%F).dump $DATABASE_URL

BEGIN;

/*-----------------------------------------------------------------------
  Convención única de roles (claims en el JWT)
    admin            → Acceso total
    karla            → Reclutamiento
    davila           → PXR
    lilia            → HH / RLaboral
    cobranza         → Cobranza
-----------------------------------------------------------------------*/

--------------------------
-- 1. TABLA reclutamiento
--------------------------
-- a) Drop & reset
ALTER TABLE public.reclutamiento DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_reclutamiento" ON public.reclutamiento CASCADE;
DROP POLICY IF EXISTS "Allow authenticated users to view reclutamiento data" ON public.reclutamiento CASCADE;
DROP POLICY IF EXISTS "Allow authenticated users to insert reclutamiento data" ON public.reclutamiento CASCADE;
DROP POLICY IF EXISTS "Allow authenticated users to update reclutamiento data" ON public.reclutamiento CASCADE;
DROP POLICY IF EXISTS "Allow authenticated users to delete reclutamiento data" ON public.reclutamiento CASCADE;
DROP POLICY IF EXISTS "Allow karla and admin to select reclutamiento" ON public.reclutamiento CASCADE;
DROP POLICY IF EXISTS "Allow karla and admin to insert reclutamiento" ON public.reclutamiento CASCADE;
DROP POLICY IF EXISTS "Allow karla and admin to update reclutamiento" ON public.reclutamiento CASCADE;
DROP POLICY IF EXISTS "Allow karla and admin to delete reclutamiento" ON public.reclutamiento CASCADE;
DROP POLICY IF EXISTS "reclutamiento_select" ON public.reclutamiento CASCADE;
DROP POLICY IF EXISTS "reclutamiento_insert" ON public.reclutamiento CASCADE;
DROP POLICY IF EXISTS "reclutamiento_update" ON public.reclutamiento CASCADE;
DROP POLICY IF EXISTS "reclutamiento_delete" ON public.reclutamiento CASCADE;
ALTER TABLE public.reclutamiento ENABLE ROW LEVEL SECURITY;

-- b) SELECT (admin + karla)
CREATE POLICY reclutamiento_select
  ON public.reclutamiento
  FOR SELECT
  USING (
        auth.jwt() ->> 'role' IN ('admin','karla')
     OR (auth.jwt() ->> 'email')::text ILIKE '%sergio.t@topmarket.com.mx%'
     OR (auth.jwt() ->> 'email')::text ILIKE '%karla.casillas%'
     OR (auth.jwt() ->> 'email')::text ILIKE '%reclutamiento%'
  );

-- c) INSERT
CREATE POLICY reclutamiento_insert
  ON public.reclutamiento
  FOR INSERT
  WITH CHECK (
        auth.jwt() ->> 'role' IN ('admin','karla')
     OR (auth.jwt() ->> 'email')::text ILIKE '%sergio.t@topmarket.com.mx%'
     OR (auth.jwt() ->> 'email')::text ILIKE '%karla.casillas%'
     OR (auth.jwt() ->> 'email')::text ILIKE '%reclutamiento%'
  );

-- d) UPDATE
CREATE POLICY reclutamiento_update
  ON public.reclutamiento
  FOR UPDATE
  USING (
        auth.jwt() ->> 'role' IN ('admin','karla')
     OR (auth.jwt() ->> 'email')::text ILIKE '%sergio.t@topmarket.com.mx%'
     OR (auth.jwt() ->> 'email')::text ILIKE '%karla.casillas%'
     OR (auth.jwt() ->> 'email')::text ILIKE '%reclutamiento%'
  )
  WITH CHECK (
        auth.jwt() ->> 'role' IN ('admin','karla')
     OR (auth.jwt() ->> 'email')::text ILIKE '%sergio.t@topmarket.com.mx%'
     OR (auth.jwt() ->> 'email')::text ILIKE '%karla.casillas%'
     OR (auth.jwt() ->> 'email')::text ILIKE '%reclutamiento%'
  );

-- e) DELETE (solo admin)
CREATE POLICY reclutamiento_delete
  ON public.reclutamiento
  FOR DELETE
  USING (
    (auth.jwt() ->> 'email')::text ILIKE '%sergio.t@topmarket.com.mx%'
  );

-------------------------
-- 2. TABLA pxr_cerrados
-------------------------
ALTER TABLE public.pxr_cerrados DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_pxr_cerrados" ON public.pxr_cerrados CASCADE;
DROP POLICY IF EXISTS "Allow authenticated users to view pxr_cerrados data" ON public.pxr_cerrados CASCADE;
DROP POLICY IF EXISTS "Allow authenticated users to insert pxr_cerrados data" ON public.pxr_cerrados CASCADE;
DROP POLICY IF EXISTS "Allow authenticated users to update pxr_cerrados data" ON public.pxr_cerrados CASCADE;
DROP POLICY IF EXISTS "Allow authenticated users to delete pxr_cerrados data" ON public.pxr_cerrados CASCADE;
ALTER TABLE public.pxr_cerrados ENABLE ROW LEVEL SECURITY;

CREATE POLICY pxr_select
  ON public.pxr_cerrados
  FOR SELECT
  USING (
    (auth.jwt() ->> 'email')::text ILIKE '%sergio.t@topmarket.com.mx%'
    OR (auth.jwt() ->> 'email')::text ILIKE '%rys_cdmx%'
    OR (auth.jwt() ->> 'email')::text ILIKE '%davila%'
  );

CREATE POLICY pxr_insert
  ON public.pxr_cerrados
  FOR INSERT
  WITH CHECK (
    (auth.jwt() ->> 'email')::text ILIKE '%sergio.t@topmarket.com.mx%'
    OR (auth.jwt() ->> 'email')::text ILIKE '%rys_cdmx%'
    OR (auth.jwt() ->> 'email')::text ILIKE '%davila%'
  );

CREATE POLICY pxr_update
  ON public.pxr_cerrados
  FOR UPDATE
  USING (
    (auth.jwt() ->> 'email')::text ILIKE '%sergio.t@topmarket.com.mx%'
    OR (auth.jwt() ->> 'email')::text ILIKE '%rys_cdmx%'
    OR (auth.jwt() ->> 'email')::text ILIKE '%davila%'
  )
  WITH CHECK (
    (auth.jwt() ->> 'email')::text ILIKE '%sergio.t@topmarket.com.mx%'
    OR (auth.jwt() ->> 'email')::text ILIKE '%rys_cdmx%'
    OR (auth.jwt() ->> 'email')::text ILIKE '%davila%'
  );

CREATE POLICY pxr_delete
  ON public.pxr_cerrados
  FOR DELETE
  USING (
    (auth.jwt() ->> 'email')::text ILIKE '%sergio.t@topmarket.com.mx%'
  );

--------------------------------
-- 3. TABLA historial_semanal
--------------------------------
ALTER TABLE public.historial_semanal DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_historial_semanal" ON public.historial_semanal CASCADE;
DROP POLICY IF EXISTS "Allow authenticated users to view historial_semanal data" ON public.historial_semanal CASCADE;
DROP POLICY IF EXISTS "Allow authenticated users to insert historial_semanal data" ON public.historial_semanal CASCADE;
DROP POLICY IF EXISTS "Allow authenticated users to update historial_semanal data" ON public.historial_semanal CASCADE;
DROP POLICY IF EXISTS "Allow authenticated users to delete historial_semanal data" ON public.historial_semanal CASCADE;
ALTER TABLE public.historial_semanal ENABLE ROW LEVEL SECURITY;

-- Acceso general para admin
CREATE POLICY hist_admin_all
  ON public.historial_semanal
  FOR ALL
  USING ((auth.jwt() ->> 'email')::text ILIKE '%sergio.t@topmarket.com.mx%')
  WITH CHECK ((auth.jwt() ->> 'email')::text ILIKE '%sergio.t@topmarket.com.mx%');

-- Acceso limitado para otros usuarios autenticados (solo lectura)
CREATE POLICY hist_authenticated_select
  ON public.historial_semanal
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-----------------------------
-- 4. TABLA ventas_detalle
-----------------------------
ALTER TABLE public.ventas_detalle DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_ventas_detalle" ON public.ventas_detalle CASCADE;
DROP POLICY IF EXISTS "Allow authenticated users to view ventas_detalle data" ON public.ventas_detalle CASCADE;
DROP POLICY IF EXISTS "Allow authenticated users to insert ventas_detalle data" ON public.ventas_detalle CASCADE;
DROP POLICY IF EXISTS "Allow authenticated users to update ventas_detalle data" ON public.ventas_detalle CASCADE;
DROP POLICY IF EXISTS "Allow authenticated users to delete ventas_detalle data" ON public.ventas_detalle CASCADE;
ALTER TABLE public.ventas_detalle ENABLE ROW LEVEL SECURITY;

-- Admin tiene acceso completo
CREATE POLICY ventas_admin_all
  ON public.ventas_detalle
  FOR ALL
  USING ((auth.jwt() ->> 'email')::text ILIKE '%sergio.t@topmarket.com.mx%')
  WITH CHECK ((auth.jwt() ->> 'email')::text ILIKE '%sergio.t@topmarket.com.mx%');

-- Otros usuarios autenticados solo lectura
CREATE POLICY ventas_authenticated_select
  ON public.ventas_detalle
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

------------------------
-- 5. TABLA cobranza
------------------------
ALTER TABLE public.cobranza DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_cobranza" ON public.cobranza CASCADE;
DROP POLICY IF EXISTS "Allow authenticated users to view cobranza data" ON public.cobranza CASCADE;
DROP POLICY IF EXISTS "Allow authenticated users to insert cobranza data" ON public.cobranza CASCADE;
DROP POLICY IF EXISTS "Allow authenticated users to update cobranza data" ON public.cobranza CASCADE;
DROP POLICY IF EXISTS "Allow authenticated users to delete cobranza data" ON public.cobranza CASCADE;
ALTER TABLE public.cobranza ENABLE ROW LEVEL SECURITY;

-- Admin tiene acceso completo
CREATE POLICY cobranza_admin_all
  ON public.cobranza
  FOR ALL
  USING ((auth.jwt() ->> 'email')::text ILIKE '%sergio.t@topmarket.com.mx%')
  WITH CHECK ((auth.jwt() ->> 'email')::text ILIKE '%sergio.t@topmarket.com.mx%');

-- Otros usuarios autenticados solo lectura
CREATE POLICY cobranza_authenticated_select
  ON public.cobranza
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

------------------------
-- 6. TABLA hh_cerrados
------------------------
ALTER TABLE public.hh_cerrados DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_hh_cerrados" ON public.hh_cerrados CASCADE;
DROP POLICY IF EXISTS "Allow authenticated users to view hh_cerrados data" ON public.hh_cerrados CASCADE;
DROP POLICY IF EXISTS "Allow authenticated users to insert hh_cerrados data" ON public.hh_cerrados CASCADE;
DROP POLICY IF EXISTS "Allow authenticated users to update hh_cerrados data" ON public.hh_cerrados CASCADE;
DROP POLICY IF EXISTS "Allow authenticated users to delete hh_cerrados data" ON public.hh_cerrados CASCADE;
ALTER TABLE public.hh_cerrados ENABLE ROW LEVEL SECURITY;

-- Admin tiene acceso completo
CREATE POLICY hh_admin_all
  ON public.hh_cerrados
  FOR ALL
  USING ((auth.jwt() ->> 'email')::text ILIKE '%sergio.t@topmarket.com.mx%')
  WITH CHECK ((auth.jwt() ->> 'email')::text ILIKE '%sergio.t@topmarket.com.mx%');

-- Otros usuarios autenticados solo lectura
CREATE POLICY hh_authenticated_select
  ON public.hh_cerrados
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

COMMIT;


-- Habilitar las extensiones necesarias
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA public;

-- Programar la función para ejecutarse cada viernes a las 14:00 (CDMX)
SELECT cron.schedule(
  'reminder-emails-weekly', -- nombre único para el job
  '0 14 * * 5', -- cada viernes a las 14:00 (formato CRON)
  $$
  SELECT
    net.http_post(
      url:='https://wpsaktihetvpbykawvxl.supabase.co/functions/v1/reminder-emails',
      headers:='{"Authorization": "Bearer CRON", "Content-Type": "application/json"}'::jsonb,
      body:='{}'::jsonb
    ) AS request_id;
  $$
);

-- Ver los trabajos programados
SELECT * FROM cron.job;

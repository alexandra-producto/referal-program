-- SQL para añadir columna start_date a la tabla jobs
-- Esta columna almacenará la fecha de inicio del trabajo

ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS start_date DATE;

-- Comentario para documentar la columna
COMMENT ON COLUMN jobs.start_date IS 'Fecha de inicio esperada para el trabajo';


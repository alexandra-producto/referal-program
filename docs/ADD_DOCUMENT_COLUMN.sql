-- SQL para agregar la columna document_url a la tabla jobs
-- Ejecutar en Supabase SQL Editor

-- Agregar columna document_url (opcional, puede ser NULL)
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS document_url TEXT;

-- Agregar comentario a la columna
COMMENT ON COLUMN jobs.document_url IS 'URL del documento PDF asociado al job, almacenado en Supabase Storage';

-- Opcional: Crear índice si planeas buscar jobs por documento
-- CREATE INDEX IF NOT EXISTS idx_jobs_document_url ON jobs(document_url) WHERE document_url IS NOT NULL;


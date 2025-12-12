-- Migración: Crear tabla short_links para sistema de links cortos en emails
-- Ejecutar en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS short_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  target_url TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB,
  CONSTRAINT unique_code UNIQUE (code)
);

-- Índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_short_links_code ON short_links(code);
CREATE INDEX IF NOT EXISTS idx_short_links_expires_at ON short_links(expires_at);
CREATE INDEX IF NOT EXISTS idx_short_links_used_at ON short_links(used_at) WHERE used_at IS NULL;

-- Comentarios
COMMENT ON TABLE short_links IS 'Tabla para almacenar links cortos que redirigen a URLs largas con tokens';
COMMENT ON COLUMN short_links.code IS 'Código corto único (10-16 caracteres base62)';
COMMENT ON COLUMN short_links.target_url IS 'URL destino completa con token';
COMMENT ON COLUMN short_links.expires_at IS 'Fecha de expiración del link';
COMMENT ON COLUMN short_links.used_at IS 'Fecha de primer uso (NULL si no se ha usado)';
COMMENT ON COLUMN short_links.metadata IS 'Metadatos opcionales (ej: hyperconnector_id, job_id)';


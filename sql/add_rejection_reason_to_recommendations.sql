-- SQL para añadir columna rejection_reason a la tabla recommendations
-- Esta columna almacenará la razón del rechazo cuando el status sea 'rejected'

ALTER TABLE recommendations
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Comentario para documentar la columna
COMMENT ON COLUMN recommendations.rejection_reason IS 'Razón del rechazo proporcionada por el admin o solicitante cuando el status es rejected';


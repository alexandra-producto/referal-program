/**
 * Whitelist de emails autorizados para el rol de admin
 * En producción, esto debería estar en la base de datos o en variables de entorno
 */

const ADMIN_EMAILS = process.env.ADMIN_EMAILS
  ? process.env.ADMIN_EMAILS.split(",").map((email) => email.trim().toLowerCase())
  : [
      // Emails por defecto para desarrollo (puedes agregar más)
      "admin@referal.com",
    ];

/**
 * Verifica si un email está autorizado para ser admin
 */
export function isAdminAuthorized(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

/**
 * Obtiene la lista de emails autorizados
 */
export function getAdminEmails(): string[] {
  return [...ADMIN_EMAILS];
}


/**
 * Simple admin store using localStorage for simulated login
 */

const ADMIN_STORAGE_KEY = 'admin_auth';

export const adminStore = {
  /**
   * Check if admin is logged in
   */
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(ADMIN_STORAGE_KEY) === 'true';
  },

  /**
   * Set admin as logged in
   */
  login(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ADMIN_STORAGE_KEY, 'true');
  },

  /**
   * Clear admin session
   */
  logout(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(ADMIN_STORAGE_KEY);
  },
};


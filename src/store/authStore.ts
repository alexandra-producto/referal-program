/**
 * Simple auth store using localStorage for simulated login
 * In production, this should use proper authentication (JWT, sessions, etc.)
 */

export interface Candidate {
  id: string;
  full_name: string;
  email?: string | null;
  current_company?: string | null;
  current_job_title?: string | null;
}

const AUTH_STORAGE_KEY = 'solicitante_auth';

export const authStore = {
  /**
   * Get the current logged-in candidate
   */
  getCurrentCandidate(): Candidate | null {
    if (typeof window === 'undefined') return null;
    
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) return null;
    
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  },

  /**
   * Set the current logged-in candidate
   */
  setCurrentCandidate(candidate: Candidate): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(candidate));
  },

  /**
   * Clear the current session
   */
  clearSession(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(AUTH_STORAGE_KEY);
  },

  /**
   * Check if user is logged in
   */
  isAuthenticated(): boolean {
    return this.getCurrentCandidate() !== null;
  },
};


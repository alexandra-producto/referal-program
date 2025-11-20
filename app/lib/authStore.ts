/**
 * Auth store using server-side session (JWT cookies)
 * Replaces the simulated login with real LinkedIn OAuth
 */

export interface Candidate {
  id: string;
  full_name: string;
  email?: string | null;
  current_company?: string | null;
  current_job_title?: string | null;
}

export interface Session {
  userId: string;
  role: 'admin' | 'hyperconnector' | 'solicitante';
  candidateId?: string | null;
  hyperconnectorId?: string | null;
  email: string;
  fullName: string;
}

export const authStore = {
  /**
   * Get the current session from the server
   */
  async getSession(): Promise<Session | null> {
    try {
      const response = await fetch('/api/auth/session', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (!data.authenticated) {
        return null;
      }

      return data.user;
    } catch (error) {
      console.error('Error obteniendo sesión:', error);
      return null;
  }
  },

  /**
   * Get the current logged-in candidate (for backward compatibility)
   */
  async getCurrentCandidate(): Promise<Candidate | null> {
    const session = await this.getSession();
    
    if (!session || !session.candidateId) {
      return null;
    }

    // Fetch candidate details from API
    try {
      const response = await fetch(`/api/candidates/${session.candidateId}`);
      if (!response.ok) {
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error('Error obteniendo candidate:', error);
      return null;
    }
  },

  /**
   * Clear the current session (logout)
   */
  async clearSession(): Promise<void> {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Error cerrando sesión:', error);
    }
  },

  /**
   * Check if user is logged in
   */
  async isAuthenticated(): Promise<boolean> {
    const session = await this.getSession();
    return session !== null;
  },
};


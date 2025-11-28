/**
 * Hyperconnector store using server-side session (JWT cookies)
 * Replaces the simulated login with real LinkedIn OAuth
 */

export interface Hyperconnector {
  id: string;
  full_name: string;
  email?: string | null;
  candidate_id?: string | null;
}

export interface Session {
  userId: string;
  role: 'admin' | 'hyperconnector' | 'solicitante';
  candidateId?: string | null;
  hyperconnectorId?: string | null;
  email: string;
  fullName: string;
}

export const hyperconnectorStore = {
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
      if (!data.authenticated || data.user.role !== 'hyperconnector') {
        return null;
      }

      return data.user;
    } catch (error) {
      console.error('Error obteniendo sesión:', error);
      return null;
    }
  },

  /**
   * Get the current logged-in hyperconnector
   */
  async getCurrentHyperconnector(): Promise<Hyperconnector | null> {
    const session = await this.getSession();
    
    if (!session || !session.hyperconnectorId) {
      return null;
    }

    // Fetch hyperconnector details from API
    try {
      const response = await fetch(`/api/hyperconnector/get-jobs?id=${session.hyperconnectorId}`);
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      return {
        id: session.hyperconnectorId,
        full_name: session.fullName,
        email: session.email,
        candidate_id: session.candidateId,
      };
    } catch (error) {
      console.error('Error obteniendo hyperconnector:', error);
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


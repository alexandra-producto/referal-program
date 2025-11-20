import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { UserRole } from "../domain/users";

const SECRET_KEY = process.env.SESSION_SECRET || process.env.RECOMMENDATION_SECRET || "fallback-secret-key-change-in-production";
const secret = new TextEncoder().encode(SECRET_KEY);

export interface SessionData {
  userId: string;
  role: UserRole;
  candidateId?: string | null;
  hyperconnectorId?: string | null;
  email: string;
  fullName: string;
}

/**
 * Crea una sesión JWT y la guarda en una cookie httpOnly
 */
export async function createSession(data: SessionData): Promise<string> {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días

  const token = await new SignJWT({
    userId: data.userId,
    role: data.role,
    candidateId: data.candidateId,
    hyperconnectorId: data.hyperconnectorId,
    email: data.email,
    fullName: data.fullName,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(secret);

  return token;
}

/**
 * Verifica y obtiene los datos de la sesión desde la cookie
 */
export async function getSession(): Promise<SessionData | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    if (!token) {
      return null;
    }

    const { payload } = await jwtVerify(token, secret);
    
    return {
      userId: payload.userId as string,
      role: payload.role as UserRole,
      candidateId: (payload.candidateId as string) || null,
      hyperconnectorId: (payload.hyperconnectorId as string) || null,
      email: payload.email as string,
      fullName: payload.fullName as string,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Obtiene la sesión desde un token string (útil para API routes)
 */
export async function getSessionFromToken(token: string): Promise<SessionData | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    
    return {
      userId: payload.userId as string,
      role: payload.role as UserRole,
      candidateId: (payload.candidateId as string) || null,
      hyperconnectorId: (payload.hyperconnectorId as string) || null,
      email: payload.email as string,
      fullName: payload.fullName as string,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Elimina la sesión (logout)
 */
export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}


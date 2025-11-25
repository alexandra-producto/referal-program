import { supabase } from "../db/supabaseClient";

export type UserRole = "admin" | "hyperconnector" | "solicitante";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  linkedin_id?: string | null;
  linkedin_url?: string | null;
  current_job_title?: string | null;
  current_company?: string | null;
  profile_picture_url?: string | null;
  auth_provider?: string | null;
  provider_user_id?: string | null;
  last_login_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Busca un usuario por LinkedIn ID o email
 */
export async function findUserByLinkedInOrEmail(
  linkedinId?: string,
  email?: string
): Promise<User | null> {
  if (!linkedinId && !email) {
    return null;
  }

  let query = supabase.from("users").select("*");

  if (linkedinId) {
    query = query.eq("linkedin_id", linkedinId);
  } else if (email) {
    query = query.eq("email", email);
  }

  const { data, error } = await query.maybeSingle();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows returned
    throw error;
  }

  return data || null;
}

/**
 * Crea un nuevo usuario
 */
export async function createUser(userData: Partial<User>): Promise<User> {
  const { data, error } = await supabase
    .from("users")
    .insert({
      ...userData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Actualiza un usuario existente
 */
export async function updateUser(id: string, updates: Partial<User>): Promise<User> {
  // Asegurar que los campos null se actualicen correctamente
  const updateData: any = {
    ...updates,
    updated_at: new Date().toISOString(),
  };
  
  // Incluir explícitamente los campos que pueden ser null para que se actualicen
  if ('current_job_title' in updates) {
    updateData.current_job_title = updates.current_job_title ?? null;
  }
  if ('current_company' in updates) {
    updateData.current_company = updates.current_company ?? null;
  }
  if ('linkedin_url' in updates) {
    updateData.linkedin_url = updates.linkedin_url ?? null;
  }
  if ('profile_picture_url' in updates) {
    updateData.profile_picture_url = updates.profile_picture_url ?? null;
  }
  
  console.log("📝 Actualizando usuario:", { id, updateData });
  
  const { data, error } = await supabase
    .from("users")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("❌ Error actualizando usuario:", error);
    throw error;
  }
  
  console.log("✅ Usuario actualizado:", data);
  return data;
}

/**
 * Upsert: crea o actualiza un usuario
 */
export async function upsertUser(userData: Partial<User>): Promise<User> {
  const existing = await findUserByLinkedInOrEmail(
    userData.linkedin_id || undefined,
    userData.email || undefined
  );

  if (existing) {
    return await updateUser(existing.id, userData);
  } else {
    return await createUser(userData);
  }
}

/**
 * Obtiene un usuario por ID
 */
export async function getUserById(id: string): Promise<User | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Actualiza el último login de un usuario
 */
export async function updateLastLogin(userId: string): Promise<void> {
  await supabase
    .from("users")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", userId);
}


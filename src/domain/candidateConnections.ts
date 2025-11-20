import { supabase } from "../db/supabaseClient";

/**
 * Candidate Connections Domain
 * 
 * Maneja las conexiones entre hyperconnectors y candidates
 * con información sobre la fuente y fuerza de la conexión
 */

export interface CandidateConnection {
  id: string;
  hyperconnector_id: string;
  candidate_id: string;
  source: string | null;
  connection_strength: number | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Obtiene todas las conexiones de un hyperconnector
 */
export async function getConnectionsByHyperconnector(hyperconnectorId: string) {
  const { data, error } = await supabase
    .from("candidate_connections")
    .select("*")
    .eq("hyperconnector_id", hyperconnectorId);

  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Obtiene todas las conexiones de un candidate
 */
export async function getConnectionsByCandidate(candidateId: string) {
  const { data, error } = await supabase
    .from("candidate_connections")
    .select("*")
    .eq("candidate_id", candidateId);

  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Obtiene una conexión específica entre un hyperconnector y un candidate
 */
export async function getConnection(
  hyperconnectorId: string,
  candidateId: string
) {
  const { data, error } = await supabase
    .from("candidate_connections")
    .select("*")
    .eq("hyperconnector_id", hyperconnectorId)
    .eq("candidate_id", candidateId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Obtiene una conexión por ID
 */
export async function getConnectionById(id: string) {
  const { data, error } = await supabase
    .from("candidate_connections")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Crea una nueva conexión
 */
export async function createConnection(connection: {
  hyperconnector_id: string;
  candidate_id: string;
  source?: string | null;
  connection_strength?: number | null;
}) {
  const { data, error } = await supabase
    .from("candidate_connections")
    .insert({
      ...connection,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Actualiza una conexión existente
 */
export async function updateConnection(
  id: string,
  updates: {
    source?: string | null;
    connection_strength?: number | null;
  }
) {
  const { data, error } = await supabase
    .from("candidate_connections")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Crea o actualiza una conexión (upsert)
 */
export async function createOrUpdateConnection(connection: {
  hyperconnector_id: string;
  candidate_id: string;
  source?: string | null;
  connection_strength?: number | null;
}) {
  // Primero intentar encontrar la conexión existente
  const existing = await getConnection(
    connection.hyperconnector_id,
    connection.candidate_id
  );

  if (existing) {
    // Actualizar la conexión existente
    return updateConnection(existing.id, {
      source: connection.source,
      connection_strength: connection.connection_strength,
    });
  } else {
    // Crear nueva conexión
    return createConnection(connection);
  }
}

/**
 * Elimina una conexión
 */
export async function deleteConnection(id: string) {
  const { error } = await supabase
    .from("candidate_connections")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
  return true;
}

/**
 * Elimina una conexión por hyperconnector_id y candidate_id
 */
export async function deleteConnectionByIds(
  hyperconnectorId: string,
  candidateId: string
) {
  const { error } = await supabase
    .from("candidate_connections")
    .delete()
    .eq("hyperconnector_id", hyperconnectorId)
    .eq("candidate_id", candidateId);

  if (error) throw new Error(error.message);
  return true;
}

/**
 * Obtiene conexiones filtradas por source
 */
export async function getConnectionsBySource(source: string) {
  const { data, error } = await supabase
    .from("candidate_connections")
    .select("*")
    .eq("source", source);

  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Obtiene conexiones con una fuerza mínima
 */
export async function getConnectionsByMinStrength(
  minStrength: number,
  hyperconnectorId?: string
) {
  let query = supabase
    .from("candidate_connections")
    .select("*")
    .gte("connection_strength", minStrength);

  if (hyperconnectorId) {
    query = query.eq("hyperconnector_id", hyperconnectorId);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Obtiene todas las conexiones con información relacionada
 * (join con hyperconnectors y candidates)
 */
export async function getConnectionsWithDetails(hyperconnectorId?: string) {
  let query = supabase
    .from("candidate_connections")
    .select(`
      *,
      hyperconnectors (
        id,
        full_name,
        email
      ),
      candidates (
        id,
        full_name,
        current_company,
        email
      )
    `);

  if (hyperconnectorId) {
    query = query.eq("hyperconnector_id", hyperconnectorId);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  return data || [];
}


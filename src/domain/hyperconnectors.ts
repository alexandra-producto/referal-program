import { supabase } from "../db/supabaseClient";

export async function getAllHyperconnectors() {
  const { data, error } = await supabase.from("hyperconnectors").select("*");
  if (error) throw error;
  return data;
}

export async function getHyperconnectorById(id: string) {
  const { data, error } = await supabase.from("hyperconnectors").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

export async function createHyperconnector(hci: any) {
  console.log("📝 [createHyperconnector] Creando hyperconnector con datos:", hci);
  const { data, error } = await supabase
    .from("hyperconnectors")
    .insert({
      ...hci,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) {
    console.error("❌ [createHyperconnector] Error creando hyperconnector:", error);
    throw error;
  }

  // Trigger relationship sync (non-blocking)
  if (data?.id) {
    import("../agents/syncHyperconnectorRelationships")
      .then(({ syncHyperconnectorCandidateRelationshipsForHyperconnector }) => {
        syncHyperconnectorCandidateRelationshipsForHyperconnector(data.id).catch((err) => {
          console.error("Error in background relationship sync after hyperconnector creation:", err);
        });
      })
      .catch((err) => {
        console.error("Error loading relationship sync module:", err);
      });
  }

  return data;
}

export async function updateHyperconnector(id: string, updates: any) {
  const { data, error } = await supabase.from("hyperconnectors").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteHyperconnector(id: string) {
  const { error } = await supabase.from("hyperconnectors").delete().eq("id", id);
  if (error) throw error;
  return true;
}

/**
 * Upsert: crea o actualiza un hyperconnector por user_id, email o candidate_id
 */
export async function upsertHyperconnector(hyperconnectorData: {
  user_id?: string;
  email?: string;
  full_name?: string;
  candidate_id?: string;
  linkedin_url?: string | null;
  current_job_title?: string | null;
  current_company?: string | null;
  profile_picture_url?: string | null;
}): Promise<any> {
  console.log("🔍 [upsertHyperconnector] Input:", hyperconnectorData);
  // Normalizar datos mínimos
  if (!hyperconnectorData.email && !hyperconnectorData.user_id && !hyperconnectorData.candidate_id) {
    console.warn("⚠️ [upsertHyperconnector] Llamada sin identificadores suficientes (user_id/email/candidate_id).");
  }

  // Buscar hyperconnector existente
  let existing = null;

  // Prioridad 1: Buscar por user_id (más confiable)
  if (hyperconnectorData.user_id) {
    const { data, error } = await supabase
      .from("hyperconnectors")
      .select("*")
      .eq("user_id", hyperconnectorData.user_id)
      .maybeSingle();
    if (error) {
      console.error("❌ [upsertHyperconnector] Error buscando por user_id:", error);
    }
    existing = data;
  }

  // Prioridad 2: Buscar por email si no se encontró por user_id
  if (!existing && hyperconnectorData.email) {
    const { data, error } = await supabase
      .from("hyperconnectors")
      .select("*")
      .eq("email", hyperconnectorData.email)
      .maybeSingle();
    if (error) {
      console.error("❌ [upsertHyperconnector] Error buscando por email:", error);
    }
    existing = data;
  }

  // Prioridad 3: Buscar por candidate_id si no se encontró por user_id ni email
  if (!existing && hyperconnectorData.candidate_id) {
    const { data, error } = await supabase
      .from("hyperconnectors")
      .select("*")
      .eq("candidate_id", hyperconnectorData.candidate_id)
      .maybeSingle();
    if (error) {
      console.error("❌ [upsertHyperconnector] Error buscando por candidate_id:", error);
    }
    existing = data;
  }

  if (existing) {
    console.log("ℹ️ [upsertHyperconnector] Encontrado existente, actualizando id:", existing.id);
    // Actualizar
    const { data, error } = await supabase
      .from("hyperconnectors")
      .update({
        ...hyperconnectorData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) {
      console.error("❌ [upsertHyperconnector] Error actualizando hyperconnector:", error);
      throw error;
    }
    return data;
  } else {
    console.log("🆕 [upsertHyperconnector] No existe hyperconnector, creando nuevo...");
    // Crear nuevo
    return await createHyperconnector(hyperconnectorData);
  }
}

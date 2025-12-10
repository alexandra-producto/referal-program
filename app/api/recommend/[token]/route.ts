import { NextRequest, NextResponse } from "next/server";
import { resolve } from "path";
import dotenv from "dotenv";
import { validateRecommendationLink } from "@/src/domain/recommendationLinks";
import { getJobById } from "@/src/domain/jobs";
import { getHyperconnectorById } from "@/src/domain/hyperconnectors";
import { getRecommendableCandidatesForHyperconnector } from "@/src/domain/hyperconnectorCandidates";

// Asegurar que las variables de entorno estén cargadas en Next.js
if (!process.env.RECOMMENDATION_SECRET) {
  dotenv.config({ path: resolve(process.cwd(), ".env.local") });
}

/**
 * GET /api/recommend/[token]
 * Obtiene los datos del job y candidatos para un token de recomendación
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    console.log("🔍 Validando token:", token.substring(0, 30) + "...");
    console.log("   Token completo:", token);

    // Validar el token
    const linkData = await validateRecommendationLink(token);
    if (!linkData) {
      console.error("❌ Token inválido o expirado");
      console.error("   Intentando decodificar token para debugging...");
      
      // Intentar decodificar el payload para debugging
      try {
        const parts = token.split(".");
        if (parts.length === 2) {
          const payload = Buffer.from(parts[1], "base64url").toString("utf-8");
          const [hciId, jobId, timestampStr] = payload.split(":");
          const timestamp = parseInt(timestampStr, 10);
          const age = Date.now() - timestamp;
          console.error("   Payload decodificado:", {
            hyperconnectorId: hciId,
            jobId: jobId,
            timestamp: timestamp,
            timestampDate: new Date(timestamp).toISOString(),
            ageDays: Math.floor(age / (24 * 60 * 60 * 1000)),
            currentTime: Date.now(),
            currentDate: new Date().toISOString(),
          });
        }
      } catch (e) {
        console.error("   Error decodificando payload:", e);
      }
      
      return NextResponse.json(
        { error: "Token inválido o expirado" },
        { status: 401 }
      );
    }

    console.log("✅ Token válido, linkData:", linkData);

    // linkData puede tener hyperconnectorId/jobId directamente o en propiedades diferentes
    const hyperconnectorId = linkData.hyperconnectorId || (linkData as any).hyperconnector_id;
    const jobId = linkData.jobId || (linkData as any).job_id;
    
    console.log("📋 IDs extraídos - HCI:", hyperconnectorId, "Job:", jobId);
    
    if (!hyperconnectorId || !jobId) {
      console.error("❌ Faltan datos en el token");
      return NextResponse.json(
        { error: "Token inválido: faltan datos" },
        { status: 401 }
      );
    }

    // Obtener datos del job
    console.log("🔍 Buscando job:", jobId);
    const job = await getJobById(jobId);
    if (!job) {
      console.error("❌ Job no encontrado:", jobId);
      return NextResponse.json(
        { error: "Job no encontrado" },
        { status: 404 }
      );
    }
    console.log("✅ Job encontrado:", job.role_title || job.company_name);

    // Obtener datos del hyperconnector
    console.log("🔍 Buscando hyperconnector:", hyperconnectorId);
    const hci = await getHyperconnectorById(hyperconnectorId);
    if (!hci) {
      console.error("❌ Hyperconnector no encontrado:", hyperconnectorId);
      return NextResponse.json(
        { error: "Hyperconnector no encontrado" },
        { status: 404 }
      );
    }
    console.log("✅ Hyperconnector encontrado:", hci.full_name);

    // Obtener candidatos recomendables
    const candidates = await getRecommendableCandidatesForHyperconnector(
      jobId,
      hyperconnectorId
    );

    // Obtener match scores de job_candidate_matches para cada candidato
    const { supabase } = await import("@/src/db/supabaseClient");
    const candidateIds = candidates.map((c: any) => c.id);
    
    let matchScores: Map<string, number> = new Map();
    if (candidateIds.length > 0) {
      const { data: matches, error: matchesError } = await supabase
        .from("job_candidate_matches")
        .select("candidate_id, match_score")
        .eq("job_id", jobId)
        .in("candidate_id", candidateIds);

      if (!matchesError && matches) {
        matches.forEach((match: any) => {
          matchScores.set(match.candidate_id, match.match_score);
        });
      }
    }

    // Agregar match_score a cada candidato
    const candidatesWithMatch = candidates.map((candidate: any) => ({
      ...candidate,
      match_score: matchScores.get(candidate.id) || null,
    }));

    // Obtener recomendaciones existentes del hyperconnector para este job
    // Para marcar permanentemente los candidatos ya recomendados
    const { data: existingRecommendations } = await supabase
      .from("recommendations")
      .select("candidate_id")
      .eq("job_id", jobId)
      .eq("hyperconnector_id", hyperconnectorId)
      .not("candidate_id", "is", null);

    const alreadyRecommendedCandidateIds = (existingRecommendations || [])
      .map((r: any) => r.candidate_id)
      .filter(Boolean);

    // Obtener información del owner candidate (quien postuló el job)
    let ownerCandidate = null;
    if (job.owner_candidate_id) {
      // Obtener información básica del candidate
      const { data: ownerData, error: ownerError } = await supabase
        .from("candidates")
        .select("id, full_name, current_company, email")
        .eq("id", job.owner_candidate_id)
        .maybeSingle();
      
      if (!ownerError && ownerData) {
        ownerCandidate = ownerData;
        
        // Intentar obtener el título/posición actual del candidate desde candidate_experience
        const { data: experienceData } = await supabase
          .from("candidate_experience")
          .select("title, company_name")
          .eq("candidate_id", job.owner_candidate_id)
          .eq("is_current", true)
          .order("start_date", { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (experienceData) {
          ownerCandidate.current_title = experienceData.title;
          // Si no tiene current_company, usar el de experience
          if (!ownerCandidate.current_company && experienceData.company_name) {
            ownerCandidate.current_company = experienceData.company_name;
          }
        }
      }
    }

    return NextResponse.json({
      job: {
        ...job,
        owner_role: job.owner_role || null, // Incluir owner_role del job
      },
      hyperconnector: hci,
      candidates: candidatesWithMatch,
      ownerCandidate,
      token,
      alreadyRecommendedCandidateIds, // IDs de candidatos ya recomendados por este hyperconnector
    });
  } catch (error: any) {
    console.error("❌ Error en GET /api/recommend/[token]:", error);
    console.error("Stack:", error.stack);
    return NextResponse.json(
      { error: "Error interno del servidor", details: process.env.NODE_ENV === "development" ? error.message : undefined },
      { status: 500 }
    );
  }
}


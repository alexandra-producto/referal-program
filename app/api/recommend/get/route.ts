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
 * GET /api/recommend/get?token=xxx
 * Workaround temporal para rutas dinámicas en Vercel
 * Obtiene los datos del job y candidatos para un token de recomendación
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { error: "Token requerido (query parameter 'token')" },
      { status: 400 }
    );
  }

  try {
    console.log("🔍 Validando token:", token.substring(0, 30) + "...");

    // Validar el token
    const linkData = await validateRecommendationLink(token);
    if (!linkData) {
      console.error("❌ Token inválido o expirado");
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

    // Obtener job
    const job = await getJobById(jobId);
    if (!job) {
      console.error("❌ Job no encontrado:", jobId);
      return NextResponse.json(
        { error: "Job no encontrado" },
        { status: 404 }
      );
    }

    // Obtener hyperconnector
    const hyperconnector = await getHyperconnectorById(hyperconnectorId);
    if (!hyperconnector) {
      console.error("❌ Hyperconnector no encontrado:", hyperconnectorId);
      return NextResponse.json(
        { error: "Hyperconnector no encontrado" },
        { status: 404 }
      );
    }

    // Obtener candidatos recomendables
    const candidates = await getRecommendableCandidatesForHyperconnector(jobId, hyperconnectorId);

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
          if (!ownerCandidate.current_company && experienceData.company_name) {
            ownerCandidate.current_company = experienceData.company_name;
          }
        }
      }
    }

    console.log(`✅ Encontrados ${candidatesWithMatch.length} candidatos recomendables`);

    return NextResponse.json({
      job: {
        ...job,
        owner_role: job.owner_role || null,
      },
      hyperconnector,
      candidates: candidatesWithMatch,
      ownerCandidate,
      token,
      alreadyRecommendedCandidateIds,
    });
  } catch (error: any) {
    console.error("❌ Error en GET /api/recommend/get:", error);
    return NextResponse.json(
      {
        error: "Error al obtener datos de recomendación",
        message: error.message,
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from "next/server";
import { resolve } from "path";
import dotenv from "dotenv";
import { validateRecommendationLink } from "@/src/domain/recommendationLinks";
import { getJobById } from "@/src/domain/jobs";
import { getHyperconnectorById } from "@/src/domain/hyperconnectors";
import { getRecommendableCandidatesForHyperconnector } from "@/src/domain/hyperconnectorCandidates";
import { supabase } from "@/src/db/supabaseClient";

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
    console.log("🔍 [GET /api/recommend/get] Validando token:", token.substring(0, 30) + "...");
    console.log("   Token completo:", token);
    console.log("   RECOMMENDATION_SECRET configurado:", !!process.env.RECOMMENDATION_SECRET);
    console.log("   RECOMMENDATION_SECRET length:", process.env.RECOMMENDATION_SECRET?.length || 0);

    // Validar el token
    const linkData = await validateRecommendationLink(token);
    if (!linkData) {
      console.error("❌ [GET /api/recommend/get] Token inválido o expirado");
      
      // Intentar decodificar para debugging
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
    // NOTA: getRecommendableCandidatesForHyperconnector ya filtra por:
    // - match_score > 60%
    // - match_source != 'auto'
    // Y ya incluye match_score y match_source en cada candidato
    const candidates = await getRecommendableCandidatesForHyperconnector(jobId, hyperconnectorId);

    // Los candidatos ya vienen con match_score y match_source desde getRecommendableCandidatesForHyperconnector
    // No necesitamos hacer una consulta adicional
    const candidatesWithMatch = candidates;

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


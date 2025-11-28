import { NextRequest, NextResponse } from "next/server";
import { getRecommendationsForJob } from "@/src/domain/recommendations";
import { supabase } from "@/src/db/supabaseClient";

/**
 * GET /api/jobs/get-recommendations?jobId=xxx
 * Workaround temporal para rutas dinámicas en Vercel
 * Usa query parameters en lugar de path parameters
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId");

  if (!jobId) {
    return NextResponse.json(
      { error: "Missing 'jobId' query parameter" },
      { status: 400 }
    );
  }

  console.log("🔥 [jobs/get-recommendations] handler ejecutado. jobId:", jobId);

  try {
    const recommendations = await getRecommendationsForJob(jobId);

    if (!recommendations || recommendations.length === 0) {
      return NextResponse.json({ recommendations: [] });
    }

    // Obtener detalles de candidatos e hyperconnectors
    const candidateIds = [...new Set(recommendations.map((r: any) => r.candidate_id))];
    const hyperconnectorIds = [...new Set(recommendations.map((r: any) => r.hyperconnector_id))];

    const { data: candidates, error: candidatesError } = await supabase
      .from("candidates")
      .select("id, full_name, current_company, current_job_title, country, industry, profile_picture_url, linkedin_url")
      .in("id", candidateIds);

    if (candidatesError) {
      console.error("❌ Error obteniendo candidatos:", candidatesError);
    }

    const { data: hyperconnectors, error: hyperconnectorsError } = await supabase
      .from("hyperconnectors")
      .select("id, full_name, current_company, current_job_title, linkedin_url, profile_picture_url")
      .in("id", hyperconnectorIds);

    if (hyperconnectorsError) {
      console.error("❌ Error obteniendo hyperconnectors:", hyperconnectorsError);
    }

    const candidatesMap = new Map((candidates || []).map((c: any) => [c.id, c]));
    const hyperconnectorsMap = new Map((hyperconnectors || []).map((h: any) => [h.id, h]));

    const recommendationsWithDetails = recommendations.map((rec: any) => ({
      ...rec,
      candidate: candidatesMap.get(rec.candidate_id) || null,
      hyperconnector: hyperconnectorsMap.get(rec.hyperconnector_id) || null,
    }));

    return NextResponse.json({ recommendations: recommendationsWithDetails });
  } catch (error: any) {
    console.error("❌ Error fetching recommendations:", error);
    return NextResponse.json(
      {
        error: "Error fetching recommendations",
        message: error.message,
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from "next/server";
import { getJobById } from "@/src/domain/jobs";

/**
 * GET /api/jobs/get?id=xxx
 * Workaround temporal para rutas dinámicas en Vercel
 * Usa query parameters en lugar de path parameters
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Missing 'id' query parameter" },
      { status: 400 }
    );
  }

  console.log("🔥 [jobs/get] handler ejecutado. id:", id);

  try {
    const job = await getJobById(id);

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ job });
  } catch (error: any) {
    console.error("❌ Error fetching job:", error);
    return NextResponse.json(
      {
        error: "Error fetching job",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}


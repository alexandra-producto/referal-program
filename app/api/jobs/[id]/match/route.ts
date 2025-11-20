import { NextRequest, NextResponse } from "next/server";
import { matchJobWithAllCandidates } from "@/src/agents/matchJobCandidate";

/**
 * POST /api/jobs/[id]/match
 * Triggers matching of a job with all existing candidates
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;

    console.log(`🔄 Starting matching for job: ${jobId}`);

    // Run matching asynchronously (don't wait for completion)
    matchJobWithAllCandidates(jobId).catch((error) => {
      console.error(`Error in background matching for job ${jobId}:`, error);
    });

    return NextResponse.json({
      success: true,
      message: "Matching process started",
      jobId,
    });
  } catch (error: any) {
    console.error("Error in POST /api/jobs/[id]/match:", error);
    return NextResponse.json(
      {
        error: "Error starting matching process",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}


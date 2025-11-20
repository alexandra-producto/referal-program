import { NextRequest, NextResponse } from "next/server";
import { matchCandidateWithAllJobs } from "../../../../../src/agents/matchJobCandidate";

/**
 * POST /api/candidates/[id]/match
 * Triggers matching of a candidate with all existing jobs
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: candidateId } = await params;

    console.log(`🔄 Starting matching for candidate: ${candidateId}`);

    // Run matching asynchronously (don't wait for completion)
    matchCandidateWithAllJobs(candidateId).catch((error) => {
      console.error(`Error in background matching for candidate ${candidateId}:`, error);
    });

    return NextResponse.json({
      success: true,
      message: "Matching process started",
      candidateId,
    });
  } catch (error: any) {
    console.error("Error in POST /api/candidates/[id]/match:", error);
    return NextResponse.json(
      {
        error: "Error starting matching process",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}


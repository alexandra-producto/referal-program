import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log("🔥 [jobs/[id]] handler ejecutado. params:", params);

  return NextResponse.json({
    ok: true,
    message: "Dummy handler /api/jobs/[id]",
    params,
  });
}

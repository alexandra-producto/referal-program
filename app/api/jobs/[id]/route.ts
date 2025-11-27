import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log("🔥 [jobs/[id]] handler ejecutado. id:", id);

  return NextResponse.json({
    ok: true,
    message: "Dummy handler /api/jobs/[id]",
    params: { id },
  });
}

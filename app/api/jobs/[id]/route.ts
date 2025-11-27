import { NextRequest, NextResponse } from 'next/server';
import { getJobById } from '@/src/domain/jobs';

/**
 * GET /api/jobs/[id]
 * Obtiene un job por su ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log("🚀 [GET /api/jobs/[id]] Route handler ejecutado");
  try {
    const { id } = await params;
    console.log("📝 [GET /api/jobs/[id]] Params recibidos, id:", id);

    // Ruta de prueba especial
    if (id === "test") {
      return NextResponse.json({
        success: true,
        message: "✅ Ruta dinámica /api/jobs/[id] está funcionando correctamente",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "unknown",
        route: "/api/jobs/[id]",
        params: { id },
        vercel: !!process.env.VERCEL,
        vercelUrl: process.env.VERCEL_URL || "not set",
      });
    }

    const job = await getJobById(id);

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ job });
  } catch (error: any) {
    console.error('❌ Error fetching job:', error);
    return NextResponse.json(
      {
        error: 'Error fetching job',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}


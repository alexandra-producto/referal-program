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
  try {
    const { id } = await params;

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


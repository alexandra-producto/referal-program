import { NextRequest, NextResponse } from 'next/server';
import { getCandidateById } from '../../../../src/domain/candidates';

/**
 * GET /api/candidates/[id]
 * Obtiene un candidate por su ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const candidate = await getCandidateById(id);

    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(candidate);
  } catch (error: any) {
    console.error('❌ Error fetching candidate:', error);
    return NextResponse.json(
      {
        error: 'Error fetching candidate',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}


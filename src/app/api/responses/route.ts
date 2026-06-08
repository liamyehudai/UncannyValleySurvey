import { NextResponse } from 'next/server';
import { getResponses } from '@/lib/responses';

export async function GET() {
  try {
    const responses = await getResponses();
    return NextResponse.json(responses);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to retrieve responses', details: String(error) },
      { status: 500 }
    );
  }
}

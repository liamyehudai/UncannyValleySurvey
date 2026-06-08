import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  const imagesDir = path.join(process.cwd(), 'public', 'images');
  const survey1Path = path.join(process.cwd(), 'data', 'survey1.json');
  
  try {
    const files = await fs.readdir(imagesDir);
    const images = files.filter(f => /\.(svg|png|jpg|jpeg|gif|webp)$/i.test(f));
    
    // Initialize vote counts to 0 for all found images
    const voteCounts: Record<string, number> = {};
    images.forEach(img => {
      voteCounts[img] = 0;
    });

    // Read votes from survey1.json to accumulate counts
    try {
      const rawData = await fs.readFile(survey1Path, 'utf-8');
      const surveyData = JSON.parse(rawData);
      if (Array.isArray(surveyData)) {
        surveyData.forEach((entry: any) => {
          if (entry.image && voteCounts[entry.image] !== undefined) {
            voteCounts[entry.image]++;
          }
        });
      }
    } catch (readError: any) {
      if (readError.code !== 'ENOENT') {
        console.error('[API /api/images] Error reading survey1.json:', readError);
      }
    }

    return NextResponse.json({ images, voteCounts });
  } catch (error) {
    console.error('[API /api/images] Error reading images directory:', error);
    return NextResponse.json({ error: 'Failed to read images directory', details: String(error) }, { status: 500 });
  }
}


import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { addSurvey1Rating } from '@/lib/responses';

export async function GET() {
  const dataPath = path.join(process.cwd(), 'data', 'survey1.json');
  try {
    const rawData = await fs.readFile(dataPath, 'utf-8');
    const data = JSON.parse(rawData);
    
    // Calculate averages
    const stats: Record<string, { total: number; count: number; average: number; ratings: number[] }> = {};
    
    for (const entry of data) {
      if (!stats[entry.image]) {
        stats[entry.image] = { total: 0, count: 0, average: 0, ratings: [] };
      }
      stats[entry.image].total += entry.rating;
      stats[entry.image].count += 1;
      stats[entry.image].ratings.push(entry.rating);
    }
    
    for (const key in stats) {
      stats[key].average = stats[key].total / stats[key].count;
    }
    
    return NextResponse.json({ data, stats });
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return NextResponse.json({ data: [], stats: {} });
    }
    return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { image, rating, sessionId, age } = await request.json();
  const dataDir = path.join(process.cwd(), 'data');
  const dataPath = path.join(dataDir, 'survey1.json');
  
  try {
    await fs.mkdir(dataDir, { recursive: true });
    let data = [];
    try {
      const rawData = await fs.readFile(dataPath, 'utf-8');
      data = JSON.parse(rawData);
    } catch (readError: any) {
      if (readError.code !== 'ENOENT') {
        throw readError;
      }
    }
    
    data.push({ image, rating, timestamp: Date.now(), sessionId: sessionId || null });
    
    await fs.writeFile(dataPath, JSON.stringify(data, null, 2));
    
    // If sessionId is present, also track in responses.json
    if (sessionId) {
      const parsedAge = age !== undefined && age !== null && age !== '' ? Number(age) : null;
      await addSurvey1Rating(sessionId, parsedAge, image, rating);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save data', details: String(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { sessionId } = await request.json();
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // 1. Clear from survey1.json
    const survey1Path = path.join(process.cwd(), 'data', 'survey1.json');
    try {
      const rawSurvey1 = await fs.readFile(survey1Path, 'utf-8');
      let survey1Data = JSON.parse(rawSurvey1);
      survey1Data = survey1Data.filter((item: any) => item.sessionId !== sessionId);
      await fs.writeFile(survey1Path, JSON.stringify(survey1Data, null, 2), 'utf-8');
    } catch (err: any) {
      if (err.code !== 'ENOENT') console.error('Error clearing survey1.json:', err);
    }

    // 2. Clear from responses.json
    const responsesPath = path.join(process.cwd(), 'data', 'responses.json');
    try {
      const rawResponses = await fs.readFile(responsesPath, 'utf-8');
      let responsesData = JSON.parse(rawResponses);
      const session = responsesData.find((r: any) => r.sessionId === sessionId);
      if (session) {
        session.survey1 = [];
        await fs.writeFile(responsesPath, JSON.stringify(responsesData, null, 2), 'utf-8');
      }
    } catch (err: any) {
      if (err.code !== 'ENOENT') console.error('Error clearing responses.json:', err);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to reset ratings', details: String(error) }, { status: 500 });
  }
}



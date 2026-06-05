import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  const dataPath = path.join(process.cwd(), 'data', 'survey2.json');
  try {
    const rawData = await fs.readFile(dataPath, 'utf-8');
    const data = JSON.parse(rawData);
    return NextResponse.json({ data });
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return NextResponse.json({ data: [] });
    }
    return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const dataDir = path.join(process.cwd(), 'data');
  const dataPath = path.join(dataDir, 'survey2.json');
  
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
    
    // Support both old and new formats
    if (body.ranking) {
      data.push({
        question: body.question,
        ranking: body.ranking,
        timestamp: Date.now()
      });
    } else {
      data.push({
        question: body.question,
        chosenImage: body.chosenImage,
        displayedImages: body.displayedImages,
        timestamp: Date.now()
      });
    }
    
    await fs.writeFile(dataPath, JSON.stringify(data, null, 2));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save data', details: String(error) }, { status: 500 });
  }
}


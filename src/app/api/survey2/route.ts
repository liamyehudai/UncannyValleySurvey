import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  const dataPath = path.join(process.cwd(), 'data', 'survey2.json');
  try {
    const rawData = await fs.readFile(dataPath, 'utf-8');
    const data = JSON.parse(rawData);
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { question, chosenImage, displayedImages } = await request.json();
  const dataPath = path.join(process.cwd(), 'data', 'survey2.json');
  
  try {
    const rawData = await fs.readFile(dataPath, 'utf-8');
    const data = JSON.parse(rawData);
    
    data.push({ question, chosenImage, displayedImages, timestamp: Date.now() });
    
    await fs.writeFile(dataPath, JSON.stringify(data, null, 2));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}

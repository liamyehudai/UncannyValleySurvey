import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

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
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { image, rating } = await request.json();
  const dataPath = path.join(process.cwd(), 'data', 'survey1.json');
  
  try {
    const rawData = await fs.readFile(dataPath, 'utf-8');
    const data = JSON.parse(rawData);
    
    data.push({ image, rating, timestamp: Date.now() });
    
    await fs.writeFile(dataPath, JSON.stringify(data, null, 2));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  const imagesDir = path.join(process.cwd(), 'public', 'images');
  console.log(`[API /api/images] Attempting to read directory: ${imagesDir}`);
  try {
    const files = await fs.readdir(imagesDir);
    console.log(`[API /api/images] Successfully read directory. Found ${files.length} files.`);
    // Filter out non-images just in case
    const images = files.filter(f => /\.(svg|png|jpg|jpeg|gif|webp)$/i.test(f));
    console.log(`[API /api/images] Filtered to ${images.length} valid images.`);
    return NextResponse.json({ images });
  } catch (error) {
    console.error('[API /api/images] Error reading images directory:', error);
    return NextResponse.json({ error: 'Failed to read images directory', details: String(error) }, { status: 500 });
  }
}

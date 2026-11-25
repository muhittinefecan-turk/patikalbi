import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export async function GET() {
  const scriptPath = path.join(process.cwd(), 'scripts', 'optimize_3d_blender.py');
  if (!fs.existsSync(scriptPath)) {
    return NextResponse.json({ error: 'Betik bulunamadı.' }, { status: 404 });
  }
  const content = fs.readFileSync(scriptPath, 'utf8');
  return new NextResponse(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/x-python; charset=utf-8',
      'Content-Disposition': 'attachment; filename="optimize_3d_blender.py"',
    },
  });
}

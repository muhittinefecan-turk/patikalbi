import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const sizeParam = Number(req.nextUrl.searchParams.get('size') || '192');
  const size = [180, 192, 512].includes(sizeParam) ? sizeParam : 192;
  const maskable = req.nextUrl.searchParams.get('maskable') === '1';
  const padding = maskable ? Math.round(size * 0.16) : Math.round(size * 0.08);
  const innerSize = size - padding * 2;
  const fontSize = Math.round(innerSize * 0.44);

  return new ImageResponse(
    (
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0F2E3A',
          padding: `${padding}px`,
        }}
      >
        <div
          style={{
            width: `${innerSize}px`,
            height: `${innerSize}px`,
            borderRadius: maskable ? '9999px' : `${Math.round(size * 0.18)}px`,
            backgroundColor: '#C9223F',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontFamily: 'sans-serif',
            fontWeight: 800,
            fontSize: `${fontSize}px`,
            letterSpacing: '-0.04em',
          }}
        >
          PK
        </div>
      </div>
    ),
    { width: size, height: size }
  );
}

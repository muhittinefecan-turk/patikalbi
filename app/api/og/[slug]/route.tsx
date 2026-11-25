import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { getPublicAnimalBySlug } from '@/lib/db';
import { formatAgeTr, formatSexTr, formatSizeTr, formatSpeciesTr } from '@/lib/turkish';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const animal = await getPublicAnimalBySlug(slug);

  const name = animal?.name ?? 'Pati Kalbi';
  const subtitle = animal
    ? `${formatAgeTr(animal.age_months_est)} · ${formatSexTr(animal.sex)} · ${formatSizeTr(animal.size)}`
    : 'Gerze Belediyesi Bakımevi · Sanal Barınak';
  const speciesLabel = animal ? formatSpeciesTr(animal.species) : 'Can Dostları';
  const has3d = animal?.model?.status === 'aktif';
  const district = animal?.shelter
    ? `${animal.shelter.district}, ${animal.shelter.city}`
    : 'Gerze, Sinop';
  const heightText = animal?.shoulder_height_cm
    ? `Omuz: ${animal.shoulder_height_cm} cm`
    : '4:5 Portre';

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          backgroundColor: '#0F2E3A',
          color: '#F0F5F6',
          padding: '48px',
          fontFamily: 'sans-serif',
          justifyContent: 'space-between',
        }}
      >
        {/* Left 4:5 Portrait Frame */}
        <div
          style={{
            width: '416px',
            height: '534px',
            backgroundColor: '#163B4A',
            border: '2px solid rgba(240,245,246,0.18)',
            borderRadius: '4px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '28px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', color: '#A5C2CC' }}>
            <span>{speciesLabel}</span>
            <span>{heightText}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '58px', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.05 }}>
              {name}
            </div>
            <div style={{ fontSize: '20px', color: '#CFE0E6' }}>{district}</div>
          </div>
          <div style={{ fontSize: '18px', color: '#9CB9C4' }}>
            Pati Kalbi · GEFOK Çekim Standardı
          </div>
        </div>

        {/* Right Editorial Manifesto Block */}
        <div
          style={{
            width: '640px',
            height: '534px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            paddingLeft: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                backgroundColor: '#C9223F',
                color: '#FFFFFF',
                padding: '10px 22px',
                borderRadius: '9999px',
                fontSize: '20px',
                fontWeight: 700,
              }}
            >
              SATIN ALMA, SAHİPLEN
            </div>
            {has3d ? (
              <div
                style={{
                  backgroundColor: '#F2B33D',
                  color: '#0F2E3A',
                  padding: '10px 20px',
                  borderRadius: '9999px',
                  fontSize: '20px',
                  fontWeight: 700,
                }}
              >
                3D / Evinde Gör
              </div>
            ) : null}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ fontSize: '64px', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.05 }}>
              {animal ? `${name} yuva arıyor.` : 'Etiketi yok, kalbi var.'}
            </div>
            <div style={{ fontSize: '28px', color: '#D3E3E8', lineHeight: 1.35 }}>
              {subtitle}
            </div>
            <div style={{ fontSize: '22px', color: '#9CB9C4', lineHeight: 1.45 }}>
              {animal?.ideal_home ||
                'Dürüst mizaç kartı, 1:1 gerçek ölçekli 3D inceleme ve ücretsiz ön başvuru.'}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid rgba(240,245,246,0.2)',
              paddingTop: '20px',
              fontSize: '22px',
              color: '#CFE0E6',
            }}
          >
            <span>Pati Kalbi · Sanal Barınak</span>
            <span>Fiyatı 0 TL, değeri ömürlük.</span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}

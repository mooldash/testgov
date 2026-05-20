import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'testgov.kz — подготовка к государственному тестированию';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          color: '#fafafa',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 72,
              height: 72,
              background: '#fafafa',
              color: '#0f172a',
              borderRadius: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 40,
              fontWeight: 700,
              letterSpacing: -1,
            }}
          >
            тг
          </div>
          <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: -0.5 }}>testgov.kz</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: -1.5,
              maxWidth: 920,
            }}
          >
            Подготовка к государственному тестированию РК
          </div>
          <div style={{ fontSize: 28, color: '#cbd5e1', maxWidth: 920 }}>
            Полный набор тестов для госслужбы и правоохранительных органов на казахском и русском.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 24, fontSize: 22, color: '#94a3b8' }}>
          <div>· Реалистичный движок</div>
          <div>· 2 языка</div>
          <div>· История попыток</div>
        </div>
      </div>
    ),
    { ...size }
  );
}

import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const alt = 'AZ Store';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 128,
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontWeight: 'bold',
          letterSpacing: '-2px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
            textAlign: 'center',
          }}
        >
          <h1 style={{ margin: 0, fontSize: '96px' }}>AZ Store</h1>
          <p style={{ margin: 0, fontSize: '36px', opacity: 0.7 }}>
            Moda Argentina Online
          </p>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

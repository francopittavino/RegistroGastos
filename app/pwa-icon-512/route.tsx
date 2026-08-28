import { ImageResponse } from 'next/og';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#10b981',
          color: '#04170f',
          fontSize: 320,
          fontWeight: 700,
          fontFamily: 'sans-serif',
        }}
      >
        $
      </div>
    ),
    { width: 512, height: 512 }
  );
}

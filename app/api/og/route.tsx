import { ImageResponse } from 'next/og'

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: 'center',
          background: 'white',
          color: 'black',
          display: 'flex',
          fontSize: 40,
          height: '100%',
          justifyContent: 'center',
          padding: '50px 200px',
          textAlign: 'center',
          width: '100%',
        }}
      >
        👋 Hello
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  )
}

import { ImageResponse } from 'next/og'

// Route segment config
export const runtime = 'edge'

// Image metadata
export const size = {
    width: 32,
    height: 32,
}
export const contentType = 'image/png'

// Image generation
export default function Icon() {
    return new ImageResponse(
        (
            // ImageResponse JSX element
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', // primary-blue to primary-dark
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: '18px', // Scaled for 32px
                    border: '1.5px solid rgba(255,255,255,0.2)',
                    boxShadow: '0 0 10px rgba(37, 99, 235, 0.2)', // primary-glow
                }}
            >
                ST
            </div>
        ),
        // ImageResponse options
        {
            ...size,
        }
    )
}

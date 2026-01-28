import { ImageResponse } from 'next/og'

// Route segment config
export const runtime = 'edge'

// Image metadata
export const size = {
    width: 180,
    height: 180,
}
export const contentType = 'image/png'

// Image generation
export default function AppleIcon() {
    return new ImageResponse(
        (
            // ImageResponse JSX element
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: '80px', // Scaled for 180px
                    border: '6px solid rgba(255,255,255,0.2)',
                    boxShadow: '0 0 40px rgba(37, 99, 235, 0.4)',
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

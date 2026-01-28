import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Satışını Takip Et !',
        short_name: 'Satış Takip',
        description: 'Müşteri ve Satış Takip Sistemi',
        start_url: '/',
        display: 'standalone',
        background_color: '#000000',
        theme_color: '#2563eb',
        icons: [
            {
                src: '/icon',
                sizes: '32x32',
                type: 'image/png',
            },
            {
                src: '/apple-icon',
                sizes: '180x180',
                type: 'image/png',
            },
        ],
    }
}

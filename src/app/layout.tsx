import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

// Farcaster Mini App embed configuration
const miniAppEmbed = {
  version: "1",
  imageUrl: "https://be59deee7d02.ngrok-free.app/og-image.png",
  button: {
    title: "🍀 Get My Lucky Number",
    action: {
      type: "launch_miniapp",
      name: "Lucky Numbers",
      url: "https://be59deee7d02.ngrok-free.app",
      splashImageUrl: "https://be59deee7d02.ngrok-free.app/splash.png",
      splashBackgroundColor: "#8B5CF6"
    }
  }
}

export const metadata: Metadata = {
  title: 'Lucky Numbers - Farcaster Mini App',
  description: 'Get your daily lucky number based on your Farcaster ID!',
  openGraph: {
    title: 'Lucky Numbers',
    description: 'Get your daily lucky number based on your Farcaster ID!',
    images: ['https://be59deee7d02.ngrok-free.app/og-image.png'],
  },
  other: {
    'fc:miniapp': JSON.stringify(miniAppEmbed),
    'fc:frame': JSON.stringify(miniAppEmbed), // For backward compatibility
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
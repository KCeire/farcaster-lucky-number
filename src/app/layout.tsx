import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

// Farcaster Frame metadata for embeds
export const metadata: Metadata = {
  title: '🍀 Lucky Numbers - Your Daily Fortune',
  description: 'Generate your daily lucky number and share it with friends!',
  openGraph: {
    title: '🍀 Lucky Numbers - Your Daily Fortune',
    description: 'Generate your daily lucky number and share it with friends!',
    images: [
      {
        url: '/og-image.png', 
        width: 1200,
        height: 630,
        alt: 'Lucky Numbers App',
      },
    ],
  },
  other: {
    // Farcaster Frame metadata - this creates the embed
    'fc:frame': JSON.stringify({
      version: "1",
      imageUrl: "https://farcaster-lucky-number.vercel.app/og-image.png",
      button: {
        title: "🍀 Get My Lucky Number",
        action: {
          type: "launch_frame",
          name: "Lucky Numbers",
          splashImageUrl: "https://farcaster-lucky-number.vercel.app/splash.png",
          splashBackgroundColor: "#6200EA"
        }
      }
    }),
    // Also add fc:miniapp for better compatibility
    'fc:miniapp': JSON.stringify({
      version: "1",
      imageUrl: "https://farcaster-lucky-number.vercel.app/og-image.png",
      button: {
        title: "🍀 Get My Lucky Number",
        action: {
          type: "launch_frame",
          name: "Lucky Numbers",
          splashImageUrl: "https://farcaster-lucky-number.vercel.app/splash.png",
          splashBackgroundColor: "#6200EA"
        }
      }
    }),
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://auth.farcaster.xyz" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
} 
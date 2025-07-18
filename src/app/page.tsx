'use client'

import { useEffect, useState } from 'react'
import { Sparkles, RefreshCw, Share2 } from 'lucide-react'
import MiniKitWrapper from './MiniKitWrapper'
import { Metadata } from 'next'

// Add this metadata export for Farcaster Frame support
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
    'fc:frame': 'vNext',
    'fc:frame:image': process.env.NEXT_PUBLIC_URL 
      ? `${process.env.NEXT_PUBLIC_URL}/og-image.png`
      : 'https://farcaster-lucky-number.vercel.app/og-image.png', 
    'fc:frame:button:1': '🍀 Get My Lucky Number',
    'fc:frame:button:1:action': 'link',
    'fc:frame:button:1:target': process.env.NEXT_PUBLIC_URL || 'https://farcaster-lucky-number.vercel.app/', 
    'fc:frame:image:aspect_ratio': '1.91:1',
  },
}

interface User {
  fid: number
  username?: string
  displayName?: string
  pfpUrl?: string
}

type SDKType = 'farcaster' | 'coinbase' | 'demo'

function LuckyNumberAppContent() {
  const [user, setUser] = useState<User | null>(null)
  const [luckyNumber, setLuckyNumber] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sdkType, setSdkType] = useState<SDKType>('demo')
  const [debugLog, setDebugLog] = useState<string[]>([])

  // Add debug logging that's visible on screen
  const addDebugLog = (message: string) => {
    console.log(message)
    setDebugLog(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${message}`])
  }

  // Generate lucky number based on FID and current date
  const generateLuckyNumber = (fid: number): number => {
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth() + 1
    const day = today.getDate()
    
    // Simple algorithm: combine FID with date for daily unique number
    const dateSeed = year + month + day
    const seed = fid + dateSeed
    
    // Generate number between 1-100
    return ((seed * 9301 + 49297) % 233280) % 100 + 1
  }

  const handleGenerateNumber = async () => {
    if (!user) return
    
    setIsGenerating(true)
    // Add small delay for better UX
    setTimeout(() => {
      const number = generateLuckyNumber(user.fid)
      setLuckyNumber(number)
      setIsGenerating(false)
    }, 800)
  }

  // Enhanced sharing function using official SDK for all clients
  const handleShare = async () => {
    if (!luckyNumber || !user) return

    try {
      // Use the official SDK for all clients (recommended by Coinbase Wallet)
      const { sdk } = await import('@farcaster/miniapp-sdk')
      await sdk.actions.composeCast({
        text: `🍀 My lucky number today is ${luckyNumber}! What's yours?`,
        embeds: [window.location.href]
      })
      addDebugLog('Share cast composed successfully')
    } catch (error) {
      console.error('Error sharing:', error)
      if (error instanceof Error && error.name === 'RejectedByUser') {
        setError('Sharing was cancelled')
        addDebugLog('Share cancelled by user')
      } else {
        setError('Error sharing your lucky number')
        addDebugLog(`Share error: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
  }

  const initializeFarcaster = async () => {
    try {
      addDebugLog('Trying Farcaster SDK...')
      const { sdk } = await import('@farcaster/miniapp-sdk')
      
      // Wait for context to be available
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const context = await sdk.context
      addDebugLog(`Context received: ${JSON.stringify(context?.user ? 'User found' : 'No user')}`)
      addDebugLog(`Client FID: ${context?.client?.clientFid || 'unknown'}`)
      
      // Check if this is Coinbase Wallet
      if (context?.client?.clientFid === 309857) {
        addDebugLog('Coinbase Wallet detected - redirecting to Coinbase initialization')
        return false // Let Coinbase Wallet handler take over
      }
      
      if (context && context.user && context.user.fid) {
        addDebugLog(`Farcaster user FID: ${context.user.fid}`)
        setUser(context.user)
        setLuckyNumber(generateLuckyNumber(context.user.fid))
        setSdkType('farcaster')
        await sdk.actions.ready()
        addDebugLog('Farcaster SDK ready() called')
        return true
      }
      addDebugLog('No Farcaster user found')
      return false
    } catch (error) {
      addDebugLog(`Farcaster SDK error: ${error}`)
      return false
    }
  }

  // Enhanced Coinbase Wallet initialization
  const initializeCoinbaseWallet = async () => {
    try {
      addDebugLog('Trying Coinbase Wallet detection...')
      
      if (typeof window !== 'undefined') {
        const { sdk } = await import('@farcaster/miniapp-sdk')
        const context = await sdk.context
        
        addDebugLog(`Client FID: ${context?.client?.clientFid || 'unknown'}`)
        
        // Coinbase Wallet specific detection (clientFid 309857)
        if (context?.client?.clientFid === 309857) {
          addDebugLog('Coinbase Wallet detected via clientFid 309857')
          
          // Use context data for authentication (recommended by Coinbase Wallet)
          if (context.user && context.user.fid) {
            addDebugLog(`Coinbase Wallet user FID: ${context.user.fid}`)
            setUser(context.user)
            setLuckyNumber(generateLuckyNumber(context.user.fid))
            setSdkType('coinbase')
            
            // Call ready() for Coinbase Wallet
            await sdk.actions.ready()
            addDebugLog('Coinbase Wallet ready() called')
            return true
          } else {
            addDebugLog('Coinbase Wallet detected but no user data - creating guest session')
            
            // Create session based on available context (fallback for Coinbase Wallet)
            const guestUser = { 
              fid: Math.floor(Math.random() * 10000) + 900000, // Use high FID range for guests
              username: 'coinbase-guest', 
              displayName: 'Coinbase Wallet User' 
            }
            setUser(guestUser)
            setLuckyNumber(generateLuckyNumber(guestUser.fid))
            setSdkType('coinbase')
            await sdk.actions.ready()
            addDebugLog('Coinbase Wallet guest session created')
            return true
          }
        }
        
        // Fallback user agent detection (keep your existing logic)
        const userAgent = navigator.userAgent
        addDebugLog(`User agent: ${userAgent}`)
        const isCoinbaseWallet = userAgent.includes('CoinbaseWallet') && 
                                !userAgent.includes('Farcaster') &&
                                !window.location.href.includes('farcaster')

        if (isCoinbaseWallet) {
          addDebugLog('Coinbase Wallet detected via user agent (fallback)')
          
          const mockUser = { 
            fid: Math.floor(Math.random() * 10000) + 800000, // Different range for user agent detection
            username: 'coinbase-user', 
            displayName: 'Coinbase Wallet User' 
          }
          setUser(mockUser)
          setLuckyNumber(generateLuckyNumber(mockUser.fid))
          setSdkType('coinbase')
          return true
        }
      }
      
      addDebugLog('No Coinbase Wallet environment detected')
      return false
    } catch (error) {
      addDebugLog(`Coinbase Wallet error: ${error}`)
      return false
    }
  }

  useEffect(() => {
    const initializeApp = async () => {
      try {
        addDebugLog('Starting app initialization...')
        
        // Try Farcaster first (but it will redirect to Coinbase if detected)
        const farcasterSuccess = await initializeFarcaster()
        if (farcasterSuccess) {
          addDebugLog('Farcaster initialization successful')
          setIsLoading(false)
          return
        }

        // Try Coinbase Wallet detection
        const coinbaseSuccess = await initializeCoinbaseWallet()
        if (coinbaseSuccess) {
          addDebugLog('Coinbase Wallet initialization successful')
          setIsLoading(false)
          return
        }

        // Fall back to demo user
        addDebugLog('Falling back to demo user')
        const mockUser = { fid: 123, username: 'demo', displayName: 'Demo User' }
        setUser(mockUser)
        setLuckyNumber(generateLuckyNumber(mockUser.fid))
        setSdkType('demo')
        setIsLoading(false)
      } catch (error) {
        addDebugLog(`Initialization error: ${error}`)
        // Ultimate fallback
        const mockUser = { fid: 123, username: 'demo', displayName: 'Demo User' }
        setUser(mockUser)
        setLuckyNumber(generateLuckyNumber(mockUser.fid))
        setSdkType('demo')
        setIsLoading(false)
      }
    }

    initializeApp()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 flex flex-col items-center justify-center text-white p-4">
        <div className="text-xl mb-4">Loading your lucky number...</div>
        <div className="bg-black/20 p-4 rounded-lg max-w-md w-full">
          <div className="text-sm text-yellow-200 mb-2">Debug Log:</div>
          {debugLog.map((log, index) => (
            <div key={index} className="text-xs text-gray-300 mb-1">{log}</div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 text-white">
      <div className="container mx-auto px-4 py-8 max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <Sparkles className="w-16 h-16 mx-auto text-yellow-300" />
          </div>
          <h1 className="text-3xl font-bold mb-2">🍀 Lucky Numbers</h1>
          <p className="text-purple-100">Your daily dose of fortune!</p>
          {/* Enhanced debug info */}
          <p className="text-purple-200 text-xs mt-2">
            Running via: {
              sdkType === 'farcaster' ? 'Farcaster' : 
              sdkType === 'coinbase' ? 'Coinbase Wallet' : 
              'Demo'
            }
          </p>
        </div>

        {/* Debug Panel */}
        <div className="bg-black/20 p-3 rounded-lg mb-6">
          <div className="text-yellow-200 text-xs mb-2">Latest Debug:</div>
          {debugLog.slice(-3).map((log, index) => (
            <div key={index} className="text-xs text-gray-300 mb-1">{log}</div>
          ))}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-xl p-4 mb-6">
            <p className="text-red-100 text-sm">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="text-red-200 text-xs mt-2 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* User Info */}
        {user && (
          <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              {user.pfpUrl && (
                <img 
                  src={user.pfpUrl} 
                  alt="Profile" 
                  className="w-12 h-12 rounded-full"
                />
              )}
              <div>
                <h2 className="font-semibold">
                  {user.displayName || user.username || `User ${user.fid}`}
                </h2>
                <p className="text-purple-100 text-sm">FID: {user.fid}</p>
              </div>
            </div>
          </div>
        )}

        {/* Lucky Number Display */}
        <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-8 mb-6 text-center">
          <h3 className="text-lg font-medium mb-4">Your Lucky Number Today</h3>
          
          {isGenerating ? (
            <div className="flex items-center justify-center gap-2">
              <RefreshCw className="w-8 h-8 animate-spin" />
              <span className="text-2xl">Generating...</span>
            </div>
          ) : luckyNumber ? (
            <div className="space-y-4">
              <div className="text-6xl font-bold text-yellow-300">
                {luckyNumber}
              </div>
              <p className="text-purple-100">
                This number is uniquely generated for you today!
              </p>
            </div>
          ) : (
            <div className="text-xl text-purple-100">
              Click below to generate your lucky number!
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleGenerateNumber}
            disabled={isGenerating || !user}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-purple-900 font-semibold py-4 px-6 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Generating...' : 'Generate New Number'}
          </button>

          {luckyNumber && (
            <button
              onClick={handleShare}
              className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-lg text-white font-semibold py-4 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Share2 className="w-5 h-5" />
              Share My Lucky Number
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-purple-100 text-sm">
          <p>Numbers change daily • Built with Farcaster + OnchainKit</p>
        </div>
      </div>
    </div>
  )
}

export default function LuckyNumberApp() {
  return (
    <MiniKitWrapper>
      <LuckyNumberAppContent />
    </MiniKitWrapper>
  )
} 
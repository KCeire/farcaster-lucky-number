'use client'

import { useEffect, useState } from 'react'
import { Sparkles, RefreshCw, Share2 } from 'lucide-react'
import MiniKitWrapper from './MiniKitWrapper'

interface User {
  fid: number
  username?: string
  displayName?: string
  pfpUrl?: string
}

type SDKType = 'farcaster' | 'minikit' | 'demo'

function LuckyNumberAppContent() {
  const [user, setUser] = useState<User | null>(null)
  const [luckyNumber, setLuckyNumber] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sdkType, setSdkType] = useState<SDKType>('demo')

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

  const handleShare = async () => {
    if (!luckyNumber || !user) return

    try {
      if (sdkType === 'farcaster') {
        // Use Farcaster SDK
        const { sdk } = await import('@farcaster/miniapp-sdk')
        await sdk.actions.composeCast({
          text: `🍀 My lucky number today is ${luckyNumber}! What's yours?`,
          embeds: [window.location.href]
        })
      } else if (sdkType === 'minikit') {
        // Use MiniKit functionality
        console.log('MiniKit sharing - to be implemented with OnchainKit')
        setError('MiniKit sharing coming soon!')
      } else {
        setError('Sharing is only available in Farcaster or Coinbase Wallet')
      }
    } catch (error) {
      console.error('Error sharing:', error)
      setError('Error sharing your lucky number')
    }
  }

  const initializeFarcaster = async () => {
    try {
      const { sdk } = await import('@farcaster/miniapp-sdk')
      
      // Wait for context to be available
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const context = await sdk.context
      if (context && context.user && context.user.fid) {
        setUser(context.user)
        setLuckyNumber(generateLuckyNumber(context.user.fid))
        setSdkType('farcaster')
        await sdk.actions.ready()
        return true
      }
      return false
    } catch (error) {
      console.error('Farcaster SDK error:', error)
      return false
    }
  }

  const initializeMiniKit = async () => {
    try {
      // Check if we're in Coinbase Wallet using official client FID detection
      if (typeof window !== 'undefined') {
        // Try to get Farcaster context first to check client FID
        try {
          const { sdk } = await import('@farcaster/miniapp-sdk')
          const context = await sdk.context
          
          // Coinbase Wallet returns clientFid 309857
          if (context?.client?.clientFid === 309857) {
            console.log('Coinbase Wallet detected via clientFid')
            
            // Use the actual user data from Coinbase Wallet context
            if (context.user && context.user.fid) {
              setUser(context.user)
              setLuckyNumber(generateLuckyNumber(context.user.fid))
              setSdkType('minikit')
              return true
            }
          }
        } catch (sdkError) {
          console.log('Farcaster SDK not available, trying other detection methods')
        }

        // Fallback to user agent detection
        const userAgent = navigator.userAgent
        const isCoinbaseWallet = userAgent.includes('CoinbaseWallet') && 
                                !userAgent.includes('Farcaster') &&
                                !window.location.href.includes('farcaster')

        if (isCoinbaseWallet) {
          console.log('Coinbase Wallet detected via user agent')
          
          const mockUser = { 
            fid: Math.floor(Math.random() * 10000), 
            username: 'coinbase-user', 
            displayName: 'Coinbase Wallet User' 
          }
          setUser(mockUser)
          setLuckyNumber(generateLuckyNumber(mockUser.fid))
          setSdkType('minikit')
          return true
        }
      }
      return false
    } catch (error) {
      console.error('MiniKit detection error:', error)
      return false
    }
  }

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Try Farcaster first
        const farcasterSuccess = await initializeFarcaster()
        if (farcasterSuccess) {
          setIsLoading(false)
          return
        }

        // Try MiniKit detection
        const minikitSuccess = await initializeMiniKit()
        if (minikitSuccess) {
          setIsLoading(false)
          return
        }

        // Fall back to demo user
        const mockUser = { fid: 123, username: 'demo', displayName: 'Demo User' }
        setUser(mockUser)
        setLuckyNumber(generateLuckyNumber(mockUser.fid))
        setSdkType('demo')
        setIsLoading(false)
      } catch (error) {
        console.error('Error initializing app:', error)
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
      <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
        <div className="text-white text-xl">Loading your lucky number...</div>
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
          {/* Debug info */}
          <p className="text-purple-200 text-xs mt-2">
            Running via: {sdkType === 'farcaster' ? 'Farcaster' : sdkType === 'minikit' ? 'Coinbase Wallet' : 'Demo'}
          </p>
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
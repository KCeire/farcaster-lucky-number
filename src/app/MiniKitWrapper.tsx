'use client'

import { MiniKitProvider } from '@coinbase/onchainkit/minikit'
import { ReactNode } from 'react'

interface MiniKitWrapperProps {
  children: ReactNode
}

// Base chain configuration
const base = {
  id: 8453,
  name: 'Base',
  network: 'base',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    public: { http: ['https://mainnet.base.org'] },
    default: { http: ['https://mainnet.base.org'] },
  },
  blockExplorers: {
    etherscan: { name: 'BaseScan', url: 'https://basescan.org' },
    default: { name: 'BaseScan', url: 'https://basescan.org' },
  },
} as const

export default function MiniKitWrapper({ children }: MiniKitWrapperProps) {
  return (
    <MiniKitProvider
      apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY || 'demo-key'}
      chain={base}
    >
      {children}
    </MiniKitProvider>
  )
} 
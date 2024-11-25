'use client'

import "./journal.css";
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletButton } from '../solana/solana-provider'
import { AppHero, ellipsify } from '../ui/ui-layout'
import { ExplorerLink } from '../cluster/cluster-ui'
import { useJournalProgram } from './journal-data-access'
import { JournalCreate, JournalList } from './journal-ui'

export default function JournalFeature() {
  const { publicKey } = useWallet()
  const { programId } = useJournalProgram()

  return publicKey ? (
    <div className='journal-container'>
      <AppHero
        title="Your Journal"
        subtitle={
          ''
        }
      >
        <JournalCreate />
      </AppHero>
      <JournalList />
    </div>
  ) : (
    <div className="max-w-4xl mx-auto">
      <div className="hero py-[64px]">
        <div className="hero-content text-center">
          <WalletButton />
        </div>
      </div>
    </div>
  )
}

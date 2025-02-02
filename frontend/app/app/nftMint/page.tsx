'use client';

import { DashboardSidebar } from '@/components/DashboardSidebar';
import { RightDashboard } from '@/components/RightDashboard';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Wallet, Share2, Users, Image, Sparkles, ChevronRight } from 'lucide-react';
import { useRouter, usePathname } from "next/navigation";
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useState, useEffect } from 'react';    
import '@solana/wallet-adapter-react-ui/styles.css';

export default function NFTMintPage() {
  const { data: session } = useSession();
  const totalSupply = 144000;
  const mintedCount = 0;
  const mintPrice = 1; // in SOL
  const remainingSupply = totalSupply - mintedCount;
  const [isMinting, setIsMinting] = useState(false);
  const { connection } = useConnection();
  const { publicKey, connected, disconnect } = useWallet();
  const [mounted, setMounted] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  const handleNavigation = (page: string) => {
    router.push(`/app/${page}`);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleMint = async () => {
    if (!publicKey) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      setIsMinting(true);
      // Add Solana minting logic here using @solana/web3.js
      // You'll need to implement actual minting logic with your program
      alert('NFT minted successfully!');
    } catch (error) {
      console.error('Error minting NFT:', error);
      alert('Failed to mint NFT. Please try again.');
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#FAFAFA]">
      <DashboardSidebar 
        activePage="nftMint"
        userName={session?.user?.name || 'Guest'}
        onNavigate={handleNavigation}
        userAvatar={session?.user?.image || ''}
      />
      
      <main className="flex-1 overflow-y-auto">
        <div className="container max-w-8xl mx-auto px-4 py-8">
          {/* Hero Section */}
          <div className="flex flex-col gap-4 mb-12">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-zinc-900 tracking-tight mb-2">SE NFT Collection</h1>
                <p className="text-zinc-500">Proof Of Access</p>
              </div>
              <div className="flex gap-4 items-center">
                <WalletMultiButton className="bg-[#3B35C3] text-white hover:bg-[#3B35C3]/90" />
                {connected && (
                  <Button 
                    className="bg-[#3B35C3] hover:bg-[#2D2A9C] text-white px-6 py-5 rounded-xl shadow-lg shadow-indigo-200 transition-all hover:scale-105"
                    onClick={handleMint}
                  >
                    {isMinting ? 'Minting...' : 'Mint NFT'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Left Column */}
            <div className="space-y-6">
              <Card className="bg-white rounded-2xl shadow-sm border-0 overflow-hidden">
                <CardContent className="p-6">
                  <div className="aspect-square rounded-xl bg-[#F0EFFF] flex items-center justify-center mb-4">
                    <Image className="h-32 w-32 text-[#3B35C3]" />
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500">Price</span>
                      <span className="text-lg font-semibold text-zinc-900">{mintPrice} SOL</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500">Supply</span>
                      <span className="text-lg font-semibold text-zinc-900">{totalSupply}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500">Remaining</span>
                      <span className="text-lg font-semibold text-zinc-900">{remainingSupply}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-[#3B35C3] to-[#5B56D7] p-6 rounded-2xl border-0 text-white">
                <h2 className="text-2xl font-semibold mb-4">Collection Benefits</h2>
                <p className="text-white/90 leading-relaxed mb-4">
                  Each NFT represents your unique lineage and grants exclusive access 
                  to community features and historical records.
                </p>
                <div className="flex items-center gap-2 text-white/80 text-sm">
                  <Sparkles className="h-4 w-4" />
                  <span>Exclusive access to historical archives and community events</span>
                </div>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <Card className="bg-gradient-to-br from-[#F0EFFF] to-white p-6 rounded-2xl border-0">
                <h2 className="text-2xl font-semibold text-zinc-900 mb-4">About This Collection</h2>
                <p className="text-zinc-600 leading-relaxed mb-6">
                  Our NFT collection represents the digital preservation of your family's 
                  heritage. Each token is uniquely generated based on your lineage data 
                  and provides exclusive access to our community features.
                </p>
                <div className="flex items-center justify-between text-sm text-zinc-500 border-t border-zinc-100 pt-4">
                  <span>Current Holders: {mintedCount}</span>
                  <span>Remaining: {remainingSupply}</span>
                </div>
              </Card>

              <div className="grid grid-cols-3 gap-4">
                {/* <Card className="group p-4 rounded-xl border-0 bg-white hover:shadow-md transition-all cursor-pointer">
                  <div className="flex flex-col items-center text-center">
                    <div className="p-3 rounded-full bg-[#F0EFFF] mb-3 group-hover:bg-[#3B35C3] transition-colors">
                      <Wallet className="h-5 w-5 text-[#3B35C3] group-hover:text-white" />
                    </div>
                    <span className="text-sm font-medium text-zinc-900">Connect</span>
                  </div>
                </Card> */}
                <Card className="group p-4 rounded-xl border-0 bg-white hover:shadow-md transition-all cursor-pointer">
                  <div className="flex flex-col items-center text-center">
                    <div className="p-3 rounded-full bg-[#F0EFFF] mb-3 group-hover:bg-[#3B35C3] transition-colors">
                      <Share2 className="h-5 w-5 text-[#3B35C3] group-hover:text-white" />
                    </div>
                    <span className="text-sm font-medium text-zinc-900">Share</span>
                  </div>
                </Card>
                <Card className="group p-4 rounded-xl border-0 bg-white hover:shadow-md transition-all cursor-pointer">
                  <div className="flex flex-col items-center text-center">
                    <div className="p-3 rounded-full bg-[#F0EFFF] mb-3 group-hover:bg-[#3B35C3] transition-colors">
                      <Users className="h-5 w-5 text-[#3B35C3] group-hover:text-white" />
                    </div>
                    <span className="text-sm font-medium text-zinc-900">Invite</span>
                  </div>
                </Card>
              </div>
            </div>
          </div>

          {/* Bottom Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-white rounded-xl border-0 p-6 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-zinc-900">Recent Mints</h3>
                <Button variant="ghost" size="sm" className="text-[#3B35C3]">
                  View All
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#F0EFFF] flex items-center justify-center">
                    <Users className="h-4 w-4 text-[#3B35C3]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-900">Anonymous</p>
                    <p className="text-xs text-zinc-500">Minted #169</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#F0EFFF] flex items-center justify-center">
                    <Users className="h-4 w-4 text-[#3B35C3]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-900">Anonymous</p>
                    <p className="text-xs text-zinc-500">Minted #170</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-white rounded-xl border-0 p-6 hover:shadow-md transition-all">
              <h3 className="text-lg font-semibold text-zinc-900 mb-4">Collection Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 rounded bg-[#F0EFFF]/50">
                  <span className="text-sm text-zinc-600">Total Supply</span>
                  <span className="text-sm font-medium text-[#3B35C3]">{totalSupply}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-[#F0EFFF]/50">
                  <span className="text-sm text-zinc-600">Minted</span>
                  <span className="text-sm font-medium text-[#3B35C3]">{mintedCount}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-[#F0EFFF]/50">
                  <span className="text-sm text-zinc-600">Floor Price</span>
                  <span className="text-sm font-medium text-[#3B35C3]">{mintPrice} SOL</span>
                </div>
              </div>
            </Card>

            <Card className="bg-white rounded-xl border-0 p-6 hover:shadow-md transition-all">
              <h3 className="text-lg font-semibold text-zinc-900 mb-4">NFT Features</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-2 rounded bg-[#F0EFFF]/50">
                  <div className="w-2 h-2 rounded-full bg-[#3B35C3]" />
                  <p className="text-sm text-zinc-600">Unique Lineage Artwork</p>
                </div>
                <div className="flex items-center gap-3 p-2 rounded bg-[#F0EFFF]/50">
                  <div className="w-2 h-2 rounded-full bg-[#3B35C3]" />
                  <p className="text-sm text-zinc-600">Community Access</p>
                </div>
                <div className="flex items-center gap-3 p-2 rounded bg-[#F0EFFF]/50">
                  <div className="w-2 h-2 rounded-full bg-[#3B35C3]" />
                  <p className="text-sm text-zinc-600">Historical Records</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* <RightDashboard
        userName={session?.user?.name || 'Guest'}
        userAvatar={session?.user?.image || ''}
        userRole="Community Member"
        familyMemberCount={0}
        onInvite={() => {}}
        onSendMessage={() => {}}
      /> */}
    </div>
  );
} 
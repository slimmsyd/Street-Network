import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react';
import { WagmiConfig } from 'wagmi';
import { arbitrum, mainnet } from 'viem/chains';

import AuthProvider from '@/components/providers/session-provider';
import NavWrapper from '@/components/nav-wrapper';
import FooterWrapper from '@/components/footer-wrapper';
import { GoogleTagManager } from "@next/third-parties/google";
import SessionWrapper from '@/app/ProvidersWrapper';
import Web3ModalProvider from '@/app/contexts/Web3Modal';
import { validateEnv } from '@/lib/env';

const inter = Inter({ subsets: ['latin'] });

// Validate environment variables
validateEnv();

// 1. Get projectId at https://cloud.walletconnect.com
const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '';

// 2. Create wagmiConfig
const web3Config = {
  name: 'Street Network',
  description: 'Street Network Web3 App',
  url: 'https://web3modal.com',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};

const wagmiConfig = defaultWagmiConfig({
  chains: [mainnet, arbitrum],
  projectId,
  metadata: web3Config
});

// 3. Create modal
createWeb3Modal({
  wagmiConfig,
  projectId,
  defaultChain: mainnet
});

export const metadata: Metadata = {
  title: 'Street Network',
  description: 'Connect with your community',
};

export default function RootLayout({
  children,
}: { 
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <GoogleTagManager gtmId="G-F3F86GSCB4" />
        <SessionWrapper>
          <Web3ModalProvider>
            <WagmiConfig config={wagmiConfig}>
              <AuthProvider>
                <ThemeProvider
                  attribute="class"
                  defaultTheme="dark"
                  enableSystem
                  disableTransitionOnChange
                >
                  <div className="flex min-h-screen flex-col">
                    <NavWrapper />

                    <main className="flex-1">{children}</main>
                  </div>
                </ThemeProvider>
              </AuthProvider>
            </WagmiConfig>
          </Web3ModalProvider>
        </SessionWrapper>
      </body>
    </html>
  );
}
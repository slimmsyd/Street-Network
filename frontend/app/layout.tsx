import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';

import AuthProvider from '@/components/providers/session-provider';
import NavWrapper from '@/components/nav-wrapper';
import FooterWrapper from '@/components/footer-wrapper';
import { GoogleTagManager } from "@next/third-parties/google";
import SessionWrapper from '@/app/ProvidersWrapper';
import Web3ModalProvider from '@/app/contexts/Web3Modal';
import { validateEnv } from '@/lib/env';
const inter = Inter({ subsets: ['latin'] });

// Validate environment variables
if (process.env.NODE_ENV !== 'production') {
  validateEnv();
}

export const metadata: Metadata = {
  title: 'Street Network',
  description: `Street Network showcasing the network of your street.`,
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
          </Web3ModalProvider>
        </SessionWrapper>
      </body>
    </html>
  );
}
"use client";

import React, { ReactNode } from "react";
import { config } from "@/app/configs";
import { createWeb3Modal } from "@web3modal/wagmi/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { State, WagmiProvider } from "wagmi";

const queryClient = new QueryClient();

if (typeof window !== 'undefined') {
  try {
    createWeb3Modal({
      wagmiConfig: config,
      projectId: process.env.NEXT_PUBLIC_PROJECT_ID as string,
      enableAnalytics: true,
      enableOnramp: true,
      themeMode: 'dark',
      defaultChain: config.chains[0],
    });
  } catch (error) {
    console.error('Error initializing Web3Modal:', error);
  }
}

export default function Web3ModalProvider({
  children,
  initialState,
}: {
  children: ReactNode;
  initialState?: State;
}) {
  if (!process.env.NEXT_PUBLIC_PROJECT_ID) {
    console.warn('NEXT_PUBLIC_PROJECT_ID is not set. Web3Modal will not be initialized.');
    return <>{children}</>;
  }

  return (
    <WagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
"use client";

import { createConfig, http, WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { arbitrum } from "wagmi/chains";
import { type ReactNode, useState, useEffect } from "react";
import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";
import sdk, { type Context } from "@farcaster/miniapp-sdk";
import { createContext, useContext } from "react";

export const FrameContext = createContext<Context.MiniAppContext | undefined>(
  undefined,
);

export const config = createConfig({
  chains: [arbitrum],
  connectors: [farcasterMiniApp()],
  transports: {
    [arbitrum.id]: http(),
  },
});

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [context, setContext] = useState<Context.MiniAppContext>();

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      const context = await sdk.context;
      setContext(context);
      if (isMounted) {
        sdk.actions.ready({ disableNativeGestures: true });
      }
    };

    if (sdk) {
      load();
    }

    return () => {
      isMounted = false;
      if (sdk) {
        sdk.removeAllListeners();
      }
    };
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <FrameContext.Provider value={context}>
          {children}
        </FrameContext.Provider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export function useFrameContext() {
  const context = useContext(FrameContext);
  return context;
}

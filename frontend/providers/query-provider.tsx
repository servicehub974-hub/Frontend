"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,        // reuse fetched data for 1 min (fewer refetches)
            gcTime: 5 * 60_000,       // keep in cache 5 min after unused
            refetchOnWindowFocus: false, // don't refetch on every tab focus
            refetchOnReconnect: true,
            retry: 2,
            retryDelay: (n) => Math.min(1000 * 2 ** n, 5000), // recover Render cold starts
          },
        },
      })
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

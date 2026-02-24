import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Router } from "./Router.tsx";
import "../lib/i18n.ts";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000,
      retry: 1,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
    </QueryClientProvider>
  );
}

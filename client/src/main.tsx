import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from "@shared/const";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import "./index.css";
import "./ui-polish.css";
import "./ui-micro.css";
import "./ui-responsive.css";
import "./ui-touch.css";
import "./ui-sportsbook.css";
import "./ui-iranian.css";

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  // Don't force a hard navigation for guest flows; auth is modal-based in this product.
};

const link = httpBatchLink({
  url: "/api/trpc",
  transformer: superjson,
  fetch(input, init) {
    return globalThis.fetch(input, {
      ...(init ?? {}),
      credentials: "include",
    });
  },
});

const trpcClient = trpc.createClient({
  links: [
    ({ next, op }) =>
      next(op).then((result) => {
        if (result instanceof Error || ("error" in result && result.error)) {
          redirectToLoginIfUnauthorized((result as { error?: unknown }).error ?? result);
        }
        return result;
      }),
  ].concat(link as never),
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>,
);

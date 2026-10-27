"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { trpc } from "@/lib/trpc";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Home from "@/pages/Home";
import Matches from "@/pages/Matches";
import Crash from "@/pages/Crash";
import {
  AccountPage,
  AiPage,
  VipPage,
  WalletPage,
} from "@/pages/SupportingPages";
import {
  CasinoPage,
  PromotionsPage,
  RewardsPage,
  TournamentsPage,
} from "@/pages/FeaturePages";
import { TrustCenterPage } from "@/pages/TrustCenter";
import AdminPage from "@/pages/AdminPage";
import { appRoutePaths } from "@shared/routes";
import "@/fonts.css";
import "@/index.css";
import "@/ui-polish.css";
import "@/ui-micro.css";
import "@/ui-responsive.css";
import "@/ui-touch.css";
import "@/ui-sportsbook.css";
import "@/ui-iranian.css";
import "@/ui-brand.css";
import "@/ui-quality.css";
import "@/ui-fa-rtl.css";
import "@/ui-system.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
})

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: '/api/trpc',
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: 'include',
        })
      },
    }),
  ],
})

function Router() {
  return (
    <Switch>
      <Route path={appRoutePaths[0]} component={Home} />
      <Route path={appRoutePaths[1]} component={Matches} />
      <Route path={appRoutePaths[2]} component={WalletPage} />
      <Route path={appRoutePaths[3]} component={AiPage} />
      <Route path={appRoutePaths[4]} component={VipPage} />
      <Route path={appRoutePaths[5]} component={AccountPage} />
      <Route path={appRoutePaths[6]} component={Crash} />
      <Route path={appRoutePaths[7]} component={PromotionsPage} />
      <Route path={appRoutePaths[8]} component={TournamentsPage} />
      <Route path={appRoutePaths[9]} component={RewardsPage} />
      <Route path={appRoutePaths[10]} component={CasinoPage} />
      <Route path="/trust" component={TrustCenterPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function ClientApp() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <ThemeProvider defaultTheme="dark">
            <TooltipProvider>
              <Toaster richColors position="top-center" />
              <Router />
            </TooltipProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

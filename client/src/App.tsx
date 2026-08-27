import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Matches from "./pages/Matches";
import Crash from "./pages/Crash";
import { AccountPage, AiPage, VipPage, WalletPage } from "./pages/SupportingPages";
import { CasinoPage, PromotionsPage, RewardsPage, TournamentsPage } from "./pages/FeaturePages";
import { appRoutePaths } from "@shared/routes";

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
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster richColors position="top-center" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

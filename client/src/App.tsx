import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import OutsideDispute from "./pages/OutsideDispute";
import OwnerReports from "./pages/OwnerReports";
import EmbeddedSearch from "./pages/EmbeddedSearch";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/fora-da-disputa"} component={OutsideDispute} />
      <Route path={"/embed"} component={() => <EmbeddedSearch category="em_disputa" />} />
      <Route path={"/embed/fora-da-disputa"} component={() => <EmbeddedSearch category="fora_da_disputa" />} />
      <Route path={"/gestao/reportes"} component={OwnerReports} />
      <Route path={"/owner/reports"} component={OwnerReports} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
